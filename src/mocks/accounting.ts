import type { AccountantReport, ReportExpense } from '@/core/types/models';
import { monthRevenue } from './finance';
import { allPayments } from './payments';
import { monthKey } from './reports';

/**
 * Отчёт бухгалтера директору (филиал Душанбе): приход — из оплат администратора,
 * расходы вписывает бухгалтер. Принятый отчёт подставляется в отчёт директора SuperAdmin.
 */
export const ACC_BRANCH = 'branch_dushanbe';
export const accountantReports: AccountantReport[] = [];

export const monthIncome = (month: string) => {
  const pays = allPayments().filter((p) => p.month === month);
  // та же сумма, что видит директор и SuperAdmin
  return { income: monthRevenue(ACC_BRANCH, month), paymentsCount: pays.length };
};

const DEFAULT_EXPENSES: [ReportExpense['category'], number, string][] = [
  ['rent', 8000, 'Аренда помещения'],
  ['salary', 32000, 'Зарплаты сотрудников'],
  ['utilities', 1150, 'Свет, вода, интернет'],
  ['ads', 1800, 'Реклама в Instagram'],
];

export function newAccountantReport(month: string, accountantName: string): AccountantReport {
  const prev = [...accountantReports].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const now = new Date().toISOString();
  return {
    id: `accrep_${month}_${Date.now()}`,
    branchId: ACC_BRANCH,
    month,
    status: 'draft',
    accountantName,
    ...monthIncome(month),
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

// демо: за прошлый месяц отчёт уже принят директором
(() => {
  const r = newAccountantReport(monthKey(1), 'Бухгалтер');
  const d = new Date();
  d.setDate(2);
  r.id = `accrep_${monthKey(1)}_seed`;
  r.status = 'accepted';
  r.comment = 'Все оплаты сверены с чеками.';
  r.createdAt = r.sentAt = d.toISOString();
  r.reviewedAt = d.toISOString();
  r.directorComment = 'Принято, спасибо.';
  accountantReports.push(r);
})();

/** Последний принятый директором отчёт бухгалтера за месяц — основа отчёта директора */
export const acceptedAccountantReport = (month: string) =>
  accountantReports
    .filter((r) => r.month === month && r.status === 'accepted')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
