import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types/database';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Helper function to update lastReadAt when user is viewing the chat
const updateLastReadAt = (matchId: string): void => {
  if (typeof window === 'undefined') return;
  const now = new Date().toISOString();
  const key = `lastReadAt:${matchId}`;
  localStorage.setItem(key, now);
};

export function useRealtimeMessages(matchId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const matchIdRef = useRef<string | null>(null);

  // Update ref when matchId changes
  useEffect(() => {
    matchIdRef.current = matchId;
  }, [matchId]);

  useEffect(() => {
    if (!matchId) {
      console.log('[Realtime] No matchId, skipping subscription');
      return;
    }

    console.log('[Realtime] Setting up subscription for matchId:', matchId);

    // Clean up any existing subscription before creating a new one
    if (channelRef.current) {
      console.log('[Realtime] Cleaning up existing channel');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    const currentMatchId = matchId;
    const channelName = `messages:${currentMatchId}`;

    // Create channel with proper configuration
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
          filter: `match_id=eq.${currentMatchId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          const activeMatchId = matchIdRef.current;

          console.log('[Realtime] ✅ New message received', {
            messageId: newMessage.id,
            matchId: newMessage.match_id,
            senderId: newMessage.sender_id,
            currentMatchId: activeMatchId,
            currentUserId: user?.id,
          });

          // Verify the message belongs to the current chat room
          if (newMessage.match_id !== activeMatchId) {
            console.warn('[Realtime] ⚠️ Received message for different match_id, ignoring', {
              receivedMatchId: newMessage.match_id,
              currentMatchId: activeMatchId,
            });
            return;
          }

          // Don't add messages sent by the current user (they're already added via optimistic update)
          if (newMessage.sender_id === user?.id) {
            console.log('[Realtime] Message from current user, skipping (already in state)');
            return;
          }

          // User is viewing this chat, mark message as read immediately
          // This updates lastReadAt so the unread count stays at 0
          updateLastReadAt(currentMatchId);
          console.log('[Realtime] User is viewing chat, marking message as read', {
            matchId: currentMatchId,
            messageId: newMessage.id,
          });

          // Update query cache
          queryClient.setQueryData(['messages', currentMatchId], (old: Message[] | undefined) => {
            if (!old) return [newMessage];
            
            // Check if message already exists to avoid duplicates
            if (old.some((m) => m.id === newMessage.id)) {
              console.log('[Realtime] Message already exists in cache, skipping duplicate');
              return old;
            }

            console.log('[Realtime] ✅ Adding new message to cache', {
              messageId: newMessage.id,
              prevCount: old.length,
              newCount: old.length + 1,
            });

            // Append new message and sort by created_at to ensure correct order
            const updated = [...old, newMessage].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] 🔔 Subscription status changed', {
          status,
          matchId: currentMatchId,
          channelName,
          timestamp: new Date().toISOString(),
        });

        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ Successfully subscribed to Realtime channel', {
            matchId: currentMatchId,
            channelName,
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] ❌ Channel error occurred', {
            matchId: currentMatchId,
            status,
            channelName,
          });
        } else if (status === 'TIMED_OUT') {
          console.warn('[Realtime] ⚠️ Subscription timed out', {
            matchId: currentMatchId,
            status,
            channelName,
          });
        } else if (status === 'CLOSED') {
          console.log('[Realtime] 🔴 Channel closed', {
            matchId: currentMatchId,
            channelName,
          });
        }
      });

    // Store channel reference for cleanup
    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('[Realtime] 🧹 Cleanup - unsubscribing from channel', {
        matchId: currentMatchId,
        channelName,
      });
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        } catch (error) {
          console.error('[Realtime] Error during channel cleanup:', error);
        }
      }
    };
  }, [matchId, queryClient, user?.id]);
}

