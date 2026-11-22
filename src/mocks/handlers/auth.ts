import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import { DEV_USERS } from '@/core/auth/devUsers';
import { ok, fail, url } from './utils';

const allUsers = Object.values(DEV_USERS);

export const authHandlers = [
  http.post(url(ENDPOINTS.auth.login), async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    const user = allUsers.find((u) => u.email === email);
    if (!user || password !== 'password1')
      return fail(401, 'UNAUTHORIZED', 'Неверный email или пароль');
    return ok({ user, accessToken: `mock-token-${user.role}` });
  }),

  http.post(url(ENDPOINTS.auth.register), async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string };
    if (allUsers.some((u) => u.email === body.email))
      return fail(409, 'EMAIL_ALREADY_EXISTS', 'Этот email уже зарегистрирован');
    const user = {
      ...DEV_USERS.student,
      id: `user_${Date.now()}`,
      name: body.name,
      email: body.email,
      xp: 0,
      level: 1,
    };
    return ok({ user, accessToken: 'mock-token-student' });
  }),

  http.post(url(ENDPOINTS.auth.refresh), () => ok({ accessToken: 'mock-token-refreshed' })),
  http.post(url(ENDPOINTS.auth.logout), () => ok(null)),
  http.post(url(ENDPOINTS.auth.forgotPassword), () => ok(null)),
  http.post(url(ENDPOINTS.auth.resetPassword), () => ok(null)),
  http.patch(url(ENDPOINTS.users.me), async ({ request }) => ok(await request.json())),
  http.patch(url(ENDPOINTS.users.password), () => ok(null)),
];
