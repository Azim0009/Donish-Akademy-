import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import { DEV_USERS } from '@/core/auth/devUsers';
import type { User, UserListItem } from '@/core/types/models';
import { STAFF_DOMAIN } from '@/shared/lib/credentials';
import { db } from '../db';
import { checkPassword } from '../passwords';
import { ok, fail, url } from './utils';

const allUsers = Object.values(DEV_USERS);
/** Демо-ученик входит и по телефону */
const DEV_STUDENT_PHONE = '900000001';
const digits9 = (s: string) => s.replace(/\D/g, '').slice(-9);

/** Сотрудник/ученик из базы → профиль для входа */
function toUser(u: UserListItem): User {
  const branch = db.branches.find((b) => b.id === u.branchId);
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    branchId: u.branchId,
    branchName: u.branchName,
    avatarUrl: null,
    level: Math.max(1, Math.floor(u.xp / 300) + 1),
    xp: u.xp,
    language: 'ru',
    theme: 'light',
    createdAt: u.createdAt,
    isBlocked: u.isBlocked,
    roles: u.roles,
    deniedSections: u.deniedSections,
    branchFeatures: branch?.features,
  };
}

export const authHandlers = [
  /**
   * Вход: сотрудник — логин (name или name@donish.tj), ученик — номер телефона.
   * Старый формат { email } тоже принимаем.
   */
  http.post(url(ENDPOINTS.auth.login), async ({ request }) => {
    const b = (await request.json()) as { login?: string; email?: string; password: string };
    const raw = (b.login ?? b.email ?? '').trim().toLowerCase();
    const bad = () => fail(401, 'UNAUTHORIZED', 'Неверный логин или пароль');
    if (!raw) return bad();
    const isPhone = !/[a-zа-я@]/i.test(raw);

    if (isPhone) {
      const d = digits9(raw);
      if (d.length < 9) return bad();
      if (d === DEV_STUDENT_PHONE)
        return b.password === 'password1'
          ? ok({ user: DEV_USERS.student, accessToken: 'mock-token-student' })
          : bad();
      const u = db.users.find((x) => x.role === 'student' && digits9(x.phone) === d);
      if (!u || !checkPassword(u.id, b.password)) return bad();
      if (u.isBlocked)
        return fail(403, 'FORBIDDEN', 'Аккаунт заблокирован. Обратитесь к администратору филиала');
      return ok({ user: toUser(u), accessToken: `mock-token-${u.role}` });
    }

    const email = raw.includes('@') ? raw : `${raw}@${STAFF_DOMAIN}`;
    const dev = allUsers.find((u) => u.email === email);
    if (dev)
      return b.password === 'password1'
        ? ok({ user: dev, accessToken: `mock-token-${dev.role}` })
        : bad();
    const u = db.users.find((x) => x.email.toLowerCase() === email && x.role !== 'student');
    if (!u || !checkPassword(u.id, b.password)) return bad();
    if (u.isBlocked) return fail(403, 'FORBIDDEN', 'Аккаунт заблокирован');
    return ok({ user: toUser(u), accessToken: `mock-token-${u.role}` });
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
