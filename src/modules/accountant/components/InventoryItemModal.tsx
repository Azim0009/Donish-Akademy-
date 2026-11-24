import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import type { InventoryItem, InventoryItemInput } from '@/core/types/models';
import { INVENTORY_CATEGORIES, INVENTORY_STATUSES } from '@/shared/lib/inventory';
import { Button, Input, Modal, Select, Textarea, toast } from '@/shared/ui';
import { useSaveItem } from '../api/inventoryApi';

const today = () => new Date().toISOString().slice(0, 10);

/** Добавить или изменить позицию имущества */
export function InventoryItemModal({
  item,
  onClose,
}: {
  item: InventoryItem | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const save = useSaveItem();
  const [f, setF] = useState<InventoryItemInput>(() =>
    item
      ? { ...item }
      : {
          name: '',
          category: 'tech',
          quantity: 1,
          unitPrice: 0,
          location: '',
          responsible: '',
          status: 'in_use',
          purchasedAt: today(),
          note: '',
        },
  );
  const [tried, setTried] = useState(false);
  const set = <K extends keyof InventoryItemInput>(k: K, v: InventoryItemInput[K]) =>
    setF((x) => ({ ...x, [k]: v }));
  const errors = {
    name: f.name.trim().length < 2 ? t('validation.required') : undefined,
    quantity: !(Number.isInteger(f.quantity) && f.quantity >= 1)
      ? t('inventory.qtyError')
      : undefined,
    unitPrice: !(f.unitPrice >= 0) ? t('inventory.priceError') : undefined,
    location: f.location.trim().length < 2 ? t('validation.required') : undefined,
    purchasedAt: !f.purchasedAt || f.purchasedAt > today() ? t('inventory.dateError') : undefined,
  };
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  const submit = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    save.mutate(
      { id: item?.id, body: f },
      {
        onSuccess: (r) => {
          toast(
            t(item ? 'inventory.updated' : 'inventory.created', { name: r.name, no: r.invNo }),
            'success',
          );
          onClose();
        },
        onError: (e) => toast(getApiErrorMessage(e)),
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? t('inventory.edit') : t('inventory.add')}
      description={item ? `${item.invNo} · ${item.name}` : t('inventory.addHint')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {t('common.saveChanges')}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('inventory.name')}
          id="inv-name"
          className="sm:col-span-2"
          placeholder="Ноутбук Lenovo IdeaPad 5"
          value={f.name}
          onChange={(e) => set('name', e.target.value)}
          error={show('name')}
        />
        <Select
          label={t('inventory.category')}
          id="inv-cat"
          value={f.category}
          onChange={(e) => set('category', e.target.value as InventoryItemInput['category'])}
          options={INVENTORY_CATEGORIES.map((c) => ({ value: c, label: t(`inventory.cat.${c}`) }))}
        />
        <Select
          label={t('inventory.status')}
          id="inv-status"
          value={f.status}
          onChange={(e) => set('status', e.target.value as InventoryItemInput['status'])}
          options={INVENTORY_STATUSES.map((s) => ({ value: s, label: t(`inventory.st.${s}`) }))}
        />
        <Input
          label={t('inventory.quantity')}
          id="inv-qty"
          type="number"
          min={1}
          value={String(f.quantity)}
          onChange={(e) => set('quantity', Number(e.target.value))}
          error={show('quantity')}
        />
        <Input
          label={t('inventory.unitPrice')}
          id="inv-price"
          type="number"
          min={0}
          value={String(f.unitPrice)}
          onChange={(e) => set('unitPrice', Number(e.target.value))}
          error={show('unitPrice')}
        />
        <Input
          label={t('inventory.location')}
          id="inv-loc"
          placeholder={t('inventory.locationPlaceholder')}
          value={f.location}
          onChange={(e) => set('location', e.target.value)}
          error={show('location')}
        />
        <Input
          label={t('inventory.responsible')}
          id="inv-resp"
          value={f.responsible}
          onChange={(e) => set('responsible', e.target.value)}
        />
        <Input
          label={t('inventory.purchasedAt')}
          id="inv-date"
          type="date"
          max={today()}
          value={f.purchasedAt}
          onChange={(e) => set('purchasedAt', e.target.value)}
          error={show('purchasedAt')}
        />
        <Textarea
          label={t('inventory.note')}
          id="inv-note"
          className="sm:col-span-2"
          rows={2}
          value={f.note}
          onChange={(e) => set('note', e.target.value)}
        />
      </div>
    </Modal>
  );
}
