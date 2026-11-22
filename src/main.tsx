import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { env } from '@/core/config/env';
import '@/core/i18n/i18n';
import '@/styles/index.css';

// Пока нет backend — запросы перехватывает MSW и отдаёт моки.
// Выключается в .env: VITE_USE_MOCKS=false
async function enableMocking() {
  if (!env.useMocks) return;
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
