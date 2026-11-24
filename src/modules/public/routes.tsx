import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PATHS } from '@/core/config/paths';
import { PublicLayout } from '@/shared/layouts/PublicLayout';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const PartnerPublicPage = lazy(() => import('./pages/PartnerPublicPage'));

export const publicRoutes: RouteObject = {
  element: <PublicLayout />,
  children: [
    { path: PATHS.home, element: <LandingPage /> },
    { path: PATHS.partnerPage, element: <PartnerPublicPage /> },
  ],
};
