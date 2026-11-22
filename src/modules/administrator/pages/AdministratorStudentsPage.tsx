import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch } from 'react-icons/fi';
import type { UserListItem } from '@/core/types/models';
import { timeAgo } from '@/core/utils/format';
import { Avatar, Badge, Card, ErrorState, Input, Loader, PageHeader, Select, Table, type Column } from '@/shared/ui';
import { useAdministratorStudents } from '../api/administratorApi';

/** Ученики филиала: поиск по имени или телефону, фильтр по группе */
export default function AdministratorStudentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const { data, isLoading, isError, refetch } = useAdministratorStudents({ search, groupId });
  const all = useAdministratorStudents({ search: '', groupId: '' });

  const groups = useMemo(() => {
    const m = new Map<string, string>();
    (all.data ?? []).forEach((u) => u.groupId && m.set(u.groupId, u.groupName ?? ''));
    return [...m].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
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
    { key: 'phone', header: t('branch.phone'), cell: (u) => <span className="tabular-nums">{u.phone}</span> },
    { key: 'group', header: t('users.group'), cell: (u) => u.groupName ?? <span className="text-muted">{t('users.noGroup')}</span> },
    { key: 'status', header: t('users.status'), cell: (u) => (u.isBlocked ? <Badge tone="red">{t('users.blocked')}</Badge> : <Badge tone="green" dot>{t('users.active')}</Badge>) },
    { key: 'last', header: t('common.lastActive'), hideOnMobile: true, cell: (u) => <span className="text-muted">{timeAgo(u.lastActiveAt)}</span> },
  ];

  return (
    <>
      <PageHeader title={t('pages.administrator.students')} description={t('administrator.studentsDescription')} />
      <Card className="p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px] lg:w-[560px]">
          <Input aria-label={t('common.search')} placeholder={t('administrator.searchStudents')} leftIcon={<FiSearch />} value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select aria-label={t('users.group')} value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder={t('users.allGroups')} options={groups} />
        </div>
        {isLoading ? <Loader /> : isError || !data ? <ErrorState onRetry={refetch} /> : (
          <>
            <p className="mb-2 text-xs text-muted">{t('common.found', { count: data.length })}</p>
            <Table columns={columns} rows={data} rowKey={(u) => u.id} emptyTitle={t('common.nothingFound')} />
          </>
        )}
      </Card>
    </>
  );
}
