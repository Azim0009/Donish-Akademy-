import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/core/api/queryClient';
import { useApplyTheme } from '@/core/theme/useApplyTheme';

export function AppProviders({ children }: { children: ReactNode }) {
  useApplyTheme();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
