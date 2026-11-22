import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type { BranchReport } from '@/core/types/models';

/** Отчёты филиала: директор пишет и отправляет, SuperAdmin принимает или возвращает */
const get = <T>(url: string, params?: object) =>
  api.get<ApiResponse<T>>(url, { params }).then((r) => r.data.data);
const D = ENDPOINTS.director;
const S = ENDPOINTS.superAdmin;
const KEY = ['reports'] as const;

const useReportMutation = <V>(fn: (v: V) => Promise<BranchReport>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => {
      qc.setQueryData([...KEY, 'director', r.id], r);
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
};
const unwrap = (p: Promise<{ data: ApiResponse<BranchReport> }>) => p.then((r) => r.data.data);

// ---------- директор ----------
export const useMyReports = () =>
  useQuery({
    queryKey: [...KEY, 'director', 'list'],
    queryFn: () => get<BranchReport[]>(D.reports),
  });
export const useMyReport = (id: string) =>
  useQuery({ queryKey: [...KEY, 'director', id], queryFn: () => get<BranchReport>(D.report(id)) });
export const useCreateReport = () =>
  useReportMutation((month: string) => unwrap(api.post(D.reports, { month })));
export const useSaveReport = (id: string) =>
  useReportMutation((b: Pick<BranchReport, 'expenses' | 'achievements' | 'problems' | 'plans'>) =>
    unwrap(api.put(D.report(id), b)),
  );
export const useRefreshReport = (id: string) =>
  useReportMutation<void>(() => unwrap(api.post(D.reportRefresh(id))));
export const useSendReport = (id: string) =>
  useReportMutation<void>(() => unwrap(api.post(D.reportSend(id))));

// ---------- SuperAdmin ----------
export interface ReportsInbox {
  reports: BranchReport[];
  missing: { branchId: string; branchName: string; directorName: string | null }[];
  months: string[];
}
export const useReportsInbox = (params: { month?: string; status?: string }) =>
  useQuery({
    queryKey: [...KEY, 'super', params],
    queryFn: () => get<ReportsInbox>(S.reports, params),
    placeholderData: keepPreviousData,
  });
export const useReportForReview = (id: string) =>
  useQuery({
    queryKey: [...KEY, 'super', id],
    queryFn: () => get<{ report: BranchReport; previous: BranchReport | null }>(S.report(id)),
  });
export const useReviewReport = (id: string) =>
  useReportMutation((b: { decision: 'accepted' | 'returned'; comment?: string }) =>
    unwrap(api.post(S.reportReview(id), b)),
  );
