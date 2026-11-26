import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiFileText, FiPlus, FiSend, FiTrash2 } from 'react-icons/fi';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import type { AccountantReport, ReportExpense } from '@/core/types/models';
import {
  AccountantReportHeader,
  AccountantReportSummary,
} from '@/shared/components/reports/AccountantReportCard';
import { EXPENSE_CATEGORIES } from '@/shared/lib/reports';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Loader,
  Modal,
  PageHeader,
  Select,
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
  const [expenses, setExpenses] = useState<ReportExpense[]>(r.expenses);
  const [comment, setComment] = useState(r.comment);
  useEffect(() => {
    setExpenses(r.expenses);
    setComment(r.comment);
  }, [r]);
  const setExp = (id: string, p: Partial<ReportExpense>) =>
    setExpenses((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const onError = (e: unknown) => toast(getApiErrorMessage(e), 'error');

  const doSave = (then?: () => void) =>
    save.mutate(
      { id: r.id, expenses, comment },
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
      {!editable ? (
        <AccountantReportSummary r={r} />
      ) : (
        <>
          <AccountantReportSummary r={{ ...r, expenses, comment: '' }} />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t('accReports.editExpenses')}</p>
            {expenses.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-[1fr_auto] gap-2 rounded-ctl border border-line p-2 sm:grid-cols-[170px_130px_1fr_auto] sm:border-0 sm:p-0"
              >
                <Select
                  aria-label={t('reports.category')}
                  value={e.category}
                  onChange={(ev) =>
                    setExp(e.id, { category: ev.target.value as ReportExpense['category'] })
                  }
                  options={EXPENSE_CATEGORIES.map((c) => ({
                    value: c,
                    label: t(`reports.cat.${c}`),
                  }))}
                />
                <IconButton
                  label={t('common.delete')}
                  className="text-danger sm:order-last"
                  onClick={() => setExpenses((xs) => xs.filter((x) => x.id !== e.id))}
                >
                  <FiTrash2 />
                </IconButton>
                <Input
                  aria-label={t('reports.amount')}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="TJS"
                  value={e.amount || ''}
                  onChange={(ev) => setExp(e.id, { amount: Number(ev.target.value) })}
                />
                <Input
                  aria-label={t('reports.note')}
                  placeholder={t('reports.note')}
                  value={e.note}
                  maxLength={120}
                  onChange={(ev) => setExp(e.id, { note: ev.target.value })}
                  className="col-span-2 sm:col-span-1"
                />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<FiPlus />}
              className="self-start text-brand-strong"
              onClick={() =>
                setExpenses((xs) => [
                  ...xs,
                  { id: `aexp_${Date.now()}`, category: 'other', amount: 0, note: '' },
                ])
              }
            >
              {t('reports.addExpense')}
            </Button>
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
