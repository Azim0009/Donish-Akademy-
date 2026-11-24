import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PATHS } from '@/core/config/paths';
import { RequireRole } from '@/app/router/guards/RequireRole';
import { PanelLayout } from '@/shared/layouts/PanelLayout';
import { administratorMenu } from './menu';

const AdministratorDashboardPage = lazy(() => import('./pages/AdministratorDashboardPage'));
const AdministratorStudentsPage = lazy(() => import('./pages/AdministratorStudentsPage'));
const AdministratorPaymentsPage = lazy(() => import('./pages/AdministratorPaymentsPage'));
const LeadsPage = lazy(() => import('@/modules/leads/pages/LeadsPage'));
const TasksPage = lazy(() => import('@/modules/tasks/pages/TasksPage'));
const NotificationsPage = lazy(() => import('@/modules/notifications/pages/NotificationsPage'));
const AccountSettingsPage = lazy(() => import('@/modules/account/pages/AccountSettingsPage'));

export const administratorRoutes: RouteObject = {
  path: PATHS.administrator.root,
  element: (
    <RequireRole roles={['administrator']}>
      <PanelLayout
        titleKey="panels.administrator"
        basePath={PATHS.administrator.root}
        menu={administratorMenu}
      />
    </RequireRole>
  ),
  children: [
    { index: true, element: <AdministratorDashboardPage /> },
    { path: PATHS.administrator.students, element: <AdministratorStudentsPage /> },
    { path: PATHS.administrator.payments, element: <AdministratorPaymentsPage /> },
    { path: PATHS.administrator.leads, element: <LeadsPage /> },
    { path: PATHS.administrator.tasks, element: <TasksPage /> },
    { path: PATHS.administrator.notifications, element: <NotificationsPage /> },
    { path: PATHS.administrator.settings, element: <AccountSettingsPage /> },
  ],
};
