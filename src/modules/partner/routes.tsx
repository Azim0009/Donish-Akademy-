import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PATHS } from '@/core/config/paths';
import { RequireRole } from '@/app/router/guards/RequireRole';
import { PanelLayout } from '@/shared/layouts/PanelLayout';
import { MENUS } from '@/core/navigation/menus';

const PartnerDashboardPage = lazy(() => import('./pages/PartnerDashboardPage'));
const PartnerCoursesPage = lazy(() => import('./pages/PartnerCoursesPage'));
const PartnerStudentsPage = lazy(() => import('./pages/PartnerStudentsPage'));
const PartnerCourseBuilderPage = lazy(() => import('./pages/PartnerCourseBuilderPage'));
const PartnerLessonEditPage = lazy(() => import('./pages/PartnerLessonEditPage'));
const NotificationsPage = lazy(() => import('@/modules/notifications/pages/NotificationsPage'));
const AccountSettingsPage = lazy(() => import('@/modules/account/pages/AccountSettingsPage'));

/** Кабинет преподавателя-партнёра: своя ссылка, свои курсы, свои ученики */
export const partnerRoutes: RouteObject = {
  path: PATHS.partner.root,
  element: (
    <RequireRole roles={['partner']}>
      <PanelLayout titleKey="panels.partner" basePath={PATHS.partner.root} menu={MENUS.partner} />
    </RequireRole>
  ),
  children: [
    { index: true, element: <PartnerDashboardPage /> },
    { path: PATHS.partner.courses, element: <PartnerCoursesPage /> },
    { path: PATHS.partner.course, element: <PartnerCourseBuilderPage /> },
    { path: PATHS.partner.lesson, element: <PartnerLessonEditPage /> },
    { path: PATHS.partner.students, element: <PartnerStudentsPage /> },
    { path: PATHS.partner.notifications, element: <NotificationsPage /> },
    { path: PATHS.partner.settings, element: <AccountSettingsPage /> },
  ],
};
