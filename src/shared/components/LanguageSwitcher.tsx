import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiCheck, FiChevronDown, FiGlobe } from 'react-icons/fi';
import { LANGUAGE_LABEL, LANGUAGE_NAME, LANGUAGES, type Language } from '@/core/i18n/i18n';
import { useClickOutside } from '@/shared/hooks/useClickOutside';

/** Выбор языка: 🌐 RU ▾ → Русский / Тоҷикӣ / English */
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const current = ((LANGUAGES as readonly string[]).includes(i18n.language) ? i18n.language : 'ru') as Language;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t('switchers.language')}: ${LANGUAGE_NAME[current]}`}
        className="flex h-9 items-center gap-1.5 rounded-ctl px-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sunken"
      >
        <FiGlobe className="text-muted" />
        {LANGUAGE_LABEL[current]}
        <FiChevronDown className={clsx('text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul role="listbox" aria-label={t('switchers.language')} className="absolute right-0 top-full z-40 mt-2 w-44 animate-pop-in rounded-card border border-line bg-surface p-1.5 shadow-pop">
          {LANGUAGES.map((lng) => (
            <li key={lng} role="option" aria-selected={lng === current}>
              <button
                onClick={() => {
                  i18n.changeLanguage(lng);
                  close();
                }}
                className={clsx('flex w-full items-center gap-2.5 rounded-ctl px-3 py-2 text-left text-sm hover:bg-sunken', lng === current && 'font-medium')}
              >
                <span className="w-6 text-xs font-semibold text-muted">{LANGUAGE_LABEL[lng]}</span>
                <span className="flex-1">{LANGUAGE_NAME[lng]}</span>
                {lng === current && <FiCheck className="text-brand" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
