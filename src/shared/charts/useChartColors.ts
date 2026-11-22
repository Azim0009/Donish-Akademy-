import { useMemo } from 'react';
import { useThemeStore } from '@/core/theme/themeStore';

const read = (name: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim();
  return v ? `rgb(${v.split(' ').join(',')})` : '#1F9D4C';
};

/** Цвета графиков берём из CSS-токенов, чтобы они менялись вместе с темой */
export function useChartColors() {
  const theme = useThemeStore((s) => s.theme);
  return useMemo(
    () => ({
      brand: read('brand'),
      brandSoft: read('brand-soft'),
      amber: read('amber'),
      info: read('info'),
      danger: read('danger'),
      muted: read('muted'),
      line: read('line'),
      surface: read('surface'),
      ink: read('ink'),
      series: [read('brand'), read('info'), read('amber'), '#9B5DE5', read('danger'), read('muted')],
    }),
    // theme в зависимостях — перечитать токены после смены темы
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme],
  );
}
