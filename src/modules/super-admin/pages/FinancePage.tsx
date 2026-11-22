import { useState } from 'react';
import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiAlertCircle, FiCreditCard, FiDollarSign, FiPercent } from 'react-icons/fi';
import clsx from 'clsx';
import { PATHS } from '@/core/config/paths';
import { formatCompact, formatMoney, formatNumber } from '@/core/utils/format';
import { branchStatusTone } from '@/shared/lib/statusTone';
import { Badge, ErrorState, Loader, PageHeader, ProgressBar, Section } from '@/shared/ui';
import { CompareBarChart, TrendChart } from '@/shared/charts/Charts';
import { useFinance, type Period } from '../api/superAdminApi';
import { KpiCard } from '@/shared/components/dashboard/KpiCard';
import { PeriodPicker } from '@/shared/components/dashboard/PeriodPicker';

/** Финансы сети: выручка всех филиалов, сравнение с прошлым периодом, оплаты по дням */
export default function FinancePage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>(30);
  const { data, isLoading, isError, refetch } = useFinance(period);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const vs = t('dashboard.vsPrev', { count: period });
  const max = Math.max(1, ...data.branches.map((b) => b.revenue));

  return (
    <>
      <PageHeader
        title={t('pages.superAdmin.finance')}
        description={t('finance.description')}
        actions={<PeriodPicker value={period} onChange={setPeriod} />}
      />
      <p className="mb-4 rounded-ctl bg-amber-soft px-4 py-3 text-[13px] text-amber">
        {t('finance.demoNote')}
      </p>

      <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        <KpiCard
          icon={<FiDollarSign />}
          label={t('finance.revenue')}
          value={formatMoney(data.total)}
          delta={data.delta}
          hint={vs}
        />
        <KpiCard
          icon={<FiCreditCard />}
          label={t('finance.avgCheck')}
          value={formatMoney(data.avgCheck)}
        />
        <KpiCard icon={<FiPercent />} label={t('finance.paidShare')} value={`${data.paidShare}%`} />
        <KpiCard
          icon={<FiAlertCircle />}
          label={t('finance.debtors')}
          value={formatNumber(data.debtors)}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2 xl:gap-5">
        <Section title={t('finance.byDay')}>
          <TrendChart
            data={data.daily}
            xKey="label"
            yKey="revenue"
            name={t('finance.revenue')}
            height={260}
            yFormat={formatCompact}
          />
        </Section>
        <Section title={t('finance.compare')}>
          <CompareBarChart
            data={data.branches.filter((b) => b.revenue || b.previous)}
            xKey="name"
            bars={[
              { key: 'revenue', name: t('finance.current') },
              { key: 'previous', name: t('finance.previous'), muted: true },
            ]}
            height={260}
            yFormat={formatCompact}
          />
        </Section>
      </div>

      <Section title={t('finance.byBranch')} className="mt-4" bodyClassName="px-0 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-y border-line bg-sunken/60 text-left text-xs text-muted">
                <th className="px-5 py-2.5 font-medium">#</th>
                <th className="px-3 py-2.5 font-medium">{t('branch.branch')}</th>
                <th className="px-3 py-2.5 font-medium">{t('finance.revenue')}</th>
                <th className="px-3 py-2.5 text-right font-medium">{t('finance.change')}</th>
                <th className="px-3 py-2.5 text-right font-medium">{t('finance.paid')}</th>
                <th className="px-5 py-2.5 text-right font-medium">{t('dashboard.status')}</th>
              </tr>
            </thead>
            <tbody>
              {data.branches.map((b, i) => (
                <tr key={b.branchId} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-muted">{i + 1}</td>
                  <td className="px-3 py-3 font-medium">
                    <Link
                      to={generatePath(PATHS.superAdmin.branch, { branchId: b.branchId })}
                      className="hover:text-brand-strong"
                    >
                      {b.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-32 shrink-0 whitespace-nowrap tabular-nums">
                        {formatMoney(b.revenue)}
                      </span>
                      <ProgressBar
                        value={(b.revenue / max) * 100}
                        className="hidden w-full max-w-[220px] sm:block"
                      />
                    </div>
                  </td>
                  <td
                    className={clsx(
                      'px-3 py-3 text-right font-semibold tabular-nums',
                      b.delta >= 0 ? 'text-brand-strong' : 'text-danger',
                    )}
                  >
                    {b.revenue || b.previous ? `${b.delta >= 0 ? '+' : ''}${b.delta}%` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted">
                    {formatNumber(b.paidStudents)} / {formatNumber(b.students)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Badge tone={branchStatusTone[b.status]}>{t(`branchStatus.${b.status}`)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
