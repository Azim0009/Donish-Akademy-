import type { UserListItem } from '@/core/types/models';
import { useState } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiEdit2, FiMail, FiMapPin, FiPhone, FiUserPlus } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { BRANCH_FEATURES } from '@/core/navigation/branchFeatures';
import type { BranchStatus } from '@/core/types/models';
import { formatDate, formatNumber, timeAgo } from '@/core/utils/format';
import { branchStatusTone } from '@/shared/lib/statusTone';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loader,
  PageHeader,
  Section,
  Select,
  StatCard,
  toast,
} from '@/shared/ui';
import { TrendChart } from '@/shared/charts/Charts';
import { useBranch, useBranches, useChangeBranchStatus } from '../api/superAdminApi';
import { AssignDirectorModal } from '../components/AssignDirectorModal';
import { AccessSummary } from '../components/AccessModal';
import { ManageUser } from '../components/ManageUser';
import { UserRowActions, type ManageMode } from '@/shared/components/UserRowActions';

export default function BranchDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { branchId = '' } = useParams();
  const { data, isLoading, isError, refetch } = useBranch(branchId);
  const branches = useBranches({});
  const changeStatus = useChangeBranchStatus(branchId);
  const [assignOpen, setAssignOpen] = useState(false);
  const [manage, setManage] = useState<{ mode: ManageMode; user: UserListItem } | null>(null);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const b = data.branch;

  const onStatus = (status: BranchStatus) =>
    changeStatus.mutate(status, {
      onSuccess: () =>
        toast(t('superAdmin.statusChanged', { status: t(`branchStatus.${status}`) })),
    });

  return (
    <>
      <PageHeader
        back={{ to: PATHS.superAdmin.branches, label: t('pages.superAdmin.branches') }}
        title={b.name}
        meta={
          <Badge tone={branchStatusTone[b.status]} dot>
            {t(`branchStatus.${b.status}`)}
          </Badge>
        }
        description={b.description}
        actions={
          <>
            <Select
              aria-label={t('branch.status')}
              value={b.status}
              onChange={(e) => onStatus(e.target.value as BranchStatus)}
              options={(['draft', 'active', 'suspended', 'archived'] as const).map((s) => ({
                value: s,
                label: t(`branchStatus.${s}`),
              }))}
              className="w-44"
            />
            <Button
              variant="secondary"
              leftIcon={<FiEdit2 />}
              onClick={() => navigate(generatePath(PATHS.superAdmin.branchEdit, { branchId }))}
            >
              {t('common.edit')}
            </Button>
          </>
        }
      />

      {b.photoUrl && (
        <img
          src={b.photoUrl}
          alt={b.name}
          className="mb-6 aspect-[16/4] max-h-64 w-full rounded-card object-cover"
        />
      )}

      {b.status === 'suspended' && (
        <Card className="mb-6 border-amber/40 bg-amber-soft p-4 text-sm">
          {t('superAdmin.suspendedNote')}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('superAdmin.students')} value={formatNumber(b.studentsCount)} />
        <StatCard label={t('superAdmin.mentors')} value={b.mentorsCount} tone="amber" />
        <StatCard label={t('branch.groups')} value={b.groupsCount} tone="info" />
        <StatCard label={t('superAdmin.completionRate')} value={`${b.completionRate}%`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <Section title={t('superAdmin.growth')}>
          {b.studentsCount ? (
            <TrendChart
              data={data.growth}
              xKey="label"
              yKey="students"
              name={t('superAdmin.students')}
              height={220}
            />
          ) : (
            <EmptyState title={t('superAdmin.noStudentsYet')} />
          )}
        </Section>

        <Section title={t('branch.contacts')}>
          <ul className="flex flex-col gap-3 text-sm">
            <li className="flex gap-3">
              <FiMapPin className="mt-0.5 shrink-0 text-muted" />
              {b.address}
            </li>
            <li className="flex gap-3">
              <FiPhone className="mt-0.5 shrink-0 text-muted" />
              <span>
                {b.phone}
                {b.phone2 && (
                  <>
                    <br />
                    {b.phone2}
                  </>
                )}
              </span>
            </li>
            <li className="flex gap-3">
              <FiMail className="mt-0.5 shrink-0 text-muted" />
              {b.email}
            </li>
          </ul>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            <dt className="text-muted">{t('branch.code')}</dt>
            <dd className="font-medium">{b.code}</dd>
            <dt className="text-muted">{t('branch.timeZone')}</dt>
            <dd className="font-medium">{b.timeZone}</dd>
            <dt className="text-muted">{t('branch.createdAt')}</dt>
            <dd className="font-medium">{formatDate(b.createdAt)}</dd>
          </dl>
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-[13px] font-medium text-muted">{t('features.title')}</p>
            <div className="flex flex-wrap gap-1.5">
              {BRANCH_FEATURES.map((f) => {
                const on = !b.features || b.features.includes(f.key);
                return (
                  <Badge key={f.key} tone={on ? 'green' : 'gray'}>
                    {on ? '✓' : '✕'} {t(f.labelKey)}
                  </Badge>
                );
              })}
            </div>
          </div>
        </Section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Section
          title={t('branch.directors')}
          action={
            <Button
              size="sm"
              variant="soft"
              leftIcon={<FiUserPlus />}
              onClick={() => setAssignOpen(true)}
            >
              {t('directors.assign')}
            </Button>
          }
        >
          {data.directors.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {data.directors.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <Avatar name={a.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{a.name}</p>
                    <p className="truncate text-xs text-muted">
                      {a.email} · {a.phone}
                    </p>
                  </div>
                  <AccessSummary user={a} />
                  <UserRowActions user={a} onAction={(mode, user) => setManage({ mode, user })} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={t('branch.noDirector')}
              description={t('superAdmin.noDirectorHint')}
            />
          )}
        </Section>

        <Section title={t('superAdmin.branchAudit')}>
          {data.audit.length ? (
            <ul className="flex flex-col gap-3">
              {data.audit.map((a) => (
                <li key={a.id} className="text-sm">
                  <p>{a.description}</p>
                  <p className="text-xs text-muted">
                    {a.userName} · {timeAgo(a.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t('superAdmin.noAudit')} />
          )}
        </Section>
      </div>

      <AssignDirectorModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        branches={branches.data ?? [b]}
        branchId={b.id}
      />
      {manage && (
        <ManageUser mode={manage.mode} user={manage.user} onClose={() => setManage(null)} />
      )}
    </>
  );
}
