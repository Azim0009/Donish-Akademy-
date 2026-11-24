import { generatePath, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiLock, FiUnlock } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import type { UserListItem } from '@/core/types/models';
import { formatNumber } from '@/core/utils/format';
import { Avatar, Badge, IconButton, ProgressBar, Table, toast, type Column } from '@/shared/ui';
import { useState } from 'react';
import { useToggleBlock } from '../api/directorApi';
import { ManageUser } from './ManageUser';
import { UserRowActions, type ManageMode } from '@/shared/components/UserRowActions';
import { AccessSummary } from '@/shared/components/AccessEditor';
import { userRoles } from '@/core/auth/access';

/** Таблица учеников, менторов или всех сотрудников филиала (staff) */
export function UsersTable({
  rows,
  role,
}: {
  rows: UserListItem[];
  role: 'mentor' | 'student' | 'staff';
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toggle = useToggleBlock();
  const [manage, setManage] = useState<{ mode: ManageMode; user: UserListItem } | null>(null);

  const nameCol: Column<UserListItem> = {
    key: 'name',
    header: t('common.fullName'),
    cell: (u) => (
      <div className="flex items-center gap-3">
        <Avatar name={u.name} size={34} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium">
            {u.name}
            {u.isBlocked && role !== 'student' && <Badge tone="red">{t('users.blocked')}</Badge>}
          </p>
          <p className="truncate text-xs text-muted">{u.email || u.phone}</p>
        </div>
      </div>
    ),
  };
  const statusCol: Column<UserListItem> = {
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
  };
  const actionCol: Column<UserListItem> = {
    key: 'actions',
    header: '',
    className: 'text-right w-px',
    cell: (u) => (
      <IconButton
        label={u.isBlocked ? t('users.unblock') : t('users.block')}
        onClick={(e) => {
          e.stopPropagation();
          toggle.mutate(u.id, {
            onSuccess: (r) =>
              toast(
                r.isBlocked
                  ? t('users.blockedToast', { name: r.name })
                  : t('users.unblockedToast', { name: r.name }),
              ),
          });
        }}
      >
        {u.isBlocked ? <FiUnlock /> : <FiLock />}
      </IconButton>
    ),
  };

  // доступ к разделам настраивается у сотрудников; у учеников — только изменить и удалить
  const manageCol: Column<UserListItem> = {
    key: 'manage',
    header: '',
    className: 'text-right',
    cell: (u) => (
      <div className="flex items-center justify-end gap-0.5">
        {actionCol.cell(u)}
        <UserRowActions
          user={u}
          access={role !== 'student'}
          onAction={(mode, user) => setManage({ mode, user })}
        />
      </div>
    ),
  };

  const positionCol: Column<UserListItem> = {
    key: 'position',
    header: t('staffPage.position'),
    cell: (u) => (
      <div className="flex flex-wrap gap-1">
        {userRoles(u)
          .filter((r) => r !== 'director')
          .map((r) => (
            <Badge key={r} tone={r === u.role ? 'green' : 'gray'}>
              {t(`roles.${r}`)}
            </Badge>
          ))}
      </div>
    ),
  };
  const phoneCol: Column<UserListItem> = {
    key: 'phone',
    header: t('branch.phone'),
    hideOnMobile: true,
    cell: (u) => <span className="whitespace-nowrap text-muted">{u.phone}</span>,
  };
  const accessCol: Column<UserListItem> = {
    key: 'access',
    header: t('access.button'),
    hideOnMobile: true,
    cell: (u) => <AccessSummary user={u} />,
  };

  const columns: Column<UserListItem>[] =
    role === 'staff'
      ? [nameCol, positionCol, phoneCol, accessCol, manageCol]
      : role === 'student'
        ? [
            nameCol,
            {
              key: 'group',
              header: t('users.group'),
              cell: (u) => u.groupName ?? <span className="text-muted">{t('users.noGroup')}</span>,
            },
            {
              key: 'progress',
              header: t('users.progress'),
              hideOnMobile: true,
              cell: (u) => (
                <div className="flex w-36 items-center gap-2">
                  <ProgressBar value={u.progress} size="sm" />
                  <span className="w-9 text-right text-xs text-muted">{u.progress}%</span>
                </div>
              ),
            },
            {
              key: 'xp',
              header: 'XP',
              hideOnMobile: true,
              className: 'text-right',
              cell: (u) => formatNumber(u.xp),
            },
            statusCol,
            manageCol,
          ]
        : [
            nameCol,
            {
              key: 'phone',
              header: t('branch.phone'),
              hideOnMobile: true,
              cell: (u) => <span className="whitespace-nowrap text-muted">{u.phone}</span>,
            },
            {
              key: 'load',
              header: t('director.load'),
              cell: (u) => (
                <span className="whitespace-nowrap">
                  {u.groupsCount} · {u.studentsCount}
                </span>
              ),
            },
            {
              key: 'access',
              header: t('access.button'),
              hideOnMobile: true,
              cell: (u) => <AccessSummary user={u} />,
            },
            manageCol,
          ];

  return (
    <>
      <Table
        columns={columns}
        rows={rows}
        rowKey={(u) => u.id}
        onRowClick={(u) => navigate(generatePath(PATHS.director.user, { userId: u.id }))}
        emptyTitle={t('common.nothingFound')}
      />
      {manage && (
        <ManageUser mode={manage.mode} user={manage.user} onClose={() => setManage(null)} />
      )}
    </>
  );
}
