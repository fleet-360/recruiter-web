import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Match, Job, Profile } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export interface MatchWithDetails extends Match {
  job?: Job;
  candidate?: Profile;
}

export function useMatches() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['matches', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('recruiter_id', user.id)
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

      if (!matches || matches.length === 0) return [];

      // Fetch job and candidate details for each match
      const matchesWithDetails = await Promise.all(
        matches.map(async (match) => {
          const [jobResult, candidateResult] = await Promise.all([
            supabase.from('jobs').select('*').eq('id', match.job_id).single(),
            supabase.from('profiles').select('*').eq('id', match.candidate_id).single(),
          ]);

          return {
            ...match,
            job: jobResult.data as Job | undefined,
            candidate: candidateResult.data as Profile | undefined,
          };
        })
      );

      return matchesWithDetails as MatchWithDetails[];
    },
    enabled: !!user,
  });
}

export function useMatch(matchId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      if (!user || !matchId) throw new Error('Invalid parameters');

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .eq('recruiter_id', user.id)
        .single();

      if (matchError) throw matchError;

      const [jobResult, candidateResult] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', match.job_id).single(),
        supabase.from('profiles').select('*').eq('id', match.candidate_id).single(),
      ]);

      return {
        ...match,
        job: jobResult.data as Job | undefined,
        candidate: candidateResult.data as Profile | undefined,
      } as MatchWithDetails;
    },
    enabled: !!user && !!matchId,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ candidate_id, job_id }: { candidate_id: string; job_id: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Check if match already exists
      const { data: existing } = await supabase
        .from('matches')
        .select('id')
        .eq('job_id', job_id)
        .eq('candidate_id', candidate_id)
        .single();

      if (existing) {
        throw new Error('Match already exists');
      }

      const { data, error } = await supabase
        .from('matches')
        .insert({
          job_id,
          candidate_id,
          recruiter_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Match;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['candidates', user?.id] });
    },
  });
}

