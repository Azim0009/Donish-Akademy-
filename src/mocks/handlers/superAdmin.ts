import { isStrongPassword, LOGIN_RE, staffEmail } from '@/shared/lib/credentials';
import type { Role } from '@/core/auth/roles';
import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { Branch, BranchStatus, CrossRequestStatus, UserListItem } from '@/core/types/models';
import { branchFinance, networkDaily, pct } from '../finance';
import { setPassword } from '../passwords';
import { db, deletePerson, makeContract, stats, updatePerson } from '../db';
import { ok, fail, url, query, matches } from './utils';

const branchDirectors = (branchId: string) =>
  db.users.filter((u) => u.role === 'director' && u.branchId === branchId);

export const superAdminHandlers = [
  // Обзор сети. period — дней: 7 / 30 / 90
  http.get(url(ENDPOINTS.superAdmin.dashboard), ({ request }) => {
    const days = Number(query(request).get('period')) || 7;
    const active = db.branches.filter((b) => b.status === 'active');
    const fin = branchFinance(db.branches, days);
    const revenue = fin.reduce((s, f) => s + f.revenue, 0);
    const prevRevenue = fin.reduce((s, f) => s + f.previous, 0);
    const students = db.branches.reduce((s, b) => s + b.studentsCount, 0);
    const k = days / 7; // «прошлый период» для демо-дельт
    const newReq = db.requests.filter((r) => r.status === 'new');
    return ok({
      period: days,
      kpi: {
        students: { value: students, delta: +(12.4 / Math.sqrt(k)).toFixed(1) },
        courses: { value: db.branches.reduce((s, b) => s + (b.coursesCount ?? 0), 0), delta: 8.7 },
        groups: {
          value: db.branches.reduce((s, b) => s + b.groupsCount, 0),
          delta: +(9.3 / Math.sqrt(k)).toFixed(1),
        },
        mentors: { value: db.branches.reduce((s, b) => s + b.mentorsCount, 0), delta: 6.1 },
        revenue: { value: revenue, delta: pct(revenue, prevRevenue) },
        requests: { value: newReq.length, delta: 18.3 },
      },
      ranking: fin.filter((f) => f.revenue > 0).slice(0, 5),
      branches: db.branches.map((b) => {
        const f = fin.find((x) => x.branchId === b.id)!;
        return { ...b, revenue: f.revenue, revenueDelta: f.delta };
      }),
      audit: db.audit.slice(0, 5),
      requests: newReq.slice(0, 3),
      newRequests: newReq.length,
      activeBranches: active.length,
    });
  }),

  http.get(url(ENDPOINTS.superAdmin.requests), ({ request }) => {
    const q = query(request);
    const status = q.get('status');
    return ok(
      db.requests.filter(
        (r) =>
          (!status || status === 'all' || r.status === status) &&
          matches(r.subject + r.fromBranch + (r.toBranch ?? '') + r.createdBy, q.get('search')),
      ),
    );
  }),
  http.patch(url('/superadmin/requests/:id/status'), async ({ params, request }) => {
    const r = db.requests.find((x) => x.id === params.id);
    if (!r) return fail(404, 'ENTITY_NOT_FOUND', 'Запрос не найден');
    const { status } = (await request.json()) as { status: CrossRequestStatus };
    r.status = status;
    db.audit.unshift({
      id: `audit_${Date.now()}`,
      userName: 'Super Admin',
      userRole: 'super_admin',
      branchName: r.fromBranch,
      action: 'Update',
      entityType: 'Request',
      description: `${status === 'approved' ? 'Одобрен' : 'Отклонён'} запрос: ${r.subject}`,
      ipAddress: '10.0.0.1',
      createdAt: new Date().toISOString(),
    });
    return ok(r);
  }),

  http.get(url(ENDPOINTS.superAdmin.finance), ({ request }) => {
    const days = Number(query(request).get('period')) || 30;
    const fin = branchFinance(db.branches, days);
    const total = fin.reduce((s, f) => s + f.revenue, 0);
    const prev = fin.reduce((s, f) => s + f.previous, 0);
    const paid = fin.reduce((s, f) => s + f.paidStudents, 0);
    const students = fin.reduce((s, f) => s + f.students, 0);
    return ok({
      period: days,
      total,
      previous: prev,
      delta: pct(total, prev),
      avgCheck: paid ? Math.round(total / paid / Math.max(1, days / 30)) : 0,
      paidShare: students ? Math.round((paid / students) * 100) : 0,
      debtors: students - paid,
      branches: fin,
      daily: networkDaily(
        db.branches.map((b) => b.id),
        Math.min(days, 90),
      ),
    });
  }),

  // --- Отчёты филиалов ---
  http.get(url(ENDPOINTS.superAdmin.reports), ({ request }) => {
    const q = query(request);
    const month = q.get('month');
    const status = q.get('status');
    const list = db.reports
      .filter((r) => r.status !== 'draft') // черновики SuperAdmin не видит
      .filter(
        (r) =>
          (!month || r.month === month) && (!status || status === 'all' || r.status === status),
      )
      .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''));
    // кто за месяц ещё не прислал
    const missing = month
      ? db.branches
          .filter(
            (b) =>
              b.status === 'active' &&
              b.studentsCount > 0 &&
              !db.reports.some(
                (r) => r.branchId === b.id && r.month === month && r.status !== 'draft',
              ),
          )
          .map((b) => ({ branchId: b.id, branchName: b.name, directorName: b.directorName }))
      : [];
    return ok({
      reports: list,
      missing,
      months: [...new Set(db.reports.map((r) => r.month))].sort().reverse(),
    });
  }),
  http.get(url('/superadmin/reports/:id'), ({ params }) => {
    const r = db.reports.find((x) => x.id === params.id && x.status !== 'draft');
    if (!r) return fail(404, 'ENTITY_NOT_FOUND', 'Отчёт не найден');
    // прошлый отчёт этого филиала — для сравнения
    const prev =
      db.reports
        .filter((x) => x.branchId === r.branchId && x.month < r.month && x.status !== 'draft')
        .sort((a, b) => b.month.localeCompare(a.month))[0] ?? null;
    return ok({ report: r, previous: prev });
  }),
  http.post(url('/superadmin/reports/:id/review'), async ({ params, request }) => {
    const r = db.reports.find((x) => x.id === params.id);
    if (!r) return fail(404, 'ENTITY_NOT_FOUND', 'Отчёт не найден');
    if (r.status !== 'sent') return fail(409, 'CONFLICT', 'Отчёт уже рассмотрен');
    const { decision, comment } = (await request.json()) as {
      decision: 'accepted' | 'returned';
      comment?: string;
    };
    if (decision === 'returned' && !comment?.trim())
      return fail(422, 'VALIDATION_ERROR', 'Напишите, что исправить');
    const now = new Date().toISOString();
    Object.assign(r, { status: decision, reviewComment: comment?.trim() || null, reviewedAt: now });
    db.notifications.director.unshift({
      id: `n_${Date.now()}`,
      title: decision === 'accepted' ? 'Отчёт принят' : 'Отчёт вернули на доработку',
      body:
        decision === 'accepted'
          ? `SuperAdmin принял отчёт за ${r.month}.`
          : `Комментарий: ${comment}`,
      kind: decision === 'accepted' ? 'success' : 'warning',
      isRead: false,
      link: `/director/reports/${r.id}`,
      createdAt: now,
    });
    db.audit.unshift({
      id: `audit_${Date.now()}`,
      userName: 'Super Admin',
      userRole: 'super_admin',
      branchName: r.branchName,
      action: 'Update',
      entityType: 'Report',
      description: `${decision === 'accepted' ? 'Принят' : 'Возвращён'} отчёт за ${r.month}`,
      ipAddress: '10.0.0.1',
      createdAt: now,
    });
    return ok(r);
  }),

  http.get(url(ENDPOINTS.superAdmin.tracks), () =>
    ok(
      db.tracks.map((t) => ({
        ...t,
        // курс в разработке (без уроков) ещё нигде не идёт
        branches: t.modulesCount
          ? db.branches
              .filter((b) => b.status === 'active')
              .map((b) => ({ id: b.id, name: b.name, students: Math.round(b.studentsCount * 0.9) }))
          : [],
      })),
    ),
  ),
  http.patch(url('/superadmin/tracks/:id'), async ({ params, request }) => {
    const tr = db.tracks.find((x) => x.id === params.id);
    if (!tr) return fail(404, 'ENTITY_NOT_FOUND', 'Курс не найден');
    Object.assign(tr, (await request.json()) as { isActive: boolean });
    return ok(tr);
  }),

  http.get(url(ENDPOINTS.superAdmin.branches), ({ request }) => {
    const q = query(request);
    const status = q.get('status');
    return ok(
      db.branches.filter(
        (b) =>
          (!status || status === 'all' || b.status === status) &&
          matches(b.name + b.code + (b.directorName ?? ''), q.get('search')),
      ),
    );
  }),
  http.post(url(ENDPOINTS.superAdmin.branches), async ({ request }) => {
    const body = (await request.json()) as Partial<Branch>;
    if (db.branches.some((b) => b.code.toLowerCase() === body.code?.toLowerCase()))
      return fail(409, 'BRANCH_CODE_ALREADY_EXISTS', 'Филиал с таким кодом уже есть');
    const b: Branch = {
      id: `branch_${Date.now()}`,
      name: '',
      code: '',
      status: 'draft',
      address: '',
      phone: '',
      email: '',
      timeZone: 'Asia/Dushanbe',
      description: '',
      createdAt: new Date().toISOString(),
      directorName: null,
      studentsCount: 0,
      mentorsCount: 0,
      groupsCount: 0,
      completionRate: 0,
      ...body,
    };
    db.branches.push(b);
    db.audit.unshift({
      id: `audit_${Date.now()}`,
      userName: 'Super Admin',
      userRole: 'super_admin',
      branchName: b.name,
      action: 'Create',
      entityType: 'Branch',
      description: `Создан филиал «${b.name}»`,
      ipAddress: '10.0.0.1',
      createdAt: new Date().toISOString(),
    });
    return ok(b);
  }),
  http.get(url('/superadmin/branches/:id'), ({ params }) => {
    const branch = db.branches.find((b) => b.id === params.id);
    if (!branch) return fail(404, 'ENTITY_NOT_FOUND', 'Филиал не найден');
    return ok({
      branch,
      directors: branchDirectors(branch.id),
      growth: stats.growth.map((g) => ({
        ...g,
        students: Math.round((g.students * branch.studentsCount) / 1500),
      })),
      audit: db.audit.filter((a) => a.branchName === branch.name),
    });
  }),
  http.put(url('/superadmin/branches/:id'), async ({ params, request }) => {
    const branch = db.branches.find((b) => b.id === params.id);
    if (!branch) return fail(404, 'ENTITY_NOT_FOUND', 'Филиал не найден');
    Object.assign(branch, await request.json());
    return ok(branch);
  }),
  http.patch(url('/superadmin/branches/:id/status'), async ({ params, request }) => {
    const branch = db.branches.find((b) => b.id === params.id);
    if (!branch) return fail(404, 'ENTITY_NOT_FOUND', 'Филиал не найден');
    const { status } = (await request.json()) as { status: BranchStatus };
    branch.status = status;
    db.audit.unshift({
      id: `audit_${Date.now()}`,
      userName: 'Super Admin',
      userRole: 'super_admin',
      branchName: branch.name,
      action: 'ChangeStatus',
      entityType: 'Branch',
      description: `Статус филиала «${branch.name}»: ${status}`,
      ipAddress: '10.0.0.1',
      createdAt: new Date().toISOString(),
    });
    return ok(branch);
  }),
  http.post(url('/superadmin/branches/:id/directors'), async ({ params, request }) => {
    const branch = db.branches.find((b) => b.id === params.id);
    if (!branch) return fail(404, 'ENTITY_NOT_FOUND', 'Филиал не найден');
    const { login, password, ...body } = (await request.json()) as {
      name: string;
      firstName: string;
      lastName: string;
      phone: string;
      phone2?: string;
      passportFront: string;
      passportBack: string;
      login: string;
      password: string;
      roles?: Role[];
      deniedSections?: string[];
    };
    const email = staffEmail(login);
    if (!LOGIN_RE.test(login) || !isStrongPassword(password))
      return fail(400, 'VALIDATION_ERROR', 'Проверьте логин и пароль');
    if (db.users.some((u) => u.email === email))
      return fail(409, 'EMAIL_ALREADY_EXISTS', 'Такой логин уже занят');
    const u: UserListItem = {
      id: `u_director_${Date.now()}`,
      ...body,
      email,
      roles: ['director', ...(body.roles ?? []).filter((r) => r !== 'director')],
      deniedSections: body.deniedSections ?? [],
      role: 'director',
      branchId: branch.id,
      branchName: branch.name,
      groupId: null,
      groupName: null,
      progress: 0,
      xp: 0,
      groupsCount: 0,
      studentsCount: 0,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isBlocked: false,
    };
    db.users.push(u);
    makeContract(u); // договор с ФИО директора создаётся сразу
    setPassword(u.id, password);
    branch.directorName ??= u.name;
    db.audit.unshift({
      id: `audit_${Date.now()}`,
      userName: 'Super Admin',
      userRole: 'super_admin',
      branchName: branch.name,
      action: 'AssignRole',
      entityType: 'User',
      description: `Назначен директор филиала: ${u.name}`,
      ipAddress: '10.0.0.1',
      createdAt: new Date().toISOString(),
    });
    return ok(u);
  }),
  http.get(url(ENDPOINTS.superAdmin.directors), ({ request }) =>
    ok(
      db.users.filter(
        (u) =>
          u.role === 'director' &&
          matches(u.name + u.email + (u.branchName ?? ''), query(request).get('search')),
      ),
    ),
  ),

  http.get(url(ENDPOINTS.superAdmin.users), ({ request }) => {
    const q = query(request);
    const role = q.get('role');
    const branchId = q.get('branchId');
    return ok(
      db.users.filter(
        (u) =>
          (!role || u.role === role || u.roles?.includes(role as Role)) &&
          (!branchId || u.branchId === branchId) &&
          matches(u.name + u.email, q.get('search')),
      ),
    );
  }),
  http.patch(url('/superadmin/users/:id'), async ({ params, request }) => {
    const u = updatePerson(
      params.id as string,
      (await request.json()) as Parameters<typeof updatePerson>[1],
    );
    return u ? ok(u) : fail(404, 'ENTITY_NOT_FOUND', 'Пользователь не найден');
  }),
  http.delete(url('/superadmin/users/:id'), ({ params }) => {
    const u = deletePerson(params.id as string);
    if (!u) return fail(404, 'ENTITY_NOT_FOUND', 'Пользователь не найден');
    db.audit.unshift({
      id: `audit_${Date.now()}`,
      userName: 'Super Admin',
      userRole: 'super_admin',
      branchName: u.branchName,
      action: 'Delete',
      entityType: 'User',
      description: `Удалён сотрудник: ${u.name}`,
      ipAddress: '10.0.0.1',
      createdAt: new Date().toISOString(),
    });
    return ok(null);
  }),
  // --- Договоры: SuperAdmin видит все и меняет любые шаблоны ---
  http.get(url(ENDPOINTS.superAdmin.contractTemplates), () => ok(db.contractTemplates)),
  http.put(url('/superadmin/contract-templates/:id'), async ({ params, request }) => {
    const tpl = db.contractTemplates.find((x) => x.id === params.id);
    if (!tpl) return fail(404, 'ENTITY_NOT_FOUND', 'Шаблон не найден');
    const body = (await request.json()) as { title: string; body: string };
    Object.assign(tpl, {
      title: body.title,
      body: body.body,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Super Admin',
    });
    return ok(tpl);
  }),
  http.get(url(ENDPOINTS.superAdmin.contracts), ({ request }) => {
    const q = query(request);
    const role = q.get('role');
    return ok(
      db.contracts.filter(
        (c) =>
          (!role || c.role === role) && matches(c.userName + (c.branchName ?? ''), q.get('search')),
      ),
    );
  }),
  // Мульти-доступ: роли сотрудника и выключенные разделы
  http.patch(url('/superadmin/users/:id/access'), async ({ params, request }) => {
    const u = db.users.find((x) => x.id === params.id);
    if (!u) return fail(404, 'ENTITY_NOT_FOUND', 'Пользователь не найден');
    const body = (await request.json()) as { roles: Role[]; deniedSections: string[] };
    u.roles = [u.role, ...body.roles.filter((r) => r !== u.role)];
    u.deniedSections = body.deniedSections;
    db.audit.unshift({
      id: `audit_${Date.now()}`,
      userName: 'Super Admin',
      userRole: 'super_admin',
      branchName: u.branchName,
      action: 'AssignRole',
      entityType: 'User',
      description: `Изменён доступ: ${u.name}`,
      ipAddress: '10.0.0.1',
      createdAt: new Date().toISOString(),
    });
    return ok(u);
  }),

  http.get(url(ENDPOINTS.superAdmin.statistics), () => {
    const active = db.branches.filter((b) => b.studentsCount > 0);
    return ok({
      growth: stats.growth,
      compare: active.map((b) => ({
        name: b.name,
        current: b.studentsCount,
        previous: Math.round(b.studentsCount * 0.86),
      })),
      completion: [...active]
        .sort((a, b) => b.completionRate - a.completionRate)
        .map((b) => ({ name: b.name, value: b.completionRate })),
      totals: {
        students: db.branches.reduce((s, b) => s + b.studentsCount, 0),
        completion: Math.round(active.reduce((s, b) => s + b.completionRate, 0) / active.length),
        lessonsDone: 18420,
        activeWeek: 812,
      },
    });
  }),

  http.get(url(ENDPOINTS.superAdmin.auditLogs), ({ request }) => {
    const q = query(request);
    const action = q.get('action');
    return ok(
      db.audit.filter(
        (a) =>
          (!action || action === 'all' || a.action === action) &&
          matches(a.description + a.userName, q.get('search')),
      ),
    );
  }),
  http.get(url(ENDPOINTS.superAdmin.settings), () => ok(db.settings)),
  http.put(url(ENDPOINTS.superAdmin.settings), async ({ request }) => {
    Object.assign(db.settings, await request.json());
    return ok(db.settings);
  }),
];
