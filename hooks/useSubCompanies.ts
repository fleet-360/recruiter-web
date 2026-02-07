import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SubCompany } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useSubCompanies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subCompanies', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sub_companies')
        .select('*')
        .eq('recruiter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubCompany[];
    },
    enabled: !!user,
  });
}

export function useSubCompany(subCompanyId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subCompany', subCompanyId],
    queryFn: async () => {
      if (!user || !subCompanyId) throw new Error('Invalid parameters');

      const { data, error } = await supabase
        .from('sub_companies')
        .select('*')
        .eq('id', subCompanyId)
        .eq('recruiter_id', user.id)
        .single();

      if (error) throw error;
      return data as SubCompany;
    },
    enabled: !!user && !!subCompanyId,
  });
}

export function useCreateSubCompany() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (subCompanyData: Omit<SubCompany, 'id' | 'recruiter_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sub_companies')
        .insert({
          ...subCompanyData,
          recruiter_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SubCompany;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subCompanies', user?.id] });
    },
  });
}

export function useUpdateSubCompany() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...subCompanyData }: Partial<SubCompany> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sub_companies')
        .update({
          ...subCompanyData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('recruiter_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as SubCompany;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subCompanies', user?.id] });
    },
  });
}

export function useDeleteSubCompany() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (subCompanyId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('sub_companies')
        .delete()
        .eq('id', subCompanyId)
        .eq('recruiter_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subCompanies', user?.id] });
    },
  });
}

