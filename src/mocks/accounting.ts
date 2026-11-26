import type { Role } from '@/core/auth/roles';
import type {
  AccountantReport,
  BranchEmployee,
  ReportExpense,
  SalaryLine,
} from '@/core/types/models';
import { db } from './db';
import { rangeRevenue } from './finance';
import { allPayments } from './payments';

/**
 * Отчёт бухгалтера директору (филиал Душанбе) за период, который бухгалтер выбрал сам:
 * приход — из оплат, расходы вписывает бухгалтер.
 * Принятый отчёт подставляется в отчёт директора SuperAdmin за месяц даты «по».
 */
export const ACC_BRANCH = 'branch_dushanbe';
export const accountantReports: AccountantReport[] = [];

/** «2026-11-26» по местному времени */
export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const periodIncome = (from: string, to: string) => {
  const pays = allPayments().filter((p) => {
    const day = isoDay(new Date(p.createdAt));
    return day >= from && day <= to;
  });
  // та же выручка, что видит директор и SuperAdmin
  return { income: rangeRevenue(ACC_BRANCH, from, to), paymentsCount: pays.length };
};

const DEFAULT_EXPENSES: [ReportExpense['category'], number, string][] = [
  ['rent', 8000, 'Аренда помещения'],
  ['utilities', 1150, 'Свет, вода, интернет'],
  ['ads', 1800, 'Реклама в Instagram'],
];

const STAFF_ROLES: Role[] = [
  'director',
  'administrator',
  'accountant',
  'mentor',
  'sales',
  'cleaner',
];
/** демо-оклады, чтобы первый отчёт не был пустым — бухгалтер меняет на реальные */
const DEMO_SALARY: Partial<Record<Role, number>> = {
  director: 6000,
  administrator: 3000,
  accountant: 3500,
  mentor: 4000,
  sales: 2500,
  cleaner: 1500,
};

/** Сотрудники филиала по порядку ролей */
export const branchEmployees = (): BranchEmployee[] =>
  db.users
    .filter((u) => u.branchId === ACC_BRANCH && STAFF_ROLES.includes(u.role) && !u.isBlocked)
    .sort(
      (a, b) =>
        STAFF_ROLES.indexOf(a.role) - STAFF_ROLES.indexOf(b.role) || a.name.localeCompare(b.name),
    )
    .map((u) => ({ id: u.id, name: u.name, role: u.role }));

export const salaryTotal = (r: Pick<AccountantReport, 'salaries'>) =>
  r.salaries.reduce((s, x) => s + (Number(x.amount) || 0), 0);

export function newAccountantReport(
  dateFrom: string,
  dateTo: string,
  accountantName: string,
): AccountantReport {
  const prev = [...accountantReports].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const now = new Date().toISOString();
  return {
    id: `accrep_${dateFrom}_${Date.now()}`,
    branchId: ACC_BRANCH,
    month: dateTo.slice(0, 7),
    dateFrom,
    dateTo,
    status: 'draft',
    accountantName,
    ...periodIncome(dateFrom, dateTo),
    expenses: prev
      ? prev.expenses
          .filter((e) => e.category !== 'salary')
          .map((e, i) => ({ ...e, id: `aexp_${Date.now()}_${i}` }))
      : DEFAULT_EXPENSES.map(([category, amount, note], i) => ({
          id: `aexp_${Date.now()}_${i}`,
          category,
          amount,
          note,
        })),
    // зарплаты: как в прошлом отчёте, иначе — все сотрудники филиала с демо-окладом
    salaries: prev
      ? prev.salaries.map((x, i) => ({ ...x, id: `sal_${Date.now()}_${i}` }))
      : branchEmployees().map(
          (e, i): SalaryLine => ({
            id: `sal_${Date.now()}_${i}`,
            employeeId: e.id,
            employeeName: e.name,
            role: e.role,
            amount: DEMO_SALARY[e.role] ?? 0,
            note: '',
          }),
        ),
    comment: '',
    directorComment: null,
    createdAt: now,
    sentAt: null,
    reviewedAt: null,
  };
}

// демо: за весь прошлый месяц отчёт уже принят директором
(() => {
  const t = new Date();
  const from = isoDay(new Date(t.getFullYear(), t.getMonth() - 1, 1));
  const to = isoDay(new Date(t.getFullYear(), t.getMonth(), 0));
  const r = newAccountantReport(from, to, 'Бухгалтер');
  const d = new Date();
  d.setDate(2);
  r.id = `accrep_${from}_seed`;
  r.status = 'accepted';
  r.comment = 'Все оплаты сверены с чеками.';
  r.createdAt = r.sentAt = d.toISOString();
  r.reviewedAt = d.toISOString();
  r.directorComment = 'Принято, спасибо.';
  accountantReports.push(r);
})();

/** Последний принятый директором отчёт бухгалтера, у которого дата «по» в этом месяце */
export const acceptedAccountantReport = (month: string) =>
  accountantReports
    .filter((r) => r.month === month && r.status === 'accepted')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
