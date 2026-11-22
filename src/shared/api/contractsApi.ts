import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type { Contract, ContractTemplate } from '@/core/types/models';

/** Договоры: суперадмин видит все, директор — свой филиал */
export type ContractsScope = 'superAdmin' | 'director';

const get = <T>(url: string, params?: object) =>
  api.get<ApiResponse<T>>(url, { params }).then((r) => r.data.data);

export const useContractTemplates = (scope: ContractsScope, enabled = true) =>
  useQuery({
    queryKey: ['contracts', scope, 'templates'],
    queryFn: () => get<ContractTemplate[]>(ENDPOINTS[scope].contractTemplates),
    enabled,
  });

export const useContracts = (scope: ContractsScope, params: { search?: string; role?: string }) =>
  useQuery({
    queryKey: ['contracts', scope, 'list', params],
    queryFn: () => get<Contract[]>(ENDPOINTS[scope].contracts, params),
    placeholderData: keepPreviousData,
  });

export const useSaveTemplate = (scope: ContractsScope) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; title: string; body: string }) =>
      api
        .put<ApiResponse<ContractTemplate>>(ENDPOINTS[scope].contractTemplate(id), body)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
};

/** После создания сотрудника — обновить список договоров */
export const useInvalidateContracts = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['contracts'] });
};
