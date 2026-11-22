import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type { User } from '@/core/types/models';
import type { LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm } from '../schemas';

interface AuthResult {
  user: User;
  accessToken: string;
}

export const authApi = {
  login: (body: LoginForm) =>
    api.post<ApiResponse<AuthResult>>(ENDPOINTS.auth.login, body).then((r) => r.data.data),

  register: (body: Omit<RegisterForm, 'confirmPassword'>) =>
    api.post<ApiResponse<AuthResult>>(ENDPOINTS.auth.register, body).then((r) => r.data.data),

  forgotPassword: (body: ForgotPasswordForm) => api.post(ENDPOINTS.auth.forgotPassword, body),

  resetPassword: (token: string, body: Omit<ResetPasswordForm, 'confirmPassword'>) =>
    api.post(ENDPOINTS.auth.resetPassword, { token, ...body }),
};
