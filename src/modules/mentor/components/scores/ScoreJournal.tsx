import { memo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiChevronDown, FiMessageCircle } from 'react-icons/fi';
import type { GroupScores, ScoreStudent, WeekScore } from '@/core/types/models';
import { whatsappLink } from '@/shared/lib/credentials';
import {
  LESSONS,
  MAX,
  WEEKS,
  hasData,
  isComplete,
  lessonNo,
  scoreTone,
  scoreToneClass,
  weekTotal,
  type ScoreKey,
} from '@/shared/lib/scoring';
import { Avatar, Badge, Card, Spinner } from '@/shared/ui';
import { ScoreRules } from '@/shared/components/scores/MonthSwitch';
import { rowKey, type SaveState } from './useJournal';
import { weekWaText } from './waText';

type Change = (studentId: string, week: number, k: ScoreKey, v: unknown) => void;

const ATT: { v: 2 | 1 | 0; key: string; on: string }[] = [
  { v: 2, key: 'present', on: 'bg-brand text-white border-brand' },
  { v: 1, key: 'late', on: 'bg-amber text-white border-amber' },
  { v: 0, key: 'absent', on: 'bg-danger text-white border-danger' },
];

const inputCls =
  'h-8 w-12 rounded-[8px] border border-line bg-surface text-center text-sm tabular-nums outline-none transition-colors placeholder:text-muted/60 focus:border-brand focus:ring-2 focus:ring-brand/20';

