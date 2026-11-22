import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/core/utils/format';
import { ErrorState, Loader, PageHeader, ProgressBar, Section, StatCard } from '@/shared/ui';
import { CompareBarChart, TrendChart } from '@/shared/charts/Charts';
import { useGlobalStats } from '../api/superAdminApi';

export default function GlobalStatisticsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useGlobalStats();
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <>
      <PageHeader
        title={t('pages.superAdmin.statistics')}
        description={t('stats.globalDescription')}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('superAdmin.students')}
          value={formatNumber(data.totals.students)}
          delta={12.4}
          hint={t('common.vsLastMonth')}
        />
        <StatCard
          label={t('stats.activeWeek')}
          value={formatNumber(data.totals.activeWeek)}
          tone="info"
        />
        <StatCard
          label={t('stats.lessonsDone')}
          value={formatNumber(data.totals.lessonsDone)}
          tone="amber"
        />
        <StatCard label={t('superAdmin.completionRate')} value={`${data.totals.completion}%`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Section title={t('stats.compareBranches')} description={t('stats.compareHint')}>
          <CompareBarChart
            data={data.compare}
            xKey="name"
            bars={[
              { key: 'previous', name: t('stats.previous'), muted: true },
              { key: 'current', name: t('stats.current') },
            ]}
          />
        </Section>
        <Section title={t('superAdmin.growth')} description={t('superAdmin.growthHint')}>
          <TrendChart
            data={data.growth}
            xKey="label"
            yKey="students"
            name={t('superAdmin.students')}
            height={260}
          />
        </Section>
      </div>
      <Section
        title={t('stats.completionByBranch')}
        description={t('stats.completionHint')}
        className="mt-6"
      >
        <ul className="grid gap-x-10 gap-y-4 md:grid-cols-2">
          {data.completion.map((c) => (
            <li key={c.name} className="grid grid-cols-[110px_1fr_44px] items-center gap-3 text-sm">
              <span className="font-medium">{c.name}</span>
              <ProgressBar value={c.value} />
              <span className="text-right text-muted">{c.value}%</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
