import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/authStore';
import { ROLE_HOME } from '@/core/auth/roles';

/** Страницы входа/регистрации: если уже вошёл — отправляем в свою панель */
export function GuestOnly({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}
