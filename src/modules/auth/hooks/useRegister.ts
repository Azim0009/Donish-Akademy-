import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/authStore';
import { ROLE_HOME } from '@/core/auth/roles';
import { authApi } from '../api/authApi';

/** Регистрация доступна только ученикам. Директоров, менторов и сотрудников создают через панели. */
export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user, accessToken }) => {
      setSession(user, accessToken);
      navigate(ROLE_HOME[user.role], { replace: true });
    },
  });
}
