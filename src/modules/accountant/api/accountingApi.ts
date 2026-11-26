import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type { AccountantReport, BranchEmployee, ExpenseEntry } from '@/core/types/models';

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
  useAccMutation((period: { dateFrom: string; dateTo: string }) =>
    data(api.post<ApiResponse<AccountantReport>>(E.reports, period)),
  );
/** в отчёте меняется только комментарий — расходы идут из журнала «Расходы» */
export const useSaveAccountantReport = () =>
  useAccMutation(({ id, ...b }: { id: string; comment: string }) =>
    data(api.put<ApiResponse<AccountantReport>>(E.report(id), b)),
  );

// --- журнал расходов ---
export type ExpenseForm = Pick<
  ExpenseEntry,
  'date' | 'category' | 'amount' | 'description' | 'method' | 'employeeId'
>;
export const useExpenses = () =>
  useQuery({
    queryKey: ['accounting', 'expenses'],
    queryFn: () => data(api.get<ApiResponse<ExpenseEntry[]>>(E.expenses)),
  });
export const useSaveExpense = () =>
  useAccMutation(({ id, ...b }: ExpenseForm & { id?: string }) =>
    data(
      id
        ? api.put<ApiResponse<ExpenseEntry>>(E.expense(id), b)
        : api.post<ApiResponse<ExpenseEntry>>(E.expenses, b),
    ),
  );
export const useDeleteExpense = () =>
  useAccMutation((id: string) => data(api.delete<ApiResponse<{ id: string }>>(E.expense(id))));

/** сотрудники филиала — кого можно добавить в «Зарплаты» */
export const useBranchEmployees = ({ enabled = true } = {}) =>
  useQuery({
    enabled,
    queryKey: ['accounting', 'employees'],
    queryFn: () => data(api.get<ApiResponse<BranchEmployee[]>>(E.employees)),
    staleTime: 5 * 60_000,
  });
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
