import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCreditCard, FiFileText, FiPlus, FiSend } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { PATHS } from '@/core/config/paths';
import type { AccountantReport } from '@/core/types/models';
import {
  AccountantReportHeader,
  AccountantReportSummary,
} from '@/shared/components/reports/AccountantReportCard';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loader,
  Modal,
  PageHeader,
  Textarea,
  toast,
} from '@/shared/ui';
import {
  useAccountantReports,
  useCreateAccountantReport,
  useSaveAccountantReport,
  useSendAccountantReport,
} from '../api/accountingApi';

/** «2026-11-26» по местному времени */
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Бухгалтер → директор: деньги за месяц (как директор → SuperAdmin) */
export default function AccountantReportsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useAccountantReports();
  const create = useCreateAccountantReport();
  const [newOpen, setNewOpen] = useState(false);
  const today = isoDay(new Date());
  const [period, setPeriod] = useState({ dateFrom: today.slice(0, 8) + '01', dateTo: today });
  const periodError =
    !period.dateFrom || !period.dateTo
      ? t('accReports.pickDates')
      : period.dateFrom > period.dateTo
        ? t('accReports.fromAfterTo')
        : period.dateTo > today
          ? t('accReports.toFuture')
          : '';

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PageHeader
        title={t('pages.accountant.reports')}
        description={t('accReports.description')}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => setNewOpen(true)}>
            {t('reports.new')}
          </Button>
        }
      />
      {data.length === 0 ? (
        <Card>
          <EmptyState icon={<FiFileText />} title={t('accReports.empty')} />
        </Card>
      ) : (
        data.map((r) => <ReportItem key={r.id} r={r} />)
      )}

      {newOpen && (
        <Modal
          open
          onClose={() => setNewOpen(false)}
          title={t('reports.new')}
          footer={
            <>
              <Button variant="secondary" onClick={() => setNewOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                loading={create.isPending}
                disabled={!!periodError}
                onClick={() =>
                  create.mutate(period, {
                    onSuccess: () => {
                      toast(t('accReports.created'), 'success');
                      setNewOpen(false);
                    },
                    onError: (e) => toast(getApiErrorMessage(e), 'error'),
                  })
                }
              >
                {t('common.create')}
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('accReports.dateFrom')}
              type="date"
              max={today}
              value={period.dateFrom}
              onChange={(e) => setPeriod((p) => ({ ...p, dateFrom: e.target.value }))}
            />
            <Input
              label={t('accReports.dateTo')}
              type="date"
              max={today}
              value={period.dateTo}
              onChange={(e) => setPeriod((p) => ({ ...p, dateTo: e.target.value }))}
              error={periodError || undefined}
            />
          </div>
          <p className="mt-3 text-sm text-muted">{t('accReports.newHint')}</p>
        </Modal>
      )}
    </div>
  );
}

function ReportItem({ r }: { r: AccountantReport }) {
  const { t } = useTranslation();
  const save = useSaveAccountantReport();
  const send = useSendAccountantReport();
  const editable = r.status === 'draft' || r.status === 'returned';
  const [comment, setComment] = useState(r.comment);
  useEffect(() => setComment(r.comment), [r]);
  const onError = (e: unknown) => toast(getApiErrorMessage(e), 'error');

  const doSave = (then?: () => void) =>
    save.mutate(
      { id: r.id, comment },
      { onSuccess: () => (then ? then() : toast(t('reports.saved'), 'success')), onError },
    );
  const doSend = () =>
    doSave(() =>
      send.mutate(r.id, { onSuccess: () => toast(t('accReports.sentToast'), 'success'), onError }),
    );

  return (
    <Card className="flex flex-col gap-4 p-5">
      <AccountantReportHeader r={r} />
      {r.directorComment && (
        <p
          className={`rounded-ctl px-3 py-2 text-sm ${r.status === 'returned' ? 'bg-amber-soft text-amber' : 'bg-brand-soft text-brand-strong'}`}
        >
          {t('accReports.directorSays')}: {r.directorComment}
        </p>
      )}
      <AccountantReportSummary r={editable ? { ...r, comment: '' } : r} />
      {editable && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-ctl border border-line px-3 py-2 text-sm">
            <FiCreditCard className="shrink-0 text-brand-strong" aria-hidden />
            <p className="min-w-0 flex-1 text-muted">{t('accReports.fromJournal')}</p>
            <Link
              to={PATHS.accountant.expenses}
              className="font-medium text-brand-strong hover:underline"
            >
              {t('accReports.openJournal')}
            </Link>
          </div>
          <Textarea
            label={t('accReports.comment')}
            placeholder={t('accReports.commentPh')}
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              loading={save.isPending && !send.isPending}
              onClick={() => doSave()}
            >
              {t('common.save')}
            </Button>
            <Button leftIcon={<FiSend />} loading={send.isPending} onClick={doSend}>
              {t('accReports.send')}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
