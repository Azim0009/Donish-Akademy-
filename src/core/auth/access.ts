import type { User } from '@/core/types/models';
import { MENUS, toggleableSections } from '@/core/navigation/menus';
import { sectionsOffByBranch } from '@/core/navigation/branchFeatures';
import type { MenuItem } from '@/core/navigation/types';
import type { Role } from './roles';

/**
 * Мульти-доступ.
 * roles — все роли сотрудника (основная — первая), deniedSections — выключенные разделы.
 * По умолчанию всё включено: галочку снимают, только если раздел нужно скрыть.
 * ВАЖНО: это удобство интерфейса. Настоящую проверку прав делает backend.
 */
export type AccessUser = Pick<User, 'role' | 'roles' | 'deniedSections' | 'branchFeatures'>;

/** Роли, которые можно добавлять сотруднику (SuperAdmin и ученик — нет) */
export const ASSIGNABLE_ROLES: Role[] = [
  'director',
  'administrator',
  'mentor',
  'accountant',
  'cleaner',
  'sales',
];
/** Директор раздаёт роли только внутри филиала — роль директора даёт лишь SuperAdmin */
export const DIRECTOR_ASSIGNABLE = [
  'administrator',
  'mentor',
  'accountant',
  'cleaner',
  'sales',
] as const satisfies readonly Role[];
export type DirectorAssignable = (typeof DIRECTOR_ASSIGNABLE)[number];

export function userRoles(u: AccessUser): Role[] {
  const extra = (u.roles ?? []).filter((r) => r !== u.role);
  return [u.role, ...extra];
}

export const hasRole = (u: AccessUser, role: Role) => userRoles(u).includes(role);

/** Раздел открыт, если его не выключили сотруднику И его функция включена в филиале */
export const isSectionAllowed = (u: AccessUser, section: string) =>
  !(u.deniedSections ?? []).includes(section) &&
  !sectionsOffByBranch(u.branchFeatures).has(section);

const matches = (item: MenuItem, path: string) =>
  item.end ? path === item.to : path === item.to || path.startsWith(`${item.to}/`);

/** Раздел, к которому относится адрес (самое длинное совпадение) */
export function sectionOfPath(path: string): MenuItem | null {
  let best: MenuItem | null = null;
  for (const items of Object.values(MENUS))
    for (const item of items)
      if (matches(item, path) && (!best || item.to.length > best.to.length)) best = item;
  return best;
}

/** Меню пользователя: по группе на каждую роль, без выключенных разделов */
export function buildMenu(u: AccessUser) {
  const roles = userRoles(u);
  const groups = roles.map((role) => ({
    role,
    items: MENUS[role].filter((m) => !m.common && isSectionAllowed(u, m.section)),
  }));
  // Уведомления и настройки — один раз, от основной роли
  const common = MENUS[roles[0]].filter((m) => m.common);
  return { groups: groups.filter((g) => g.items.length > 0), common };
}

/** Значение редактора доступа в формах */
export interface AccessValue {
  roles: Role[];
  denied: Set<string>;
}

/** Оставляем выключенными только разделы выбранных ролей — это и отправляем на сервер */
export const accessPayload = (v: AccessValue) => {
  const keep = new Set(v.roles.flatMap((r) => toggleableSections(r).map((s) => s.section)));
  return { roles: v.roles, deniedSections: [...v.denied].filter((s) => keep.has(s)) };
};
