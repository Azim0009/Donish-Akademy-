import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type { AppNotification } from '@/core/types/models';

// Уведомления нужны и в шапке всех панелей, и на отдельной странице — поэтому они в core
const KEY = ['notifications'] as const;

export const useNotifications = () =>
  useQuery({
    queryKey: KEY,
    queryFn: () =>
      api
        .get<ApiResponse<AppNotification[]>>(ENDPOINTS.notifications.list)
        .then((r) => r.data.data),
  });

export const useUnreadCount = () => {
  const { data } = useNotifications();
  return data?.filter((n) => !n.isRead).length ?? 0;
};

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(ENDPOINTS.notifications.read(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(ENDPOINTS.notifications.readAll),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
