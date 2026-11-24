import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiLock } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { Loader, Logo, LogoMark } from '@/shared/ui';

const path = ['HTML', 'CSS', 'Responsive', 'Git', 'JavaScript'];

/** Вход / регистрация: слева форма, справа фирменная панель с Road Map */
export function AuthLayout() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to={PATHS.home} aria-label={t('app.name')}>
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">
            <Suspense fallback={<Loader />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Фирменная панель */}
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-white lg:flex lg:flex-col">
        <LogoMark size={300} className="absolute -bottom-16 -right-16 opacity-[0.08]" />
        <p className="h-display max-w-md text-[34px] leading-[1.15]">{t('authPanel.title')}</p>
        <p className="mt-4 max-w-sm text-white/80">{t('authPanel.text')}</p>

        <ol className="mt-auto flex max-w-sm flex-col">
          {path.map((step, i) => {
            const done = i < 2;
            const current = i === 2;
            return (
              <li key={step} className="relative flex items-center gap-4 pb-5 last:pb-0">
                {i < path.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-24px)] w-0.5 bg-white/25" />}
                <span
                  className={
                    done
                      ? 'flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand'
                      : current
                        ? 'flex h-8 w-8 animate-pulse-ring items-center justify-center rounded-full border-2 border-white bg-brand-strong text-sm font-semibold'
                        : 'flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/70'
                  }
                >
                  {done ? <FiCheck /> : current ? i + 1 : <FiLock className="text-sm" />}
                </span>
                <span className={done || current ? 'font-medium' : 'text-white/60'}>{step}</span>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
