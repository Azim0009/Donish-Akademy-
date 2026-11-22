import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/core/types/models';

interface AuthState {
  user: User | null;
  /** access-токен живёт ТОЛЬКО в памяти (не в localStorage) */
  accessToken: string | null;
  setSession: (user: User, accessToken: string) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setSession: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'donish-auth',
      storage: createJSONStorage(() => sessionStorage),
      // Сохраняем только профиль, токен — никогда. После перезагрузки токен
      // восстанавливается через /auth/refresh (refresh-токен в httpOnly cookie).
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
