import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PATHS } from '@/core/config/paths';
import { RequireRole } from '@/app/router/guards/RequireRole';
import { PanelLayout } from '@/shared/layouts/PanelLayout';
import { studentMenu } from './menu';

// Ленивая загрузка: каждая страница — отдельный чанк
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage'));
const TracksCatalogPage = lazy(() => import('./pages/TracksCatalogPage'));
const TrackDetailPage = lazy(() => import('./pages/TrackDetailPage'));
const StudentLivePage = lazy(() => import('./pages/StudentLivePage'));
const MyScoresPage = lazy(() => import('./pages/MyScoresPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const LessonEditorPage = lazy(() => import('./pages/LessonEditorPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('@/modules/notifications/pages/NotificationsPage'));
const AccountSettingsPage = lazy(() => import('@/modules/account/pages/AccountSettingsPage'));

export const studentRoutes: RouteObject = {
  path: PATHS.student.root,
  element: (
    <RequireRole roles={['student']}>
      <PanelLayout titleKey="panels.student" basePath={PATHS.student.root} menu={studentMenu} />
    </RequireRole>
  ),
  children: [
    { index: true, element: <StudentDashboardPage /> },
    { path: PATHS.student.tracks, element: <TracksCatalogPage /> },
    { path: PATHS.student.track, element: <TrackDetailPage /> },
    { path: PATHS.student.live, element: <StudentLivePage /> },
    { path: PATHS.student.scores, element: <MyScoresPage /> },
    { path: PATHS.student.lesson, element: <LessonPage /> },
    { path: PATHS.student.lessonEditor, element: <LessonEditorPage /> },
    { path: PATHS.student.profile, element: <ProfilePage /> },
    { path: PATHS.student.notifications, element: <NotificationsPage /> },
    { path: PATHS.student.settings, element: <AccountSettingsPage /> },
  ],
};
