import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PATHS } from '@/core/config/paths';
import { RequireRole } from '@/app/router/guards/RequireRole';
import { PanelLayout } from '@/shared/layouts/PanelLayout';
import { superAdminMenu } from './menu';

// Ленивая загрузка: каждая страница — отдельный чанк
const SuperAdminDashboardPage = lazy(() => import('./pages/SuperAdminDashboardPage'));
const BranchesPage = lazy(() => import('./pages/BranchesPage'));
const BranchCreatePage = lazy(() => import('./pages/BranchCreatePage'));
const BranchDetailPage = lazy(() => import('./pages/BranchDetailPage'));
const BranchEditPage = lazy(() => import('./pages/BranchEditPage'));
const BranchDirectorsPage = lazy(() => import('./pages/BranchDirectorsPage'));
const AllUsersPage = lazy(() => import('./pages/AllUsersPage'));
const GlobalStatisticsPage = lazy(() => import('./pages/GlobalStatisticsPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const PartnersPage = lazy(() => import('./pages/PartnersPage'));
const RequestsPage = lazy(() => import('./pages/RequestsPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ReportViewPage = lazy(() => import('./pages/ReportViewPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const GlobalSettingsPage = lazy(() => import('./pages/GlobalSettingsPage'));
const TasksPage = lazy(() => import('@/modules/tasks/pages/TasksPage'));
const NotificationsPage = lazy(() => import('@/modules/notifications/pages/NotificationsPage'));
const AccountSettingsPage = lazy(() => import('@/modules/account/pages/AccountSettingsPage'));

export const superAdminRoutes: RouteObject = {
  path: PATHS.superAdmin.root,
  element: (
    <RequireRole roles={['super_admin']}>
      <PanelLayout
        titleKey="panels.superAdmin"
        topNav
        basePath={PATHS.superAdmin.root}
        menu={superAdminMenu}
      />
    </RequireRole>
  ),
  children: [
    { index: true, element: <SuperAdminDashboardPage /> },
    { path: PATHS.superAdmin.branches, element: <BranchesPage /> },
    { path: PATHS.superAdmin.branchCreate, element: <BranchCreatePage /> },
    { path: PATHS.superAdmin.branch, element: <BranchDetailPage /> },
    { path: PATHS.superAdmin.branchEdit, element: <BranchEditPage /> },
    { path: PATHS.superAdmin.branchDirectors, element: <BranchDirectorsPage /> },
    { path: PATHS.superAdmin.users, element: <AllUsersPage /> },
    { path: PATHS.superAdmin.statistics, element: <GlobalStatisticsPage /> },
    { path: PATHS.superAdmin.contracts, element: <ContractsPage /> },
    { path: PATHS.superAdmin.courses, element: <CoursesPage /> },
    { path: PATHS.superAdmin.partners, element: <PartnersPage /> },
    { path: PATHS.superAdmin.requests, element: <RequestsPage /> },
    { path: PATHS.superAdmin.finance, element: <FinancePage /> },
    { path: PATHS.superAdmin.reports, element: <ReportsPage /> },
    { path: PATHS.superAdmin.report, element: <ReportViewPage /> },
    { path: PATHS.superAdmin.auditLog, element: <AuditLogPage /> },
    { path: PATHS.superAdmin.globalSettings, element: <GlobalSettingsPage /> },
    { path: PATHS.superAdmin.tasks, element: <TasksPage /> },
    { path: PATHS.superAdmin.notifications, element: <NotificationsPage /> },
    { path: PATHS.superAdmin.settings, element: <AccountSettingsPage /> },
  ],
};
