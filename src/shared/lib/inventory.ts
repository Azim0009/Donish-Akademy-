import type { BadgeTone } from '@/shared/ui';
import type { InventoryCategory, InventoryItem, InventoryStatus } from '@/core/types/models';

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  'tech',
  'furniture',
  'education',
  'household',
  'other',
];
export const INVENTORY_STATUSES: InventoryStatus[] = ['in_use', 'storage', 'repair', 'written_off'];
export const inventoryStatusTone: Record<InventoryStatus, BadgeTone> = {
  in_use: 'green',
  storage: 'blue',
  repair: 'amber',
  written_off: 'gray',
};
export const itemTotal = (i: Pick<InventoryItem, 'quantity' | 'unitPrice'>) =>
  i.quantity * i.unitPrice;

/** CSV для Excel: «;» как разделитель и BOM, чтобы кириллица открылась правильно */
export function inventoryCsv(
  items: InventoryItem[],
  head: string[],
  row: (i: InventoryItem) => (string | number)[],
) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + [head, ...items.map(row)].map((r) => r.map(esc).join(';')).join('\n');
}
