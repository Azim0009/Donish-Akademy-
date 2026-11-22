import type { BadgeTone } from '@/shared/ui';
import type { BranchReport, ExpenseCategory, ReportStatus } from '@/core/types/models';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'rent',
  'salary',
  'utilities',
  'ads',
  'equipment',
  'other',
];
export const reportStatusTone: Record<ReportStatus, BadgeTone> = {
  draft: 'gray',
  sent: 'blue',
  accepted: 'green',
  returned: 'amber',
};

export const totalExpenses = (r: Pick<BranchReport, 'expenses'>) =>
  r.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
export const profit = (r: Pick<BranchReport, 'expenses' | 'income'>) => r.income - totalExpenses(r);
export const canEditReport = (r: BranchReport) => r.status === 'draft' || r.status === 'returned';

/** «2026-11» за последние n месяцев, начиная с текущего */
export const lastMonths = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
