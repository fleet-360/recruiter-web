import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Helper functions to manage lastReadAt in localStorage
const getLastReadAt = (matchId: string): string | null => {
  if (typeof window === 'undefined') return null;
  const key = `lastReadAt:${matchId}`;
  return localStorage.getItem(key);
};

const setLastReadAt = (matchId: string, timestamp: string): void => {
  if (typeof window === 'undefined') return;
  const key = `lastReadAt:${matchId}`;
  localStorage.setItem(key, timestamp);
};

export function useUnreadMessages(matchIds: string[]) {
  const { user } = useAuth();
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  // Calculate unread count for a match based on lastReadAt
  // Unread = messages from others that came after lastReadAt
  const calculateUnreadCount = async (matchId: string): Promise<number> => {
    if (!user) return 0;

    const lastReadAt = getLastReadAt(matchId);
    
    // Get all messages for this match
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (!messages || messages.length === 0) return 0;

    // If no lastReadAt, count all messages from others
    if (!lastReadAt) {
      return messages.filter((msg) => msg.sender_id !== user.id).length;
    }

    // Count messages from others that came after lastReadAt
    return messages.filter(
      (msg) =>
        msg.sender_id !== user.id &&
        msg.created_at > lastReadAt
    ).length;
  };

  // Initialize unread counts for all matches
  useEffect(() => {
    if (!user || matchIds.length === 0) {
      setUnreadCounts(new Map());
      return;
    }

    const fetchUnreadCounts = async () => {
      const counts = new Map<string, number>();
      await Promise.all(
        matchIds.map(async (matchId) => {
          const count = await calculateUnreadCount(matchId);
          counts.set(matchId, count);
        })
      );
      setUnreadCounts(counts);
    };

    fetchUnreadCounts();
  }, [user, matchIds.join(',')]); // Re-fetch when matchIds change

  // Setup realtime subscriptions for all matches
  useEffect(() => {
    if (!user || matchIds.length === 0) {
      // Clean up all subscriptions
      channelsRef.current.forEach((channel) => {
        channel.unsubscribe();
      });
      channelsRef.current.clear();
      return;
    }

    console.log('[UnreadMessages] Setting up subscriptions for matches:', matchIds);

    // Clean up subscriptions for matches that are no longer in the list
    const currentMatchIds = new Set(matchIds);
    channelsRef.current.forEach((channel, matchId) => {
      if (!currentMatchIds.has(matchId)) {
        console.log('[UnreadMessages] Removing subscription for match:', matchId);
        channel.unsubscribe();
        channelsRef.current.delete(matchId);
      }
    });

    // Setup subscriptions for new matches
    matchIds.forEach((matchId) => {
      // Skip if already subscribed
      if (channelsRef.current.has(matchId)) {
        return;
      }

      const channelName = `unread-messages:${matchId}`;
      console.log('[UnreadMessages] Creating subscription for match:', matchId);

      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          },
          async (payload) => {
            const newMessage = payload.new as Message;
            const currentUserId = user?.id;

            console.log('[UnreadMessages] ✅ New message received', {
              messageId: newMessage.id,
              matchId: newMessage.match_id,
              senderId: newMessage.sender_id,
              currentUserId,
            });

            // Only count messages from other users
            if (newMessage.sender_id === currentUserId) {
              // User sent a message, don't change unread count
              return;
            }

            // Get lastReadAt for this match
            // Note: If user is viewing the chat, useRealtimeMessages will update lastReadAt
            // immediately when a message arrives, so we check it here to avoid counting
            const lastReadAt = getLastReadAt(matchId);

            // Only count if message came after lastReadAt (or if no lastReadAt exists)
            if (!lastReadAt || newMessage.created_at > lastReadAt) {
              // Increment unread count for this match
              setUnreadCounts((prev) => {
                const updated = new Map(prev);
                const currentCount = updated.get(matchId) || 0;
                updated.set(matchId, currentCount + 1);
                console.log('[UnreadMessages] Incremented unread count for match:', matchId, 'new count:', currentCount + 1);
                return updated;
              });
            } else {
              console.log('[UnreadMessages] Message is before lastReadAt, not counting', {
                matchId,
                messageId: newMessage.id,
                lastReadAt,
                messageCreatedAt: newMessage.created_at,
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[UnreadMessages] ✅ Subscribed to match:', matchId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[UnreadMessages] ❌ Channel error for match:', matchId);
          }
        });

      channelsRef.current.set(matchId, channel);
    });

    // Cleanup function
    return () => {
      console.log('[UnreadMessages] 🧹 Cleanup - unsubscribing from all channels');
      channelsRef.current.forEach((channel) => {
        channel.unsubscribe();
      });
      channelsRef.current.clear();
    };
  }, [user?.id, matchIds.join(',')]);

  // Function to mark messages as read (when user opens the chat)
  // Sets lastReadAt to now and resets unread count to 0
  const markAsRead = async (matchId: string) => {
    const now = new Date().toISOString();
    setLastReadAt(matchId, now);
    
    setUnreadCounts((prev) => {
      const updated = new Map(prev);
      updated.set(matchId, 0);
      return updated;
    });
    
    console.log('[UnreadMessages] Marked match as read:', matchId, 'lastReadAt:', now);
  };

  // Function to get unread count for a specific match
  const getUnreadCount = (matchId: string): number => {
    return unreadCounts.get(matchId) || 0;
  };

  // Function to get total unread count across all matches
  const getTotalUnreadCount = (): number => {
    let total = 0;
    unreadCounts.forEach((count) => {
      total += count;
    });
    return total;
  };

  return {
    unreadCounts,
    getUnreadCount,
    getTotalUnreadCount,
    markAsRead,
  };
}

