import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PATHS } from '@/core/config/paths';
import { GuestOnly } from '@/app/router/guards/GuestOnly';
import { AuthLayout } from '@/shared/layouts/AuthLayout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

export const authRoutes: RouteObject = {
  element: (
    <GuestOnly>
      <AuthLayout />
    </GuestOnly>
  ),
  children: [
    { path: PATHS.login, element: <LoginPage /> },
    { path: PATHS.register, element: <RegisterPage /> },
    { path: PATHS.forgotPassword, element: <ForgotPasswordPage /> },
    { path: PATHS.resetPassword, element: <ResetPasswordPage /> },
  ],
};
