import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type {
  AuditLog,
  Branch,
  BranchFinance,
  BranchStatus,
  CrossRequest,
  CrossRequestStatus,
  Track,
  UserListItem,
} from '@/core/types/models';

const E = ENDPOINTS.superAdmin;
const get = <T>(url: string, params?: object) =>
  api.get<ApiResponse<T>>(url, { params }).then((r) => r.data.data);

// ---------- типы ответов ----------
import type { Period } from '@/shared/lib/period';
export type { Period };
interface Kpi {
  value: number;
  delta: number;
}
export type DashboardBranch = Branch & { revenue: number; revenueDelta: number };
export interface SuperDashboard {
  period: Period;
  kpi: Record<'students' | 'courses' | 'groups' | 'mentors' | 'revenue' | 'requests', Kpi>;
  ranking: BranchFinance[];
  branches: DashboardBranch[];
  audit: AuditLog[];
  requests: CrossRequest[];
  newRequests: number;
  activeBranches: number;
}
export interface FinanceData {
  period: Period;
  total: number;
  previous: number;
  delta: number;
  avgCheck: number;
  paidShare: number;
  debtors: number;
  branches: BranchFinance[];
  daily: { label: string; revenue: number }[];
}
export type NetworkTrack = Track & { branches: { id: string; name: string; students: number }[] };
export interface BranchDetail {
  branch: Branch;
  directors: UserListItem[];
  growth: { label: string; students: number }[];
  audit: AuditLog[];
}
export interface GlobalStats {
  growth: { label: string; students: number }[];
  compare: { name: string; current: number; previous: number }[];
  completion: { name: string; value: number }[];
  totals: { students: number; completion: number; lessonsDone: number; activeWeek: number };
}
export interface GlobalSettings {
  platformName: string;
  defaultLanguage: string;
  registrationOpen: boolean;
  emailVerification: boolean;
  maintenanceMode: boolean;
  passwordMinLength: number;
  sessionDays: number;
  supportEmail: string;
}
export type BranchInput = Pick<
  Branch,
  | 'name'
  | 'code'
  | 'status'
  | 'address'
  | 'phone'
  | 'phone2'
  | 'email'
  | 'timeZone'
  | 'description'
  | 'photoUrl'
  | 'features'
>;

const keys = {
  all: ['super-admin'] as const,
  dashboard: (p: Period) => ['super-admin', 'dashboard', p] as const,
  requests: (p: object) => ['super-admin', 'requests', p] as const,
  finance: (p: Period) => ['super-admin', 'finance', p] as const,
  tracks: ['super-admin', 'tracks'] as const,
  branches: (p: object) => ['super-admin', 'branches', p] as const,
  branch: (id: string) => ['super-admin', 'branch', id] as const,
  directors: (s: string) => ['super-admin', 'directors', s] as const,
  users: (p: object) => ['super-admin', 'users', p] as const,
  stats: ['super-admin', 'stats'] as const,
  audit: (p: object) => ['super-admin', 'audit', p] as const,
  settings: ['super-admin', 'settings'] as const,
};

// ---------- запросы ----------
export const useSuperDashboard = (period: Period) =>
  useQuery({
    queryKey: keys.dashboard(period),
    queryFn: () => get<SuperDashboard>(E.dashboard, { period }),
    placeholderData: keepPreviousData,
  });

export const useCrossRequests = (params: { status?: string; search?: string }) =>
  useQuery({
    queryKey: keys.requests(params),
    queryFn: () => get<CrossRequest[]>(E.requests, params),
    placeholderData: keepPreviousData,
  });

export const useFinance = (period: Period) =>
  useQuery({
    queryKey: keys.finance(period),
    queryFn: () => get<FinanceData>(E.finance, { period }),
    placeholderData: keepPreviousData,
  });

export const useNetworkTracks = () =>
  useQuery({ queryKey: keys.tracks, queryFn: () => get<NetworkTrack[]>(E.tracks) });

export const useBranches = (params: { search?: string; status?: string }) =>
  useQuery({
    queryKey: keys.branches(params),
    queryFn: () => get<Branch[]>(E.branches, params),
    placeholderData: keepPreviousData,
  });

export const useBranch = (id: string) =>
  useQuery({ queryKey: keys.branch(id), queryFn: () => get<BranchDetail>(E.branch(id)) });

export const useBranchDirectors = (search: string) =>
  useQuery({
    queryKey: keys.directors(search),
    queryFn: () => get<UserListItem[]>(E.directors, { search }),
    placeholderData: keepPreviousData,
  });

export const useAllUsers = (params: { search?: string; role?: string; branchId?: string }) =>
  useQuery({
    queryKey: keys.users(params),
    queryFn: () => get<UserListItem[]>(E.users, params),
    placeholderData: keepPreviousData,
  });

export const useSaveAccess = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { roles: string[]; deniedSections: string[] }) =>
      api.patch<ApiResponse<UserListItem>>(E.userAccess(id), body).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin'] }),
  });
};

export const useUpdateUser = (id: string) =>
  useSuperMutation((b: object) =>
    api.patch<ApiResponse<UserListItem>>(E.user(id), b).then((r) => r.data.data),
  );
export const useDeleteUser = (id: string) => useSuperMutation(() => api.delete(E.user(id)));

export const useGlobalStats = () =>
  useQuery({ queryKey: keys.stats, queryFn: () => get<GlobalStats>(E.statistics) });

export const useAuditLogs = (params: { search?: string; action?: string }) =>
  useQuery({
    queryKey: keys.audit(params),
    queryFn: () => get<AuditLog[]>(E.auditLogs, params),
    placeholderData: keepPreviousData,
  });

export const useGlobalSettings = () =>
  useQuery({ queryKey: keys.settings, queryFn: () => get<GlobalSettings>(E.settings) });

// ---------- изменения (после успеха — сбрасываем кэш модуля) ----------
function useSuperMutation<TVars, TRes>(fn: (v: TVars) => Promise<TRes>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export const useCreateBranch = () =>
  useSuperMutation((body: BranchInput) =>
    api.post<ApiResponse<Branch>>(E.branches, body).then((r) => r.data.data),
  );

export const useUpdateBranch = (id: string) =>
  useSuperMutation((body: BranchInput) =>
    api.put<ApiResponse<Branch>>(E.branch(id), body).then((r) => r.data.data),
  );

export const useChangeBranchStatus = (id: string) =>
  useSuperMutation((status: BranchStatus) => api.patch(E.branchStatus(id), { status }));

export const useAssignDirector = () =>
  useSuperMutation(
    ({
      branchId,
      ...body
    }: {
      branchId: string;
      name: string;
      firstName: string;
      lastName: string;
      phone: string;
      phone2?: string;
      passportFront: string;
      passportBack: string;
      login: string;
      password: string;
      roles?: string[];
      deniedSections?: string[];
    }) =>
      api
        .post<ApiResponse<UserListItem>>(E.branchDirectors(branchId), body)
        .then((r) => r.data.data),
  );

export const useSaveSettings = () =>
  useSuperMutation((body: GlobalSettings) => api.put(E.settings, body));

export const useSetRequestStatus = () =>
  useSuperMutation(({ id, status }: { id: string; status: CrossRequestStatus }) =>
    api.patch<ApiResponse<CrossRequest>>(E.requestStatus(id), { status }).then((r) => r.data.data),
  );

export const useToggleTrack = () =>
  useSuperMutation(({ id, isActive }: { id: string; isActive: boolean }) =>
    api.patch<ApiResponse<Track>>(E.track(id), { isActive }).then((r) => r.data.data),
  );
