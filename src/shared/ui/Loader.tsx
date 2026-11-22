import { useTranslation } from 'react-i18next';
import { Spinner } from './Spinner';

export function Loader() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted" role="status">
      <Spinner className="h-5 w-5 text-brand" /> {t('common.loading')}
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded-ctl bg-sunken ${className}`} />;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="font-medium">{t('common.error')}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-medium text-brand-strong underline-offset-4 hover:underline">
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}
