import type { Role } from '@/core/auth/roles';
import type {
  AccountantReport,
  BranchEmployee,
  ExpenseCategory,
  ExpenseEntry,
  ExpenseMethod,
  ReportExpense,
  SalaryLine,
} from '@/core/types/models';
import { db } from './db';
import { rangeRevenue } from './finance';
import { allPayments } from './payments';

/**
 * Бухгалтерия филиала Душанбе.
 * Журнал расходов: каждая выплата зарплаты и каждая покупка записывается отдельно.
 * Отчёт бухгалтера директору за период собирает расходы из журнала сам,
 * приход — из оплат. Принятый отчёт подставляется в отчёт директора SuperAdmin.
 */
export const ACC_BRANCH = 'branch_dushanbe';
export const accountantReports: AccountantReport[] = [];
export const expenseEntries: ExpenseEntry[] = [];

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

// ---------- Сотрудники ----------
const STAFF_ROLES: Role[] = [
  'director',
  'administrator',
  'accountant',
  'mentor',
  'sales',
  'cleaner',
];
/** демо-оклады для примера в журнале */
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

// ---------- Журнал расходов ----------
/** Дата попала в период отчёта, который уже у директора (отправлен или принят) */
export const isLocked = (date: string) =>
  accountantReports.some(
    (r) =>
      (r.status === 'sent' || r.status === 'accepted') && date >= r.dateFrom && date <= r.dateTo,
  );

export const withLock = (e: ExpenseEntry): ExpenseEntry => ({ ...e, locked: isLocked(e.date) });

let entryCounter = 0;
export function addExpense(
  e: Omit<ExpenseEntry, 'id' | 'branchId' | 'createdAt' | 'locked'>,
): ExpenseEntry {
  const entry: ExpenseEntry = {
    ...e,
    id: `exp_entry_${++entryCounter}`,
    branchId: ACC_BRANCH,
    createdAt: new Date().toISOString(),
    locked: false,
  };
  expenseEntries.push(entry);
  return entry;
}

/** Расходы периода, собранные для отчёта: зарплаты по сотрудникам, остальное по категориям */
export function journalFor(from: string, to: string) {
  const list = expenseEntries
    .filter((e) => e.date >= from && e.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
  const salaries = new Map<string, SalaryLine>();
  const count = new Map<string, number>();
  const other = new Map<ExpenseCategory, ReportExpense & { items: string[] }>();
  for (const e of list) {
    if (e.category === 'salary' && e.employeeId) {
      const cur = salaries.get(e.employeeId);
      count.set(e.employeeId, (count.get(e.employeeId) ?? 0) + 1);
      if (cur) cur.amount += e.amount;
      else
        salaries.set(e.employeeId, {
          id: `sal_${e.employeeId}`,
          employeeId: e.employeeId,
          employeeName: e.employeeName ?? '',
          role: e.employeeRole ?? 'mentor',
          amount: e.amount,
          note: '',
        });
    } else {
      const cur = other.get(e.category);
      if (cur) {
        cur.amount += e.amount;
        cur.items.push(e.description);
      } else
        other.set(e.category, {
          id: `rexp_${e.category}`,
          category: e.category,
          amount: e.amount,
          note: '',
          items: [e.description],
        });
    }
  }
  for (const s of salaries.values()) {
    const n = count.get(s.employeeId) ?? 1;
    if (n > 1) s.note = `${n} выплаты`;
  }
  const short = (xs: string[]) => {
    const uniq = [...new Set(xs.filter(Boolean))];
    const txt = uniq.slice(0, 3).join(', ');
    return uniq.length > 3 ? `${txt} и ещё ${uniq.length - 3}` : txt;
  };
  return {
    salaries: [...salaries.values()],
    expenses: [...other.values()].map(({ items, ...x }) => ({ ...x, note: short(items) })),
  };
}

/** Пересобрать цифры черновика: приход из оплат, расходы из журнала */
export const refreshReport = (r: AccountantReport) =>
  Object.assign(r, periodIncome(r.dateFrom, r.dateTo), journalFor(r.dateFrom, r.dateTo));

export function newAccountantReport(
  dateFrom: string,
  dateTo: string,
  accountantName: string,
): AccountantReport {
  return {
    id: `accrep_${dateFrom}_${Date.now()}`,
    branchId: ACC_BRANCH,
    month: dateTo.slice(0, 7),
    dateFrom,
    dateTo,
    status: 'draft',
    accountantName,
    ...periodIncome(dateFrom, dateTo),
    ...journalFor(dateFrom, dateTo),
    comment: '',
    directorComment: null,
    createdAt: new Date().toISOString(),
    sentAt: null,
    reviewedAt: null,
  };
}

// ---------- Демо-данные: журнал за прошлый и текущий месяц ----------
(() => {
  const now = new Date();
  const today = isoDay(now);
  const staff = branchEmployees();
  const accName = staff.find((s) => s.role === 'accountant')?.name ?? 'Бухгалтер';
  for (const back of [1, 0]) {
    const day = (d: number) => isoDay(new Date(now.getFullYear(), now.getMonth() - back, d));
    const add = (
      d: number,
      category: ExpenseCategory,
      amount: number,
      description: string,
      method: ExpenseMethod,
      emp?: BranchEmployee,
    ) => {
      if (day(d) > today) return;
      addExpense({
        date: day(d),
        category,
        amount,
        description,
        method,
        employeeId: emp?.id ?? null,
        employeeName: emp?.name ?? null,
        employeeRole: emp?.role ?? null,
        createdBy: accName,
      });
    };
    add(1, 'rent', 8000, 'Аренда помещения, ул. Рудаки 45', 'transfer');
    add(3, 'purchase', 240, 'Маркеры и бумага для досок', 'cash');
    staff.forEach((s) =>
      add(5, 'salary', DEMO_SALARY[s.role] ?? 0, 'Зарплата за месяц', 'card', s),
    );
    add(10, 'utilities', 1150, 'Свет, вода, интернет', 'transfer');
    add(12, 'ads', 1800, 'Реклама в Instagram', 'card');
    add(15, 'purchase', 180, 'Вода для кулера', 'cash');
    if (back === 1) add(20, 'equipment', 650, 'Роутер TP-Link для кабинета 3', 'cash');
  }
})();

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
