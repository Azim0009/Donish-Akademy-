import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/core/auth/authStore';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

/**
 * Сменился пользователь (вход, выход, вход под другим) — стираем весь кэш.
 * Иначе 30 секунд виден кэш прошлого человека: его уведомления, задачи, списки.
 */
let lastUserId = useAuthStore.getState().user?.id ?? null;
useAuthStore.subscribe((s) => {
  const id = s.user?.id ?? null;
  if (id !== lastUserId) {
    lastUserId = id;
    queryClient.clear();
  }
});
