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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.match_id] });
    },
  });
}

