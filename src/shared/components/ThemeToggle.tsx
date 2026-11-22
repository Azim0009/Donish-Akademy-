import { useTranslation } from 'react-i18next';
import { FiMoon, FiSun } from 'react-icons/fi';
import { useThemeStore } from '@/core/theme/themeStore';
import { IconButton } from '@/shared/ui';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  return (
    <IconButton label={t('switchers.theme')} onClick={toggleTheme}>
      {theme === 'light' ? <FiMoon /> : <FiSun />}
    </IconButton>
  );
}
