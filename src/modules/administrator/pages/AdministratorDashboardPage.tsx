import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiGrid, FiUserCheck, FiUserPlus, FiUsers } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { timeAgo } from '@/core/utils/format';
import { useAuthStore } from '@/core/auth/authStore';
import {
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  Loader,
  PageHeader,
  Section,
  StatCard,
} from '@/shared/ui';
import { useAdministratorDashboard } from '../api/administratorApi';

/** Главная администратора филиала: кто сегодня занимается, ученики, свободные места */
export default function AdministratorDashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useAdministratorDashboard();

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('administrator.greeting', { name: user?.name.split(' ')[0] ?? '' })}
        description={t('administrator.dashboardDescription')}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('administrator.students')}
          value={data.studentsCount}
          icon={<FiUsers />}
        />
        <StatCard
          label={t('administrator.active')}
          value={data.activeCount}
          icon={<FiUserCheck />}
          tone="info"
        />
        <StatCard
          label={t('branch.groups')}
          value={data.groupsCount}
          icon={<FiGrid />}
          tone="amber"
        />
        <StatCard
          label={t('administrator.freeSeats')}
          value={data.freeSeats}
          icon={<FiUserPlus />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title={t('administrator.today')}
          description={t('administrator.todayHint')}
          bodyClassName="px-0 pb-2"
        >
          {data.today.length === 0 ? (
            <EmptyState icon={<FiCalendar />} title={t('administrator.noLessonsToday')} />
          ) : (
            <ul className="divide-y divide-line">
              {data.today.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-4">
                    <span className="w-24 text-sm font-semibold tabular-nums">{g.time}</span>
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-[13px] text-muted">
                        {g.mentorName ?? t('groups.noMentor')}
                      </p>
                    </div>
                  </div>
                  <Badge>
                    {t('groups.studentsOf', { count: g.studentsCount, capacity: g.capacity })}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title={t('administrator.recent')}
          action={
            <Link
              to={PATHS.administrator.students}
              className="text-sm font-medium text-brand-strong hover:underline"
            >
              {t('common.openAll')}
            </Link>
          }
          bodyClassName="px-0 pb-2"
        >
          <ul className="divide-y divide-line">
            {data.recent.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={u.name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.name}</p>
                  <p className="text-[13px] text-muted">
                    {u.phone} · {u.groupName ?? t('users.noGroup')}
                  </p>
                </div>
                <span className="text-xs text-muted">{timeAgo(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
