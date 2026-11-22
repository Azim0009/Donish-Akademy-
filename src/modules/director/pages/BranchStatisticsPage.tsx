import { useTranslation } from 'react-i18next';
import { ErrorState, Loader, PageHeader, Section, StatCard } from '@/shared/ui';
import { CompareBarChart, TrendChart } from '@/shared/charts/Charts';
import { useDirectorStats } from '../api/directorApi';

export default function BranchStatisticsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useDirectorStats();
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <>
      <PageHeader
        title={t('pages.director.statistics')}
        description={t('stats.branchDescription')}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t('stats.registrationsMonth')}
          value={data.registrationsMonth}
          delta={12}
          hint={t('common.vsLastMonth')}
        />
        <StatCard label={t('director.activeStudents')} value={data.activeStudents} tone="info" />
        <StatCard label={t('stats.modulesCompleted')} value={data.completedModules} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Section title={t('director.activeStudents')} description={t('director.last30')}>
          <TrendChart
            data={data.daily}
            xKey="label"
            yKey="active"
            name={t('director.activeStudents')}
          />
        </Section>
        <Section title={t('stats.groupProgress')} description={t('stats.groupProgressHint')}>
          <CompareBarChart
            data={data.byGroup}
            xKey="name"
            bars={[{ key: 'progress', name: t('groups.avgProgress') }]}
            height={240}
          />
        </Section>
      </div>
      <Section
        title={t('stats.registrations')}
        description={t('stats.registrationsHint')}
        className="mt-6"
      >
        <CompareBarChart
          data={data.registrations}
          xKey="label"
          bars={[{ key: 'value', name: t('stats.registrations') }]}
          height={220}
        />
      </Section>
    </>
  );
}
