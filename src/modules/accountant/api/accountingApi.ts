import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type { AccountantReport, ReportExpense } from '@/core/types/models';

const E = ENDPOINTS.accounting;
const data = <T>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);

function useAccMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting'] }),
  });
}

// --- бухгалтер ---
export const useAccountantReports = () =>
  useQuery({
    queryKey: ['accounting', 'mine'],
    queryFn: () => data(api.get<ApiResponse<AccountantReport[]>>(E.reports)),
  });
export const useCreateAccountantReport = () =>
  useAccMutation((month: string) =>
    data(api.post<ApiResponse<AccountantReport>>(E.reports, { month })),
  );
export const useSaveAccountantReport = () =>
  useAccMutation(({ id, ...b }: { id: string; expenses: ReportExpense[]; comment: string }) =>
    data(api.put<ApiResponse<AccountantReport>>(E.report(id), b)),
  );
export const useSendAccountantReport = () =>
  useAccMutation((id: string) => data(api.post<ApiResponse<AccountantReport>>(E.send(id))));

// --- директор ---
export const useDirectorAccountantReports = () =>
  useQuery({
    queryKey: ['accounting', 'director'],
    queryFn: () => data(api.get<ApiResponse<AccountantReport[]>>(E.directorList)),
  });
export const useReviewAccountantReport = () =>
  useAccMutation(({ id, ...b }: { id: string; accept: boolean; comment: string }) =>
    data(api.post<ApiResponse<AccountantReport>>(E.review(id), b)),
  );
