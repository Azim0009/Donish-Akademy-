import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/shared/ui';
import { AppProviders } from './providers/AppProviders';
import { router } from './router/router';

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <Toaster />
    </AppProviders>
  );
}
