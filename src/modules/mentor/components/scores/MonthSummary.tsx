import { useMemo } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle, FiCheckCircle, FiRepeat, FiTrendingUp } from 'react-icons/fi';
import type { GroupScores, WeekScore } from '@/core/types/models';
import { KpiCard } from '@/shared/components/dashboard/KpiCard';
import { ScoreRules } from '@/shared/components/scores/MonthSwitch';
import {
  EXTRA_MIN,
  PASS,
  monthResult,
  monthStatusTone,
  scoreBarTone,
  scoreTone,
  scoreToneClass,
} from '@/shared/lib/scoring';
import { Avatar, Badge, Button, Card, ProgressBar, toast } from '@/shared/ui';
import { useSetExtraExam } from '../../api/mentorApi';

export function MonthSummary({
  data,
  weeksOf,
}: {
  data: GroupScores;
  weeksOf: (id: string) => (WeekScore | null)[];
}) {
  const { t } = useTranslation();
  const setExtra = useSetExtraExam(data.group.id);
  const extraOf = useMemo(() => new Map(data.extra.map((e) => [e.studentId, e])), [data.extra]);

  const rows = useMemo(
    () =>
      data.students
        .map((s) => ({ s, ...monthResult(weeksOf(s.id), extraOf.get(s.id)) }))
        .sort((a, b) => (b.pace ?? -1) - (a.pace ?? -1)),
    [data.students, weeksOf, extraOf],
  );
  const count = (...keys: string[]) => rows.filter((r) => keys.includes(r.status)).length;
  const withPace = rows.filter((r) => r.pace !== null);
  const groupPace = withPace.length
    ? Math.round(withPace.reduce((s, r) => s + (r.pace ?? 0), 0) / withPace.length)
    : 0;

  const decide = (studentId: string, passed: boolean | null) =>
    setExtra.mutate(
      { studentId, month: data.month, passed },
      {
        onSuccess: () =>
          passed !== null &&
          toast(t(passed ? 'scores.extraPassedToast' : 'scores.extraFailedToast'), 'success'),
        onError: () => toast(t('scores.saveError'), 'error'),
      },
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<FiTrendingUp />}
          label={t('scores.groupPace')}
          value={`${groupPace} / 100`}
        />
        <KpiCard
          icon={<FiCheckCircle />}
          label={t('scores.passCount')}
          value={count('pass', 'passedExtra')}
        />
        <KpiCard icon={<FiAlertTriangle />} label={t('scores.extraCount')} value={count('extra')} />
        <KpiCard icon={<FiRepeat />} label={t('scores.failCount')} value={count('fail')} />
      </div>
      <ScoreRules
        items={[
          t('scores.rule.month'),
          t('scores.rule.pass', { n: PASS }),
          t('scores.rule.extra', { from: EXTRA_MIN, to: PASS - 1 }),
          t('scores.rule.fail', { n: EXTRA_MIN }),
        ]}
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="bg-sunken/60 text-left text-xs text-muted">
                <th className="sticky left-0 z-10 bg-sunken px-4 py-2.5 font-medium">
                  {t('scores.student')}
                </th>
                {[1, 2, 3, 4].map((w) => (
                  <th key={w} className="px-2 py-2.5 text-center font-medium">
                    {t('scores.weekShort', { n: w })}
                  </th>
                ))}
                <th className="px-2 py-2.5 text-center font-medium">{t('scores.result')}</th>
                <th className="px-3 py-2.5 font-medium">{t('scores.pace')}</th>
                <th className="px-3 py-2.5 font-medium">{t('scores.status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.s.id} className="border-t border-line">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.s.name} size={28} />
                      <span className="max-w-[170px] truncate font-medium">{r.s.name}</span>
                    </div>
                  </td>
                  {r.totals.map((v, i) => (
                    <td
                      key={i}
                      className={clsx(
                        'px-2 py-2.5 text-center tabular-nums',
                        scoreToneClass[r.complete[i] ? scoreTone(v) : 'none'],
                      )}
                      title={v !== null && !r.complete[i] ? t('scores.inProgress') : undefined}
                    >
                      {v ?? '—'}
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-center">
                    <span
                      className={clsx(
                        'text-base font-semibold tabular-nums',
                        r.done ? scoreToneClass[scoreTone(r.avg)] : 'text-muted',
                      )}
                    >
                      {r.done ? r.avg : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="w-28">
                      <div className="mb-1 text-xs tabular-nums text-muted">
                        {r.pace ?? '—'}
                        {r.pace !== null && ' / 100'}
                      </div>
                      <ProgressBar value={r.pace ?? 0} size="sm" tone={scoreBarTone(r.pace)} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={monthStatusTone[r.status]}>
                        {t(`scores.statusName.${r.status}`, { n: r.filled })}
                      </Badge>
                      {r.done &&
                        r.avg >= EXTRA_MIN &&
                        r.avg < PASS &&
                        (extraOf.has(r.s.id) ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => decide(r.s.id, null)}
                            disabled={setExtra.isPending}
                          >
                            {t('scores.reset')}
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => decide(r.s.id, true)}
                              disabled={setExtra.isPending}
                            >
                              {t('scores.passed')}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => decide(r.s.id, false)}
                              disabled={setExtra.isPending}
                            >
                              {t('scores.failed')}
                            </Button>
                          </>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted">{t('scores.paceHint')}</p>
    </div>
  );
}
