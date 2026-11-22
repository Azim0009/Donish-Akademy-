import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { BranchReport, ReportMetrics } from '@/core/types/models';
import { formatMoney, formatNumber } from '@/core/utils/format';
import { profit, totalExpenses } from '@/shared/lib/reports';
import { Section } from '@/shared/ui';

const METRICS: (keyof ReportMetrics)[] = [
  'students',
  'newStudents',
  'leftStudents',
  'groups',
  'mentors',
  'paidStudents',
  'avgProgress',
];

/** Отчёт в режиме чтения. previous — прошлый отчёт филиала, чтобы показать рост */
export function ReportBody({
  report: r,
  previous,
}: {
  report: BranchReport;
  previous?: BranchReport | null;
}) {
  const { t } = useTranslation();
  const exp = totalExpenses(r);
  const pr = profit(r);
  return (
    <div className="flex flex-col gap-4">
      <Section title={t('reports.metrics')}>
        <MetricsGrid metrics={r.metrics} previous={previous?.metrics} />
      </Section>

      <Section title={t('reports.finance')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Money label={t('reports.income')} value={r.income} prev={previous?.income} />
          <Money
            label={t('reports.expenses')}
            value={exp}
            prev={previous ? totalExpenses(previous) : undefined}
            invert
          />
          <Money
            label={t('reports.profit')}
            value={pr}
            prev={previous ? profit(previous) : undefined}
            strong
          />
        </div>
        <ExpensesTable report={r} />
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        {(['achievements', 'problems', 'plans'] as const).map((k) => (
          <Section key={k} title={t(`reports.${k}`)}>
            <p className={clsx('whitespace-pre-line text-sm', !r[k] && 'text-muted')}>
              {r[k] || t('reports.emptyText')}
            </p>
          </Section>
        ))}
      </div>
    </div>
  );
}

export function MetricsGrid({
  metrics,
  previous,
}: {
  metrics: ReportMetrics;
  previous?: ReportMetrics;
}) {
  const { t } = useTranslation();
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      {METRICS.map((k) => {
        const v = metrics[k];
        const d = previous ? v - previous[k] : null;
        return (
          <div key={k} className="rounded-ctl bg-sunken px-3 py-2.5">
            <dt className="truncate text-xs text-muted">{t(`reports.m.${k}`)}</dt>
            <dd className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tabular-nums">
                {formatNumber(v)}
                {k === 'avgProgress' && '%'}
              </span>
              {d !== null && d !== 0 && (
                <span
                  className={clsx(
                    'text-xs font-medium tabular-nums',
                    (k === 'leftStudents' ? d < 0 : d > 0) ? 'text-brand-strong' : 'text-danger',
                  )}
                >
                  {d > 0 ? '+' : ''}
                  {d}
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function Money({
  label,
  value,
  prev,
  invert,
  strong,
}: {
  label: string;
  value: number;
  prev?: number;
  invert?: boolean;
  strong?: boolean;
}) {
  const d = prev ? Math.round(((value - prev) / Math.abs(prev)) * 1000) / 10 : null;
  const good = d !== null && (invert ? d <= 0 : d >= 0);
  return (
    <div
      className={clsx(
        'rounded-ctl border px-4 py-3',
        strong
          ? value >= 0
            ? 'border-brand/30 bg-brand-soft/60'
            : 'border-danger/30 bg-danger-soft'
          : 'border-line',
      )}
    >
      <p className="text-xs text-muted">{label}</p>
      <p
        className={clsx(
          'h-display mt-0.5 text-xl tabular-nums',
          strong && value < 0 && 'text-danger',
        )}
      >
        {formatMoney(value)}
      </p>
      {d !== null && (
        <p className={clsx('text-xs font-medium', good ? 'text-brand-strong' : 'text-danger')}>
          {d >= 0 ? '↑' : '↓'} {Math.abs(d)}%
        </p>
      )}
    </div>
  );
}

function ExpensesTable({ report }: { report: BranchReport }) {
  const { t } = useTranslation();
  if (report.expenses.length === 0)
    return <p className="mt-3 text-sm text-muted">{t('reports.noExpenses')}</p>;
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="py-2 pr-3 font-medium">{t('reports.category')}</th>
            <th className="py-2 pr-3 font-medium">{t('reports.note')}</th>
            <th className="py-2 text-right font-medium">{t('reports.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {report.expenses.map((e) => (
            <tr key={e.id} className="border-b border-line last:border-0">
              <td className="whitespace-nowrap py-2 pr-3 font-medium">
                {t(`reports.cat.${e.category}`)}
              </td>
              <td className="py-2 pr-3 text-muted">{e.note || '—'}</td>
              <td className="whitespace-nowrap py-2 text-right tabular-nums">
                {formatMoney(e.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
