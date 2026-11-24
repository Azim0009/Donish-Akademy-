import type { TFunction } from 'i18next';
import type { WeekScore } from '@/core/types/models';
import { monthResult, weekParts, weekTotal } from '@/shared/lib/scoring';

/** Текст для WhatsApp: баллы недели + средний за месяц (как в CRM Donish) */
export function weekWaText(
  t: TFunction,
  p: {
    name: string;
    group: string;
    month: number;
    week: number;
    row: WeekScore | null;
    weeks: (WeekScore | null)[];
  },
) {
  const parts = weekParts(p.row);
  const r = monthResult(p.weeks);
  return t('scores.waWeek', {
    name: p.name,
    group: p.group,
    week: p.week,
    month: p.month,
    total: weekTotal(p.row),
    att: parts.att,
    hw: parts.hw,
    bonus: parts.bonus,
    exam: parts.exam,
    pace: r.pace ?? 0,
  });
}
