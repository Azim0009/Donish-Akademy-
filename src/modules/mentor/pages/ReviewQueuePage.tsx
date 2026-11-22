import { useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiSearch } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import type { Submission } from '@/core/types/models';
import { timeAgo } from '@/core/utils/format';
import { submissionTone } from '@/shared/lib/statusTone';
import { Avatar, Badge, Card, ErrorState, Input, Loader, PageHeader, Table, Tabs, type Column } from '@/shared/ui';
import { useSubmissions } from '../api/mentorApi';

type Filter = 'pending' | 'passed' | 'failed' | 'all';

export default function ReviewQueuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Filter>('pending');
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useSubmissions({ status, search });

  const columns: Column<Submission>[] = [
    {
      key: 'student',
      header: t('mentor.student'),
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.studentName} size={32} />
          <div>
            <p className="font-medium">{s.studentName}</p>
            <p className="text-xs text-muted">{s.groupName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'task',
      header: t('mentor.task'),
      cell: (s) => (
        <div>
          <p>{s.exerciseTitle}</p>
          <p className="text-xs text-muted">{s.moduleTitle} · {s.lessonTitle}</p>
        </div>
      ),
    },
    { key: 'attempt', header: t('mentor.attempt'), hideOnMobile: true, className: 'text-center', cell: (s) => s.attempt },
    { key: 'time', header: t('mentor.sent'), hideOnMobile: true, cell: (s) => <span className="text-muted">{timeAgo(s.submittedAt)}</span> },
    { key: 'status', header: t('users.status'), cell: (s) => <Badge tone={submissionTone[s.status]} dot>{t(`submission.${s.status}`)}</Badge> },
  ];

  return (
    <>
      <PageHeader title={t('pages.mentor.reviewQueue')} description={t('mentor.queueDescription')} />
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs<Filter>
            value={status}
            onChange={setStatus}
            tabs={[
              { value: 'pending', label: t('submission.pending') },
              { value: 'passed', label: t('submission.passed') },
              { value: 'failed', label: t('submission.failed') },
              { value: 'all', label: t('common.all') },
            ]}
          />
          <Input aria-label={t('common.search')} placeholder={t('mentor.searchQueue')} leftIcon={<FiSearch />} value={search} onChange={(e) => setSearch(e.target.value)} className="lg:w-72" />
        </div>
        {isLoading ? <Loader /> : isError || !data ? <ErrorState onRetry={refetch} /> : (
          <Table columns={columns} rows={data} rowKey={(s) => s.id} onRowClick={(s) => navigate(generatePath(PATHS.mentor.submission, { submissionId: s.id }))} emptyTitle={status === 'pending' ? t('mentor.allReviewed') : t('common.nothingFound')} />
        )}
      </Card>
    </>
  );
}
