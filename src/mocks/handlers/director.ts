import { DIRECTOR_ASSIGNABLE as STAFF_ASSIGNABLE } from '@/core/auth/access';
import type { Role } from '@/core/auth/roles';
import { isStrongPassword, LOGIN_RE, staffEmail } from '@/shared/lib/credentials';
import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { Group, UserListItem } from '@/core/types/models';
import { MAIN_TRACK } from '@/core/config/course';
import { db, getLesson, stats } from '../db';
import { deletePerson, makeContract, updatePerson } from '../db';
import { ok, fail, url, query, matches } from './utils';
import { pct, revenue, monthRevenue } from '../finance';
import { allLeads } from '../leads';
import { setPassword } from '../passwords';
import { branchMetrics, defaultExpenses, monthKey } from '../reports';
import type { BranchReport } from '@/core/types/models';

// Демо-директор — директор филиала Душанбе
const BRANCH = 'branch_dushanbe';

const DAY_CODES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
/** «Вт/Чт/Сб · 16:30–18:30» → идёт ли сегодня и во сколько */
function todayLesson(schedule: string) {
  const [days, time] = schedule.split(' · ');
  if (!days?.split('/').includes(DAY_CODES[new Date().getDay()]) || !time) return null;
  const [from, to] = time.split('–');
  const at = (hm: string) => {
    const [h, m] = hm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  return { from, to, startsAt: at(from), endsAt: at(to) };
}

export const directorHandlers = [
  http.get(url(ENDPOINTS.director.dashboard), ({ request }) => {
    const days = Number(query(request).get('period')) || 7;
    const students = db.users.filter((u) => u.branchId === BRANCH && u.role === 'student');
    const mentors = db.users.filter((u) => u.branchId === BRANCH && u.role === 'mentor');
    const groups = db.groups.filter((g) => g.branchId === BRANCH);
    const cur = revenue(BRANCH, days);
    const prev = revenue(BRANCH, days, days);
    const pending = db.submissions.filter((x) => x.status === 'pending');
    const newLeads = allLeads().filter((l) => l.branchId === BRANCH && l.status === 'new');
    return ok({
      period: days,
      branchName: db.branches.find((b) => b.id === BRANCH)?.name ?? '',
      kpi: {
        students: { value: students.length, delta: 13.8 },
        groups: { value: groups.length, delta: 9.1 },
        mentors: { value: mentors.length, delta: 5.6 },
        applications: { value: newLeads.length, delta: 17.2 },
        revenue: { value: cur, delta: pct(cur, prev) },
      },
      groups,
      mentorLoad: mentors
        .map((m) => {
          const own = groups.filter((g) => g.mentorId === m.id);
          const studentsN = own.reduce((sum, g) => sum + g.studentsCount, 0);
          // нагрузка: ученики к максимуму (3 группы по 16)
          return {
            id: m.id,
            name: m.name,
            groups: own.length,
            students: studentsN,
            load: Math.min(100, Math.round((studentsN / 48) * 100)),
          };
        })
        .sort((x, y) => y.load - x.load),
      applications: newLeads.slice(0, 5).map((l) => ({
        id: l.id,
        name: l.name,
        source: l.source,
        course: l.course,
        createdAt: l.createdAt,
      })),
      today: groups
        .map((g) => {
          const l = todayLesson(g.schedule);
          return (
            l && {
              groupId: g.id,
              groupName: g.name,
              trackTitle: g.trackTitle,
              mentorName: g.mentorName,
              ...l,
            }
          );
        })
        .filter(Boolean)
        .sort((x, y) => x!.startsAt.localeCompare(y!.startsAt)),
      reviews: groups
        .map((g) => ({
          groupId: g.id,
          groupName: g.name,
          count: pending.filter((x) => x.groupName === g.name).length,
          mentorName: g.mentorName,
        }))
        .filter((r) => r.count > 0),
      pendingTotal: pending.length,
    });
  }),

  // --- Отчёты директора → SuperAdmin ---
  http.get(url(ENDPOINTS.director.reports), () =>
    ok(
      db.reports
        .filter((r) => r.branchId === BRANCH)
        .sort((a, b) => b.month.localeCompare(a.month)),
    ),
  ),
  // новый отчёт: показатели и доход подтягиваются сами, расходы — по шаблону прошлого месяца
  http.post(url(ENDPOINTS.director.reports), async ({ request }) => {
    const { month } = (await request.json()) as { month: string };
    if (!/^\d{4}-\d{2}$/.test(month) || month > monthKey(0))
      return fail(422, 'VALIDATION_ERROR', 'Неверный месяц');
    if (db.reports.some((r) => r.branchId === BRANCH && r.month === month))
      return fail(409, 'CONFLICT', 'Отчёт за этот месяц уже есть');
    const branch = db.branches.find((b) => b.id === BRANCH)!;
    const prev = db.reports
      .filter((r) => r.branchId === BRANCH)
      .sort((a, b) => b.month.localeCompare(a.month))[0];
    const now = new Date().toISOString();
    const rep: BranchReport = {
      id: `rep_${BRANCH}_${month}`,
      branchId: BRANCH,
      branchName: branch.name,
      directorName: branch.directorName ?? 'Директор',
      month,
      status: 'draft',
      metrics: liveMetrics(),
      income: monthRevenue(BRANCH, month),
      expenses: prev
        ? prev.expenses.map((e, i) => ({ ...e, id: `exp_${Date.now()}_${i}` }))
        : defaultExpenses(branch),
      achievements: '',
      problems: '',
      plans: '',
      reviewComment: null,
      createdAt: now,
      updatedAt: now,
      sentAt: null,
      reviewedAt: null,
    };
    db.reports.push(rep);
    return ok(rep, 201);
  }),
  http.get(url('/director/reports/:id'), ({ params }) => {
    const r = db.reports.find((x) => x.id === params.id && x.branchId === BRANCH);
    return r ? ok(r) : fail(404, 'ENTITY_NOT_FOUND', 'Отчёт не найден');
  }),
  http.put(url('/director/reports/:id'), async ({ params, request }) => {
    const r = db.reports.find((x) => x.id === params.id && x.branchId === BRANCH);
    if (!r) return fail(404, 'ENTITY_NOT_FOUND', 'Отчёт не найден');
    if (r.status === 'sent' || r.status === 'accepted')
      return fail(409, 'CONFLICT', 'Отправленный отчёт нельзя менять');
    const body = (await request.json()) as Pick<
      BranchReport,
      'expenses' | 'achievements' | 'problems' | 'plans'
    >;
    Object.assign(r, body, { updatedAt: new Date().toISOString() });
    return ok(r);
  }),
  // обновить цифры (ученики, оплаты) на сегодня
  http.post(url('/director/reports/:id/refresh'), ({ params }) => {
    const r = db.reports.find((x) => x.id === params.id && x.branchId === BRANCH);
    if (!r) return fail(404, 'ENTITY_NOT_FOUND', 'Отчёт не найден');
    if (r.status === 'sent' || r.status === 'accepted')
      return fail(409, 'CONFLICT', 'Отправленный отчёт нельзя менять');
    Object.assign(r, {
      metrics: liveMetrics(),
      income: monthRevenue(BRANCH, r.month),
      updatedAt: new Date().toISOString(),
    });
    return ok(r);
  }),
  http.post(url('/director/reports/:id/send'), ({ params }) => {
    const r = db.reports.find((x) => x.id === params.id && x.branchId === BRANCH);
    if (!r) return fail(404, 'ENTITY_NOT_FOUND', 'Отчёт не найден');
    if (r.status === 'sent' || r.status === 'accepted')
      return fail(409, 'CONFLICT', 'Отчёт уже отправлен');
    if (!r.achievements.trim() && !r.problems.trim() && !r.plans.trim())
      return fail(422, 'VALIDATION_ERROR', 'Заполните хотя бы один текстовый блок');
    const now = new Date().toISOString();
    Object.assign(r, { status: 'sent', sentAt: now, updatedAt: now });
    db.notifications.super_admin.unshift({
      id: `n_${Date.now()}`,
      title: `Новый отчёт: ${r.branchName}`,
      body: `${r.directorName} прислал отчёт за ${r.month}.`,
      kind: 'info',
      isRead: false,
      link: `/super-admin/reports/${r.id}`,
      createdAt: now,
    });
    return ok(r);
  }),

  // --- Курсы ---
  http.get(url(ENDPOINTS.director.tracks), () => ok(db.tracks)),
  http.post(url(ENDPOINTS.director.tracks), async ({ request }) => {
    const body = (await request.json()) as { title: string; description: string };
    const track = {
      ...db.tracks[1],
      ...body,
      id: `track_${Date.now()}`,
      isActive: false,
      stack: [],
    };
    db.tracks.push(track);
    return ok(track);
  }),
  http.get(url('/director/tracks/:id/modules'), ({ params }) => {
    const track = db.tracks.find((t) => t.id === params.id);
    if (!track) return fail(404, 'ENTITY_NOT_FOUND', 'Направление не найдено');
    return ok({ track, modules: db.modules.filter((m) => m.trackId === track.id) });
  }),
  http.post(url('/director/tracks/:id/modules'), async ({ params, request }) => {
    const body = (await request.json()) as { title: string; description: string };
    const order = db.modules.length + 1;
    const m = {
      id: `module_${Date.now()}`,
      trackId: params.id as string,
      ...body,
      order,
      isLocked: true,
      status: 'locked' as const,
      lessonsCount: 0,
      completedLessons: 0,
      lessons: [],
    };
    db.modules.push(m);
    return ok(m);
  }),
  http.put(url('/director/tracks/:id/modules'), async ({ request }) => {
    const { order } = (await request.json()) as { order: string[] };
    order.forEach((id, i) => {
      const m = db.modules.find((x) => x.id === id);
      if (m) m.order = i + 1;
    });
    db.modules.sort((a, b) => a.order - b.order);
    return ok(null);
  }),
  http.get(url('/director/modules/:id/lessons'), ({ params }) => {
    const module = db.modules.find((m) => m.id === params.id);
    return module
      ? ok({ module, track: db.tracks.find((t) => t.id === module.trackId) })
      : fail(404, 'ENTITY_NOT_FOUND', 'Модуль не найден');
  }),
  http.post(url('/director/modules/:id/lessons'), async ({ params, request }) => {
    const module = db.modules.find((m) => m.id === params.id);
    if (!module) return fail(404, 'ENTITY_NOT_FOUND', 'Модуль не найден');
    const body = (await request.json()) as { title: string; durationMinutes: number };
    const lesson = {
      id: `${module.id}_l${Date.now()}`,
      order: module.lessons.length + 1,
      status: 'not_started' as const,
      hasVideo: false,
      hasExercise: false,
      quizCount: 0,
      ...body,
    };
    module.lessons.push(lesson);
    module.lessonsCount++;
    return ok(lesson);
  }),
  http.get(url('/director/lessons/:id'), ({ params }) => {
    const lesson = getLesson(params.id as string);
    return lesson ? ok(lesson) : fail(404, 'ENTITY_NOT_FOUND', 'Урок не найден');
  }),
  http.put(url('/director/lessons/:id'), async ({ request }) => ok(await request.json())),

  // --- Группы ---
  http.get(url(ENDPOINTS.director.groups), ({ request }) =>
    ok(db.groups.filter((g) => matches(g.name + g.mentorName, query(request).get('search')))),
  ),
  http.post(url(ENDPOINTS.director.groups), async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      mentorId: string;
      schedule: string;
      capacity: number;
    };
    const mentor = db.users.find((u) => u.id === body.mentorId);
    const g: Group = {
      id: `group_${Date.now()}`,
      branchId: BRANCH,
      trackId: MAIN_TRACK.id,
      trackTitle: MAIN_TRACK.title,
      name: body.name,
      schedule: body.schedule,
      mentorId: mentor?.id ?? null,
      mentorName: mentor?.name ?? null,
      studentsCount: 0,
      capacity: Number(body.capacity) || 16,
      avgProgress: 0,
      pendingReviews: 0,
      startDate: new Date().toISOString(),
    };
    db.groups.push(g);
    return ok(g);
  }),
  http.get(url('/director/groups/:id'), ({ params }) => {
    const group = db.groups.find((g) => g.id === params.id);
    if (!group) return fail(404, 'ENTITY_NOT_FOUND', 'Группа не найдена');
    return ok({ group, members: db.users.filter((u) => u.groupId === group.id) });
  }),

  // --- Пользователи филиала ---
  http.get(url(ENDPOINTS.director.users), ({ request }) => {
    const q = query(request);
    const role = q.get('role');
    const groupId = q.get('groupId');
    return ok(
      db.users.filter(
        (u) =>
          u.branchId === BRANCH &&
          // staff — все сотрудники филиала (кроме директора и учеников); учитываем мульти-роли
          (!role ||
            (role === 'staff'
              ? STAFF_ASSIGNABLE.some((r) => u.role === r || u.roles?.includes(r))
              : u.role === role || u.roles?.includes(role as Role))) &&
          (!groupId || u.groupId === groupId) &&
          matches(u.name + u.email + u.phone, q.get('search')),
      ),
    );
  }),
  http.post(url(ENDPOINTS.director.users), async ({ request }) => {
    const { login, password, ...body } = (await request.json()) as Pick<
      UserListItem,
      'name' | 'email' | 'phone' | 'role'
    > & { groupId?: string; login?: string; password?: string };
    if (body.role !== 'student' && !(STAFF_ASSIGNABLE as readonly Role[]).includes(body.role))
      return fail(403, 'FORBIDDEN', 'Эту должность директор назначить не может');
    // сотрудники — логин @donish.tj и пароль от директора
    if (body.role === 'student') body.email = '';
    else {
      if (!login || !LOGIN_RE.test(login) || !password || !isStrongPassword(password))
        return fail(400, 'VALIDATION_ERROR', 'Проверьте логин и пароль');
      body.email = staffEmail(login);
      if (db.users.some((u) => u.email === body.email))
        return fail(409, 'EMAIL_ALREADY_EXISTS', 'Такой логин уже занят');
    }
    const group = db.groups.find((g) => g.id === body.groupId);
    const u: UserListItem = {
      id: `u_new_${Date.now()}`,
      ...body,
      branchId: BRANCH,
      branchName: 'Душанбе',
      groupId: group?.id ?? null,
      groupName: group?.name ?? null,
      progress: 0,
      xp: 0,
      groupsCount: 0,
      studentsCount: 0,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isBlocked: false,
    };
    db.users.unshift(u);
    makeContract(u); // администратору и ментору — договор с его ФИО
    if (password) setPassword(u.id, password);
    if (group) group.studentsCount++;
    return ok(u);
  }),
  http.get(url('/director/users/:id'), ({ params }) => {
    const user = db.users.find((u) => u.id === params.id);
    if (!user) return fail(404, 'ENTITY_NOT_FOUND', 'Пользователь не найден');
    return ok({
      user,
      groups: db.groups.filter((g) => g.mentorId === user.id || g.id === user.groupId),
    });
  }),
  // --- Договоры: директор меняет шаблоны администратора и ментора, видит договоры своего филиала ---
  http.get(url(ENDPOINTS.director.contractTemplates), () =>
    ok(db.contractTemplates.filter((x) => x.role !== 'director')),
  ),
  http.put(url('/director/contract-templates/:id'), async ({ params, request }) => {
    const tpl = db.contractTemplates.find((x) => x.id === params.id);
    if (!tpl || tpl.role === 'director')
      return fail(403, 'FORBIDDEN', 'Шаблон договора директора меняет только SuperAdmin');
    const body = (await request.json()) as { title: string; body: string };
    Object.assign(tpl, {
      title: body.title,
      body: body.body,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Директор',
    });
    return ok(tpl);
  }),
  http.get(url(ENDPOINTS.director.contracts), ({ request }) =>
    ok(
      db.contracts.filter(
        (c) =>
          c.branchId === BRANCH &&
          c.role !== 'director' &&
          matches(c.userName, query(request).get('search')),
      ),
    ),
  ),
  // Директор меняет данные, доступ и удаляет людей только своего филиала (директора и SuperAdmin — нельзя)
  http.patch(url('/director/users/:id/access'), async ({ params, request }) => {
    const u = db.users.find((x) => x.id === params.id && x.branchId === BRANCH);
    if (!u || u.role === 'director' || u.role === 'super_admin')
      return fail(403, 'FORBIDDEN', 'Нет прав');
    const body = (await request.json()) as { roles: Role[]; deniedSections: string[] };
    if (body.roles.some((r) => r === 'director' || r === 'super_admin'))
      return fail(403, 'FORBIDDEN', 'Эту роль может дать только SuperAdmin');
    u.roles = [u.role, ...body.roles.filter((r) => r !== u.role)];
    u.deniedSections = body.deniedSections;
    return ok(u);
  }),
  http.patch(url('/director/users/:id'), async ({ params, request }) => {
    const target = db.users.find((x) => x.id === params.id && x.branchId === BRANCH);
    if (!target || target.role === 'director') return fail(403, 'FORBIDDEN', 'Нет прав');
    return ok(
      updatePerson(target.id, (await request.json()) as Parameters<typeof updatePerson>[1]),
    );
  }),
  http.delete(url('/director/users/:id'), ({ params }) => {
    const target = db.users.find((x) => x.id === params.id && x.branchId === BRANCH);
    if (!target || target.role === 'director') return fail(403, 'FORBIDDEN', 'Нет прав');
    deletePerson(target.id);
    return ok(null);
  }),
  http.patch(url('/director/users/:id/block'), ({ params }) => {
    const user = db.users.find((u) => u.id === params.id);
    if (!user) return fail(404, 'ENTITY_NOT_FOUND', 'Пользователь не найден');
    user.isBlocked = !user.isBlocked;
    return ok(user);
  }),

  http.get(url(ENDPOINTS.director.statistics), () => {
    const students = db.users.filter((u) => u.branchId === BRANCH && u.role === 'student');
    return ok({
      daily: stats.daily,
      registrations: stats.growth.map((g) => ({
        label: g.label,
        value: Math.round(g.students / 40),
      })),
      byGroup: db.groups.map((g) => ({
        name: g.name,
        progress: g.avgProgress,
        students: g.studentsCount,
      })),
      completedModules: students.reduce((s, u) => s + Math.floor(u.progress / 20), 0),
      activeStudents: students.filter((s) => !s.isBlocked).length,
      registrationsMonth: 18,
    });
  }),
];

/** Живые показатели демо-филиала (Душанбе) для отчёта */
function liveMetrics() {
  const branch = db.branches.find((b) => b.id === BRANCH)!;
  const students = db.users.filter((u) => u.branchId === BRANCH && u.role === 'student');
  const groups = db.groups.filter((g) => g.branchId === BRANCH);
  const monthStart = new Date();
  monthStart.setDate(1);
  return branchMetrics(branch, {
    students: students.length,
    newStudents: students.filter((u) => new Date(u.createdAt) >= monthStart).length,
    leftStudents: students.filter((u) => u.isBlocked).length,
    groups: groups.length,
    mentors: db.users.filter((u) => u.branchId === BRANCH && u.role === 'mentor').length,
    avgProgress: students.length
      ? Math.round(students.reduce((s, u) => s + u.progress, 0) / students.length)
      : 0,
  });
}
