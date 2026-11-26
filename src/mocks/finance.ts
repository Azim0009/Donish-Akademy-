import type { Branch, BranchFinance } from '@/core/types/models';

/**
 * Демо-финансы: оплаты по дням за последние 180 дней (TJS) для каждого филиала.
 * Потом заменится реальными оплатами из CRM / бэкенда.
 */
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const DAYS = 180;
const daily: Record<string, number[]> = {};

export function initFinance(branches: Branch[]) {
  for (const b of branches) {
    if (b.status === 'draft' || b.studentsCount === 0) {
      daily[b.id] = Array(DAYS).fill(0);
      continue;
    }
    // средний платёж ≈ 600 TJS в месяц за ученика, оплаты распределены по дням, растут со временем
    const base = (b.studentsCount * 600) / 30;
    daily[b.id] = Array.from({ length: DAYS }, (_, i) => {
      const growth = 0.75 + (i / DAYS) * 0.35;
      const off = b.status === 'suspended' && i > DAYS - 21 ? 0.1 : 1;
      return Math.round(base * growth * off * (0.55 + rnd() * 0.9));
    });
  }
}

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
/** выручка за последние `days` дней (offset — сдвиг назад, для прошлого периода) */
export const revenue = (branchId: string, days: number, offset = 0) => {
  const d = daily[branchId] ?? [];
  return sum(d.slice(Math.max(0, d.length - days - offset), d.length - offset));
};
/** выручка филиала за даты «2026-11-01» … «2026-11-26» включительно */
export function rangeRevenue(branchId: string, from: string, to: string) {
  const day = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = Math.min(day(to), today.getTime());
  const days = Math.round((last - day(from)) / 86400000) + 1;
  const offset = Math.round((today.getTime() - last) / 86400000);
  return days > 0 ? revenue(branchId, days, offset) : 0;
}
export const pct = (cur: number, prev: number) =>
  prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0;

export function branchFinance(branches: Branch[], days: number): BranchFinance[] {
  return branches
    .map((b) => {
      const cur = revenue(b.id, days);
      const prev = revenue(b.id, days, days);
      return {
        branchId: b.id,
        name: b.name,
        status: b.status,
        revenue: cur,
        previous: prev,
        delta: pct(cur, prev),
        students: b.studentsCount,
        paidStudents: Math.round(b.studentsCount * (b.status === 'active' ? 0.86 : 0.4)),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/** выручка сети по дням (для графика) */
export function networkDaily(branchIds: string[], days: number) {
  return Array.from({ length: days }, (_, i) => {
    const idx = DAYS - days + i;
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      label: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      revenue: sum(branchIds.map((id) => daily[id]?.[idx] ?? 0)),
    };
  });
}

/** Выручка филиала за календарный месяц «2026-11» (для текущего месяца — по сегодняшний день) */
export function monthRevenue(branchId: string, month: string) {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0); // последний день месяца
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = end < today ? end : today;
  const dayMs = 86400000;
  const offset = Math.round((today.getTime() - last.getTime()) / dayMs);
  const days = Math.round((last.getTime() - start.getTime()) / dayMs) + 1;
  return days > 0 ? revenue(branchId, days, offset) : 0;
}
