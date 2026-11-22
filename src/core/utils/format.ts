import i18n from '@/core/i18n/i18n';

// Таджикский: если браузер не знает формат дат для tg — показываем по-русски
const TG_SUPPORTED = Intl.DateTimeFormat.supportedLocalesOf(['tg-TJ']).length > 0;
const locale = () =>
  i18n.language === 'en' ? 'en-US' : i18n.language === 'tg' && TG_SUPPORTED ? 'tg-TJ' : 'ru-RU';

export const formatNumber = (n: number) => new Intl.NumberFormat(locale()).format(n);

export const formatDate = (
  iso: string,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
) => new Intl.DateTimeFormat(locale(), opts).format(new Date(iso));

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat(locale(), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

/** «5 мин назад», «вчера», «3 дня назад» */
export function timeAgo(iso: string) {
  // «5 мин назад» по-таджикски браузеры пока не умеют — тогда показываем по-русски
  const rtfLocale = Intl.RelativeTimeFormat.supportedLocalesOf([locale()]).length
    ? locale()
    : 'ru-RU';
  const rtf = new Intl.RelativeTimeFormat(rtfLocale, { numeric: 'auto' });
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  return formatDate(iso);
}

/** Деньги в сомони: «1 248 560 TJS» */
export const formatMoney = (n: number) => `${formatNumber(Math.round(n))} TJS`;

/** Короткая сумма для графиков: 512 тыс., 1,2 млн */
export const formatCompact = (n: number) =>
  new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 }).format(n);

/** «2026-11» → «Ноябрь 2026» */
export const formatMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  const s = new Date(y, m - 1, 1)
    .toLocaleDateString(locale(), { month: 'long', year: 'numeric' })
    .replace(/\s*г\.$/, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
};
