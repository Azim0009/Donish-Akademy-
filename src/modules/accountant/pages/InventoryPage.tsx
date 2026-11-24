import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  FiArchive,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTool,
  FiX,
} from 'react-icons/fi';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { formatDate } from '@/core/utils/format';
import type {
  InventoryCategory,
  InventoryCheck,
  InventoryItem,
  InventoryStatus,
} from '@/core/types/models';
import { KpiCard } from '@/shared/components/dashboard/KpiCard';
import {
  INVENTORY_CATEGORIES,
  INVENTORY_STATUSES,
  inventoryCsv,
  inventoryStatusTone,
  itemTotal,
} from '@/shared/lib/inventory';
import { formatTjs } from '@/shared/lib/partners';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loader,
  Modal,
  PageHeader,
  Section,
  Select,
  Table,
  Tabs,
  toast,
  type Column,
} from '@/shared/ui';
import { useFinishCheck, useInventory } from '../api/inventoryApi';
import { InventoryItemModal } from '../components/InventoryItemModal';

type Cat = 'all' | InventoryCategory;
const SHORT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

/**
 * Инвентаризация филиала (бухгалтер): реестр имущества с инвентарными номерами,
 * стоимость, состояние, ответственный; сверка «есть / нет» и история сверок; выгрузка в Excel (CSV).
 */
