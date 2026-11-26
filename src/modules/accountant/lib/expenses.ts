import type { ExpenseMethod } from '@/core/types/models';

export const EXPENSE_METHODS: ExpenseMethod[] = ['cash', 'card', 'transfer'];

/** «2026-11-26» по местному времени */
export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
