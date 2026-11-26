import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ReportExpense, SalaryLine } from '@/core/types/models';
import { EXPENSE_CATEGORIES } from '@/shared/lib/reports';
import {
  ACC_BRANCH,
  accountantReports,
  branchEmployees,
  isoDay,
  newAccountantReport,
  periodIncome,
} from '../accounting';
import { resolveMe } from '../tasks';
import { fail, ok, roleOf, url } from './utils';

const isAcc = (r: Request) => roleOf(r) === 'accountant';
const isDir = (r: Request) => roleOf(r) === 'director';

export const accountingHandlers = [
  // --- Бухгалтер ---
  http.get(url(ENDPOINTS.accounting.reports), ({ request }) => {
    if (!isAcc(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    // приход черновиков обновляем: администратор мог принять новые оплаты
    accountantReports
      .filter((r) => r.status === 'draft' || r.status === 'returned')
      .forEach((r) => Object.assign(r, periodIncome(r.dateFrom, r.dateTo)));
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
    const b = (await request.json()) as {
      expenses: ReportExpense[];
      salaries?: SalaryLine[];
      comment: string;
    };
    if (
      !Array.isArray(b.expenses) ||
      b.expenses.some((e) => !EXPENSE_CATEGORIES.includes(e.category) || !(Number(e.amount) >= 0))
    )
      return fail(422, 'VALIDATION_ERROR', 'Проверьте расходы: категория и сумма');
    r.expenses = b.expenses.map((e) => ({
      ...e,
      amount: Math.round(Number(e.amount)),
      note: (e.note ?? '').trim(),
    }));
    if (b.salaries) {
      const staff = new Map(branchEmployees().map((e) => [e.id, e]));
      if (
        !Array.isArray(b.salaries) ||
        b.salaries.some((x) => !staff.has(x.employeeId) || !(Number(x.amount) >= 0))
      )
        return fail(422, 'VALIDATION_ERROR', 'Проверьте зарплаты: сотрудник и сумма');
      r.salaries = b.salaries.map((x) => {
        const e = staff.get(x.employeeId)!;
        return {
          id: x.id,
          employeeId: e.id,
          employeeName: e.name,
          role: e.role,
          amount: Math.round(Number(x.amount)),
          note: (x.note ?? '').trim(),
        };
      });
    }
    r.comment = (b.comment ?? '').trim();
    return ok(r);
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
    Object.assign(r, periodIncome(r.dateFrom, r.dateTo), {
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
