import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import { db } from '../db';
import { ok, fail, url, query, matches } from './utils';
import type { Payment, PaymentMethod, PaymentRow, UserListItem } from '@/core/types/models';
import { isStrongPassword } from '@/shared/lib/credentials';
import { MONTHLY_FEE } from '@/shared/lib/payments';
import { allLeads } from '../leads';
import { allPayments } from '../payments';
import { setPassword } from '../passwords';
import { resolveMe } from '../tasks';
import { roleOf } from './utils';

// Демо-администратор — ресепшн филиала Душанбе
const BRANCH = 'branch_dushanbe';
// «Пн/Ср/Пт · 14:00–16:00» → есть ли сегодняшний день в расписании
const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const isToday = (schedule: string) =>
  schedule.split(' · ')[0].split('/').includes(DAYS[new Date().getDay()]);
const timeOf = (schedule: string) => schedule.split(' · ')[1] ?? '';

export const administratorHandlers = [
  http.get(url(ENDPOINTS.administrator.dashboard), () => {
    const students = db.users.filter((u) => u.branchId === BRANCH && u.role === 'student');
    const groups = db.groups.filter((g) => g.branchId === BRANCH);
    const today = groups
      .filter((g) => isToday(g.schedule))
      .map((g) => ({
        id: g.id,
        name: g.name,
        mentorName: g.mentorName,
        time: timeOf(g.schedule),
        studentsCount: g.studentsCount,
        capacity: g.capacity,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
    return ok({
      studentsCount: students.length,
      activeCount: students.filter((s) => !s.isBlocked).length,
      groupsCount: groups.length,
      freeSeats: groups.reduce((s, g) => s + Math.max(0, g.capacity - g.studentsCount), 0),
      today,
      recent: [...students].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    });
  }),
  http.get(url(ENDPOINTS.administrator.students), ({ request }) => {
    const q = query(request);
    const groupId = q.get('groupId');
    return ok(
      db.users.filter(
        (u) =>
          u.branchId === BRANCH &&
          u.role === 'student' &&
          (!groupId || u.groupId === groupId) &&
          matches(`${u.name} ${u.phone} ${u.email}`, q.get('search')),
      ),
    );
  }),

  // --- создать ученика: логин — телефон, пароль задаёт администратор ---
  http.post(url(ENDPOINTS.administrator.students), async ({ request }) => {
    const b = (await request.json()) as {
      name: string;
      phone: string;
      groupId?: string;
      password: string;
      leadId?: string;
    };
    if (!b.name?.trim() || !/^\+?[\d\s()-]{9,20}$/.test(b.phone ?? ''))
      return fail(422, 'VALIDATION_ERROR', 'Проверьте имя и телефон');
    if (!isStrongPassword(b.password ?? ''))
      return fail(422, 'VALIDATION_ERROR', 'Пароль: от 8 символов, буквы и цифры');
    const digits = b.phone.replace(/\D/g, '').slice(-9);
    if (
      db.users.some((u) => u.role === 'student' && u.phone.replace(/\D/g, '').slice(-9) === digits)
    )
      return fail(409, 'CONFLICT', 'Ученик с этим телефоном уже есть — он входит по нему');
    const group = db.groups.find((g) => g.id === b.groupId && g.branchId === BRANCH);
    const now = new Date().toISOString();
    const u: UserListItem = {
      id: `u_new_${Date.now()}`,
      name: b.name.trim(),
      email: '',
      phone: b.phone.trim(),
      role: 'student',
      branchId: BRANCH,
      branchName: 'Душанбе',
      groupId: group?.id ?? null,
      groupName: group?.name ?? null,
      progress: 0,
      xp: 0,
      groupsCount: 0,
      studentsCount: 0,
      lastActiveAt: now,
      createdAt: now,
      isBlocked: false,
    };
    db.users.unshift(u);
    if (group) group.studentsCount++;
    setPassword(u.id, b.password);
    const lead = b.leadId ? allLeads().find((l) => l.id === b.leadId) : undefined;
    if (lead) lead.studentId = u.id;
    return ok(u);
  }),

  // новый пароль ученику (забыл) — потом отправить в WhatsApp
  http.post(url('/administrator/students/:id/password'), async ({ params, request }) => {
    const u = db.users.find(
      (x) => x.id === params.id && x.role === 'student' && x.branchId === BRANCH,
    );
    if (!u) return fail(404, 'ENTITY_NOT_FOUND', 'Ученик не найден');
    const { password } = (await request.json()) as { password: string };
    if (!isStrongPassword(password ?? ''))
      return fail(422, 'VALIDATION_ERROR', 'Пароль: от 8 символов, буквы и цифры');
    setPassword(u.id, password);
    return ok(u);
  }),

  // записались через отдел продаж, но аккаунта ещё нет
  http.get(url(ENDPOINTS.administrator.wonLeads), () =>
    ok(allLeads().filter((l) => l.branchId === BRANCH && l.status === 'won' && !l.studentId)),
  ),

  // --- оплаты за месяц ---
  http.get(url(ENDPOINTS.administrator.payments), ({ request }) => {
    const month = query(request).get('month') ?? new Date().toISOString().slice(0, 7);
    const pays = allPayments().filter((p) => p.month === month);
    const rows: PaymentRow[] = db.users
      .filter((u) => u.branchId === BRANCH && u.role === 'student' && !u.isBlocked)
      .map((u) => {
        const mine = pays
          .filter((p) => p.studentId === u.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const paid = mine.reduce((s, p) => s + p.amount, 0);
        return {
          studentId: u.id,
          name: u.name,
          phone: u.phone,
          groupName: u.groupName,
          paid,
          state: paid >= MONTHLY_FEE ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
          payments: mine,
        };
      });
    return ok({
      month,
      fee: MONTHLY_FEE,
      rows,
      collected: rows.reduce((s, r) => s + r.paid, 0),
      expected: rows.length * MONTHLY_FEE,
    });
  }),
  http.post(url(ENDPOINTS.administrator.payments), async ({ request }) => {
    const me = resolveMe(request.headers.get('X-Mock-User'), roleOf(request));
    const b = (await request.json()) as {
      studentId: string;
      month: string;
      amount: number;
      method: PaymentMethod;
      note?: string;
    };
    const u = db.users.find(
      (x) => x.id === b.studentId && x.role === 'student' && x.branchId === BRANCH,
    );
    if (!u) return fail(404, 'ENTITY_NOT_FOUND', 'Ученик не найден');
    if (!(b.amount > 0) || b.amount > 100000)
      return fail(422, 'VALIDATION_ERROR', 'Неверная сумма');
    if (!/^\d{4}-\d{2}$/.test(b.month)) return fail(422, 'VALIDATION_ERROR', 'Неверный месяц');
    const p: Payment = {
      id: `pay_${Date.now()}`,
      studentId: u.id,
      studentName: u.name,
      month: b.month,
      amount: Math.round(b.amount),
      method: b.method,
      note: b.note?.trim() ?? '',
      receivedByName: me.name,
      createdAt: new Date().toISOString(),
    };
    allPayments().push(p);
    return ok(p);
  }),
];
