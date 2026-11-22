import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiUserPlus } from 'react-icons/fi';
import { Button, Card, ErrorState, Input, Loader, PageHeader } from '@/shared/ui';
import { useDirectorUsers } from '../api/directorApi';
import { UsersTable } from '../components/UsersTable';
import { AddUserModal } from '../components/AddUserModal';

export default function MentorsDirectorPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useDirectorUsers({ role: 'mentor', search });

  return (
    <>
      <PageHeader
        title={t('pages.director.mentors')}
        description={t('users.mentorsDescription')}
        actions={
          <Button leftIcon={<FiUserPlus />} onClick={() => setOpen(true)}>
            {t('users.addMentor')}
          </Button>
        }
      />
      <Card className="p-5">
        <Input
          aria-label={t('common.search')}
          placeholder={t('users.search')}
          leftIcon={<FiSearch />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 sm:w-80"
        />
        {isLoading ? (
          <Loader />
        ) : isError || !data ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <UsersTable rows={data} role="mentor" />
        )}
      </Card>
      <AddUserModal open={open} onClose={() => setOpen(false)} role="mentor" />
    </>
  );
}
