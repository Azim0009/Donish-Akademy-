import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ExpenseEntry } from '@/core/types/models';
import { EXPENSE_CATEGORIES } from '@/shared/lib/reports';
import {
  ACC_BRANCH,
  accountantReports,
  addExpense,
  branchEmployees,
  expenseEntries,
  isLocked,
  isoDay,
  newAccountantReport,
  refreshReport,
  withLock,
} from '../accounting';
import { resolveMe } from '../tasks';
import { fail, ok, roleOf, url } from './utils';

const isAcc = (r: Request) => roleOf(r) === 'accountant';
const LOCKED = 'Этот период уже в отчёте у директора — запись менять нельзя';
const METHODS = ['cash', 'card', 'transfer'];

type ExpenseInput = Pick<
  ExpenseEntry,
  'date' | 'category' | 'amount' | 'description' | 'method' | 'employeeId'
>;
/** Проверка записи журнала; для зарплаты подставляем имя и роль сотрудника */
function checkExpense(b: ExpenseInput) {
  const bad = (msg: string) => ({ error: fail(422, 'VALIDATION_ERROR', msg) });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date ?? '')) return bad('Укажите дату');
  if (b.date > isoDay(new Date())) return bad('Дата не может быть в будущем');
  if (isLocked(b.date)) return { error: fail(409, 'CONFLICT', LOCKED) };
  if (!EXPENSE_CATEGORIES.includes(b.category)) return bad('Выберите категорию');
  const amount = Math.round(Number(b.amount));
  if (!(amount > 0)) return bad('Сумма должна быть больше нуля');
  if (!METHODS.includes(b.method)) return bad('Выберите способ оплаты');
  const description = (b.description ?? '').trim();
  let emp = null;
  if (b.category === 'salary') {
    emp = branchEmployees().find((x) => x.id === b.employeeId);
    if (!emp) return bad('Выберите сотрудника');
  } else if (description.length < 2) return bad('Напишите, за что заплатили');
  return {
    data: {
      date: b.date,
      category: b.category,
      amount,
      description,
      method: b.method,
      employeeId: emp?.id ?? null,
      employeeName: emp?.name ?? null,
      employeeRole: emp?.role ?? null,
    },
  };
}
const isDir = (r: Request) => roleOf(r) === 'director';

export const accountingHandlers = [
  // --- Бухгалтер ---
  http.get(url(ENDPOINTS.accounting.reports), ({ request }) => {
    if (!isAcc(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    // черновики пересобираем: могли появиться новые оплаты и записи в журнале расходов
    accountantReports
      .filter((r) => r.status === 'draft' || r.status === 'returned')
      .forEach(refreshReport);
    return ok([...accountantReports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }),
  http.post(url(ENDPOINTS.accounting.reports), async ({ request }) => {
    if (!isAcc(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    const { dateFrom, dateTo } = (await request.json()) as { dateFrom: string; dateTo: string };
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(dateFrom ?? '') || !re.test(dateTo ?? ''))
      return fail(422, 'VALIDATION_ERROR', 'Выберите даты «с» и «по»');
    if (dateFrom > dateTo) return fail(422, 'VALIDATION_ERROR', 'Дата «с» позже даты «по»');
    if (dateTo > isoDay(new Date()))
      return fail(422, 'VALIDATION_ERROR', 'Дата «по» не может быть в будущем');
    const me = resolveMe(request.headers.get('X-Mock-User'), 'accountant');
    const r = newAccountantReport(dateFrom, dateTo, me.name);
    accountantReports.push(r);
    return ok(r, 201);
  }),
  http.put(url('/accountant/reports/:id'), async ({ params, request }) => {
    if (!isAcc(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    const r = accountantReports.find((x) => x.id === params.id);
    if (!r) return fail(404, 'ENTITY_NOT_FOUND', 'Отчёт не найден');
    if (r.status === 'sent' || r.status === 'accepted')
      return fail(409, 'CONFLICT', 'Отправленный отчёт нельзя менять');
    // расходы в отчёт идут из журнала «Расходы», здесь меняется только комментарий
    const b = (await request.json()) as { comment: string };
    r.comment = (b.comment ?? '').trim();
    return ok(r);
  }),
  // --- Журнал расходов ---
  http.get(url(ENDPOINTS.accounting.expenses), ({ request }) => {
    if (!isAcc(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    return ok(
      expenseEntries
        .map(withLock)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    );
  }),
  http.post(url(ENDPOINTS.accounting.expenses), async ({ request }) => {
    if (!isAcc(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    const v = checkExpense((await request.json()) as ExpenseInput);
    if ('error' in v) return v.error;
    const me = resolveMe(request.headers.get('X-Mock-User'), 'accountant');
    return ok(withLock(addExpense({ ...v.data, createdBy: me.name })), 201);
  }),
  http.put(url('/accountant/expenses/:id'), async ({ params, request }) => {
    if (!isAcc(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    const e = expenseEntries.find((x) => x.id === params.id);
    if (!e) return fail(404, 'ENTITY_NOT_FOUND', 'Запись не найдена');
    if (isLocked(e.date)) return fail(409, 'CONFLICT', LOCKED);
    const v = checkExpense((await request.json()) as ExpenseInput);
    if ('error' in v) return v.error;
    Object.assign(e, v.data);
    return ok(withLock(e));
  }),
  http.delete(url('/accountant/expenses/:id'), ({ params, request }) => {
    if (!isAcc(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    const i = expenseEntries.findIndex((x) => x.id === params.id);
    if (i < 0) return fail(404, 'ENTITY_NOT_FOUND', 'Запись не найдена');
    if (isLocked(expenseEntries[i].date)) return fail(409, 'CONFLICT', LOCKED);
    expenseEntries.splice(i, 1);
    return ok({ id: params.id });
  }),
  http.get(url(ENDPOINTS.accounting.employees), ({ request }) => {
    if (!isAcc(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    return ok(branchEmployees());
  }),
  http.post(url('/accountant/reports/:id/send'), ({ params, request }) => {
    if (!isAcc(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    const r = accountantReports.find((x) => x.id === params.id);
    if (!r) return fail(404, 'ENTITY_NOT_FOUND', 'Отчёт не найден');
    if (r.status === 'sent' || r.status === 'accepted')
      return fail(409, 'CONFLICT', 'Отчёт уже отправлен');
    Object.assign(refreshReport(r), {
      status: 'sent',
      sentAt: new Date().toISOString(),
      directorComment: null,
    });
    return ok(r);
  }),

  // --- Директор: принять или вернуть ---
  http.get(url(ENDPOINTS.accounting.directorList), ({ request }) => {
    if (!isDir(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    return ok(
      accountantReports
        .filter((r) => r.branchId === ACC_BRANCH && r.status !== 'draft')
        .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? '')),
    );
  }),
  http.post(url('/director/accountant-reports/:id/review'), async ({ params, request }) => {
    if (!isDir(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    const r = accountantReports.find((x) => x.id === params.id && x.status === 'sent');
    if (!r) return fail(404, 'ENTITY_NOT_FOUND', 'Отчёт не найден или уже рассмотрен');
    const { accept, comment } = (await request.json()) as { accept: boolean; comment?: string };
    if (!accept && !comment?.trim())
      return fail(422, 'VALIDATION_ERROR', 'Напишите, что исправить');
    Object.assign(r, {
      status: accept ? 'accepted' : 'returned',
      directorComment: comment?.trim() || null,
      reviewedAt: new Date().toISOString(),
    });
    return ok(r);
  }),
];
