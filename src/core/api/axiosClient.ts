import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/core/config/env';
import { useAuthStore } from '@/core/auth/authStore';
import { ENDPOINTS } from './endpoints';
import type { ApiResponse } from './types';

export const api = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true, // refresh-токен в httpOnly cookie
});

// 1) Добавляем access-токен в каждый запрос
api.interceptors.request.use((config) => {
  const { accessToken, user } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  // Только для моков: подсказываем MSW, какая роль делает запрос.
  // Реальный backend берёт роль из JWT, этот заголовок он игнорирует.
  if (env.useMocks && user) {
    config.headers['X-Mock-Role'] = user.role;
    config.headers['X-Mock-User'] = user.id;
  }
  return config;
});

// 2) При 401 — один раз обновляем токен и повторяем запрос.
//    Если несколько запросов упали одновременно, refresh всё равно вызывается один раз.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const res = await axios.post<ApiResponse<{ accessToken: string }>>(
    env.apiUrl + ENDPOINTS.auth.refresh,
    null,
    { withCredentials: true },
  );
  return res.data.data.accessToken;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const isAuthCall = original?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => (refreshPromise = null));
        const token = await refreshPromise;
        useAuthStore.getState().setAccessToken(token);
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);

/** Достаёт понятное сообщение об ошибке из ответа API */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiResponse<null>>(error)) {
    return error.response?.data?.error?.message ?? error.message;
  }
  return 'Unknown error';
}
