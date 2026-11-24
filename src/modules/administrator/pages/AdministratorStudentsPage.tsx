import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiKey, FiSearch, FiUserCheck, FiUserPlus } from 'react-icons/fi';
import type { UserListItem } from '@/core/types/models';
import { timeAgo } from '@/core/utils/format';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ErrorState,
  IconButton,
  Input,
  Loader,
  PageHeader,
  Select,
  Table,
  type Column,
} from '@/shared/ui';
import { useAdministratorStudents, useWonLeads } from '../api/administratorApi';
import { AddStudentModal } from '../components/AddStudentModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';

/**
 * Ученики филиала: поиск, фильтр по группе, добавить ученика (логин — телефон),
 * новый пароль, аккаунты для тех, кто записался через отдел продаж.
 */
export default function AdministratorStudentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const { data, isLoading, isError, refetch } = useAdministratorStudents({ search, groupId });
  const all = useAdministratorStudents({ search: '', groupId: '' });
  const won = useWonLeads();
  const [adding, setAdding] = useState<
    null | { name: string; phone: string; leadId: string } | 'empty'
  >(null);
  const [resetFor, setResetFor] = useState<UserListItem | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, string>();
    (all.data ?? []).forEach((u) => u.groupId && m.set(u.groupId, u.groupName ?? ''));
    return [...m]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [all.data]);

  const columns: Column<UserListItem>[] = [
    {
      key: 'name',
      header: t('common.fullName'),
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size={34} />
          <span className="font-medium">{u.name}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('branch.phone'),
      cell: (u) => <span className="tabular-nums">{u.phone}</span>,
    },
    {
      key: 'group',
      header: t('users.group'),
      cell: (u) => u.groupName ?? <span className="text-muted">{t('users.noGroup')}</span>,
    },
    {
      key: 'status',
      header: t('users.status'),
      cell: (u) =>
        u.isBlocked ? (
          <Badge tone="red">{t('users.blocked')}</Badge>
        ) : (
          <Badge tone="green" dot>
            {t('users.active')}
          </Badge>
        ),
    },
    {
      key: 'last',
      header: t('common.lastActive'),
      hideOnMobile: true,
      cell: (u) => <span className="text-muted">{timeAgo(u.lastActiveAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-px text-right',
      cell: (u) => (
        <IconButton label={t('administrator.newPassword')} onClick={() => setResetFor(u)}>
          <FiKey />
        </IconButton>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('pages.administrator.students')}
        description={t('administrator.studentsDescription')}
        actions={
          <Button leftIcon={<FiUserPlus />} onClick={() => setAdding('empty')}>
            {t('users.addStudent')}
          </Button>
        }
      />
      {(won.data?.length ?? 0) > 0 && (
        <Card className="mb-4 border-brand/30 bg-brand-soft/40 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-strong">
            <FiUserCheck /> {t('administrator.fromSales', { count: won.data!.length })}
          </p>
          <ul className="flex flex-col gap-2">
            {won.data!.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-ctl bg-surface px-3 py-2"
              >
                <span className="font-medium">{l.name}</span>
                <span className="text-sm tabular-nums text-muted">{l.phone}</span>
                <span className="text-xs text-muted">· {l.assignedToName ?? '—'}</span>
                <Button
                  size="sm"
                  className="ml-auto"
                  onClick={() => setAdding({ name: l.name, phone: l.phone, leadId: l.id })}
                >
                  {t('administrator.createAccount')}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card className="p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px] lg:w-[560px]">
          <Input
            aria-label={t('common.search')}
            placeholder={t('administrator.searchStudents')}
            leftIcon={<FiSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label={t('users.group')}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder={t('users.allGroups')}
            options={groups}
          />
        </div>
        {isLoading ? (
          <Loader />
        ) : isError || !data ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <>
            <p className="mb-2 text-xs text-muted">{t('common.found', { count: data.length })}</p>
            <Table
              columns={columns}
              rows={data}
              rowKey={(u) => u.id}
              emptyTitle={t('common.nothingFound')}
            />
          </>
        )}
      </Card>
      {adding && (
        <AddStudentModal
          groups={groups}
          prefill={adding === 'empty' ? undefined : adding}
          onClose={() => setAdding(null)}
        />
      )}
      {resetFor && <ResetPasswordModal student={resetFor} onClose={() => setResetFor(null)} />}
    </>
  );
}
