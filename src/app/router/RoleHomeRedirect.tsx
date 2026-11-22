import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/authStore';
import { ROLE_HOME } from '@/core/auth/roles';
import { PATHS } from '@/core/config/paths';

/** /app → домашняя страница панели текущей роли */
export function RoleHomeRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to={PATHS.login} replace />;
  return <Navigate to={ROLE_HOME[user.role]} replace />;
}
