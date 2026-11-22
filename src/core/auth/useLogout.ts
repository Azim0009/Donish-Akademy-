import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import { useAuthStore } from './authStore';

/** Выход: сообщаем backend (он отзывает refresh-токен), чистим сессию и весь кэш запросов */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return async () => {
    try {
      await api.post(ENDPOINTS.auth.logout);
    } finally {
      logout();
      queryClient.clear();
    }
  };
}
