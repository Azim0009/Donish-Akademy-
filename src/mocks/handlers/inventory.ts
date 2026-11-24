import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { InventoryItem, InventoryItemInput } from '@/core/types/models';
import { inventory, inventoryChecks, nextInvNo } from '../inventory';
import { resolveMe } from '../tasks';
import { fail, ok, roleOf, url } from './utils';

const CATS = ['tech', 'furniture', 'education', 'household', 'other'];
const STATUSES = ['in_use', 'storage', 'repair', 'written_off'];

function itemError(b: Partial<InventoryItemInput>) {
  if (!b.name || b.name.trim().length < 2) return 'Укажите название';
  if (!CATS.includes(String(b.category))) return 'Выберите категорию';
  if (!STATUSES.includes(String(b.status))) return 'Выберите состояние';
  if (
    !(
      Number.isInteger(Number(b.quantity)) &&
      Number(b.quantity) >= 1 &&
      Number(b.quantity) <= 10000
    )
  )
    return 'Количество — целое число от 1';
  if (!(Number(b.unitPrice) >= 0 && Number(b.unitPrice) <= 10_000_000)) return 'Неверная цена';
  if (!b.location || b.location.trim().length < 2) return 'Укажите, где находится';
  if (!b.purchasedAt || !/^\d{4}-\d{2}-\d{2}$/.test(b.purchasedAt)) return 'Укажите дату покупки';
  return null;
}
const clean = (b: InventoryItemInput): InventoryItemInput => ({
  name: b.name.trim(),
  category: b.category,
  quantity: Number(b.quantity),
  unitPrice: Math.round(Number(b.unitPrice)),
  location: b.location.trim(),
  responsible: (b.responsible ?? '').trim(),
  status: b.status,
  purchasedAt: b.purchasedAt,
  note: (b.note ?? '').trim(),
});
/** Инвентаризацию ведёт бухгалтер (директор — тоже может смотреть) */
const allowed = (request: Request) => ['accountant', 'director'].includes(roleOf(request));
const branchOf = (request: Request) =>
  resolveMe(request.headers.get('X-Mock-User'), roleOf(request)).branchId;

export const inventoryHandlers = [
  http.get(url(ENDPOINTS.inventory.list), ({ request }) => {
    if (!allowed(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    const branch = branchOf(request);
    return ok({
      items: inventory.filter((i) => i.branchId === branch),
      checks: [...inventoryChecks].sort((a, b) => b.at.localeCompare(a.at)),
    });
  }),
  http.post(url(ENDPOINTS.inventory.list), async ({ request }) => {
    if (!allowed(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    const b = (await request.json()) as InventoryItemInput;
    const err = itemError(b);
    if (err) return fail(400, 'VALIDATION_ERROR', err);
    const item: InventoryItem = {
      id: `inv_${Date.now()}`,
      branchId: branchOf(request) ?? 'branch_dushanbe',
      invNo: nextInvNo(),
      ...clean(b),
      lastCheck: null,
    };
    inventory.push(item);
    return ok(item);
  }),
  http.patch(url('/accountant/inventory/:id'), async ({ params, request }) => {
    if (!allowed(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    const item = inventory.find((i) => i.id === params.id && i.branchId === branchOf(request));
    if (!item) return fail(404, 'ENTITY_NOT_FOUND', 'Позиция не найдена');
    const b = { ...item, ...((await request.json()) as Partial<InventoryItemInput>) };
    const err = itemError(b);
    if (err) return fail(400, 'VALIDATION_ERROR', err);
    Object.assign(item, clean(b));
    return ok(item);
  }),
  // Итог сверки: что нашли, чего нет
  http.post(url(ENDPOINTS.inventory.checks), async ({ request }) => {
    if (!allowed(request)) return fail(403, 'FORBIDDEN', 'Нет доступа');
    const me = resolveMe(request.headers.get('X-Mock-User'), roleOf(request));
    const { results } = (await request.json()) as { results: Record<string, boolean> };
    const list = inventory.filter((i) => i.branchId === me.branchId && i.status !== 'written_off');
    if (list.some((i) => typeof results?.[i.id] !== 'boolean'))
      return fail(400, 'VALIDATION_ERROR', 'Отметьте все позиции: есть или нет');
    const at = new Date().toISOString();
    list.forEach((i) => (i.lastCheck = { at, found: results[i.id] }));
    const missing = list
      .filter((i) => !results[i.id])
      .map((i) => ({ id: i.id, invNo: i.invNo, name: i.name }));
    const check = {
      id: `check_${Date.now()}`,
      at,
      by: me.name,
      total: list.length,
      found: list.length - missing.length,
      missing,
    };
    inventoryChecks.push(check);
    return ok(check);
  }),
];
