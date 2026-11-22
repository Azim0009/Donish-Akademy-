import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/authStore';
import { ROLE_HOME } from '@/core/auth/roles';
import { authApi } from '../api/authApi';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, accessToken }) => {
      setSession(user, accessToken);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(from ?? ROLE_HOME[user.role], { replace: true });
    },
  });
}
