import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import type {
  Partner,
  PartnerCourse,
  PartnerCourseInput,
  PartnerStudentStatus,
  UserListItem,
} from '@/core/types/models';
import { staffEmail } from '@/shared/lib/credentials';
import { db } from '../db';
import { setPassword } from '../passwords';
import {
  monthlyIncome,
  partnerByUser,
  partnerCourses,
  partners,
  partnerStudents,
  recountPartners,
} from '../partners';
import { fail, ok, url } from './utils';

const meOf = (request: Request) => partnerByUser(request.headers.get('X-Mock-User'));
const PHONE_RE = /^\+?[\d\s()-]{9,20}$/;
const LEVELS = ['beginner', 'intermediate', 'advanced'];

/** Проверка курса: название, описание, цена, срок, уроки */
function courseError(b: Partial<PartnerCourseInput>) {
  if (!b.title || b.title.trim().length < 3) return 'Название курса — минимум 3 символа';
  if (!b.description || b.description.trim().length < 10) return 'Описание — минимум 10 символов';
  if (!LEVELS.includes(String(b.level))) return 'Выберите уровень';
  if (b.format !== 'online' && b.format !== 'offline') return 'Выберите формат';
  if (!(Number(b.priceMonthly) >= 50 && Number(b.priceMonthly) <= 10000))
    return 'Цена от 50 до 10 000 TJS';
  if (!(Number(b.durationMonths) >= 1 && Number(b.durationMonths) <= 12))
    return 'Срок от 1 до 12 месяцев';
  if (!(Number(b.lessonsCount) >= 1 && Number(b.lessonsCount) <= 200)) return 'Уроков от 1 до 200';
  return null;
}
const pickCourse = (b: PartnerCourseInput): PartnerCourseInput => ({
  title: b.title.trim(),
  description: b.description.trim(),
  level: b.level,
  format: b.format,
  priceMonthly: Math.round(Number(b.priceMonthly)),
  durationMonths: Math.round(Number(b.durationMonths)),
  lessonsCount: Math.round(Number(b.lessonsCount)),
});

