import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PATHS } from '@/core/config/paths';
import { RequireRole } from '@/app/router/guards/RequireRole';
import { PanelLayout } from '@/shared/layouts/PanelLayout';
import { mentorMenu } from './menu';

// Ленивая загрузка: каждая страница — отдельный чанк
const MentorDashboardPage = lazy(() => import('./pages/MentorDashboardPage'));
const MyGroupsPage = lazy(() => import('./pages/MyGroupsPage'));
const MentorLivePage = lazy(() => import('./pages/MentorLivePage'));
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'));
const StudentProgressPage = lazy(() => import('./pages/StudentProgressPage'));
const ReviewQueuePage = lazy(() => import('./pages/ReviewQueuePage'));
const SubmissionReviewPage = lazy(() => import('./pages/SubmissionReviewPage'));
const TasksPage = lazy(() => import('@/modules/tasks/pages/TasksPage'));
const NotificationsPage = lazy(() => import('@/modules/notifications/pages/NotificationsPage'));
const AccountSettingsPage = lazy(() => import('@/modules/account/pages/AccountSettingsPage'));

export const mentorRoutes: RouteObject = {
  path: PATHS.mentor.root,
  element: (
    <RequireRole roles={['mentor']}>
      <PanelLayout titleKey="panels.mentor" basePath={PATHS.mentor.root} menu={mentorMenu} />
    </RequireRole>
  ),
  children: [
    { index: true, element: <MentorDashboardPage /> },
    { path: PATHS.mentor.live, element: <MentorLivePage /> },
    { path: PATHS.mentor.groups, element: <MyGroupsPage /> },
    { path: PATHS.mentor.group, element: <GroupDetailPage /> },
    { path: PATHS.mentor.studentProgress, element: <StudentProgressPage /> },
    { path: PATHS.mentor.reviewQueue, element: <ReviewQueuePage /> },
    { path: PATHS.mentor.submission, element: <SubmissionReviewPage /> },
    { path: PATHS.mentor.tasks, element: <TasksPage /> },
    { path: PATHS.mentor.notifications, element: <NotificationsPage /> },
    { path: PATHS.mentor.settings, element: <AccountSettingsPage /> },
  ],
};
