import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/core/config/paths';
import type { GroupMember } from '@/core/types/models';
import { formatNumber, timeAgo } from '@/core/utils/format';
import { Avatar, Badge, ErrorState, Loader, PageHeader, ProgressBar, Section, Table, type Column } from '@/shared/ui';
import { useMentorGroup } from '../api/mentorApi';

export default function GroupDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groupId = '' } = useParams();
  const { data, isLoading, isError, refetch } = useMentorGroup(groupId);
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const columns: Column<GroupMember>[] = [
    {
      key: 'name',
      header: t('common.fullName'),
      cell: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.name} size={32} />
          <span className="font-medium">{m.name}</span>
          {m.isBlocked && <Badge tone="red">{t('users.blocked')}</Badge>}
        </div>
      ),
    },
    { key: 'module', header: t('mentor.currentModule'), cell: (m) => <Badge tone="gray">{m.currentModule}</Badge> },
    {
      key: 'progress',
      header: t('users.progress'),
      cell: (m) => (
        <div className="flex w-36 items-center gap-2">
          <ProgressBar value={m.progress} size="sm" tone={m.progress < 25 ? 'danger' : 'brand'} />
          <span className="w-9 text-right text-xs text-muted">{m.progress}%</span>
        </div>
      ),
    },
    { key: 'quiz', header: t('student.quizAverage'), hideOnMobile: true, className: 'text-right', cell: (m) => `${m.quizAverage}%` },
    { key: 'xp', header: 'XP', hideOnMobile: true, className: 'text-right', cell: (m) => formatNumber(m.xp) },
    { key: 'active', header: t('common.lastActive'), hideOnMobile: true, cell: (m) => <span className="text-muted">{timeAgo(m.lastActiveAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        back={{ to: PATHS.mentor.groups, label: t('pages.mentor.groups') }}
        title={t('groups.groupName', { name: data.group.name })}
        description={`${data.group.trackTitle} · ${data.group.schedule}`}
        meta={<Badge tone="green">{data.group.avgProgress}%</Badge>}
      />
      <Section title={t('groups.members')} description={t('mentor.membersHint')}>
        <Table columns={columns} rows={[...data.members].sort((a, b) => b.progress - a.progress)} rowKey={(m) => m.id} onRowClick={(m) => navigate(generatePath(PATHS.mentor.studentProgress, { studentId: m.id }))} />
      </Section>
    </>
  );
}
