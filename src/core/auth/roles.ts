import { PATHS } from '@/core/config/paths';

/**
 * Роли платформы:
 * super_admin — вся сеть; director — директор филиала;
 * administrator — администратор филиала (ресепшн: ученики, оплаты, логины);
 * mentor — преподаватель; student — ученик.
 * Сотрудники филиала: accountant — бухгалтер, cleaner — уборщик / уборщица, sales — отдел продаж.
 * partner — преподаватель-партнёр: свои курсы на платформе и своя ссылка для учеников.
 */
export const ROLES = [
  'super_admin',
  'director',
  'administrator',
  'mentor',
  'student',
  'accountant',
  'cleaner',
  'sales',
  'partner',
] as const;

/** Сотрудники филиала с общей простой панелью */
export const STAFF_ROLES = ['accountant', 'cleaner', 'sales'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export type Role = (typeof ROLES)[number];

/** Куда отправлять пользователя после входа */
export const ROLE_HOME: Record<Role, string> = {
  super_admin: PATHS.superAdmin.root,
  director: PATHS.director.root,
  administrator: PATHS.administrator.root,
  mentor: PATHS.mentor.root,
  student: PATHS.student.root,
  accountant: PATHS.accountant.root,
  cleaner: PATHS.cleaner.root,
  sales: PATHS.sales.root,
  partner: PATHS.partner.root,
};
