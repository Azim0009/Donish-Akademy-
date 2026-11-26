import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PATHS } from '@/core/config/paths';
import type { StaffRole } from '@/core/auth/roles';
import { RequireRole } from '@/app/router/guards/RequireRole';
import { PanelLayout } from '@/shared/layouts/PanelLayout';
import { MENUS } from '@/core/navigation/menus';

const StaffHomePage = lazy(() => import('./pages/StaffHomePage'));
const LeadsPage = lazy(() => import('@/modules/leads/pages/LeadsPage'));
const InventoryPage = lazy(() => import('@/modules/accountant/pages/InventoryPage'));
const ExpensesPage = lazy(() => import('@/modules/accountant/pages/ExpensesPage'));
const AccountantReportsPage = lazy(
  () => import('@/modules/accountant/pages/AccountantReportsPage'),
);
const TasksPage = lazy(() => import('@/modules/tasks/pages/TasksPage'));
const NotificationsPage = lazy(() => import('@/modules/notifications/pages/NotificationsPage'));
const AccountSettingsPage = lazy(() => import('@/modules/account/pages/AccountSettingsPage'));

/**
 * Общая панель сотрудников филиала: бухгалтер, уборщик (уборщица), отдел продаж.
 * У всех: Главная, Задачи, Уведомления, Настройки. У продаж ещё «Лиды».
 * У бухгалтера ещё «Инвентаризация».
 */
function staffRoutes(role: StaffRole): RouteObject {
  const p = PATHS[role];
  const menu = MENUS[role];
  return {
    path: p.root,
    element: (
      <RequireRole roles={[role]}>
        <PanelLayout titleKey={`panels.${role}`} basePath={p.root} menu={menu} />
      </RequireRole>
    ),
    children: [
      { index: true, element: <StaffHomePage /> },
      // лиды — только у отдела продаж
      ...(role === 'sales' ? [{ path: PATHS.sales.leads, element: <LeadsPage /> }] : []),
      // инвентаризация — у бухгалтера
      ...(role === 'accountant'
        ? [
            { path: PATHS.accountant.inventory, element: <InventoryPage /> },
            { path: PATHS.accountant.reports, element: <AccountantReportsPage /> },
            { path: PATHS.accountant.expenses, element: <ExpensesPage /> },
          ]
        : []),
      { path: p.tasks, element: <TasksPage /> },
      { path: p.notifications, element: <NotificationsPage /> },
      { path: p.settings, element: <AccountSettingsPage /> },
    ],
  };
}

export const accountantRoutes = staffRoutes('accountant');
export const cleanerRoutes = staffRoutes('cleaner');
export const salesRoutes = staffRoutes('sales');
