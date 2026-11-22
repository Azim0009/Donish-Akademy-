import { useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import type { Branch } from '@/core/types/models';
import { formatNumber } from '@/core/utils/format';
import { branchStatusTone } from '@/shared/lib/statusTone';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  Loader,
  PageHeader,
  Table,
  Tabs,
  type Column,
} from '@/shared/ui';
import { useBranches } from '../api/superAdminApi';

type StatusFilter = 'all' | Branch['status'];

export default function BranchesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const { data, isLoading, isError, refetch } = useBranches({ search, status });

  const columns: Column<Branch>[] = [
    {
      key: 'name',
      header: t('branch.branch'),
      cell: (b) => (
        <div className="flex items-center gap-3">
          {b.photoUrl ? (
            <img src={b.photoUrl} alt="" className="h-9 w-12 rounded-ctl object-cover" />
          ) : (
            <span className="flex h-9 w-12 items-center justify-center rounded-ctl bg-brand-soft text-xs font-bold text-brand-strong">
              {b.code}
            </span>
          )}
          <div>
            <p className="font-medium">{b.name}</p>
            <p className="text-xs text-muted">{b.address}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('branch.status'),
      cell: (b) => (
        <Badge tone={branchStatusTone[b.status]} dot>
          {t(`branchStatus.${b.status}`)}
        </Badge>
      ),
    },
    {
      key: 'director',
      header: t('branch.director'),
      hideOnMobile: true,
      cell: (b) =>
        b.directorName ? (
          <span className="flex items-center gap-2">
            <Avatar name={b.directorName} size={26} />
            {b.directorName}
          </span>
        ) : (
          <span className="text-muted">{t('branch.noDirector')}</span>
        ),
    },
    {
      key: 'students',
      header: t('superAdmin.students'),
      className: 'text-right',
      cell: (b) => formatNumber(b.studentsCount),
    },
    {
      key: 'mentors',
      header: t('superAdmin.mentors'),
      className: 'text-right',
      hideOnMobile: true,
      cell: (b) => b.mentorsCount,
    },
    {
      key: 'groups',
      header: t('branch.groups'),
      className: 'text-right',
      hideOnMobile: true,
      cell: (b) => b.groupsCount,
    },
  ];

  return (
    <>
      <PageHeader
        title={t('pages.superAdmin.branches')}
        description={t('superAdmin.branchesDescription')}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => navigate(PATHS.superAdmin.branchCreate)}>
            {t('superAdmin.createBranch')}
          </Button>
        }
      />
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs<StatusFilter>
            value={status}
            onChange={setStatus}
            tabs={[
              { value: 'all', label: t('common.all') },
              { value: 'active', label: t('branchStatus.active') },
              { value: 'suspended', label: t('branchStatus.suspended') },
              { value: 'draft', label: t('branchStatus.draft') },
              { value: 'archived', label: t('branchStatus.archived') },
            ]}
          />
          <Input
            aria-label={t('common.search')}
            placeholder={t('superAdmin.searchBranches')}
            leftIcon={<FiSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lg:w-72"
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
            rowKey={(b) => b.id}
            onRowClick={(b) => navigate(generatePath(PATHS.superAdmin.branch, { branchId: b.id }))}
            emptyTitle={t('superAdmin.noBranches')}
          />
        )}
      </Card>
    </>
  );
}
