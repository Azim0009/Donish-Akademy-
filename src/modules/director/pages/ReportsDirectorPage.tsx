import { useState } from 'react';
import { generatePath, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle, FiChevronRight, FiPlus, FiSend } from 'react-icons/fi';
import clsx from 'clsx';
import { PATHS } from '@/core/config/paths';
import { formatDate, formatMonth, formatMoney } from '@/core/utils/format';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { useCreateReport, useMyReports } from '@/shared/api/reportsApi';
import { lastMonths, profit, reportStatusTone, totalExpenses } from '@/shared/lib/reports';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loader,
  Modal,
  PageHeader,
  Select,
  toast,
} from '@/shared/ui';

/** Отчёты директора: каждый месяц — цифры филиала, финансы и итоги. Отправляются SuperAdmin */
export default function ReportsDirectorPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyReports();
  const [open, setOpen] = useState(false);
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const current = lastMonths(1)[0];
  const cur = data.find((r) => r.month === current);
  const free = lastMonths(3).filter((m) => !data.some((r) => r.month === m));

  return (
    <>
      <PageHeader
        title={t('pages.director.reports')}
        description={t('reports.directorDesc')}
        actions={
          free.length > 0 && (
            <Button leftIcon={<FiPlus />} onClick={() => setOpen(true)}>
              {t('reports.new')}
            </Button>
          )
        }
      />

      {(!cur || cur.status === 'draft' || cur.status === 'returned') && (
        <div
          className={clsx(
            'mb-4 flex flex-wrap items-center gap-3 rounded-card border px-4 py-3',
            cur?.status === 'returned'
              ? 'border-amber/30 bg-amber-soft'
              : 'border-info/20 bg-info-soft',
          )}
        >
          <FiAlertTriangle className={cur?.status === 'returned' ? 'text-amber' : 'text-info'} />
          <p className="min-w-0 flex-1 text-sm">
            {cur?.status === 'returned'
              ? t('reports.bannerReturned', { month: formatMonth(current) })
              : t('reports.bannerMissing', { month: formatMonth(current) })}
          </p>
          {cur ? (
            <Link to={generatePath(PATHS.director.report, { reportId: cur.id })}>
              <Button size="sm">{t('reports.openBtn')}</Button>
            </Link>
          ) : (
            <Button size="sm" onClick={() => setOpen(true)}>
              {t('reports.new')}
            </Button>
          )}
        </div>
      )}

      {data.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={<FiSend />} title={t('reports.empty')} />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((r) => (
            <Link key={r.id} to={generatePath(PATHS.director.report, { reportId: r.id })}>
              <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 transition-colors hover:border-brand/40 sm:p-5">
                <div className="min-w-[160px] flex-1">
                  <p className="font-semibold">{formatMonth(r.month)}</p>
                  <p className="text-xs text-muted">
                    {r.sentAt
                      ? t('reports.sentAt', { date: formatDate(r.sentAt) })
                      : t('reports.notSent')}
                  </p>
                </div>
                <Num label={t('reports.income')} value={formatMoney(r.income)} />
                <Num label={t('reports.expenses')} value={formatMoney(totalExpenses(r))} />
                <Num label={t('reports.profit')} value={formatMoney(profit(r))} strong />
                <Badge tone={reportStatusTone[r.status]}>{t(`reports.status.${r.status}`)}</Badge>
                <FiChevronRight className="hidden text-muted sm:block" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      {open && <NewReportModal months={free} onClose={() => setOpen(false)} />}
    </>
  );
}

const Num = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="min-w-[110px]">
    <p className="text-xs text-muted">{label}</p>
    <p className={clsx('whitespace-nowrap text-sm tabular-nums', strong && 'font-semibold')}>
      {value}
    </p>
  </div>
);

function NewReportModal({ months, onClose }: { months: string[]; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [month, setMonth] = useState(months[0]);
  const create = useCreateReport();
  const submit = () =>
    create.mutate(month, {
      onSuccess: (r) => navigate(generatePath(PATHS.director.report, { reportId: r.id })),
      onError: (e) => toast(getApiErrorMessage(e), 'error'),
    });
  return (
    <Modal
      open
      onClose={onClose}
      title={t('reports.new')}
      description={t('reports.newHint')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            {t('reports.create')}
          </Button>
        </>
      }
    >
      <Select
        label={t('reports.month')}
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        options={months.map((m) => ({ value: m, label: formatMonth(m) }))}
      />
    </Modal>
  );
}
