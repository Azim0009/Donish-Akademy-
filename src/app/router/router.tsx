import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from '@/modules/public/routes';
import { authRoutes } from '@/modules/auth/routes';
import { studentRoutes } from '@/modules/student/routes';
import { mentorRoutes } from '@/modules/mentor/routes';
import { directorRoutes } from '@/modules/director/routes';
import { administratorRoutes } from '@/modules/administrator/routes';
import { accountantRoutes, cleanerRoutes, salesRoutes } from '@/modules/staff/routes';
import { superAdminRoutes } from '@/modules/super-admin/routes';
import { NotFoundPage } from '@/shared/pages/NotFoundPage';
import { ForbiddenPage } from '@/shared/pages/ForbiddenPage';
import { PATHS } from '@/core/config/paths';
import { RoleHomeRedirect } from './RoleHomeRedirect';

// Каждый модуль сам описывает свои роуты — здесь мы их только собираем.
export const router = createBrowserRouter([
  publicRoutes,
  authRoutes,
  studentRoutes,
  mentorRoutes,
  directorRoutes,
  administratorRoutes,
  accountantRoutes,
  cleanerRoutes,
  salesRoutes,
  superAdminRoutes,
  { path: PATHS.app, element: <RoleHomeRedirect /> },
  { path: PATHS.forbidden, element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
