import { useEffect, useRef, useState } from 'react';
import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import {
  FiArrowRight,
  FiSend,
  FiBookOpen,
  FiBriefcase,
  FiCheckSquare,
  FiChevronDown,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiInbox,
  FiPlus,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import clsx from 'clsx';
import { PATHS } from '@/core/config/paths';
import { formatMoney, formatNumber, timeAgo } from '@/core/utils/format';
import type { Period } from '@/shared/lib/period';
import { KpiCard } from '@/shared/components/dashboard/KpiCard';
import { PeriodPicker } from '@/shared/components/dashboard/PeriodPicker';
import { Avatar, Badge, Button, ErrorState, Loader, Section } from '@/shared/ui';
import { useDirectorDashboard, type DirectorDashboard } from '../api/directorApi';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { AddUserModal } from '../components/AddUserModal';

type Create = 'group' | 'mentor' | 'student' | 'staff' | null;

/** Главная директора — по макету: показатели филиала, группы, менторы, заявки, расписание, проверки */
export default function DirectorDashboardPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>(7);
  const [create, setCreate] = useState<Create>(null);
  const { data, isLoading, isError, refetch } = useDirectorDashboard(period);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const vs = t('dashboard.vsPrev', { count: period });
  const k = data.kpi;
  const all = (to: string, label = t('common.openAll')) => (
    <Link
      to={to}
      className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-medium text-brand-strong hover:underline"
    >
      {label} <FiArrowRight />
    </Link>
  );

  return (
    <div className="[container-type:inline-size]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="h-display text-2xl sm:text-[28px]">
            {t('roles.director')} <span className="text-muted">·</span>{' '}
            {t('dashboard.branchName', { name: data.branchName })}
          </h1>
          <p className="mt-1 text-sm text-muted">{t('directorDash.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PeriodPicker value={period} onChange={setPeriod} />
          <CreateMenu onPick={setCreate} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 [@container(min-width:520px)]:grid-cols-2 [@container(min-width:720px)]:grid-cols-3 [@container(min-width:1150px)]:grid-cols-5 [@container(min-width:1150px)]:gap-4">
        <KpiCard
          icon={<FiUsers />}
          label={t('dashboard.students')}
          value={formatNumber(k.students.value)}
          delta={k.students.delta}
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
          icon={<FiFileText />}
          label={t('dashboard.newRequests')}
          value={formatNumber(k.applications.value)}
          delta={k.applications.delta}
          hint={vs}
        />
        <KpiCard
          icon={<FiDollarSign />}
          label={t('dashboard.revenueN', { count: period })}
          value={formatMoney(k.revenue.value)}
          delta={k.revenue.delta}
          hint={vs}
        />
      </div>

      <div className="mt-4 grid gap-4 [@container(min-width:720px)]:grid-cols-2 [@container(min-width:1150px)]:grid-cols-3 [@container(min-width:1150px)]:gap-5">
        <Section
          title={t('directorDash.groupsInProgress')}
          action={all(PATHS.director.groups, t('directorDash.allGroups'))}
        >
          <ul className="flex flex-col gap-3.5">
            {data.groups.map((g) => (
              <li
                key={g.id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto_auto] items-center gap-3 text-sm"
              >
                <Link
                  to={generatePath(PATHS.director.group, { groupId: g.id })}
                  className="truncate font-medium hover:text-brand-strong"
                >
                  {g.name}
                </Link>
                <Bar value={g.avgProgress} />
                <span className="text-xs tabular-nums text-muted">
                  {g.studentsCount}/{g.capacity}
                </span>
                <span className="w-9 text-right text-xs font-semibold tabular-nums">
                  {g.avgProgress}%
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">{t('directorDash.groupsHint')}</p>
        </Section>

        <Section
          title={t('directorDash.mentorLoad')}
          action={all(PATHS.director.mentors, t('directorDash.allMentors'))}
        >
          <ul className="flex flex-col gap-3">
            {data.mentorLoad.map((m) => (
              <li
                key={m.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 text-sm"
              >
                <Avatar name={m.name} size={30} />
                <div className="min-w-0">
                  <Link
                    to={generatePath(PATHS.director.user, { userId: m.id })}
                    className="block truncate font-medium hover:text-brand-strong"
                  >
                    {m.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {t('directorDash.groupsN', { count: m.groups })}
                  </p>
                </div>
                <Bar
                  value={m.load}
                  tone={
                    m.load >= 85
                      ? 'danger'
                      : m.load >= 60
                        ? 'amber'
                        : m.load === 0
                          ? 'muted'
                          : 'brand'
                  }
                />
                <span className="w-9 text-right text-xs font-semibold tabular-nums">{m.load}%</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          className="[@container(min-width:720px)]:col-span-2 [@container(min-width:1150px)]:col-span-1"
          title={t('directorDash.applications')}
          action={all(PATHS.director.leads, t('directorDash.allLeads'))}
        >
          <ul className="flex flex-col">
            {data.applications.slice(0, 4).map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 border-b border-line py-2.5 first:pt-0 last:border-0"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-info-soft text-info">
                  <FiInbox />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="truncate text-xs text-muted">
                    {timeAgo(a.createdAt)} · {t(`leads.src.${a.source}`)}
                  </p>
                </div>
                <Badge tone="green">{t('directorDash.new')}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="mt-4 grid gap-4 [@container(min-width:720px)]:grid-cols-2 [@container(min-width:1150px)]:grid-cols-3 [@container(min-width:1150px)]:gap-5">
        <Section title={t('directorDash.today')}>
          <TodaySchedule items={data.today} />
        </Section>

        <Section
          title={t('directorDash.toReview')}
          action={
            <Badge tone="amber">{t('directorDash.works', { count: data.pendingTotal })}</Badge>
          }
        >
          {data.reviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t('directorDash.allChecked')}</p>
          ) : (
            <ul className="flex flex-col">
              {data.reviews.map((r) => (
                <li
                  key={r.groupId}
                  className="flex items-center gap-3 border-b border-line py-3 first:pt-0 last:border-0"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
                    <FiCheckSquare />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{t('directorDash.homework')}</p>
                    <p className="truncate text-xs text-muted">
                      {t('directorDash.group')} {r.groupName} · {r.mentorName ?? '—'}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-medium">
                    {t('directorDash.works', { count: r.count })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          className="[@container(min-width:720px)]:col-span-2 [@container(min-width:1150px)]:col-span-1"
          title={t('directorDash.quick')}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <Quick
              icon={FiBookOpen}
              label={t('directorDash.qCourses')}
              to={PATHS.director.tracks}
            />
            <Quick icon={FiGrid} label={t('directorDash.qGroups')} to={PATHS.director.groups} />
            <Quick
              icon={FiUserCheck}
              label={t('directorDash.qMentors')}
              to={PATHS.director.mentors}
            />
            <Quick
              icon={FiUsers}
              label={t('directorDash.qStudents')}
              to={PATHS.director.students}
            />
            <Quick
              icon={FiPlus}
              label={t('directorDash.qCreateGroup')}
              onClick={() => setCreate('group')}
            />
            <Quick icon={FiSend} label={t('directorDash.qReports')} to={PATHS.director.reports} />
          </div>
        </Section>
      </div>

      <CreateGroupModal open={create === 'group'} onClose={() => setCreate(null)} />
      <AddUserModal open={create === 'mentor'} onClose={() => setCreate(null)} role="mentor" />
      <AddUserModal open={create === 'student'} onClose={() => setCreate(null)} role="student" />
      <AddUserModal
        open={create === 'staff'}
        onClose={() => setCreate(null)}
        role="administrator"
        roleSelectable
      />
    </div>
  );
}

const BAR = { brand: 'bg-brand', amber: 'bg-amber', danger: 'bg-danger', muted: 'bg-muted/40' };
function Bar({ value, tone = 'brand' }: { value: number; tone?: keyof typeof BAR }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
      <div
        className={clsx('h-full rounded-full', BAR[tone])}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function TodaySchedule({ items }: { items: DirectorDashboard['today'] }) {
  const { t } = useTranslation();
  const now = Date.now();
  if (items.length === 0)
    return <p className="py-6 text-center text-sm text-muted">{t('directorDash.noLessons')}</p>;
  return (
    <ol className="relative flex flex-col gap-4 before:absolute before:bottom-2 before:left-[112px] before:top-2 before:w-px before:bg-line">
      {items.map((l) => {
        const start = new Date(l.startsAt).getTime();
        const end = new Date(l.endsAt).getTime();
        const live = now >= start && now < end;
        const done = now >= end;
        const hours = Math.max(0, Math.round(((start - now) / 3600000) * 2) / 2);
        return (
          <li
            key={l.groupId}
            className="relative grid grid-cols-[96px_auto_minmax(0,1fr)_auto] items-start gap-3"
          >
            <span className="whitespace-nowrap pt-0.5 text-xs tabular-nums text-muted">
              {l.from} – {l.to}
            </span>
            <span
              className={clsx(
                'relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface',
                live ? 'bg-brand' : done ? 'bg-muted/50' : 'bg-amber',
              )}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{l.trackTitle}</p>
              <p className="truncate text-xs text-muted">
                {t('directorDash.group')} {l.groupName} · {l.mentorName ?? '—'}
              </p>
            </div>
            <Badge tone={live ? 'green' : done ? 'gray' : 'amber'}>
              {live
                ? t('directorDash.live')
                : done
                  ? t('directorDash.done')
                  : t('directorDash.inHours', { n: hours || '<1' })}
            </Badge>
          </li>
        );
      })}
    </ol>
  );
}

function Quick({
  icon: Icon,
  label,
  to,
  onClick,
}: {
  icon: IconType;
  label: string;
  to?: string;
  onClick?: () => void;
}) {
  const cls =
    'flex min-h-[52px] items-center gap-2.5 rounded-ctl border border-line px-3 py-2 text-left text-[13px] font-medium transition-colors hover:border-brand/40 hover:bg-brand-soft/50';
  const inner = (
    <>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-ctl bg-brand-soft text-brand-strong">
        <Icon />
      </span>
      <span className="min-w-0 leading-tight">{label}</span>
    </>
  );
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** «Создать ▾»: группа, ментор, ученик */
function CreateMenu({ onPick }: { onPick: (c: Exclude<Create, null>) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const items: [Exclude<Create, null>, IconType, string][] = [
    ['group', FiGrid, t('directorDash.qCreateGroup')],
    ['mentor', FiUserCheck, t('users.addMentor')],
    ['student', FiUserPlus, t('users.addStudent')],
    ['staff', FiBriefcase, t('staffPage.add')],
  ];
  return (
    <div ref={ref} className="relative">
      <Button
        rightIcon={<FiChevronDown className={clsx('transition-transform', open && 'rotate-180')} />}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {t('directorDash.create')}
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-56 animate-pop-in rounded-card border border-line bg-surface p-1.5 shadow-pop">
          {items.map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setOpen(false);
                onPick(key);
              }}
              className="flex w-full items-center gap-2.5 rounded-ctl px-3 py-2 text-left text-sm hover:bg-sunken"
            >
              <Icon className="text-muted" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
