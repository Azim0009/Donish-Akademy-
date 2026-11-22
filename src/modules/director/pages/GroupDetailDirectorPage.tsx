import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiUserPlus } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { formatDate } from '@/core/utils/format';
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  Loader,
  PageHeader,
  ProgressRing,
  Section,
} from '@/shared/ui';
import { useDirectorGroup } from '../api/directorApi';
import { UsersTable } from '../components/UsersTable';
import { AddUserModal } from '../components/AddUserModal';

export default function GroupDetailDirectorPage() {
  const { t } = useTranslation();
  const { groupId = '' } = useParams();
  const { data, isLoading, isError, refetch } = useDirectorGroup(groupId);
  const [open, setOpen] = useState(false);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const g = data.group;

  return (
    <>
      <PageHeader
        back={{ to: PATHS.director.groups, label: t('pages.director.groups') }}
        title={t('groups.groupName', { name: g.name })}
        description={`${g.trackTitle} · ${t('groups.started', { date: formatDate(g.startDate) })}`}
        actions={
          <Button leftIcon={<FiUserPlus />} onClick={() => setOpen(true)}>
            {t('users.addStudent')}
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          {g.mentorName && <Avatar name={g.mentorName} size={44} />}
          <div>
            <p className="text-xs text-muted">{t('groups.mentor')}</p>
            <p className="font-medium">{g.mentorName ?? t('groups.noMentor')}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
            <FiCalendar />
          </span>
          <div>
            <p className="text-xs text-muted">{t('groups.schedule')}</p>
            <p className="font-medium">{g.schedule}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <ProgressRing value={g.avgProgress} size={48} stroke={5} />
          <div>
            <p className="text-xs text-muted">{t('groups.avgProgress')}</p>
            <p className="font-medium">
              {t('groups.studentsOf', { count: g.studentsCount, capacity: g.capacity })}
            </p>
          </div>
        </Card>
      </div>
      <Section title={t('groups.members')}>
        <UsersTable rows={data.members} role="student" />
      </Section>
      <AddUserModal open={open} onClose={() => setOpen(false)} role="student" groupId={g.id} />
    </>
  );
}
