import { useState } from 'react';
import { generatePath, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import {
  FiArrowRight,
  FiBookOpen,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFileText,
  FiGrid,
  FiLogIn,
  FiPause,
  FiPlay,
  FiPlus,
  FiRefreshCw,
  FiSlash,
  FiTrash2,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import clsx from 'clsx';
import type { AuditAction, CrossRequest } from '@/core/types/models';
import { PATHS } from '@/core/config/paths';
import { formatMoney, formatNumber, timeAgo } from '@/core/utils/format';
import { branchStatusTone } from '@/shared/lib/statusTone';
import { Badge, Button, ErrorState, IconButton, Loader, Section, toast } from '@/shared/ui';
import {
  useBranches,
  useChangeBranchStatus,
  useSuperDashboard,
  type DashboardBranch,
  type Period,
} from '../api/superAdminApi';
import { AssignDirectorModal } from '../components/AssignDirectorModal';
import { BranchMap } from '../components/BranchMap';
import { KpiCard } from '@/shared/components/dashboard/KpiCard';
import { PeriodPicker } from '@/shared/components/dashboard/PeriodPicker';

/** Главная SuperAdmin — по макету: показатели сети, карта, рейтинг, аудит, филиалы и запросы */
export default function SuperAdminDashboardPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>(7);
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useSuperDashboard(period);
  const allBranches = useBranches({});

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const vs = t('dashboard.vsPrev', { count: period });
  const k = data.kpi;

  const exportCsv = () => {
    const head = [
      t('branch.branch'),
      t('dashboard.status'),
      t('roles.director'),
      t('dashboard.students'),
      t('dashboard.courses'),
      t('dashboard.revenueN', { count: period }),
    ];
    const rows = data.branches.map((b) => [
      b.name,
      t(`branchStatus.${b.status}`),
      b.directorName ?? '—',
      b.studentsCount,
      b.coursesCount ?? 0,
      b.revenue,
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `donish-report-${period}d.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(t('dashboard.exported'), 'success');
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="h-display text-2xl sm:text-[28px]">
            SuperAdmin <span className="text-muted">·</span> {t('dashboard.allBranches')}
          </h1>
          <p className="mt-1 text-sm text-muted">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PeriodPicker value={period} onChange={setPeriod} />
          <Button rightIcon={<FiDownload />} onClick={exportCsv}>
            {t('dashboard.export')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 md:grid-cols-3 xl:gap-4 2xl:grid-cols-6">
        <KpiCard
          icon={<FiUsers />}
          label={t('dashboard.totalStudents')}
          value={formatNumber(k.students.value)}
          delta={k.students.delta}
          hint={vs}
        />
        <KpiCard
          icon={<FiBookOpen />}
          label={t('dashboard.activeCourses')}
          value={formatNumber(k.courses.value)}
          delta={k.courses.delta}
          hint={vs}
        />
        <KpiCard
          icon={<FiGrid />}
          label={t('dashboard.activeGroups')}
          value={formatNumber(k.groups.value)}
          delta={k.groups.delta}
          hint={vs}
        />
        <KpiCard
          icon={<FiUserCheck />}
          label={t('dashboard.mentors')}
          value={formatNumber(k.mentors.value)}
          delta={k.mentors.delta}
          hint={vs}
        />
        <KpiCard
          icon={<FiDollarSign />}
          label={t('dashboard.revenueN', { count: period })}
          value={formatMoney(k.revenue.value)}
          delta={k.revenue.delta}
          hint={vs}
        />
        <KpiCard
          icon={<FiFileText />}
          label={t('dashboard.newRequests')}
          value={formatNumber(k.requests.value)}
          delta={k.requests.delta}
          hint={vs}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3 xl:gap-5">
        <Section title={t('dashboard.map')}>
          <BranchMap branches={data.branches} />
        </Section>

        <Section
          title={
            <>
              {t('dashboard.ranking')}{' '}
              <span className="font-normal text-muted">({t('dashboard.byRevenue')})</span>
            </>
          }
          action={
            <Link
              to={PATHS.superAdmin.finance}
              className="whitespace-nowrap text-[13px] font-medium text-brand-strong hover:underline"
            >
              {t('common.openAll')}
            </Link>
          }
        >
          <ol className="flex flex-col">
            {data.ranking.map((f, i) => (
              <li
                key={f.branchId}
                className="flex items-center gap-3 border-b border-line py-3 last:border-0"
              >
                <span
                  className={clsx(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold',
                    i === 0
                      ? 'bg-amber-soft text-amber'
                      : i === 1
                        ? 'bg-sunken text-ink'
                        : i === 2
                          ? 'bg-danger-soft text-danger'
                          : 'text-muted',
                  )}
                >
                  {i + 1}
                </span>
                <Link
                  to={generatePath(PATHS.superAdmin.branch, { branchId: f.branchId })}
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:text-brand-strong"
                >
                  {t('dashboard.branchName', { name: f.name })}
                </Link>
                <span className="whitespace-nowrap text-sm tabular-nums">
                  {formatMoney(f.revenue)}
                </span>
                <Delta value={f.delta} />
              </li>
            ))}
          </ol>
        </Section>

        <Section
          className="lg:col-span-2 xl:col-span-1"
          title={
            <>
              {t('dashboard.audit')}{' '}
              <span className="font-normal text-muted">({t('dashboard.lastEvents')})</span>
            </>
          }
          action={
            <Link
              to={PATHS.superAdmin.auditLog}
              className="whitespace-nowrap text-[13px] font-medium text-brand-strong hover:underline"
            >
              {t('common.openAll')}
            </Link>
          }
        >
          <ul className="flex flex-col gap-3.5">
            {data.audit.map((a) => {
              const { icon: Icon, cls } = AUDIT_ICON[a.action];
              return (
                <li key={a.id} className="flex items-start gap-3">
                  <span
                    className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-full', cls)}
                  >
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.userName}</p>
                    <p className="truncate text-xs text-muted">{a.description}</p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs text-muted">
                    {timeAgo(a.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      <div className="mt-4 grid gap-4 xl:gap-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <Section
          title={t('dashboard.manageBranches')}
          action={
            <Link to={PATHS.superAdmin.branchCreate}>
              <Button size="sm" variant="soft" leftIcon={<FiPlus />}>
                {t('superAdmin.createBranch')}
              </Button>
            </Link>
          }
          bodyClassName="px-0 pb-2"
        >
          <BranchesTable branches={data.branches} period={period} onAssign={setAssignFor} />
        </Section>

        <Section
          title={t('dashboard.crossRequests')}
          action={
            data.newRequests > 0 ? (
              <Badge tone="red">{t('dashboard.newCount', { count: data.newRequests })}</Badge>
            ) : undefined
          }
        >
          <div className="flex h-full flex-col">
            {data.requests.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">{t('requests.empty')}</p>
            ) : (
              <ul className="flex flex-col">
                {data.requests.map((r) => (
                  <RequestRow key={r.id} r={r} />
                ))}
              </ul>
            )}
            <Link to={PATHS.superAdmin.requests} className="mt-auto pt-4">
              <Button className="w-full sm:w-auto 2xl:w-full" rightIcon={<FiArrowRight />}>
                {t('dashboard.toRequests')}
              </Button>
            </Link>
          </div>
        </Section>
      </div>

      <AssignDirectorModal
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        branches={allBranches.data ?? []}
        branchId={assignFor ?? undefined}
      />
    </>
  );
}

const AUDIT_ICON: Record<AuditAction, { icon: IconType; cls: string }> = {
  Create: { icon: FiPlus, cls: 'bg-info-soft text-info' },
  Update: { icon: FiRefreshCw, cls: 'bg-brand-soft text-brand-strong' },
  Delete: { icon: FiTrash2, cls: 'bg-danger-soft text-danger' },
  AssignRole: { icon: FiUserPlus, cls: 'bg-brand-soft text-brand-strong' },
  ChangeStatus: { icon: FiPause, cls: 'bg-amber-soft text-amber' },
  Block: { icon: FiSlash, cls: 'bg-danger-soft text-danger' },
  Login: { icon: FiLogIn, cls: 'bg-sunken text-muted' },
};

function Delta({ value }: { value: number }) {
  return (
    <span
      className={clsx(
        'w-16 shrink-0 text-right text-xs font-semibold tabular-nums',
        value >= 0 ? 'text-brand-strong' : 'text-danger',
      )}
    >
      {value >= 0 ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  );
}

export function RequestRow({ r }: { r: CrossRequest }) {
  const { t } = useTranslation();
  return (
    <li className="flex items-start justify-between gap-3 border-b border-line py-3 first:pt-0 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{t(`requests.types.${r.type}`)}</p>
        <p className="truncate text-xs text-muted">
          {r.fromBranch}
          {r.toBranch && ` → ${r.toBranch}`} · {r.subject}
        </p>
      </div>
      <span className="shrink-0 whitespace-nowrap text-xs text-muted">{timeAgo(r.createdAt)}</span>
    </li>
  );
}

function BranchesTable({
  branches,
  period,
  onAssign,
}: {
  branches: DashboardBranch[];
  period: Period;
  onAssign: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-y border-line bg-sunken/60 text-left text-xs text-muted">
            <th className="px-5 py-2.5 font-medium">{t('branch.branch')}</th>
            <th className="px-3 py-2.5 font-medium">{t('dashboard.status')}</th>
            <th className="hidden px-3 py-2.5 font-medium md:table-cell">{t('roles.director')}</th>
            <th className="px-3 py-2.5 text-right font-medium">{t('dashboard.students')}</th>
            <th className="hidden px-3 py-2.5 text-right font-medium lg:table-cell">
              {t('dashboard.courses')}
            </th>
            <th className="px-3 py-2.5 text-right font-medium">
              {t('dashboard.revenueN', { count: period })}
            </th>
            <th className="px-5 py-2.5 text-right font-medium">{t('dashboard.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b) => (
            <BranchRow key={b.id} b={b} onAssign={onAssign} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BranchRow({ b, onAssign }: { b: DashboardBranch; onAssign: (id: string) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = useChangeBranchStatus(b.id);
  const path = generatePath(PATHS.superAdmin.branch, { branchId: b.id });
  const canToggle = b.status === 'active' || b.status === 'suspended';
  const toggle = () =>
    status.mutate(b.status === 'active' ? 'suspended' : 'active', {
      onSuccess: () =>
        toast(
          t(b.status === 'active' ? 'dashboard.suspended' : 'dashboard.activated', {
            name: b.name,
          }),
          'success',
        ),
    });

  return (
    <tr className="border-b border-line last:border-0 hover:bg-sunken/40">
      <td className="px-5 py-2.5 font-medium">
        <Link to={path} className="hover:text-brand-strong">
          {b.name}
        </Link>
      </td>
      <td className="px-3 py-2.5">
        <Badge tone={branchStatusTone[b.status]}>{t(`branchStatus.${b.status}`)}</Badge>
      </td>
      <td className="hidden max-w-[180px] truncate px-3 py-2.5 text-muted md:table-cell">
        {b.directorName ?? '—'}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(b.studentsCount)}</td>
      <td className="hidden px-3 py-2.5 text-right tabular-nums lg:table-cell">
        {b.coursesCount ?? 0}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
        {formatMoney(b.revenue)}
      </td>
      <td className="px-5 py-1.5">
        <div className="flex justify-end gap-0.5">
          <IconButton
            label={t('directors.assign')}
            onClick={() => onAssign(b.id)}
            className="text-brand-strong"
          >
            <FiUserPlus />
          </IconButton>
          <IconButton label={t('dashboard.open')} onClick={() => navigate(path)}>
            <FiEye />
          </IconButton>
          <IconButton
            label={t('common.edit')}
            onClick={() => navigate(generatePath(PATHS.superAdmin.branchEdit, { branchId: b.id }))}
          >
            <FiEdit2 />
          </IconButton>
          {canToggle && (
            <IconButton
              label={t(b.status === 'active' ? 'dashboard.suspend' : 'dashboard.activate')}
              onClick={toggle}
              disabled={status.isPending}
              className={b.status === 'active' ? 'text-amber' : 'text-brand-strong'}
            >
              {b.status === 'active' ? <FiPause /> : <FiPlay />}
            </IconButton>
          )}
        </div>
      </td>
    </tr>
  );
}
