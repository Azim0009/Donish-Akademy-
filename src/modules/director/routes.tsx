import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PATHS } from '@/core/config/paths';
import { RequireRole } from '@/app/router/guards/RequireRole';
import { PanelLayout } from '@/shared/layouts/PanelLayout';
import { directorMenu } from './menu';

// Ленивая загрузка: каждая страница — отдельный чанк
const DirectorDashboardPage = lazy(() => import('./pages/DirectorDashboardPage'));
const TracksDirectorPage = lazy(() => import('./pages/TracksDirectorPage'));
const ModulesDirectorPage = lazy(() => import('./pages/ModulesDirectorPage'));
const LessonsDirectorPage = lazy(() => import('./pages/LessonsDirectorPage'));
const LessonEditDirectorPage = lazy(() => import('./pages/LessonEditDirectorPage'));
const GroupsDirectorPage = lazy(() => import('./pages/GroupsDirectorPage'));
const GroupDetailDirectorPage = lazy(() => import('./pages/GroupDetailDirectorPage'));
const MentorsDirectorPage = lazy(() => import('./pages/MentorsDirectorPage'));
const StudentsDirectorPage = lazy(() => import('./pages/StudentsDirectorPage'));
const UserDetailDirectorPage = lazy(() => import('./pages/UserDetailDirectorPage'));
const ContractsDirectorPage = lazy(() => import('./pages/ContractsDirectorPage'));
const LeadsPage = lazy(() => import('@/modules/leads/pages/LeadsPage'));
const StaffDirectorPage = lazy(() => import('./pages/StaffDirectorPage'));
const ReportsDirectorPage = lazy(() => import('./pages/ReportsDirectorPage'));
const ReportEditDirectorPage = lazy(() => import('./pages/ReportEditDirectorPage'));
const BranchStatisticsPage = lazy(() => import('./pages/BranchStatisticsPage'));
const TasksPage = lazy(() => import('@/modules/tasks/pages/TasksPage'));
const NotificationsPage = lazy(() => import('@/modules/notifications/pages/NotificationsPage'));
const AccountSettingsPage = lazy(() => import('@/modules/account/pages/AccountSettingsPage'));

export const directorRoutes: RouteObject = {
  path: PATHS.director.root,
  element: (
    <RequireRole roles={['director']}>
      <PanelLayout
        titleKey="panels.director"
        topNav
        basePath={PATHS.director.root}
        menu={directorMenu}
      />
    </RequireRole>
  ),
  children: [
    { index: true, element: <DirectorDashboardPage /> },
    { path: PATHS.director.tracks, element: <TracksDirectorPage /> },
    { path: PATHS.director.trackModules, element: <ModulesDirectorPage /> },
    { path: PATHS.director.moduleLessons, element: <LessonsDirectorPage /> },
    { path: PATHS.director.lessonEdit, element: <LessonEditDirectorPage /> },
    { path: PATHS.director.groups, element: <GroupsDirectorPage /> },
    { path: PATHS.director.group, element: <GroupDetailDirectorPage /> },
    { path: PATHS.director.mentors, element: <MentorsDirectorPage /> },
    { path: PATHS.director.students, element: <StudentsDirectorPage /> },
    { path: PATHS.director.user, element: <UserDetailDirectorPage /> },
    { path: PATHS.director.contracts, element: <ContractsDirectorPage /> },
    { path: PATHS.director.staff, element: <StaffDirectorPage /> },
    { path: PATHS.director.leads, element: <LeadsPage /> },
    { path: PATHS.director.reports, element: <ReportsDirectorPage /> },
    { path: PATHS.director.report, element: <ReportEditDirectorPage /> },
    { path: PATHS.director.statistics, element: <BranchStatisticsPage /> },
    { path: PATHS.director.tasks, element: <TasksPage /> },
    { path: PATHS.director.notifications, element: <NotificationsPage /> },
    { path: PATHS.director.settings, element: <AccountSettingsPage /> },
  ],
};
