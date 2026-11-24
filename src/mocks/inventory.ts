import type { InventoryCheck, InventoryItem, InventoryItemInput } from '@/core/types/models';

/** Демо-имущество филиала Душанбе (для бухгалтера) */
const ago = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const BRANCH = 'branch_dushanbe';

type Seed = [
  string,
  InventoryItemInput['category'],
  number,
  number,
  string,
  string,
  InventoryItemInput['status'],
  number,
];
const SEED: Seed[] = [
  ['Ноутбук Lenovo IdeaPad 5', 'tech', 12, 6800, 'Кабинет 1', 'Админ. филиала', 'in_use', 300],
  ['Ноутбук HP 250 G9', 'tech', 8, 5900, 'Кабинет 2', 'Админ. филиала', 'in_use', 220],
  ['Проектор Epson EB-X51', 'tech', 3, 5200, 'Кабинеты 1–3', 'Админ. филиала', 'in_use', 400],
  ['Wi-Fi роутер TP-Link Archer', 'tech', 2, 900, 'Коридор', 'Админ. филиала', 'in_use', 360],
  ['Монитор Samsung 24"', 'tech', 4, 1700, 'Ресепшн', 'Админ. филиала', 'repair', 180],
  ['Парта ученическая', 'furniture', 40, 650, 'Кабинеты 1–4', 'Директор', 'in_use', 500],
  ['Стул офисный', 'furniture', 48, 420, 'Кабинеты 1–4', 'Директор', 'in_use', 500],
  ['Шкаф для документов', 'furniture', 2, 1800, 'Бухгалтерия', 'Бухгалтер', 'in_use', 450],
  ['Маркерная доска 180×90', 'education', 4, 1100, 'Кабинеты 1–4', 'Менторы', 'in_use', 480],
  ['Набор маркеров', 'education', 20, 45, 'Склад', 'Админ. филиала', 'storage', 30],
  ['Кулер для воды', 'household', 2, 1300, 'Коридор', 'Уборщица', 'in_use', 260],
  ['Пылесос Philips', 'household', 1, 1500, 'Склад', 'Уборщица', 'in_use', 200],
  ['Старый принтер Canon', 'tech', 1, 2100, 'Склад', 'Бухгалтер', 'written_off', 900],
];

let n = 0;
const invNo = () => `INV-${String(++n).padStart(4, '0')}`;

export const inventory: InventoryItem[] = SEED.map(
  ([name, category, quantity, unitPrice, location, responsible, status, days], i) => ({
    id: `inv_${i + 1}`,
    branchId: BRANCH,
    invNo: invNo(),
    name,
    category,
    quantity,
    unitPrice,
    location,
    responsible,
    status,
    purchasedAt: ago(days).slice(0, 10),
    note: status === 'repair' ? 'Не включается, отдан в сервис' : '',
    lastCheck: status === 'written_off' ? null : { at: ago(32), found: true },
  }),
);

export const inventoryChecks: InventoryCheck[] = [
  { id: 'check_1', at: ago(32), by: 'Бухгалтер', total: 12, found: 12, missing: [] },
];

export const nextInvNo = invNo;
