import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useMessages(matchId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages', matchId],
    queryFn: async () => {
      if (!user || !matchId) throw new Error('Invalid parameters');

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user && !!matchId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ match_id, content }: { match_id: string; content: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onMutate: async ({ match_id, content }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['messages', match_id] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', match_id]);

      // Optimistically update with temporary message
      if (previousMessages && user) {
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          match_id,
          sender_id: user.id,
          content,
          created_at: new Date().toISOString(),
        };

        queryClient.setQueryData<Message[]>(['messages', match_id], [
          ...previousMessages,
          tempMessage,
        ]);
      }

      // Return context with previous messages
      return { previousMessages };
    },
    onSuccess: (data, variables) => {
      // Replace temporary message with real message from server
      queryClient.setQueryData<Message[]>(['messages', variables.match_id], (old) => {
        if (!old) return [data];
        
        // Remove temporary message and add real one
        const filtered = old.filter((msg) => !msg.id.startsWith('temp-'));
        // Check if message already exists (from realtime subscription)
        const exists = filtered.some((msg) => msg.id === data.id);
        if (exists) {
          return filtered;
        }
        // Sort by created_at to ensure correct order
        return [...filtered, data].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous messages on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.match_id], context.previousMessages);
      }
    },
  });
}

