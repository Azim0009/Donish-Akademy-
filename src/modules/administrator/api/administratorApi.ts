import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type {
  Lead,
  Payment,
  PaymentMethod,
  PaymentsMonth,
  UserListItem,
} from '@/core/types/models';

const E = ENDPOINTS.administrator;
const get = <T>(url: string, params?: object) =>
  api.get<ApiResponse<T>>(url, { params }).then((r) => r.data.data);

export interface TodayGroup {
  id: string;
  name: string;
  mentorName: string | null;
  time: string;
  studentsCount: number;
  capacity: number;
}
export interface AdministratorDashboard {
  studentsCount: number;
  activeCount: number;
  groupsCount: number;
  freeSeats: number;
  today: TodayGroup[];
  recent: UserListItem[];
}

export const useAdministratorDashboard = () =>
  useQuery({
    queryKey: ['administrator', 'dashboard'],
    queryFn: () => get<AdministratorDashboard>(E.dashboard),
  });

export const useAdministratorStudents = (params: { search: string; groupId: string }) =>
  useQuery({
    queryKey: ['administrator', 'students', params],
    queryFn: () => get<UserListItem[]>(E.students, params),
    placeholderData: keepPreviousData,
  });

// ---------- ученики: создать, новый пароль ----------
const useAdminMutation = <V, R>(fn: (v: V) => Promise<R>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administrator'] }),
  });
};
const post = <T>(u: string, b: object) => api.post<ApiResponse<T>>(u, b).then((r) => r.data.data);

export const useCreateStudent = () =>
  useAdminMutation(
    (b: { name: string; phone: string; groupId?: string; password: string; leadId?: string }) =>
      post<UserListItem>(E.students, b),
  );
export const useResetStudentPassword = () =>
  useAdminMutation(({ id, password }: { id: string; password: string }) =>
    post<UserListItem>(E.studentPassword(id), { password }),
  );

/** Записались через отдел продаж, аккаунта ещё нет */
export const useWonLeads = () =>
  useQuery({ queryKey: ['administrator', 'won-leads'], queryFn: () => get<Lead[]>(E.wonLeads) });

// ---------- оплаты ----------
export const usePayments = (month: string) =>
  useQuery({
    queryKey: ['administrator', 'payments', month],
    queryFn: () => get<PaymentsMonth>(E.payments, { month }),
    placeholderData: keepPreviousData,
  });
export const useAcceptPayment = () =>
  useAdminMutation(
    (b: {
      studentId: string;
      month: string;
      amount: number;
      method: PaymentMethod;
      note?: string;
      checkPhoto?: string | null;
    }) => post<Payment>(E.payments, b),
  );
