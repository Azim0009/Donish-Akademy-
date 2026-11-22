import { HttpResponse, delay } from 'msw';
import type { ApiErrorCode } from '@/core/api/types';
import type { Role } from '@/core/auth/roles';
import { env } from '@/core/config/env';

export const url = (path: string) => `${env.apiUrl}${path}`;

export const ok = async <T>(data: T, meta: unknown = null) => {
  await delay(250); // имитация сети, чтобы были видны состояния загрузки
  return HttpResponse.json({ data, error: null, meta });
};

export const fail = (status: number, code: ApiErrorCode, message: string) =>
  HttpResponse.json({ data: null, error: { code, message }, meta: null }, { status });

export const roleOf = (request: Request): Role =>
  (request.headers.get('X-Mock-Role') as Role) || 'student';

export const query = (request: Request) => new URL(request.url).searchParams;

export const matches = (text: string, search: string | null) =>
  !search || text.toLowerCase().includes(search.toLowerCase());
