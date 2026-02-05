import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Job } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useJobs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jobs', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Job[];
    },
    enabled: !!user,
  });
}

export function useJob(jobId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!user || !jobId) throw new Error('Invalid parameters');

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('recruiter_id', user.id)
        .single();

      if (error) throw error;
      return data as Job;
    },
    enabled: !!user && !!jobId,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (jobData: Omit<Job, 'id' | 'recruiter_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('jobs')
        .insert({
          ...jobData,
          recruiter_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', user?.id] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...jobData }: Partial<Job> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('jobs')
        .update({
          ...jobData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('recruiter_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', user?.id] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('recruiter_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', user?.id] });
    },
  });
}

