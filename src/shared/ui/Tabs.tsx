import type { ReactNode } from 'react';
import clsx from 'clsx';

interface Tab<T extends string> {
  value: T;
  label: string;
  count?: number;
  icon?: ReactNode;
}

/** Сегментированные вкладки (фильтры, разделы) */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Tab<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={clsx('inline-flex flex-wrap gap-1 rounded-ctl bg-sunken p-1', className)}
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={t.value === value}
          onClick={() => onChange(t.value)}
          className={clsx(
            'inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium transition-colors',
            t.value === value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {t.icon}
          {t.label}
          {t.count !== undefined && <span className="text-2xs text-muted">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
