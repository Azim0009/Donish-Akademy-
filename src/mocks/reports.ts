import type { Branch, BranchReport, ExpenseCategory, ReportMetrics } from '@/core/types/models';
import { monthRevenue } from './finance';

/** «2026-11» для сдвига в месяцах от текущего */
export const monthKey = (back = 0) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - back);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/** Показатели филиала за месяц. У демо-филиала (Душанбе) — живые данные, у остальных — из сводки филиала */
export function branchMetrics(b: Branch, live?: Partial<ReportMetrics>): ReportMetrics {
  const s = live?.students ?? b.studentsCount;
  return {
    students: s,
    newStudents: live?.newStudents ?? Math.round(s * (0.06 + rnd() * 0.08)),
    leftStudents: live?.leftStudents ?? Math.round(s * (0.01 + rnd() * 0.03)),
    groups: live?.groups ?? b.groupsCount,
    mentors: live?.mentors ?? b.mentorsCount,
    avgProgress: live?.avgProgress ?? b.completionRate,
    paidStudents: live?.paidStudents ?? Math.round(s * (0.8 + rnd() * 0.15)),
  };
}

/** Типичные расходы филиала (директор правит сам) */
export function defaultExpenses(b: Branch): BranchReport['expenses'] {
  const big = b.studentsCount > 150;
  const rows: [ExpenseCategory, number, string][] = [
    ['rent', big ? 9000 : 4500, 'Аренда помещения'],
    ['salary', Math.max(1, b.mentorsCount) * 3500 + 2500, 'Менторы и администратор'],
    ['utilities', big ? 1200 : 700, 'Свет, интернет, вода'],
    ['ads', big ? 2500 : 1200, 'Instagram, таргет'],
  ];
  return rows.map(([category, amount, note], i) => ({
    id: `exp_${i}`,
    category,
    amount: Math.round(amount * (0.9 + rnd() * 0.2)),
    note,
  }));
}

const TEXT = {
  achievements: [
    'Набрали новую вечернюю группу, все места заняты.',
    'Провели день открытых дверей — 40 гостей, 9 записались.',
    'Ученики группы FS-02 сделали первый реальный проект для клиента.',
  ],
  problems: [
    'Два ментора часто опаздывают на вечерние уроки.',
    'Не хватает ноутбуков для практики — ученики приходят со своими.',
    'Интернет в здании пропадает по вечерам.',
  ],
  plans: [
    'Открыть ещё одну группу на утро.',
    'Запустить рекламу в Instagram перед новым потоком.',
    'Провести хакатон между группами в конце месяца.',
  ],
};
const pick = (a: string[]) => a[Math.floor(rnd() * a.length)];

export function makeReport(
  b: Branch,
  month: string,
  status: BranchReport['status'],
  ageDays: number,
  live?: Partial<ReportMetrics>,
): BranchReport {
  const at = new Date(Date.now() - ageDays * 86400000).toISOString();
  return {
    id: `rep_${b.id}_${month}`,
    branchId: b.id,
    branchName: b.name,
    directorName: b.directorName ?? '—',
    month,
    status,
    metrics: branchMetrics(b, live),
    income: monthRevenue(b.id, month),
    expenses: defaultExpenses(b),
    achievements: status === 'draft' ? '' : pick(TEXT.achievements),
    problems: status === 'draft' ? '' : pick(TEXT.problems),
    plans: status === 'draft' ? '' : pick(TEXT.plans),
    reviewComment:
      status === 'returned'
        ? 'Расходы на зарплату выше, чем в прошлом месяце, — распишите, кому и за что. Остальное ок.'
        : status === 'accepted'
          ? null
          : null,
    createdAt: at,
    updatedAt: at,
    sentAt: status === 'draft' ? null : at,
    reviewedAt:
      status === 'accepted' || status === 'returned'
        ? new Date(Date.now() - Math.max(0, ageDays - 1) * 86400000).toISOString()
        : null,
  };
}

/** Демо-отчёты: 2 прошлых месяца приняты, текущий — часть филиалов уже прислала */
export function seedReports(
  branches: Branch[],
  live: Record<string, Partial<ReportMetrics>> = {},
): BranchReport[] {
  const active = branches.filter((b) => b.status === 'active' && b.studentsCount > 0);
  const out: BranchReport[] = [];
  active.forEach((b, i) => {
    // прошлые месяцы демо-филиала — от живых цифр, чтобы сравнение было честным
    const l = live[b.id];
    const past = (k: number) =>
      l && {
        ...l,
        students: (l.students ?? 0) - k * 3,
        groups: l.groups,
        avgProgress: (l.avgProgress ?? 0) - k * 6,
      };
    out.push(makeReport(b, monthKey(2), 'accepted', 50 - i, past(2)));
    const oct =
      b.id === 'branch_kulob' ? 'returned' : b.id === 'branch_khorog' ? 'sent' : 'accepted';
    out.push(makeReport(b, monthKey(1), oct, 19 - i, past(1)));
    // текущий месяц: Душанбе (демо-директор) ещё не сдавал — пусть попробует сам
    if (b.id === 'branch_khujand' || b.id === 'branch_bokhtar')
      out.push(makeReport(b, monthKey(0), 'sent', 1 + i * 0.2));
  });
  return out;
}