export const partnerHandlers = [
  // --- Кабинет партнёра ---
  http.get(url(ENDPOINTS.partner.dashboard), ({ request }) => {
    const p = meOf(request);
    const mine = partnerStudents.filter((s) => s.partnerId === p.id);
    return ok({
      partner: p,
      clicks: p.clicks,
      applications: mine.length,
      enrolled: mine.filter((s) => s.status === 'enrolled').length,
      monthlyIncome: monthlyIncome(p),
      recent: [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    });
  }),
  http.get(url(ENDPOINTS.partner.courses), ({ request }) => {
    const p = meOf(request);
    return ok(partnerCourses.filter((c) => c.partnerId === p.id));
  }),
  http.post(url(ENDPOINTS.partner.courses), async ({ request }) => {
    const p = meOf(request);
    const b = (await request.json()) as PartnerCourseInput;
    const err = courseError(b);
    if (err) return fail(400, 'VALIDATION_ERROR', err);
    const c: PartnerCourse = {
      id: `pcourse_${Date.now()}`,
      partnerId: p.id,
      ...pickCourse(b),
      status: 'draft',
      studentsCount: 0,
      createdAt: new Date().toISOString(),
    };
    partnerCourses.push(c);
    recountPartners();
    return ok(c);
  }),
  http.patch(url('/partner/courses/:id'), async ({ params, request }) => {
    const p = meOf(request);
    const c = partnerCourses.find((x) => x.id === params.id && x.partnerId === p.id);
    if (!c) return fail(404, 'ENTITY_NOT_FOUND', 'Курс не найден');
    const b = (await request.json()) as Partial<PartnerCourseInput> & {
      status?: PartnerCourse['status'];
    };
    if (b.status) {
      if (b.status !== 'draft' && b.status !== 'published')
        return fail(400, 'VALIDATION_ERROR', 'Неверный статус');
      c.status = b.status;
    }
    if (b.title !== undefined) {
      const err = courseError({ ...c, ...b });
      if (err) return fail(400, 'VALIDATION_ERROR', err);
      Object.assign(c, pickCourse({ ...c, ...b } as PartnerCourseInput));
    }
    return ok(c);
  }),
  http.delete(url('/partner/courses/:id'), ({ params, request }) => {
    const p = meOf(request);
    const i = partnerCourses.findIndex((x) => x.id === params.id && x.partnerId === p.id);
    if (i === -1) return fail(404, 'ENTITY_NOT_FOUND', 'Курс не найден');
    if (partnerStudents.some((s) => s.courseId === params.id && s.status !== 'rejected'))
      return fail(
        409,
        'CONFLICT',
        'На курсе есть ученики — снимите его с публикации вместо удаления',
      );
    partnerCourses.splice(i, 1);
    recountPartners();
    return ok(null);
  }),
  http.get(url(ENDPOINTS.partner.students), ({ request }) => {
    const p = meOf(request);
    return ok(
      partnerStudents
        .filter((s) => s.partnerId === p.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }),
  http.patch(url('/partner/students/:id'), async ({ params, request }) => {
    const p = meOf(request);
    const s = partnerStudents.find((x) => x.id === params.id && x.partnerId === p.id);
    if (!s) return fail(404, 'ENTITY_NOT_FOUND', 'Заявка не найдена');
    const { status } = (await request.json()) as { status: PartnerStudentStatus };
    if (!['new', 'enrolled', 'rejected'].includes(status))
      return fail(400, 'VALIDATION_ERROR', 'Неверный статус');
    s.status = status;
    recountPartners();
    return ok(s);
  }),

  // --- Публичная страница по ссылке партнёра ---
  http.get(url('/public/partners/:code'), ({ params }) => {
    const p = partners.find((x) => x.code === params.code && x.isActive);
    if (!p) return fail(404, 'ENTITY_NOT_FOUND', 'Страница не найдена');
    p.clicks++;
    return ok({
      name: p.name,
      specialty: p.specialty,
      bio: p.bio,
      code: p.code,
      courses: partnerCourses.filter((c) => c.partnerId === p.id && c.status === 'published'),
    });
  }),
  http.post(url('/public/partners/:code/apply'), async ({ params, request }) => {
    const p = partners.find((x) => x.code === params.code && x.isActive);
    if (!p) return fail(404, 'ENTITY_NOT_FOUND', 'Страница не найдена');
    const b = (await request.json()) as { name?: string; phone?: string; courseId?: string };
    const course = partnerCourses.find(
      (c) => c.id === b.courseId && c.partnerId === p.id && c.status === 'published',
    );
    if (!b.name || b.name.trim().length < 2) return fail(400, 'VALIDATION_ERROR', 'Укажите имя');
    if (!b.phone || !PHONE_RE.test(b.phone.trim()))
      return fail(400, 'VALIDATION_ERROR', 'Укажите телефон');
    if (!course) return fail(400, 'VALIDATION_ERROR', 'Выберите курс');
    const digits = b.phone.replace(/\D/g, '').slice(-9);
    if (
      partnerStudents.some(
        (s) => s.courseId === course.id && s.phone.replace(/\D/g, '').slice(-9) === digits,
      )
    )
      return fail(
        409,
        'CONFLICT',
        'Вы уже оставили заявку на этот курс — партнёр скоро свяжется с вами',
      );
    const s = {
      id: `pstudent_${Date.now()}`,
      partnerId: p.id,
      name: b.name.trim(),
      phone: b.phone.trim(),
      courseId: course.id,
      courseTitle: course.title,
      status: 'new' as const,
      createdAt: new Date().toISOString(),
    };
    partnerStudents.push(s);
    recountPartners();
    return ok({ id: s.id });
  }),

  // --- SuperAdmin: партнёры сети ---
  http.get(url(ENDPOINTS.superAdmin.partners), () =>
    ok(partners.map((p) => ({ ...p, monthlyIncome: monthlyIncome(p) }))),
  ),
  http.post(url(ENDPOINTS.superAdmin.partners), async ({ request }) => {
    const b = (await request.json()) as {
      name?: string;
      phone?: string;
      login?: string;
      password?: string;
      specialty?: string;
      code?: string;
      sharePercent?: number;
    };
    const code = (b.code ?? '').trim().toLowerCase();
    if (!b.name || b.name.trim().length < 3)
      return fail(400, 'VALIDATION_ERROR', 'Укажите имя и фамилию');
    if (!b.phone || !PHONE_RE.test(b.phone.trim()))
      return fail(400, 'VALIDATION_ERROR', 'Укажите телефон');
    if (!b.specialty || b.specialty.trim().length < 2)
      return fail(400, 'VALIDATION_ERROR', 'Укажите специальность');
    if (!/^[a-z0-9-]{3,30}$/.test(code))
      return fail(400, 'VALIDATION_ERROR', 'Код ссылки: латиница, цифры и «-», 3–30 символов');
    if (partners.some((p) => p.code === code))
      return fail(409, 'CONFLICT', 'Такая ссылка уже занята');
    const share = Number(b.sharePercent);
    if (!(share >= 5 && share <= 70))
      return fail(400, 'VALIDATION_ERROR', 'Доля партнёра от 5 до 70%');
    if (!b.login || !b.password) return fail(400, 'VALIDATION_ERROR', 'Укажите логин и пароль');
    const email = staffEmail(b.login);
    if (db.users.some((u) => u.email === email))
      return fail(409, 'EMAIL_ALREADY_EXISTS', 'Логин уже занят');
    const now = new Date().toISOString();
    const user: UserListItem = {
      id: `user_partner_${Date.now()}`,
      name: b.name.trim(),
      email,
      phone: b.phone.trim(),
      role: 'partner',
      branchId: null,
      branchName: null,
      groupId: null,
      groupName: null,
      progress: 0,
      xp: 0,
      groupsCount: 0,
      studentsCount: 0,
      lastActiveAt: now,
      createdAt: now,
      isBlocked: false,
    };
    db.users.push(user);
    setPassword(user.id, b.password);
    const p: Partner = {
      id: `partner_${Date.now()}`,
      userId: user.id,
      name: user.name,
      phone: user.phone,
      email,
      code,
      specialty: b.specialty.trim(),
      bio: '',
      sharePercent: Math.round(share),
      isActive: true,
      createdAt: now,
      coursesCount: 0,
      studentsCount: 0,
      clicks: 0,
    };
    partners.push(p);
    return ok(p);
  }),
  http.patch(url('/superadmin/partners/:id'), async ({ params, request }) => {
    const p = partners.find((x) => x.id === params.id);
    if (!p) return fail(404, 'ENTITY_NOT_FOUND', 'Партнёр не найден');
    const b = (await request.json()) as { isActive?: boolean; sharePercent?: number };
    if (b.sharePercent !== undefined) {
      const share = Number(b.sharePercent);
      if (!(share >= 5 && share <= 70))
        return fail(400, 'VALIDATION_ERROR', 'Доля партнёра от 5 до 70%');
      p.sharePercent = Math.round(share);
    }
    if (b.isActive !== undefined) {
      p.isActive = !!b.isActive;
      const u = db.users.find((x) => x.id === p.userId);
      if (u) u.isBlocked = !p.isActive;
    }
    return ok(p);
  }),
];
