import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiUserPlus } from 'react-icons/fi';
import { Button, Card, ErrorState, Input, Loader, PageHeader, Select } from '@/shared/ui';
import { useDirectorGroups, useDirectorUsers } from '../api/directorApi';
import { UsersTable } from '../components/UsersTable';
import { AddUserModal } from '../components/AddUserModal';

export default function StudentsDirectorPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useDirectorUsers({
    role: 'student',
    search,
    groupId,
  });
  const groups = useDirectorGroups();

  return (
    <>
      <PageHeader
        title={t('pages.director.students')}
        description={t('users.studentsDescription')}
        actions={
          <Button leftIcon={<FiUserPlus />} onClick={() => setOpen(true)}>
            {t('users.addStudent')}
          </Button>
        }
      />
      <Card className="p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px] lg:w-[560px]">
          <Input
            aria-label={t('common.search')}
            placeholder={t('users.search')}
            leftIcon={<FiSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label={t('users.group')}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder={t('users.allGroups')}
            options={(groups.data ?? []).map((g) => ({ value: g.id, label: g.name }))}
          />
        </div>
        {isLoading ? (
          <Loader />
        ) : isError || !data ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <>
            <p className="mb-2 text-xs text-muted">{t('common.found', { count: data.length })}</p>
            <UsersTable rows={data} role="student" />
          </>
        )}
      </Card>
      <AddUserModal open={open} onClose={() => setOpen(false)} role="student" />
    </>
  );
}
