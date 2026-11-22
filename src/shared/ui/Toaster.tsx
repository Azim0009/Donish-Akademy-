import { create } from 'zustand';
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import clsx from 'clsx';

interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: Toast['tone']) => void;
  dismiss: (id: number) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, tone = 'success') => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts, { id, message, tone }] });
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Короткий вызов: toast('Сохранено') */
export const toast = (message: string, tone?: Toast['tone']) => useToastStore.getState().push(message, tone);

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex animate-pop-in items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-pop">
          <span className={clsx('mt-0.5 text-lg', t.tone === 'success' ? 'text-brand' : 'text-danger')}>
            {t.tone === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          </span>
          <p className="flex-1 text-sm">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink" aria-label="Close">
            <FiX />
          </button>
        </div>
      ))}
    </div>
  );
}
