import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/authStore';
import type { Role } from '@/core/auth/roles';
import { userRoles } from '@/core/auth/access';
import { PATHS } from '@/core/config/paths';

interface Props {
  roles: Role[];
  children: ReactNode;
}

/**
 * Пускает только авторизованных пользователей с нужной ролью.
 * ВАЖНО: это только удобство UI. Настоящую проверку прав делает backend.
 */
export function RequireRole({ roles, children }: Props) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) return <Navigate to={PATHS.login} replace state={{ from: location }} />;
  // мульти-роль: достаточно, чтобы у пользователя была хотя бы одна из нужных ролей
  if (!userRoles(user).some((r) => roles.includes(r))) return <Navigate to={PATHS.forbidden} replace />;
  return <>{children}</>;
}
