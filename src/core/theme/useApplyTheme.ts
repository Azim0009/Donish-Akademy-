import { useEffect } from 'react';
import { useThemeStore } from './themeStore';

/** Вешает класс "dark" на <html>, Tailwind подхватывает dark: стили */
export function useApplyTheme() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
}
