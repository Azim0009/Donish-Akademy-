import type { BadgeTone } from '@/shared/ui';
import type { ExtraExam, WeekScore } from '@/core/types/models';

/**
 * Правила баллов как в CRM Donish.
 * Неделя = 3 урока, максимум 100:
 *   посещение 3 × 2 = 6 (пришёл 2, опоздал 1, нет 0) · ДЗ 3 × 10 = 30 · бонус до 14 · экзамен недели до 50
 * Итог месяца = (неделя 1 + 2 + 3 + 4) ÷ 4:
 *   80+ — переходит · 75–79 — доп. экзамен · < 75 — повтор месяца
 */
export const MAX = { att: 2, hw: 10, bonus: 14, exam: 50, week: 100 } as const;
export const PASS = 80;
export const EXTRA_MIN = 75;
export const WEEKS = 4;
export const MONTHS = 3;
export const LESSONS = [1, 2, 3] as const;
export const SCORE_KEYS = ['a1', 'a2', 'a3', 'h1', 'h2', 'h3', 'bonus', 'exam'] as const;
export type ScoreKey = (typeof SCORE_KEYS)[number];

/** Предел для каждого поля */
export const limitOf = (k: ScoreKey) =>
  k.startsWith('a') ? MAX.att : k.startsWith('h') ? MAX.hw : k === 'bonus' ? MAX.bonus : MAX.exam;

/** Привести ввод к допустимому значению (пусто → null) */
export const clampScore = (k: ScoreKey, v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(limitOf(k), n));
};

const n = (v: number | null | undefined) => (typeof v === 'number' ? v : 0);

export const weekParts = (w?: Partial<WeekScore> | null) => ({
  att: w ? n(w.a1) + n(w.a2) + n(w.a3) : 0,
  hw: w ? n(w.h1) + n(w.h2) + n(w.h3) : 0,
  bonus: w ? n(w.bonus) : 0,
  exam: w ? n(w.exam) : 0,
});

export const weekTotal = (w?: Partial<WeekScore> | null) => {
  const p = weekParts(w);
  return Math.min(MAX.week, p.att + p.hw + p.bonus + p.exam);
};

export const hasData = (w?: Partial<WeekScore> | null): w is Partial<WeekScore> =>
  !!w && SCORE_KEYS.some((k) => typeof w[k] === 'number');

/** Неделя завершена, когда выставлен экзамен недели (последний шаг недели) */
export const isComplete = (w?: Partial<WeekScore> | null) =>
  hasData(w) && typeof w.exam === 'number';

export type MonthStatus = 'progress' | 'pass' | 'passedExtra' | 'extra' | 'fail';

export interface MonthResult {
  /** Баллы недель (null — пусто) */
  totals: (number | null)[];
  /** Неделя завершена (есть экзамен) */
  complete: boolean[];
  /** Итог месяца: сумма 4 недель ÷ 4 */
  avg: number;
  /** Темп: средний балл по завершённым неделям */
  pace: number | null;
  /** Сколько недель завершено */
  filled: number;
  done: boolean;
  status: MonthStatus;
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const mean = (xs: number[]) =>
  xs.length ? round1(xs.reduce((s, x) => s + x, 0) / xs.length) : null;

export function monthResult(
  weeks: (Partial<WeekScore> | null | undefined)[],
  extra?: Pick<ExtraExam, 'passed'> | null,
): MonthResult {
  const list = Array.from({ length: WEEKS }, (_, i) => weeks[i] ?? null);
  const totals = list.map((w) => (hasData(w) ? weekTotal(w) : null));
  const complete = list.map((w) => isComplete(w));
  const filled = complete.filter(Boolean).length;
  const done = filled === WEEKS;
  const avg = round1(totals.reduce<number>((s, t) => s + (t ?? 0), 0) / WEEKS);
  let status: MonthStatus;
  if (!done) status = 'progress';
  else if (avg >= PASS) status = 'pass';
  else if (avg >= EXTRA_MIN) {
    if (extra?.passed === true) status = 'passedExtra';
    else if (extra?.passed === false) status = 'fail';
    else status = 'extra';
  } else status = 'fail';
  // темп — по завершённым неделям; если таких нет — по тем, где уже есть баллы
  const doneTotals = totals.filter((t, i): t is number => t !== null && complete[i]);
  const pace = mean(doneTotals.length ? doneTotals : totals.filter((t): t is number => t !== null));
  return { totals, complete, avg, pace, filled, done, status };
}

export const monthStatusTone: Record<MonthStatus, BadgeTone> = {
  progress: 'gray',
  pass: 'green',
  passedExtra: 'green',
  extra: 'amber',
  fail: 'red',
};

/** Цвет балла недели / темпа */
export const scoreTone = (v: number | null | undefined): 'pass' | 'extra' | 'fail' | 'none' =>
  v === null || v === undefined ? 'none' : v >= PASS ? 'pass' : v >= EXTRA_MIN ? 'extra' : 'fail';

export const scoreToneClass = {
  pass: 'text-brand-strong',
  extra: 'text-amber',
  fail: 'text-danger',
  none: 'text-muted',
} as const;

/** Номер урока в месяце: неделя 2, урок 1 → 4 */
export const lessonNo = (week: number, l: number) => (week - 1) * 3 + l;

/** Цвет полоски прогресса */
export const scoreBarTone = (v: number | null | undefined): 'brand' | 'amber' | 'danger' => {
  const t = scoreTone(v);
  return t === 'pass' ? 'brand' : t === 'extra' ? 'amber' : 'danger';
};
