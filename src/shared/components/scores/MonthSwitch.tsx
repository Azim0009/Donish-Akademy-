import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { FiLock } from 'react-icons/fi';
import { MONTHS } from '@/shared/lib/scoring';

/** Переключатель месяцев курса 1–3; ещё не начавшиеся — с замком */
export function MonthSwitch({
  value,
  available,
  onChange,
}: {
  value: number;
  /** Текущий месяц группы: дальше — закрыто */
  available: number;
  onChange: (m: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="tablist"
      aria-label={t('scores.month')}
      className="inline-flex gap-1 rounded-ctl bg-sunken p-1"
    >
      {Array.from({ length: MONTHS }, (_, i) => i + 1).map((m) => {
        const locked = m > available;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={m === value}
            disabled={locked}
            title={locked ? t('scores.monthLocked') : undefined}
            onClick={() => onChange(m)}
            className={clsx(
              'inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium transition-colors',
              m === value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
              locked && 'cursor-not-allowed opacity-50 hover:text-muted',
            )}
          >
            {locked && <FiLock size={12} aria-hidden />}
            {t('scores.monthN', { n: m })}
          </button>
        );
      })}
    </div>
  );
}

/** Полоска с правилами начисления */
export function ScoreRules({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((x) => (
        <span key={x} className="rounded-full bg-sunken px-3 py-1 text-xs text-muted">
          {x}
        </span>
      ))}
    </div>
  );
}
