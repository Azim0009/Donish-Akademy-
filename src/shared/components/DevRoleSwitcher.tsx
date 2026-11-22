import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCode } from 'react-icons/fi';
import { env } from '@/core/config/env';
import { PATHS } from '@/core/config/paths';
import { useAuthStore } from '@/core/auth/authStore';
import { DEV_MULTI_USER, DEV_USERS } from '@/core/auth/devUsers';
import { ROLES, ROLE_HOME, type Role } from '@/core/auth/roles';

const GUEST = 'guest';
const MULTI = 'multi';

/**
 * Только для разработки: быстро переключаться между ролями без входа.
 * «Гость» — выйти и посмотреть сайт как посетитель без аккаунта.
 * В production-сборке (npm run build) не показывается.
 */
export function DevRoleSwitcher() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  if (!env.isDev) return null;

  const switchTo = (value: string) => {
    if (value === GUEST) {
      logout();
      navigate(PATHS.home);
      return;
    }
    if (value === MULTI) {
      setSession(DEV_MULTI_USER, 'dev-token-multi');
      navigate(ROLE_HOME.director);
      return;
    }
    const role = value as Role;
    setSession(DEV_USERS[role], `dev-token-${role}`);
    navigate(ROLE_HOME[role]);
  };

  return (
    <label
      className="hidden items-center gap-1.5 rounded-ctl border border-dashed border-amber/70 bg-amber-soft/60 px-2 text-xs text-amber md:inline-flex"
      title={t('switchers.devRoleHint')}
    >
      <FiCode />
      <span className="hidden font-semibold 2xl:inline">{t('switchers.devRole')}:</span>
      <select
        value={
          !user
            ? GUEST
            : user.id === DEV_MULTI_USER.id
              ? MULTI
              : DEV_USERS[user.role]?.id === user.id
                ? user.role
                : ''
        }
        onChange={(e) => switchTo(e.target.value)}
        className="h-8 max-w-[150px] cursor-pointer bg-transparent pr-1 font-medium text-ink focus:outline-none 2xl:max-w-none"
        aria-label={t('switchers.devRole')}
      >
        <option value={GUEST}>{t('roles.guest')}</option>
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {t(`roles.${r}`)}
          </option>
        ))}
        <option value={MULTI}>{t('access.devMulti')}</option>
        {user &&
          !Object.values(DEV_USERS).some((u) => u.id === user.id) &&
          user.id !== DEV_MULTI_USER.id && <option value="">{user.name}</option>}
      </select>
    </label>
  );
}
