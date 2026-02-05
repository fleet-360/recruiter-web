import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types/database';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeMessages(matchId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          queryClient.setQueryData(['messages', matchId], (old: Message[] | undefined) => {
            if (!old) return [newMessage];
            // Check if message already exists
            if (old.some((m) => m.id === newMessage.id)) return old;
            return [...old, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, queryClient]);
}

