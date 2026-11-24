import { useState } from 'react';
import { generatePath, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/core/config/paths';
import type { GroupMember } from '@/core/types/models';
import { formatNumber, timeAgo } from '@/core/utils/format';
import { MonthSwitch } from '@/shared/components/scores/MonthSwitch';
import { GroupFormatBadge } from '@/shared/components/groups/GroupFormatBadge';
import {
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  Loader,
  PageHeader,
  ProgressBar,
  Section,
  Table,
  Tabs,
  type Column,
} from '@/shared/ui';
import { useGroupScores, useMentorGroup } from '../api/mentorApi';
import { MonthSummary } from '../components/scores/MonthSummary';
import { ScoreJournal } from '../components/scores/ScoreJournal';
import { useJournal } from '../components/scores/useJournal';
import { AiMentorCard } from '../components/AiMentorCard';

type Tab = 'journal' | 'summary' | 'members';
const TABS: Tab[] = ['journal', 'summary', 'members'];

export default function GroupDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groupId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'journal';
  const setTab = (v: Tab) =>
    setParams(
      (p) => {
        p.set('tab', v);
        return p;
      },
      { replace: true },
    );
  const [month, setMonth] = useState<number | null>(null);
  const { data, isLoading, isError, refetch } = useMentorGroup(groupId);
  const scores = useGroupScores(groupId, month);
  const journal = useJournal(scores.data);
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
    {
      key: 'module',
      header: t('mentor.currentModule'),
      cell: (m) => <Badge tone="gray">{m.currentModule}</Badge>,
    },
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
    {
      key: 'quiz',
      header: t('student.quizAverage'),
      hideOnMobile: true,
      className: 'text-right',
      cell: (m) => `${m.quizAverage}%`,
    },
    {
      key: 'xp',
      header: 'XP',
      hideOnMobile: true,
      className: 'text-right',
      cell: (m) => formatNumber(m.xp),
    },
    {
      key: 'active',
      header: t('common.lastActive'),
      hideOnMobile: true,
      cell: (m) => <span className="text-muted">{timeAgo(m.lastActiveAt)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        back={{ to: PATHS.mentor.groups, label: t('pages.mentor.groups') }}
        title={t('groups.groupName', { name: data.group.name })}
        description={[data.group.trackTitle, data.group.schedule, data.group.room].filter(Boolean).join(' · ')}
        meta={
          <>
            <GroupFormatBadge format={data.group.format} />
            <Badge tone="green">{data.group.avgProgress}%</Badge>
          </>
        }
      />
      <AiMentorCard groupId={groupId} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 overflow-x-auto px-1">
          <Tabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={TABS.map((v) => ({ value: v, label: t(`scores.tab.${v}`) }))}
          />
        </div>
        {tab !== 'members' && scores.data && (
          <MonthSwitch
            value={scores.data.month}
            available={scores.data.currentMonth}
            onChange={setMonth}
          />
        )}
      </div>
      {tab === 'members' ? (
        <Section title={t('groups.members')} description={t('mentor.membersHint')}>
          <Table
            columns={columns}
            rows={[...data.members].sort((a, b) => b.progress - a.progress)}
            rowKey={(m) => m.id}
            onRowClick={(m) =>
              navigate(generatePath(PATHS.mentor.studentProgress, { studentId: m.id }))
            }
          />
        </Section>
      ) : scores.isError ? (
        <ErrorState onRetry={scores.refetch} />
      ) : !scores.data ? (
        <Loader />
      ) : scores.data.students.length === 0 ? (
        <EmptyState title={t('scores.noStudents')} />
      ) : tab === 'journal' ? (
        <ScoreJournal key={scores.data.month} data={scores.data} {...journal} />
      ) : (
        <MonthSummary data={scores.data} weeksOf={journal.weeksOf} />
      )}
    </>
  );
}
