import type { ExtraExam, Group, WeekScore } from '@/core/types/models';
import { EXTRA_MIN, MAX, MONTHS, PASS, WEEKS, monthResult } from '@/shared/lib/scoring';
import { db } from './db';

/**
 * Журнал баллов (как в CRM Donish): неделя = 3 урока, максимум 100.
 * Позиция группы в курсе считается от даты старта: 4 недели = 1 месяц, всего 3 месяца.
 */
const DAY = 86_400_000;

export function coursePosition(g: Pick<Group, 'startDate'>) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(g.startDate).getTime()) / DAY));
  const idx = Math.min(MONTHS * WEEKS - 1, Math.floor(days / 7));
  return { currentMonth: Math.floor(idx / WEEKS) + 1, currentWeek: (idx % WEEKS) + 1 };
}

const key = (studentId: string, month: number, week: number) => `${studentId}:${month}:${week}`;
const weeks = new Map<string, WeekScore>();
const extras = new Map<string, ExtraExam>();
const seededGroups = new Set<string>();

const clamp = (v: number, max: number) => Math.max(0, Math.min(max, Math.round(v)));

function seedGroup(groupId: string) {
  if (seededGroups.has(groupId)) return;
  seededGroups.add(groupId);
  const g = db.groups.find((x) => x.id === groupId);
  if (!g) return;
  const { currentMonth, currentWeek } = coursePosition(g);
  const students = db.users.filter((u) => u.role === 'student' && u.groupId === groupId);
  students.forEach((u, si) => {
    let seed = 1000 + si * 7919 + groupId.length * 31;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const noise = () => rnd() - 0.5;
    // «сила» ученика: от прогресса платформы + разброс по месяцам (кто-то на доп. экзамен, кто-то на повтор)
    const SHIFT = [0, -4, -14, 3, -20, -8, 2, -11];
    for (let m = 1; m <= currentMonth; m++) {
      const ability = Math.max(
        45,
        Math.min(98, 58 + u.progress * 0.36 + SHIFT[(si + m) % SHIFT.length]),
      );
      const lastWeek = m < currentMonth ? WEEKS : currentWeek;
      for (let w = 1; w <= lastWeek; w++) {
        const isCurrent = m === currentMonth && w === currentWeek;
        // в текущей неделе прошли 2 урока, экзамена ещё не было
        const lessons = isCurrent ? 2 : 3;
        const a = (l: number) => {
          if (l > lessons) return null;
          const r = rnd();
          const missP = (100 - ability) / 200;
          return r < missP ? 0 : r < missP * 2 ? 1 : 2;
        };
        const h = (l: number) => (l > lessons ? null : clamp(ability / 10 + noise() * 3, MAX.hw));
        weeks.set(key(u.id, m, w), {
          studentId: u.id,
          month: m,
          week: w,
          a1: a(1),
          a2: a(2),
          a3: a(3),
          h1: h(1),
          h2: h(2),
          h3: h(3),
          bonus: isCurrent ? null : clamp((ability - 62) / 2.6 + noise() * 5, MAX.bonus),
          exam: isCurrent ? null : clamp(ability * 0.5 + noise() * 8, MAX.exam),
          updatedAt: new Date(
            Date.now() - ((currentMonth - m) * 4 + (currentWeek - w)) * 7 * DAY,
          ).toISOString(),
        });
      }
      // давние месяцы: доп. экзамен уже решён; прошлый месяц — ждёт решения ментора
      if (m < currentMonth - 1) {
        const r = monthResult(
          Array.from({ length: WEEKS }, (_, i) => weeks.get(key(u.id, m, i + 1))),
        );
        if (r.avg >= EXTRA_MIN && r.avg < PASS)
          extras.set(`${u.id}:${m}`, { studentId: u.id, month: m, passed: si % 3 !== 0 });
      }
    }
  });
}

export function groupScores(groupId: string, month: number) {
  seedGroup(groupId);
  const ids = new Set(
    db.users.filter((u) => u.role === 'student' && u.groupId === groupId).map((u) => u.id),
  );
  return {
    weeks: [...weeks.values()].filter((w) => w.month === month && ids.has(w.studentId)),
    extra: [...extras.values()].filter((e) => e.month === month && ids.has(e.studentId)),
  };
}

export function studentScores(studentId: string, groupId: string, month: number) {
  seedGroup(groupId);
  return {
    weeks: Array.from({ length: WEEKS }, (_, i) => weeks.get(key(studentId, month, i + 1)) ?? null),
    extra: extras.get(`${studentId}:${month}`) ?? null,
  };
}

export function saveWeek(row: WeekScore) {
  const g = db.users.find((u) => u.id === row.studentId)?.groupId;
  if (g) seedGroup(g);
  const saved = { ...row, updatedAt: new Date().toISOString() };
  weeks.set(key(row.studentId, row.month, row.week), saved);
  return saved;
}

export function setExtra(studentId: string, month: number, passed: boolean | null) {
  const g = db.users.find((u) => u.id === studentId)?.groupId;
  if (g) seedGroup(g);
  if (passed === null) extras.delete(`${studentId}:${month}`);
  else extras.set(`${studentId}:${month}`, { studentId, month, passed });
}
