import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/core/config/paths';
import { useAuthStore } from '@/core/auth/authStore';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { DevRoleSwitcher } from '@/shared/components/DevRoleSwitcher';
import { Button, Loader, Logo } from '@/shared/ui';

/** Лендинг */
export function PublicLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to={PATHS.home} aria-label={t('app.name')}>
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <DevRoleSwitcher />
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <Link to={PATHS.app}>
                <Button size="sm" tabIndex={-1}>{t('landing.toCabinet')}</Button>
              </Link>
            ) : (
              <>
                <Link to={PATHS.login} className="hidden px-2 text-sm font-medium hover:text-brand-strong sm:block">
                  {t('auth.login')}
                </Link>
                <Link to={PATHS.register}>
                  <Button size="sm" tabIndex={-1}>{t('landing.start')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
