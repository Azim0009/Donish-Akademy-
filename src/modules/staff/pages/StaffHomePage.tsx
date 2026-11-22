import { useTranslation } from 'react-i18next';
import { FiCalendar, FiMapPin, FiPhone } from 'react-icons/fi';
import { useAuthStore } from '@/core/auth/authStore';
import { Avatar, Badge, EmptyState, ErrorState, Loader, PageHeader, Section } from '@/shared/ui';
import { useStaffHome } from '../api/staffApi';
import { PATHS } from '@/core/config/paths';
import type { StaffRole } from '@/core/auth/roles';
import { MyTasksWidget } from '@/modules/tasks/components/MyTasksWidget';

/**
 * Главная бухгалтера, уборщицы и отдела продаж: филиал, контакты руководства, расписание дня.
 * Сверху — мои задачи. Свои разделы у ролей появятся в следующих задачах (финансы, заявки).
 */
export default function StaffHomePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useStaffHome();

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('staff.greeting', { name: user?.name.split(' ')[0] ?? '' })}
        description={t('staff.description')}
        meta={user && <Badge tone="green">{t(`roles.${user.role}`)}</Badge>}
      />

      {user && <MyTasksWidget to={PATHS[user.role as StaffRole].tasks} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t('staff.branch', { name: data.branch.name })}>
          <ul className="flex flex-col gap-3 pb-4 text-sm">
            <li className="flex items-center gap-2.5">
              <FiMapPin className="text-muted" /> {data.branch.address}
            </li>
            <li className="flex items-center gap-2.5">
              <FiPhone className="text-muted" />{' '}
              <a
                href={`tel:${data.branch.phone.replace(/\s/g, '')}`}
                className="hover:text-brand-strong"
              >
                {data.branch.phone}
              </a>
            </li>
          </ul>
          <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
            {t('staff.contacts')}
          </h3>
          <ul className="flex flex-col gap-3 pb-4">
            {data.contacts.map((c) => (
              <li key={c.role} className="flex items-center gap-3">
                <Avatar name={c.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-[13px] text-muted">{t(`roles.${c.role}`)}</p>
                </div>
                <a
                  href={`tel:${c.phone.replace(/\s/g, '')}`}
                  className="text-sm font-medium tabular-nums text-brand-strong hover:underline"
                >
                  {c.phone}
                </a>
              </li>
            ))}
          </ul>
        </Section>

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
                  <span className="w-28 text-sm font-semibold tabular-nums">{g.time}</span>
                  <span className="flex-1 font-medium">{g.name}</span>
                  <span className="text-[13px] text-muted">
                    {t('staff.studentsN', { count: g.studentsCount })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
