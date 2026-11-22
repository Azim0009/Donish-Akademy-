import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheckSquare, FiGrid, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { timeAgo } from '@/core/utils/format';
import { Avatar, Badge, EmptyState, ErrorState, Loader, PageHeader, ProgressBar, Section, StatCard } from '@/shared/ui';
import { useMentorDashboard } from '../api/mentorApi';

export default function MentorDashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMentorDashboard();
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <>
      <PageHeader title={t('mentor.dashboardTitle')} description={t('mentor.dashboardDescription')} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('mentor.myGroups')} value={data.groupsCount} icon={<FiGrid />} />
        <StatCard label={t('superAdmin.students')} value={data.studentsCount} icon={<FiUsers />} tone="info" />
        <StatCard label={t('mentor.toReview')} value={data.pendingCount} icon={<FiCheckSquare />} tone={data.pendingCount ? 'amber' : 'brand'} />
        <StatCard label={t('groups.avgProgress')} value={`${data.avgProgress}%`} icon={<FiTrendingUp />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Section
          title={t('mentor.waiting')}
          description={t('mentor.waitingHint')}
          action={<Link to={PATHS.mentor.reviewQueue} className="text-sm font-medium text-brand-strong hover:underline">{t('common.openAll')}</Link>}
        >
          {data.pending.length ? (
            <ul className="divide-y divide-line">
              {data.pending.map((s) => (
                <li key={s.id}>
                  <Link to={generatePath(PATHS.mentor.submission, { submissionId: s.id })} className="flex items-center gap-3 py-3 hover:text-brand-strong">
                    <Avatar name={s.studentName} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{s.exerciseTitle}</span>
                      <span className="block text-xs text-muted">{s.studentName} · {s.groupName}</span>
                    </span>
                    <span className="text-xs text-muted">{timeAgo(s.submittedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t('mentor.allReviewed')} />
          )}
        </Section>

        <Section title={t('mentor.lagging')} description={t('mentor.laggingHint')}>
          <ul className="flex flex-col gap-3">
            {data.lagging.map((m) => (
              <li key={m.id}>
                <Link to={generatePath(PATHS.mentor.studentProgress, { studentId: m.id })} className="grid grid-cols-[34px_1fr_auto] items-center gap-3">
                  <Avatar name={m.name} size={34} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{m.name}</span>
                    <ProgressBar value={m.progress} size="sm" tone={m.progress < 25 ? 'danger' : 'amber'} className="mt-1" />
                  </span>
                  <Badge tone="gray">{m.currentModule}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title={t('mentor.myGroups')} className="mt-6">
        <div className="grid gap-4 md:grid-cols-3">
          {data.groups.map((g) => (
            <Link key={g.id} to={generatePath(PATHS.mentor.group, { groupId: g.id })} className="rounded-card border border-line p-4 hover:border-brand/50">
              <div className="flex items-center justify-between">
                <span className="h-display text-lg">{g.name}</span>
                {g.pendingReviews > 0 && <Badge tone="amber">{t('mentor.pendingBadge', { count: g.pendingReviews })}</Badge>}
              </div>
              <p className="mt-1 text-xs text-muted">{g.schedule}</p>
              <ProgressBar value={g.avgProgress} className="mt-4" />
              <p className="mt-1.5 text-xs text-muted">{g.avgProgress}% · {t('groups.studentsOf', { count: g.studentsCount, capacity: g.capacity })}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
