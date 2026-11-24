import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GroupScores, WeekScore } from '@/core/types/models';
import { clampScore, type ScoreKey } from '@/shared/lib/scoring';
import { toast } from '@/shared/ui';
import { useSaveWeekScore } from '../../api/mentorApi';

export type SaveState = 'saving' | 'saved' | 'error';
export const rowKey = (studentId: string, week: number) => `${studentId}-${week}`;

const empty = (studentId: string, month: number, week: number): WeekScore => ({
  studentId,
  month,
  week,
  a1: null,
  a2: null,
  a3: null,
  h1: null,
  h2: null,
  h3: null,
  bonus: null,
  exam: null,
});

/**
 * Локальное состояние журнала: правки видны сразу,
 * сохраняются сами через 0,5 с после последнего ввода (как в CRM Donish).
 */
export function useJournal(data: GroupScores | undefined) {
  const { t } = useTranslation();
  const save = useSaveWeekScore();
  const saveRef = useRef(save);
  saveRef.current = save;
  const [rows, setRows] = useState<Record<string, WeekScore>>({});
  const [status, setStatus] = useState<Record<string, SaveState>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pending = useRef<Record<string, WeekScore>>({});
  const month = data?.month ?? 1;

  // новые данные с сервера (смена месяца/группы) — поверх них ещё не сохранённые правки
  useEffect(() => {
    if (!data) return;
    const map: Record<string, WeekScore> = {};
    data.weeks.forEach((w) => {
      map[rowKey(w.studentId, w.week)] = w;
    });
    Object.values(pending.current).forEach((w) => {
      if (w.month === data.month) map[rowKey(w.studentId, w.week)] = w;
    });
    setRows(map);
  }, [data]);

  // уходя со страницы — дописать то, что ещё ждёт
  useEffect(() => {
    const t0 = timers.current;
    const p0 = pending.current;
    return () => {
      Object.values(t0).forEach(clearTimeout);
      Object.values(p0).forEach((row) => saveRef.current.mutate(row));
    };
  }, []);

  const change = useCallback(
    (studentId: string, week: number, k: ScoreKey, value: unknown) => {
      const key = rowKey(studentId, week);
      setRows((prev) => {
        const row = { ...(prev[key] ?? empty(studentId, month, week)), [k]: clampScore(k, value) };
        pending.current[key] = row;
        return { ...prev, [key]: row };
      });
      setStatus((s) => ({ ...s, [key]: 'saving' }));
      clearTimeout(timers.current[key]);
      timers.current[key] = setTimeout(() => {
        const row = pending.current[key];
        if (!row) return;
        saveRef.current
          .mutateAsync(row)
          .then(() => {
            if (pending.current[key] === row) delete pending.current[key];
            setStatus((s) => ({ ...s, [key]: 'saved' }));
          })
          .catch(() => {
            setStatus((s) => ({ ...s, [key]: 'error' }));
            toast(t('scores.saveError'), 'error');
          });
      }, 500);
    },
    [month, t],
  );

  const weeksOf = useCallback(
    (studentId: string) => [1, 2, 3, 4].map((w) => rows[rowKey(studentId, w)] ?? null),
    [rows],
  );

  return { rows, status, change, weeksOf };
}
