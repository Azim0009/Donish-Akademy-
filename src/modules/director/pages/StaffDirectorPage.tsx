import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiUserPlus } from 'react-icons/fi';
import { DIRECTOR_ASSIGNABLE, userRoles, type DirectorAssignable } from '@/core/auth/access';
import { Button, Card, ErrorState, Input, Loader, PageHeader, Tabs } from '@/shared/ui';
import { useDirectorUsers } from '../api/directorApi';
import { UsersTable } from '../components/UsersTable';
import { AddUserModal } from '../components/AddUserModal';

type Tab = 'all' | DirectorAssignable;

/**
 * Все сотрудники филиала в одном месте: администратор, менторы, бухгалтер, уборщик, продажи.
 * Добавить, изменить, доступ, заблокировать, удалить. Человек с несколькими ролями виден в каждой.
 */
export default function StaffDirectorPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useDirectorUsers({ role: 'staff', search });

  const has = (r: DirectorAssignable) => (u: { role: string; roles?: string[] }) =>
    userRoles(u as never).includes(r);
  const rows = useMemo(() => (data ?? []).filter((u) => tab === 'all' || has(tab)(u)), [data, tab]);
  const count = (r: Tab) => (data ?? []).filter((u) => r === 'all' || has(r)(u)).length;

  return (
    <>
      <PageHeader
        title={t('pages.director.staff')}
        description={t('staffPage.description')}
        actions={
          <Button leftIcon={<FiUserPlus />} onClick={() => setOpen(true)}>
            {t('staffPage.add')}
          </Button>
        }
      />
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="-mx-1 overflow-x-auto px-1">
            <Tabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: t('staffPage.all'), count: count('all') },
                ...DIRECTOR_ASSIGNABLE.map((r) => ({
                  value: r as Tab,
                  label: t(`staffPage.tab.${r}`),
                  count: count(r),
                })),
              ]}
            />
          </div>
          <Input
            aria-label={t('common.search')}
            placeholder={t('users.search')}
            leftIcon={<FiSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lg:ml-auto lg:w-72"
          />
        </div>
        {isLoading ? (
          <Loader />
        ) : isError || !data ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <UsersTable rows={rows} role="staff" />
        )}
      </Card>
      <AddUserModal
        open={open}
        onClose={() => setOpen(false)}
        role={tab === 'all' ? 'administrator' : tab}
        roleSelectable
      />
    </>
  );
}
