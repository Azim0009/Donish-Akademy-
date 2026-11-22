import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCalendar } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { Badge, Card, ErrorState, Loader, PageHeader, ProgressRing } from '@/shared/ui';
import { useMentorGroups } from '../api/mentorApi';

export default function MyGroupsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMentorGroups();
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <>
      <PageHeader title={t('pages.mentor.groups')} description={t('mentor.groupsDescription')} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((g) => (
          <Link key={g.id} to={generatePath(PATHS.mentor.group, { groupId: g.id })} className="group">
            <Card className="flex h-full items-center gap-5 p-5 transition-colors group-hover:border-brand/50">
              <ProgressRing value={g.avgProgress} size={72} stroke={7} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="h-display text-xl">{g.name}</h3>
                  {g.pendingReviews > 0 && <Badge tone="amber">{t('mentor.pendingBadge', { count: g.pendingReviews })}</Badge>}
                </div>
                <p className="text-sm text-muted">{g.trackTitle}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm"><FiCalendar className="text-muted" /> {g.schedule}</p>
                <p className="mt-1 text-xs text-muted">{t('groups.studentsOf', { count: g.studentsCount, capacity: g.capacity })}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
