import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiBell, FiChevronDown, FiLock, FiMenu, FiX } from 'react-icons/fi';
import clsx from 'clsx';
import { useUnreadCount } from '@/core/notifications/notificationsApi';
import { useAuthStore } from '@/core/auth/authStore';
import { ROLE_HOME } from '@/core/auth/roles';
import { buildMenu, isSectionAllowed, sectionOfPath, userRoles } from '@/core/auth/access';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { UserMenu } from '@/shared/components/UserMenu';
import { Button, EmptyState, IconButton, Loader, Logo } from '@/shared/ui';
import type { MenuItem } from './types';

interface Props {
  titleKey: string;
  /** корень панели, например /director — от него строятся пути уведомлений и настроек */
  basePath: string;
  menu: MenuItem[];
  /** меню вкладками сверху (как в макете SuperAdmin). У мульти-роли всегда сайдбар с группами */
  topNav?: boolean;
}

// сколько вкладок влезает в шапку: остальные — в «Ещё»
const tabVisibility = (i: number) => (i < 2 ? 'flex' : i < 5 ? 'hidden xl:flex' : i < 7 ? 'hidden 2xl:flex' : 'hidden');
const moreVisibility = (i: number) => (i < 2 ? 'hidden' : i < 5 ? 'flex xl:hidden' : i < 7 ? 'flex 2xl:hidden' : 'flex');
const moreHiddenFrom = (n: number) => (n <= 2 ? '' : n <= 5 ? 'xl:hidden' : n <= 7 ? '2xl:hidden' : '');

/**
 * Общий layout для всех панелей.
 * Меню собирается из ролей пользователя: у мульти-роли в сайдбаре сразу разделы всех его ролей
 * (группами), без переключения панелей. Выключенные разделы скрыты и не открываются по ссылке.
 */
