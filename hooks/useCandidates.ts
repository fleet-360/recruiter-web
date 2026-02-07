import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useCandidates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['candidates', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get all my jobs
      const { data: myJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('recruiter_id', user.id);

      if (jobsError) throw jobsError;
      if (!myJobs || myJobs.length === 0) return [];

      const jobIds = myJobs.map((j) => j.id);

      // Get existing matches to exclude them
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('job_id, candidate_id')
        .in('job_id', jobIds)
        .eq('recruiter_id', user.id);

      const matchSet = new Set(
        (existingMatches || []).map((m) => `${m.job_id}-${m.candidate_id}`)
      );

      // Get candidates who swiped RIGHT on my jobs
      const { data: swipes, error: swipesError } = await supabase
        .from('swipes')
        .select('candidate_id, job_id, created_at')
        .in('job_id', jobIds)
        .eq('direction', 'right')
        .not('candidate_id', 'is', null);

      if (swipesError) throw swipesError;
      if (!swipes || swipes.length === 0) return [];

      // Filter out swipes that already have matches
      const validSwipes = swipes.filter(
        (swipe) => !matchSet.has(`${swipe.job_id}-${swipe.candidate_id}`)
      );

      if (validSwipes.length === 0) return [];

      // Get unique candidate IDs to fetch their profiles
      const candidateIds = [...new Set(validSwipes.map((s) => s.candidate_id).filter(Boolean))];

      // Fetch candidate profiles
      const { data: candidates, error: candidatesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', candidateIds)
        .eq('role', 'candidate');

      if (candidatesError) throw candidatesError;

      // Create one entry per (candidate, job) combination
      // This way, if a candidate swiped on multiple jobs, they appear multiple times
      const candidatesWithSwipeInfo = validSwipes
        .map((swipe) => {
          const candidate = candidates?.find((c) => c.id === swipe.candidate_id);
          if (!candidate) return null;
          
          return {
            ...candidate,
            swipe_job_id: swipe.job_id,
            swipe_date: swipe.created_at,
            // Add a unique key combining candidate_id and job_id for React rendering
            _uniqueKey: `${candidate.id}-${swipe.job_id}`,
          };
        })
        .filter(Boolean) as (Profile & { swipe_job_id?: string; swipe_date?: string; _uniqueKey?: string })[];

      return candidatesWithSwipeInfo;
    },
    enabled: !!user,
  });
}

export function useCandidate(candidateId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: async () => {
      if (!user || !candidateId) throw new Error('Invalid parameters');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', candidateId)
        .eq('role', 'candidate')
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user && !!candidateId,
  });
}

