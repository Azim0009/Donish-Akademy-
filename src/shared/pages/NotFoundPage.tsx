import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/core/config/paths';
import { Button, Logo } from '@/shared/ui';

export function ErrorScreen({ code, title, text }: { code: string; title: string; text: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      <p className="h-display mt-6 text-[88px] leading-none text-brand">{code}</p>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-sm text-muted">{text}</p>
      <Link to={PATHS.app} className="mt-2">
        <Button tabIndex={-1}>{t('common.goHome')}</Button>
      </Link>
    </div>
  );
}

export function NotFoundPage() {
  const { t } = useTranslation();
  return <ErrorScreen code="404" title={t('errors.notFound')} text={t('errors.notFoundText')} />;
}
