import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch } from 'react-icons/fi';
import type { AuditAction, AuditLog } from '@/core/types/models';
import { formatDateTime } from '@/core/utils/format';
import { auditTone } from '@/shared/lib/statusTone';
import {
  Avatar,
  Badge,
  Card,
  ErrorState,
  Input,
  Loader,
  PageHeader,
  Select,
  Table,
  type Column,
} from '@/shared/ui';
import { useAuditLogs } from '../api/superAdminApi';

const actions: AuditAction[] = [
  'Create',
  'Update',
  'Delete',
  'AssignRole',
  'ChangeStatus',
  'Block',
  'Login',
];

export default function AuditLogPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const { data, isLoading, isError, refetch } = useAuditLogs({ search, action });

  const columns: Column<AuditLog>[] = [
    {
      key: 'time',
      header: t('audit.time'),
      className: 'whitespace-nowrap text-muted',
      cell: (a) => formatDateTime(a.createdAt),
    },
    {
      key: 'user',
      header: t('audit.who'),
      cell: (a) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={a.userName} size={28} />
          <div>
            <p className="whitespace-nowrap font-medium">{a.userName}</p>
            <p className="text-xs text-muted">{t(`roles.${a.userRole}`)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: t('audit.action'),
      cell: (a) => <Badge tone={auditTone[a.action]}>{t(`audit.actions.${a.action}`)}</Badge>,
    },
    { key: 'desc', header: t('audit.what'), cell: (a) => a.description },
    {
      key: 'branch',
      header: t('branch.branch'),
      hideOnMobile: true,
      cell: (a) => a.branchName ?? '—',
    },
    {
      key: 'ip',
      header: 'IP',
      hideOnMobile: true,
      className: 'text-muted',
      cell: (a) => a.ipAddress,
    },
  ];

  return (
    <>
      <PageHeader title={t('pages.superAdmin.auditLog')} description={t('audit.description')} />
      <Card className="p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px] lg:w-[620px]">
          <Input
            aria-label={t('common.search')}
            placeholder={t('audit.search')}
            leftIcon={<FiSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label={t('audit.action')}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder={t('audit.allActions')}
            options={actions.map((a) => ({ value: a, label: t(`audit.actions.${a}`) }))}
          />
        </div>
        {isLoading ? (
          <Loader />
        ) : isError || !data ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <Table
            columns={columns}
            rows={data}
            rowKey={(a) => a.id}
            emptyTitle={t('common.nothingFound')}
          />
        )}
      </Card>
    </>
  );
}