export default function InventoryPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useInventory();
  const finish = useFinishCheck();
  const [cat, setCat] = useState<Cat>('all');
  const [status, setStatus] = useState<'' | InventoryStatus>('');
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<InventoryItem | null | 'new'>(null);
  const [check, setCheck] = useState<Record<string, boolean> | null>(null);
  const [result, setResult] = useState<InventoryCheck | null>(null);

  const items = useMemo(() => data?.items ?? [], [data]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (i) =>
        (cat === 'all' || i.category === cat) &&
        (!status || i.status === status) &&
        (!q || `${i.invNo} ${i.name} ${i.location} ${i.responsible}`.toLowerCase().includes(q)),
    );
  }, [items, cat, status, search]);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const active = items.filter((i) => i.status !== 'written_off');
  const units = active.reduce((s, i) => s + i.quantity, 0);
  const value = active.reduce((s, i) => s + itemTotal(i), 0);
  const repair = items.filter((i) => i.status === 'repair').length;
  const last = data.checks[0];
  const marked = check ? active.filter((i) => typeof check[i.id] === 'boolean').length : 0;

  const download = () => {
    const csv = inventoryCsv(
      items,
      [
        t('inventory.invNo'),
        t('inventory.name'),
        t('inventory.category'),
        t('inventory.quantity'),
        t('inventory.unitPrice'),
        t('inventory.total'),
        t('inventory.location'),
        t('inventory.responsible'),
        t('inventory.status'),
        t('inventory.purchasedAt'),
      ],
      (i) => [
        i.invNo,
        i.name,
        t(`inventory.cat.${i.category}`),
        i.quantity,
        i.unitPrice,
        itemTotal(i),
        i.location,
        i.responsible,
        t(`inventory.st.${i.status}`),
        i.purchasedAt,
      ],
    );
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventarizaciya_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const complete = () => {
    if (!check || marked < active.length) return toast(t('inventory.checkIncomplete'), 'error');
    finish.mutate(check, {
      onSuccess: (r) => {
        setCheck(null);
        setResult(r);
      },
      onError: (e) => toast(getApiErrorMessage(e)),
    });
  };

  const columns: Column<InventoryItem>[] = [
    {
      key: 'no',
      header: t('inventory.invNo'),
      className: 'whitespace-nowrap',
      cell: (i) => <span className="font-mono text-xs">{i.invNo}</span>,
    },
    {
      key: 'name',
      header: t('inventory.name'),
      cell: (i) => (
        <div className="min-w-0">
          <p
            className={clsx('font-medium', i.status === 'written_off' && 'text-muted line-through')}
          >
            {i.name}
          </p>
          <p className="text-xs text-muted">
            {t(`inventory.cat.${i.category}`)} · {i.location}
          </p>
        </div>
      ),
    },
    {
      key: 'qty',
      header: t('inventory.qtyShort'),
      className: 'whitespace-nowrap text-right',
      cell: (i) => i.quantity,
    },
    {
      key: 'sum',
      header: t('inventory.total'),
      className: 'text-right',
      hideOnMobile: true,
      cell: (i) => (
        <span className="whitespace-nowrap tabular-nums">{formatTjs(itemTotal(i))}</span>
      ),
    },
    ...(check
      ? []
      : [
          {
            key: 'resp',
            header: t('inventory.responsible'),
            hideOnMobile: true,
            cell: (i: InventoryItem) => <span className="text-muted">{i.responsible || '—'}</span>,
          },
        ]),
    {
      key: 'status',
      header: t('inventory.status'),
      cell: (i) => (
        <Badge tone={inventoryStatusTone[i.status]}>{t(`inventory.st.${i.status}`)}</Badge>
      ),
    },
    check
      ? {
          key: 'check',
          header: t('inventory.checkCol'),
          className: 'text-right',
          cell: (i) =>
            i.status === 'written_off' ? (
              <span className="text-xs text-muted">—</span>
            ) : (
              <div className="flex justify-end gap-1">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    aria-pressed={check[i.id] === v}
                    aria-label={`${i.name}: ${v ? t('inventory.found') : t('inventory.notFound')}`}
                    onClick={() => setCheck((c) => ({ ...c, [i.id]: v }))}
                    className={clsx(
                      'inline-flex h-8 items-center gap-1 rounded-[8px] border px-2.5 text-xs font-medium transition-colors',
                      check[i.id] === v
                        ? v
                          ? 'border-brand bg-brand text-white'
                          : 'border-danger bg-danger text-white'
                        : 'border-line text-muted hover:text-ink',
                    )}
                  >
                    {v ? <FiCheck aria-hidden /> : <FiX aria-hidden />}
                    {v ? t('inventory.found') : t('inventory.notFound')}
                  </button>
                ))}
              </div>
            ),
        }
      : {
          key: 'last',
          header: t('inventory.lastCheckCol'),
          hideOnMobile: true,
          cell: (i) =>
            !i.lastCheck ? (
              <span className="text-xs text-muted">—</span>
            ) : i.lastCheck.found ? (
              <span className="whitespace-nowrap text-xs text-muted">
                ✓ {formatDate(i.lastCheck.at, SHORT)}
              </span>
            ) : (
              <Badge tone="red">{t('inventory.missing')}</Badge>
            ),
        },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (i) => (
        <Button
          size="sm"
          variant="ghost"
          aria-label={`${t('common.edit')}: ${i.name}`}
          onClick={() => setEdit(i)}
        >
          <FiEdit2 />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('pages.accountant.inventory')}
        description={t('inventory.description')}
        actions={
          <>
            <Button variant="secondary" leftIcon={<FiDownload />} onClick={download}>
              {t('inventory.export')}
            </Button>
            {!check && (
              <Button
                variant="secondary"
                leftIcon={<FiClipboard />}
                onClick={() => setCheck({})}
                disabled={active.length === 0}
              >
                {t('inventory.startCheck')}
              </Button>
            )}
            <Button leftIcon={<FiPlus />} onClick={() => setEdit('new')}>
              {t('inventory.add')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<FiArchive />}
          label={t('inventory.kpiItems')}
          value={t('inventory.kpiItemsValue', { items: active.length, units })}
        />
        <KpiCard icon={<FiDollarSign />} label={t('inventory.kpiValue')} value={formatTjs(value)} />
        <KpiCard icon={<FiTool />} label={t('inventory.kpiRepair')} value={repair} />
        <KpiCard
          icon={<FiCheckCircle />}
          label={t('inventory.kpiLastCheck')}
          value={last ? formatDate(last.at, SHORT) : '—'}
        />
      </div>

      {check && (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-info/20 bg-info-soft px-4 py-3">
          <FiClipboard className="text-info" aria-hidden />
          <p className="min-w-0 flex-1 text-sm">
            {t('inventory.checkBanner', { marked, total: active.length })}
          </p>
          <Button size="sm" variant="secondary" onClick={() => setCheck(null)}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={complete} loading={finish.isPending}>
            {t('inventory.finishCheck')}
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4">
          <div className="-mx-1 overflow-x-auto px-1">
            <Tabs<Cat>
              value={cat}
              onChange={setCat}
              tabs={[
                { value: 'all', label: t('common.all'), count: items.length },
                ...INVENTORY_CATEGORIES.map((c) => ({
                  value: c as Cat,
                  label: t(`inventory.cat.${c}`),
                  count: items.filter((i) => i.category === c).length,
                })),
              ]}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              aria-label={t('inventory.status')}
              value={status}
              onChange={(e) => setStatus(e.target.value as '' | InventoryStatus)}
              options={[
                { value: '', label: t('inventory.allStatuses') },
                ...INVENTORY_STATUSES.map((s) => ({ value: s, label: t(`inventory.st.${s}`) })),
              ]}
              className="sm:w-48"
            />
            <Input
              aria-label={t('common.search')}
              placeholder={t('inventory.search')}
              leftIcon={<FiSearch />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-72"
            />
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={<FiArchive />} title={t('common.nothingFound')} />
        ) : (
          <div className="px-5">
            <Table columns={columns} rows={rows} rowKey={(i) => i.id} />
          </div>
        )}
      </Card>

      <Section title={t('inventory.history')} bodyClassName="px-0 pb-2">
        {data.checks.length === 0 ? (
          <EmptyState title={t('inventory.noChecks')} />
        ) : (
          <ul className="divide-y divide-line">
            {data.checks.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                <span className="font-medium">{formatDate(c.at)}</span>
                <span className="text-sm text-muted">{c.by}</span>
                <span className="text-sm">
                  {t('inventory.checkSummary', { found: c.found, total: c.total })}
                </span>
                {c.missing.length > 0 ? (
                  <Badge tone="red">
                    {t('inventory.missingCount', { count: c.missing.length })}
                  </Badge>
                ) : (
                  <Badge tone="green">{t('inventory.allFound')}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {edit && (
        <InventoryItemModal item={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />
      )}
      {result && (
        <Modal
          open
          onClose={() => setResult(null)}
          title={t('inventory.resultTitle')}
          description={t('inventory.checkSummary', { found: result.found, total: result.total })}
          footer={<Button onClick={() => setResult(null)}>{t('common.close')}</Button>}
        >
          {result.missing.length === 0 ? (
            <p className="flex items-center gap-2 text-sm">
              <FiCheckCircle className="text-brand" aria-hidden /> {t('inventory.allFoundText')}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t('inventory.missingText')}</p>
              <ul className="flex flex-col gap-1">
                {result.missing.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-ctl bg-danger-soft px-3 py-2 text-sm text-danger"
                  >
                    {m.invNo} · {m.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
