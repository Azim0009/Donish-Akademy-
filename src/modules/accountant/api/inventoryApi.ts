import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type { InventoryCheck, InventoryItem, InventoryItemInput } from '@/core/types/models';

const E = ENDPOINTS.inventory;

export const useInventory = () =>
  useQuery({
    queryKey: ['inventory'],
    queryFn: () =>
      api
        .get<ApiResponse<{ items: InventoryItem[]; checks: InventoryCheck[] }>>(E.list)
        .then((r) => r.data.data),
  });

function useInvMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export const useSaveItem = () =>
  useInvMutation(({ id, body }: { id?: string; body: InventoryItemInput }) =>
    (id ? api.patch(E.item(id), body) : api.post(E.list, body)).then(
      (r) => (r.data as ApiResponse<InventoryItem>).data,
    ),
  );
export const useFinishCheck = () =>
  useInvMutation((results: Record<string, boolean>) =>
    api.post<ApiResponse<InventoryCheck>>(E.checks, { results }).then((r) => r.data.data),
  );
