import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiDollarSign,
  FiMessageCircle,
  FiPlus,
  FiSearch,
  FiUsers,
} from 'react-icons/fi';
import type { PaymentMethod, PaymentRow, PaymentState } from '@/core/types/models';
import { formatDateTime, formatMonth, formatMoney } from '@/core/utils/format';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { whatsappLink } from '@/shared/lib/credentials';
import { PAYMENT_METHODS, paymentStateTone } from '@/shared/lib/payments';
import { lastMonths } from '@/shared/lib/reports';
import { KpiCard } from '@/shared/components/dashboard/KpiCard';
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
  Modal,
  PageHeader,
  ProgressBar,
  Select,
  Tabs,
  toast,
} from '@/shared/ui';
import { useAcceptPayment, usePayments } from '../api/administratorApi';

type Filter = 'all' | PaymentState;

/**
 * Оплаты учеников за месяц: кто оплатил, кто частично, кто должен.
 * «Принять оплату» → чек в WhatsApp. Должнику — напоминание в WhatsApp.
 */
export default function AdministratorPaymentsPage() {
  const { t } = useTranslation();
  const [month, setMonth] = useState(lastMonths(1)[0]);
  const [filter, setFilter] = useState<Filter>('unpaid');
  const [search, setSearch] = useState('');
  const [paying, setPaying] = useState<PaymentRow | null>(null);
  const { data, isLoading, isError, refetch } = usePayments(month);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const q = search.trim().toLowerCase();
  const rows = data.rows
    .filter((r) => filter === 'all' || r.state === filter)
    .filter((r) => !q || `${r.name} ${r.phone} ${r.groupName ?? ''}`.toLowerCase().includes(q))
    .sort((a, b) => a.paid - b.paid || a.name.localeCompare(b.name));
  const count = (f: Filter) => data.rows.filter((r) => f === 'all' || r.state === f).length;
  const debt = data.expected - data.collected;

  return (
    <>
      <PageHeader
        title={t('pages.administrator.payments')}
        description={t('payments.description', { fee: formatMoney(data.fee) })}
        actions={
          <Select
            aria-label={t('reports.month')}
            className="w-48"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={lastMonths(3).map((m) => ({ value: m, label: formatMonth(m) }))}
          />
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<FiDollarSign />}
          label={t('payments.collected')}
          value={formatMoney(data.collected)}
        />
        <KpiCard
          icon={<FiAlertCircle />}
          label={t('payments.debt')}
          value={formatMoney(Math.max(0, debt))}
        />
        <KpiCard
          icon={<FiCheckCircle />}
          label={t('payments.paidCount')}
          value={`${count('paid')} / ${data.rows.length}`}
        />
        <KpiCard
          icon={<FiUsers />}
          label={t('payments.debtors')}
          value={String(count('unpaid') + count('partial'))}
        />
      </div>
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar
          value={(data.collected / Math.max(1, data.expected)) * 100}
          className="flex-1"
        />
        <span className="whitespace-nowrap text-sm text-muted">
          {Math.round((data.collected / Math.max(1, data.expected)) * 100)}%
        </span>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="-mx-1 overflow-x-auto px-1">
            <Tabs<Filter>
              value={filter}
              onChange={setFilter}
              tabs={(['unpaid', 'partial', 'paid', 'all'] as Filter[]).map((f) => ({
                value: f,
                label: t(`payments.state.${f}`),
                count: count(f),
              }))}
            />
          </div>
          <Input
            aria-label={t('common.search')}
            placeholder={t('administrator.searchStudents')}
            leftIcon={<FiSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lg:ml-auto lg:w-64"
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title={filter === 'unpaid' ? t('payments.noDebtors') : t('common.nothingFound')}
          />
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {rows.map((r) => (
              <li key={r.studentId} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar name={r.name} size={36} />
                <div className="min-w-[160px] flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    <Badge tone={paymentStateTone[r.state]}>{t(`payments.state.${r.state}`)}</Badge>
                  </p>
                  <p className="truncate text-xs text-muted">
                    {r.phone} · {r.groupName ?? t('users.noGroup')}
                    {r.payments[0] &&
                      ` · ${t('payments.lastPaid', { date: formatDateTime(r.payments[0].createdAt) })}`}
                  </p>
                </div>
                <span className="w-32 text-right text-sm tabular-nums">
                  <b>{formatMoney(r.paid)}</b>
                  <span className="text-muted"> / {data.fee}</span>
                </span>
                <div className="flex gap-1">
                  {r.state !== 'paid' && (
                    <a
                      href={whatsappLink(
                        r.phone,
                        t('payments.remindText', {
                          name: r.name.split(' ')[1] ?? r.name,
                          month: formatMonth(month),
                          sum: formatMoney(data.fee - r.paid),
                        }),
                      )}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t('payments.remind')}
                    >
                      <IconButton label={t('payments.remind')} tabIndex={-1}>
                        <FiMessageCircle />
                      </IconButton>
                    </a>
                  )}
                  {r.state !== 'paid' && (
                    <Button size="sm" leftIcon={<FiPlus />} onClick={() => setPaying(r)}>
                      {t('payments.accept')}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {paying && (
        <AcceptPaymentModal
          row={paying}
          month={month}
          fee={data.fee}
          onClose={() => setPaying(null)}
        />
      )}
    </>
  );
}

function AcceptPaymentModal({
  row,
  month,
  fee,
  onClose,
}: {
  row: PaymentRow;
  month: string;
  fee: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const accept = useAcceptPayment();
  const [amount, setAmount] = useState(String(Math.max(0, fee - row.paid)));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [done, setDone] = useState<number | null>(null);
  const n = Number(amount);
  const bad = !(n > 0) || n > 100000;

  const submit = () =>
    accept.mutate(
      { studentId: row.studentId, month, amount: n, method, note },
      {
        onSuccess: (p) => (
          toast(t('payments.accepted', { sum: formatMoney(p.amount) }), 'success'),
          setDone(p.amount)
        ),
        onError: (e) => toast(getApiErrorMessage(e), 'error'),
      },
    );

  if (done !== null) {
    const receipt = t('payments.receiptText', {
      name: row.name,
      sum: formatMoney(done),
      month: formatMonth(month),
      total: formatMoney(row.paid + done),
      fee: formatMoney(fee),
    });
    return (
      <Modal
        open
        onClose={onClose}
        title={t('payments.acceptedTitle')}
        footer={<Button onClick={onClose}>{t('common.close')}</Button>}
      >
        <div className="flex flex-col items-start gap-4">
          <p className="flex items-center gap-2 text-sm">
            <FiCheckCircle className="text-xl text-brand" />{' '}
            {t('payments.accepted', { sum: formatMoney(done) })} — {row.name}
          </p>
          <pre className="w-full whitespace-pre-wrap rounded-ctl bg-sunken p-3 font-sans text-sm">
            {receipt}
          </pre>
          <a href={whatsappLink(row.phone, receipt)} target="_blank" rel="noreferrer">
            <Button variant="secondary" leftIcon={<FiMessageCircle />}>
              {t('payments.sendReceipt')}
            </Button>
          </a>
        </div>
      </Modal>
    );
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={t('payments.accept')}
      description={`${row.name} · ${formatMonth(month)} · ${t('payments.alreadyPaid', { sum: formatMoney(row.paid), fee: formatMoney(fee) })}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={bad} loading={accept.isPending}>
            {t('payments.accept')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('payments.amount')}
            type="number"
            min={1}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={amount && bad ? t('payments.badAmount') : undefined}
            hint="TJS"
          />
          <Select
            label={t('payments.method')}
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            options={PAYMENT_METHODS.map((m) => ({ value: m, label: t(`payments.methods.${m}`) }))}
          />
        </div>
        <Input
          label={t('payments.note')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
          placeholder={t('payments.notePh')}
        />
      </div>
    </Modal>
  );
}
