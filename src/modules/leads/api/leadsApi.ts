import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type { Lead, LeadStats } from '@/core/types/models';
import { useAuthStore } from '@/core/auth/authStore';

const E = ENDPOINTS.leads;
const KEY = ['leads'] as const;
const get = <T>(u: string, params?: object) =>
  api.get<ApiResponse<T>>(u, { params }).then((r) => r.data.data);
const data = <T>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);
/** кэш свой у каждого пользователя */
const useUid = () => useAuthStore((s) => s.user?.id ?? 'anon');

export const useLeads = (params: { status?: string; search?: string }) => {
  const uid = useUid();
  return useQuery({
    queryKey: [...KEY, uid, 'list', params],
    queryFn: () => get<Lead[]>(E.list, params),
    placeholderData: keepPreviousData,
  });
};
export const useLeadStats = () => {
  const uid = useUid();
  return useQuery({ queryKey: [...KEY, uid, 'stats'], queryFn: () => get<LeadStats>(E.stats) });
};

const useLeadMutation = <V>(fn: (v: V) => Promise<Lead>) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
};
export const useCreateLead = () =>
  useLeadMutation((b: Pick<Lead, 'name' | 'phone' | 'source' | 'course'> & { comment?: string }) =>
    data<Lead>(api.post(E.list, b)),
  );
export const useUpdateLead = () =>
  useLeadMutation(
    ({
      id,
      ...b
    }: { id: string } & Partial<Pick<Lead, 'status' | 'trialAt' | 'lostReason'>> & {
        takeMe?: boolean;
      }) => data<Lead>(api.patch(E.one(id), b)),
  );
export const useLeadNote = () =>
  useLeadMutation(({ id, ...b }: { id: string; text: string; kind: 'call' | 'note' }) =>
    data<Lead>(api.post(E.notes(id), b)),
  );
