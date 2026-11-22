import { useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiAlertCircle, FiCheckCircle, FiChevronRight } from 'react-icons/fi';
import type { BranchReport } from '@/core/types/models';
import { PATHS } from '@/core/config/paths';
import { formatDateTime, formatMonth, formatMoney } from '@/core/utils/format';
import { useReportsInbox } from '@/shared/api/reportsApi';
import { lastMonths, profit, reportStatusTone, totalExpenses } from '@/shared/lib/reports';
import {
  Badge,
  Card,
  ErrorState,
  Loader,
  PageHeader,
  Section,
  Select,
  Table,
  Tabs,
  type Column,
} from '@/shared/ui';

type Filter = 'all' | 'sent' | 'accepted' | 'returned';

/** Отчёты, которые прислали директора филиалов. Видно, кто ещё не прислал */
export default function ReportsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [month, setMonth] = useState(lastMonths(1)[0]);
  const [status, setStatus] = useState<Filter>('all');
  const { data, isLoading, isError, refetch } = useReportsInbox({ month, status });
  const all = useReportsInbox({ month });
  const count = (s: Filter) =>
    (all.data?.reports ?? []).filter((r) => s === 'all' || r.status === s).length;
  const months = [...new Set([...lastMonths(3), ...(data?.months ?? [])])].sort().reverse();

  const columns: Column<BranchReport>[] = [
    {
      key: 'branch',
      header: t('branch.branch'),
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-medium">{r.branchName}</p>
          <p className="truncate text-xs text-muted">{r.directorName}</p>
        </div>
      ),
    },
    {
      key: 'income',
      header: t('reports.income'),
      hideOnMobile: true,
      className: 'whitespace-nowrap tabular-nums',
      cell: (r) => formatMoney(r.income),
    },
    {
      key: 'exp',
      header: t('reports.expenses'),
      hideOnMobile: true,
      className: 'whitespace-nowrap tabular-nums',
      cell: (r) => formatMoney(totalExpenses(r)),
    },
    {
      key: 'profit',
      header: t('reports.profit'),
      className: 'whitespace-nowrap font-semibold tabular-nums',
      cell: (r) => formatMoney(profit(r)),
    },
    {
      key: 'sent',
      header: t('reports.sentCol'),
      hideOnMobile: true,
      className: 'whitespace-nowrap text-muted',
      cell: (r) => (r.sentAt ? formatDateTime(r.sentAt) : '—'),
    },
    {
      key: 'status',
      header: '',
      cell: (r) => (
        <Badge tone={reportStatusTone[r.status]}>{t(`reports.status.${r.status}`)}</Badge>
      ),
    },
    {
      key: 'go',
      header: '',
      className: 'w-0',
      cell: () => <FiChevronRight className="text-muted" />,
    },
  ];

  return (
    <>
      <PageHeader
        title={t('pages.superAdmin.reports')}
        description={t('reports.superDesc')}
        actions={
          <Select
            aria-label={t('reports.month')}
            className="w-48"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={months.map((m) => ({ value: m, label: formatMonth(m) }))}
          />
        }
      />

      {data && (
        <Card className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
          {data.missing.length === 0 ? (
            <p className="flex items-center gap-2 text-sm font-medium text-brand-strong">
              <FiCheckCircle /> {t('reports.allSent')}
            </p>
          ) : (
            <>
              <p className="flex items-center gap-2 text-sm font-medium text-amber">
                <FiAlertCircle /> {t('reports.missing', { count: data.missing.length })}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.missing.map((m) => (
                  <span
                    key={m.branchId}
                    className="rounded-full bg-amber-soft px-2.5 py-1 text-xs font-medium text-amber"
                    title={m.directorName ?? ''}
                  >
                    {m.branchName}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      <Section
        title={formatMonth(month)}
        action={
          <Tabs<Filter>
            value={status}
            onChange={setStatus}
            tabs={(['all', 'sent', 'accepted', 'returned'] as Filter[]).map((s) => ({
              value: s,
              label: t(s === 'all' ? 'requests.status.all' : `reports.status.${s}`),
              count: count(s),
            }))}
          />
        }
      >
        {isLoading ? (
          <Loader />
        ) : isError || !data ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <Table
            columns={columns}
            rows={data.reports}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(generatePath(PATHS.superAdmin.report, { reportId: r.id }))}
            emptyTitle={t('reports.inboxEmpty')}
          />
        )}
      </Section>
    </>
  );
}
