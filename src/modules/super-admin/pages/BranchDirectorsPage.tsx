import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCreditCard, FiSearch, FiUserPlus } from 'react-icons/fi';
import type { UserListItem } from '@/core/types/models';
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
  Table,
  type Column,
} from '@/shared/ui';
import { useBranchDirectors, useBranches } from '../api/superAdminApi';
import { AssignDirectorModal } from '../components/AssignDirectorModal';
import { AccessSummary } from '../components/AccessModal';
import { ManageUser } from '../components/ManageUser';
import { UserRowActions, type ManageMode } from '@/shared/components/UserRowActions';
import { PassportViewModal } from '../components/PassportViewModal';

export default function BranchDirectorsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState<{ mode: ManageMode; user: UserListItem } | null>(null);
  const [passportFor, setPassportFor] = useState<UserListItem | null>(null);
  const { data, isLoading, isError, refetch } = useBranchDirectors(search);
  const branches = useBranches({});

  const columns: Column<UserListItem>[] = [
    {
      key: 'name',
      header: t('common.fullName'),
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} />
          <div>
            <p className="font-medium">{u.name}</p>
            <p className="text-xs text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: t('branch.branch'),
      cell: (u) => <Badge tone="green">{u.branchName}</Badge>,
    },
    {
      key: 'phone',
      header: t('branch.phone'),
      hideOnMobile: true,
      cell: (u) => (
        <span className="whitespace-nowrap text-muted">
          {u.phone}
          {u.phone2 && (
            <>
              <br />
              {u.phone2}
            </>
          )}
        </span>
      ),
    },
    { key: 'access', header: t('access.button'), cell: (u) => <AccessSummary user={u} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (u) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton label={t('passport.view')} onClick={() => setPassportFor(u)}>
            <FiCreditCard />
          </IconButton>
          <UserRowActions user={u} onAction={(mode, user) => setManage({ mode, user })} />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('pages.superAdmin.branchDirectors')}
        description={t('directors.description')}
        actions={
          <Button leftIcon={<FiUserPlus />} onClick={() => setOpen(true)}>
            {t('directors.assign')}
          </Button>
        }
      />
      <Card className="p-5">
        <Input
          aria-label={t('common.search')}
          placeholder={t('directors.search')}
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
          <Table
            columns={columns}
            rows={data}
            rowKey={(u) => u.id}
            emptyTitle={t('common.nothingFound')}
          />
        )}
      </Card>
      <AssignDirectorModal
        open={open}
        onClose={() => setOpen(false)}
        branches={branches.data ?? []}
      />
      {manage && (
        <ManageUser mode={manage.mode} user={manage.user} onClose={() => setManage(null)} />
      )}
      {passportFor && <PassportViewModal user={passportFor} onClose={() => setPassportFor(null)} />}
    </>
  );
}
