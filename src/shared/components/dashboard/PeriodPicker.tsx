import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiCheck } from 'react-icons/fi';
import clsx from 'clsx';
import { formatDate } from '@/core/utils/format';
import { PERIODS, type Period } from '@/shared/lib/period';

/** «12 ноя – 19 ноя 2026» + выбор периода: 7 / 30 / 90 дней */
export function PeriodPicker({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (value - 1));
  const label = `${formatDate(from.toISOString(), { day: 'numeric', month: 'short' })} – ${formatDate(to.toISOString())}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t('dashboard.period')}
        className="inline-flex h-10 items-center gap-2.5 whitespace-nowrap rounded-ctl border border-line bg-surface px-3.5 text-sm font-medium hover:bg-sunken"
      >
        {label}
        <FiCalendar className="text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-52 animate-pop-in rounded-card border border-line bg-surface p-1.5 shadow-pop">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={clsx(
                'flex w-full items-center justify-between rounded-ctl px-3 py-2 text-left text-sm',
                p === value ? 'bg-brand-soft text-brand-strong' : 'hover:bg-sunken',
              )}
            >
              {t('dashboard.lastDays', { count: p })}
              {p === value && <FiCheck />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
