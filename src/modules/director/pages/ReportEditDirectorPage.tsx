import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiPlus, FiRefreshCw, FiSave, FiSend, FiTrash2 } from 'react-icons/fi';
import clsx from 'clsx';
import type { BranchReport, ReportExpense } from '@/core/types/models';
import { PATHS } from '@/core/config/paths';
import { formatMonth, formatMoney } from '@/core/utils/format';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import {
  useMyReport,
  useRefreshReport,
  useSaveReport,
  useSendReport,
} from '@/shared/api/reportsApi';
import { canEditReport, EXPENSE_CATEGORIES, reportStatusTone } from '@/shared/lib/reports';
import { MetricsGrid, ReportBody } from '@/shared/components/reports/ReportBody';
import { ReviewNote } from '@/shared/components/reports/ReviewNote';
import {
  Badge,
  Button,
  ErrorState,
  IconButton,
  Input,
  Loader,
  Section,
  Select,
  Textarea,
  toast,
} from '@/shared/ui';

/** Отчёт за месяц: черновик / возвращённый — редактируется, отправленный — только просмотр */
export default function ReportEditDirectorPage() {
  const { reportId = '' } = useParams();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyReport(reportId);
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <>
      <Link
        to={PATHS.director.reports}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <FiArrowLeft /> {t('pages.director.reports')}
      </Link>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="h-display text-2xl">
          {t('reports.titleFor', { month: formatMonth(data.month) })}
        </h1>
        <Badge tone={reportStatusTone[data.status]}>{t(`reports.status.${data.status}`)}</Badge>
      </div>
      <ReviewNote report={data} />
      {canEditReport(data) ? (
        <Editor key={data.id + data.status} report={data} />
      ) : (
        <ReportBody report={data} />
      )}
    </>
  );
}

function Editor({ report }: { report: BranchReport }) {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<ReportExpense[]>(report.expenses);
  const [text, setText] = useState({
    achievements: report.achievements,
    problems: report.problems,
    plans: report.plans,
  });
  const save = useSaveReport(report.id);
  const send = useSendReport(report.id);
  const refresh = useRefreshReport(report.id);

  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const profit = report.income - total;
  const body = {
    expenses: expenses.map((e) => ({ ...e, amount: Number(e.amount) || 0 })),
    ...text,
  };
  const setExp = (id: string, patch: Partial<ReportExpense>) =>
    setExpenses((xs) => xs.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const err = (e: unknown) => toast(getApiErrorMessage(e), 'error');

  const saveDraft = () =>
    save.mutate(body, { onSuccess: () => toast(t('reports.saved'), 'success'), onError: err });
  const submit = async () => {
    if (!text.achievements.trim() && !text.problems.trim() && !text.plans.trim())
      return toast(t('reports.needText'), 'error');
    if (expenses.some((e) => !(Number(e.amount) > 0)))
      return toast(t('reports.badAmount'), 'error');
    try {
      await save.mutateAsync(body);
      await send.mutateAsync();
      toast(t('reports.sent'), 'success');
    } catch (e) {
      err(e);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      <Section
        title={t('reports.metrics')}
        description={t('reports.metricsHint')}
        action={
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FiRefreshCw />}
            loading={refresh.isPending}
            onClick={() =>
              refresh.mutate(undefined, {
                onSuccess: () => toast(t('reports.refreshed'), 'success'),
                onError: err,
              })
            }
          >
            {t('reports.refresh')}
          </Button>
        }
      >
        <MetricsGrid metrics={report.metrics} />
      </Section>

      <Section title={t('reports.finance')} description={t('reports.financeHint')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Total label={t('reports.income')} value={report.income} hint={t('reports.incomeAuto')} />
          <Total label={t('reports.expenses')} value={total} />
          <Total label={t('reports.profit')} value={profit} strong />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {expenses.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[1fr_auto] gap-2 rounded-ctl border border-line p-2 sm:grid-cols-[180px_140px_1fr_auto] sm:border-0 sm:p-0"
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
                { id: `exp_${Date.now()}`, category: 'other', amount: 0, note: '' },
              ])
            }
          >
            {t('reports.addExpense')}
          </Button>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        {(['achievements', 'problems', 'plans'] as const).map((k) => (
          <Section key={k} title={t(`reports.${k}`)}>
            <Textarea
              aria-label={t(`reports.${k}`)}
              placeholder={t(`reports.ph.${k}`)}
              value={text[k]}
              maxLength={2000}
              rows={5}
              onChange={(e) => setText((s) => ({ ...s, [k]: e.target.value }))}
            />
          </Section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <p className="mr-auto hidden text-xs text-muted sm:block">{t('reports.sendHint')}</p>
          <Button
            variant="secondary"
            leftIcon={<FiSave />}
            onClick={saveDraft}
            loading={save.isPending && !send.isPending}
          >
            {t('reports.saveDraft')}
          </Button>
          <Button leftIcon={<FiSend />} onClick={submit} loading={send.isPending}>
            {t('reports.send')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Total({
  label,
  value,
  hint,
  strong,
}: {
  label: string;
  value: number;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-ctl border px-4 py-3',
        strong
          ? value >= 0
            ? 'border-brand/30 bg-brand-soft/60'
            : 'border-danger/30 bg-danger-soft'
          : 'border-line',
      )}
    >
      <p className="text-xs text-muted">{label}</p>
      <p
        className={clsx(
          'h-display mt-0.5 text-xl tabular-nums',
          strong && value < 0 && 'text-danger',
        )}
      >
        {formatMoney(value)}
      </p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
