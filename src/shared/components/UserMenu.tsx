import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuthStore } from '@/core/auth/authStore';
import { useLogout } from '@/core/auth/useLogout';
import { PATHS } from '@/core/config/paths';
import { Avatar } from '@/shared/ui';
import { useClickOutside } from '@/shared/hooks/useClickOutside';

export function UserMenu({ settingsPath }: { settingsPath: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-ctl py-1 pl-1 pr-2 transition-colors hover:bg-sunken"
      >
        <Avatar name={user.name} src={user.avatarUrl} size={34} />
        <span className="hidden text-left leading-tight lg:block">
          <span className="block text-sm font-medium">{user.name}</span>
          <span className="block text-xs text-muted">{t(`roles.${user.role}`)}</span>
        </span>
        <FiChevronDown className="hidden text-muted lg:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-60 animate-pop-in rounded-card border border-line bg-surface p-1.5 shadow-pop">
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <Link to={settingsPath} onClick={close} className="mt-1 flex items-center gap-2.5 rounded-ctl px-3 py-2 text-sm hover:bg-sunken">
            <FiSettings className="text-muted" /> {t('pages.common.settings')}
          </Link>
          <button
            onClick={async () => {
              await logout();
              navigate(PATHS.login);
            }}
            className="flex w-full items-center gap-2.5 rounded-ctl px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
          >
            <FiLogOut /> {t('common.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
