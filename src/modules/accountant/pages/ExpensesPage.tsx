import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiCreditCard,
  FiDownload,
  FiEdit2,
  FiLock,
  FiPlus,
  FiSearch,
  FiShoppingCart,
  FiTrash2,
  FiUsers,
} from 'react-icons/fi';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import type { ExpenseCategory, ExpenseEntry } from '@/core/types/models';
import { formatDate } from '@/core/utils/format';
import { KpiCard } from '@/shared/components/dashboard/KpiCard';
import { formatTjs } from '@/shared/lib/partners';
import { EXPENSE_CATEGORIES } from '@/shared/lib/reports';
import {
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
  Table,
  Tabs,
  toast,
  type BadgeTone,
  type Column,
} from '@/shared/ui';
import { useDeleteExpense, useExpenses } from '../api/accountingApi';
import { ExpenseModal } from '../components/ExpenseModal';
import { isoDay } from '../lib/expenses';

type Cat = 'all' | ExpenseCategory;
const TONE: Record<ExpenseCategory, BadgeTone> = {
  salary: 'green',
  rent: 'blue',
  utilities: 'blue',
  ads: 'amber',
  purchase: 'amber',
  equipment: 'gray',
  other: 'gray',
};
/** CSV для Excel: «;» и BOM, чтобы кириллица открылась правильно */
const toCsv = (rows: (string | number)[][]) =>
  '\ufeff' +
  rows
    .map((r) =>
      r
        .map((v) => {
          const x = String(v);
          return /[;"\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x;
        })
        .join(';'),
    )
    .join('\n');
const day = (s: string) => new Date(`${s}T00:00:00`).toISOString();

/**
 * Журнал расходов филиала (бухгалтер): каждая выплата зарплаты, аренда, покупки…
 * Отчёт директору за период собирает расходы отсюда сам.
 */
export default function ExpensesPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useExpenses();
  const del = useDeleteExpense();
  const today = isoDay(new Date());
  const [from, setFrom] = useState(today.slice(0, 8) + '01');
  const [to, setTo] = useState(today);
  const [cat, setCat] = useState<Cat>('all');
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<ExpenseEntry | null | 'new'>(null);
  const [remove, setRemove] = useState<ExpenseEntry | null>(null);

  const inPeriod = useMemo(
    () => (data ?? []).filter((e) => (!from || e.date >= from) && (!to || e.date <= to)),
    [data, from, to],
  );
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inPeriod.filter(
      (e) =>
        (cat === 'all' || e.category === cat) &&
        (!q || `${e.employeeName ?? ''} ${e.description}`.toLowerCase().includes(q)),
    );
  }, [inPeriod, cat, search]);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const sum = (xs: ExpenseEntry[]) => xs.reduce((s, e) => s + e.amount, 0);
  const total = sum(inPeriod);
  const salaries = sum(inPeriod.filter((e) => e.category === 'salary'));
  const purchases = sum(
    inPeriod.filter((e) => e.category === 'purchase' || e.category === 'equipment'),
  );
  const what = (e: ExpenseEntry) =>
    e.category === 'salary'
      ? `${e.employeeName ?? '—'} · ${e.employeeRole ? t(`roles.${e.employeeRole}`) : ''}`
      : e.description;

  const download = () => {
    const csv = toCsv([
      [
        t('expenses.date'),
        t('reports.category'),
        t('expenses.what'),
        t('expenses.comment'),
        t('expenses.method'),
        t('reports.amount'),
      ],
      ...rows.map((e) => [
        e.date,
        t(`reports.cat.${e.category}`),
        what(e),
        e.category === 'salary' ? e.description : '',
        t(`expenses.m.${e.method}`),
        e.amount,
      ]),
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `rashody_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<ExpenseEntry>[] = [
    {
      key: 'date',
      header: t('expenses.date'),
      className: 'whitespace-nowrap',
      cell: (e) => formatDate(day(e.date), { day: 'numeric', month: 'short' }),
    },
    {
      key: 'what',
      header: t('expenses.what'),
      cell: (e) => (
        <div className="min-w-0">
          <p className="font-medium">{what(e)}</p>
          <p className="text-xs text-muted">
            <Badge tone={TONE[e.category]}>{t(`reports.cat.${e.category}`)}</Badge>
            {e.category === 'salary' && e.description && (
              <span className="ml-2">{e.description}</span>
            )}
          </p>
        </div>
      ),
    },
    {
      key: 'method',
      header: t('expenses.method'),
      hideOnMobile: true,
      cell: (e) => <span className="text-muted">{t(`expenses.m.${e.method}`)}</span>,
    },
    {
      key: 'amount',
      header: t('reports.amount'),
      className: 'text-right',
      cell: (e) => (
        <span className="whitespace-nowrap font-medium tabular-nums">{formatTjs(e.amount)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right whitespace-nowrap',
      cell: (e) =>
        e.locked ? (
          <span
            className="inline-flex items-center gap-1 text-xs text-muted"
            title={t('expenses.lockedHint')}
          >
            <FiLock aria-hidden /> {t('expenses.locked')}
          </span>
        ) : (
          <div className="flex justify-end gap-1">
            <IconButton label={`${t('common.edit')}: ${what(e)}`} onClick={() => setEdit(e)}>
              <FiEdit2 />
            </IconButton>
            <IconButton
              label={`${t('common.delete')}: ${what(e)}`}
              className="text-danger"
              onClick={() => setRemove(e)}
            >
              <FiTrash2 />
            </IconButton>
          </div>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('pages.accountant.expenses')}
        description={t('expenses.pageDescription')}
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<FiDownload />}
              onClick={download}
              disabled={!rows.length}
            >
              {t('inventory.export')}
            </Button>
            <Button leftIcon={<FiPlus />} onClick={() => setEdit('new')}>
              {t('expenses.add')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<FiCreditCard />} label={t('expenses.kpiTotal')} value={formatTjs(total)} />
        <KpiCard icon={<FiUsers />} label={t('accReports.salaries')} value={formatTjs(salaries)} />
        <KpiCard
          icon={<FiShoppingCart />}
          label={t('expenses.kpiPurchases')}
          value={formatTjs(purchases)}
        />
        <KpiCard
          icon={<FiCreditCard />}
          label={t('expenses.kpiOther')}
          value={formatTjs(total - salaries - purchases)}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4">
          <div className="-mx-1 overflow-x-auto px-1">
            <Tabs<Cat>
              value={cat}
              onChange={setCat}
              tabs={[
                { value: 'all', label: t('common.all'), count: inPeriod.length },
                ...EXPENSE_CATEGORIES.map((c) => ({
                  value: c as Cat,
                  label: t(`reports.cat.${c}`),
                  count: inPeriod.filter((e) => e.category === c).length,
                })),
              ]}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-[160px_160px_1fr]">
            <Input
              aria-label={t('accReports.dateFrom')}
              type="date"
              max={today}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              aria-label={t('accReports.dateTo')}
              type="date"
              max={today}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <Input
              aria-label={t('common.search')}
              placeholder={t('expenses.search')}
              leftIcon={<FiSearch />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={<FiCreditCard />} title={t('expenses.empty')} />
        ) : (
          <div className="px-5">
            <Table columns={columns} rows={rows} rowKey={(e) => e.id} />
          </div>
        )}
      </Card>

      {edit && <ExpenseModal entry={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
      {remove && (
        <Modal
          open
          onClose={() => setRemove(null)}
          title={t('expenses.deleteTitle')}
          description={`${formatDate(day(remove.date))} · ${what(remove)} · ${formatTjs(remove.amount)}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setRemove(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                loading={del.isPending}
                onClick={() =>
                  del.mutate(remove.id, {
                    onSuccess: () => {
                      toast(t('expenses.deleted'), 'success');
                      setRemove(null);
                    },
                    onError: (err) => toast(getApiErrorMessage(err), 'error'),
                  })
                }
              >
                {t('common.delete')}
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted">{t('expenses.deleteText')}</p>
        </Modal>
      )}
    </div>
  );
}