export function PanelLayout({ titleKey, basePath, menu, topNav }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const unread = useUnreadCount();
  const user = useAuthStore((s) => s.user);

  // закрыть мобильное меню при переходе
  useEffect(() => setOpen(false), [location.pathname]);

  const nav = user
    ? buildMenu(user)
    : {
        groups: [{ role: null, items: menu.filter((m) => !m.common) }],
        common: menu.filter((m) => m.common),
      };
  const multi = nav.groups.length > 1;
  const top = !!topNav && !multi;
  const tabs = top ? nav.groups[0].items : [];
  const home = user ? ROLE_HOME[userRoles(user)[0]] : basePath;
  // раздел выключен — не показываем страницу, даже если открыли по прямой ссылке
  const current = sectionOfPath(location.pathname);
  const blocked =
    !!user && !!current && !current.common && !isSectionAllowed(user, current.section);

  const link = ({ to, labelKey, icon: Icon, end }: MenuItem) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'group flex items-center gap-3 rounded-ctl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-soft text-brand-strong'
            : 'text-muted hover:bg-sunken hover:text-ink',
        )
      }
    >
      <Icon className="text-[18px]" />
      {t(labelKey)}
    </NavLink>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link to={home} aria-label={t('app.name')}>
          <Logo />
        </Link>
        <IconButton label={t('common.close')} className="lg:hidden" onClick={() => setOpen(false)}>
          <FiX />
        </IconButton>
      </div>

      <nav className="scroll-thin flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4">
        {nav.groups.map((g) => (
          <div key={g.role ?? 'menu'} className="flex flex-col gap-0.5">
            <p className="px-3 pb-2 pt-3 text-xs font-medium text-muted">
              {multi && g.role ? t(`roles.${g.role}`) : t(titleKey)}
            </p>
            {g.items.map(link)}
          </div>
        ))}
        <div className="mt-2 flex flex-col gap-0.5 border-t border-line pt-2">
          {nav.common.map(link)}
        </div>
      </nav>

      {user && (
        <div className="m-3 rounded-card bg-sunken px-4 py-3">
          <p className="text-xs text-muted">{t('layout.branch')}</p>
          <p className="text-sm font-medium">
            {user.branchId
              ? t(`branches.${user.branchId}`, { defaultValue: user.branchId })
              : t('layout.allBranches')}
          </p>
        </div>
      )}
    </div>
  );

  const page = blocked ? (
    <EmptyState
      icon={<FiLock />}
      title={t('access.blockedTitle')}
      description={t('access.blockedText')}
      action={
        <Link to={home}>
          <Button>{t('common.goHome')}</Button>
        </Link>
      }
    />
  ) : (
    <Suspense fallback={<Loader />}>
      <Outlet />
    </Suspense>
  );

  const controls = (
    <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
      <LanguageSwitcher />
      <ThemeToggle />
      <Link to={`${basePath}/notifications`}>
        <IconButton label={t('pages.common.notifications')} badge={unread} tabIndex={-1}>
          <FiBell />
        </IconButton>
      </Link>
      <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
      <UserMenu settingsPath={`${basePath}/settings`} />
    </div>
  );

  const drawer = open && (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 left-0 w-[280px] animate-pop-in bg-surface shadow-pop">
        {sidebar}
      </aside>
    </div>
  );

  // ---------- меню вкладками сверху ----------
  if (top) {
    return (
      <div className="flex min-h-screen flex-col">
        {drawer}
        <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-2 px-4 sm:px-6 lg:gap-6 lg:px-8">
            <IconButton
              label={t('layout.openMenu')}
              className="-ml-2 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <FiMenu />
            </IconButton>
            <Link to={home} aria-label={t('app.name')} className="shrink-0">
              <Logo />
            </Link>
            <nav
              aria-label={t(titleKey)}
              className="hidden h-16 min-w-0 items-stretch gap-1 lg:flex"
            >
              {tabs.map((m, i) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  end={m.end}
                  className={({ isActive }) =>
                    clsx(
                      'relative items-center whitespace-nowrap px-2.5 text-[13px] font-medium transition-colors',
                      tabVisibility(i),
                      isActive
                        ? 'text-brand-strong after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand'
                        : 'text-muted hover:text-ink',
                    )
                  }
                >
                  {t(m.labelKey)}
                </NavLink>
              ))}
              <MoreTabs items={tabs} className={moreHiddenFrom(tabs.length)} />
            </nav>
            {controls}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {page}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Сайдбар: фиксированный на десктопе, выезжающий на мобильном */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-line bg-surface lg:block">
        {sidebar}
      </aside>
      {drawer}

      {/* min-w-0 — чтобы широкие таблицы не распирали страницу */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
          <IconButton
            label={t('layout.openMenu')}
            className="-ml-2 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <FiMenu />
          </IconButton>
          {controls}
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {page}
        </main>
      </div>
    </div>
  );
}

/** «Ещё ▾» — вкладки, которые не влезли в шапку */
function MoreTabs({ items, className }: { items: MenuItem[]; className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const activeInside = items.some(
    (m, i) => i >= 2 && (m.end ? location.pathname === m.to : location.pathname.startsWith(m.to)),
  );

  return (
    <div ref={ref} className={clsx('relative flex items-stretch', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={clsx(
          'flex items-center gap-1 whitespace-nowrap px-2.5 text-[13px] font-medium',
          activeInside ? 'text-brand-strong' : 'text-muted hover:text-ink',
        )}
      >
        {t('layout.more')}
        <FiChevronDown className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-60 animate-pop-in rounded-card border border-line bg-surface p-1.5 shadow-pop">
          {items.map((m, i) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) =>
                clsx(
                  'items-center gap-2.5 rounded-ctl px-3 py-2 text-sm',
                  moreVisibility(i),
                  isActive ? 'bg-brand-soft text-brand-strong' : 'text-ink hover:bg-sunken',
                )
              }
            >
              <m.icon className="text-base text-muted" />
              {t(m.labelKey)}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
