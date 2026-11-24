import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiCalendar,
  FiMessageCircle,
  FiPhone,
  FiPlus,
  FiSearch,
  FiTrendingUp,
} from 'react-icons/fi';
import clsx from 'clsx';
import type { Lead, LeadStatus } from '@/core/types/models';
import { formatDateTime, timeAgo } from '@/core/utils/format';
import { whatsappLink } from '@/shared/lib/credentials';
import { isToday, LEAD_STATUSES, leadStatusTone } from '@/shared/lib/leads';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Loader,
  PageHeader,
  Tabs,
} from '@/shared/ui';
import { useLeads, useLeadStats } from '../api/leadsApi';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { LeadFormModal } from '../components/LeadFormModal';

type Filter = 'active' | 'all' | LeadStatus;
const ACTIVE: LeadStatus[] = ['new', 'contacted', 'trial'];
const FUNNEL_BAR: Record<LeadStatus, string> = {
  new: 'bg-info',
  contacted: 'bg-muted',
  trial: 'bg-amber',
  won: 'bg-brand',
  lost: 'bg-danger',
};

/**
 * Лиды отдела продаж: заявки из Instagram, сайта, звонков.
 * Воронка: Новый → Связались → Пробный урок → Записался (или Отказ).
 * Когда лид записался — администратор получает уведомление создать ученику аккаунт.
 */
export default function LeadsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('active');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { data, isLoading, isError, refetch } = useLeads({ search });
  const stats = useLeadStats();

  const all = data ?? [];
  const rows = all.filter((l) =>
    filter === 'all' ? true : filter === 'active' ? ACTIVE.includes(l.status) : l.status === filter,
  );
  // пробные на сегодня — наверх
  rows.sort(
    (a, b) =>
      Number(isToday(b.trialAt) && b.status === 'trial') -
      Number(isToday(a.trialAt) && a.status === 'trial'),
  );
  const opened = all.find((l) => l.id === open);
  const count = (f: Filter) =>
    all.filter((l) =>
      f === 'all' ? true : f === 'active' ? ACTIVE.includes(l.status) : l.status === f,
    ).length;
  const s = stats.data;
  const total = s ? Object.values(s.byStatus).reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <PageHeader
        title={t('pages.common.leads')}
        description={t('leads.description')}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => setAdding(true)}>
            {t('leads.new')}
          </Button>
        }
      />

      {s && (
        <Card className="mb-4 p-5">
          <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="text-sm font-semibold">{t('leads.funnel')}</p>
            <span className="inline-flex items-center gap-1.5 text-sm">
              <FiTrendingUp className="text-brand-strong" /> {t('leads.conversion')}:{' '}
              <b>{s.conversion}%</b>
            </span>
            {s.trialsToday > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm text-amber">
                <FiCalendar /> {t('leads.trialsToday', { count: s.trialsToday })}
              </span>
            )}
            {s.newToday > 0 && (
              <span className="text-sm text-info">
                {t('leads.newToday', { count: s.newToday })}
              </span>
            )}
          </div>
          {/* полоса воронки: ширина = доля лидов на этапе */}
          <div className="flex h-2.5 overflow-hidden rounded-full bg-sunken">
            {LEAD_STATUSES.map((st) =>
              s.byStatus[st] ? (
                <div
                  key={st}
                  className={FUNNEL_BAR[st]}
                  style={{ width: `${(s.byStatus[st] / Math.max(1, total)) * 100}%` }}
                  title={t(`leads.st.${st}`)}
                />
              ) : null,
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {LEAD_STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={clsx(
                  'flex items-center gap-2 rounded-ctl px-2 py-1.5 text-left text-sm hover:bg-sunken',
                  filter === st && 'bg-sunken',
                )}
              >
                <span className={clsx('h-2.5 w-2.5 shrink-0 rounded-full', FUNNEL_BAR[st])} />
                <span className="min-w-0 flex-1 truncate">{t(`leads.st.${st}`)}</span>
                <b className="tabular-nums">{s.byStatus[st]}</b>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="-mx-1 overflow-x-auto px-1">
            <Tabs<Filter>
              value={filter}
              onChange={setFilter}
              tabs={[
                { value: 'active', label: t('leads.active'), count: count('active') },
                ...LEAD_STATUSES.map((st) => ({
                  value: st as Filter,
                  label: t(`leads.st.${st}`),
                  count: count(st),
                })),
                { value: 'all', label: t('leads.all'), count: count('all') },
              ]}
            />
          </div>
          <Input
            aria-label={t('common.search')}
            placeholder={t('leads.search')}
            leftIcon={<FiSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lg:ml-auto lg:w-64"
          />
        </div>

        {isLoading ? (
          <Loader />
        ) : isError || !data ? (
          <ErrorState onRetry={refetch} />
        ) : rows.length === 0 ? (
          <EmptyState title={t('leads.empty')} />
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {rows.map((l) => (
              <LeadRow key={l.id} lead={l} onOpen={() => setOpen(l.id)} />
            ))}
          </ul>
        )}
      </Card>

      {adding && <LeadFormModal onClose={() => setAdding(false)} />}
      {opened && <LeadDetailModal lead={opened} onClose={() => setOpen(null)} />}
    </>
  );
}

function LeadRow({ lead: l, onOpen }: { lead: Lead; onOpen: () => void }) {
  const { t } = useTranslation();
  const last = l.notes[l.notes.length - 1];
  const trialToday = l.status === 'trial' && isToday(l.trialAt);
  return (
    <li className="flex items-center gap-3 py-3">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Avatar name={l.name} size={38} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{l.name}</span>
            <Badge tone={leadStatusTone[l.status]}>{t(`leads.st.${l.status}`)}</Badge>
            {trialToday && <Badge tone="amber">{t('leads.trialToday')}</Badge>}
          </p>
          <p className="truncate text-xs text-muted">
            {l.phone} · {t(`leads.src.${l.source}`)} ·{' '}
            {l.status === 'trial' && l.trialAt ? formatDateTime(l.trialAt) : timeAgo(l.updatedAt)}
          </p>
          {last && <p className="mt-0.5 truncate text-xs text-muted">💬 {last.text}</p>}
        </div>
      </button>
      <div className="flex shrink-0 gap-0.5">
        <a href={`tel:${l.phone.replace(/[^\d+]/g, '')}`} aria-label={t('leads.call')}>
          <IconButton label={t('leads.call')} tabIndex={-1} className="text-brand-strong">
            <FiPhone />
          </IconButton>
        </a>
        <a
          href={whatsappLink(
            l.phone,
            t('leads.waText', { name: l.name.split(' ')[1] ?? l.name, course: l.course }),
          )}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
        >
          <IconButton label="WhatsApp" tabIndex={-1}>
            <FiMessageCircle />
          </IconButton>
        </a>
      </div>
    </li>
  );
}
