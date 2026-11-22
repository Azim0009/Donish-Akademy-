import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiLogIn, FiSearch } from 'react-icons/fi';
import type { UserListItem } from '@/core/types/models';
import { ROLE_HOME, type Role } from '@/core/auth/roles';
import { userRoles } from '@/core/auth/access';
import { useAuthStore } from '@/core/auth/authStore';
import { env } from '@/core/config/env';
import {
  Avatar,
  Badge,
  Card,
  ErrorState,
  IconButton,
  Input,
  Loader,
  PageHeader,
  Select,
  Table,
  type BadgeTone,
  type Column,
} from '@/shared/ui';
import { useAllUsers, useBranches } from '../api/superAdminApi';
import { ManageUser } from '../components/ManageUser';
import { UserRowActions, type ManageMode } from '@/shared/components/UserRowActions';

const roleTone: Record<Role, BadgeTone> = {
  super_admin: 'red',
  director: 'green',
  administrator: 'amber',
  mentor: 'blue',
  student: 'gray',
  accountant: 'amber',
  cleaner: 'gray',
  sales: 'blue',
};

export default function AllUsersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [branchId, setBranchId] = useState('');
  const { data, isLoading, isError, refetch } = useAllUsers({ search, role, branchId });
  const branches = useBranches({});
  const [manage, setManage] = useState<{ mode: ManageMode; user: UserListItem } | null>(null);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  // Только для разработки: войти под сотрудником, чтобы проверить его доступ
  const loginAs = (u: UserListItem) => {
    setSession(
      {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        roles: u.roles,
        deniedSections: u.deniedSections,
        branchFeatures: branches.data?.find((b) => b.id === u.branchId)?.features,
        branchId: u.branchId,
        branchName: u.branchName,
        avatarUrl: null,
        level: 0,
        xp: u.xp,
        language: 'ru',
        theme: 'light',
        createdAt: u.createdAt,
        isBlocked: u.isBlocked,
      },
      `dev-token-${u.id}`,
    );
    navigate(ROLE_HOME[u.role]);
  };

  const columns: Column<UserListItem>[] = [
    {
      key: 'name',
      header: t('common.fullName'),
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size={32} />
          <div>
            <p className="font-medium">{u.name}</p>
            <p className="text-xs text-muted">
              {u.email || u.phone}
              {u.groupName ? ` · ${u.groupName}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('users.role'),
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {userRoles(u).map((r) => (
            <Badge key={r} tone={roleTone[r]}>
              {t(`roles.${r}`)}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: 'branch', header: t('branch.branch'), cell: (u) => u.branchName ?? '—' },
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
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (u) =>
        u.role === 'student' || u.role === 'super_admin' ? null : (
          <div className="flex items-center justify-end gap-0.5">
            <UserRowActions user={u} onAction={(mode, user) => setManage({ mode, user })} />
            {env.isDev && (
              <IconButton label={t('access.loginAs')} onClick={() => loginAs(u)}>
                <FiLogIn />
              </IconButton>
            )}
          </div>
        ),
    },
  ];

  return (
    <>
      <PageHeader title={t('pages.superAdmin.users')} description={t('users.allDescription')} />
      <Card className="p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Input
            aria-label={t('common.search')}
            placeholder={t('users.search')}
            leftIcon={<FiSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label={t('users.role')}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={t('users.allRoles')}
            options={(
              [
                'director',
                'administrator',
                'mentor',
                'student',
                'accountant',
                'cleaner',
                'sales',
              ] as const
            ).map((r) => ({ value: r, label: t(`roles.${r}`) }))}
          />
          <Select
            aria-label={t('branch.branch')}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            placeholder={t('users.allBranches')}
            options={(branches.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
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
      {manage && (
        <ManageUser mode={manage.mode} user={manage.user} onClose={() => setManage(null)} />
      )}
    </>
  );
}
