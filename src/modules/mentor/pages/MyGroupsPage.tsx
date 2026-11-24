import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { FiCalendar, FiMapPin } from 'react-icons/fi';
import type { GroupFormat } from '@/core/types/models';
import { GroupFormatBadge } from '@/shared/components/groups/GroupFormatBadge';
import { PATHS } from '@/core/config/paths';
import { Badge, Card, ErrorState, Loader, PageHeader, ProgressRing, Tabs } from '@/shared/ui';
import { useMentorGroups } from '../api/mentorApi';

export default function MyGroupsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMentorGroups();
  const [filter, setFilter] = useState<'all' | GroupFormat>('all');
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const count = (f: GroupFormat) => data.filter((g) => g.format === f).length;
  const list = filter === 'all' ? data : data.filter((g) => g.format === filter);

  return (
    <>
      <PageHeader title={t('pages.mentor.groups')} description={t('mentor.groupsDescription')} />
      <Tabs<'all' | GroupFormat>
        className="mb-5"
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: 'all', label: t('common.all'), count: data.length },
          { value: 'online', label: t('groups.format.online'), count: count('online') },
          { value: 'offline', label: t('groups.format.offline'), count: count('offline') },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((g) => (
          <Link key={g.id} to={generatePath(PATHS.mentor.group, { groupId: g.id })} className="group">
            <Card className="flex h-full items-center gap-5 p-5 transition-colors group-hover:border-brand/50">
              <ProgressRing value={g.avgProgress} size={72} stroke={7} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="h-display text-xl">{g.name}</h3>
                  <GroupFormatBadge format={g.format} />
                  {g.pendingReviews > 0 && <Badge tone="amber">{t('mentor.pendingBadge', { count: g.pendingReviews })}</Badge>}
                </div>
                <p className="text-sm text-muted">{g.trackTitle}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm"><FiCalendar className="text-muted" /> {g.schedule}</p>
                {g.room && <p className="mt-1 flex items-center gap-1.5 text-sm"><FiMapPin className="text-muted" /> {g.room}</p>}
                <p className="mt-1 text-xs text-muted">{t('groups.studentsOf', { count: g.studentsCount, capacity: g.capacity })}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
