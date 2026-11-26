import type { AccountantReport, ReportExpense } from '@/core/types/models';
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
  ['salary', 32000, 'Зарплаты сотрудников'],
  ['utilities', 1150, 'Свет, вода, интернет'],
  ['ads', 1800, 'Реклама в Instagram'],
];

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
      ? prev.expenses.map((e, i) => ({ ...e, id: `aexp_${Date.now()}_${i}` }))
      : DEFAULT_EXPENSES.map(([category, amount, note], i) => ({
          id: `aexp_${Date.now()}_${i}`,
          category,
          amount,
          note,
        })),
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
