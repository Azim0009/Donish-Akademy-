import { useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { FiAward } from 'react-icons/fi';
import type { WeekScore } from '@/core/types/models';
import { MonthSwitch, ScoreRules } from '@/shared/components/scores/MonthSwitch';
import {
  EXTRA_MIN,
  LESSONS,
  MAX,
  PASS,
  WEEKS,
  hasData,
  isComplete,
  lessonNo,
  monthResult,
  monthStatusTone,
  scoreBarTone,
  scoreTone,
  scoreToneClass,
  weekParts,
  weekTotal,
} from '@/shared/lib/scoring';
import { Badge, Card, EmptyState, ErrorState, Loader, PageHeader, ProgressBar } from '@/shared/ui';
import { useMyScores } from '../hooks/useLearning';

const attCls: Record<number, string> = {
  2: 'bg-brand-soft text-brand-strong',
  1: 'bg-amber-soft text-amber',
  0: 'bg-danger-soft text-danger',
};

/** Мои баллы: неделя = 100 баллов, итог месяца — среднее 4 недель (как в CRM Donish) */
export default function MyScoresPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyScores();
  const [picked, setPicked] = useState<number | null>(null);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const month = picked ?? data.currentMonth;
  const m = data.months.find((x) => x.month === month) ?? data.months[data.months.length - 1];
  const isCurrent = month === data.currentMonth;
  const r = monthResult(m?.weeks ?? [], m?.extra);
  const main = r.done ? r.avg : r.pace;
  const anyData = r.filled > 0;

  const hint = r.done
    ? t(`scores.my.hint.${r.status}`, { n: PASS })
    : main !== null && main < PASS
      ? t('scores.my.toPass', { n: Math.ceil((PASS - main) * 10) / 10, pass: PASS })
      : t('scores.my.keepGoing', { n: PASS });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader
        title={t('pages.student.scores')}
        description={t('scores.my.description', {
          group: data.groupName,
          mentor: data.mentorName ?? '—',
        })}
        actions={<MonthSwitch value={month} available={data.currentMonth} onChange={setPicked} />}
      />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-soft text-2xl text-brand-strong">
              <FiAward aria-hidden />
            </span>
            <div>
              <p className="text-sm text-muted">
                {r.done ? t('scores.my.monthResult') : t('scores.my.paceNow')}
              </p>
              <p className="h-display text-[34px] leading-tight">
                <span className={scoreToneClass[scoreTone(main)]}>{main ?? '—'}</span>
                <span className="text-lg text-muted"> / 100</span>
              </p>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone={monthStatusTone[r.status]}>
                {t(`scores.statusName.${r.status}`, { n: r.filled })}
              </Badge>
              {isCurrent && (
                <span className="text-xs text-muted">
                  {t('scores.my.nowWeek', { w: data.currentWeek, m: data.currentMonth })}
                </span>
              )}
            </div>
            <div className="relative">
              <ProgressBar value={main ?? 0} tone={scoreBarTone(main)} />
              <span
                className="absolute -top-1 h-4 w-0.5 rounded bg-ink/40"
                style={{ left: `${PASS}%` }}
                title={String(PASS)}
                aria-hidden
              />
            </div>
            <p className="mt-2 text-sm text-muted">{anyData ? hint : t('scores.my.noData')}</p>
          </div>
        </div>
      </Card>

      <ScoreRules
        items={[
          t('scores.rule.att'),
          t('scores.rule.hw'),
          t('scores.rule.bonus'),
          t('scores.rule.exam'),
          t('scores.rule.pass', { n: PASS }),
          t('scores.rule.extra', { from: EXTRA_MIN, to: PASS - 1 }),
        ]}
      />

      {!m ? (
        <Card>
          <EmptyState title={t('scores.my.noData')} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: WEEKS }, (_, i) => i + 1).map((w) => (
            <WeekCard
              key={w}
              week={w}
              row={m.weeks[w - 1] ?? null}
              now={isCurrent && w === data.currentWeek}
              ahead={isCurrent && w > data.currentWeek}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekCard({
  week,
  row,
  now,
  ahead,
}: {
  week: number;
  row: WeekScore | null;
  now: boolean;
  ahead: boolean;
}) {
  const { t } = useTranslation();
  const filled = hasData(row);
  const total = weekTotal(row);
  const p = weekParts(row);
  const parts = [
    { label: t('scores.my.attendance'), v: p.att, max: MAX.att * 3 },
    { label: t('scores.my.homework'), v: p.hw, max: MAX.hw * 3 },
    { label: t('scores.bonus'), v: p.bonus, max: MAX.bonus },
    { label: t('scores.exam'), v: p.exam, max: MAX.exam },
  ];
  return (
    <Card className={clsx('p-5', ahead && 'opacity-60')}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{t('scores.weekN', { n: week })}</h3>
            {now && <Badge tone="blue">{t('scores.now')}</Badge>}
          </div>
          <p className="text-xs text-muted">
            {t('scores.lessonsRange', { from: lessonNo(week, 1), to: lessonNo(week, 3) })}
          </p>
        </div>
        <p className="text-right">
          <span
            className={clsx(
              'h-display text-2xl',
              scoreToneClass[isComplete(row) ? scoreTone(total) : 'none'],
            )}
          >
            {filled ? total : '—'}
          </span>
          <span className="text-sm text-muted"> / 100</span>
        </p>
      </div>
      {ahead ? (
        <p className="text-sm text-muted">{t('scores.ahead')}</p>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            {LESSONS.map((l) => {
              const a = row?.[`a${l}` as 'a1'];
              const h = row?.[`h${l}` as 'h1'];
              return (
                <div
                  key={l}
                  className="flex-1 rounded-ctl border border-line px-2.5 py-2 text-center"
                >
                  <p className="text-2xs text-muted">
                    {t('scores.lessonN', { n: lessonNo(week, l) })}
                  </p>
                  <span
                    className={clsx(
                      'mt-1 inline-block rounded-full px-2 py-0.5 text-2xs font-medium',
                      typeof a === 'number' ? attCls[a] : 'bg-sunken text-muted',
                    )}
                  >
                    {typeof a === 'number'
                      ? t(`scores.att.${a === 2 ? 'present' : a === 1 ? 'late' : 'absent'}`)
                      : '—'}
                  </span>
                  <p className="mt-1 text-xs tabular-nums">
                    {t('scores.hwShort')}: <b>{h ?? '—'}</b>
                    <span className="text-muted">/{MAX.hw}</span>
                  </p>
                </div>
              );
            })}
          </div>
          <ul className="flex flex-col gap-2.5">
            {parts.map((x) => (
              <li key={x.label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                <span className="text-sm">{x.label}</span>
                <span className="text-sm tabular-nums">
                  <b>{x.v}</b>
                  <span className="text-muted">/{x.max}</span>
                </span>
                <ProgressBar value={(x.v / x.max) * 100} size="sm" className="col-span-2" />
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