export function ScoreJournal({
  data,
  rows,
  status,
  change,
  weeksOf,
}: {
  data: GroupScores;
  rows: Record<string, WeekScore>;
  status: Record<string, SaveState>;
  change: Change;
  weeksOf: (id: string) => (WeekScore | null)[];
}) {
  const { t } = useTranslation();
  const isCurrent = data.month === data.currentMonth;
  const [open, setOpen] = useState<Set<number>>(() => new Set([isCurrent ? data.currentWeek : 1]));
  const toggle = (w: number) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(w)) n.delete(w);
      else n.add(w);
      return n;
    });

  return (
    <div className="flex flex-col gap-4">
      <ScoreRules
        items={[
          t('scores.rule.att'),
          t('scores.rule.hw'),
          t('scores.rule.bonus'),
          t('scores.rule.exam'),
          t('scores.rule.week'),
        ]}
      />
      {Array.from({ length: WEEKS }, (_, i) => i + 1).map((w) => {
        const filled = data.students.map((s) => rows[rowKey(s.id, w)]).filter(hasData);
        const complete = filled.filter(isComplete);
        const avg = complete.length
          ? Math.round(complete.reduce((s, r) => s + weekTotal(r), 0) / complete.length)
          : null;
        const isOpen = open.has(w);
        const now = isCurrent && w === data.currentWeek;
        const ahead = isCurrent && w > data.currentWeek;
        return (
          <Card key={w} className="overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(w)}
              aria-expanded={isOpen}
              className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4 text-left hover:bg-sunken/50"
            >
              <span className="font-semibold">{t('scores.weekN', { n: w })}</span>
              <span className="text-sm text-muted">
                {t('scores.lessonsRange', { from: lessonNo(w, 1), to: lessonNo(w, 3) })}
              </span>
              {now && <Badge tone="blue">{t('scores.now')}</Badge>}
              {ahead && <Badge tone="gray">{t('scores.ahead')}</Badge>}
              <span className="ml-auto flex items-center gap-3">
                {avg !== null ? (
                  <Badge
                    tone={
                      scoreTone(avg) === 'pass'
                        ? 'green'
                        : scoreTone(avg) === 'extra'
                          ? 'amber'
                          : 'red'
                    }
                  >
                    {t('scores.avgN', { n: avg })}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted">
                    {filled.length ? t('scores.inProgress') : t('scores.notFilled')}
                  </span>
                )}
                <span className="text-xs tabular-nums text-muted" title={t('scores.completeHint')}>
                  {complete.length}/{data.students.length}
                </span>
                <FiChevronDown
                  className={clsx('text-muted transition-transform', isOpen && 'rotate-180')}
                  aria-hidden
                />
              </span>
            </button>
            {isOpen && (
              <div className="overflow-x-auto border-t border-line">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-sunken/60 text-left text-xs text-muted">
                      <th className="sticky left-0 z-10 bg-sunken px-4 py-2.5 font-medium">
                        {t('scores.student')}
                      </th>
                      {LESSONS.map((l) => (
                        <th key={l} className="px-2 py-2.5 text-center font-medium">
                          <div className="text-ink">
                            {t('scores.lessonN', { n: lessonNo(w, l) })}
                          </div>
                          <div className="text-2xs">{t('scores.attHw')}</div>
                        </th>
                      ))}
                      <th className="px-2 py-2.5 text-center font-medium">
                        <div className="text-ink">{t('scores.bonus')}</div>
                        <div className="text-2xs">0–{MAX.bonus}</div>
                      </th>
                      <th className="px-2 py-2.5 text-center font-medium">
                        <div className="text-ink">{t('scores.exam')}</div>
                        <div className="text-2xs">0–{MAX.exam}</div>
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium text-ink">
                        {t('scores.total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map((s) => (
                      <JournalRow
                        key={s.id}
                        student={s}
                        week={w}
                        row={rows[rowKey(s.id, w)] ?? null}
                        state={status[rowKey(s.id, w)]}
                        change={change}
                        waHref={whatsappLink(
                          s.phone,
                          weekWaText(t, {
                            name: s.name,
                            group: data.group.name,
                            month: data.month,
                            week: w,
                            row: rows[rowKey(s.id, w)] ?? null,
                            weeks: weeksOf(s.id),
                          }),
                        )}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );
      })}
      <p className="text-xs text-muted">{t('scores.autosave')}</p>
    </div>
  );
}

const JournalRow = memo(function JournalRow({
  student: s,
  week: w,
  row,
  state,
  change,
  waHref,
}: {
  student: ScoreStudent;
  week: number;
  row: WeekScore | null;
  state?: SaveState;
  change: Change;
  waHref: string | null;
}) {
  const { t } = useTranslation();
  const total = weekTotal(row);
  const filled = hasData(row);
  const tone = isComplete(row) ? scoreTone(total) : 'none';
  const num = (k: ScoreKey, label: string, max: number) => (
    <input
      className={inputCls}
      inputMode="numeric"
      aria-label={`${s.name}: ${label}`}
      placeholder={k.startsWith('h') ? t('scores.hwShort') : '0'}
      title={`${label} 0–${max}`}
      value={row?.[k] ?? ''}
      onChange={(e) => change(s.id, w, k, e.target.value.replace(/\D/g, ''))}
    />
  );
  return (
    <tr className="border-t border-line">
      <td className="sticky left-0 z-10 bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar name={s.name} size={30} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="max-w-[160px] truncate font-medium">{s.name}</span>
              {s.isBlocked && <Badge tone="red">{t('users.blocked')}</Badge>}
            </div>
            <div className="flex h-4 items-center gap-2 text-2xs text-muted">
              {waHref && filled && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-brand-strong hover:underline"
                >
                  <FiMessageCircle aria-hidden /> WhatsApp
                </a>
              )}
              {state === 'saving' && <Spinner className="h-3 w-3" />}
              {state === 'saved' && (
                <span className="inline-flex items-center gap-0.5 text-brand-strong">
                  <FiCheck aria-hidden /> {t('scores.saved')}
                </span>
              )}
              {state === 'error' && (
                <span className="text-danger">{t('scores.saveErrorShort')}</span>
              )}
            </div>
          </div>
        </div>
      </td>
      {LESSONS.map((l) => {
        const ak = `a${l}` as ScoreKey;
        return (
          <td key={l} className="px-2 py-2.5">
            <div className="flex items-center justify-center gap-1.5">
              <div
                role="group"
                aria-label={t('scores.attOf', { n: lessonNo(w, l) })}
                className="flex gap-0.5"
              >
                {ATT.map((a) => {
                  const on = row?.[ak] === a.v;
                  return (
                    <button
                      key={a.v}
                      type="button"
                      aria-pressed={on}
                      title={t(`scores.att.${a.key}`)}
                      onClick={() => change(s.id, w, ak, on ? null : a.v)}
                      className={clsx(
                        'grid h-8 w-7 place-items-center rounded-[7px] border text-xs font-semibold tabular-nums transition-colors',
                        on ? a.on : 'border-line text-muted hover:border-ink/30 hover:text-ink',
                      )}
                    >
                      {a.v}
                    </button>
                  );
                })}
              </div>
              {num(`h${l}` as ScoreKey, t('scores.hwOf', { n: lessonNo(w, l) }), MAX.hw)}
            </div>
          </td>
        );
      })}
      <td className="px-2 py-2.5 text-center">{num('bonus', t('scores.bonus'), MAX.bonus)}</td>
      <td className="px-2 py-2.5 text-center">{num('exam', t('scores.exam'), MAX.exam)}</td>
      <td className="px-3 py-2.5 text-center">
        <span className={clsx('text-base font-semibold tabular-nums', scoreToneClass[tone])}>
          {filled ? total : '—'}
        </span>
      </td>
    </tr>
  );
});
