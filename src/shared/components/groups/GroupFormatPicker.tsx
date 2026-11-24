import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { FiMapPin, FiWifi } from 'react-icons/fi';
import type { GroupFormat } from '@/core/types/models';

/** Выбор формата группы: онлайн (видеосвязь) или офлайн (кабинет филиала) */
export function GroupFormatPicker({
  value,
  onChange,
  className,
}: {
  value: GroupFormat;
  onChange: (v: GroupFormat) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const items: { v: GroupFormat; icon: typeof FiWifi }[] = [
    { v: 'online', icon: FiWifi },
    { v: 'offline', icon: FiMapPin },
  ];
  return (
    <fieldset className={className}>
      <legend className="mb-1.5 text-sm font-medium">{t('groups.formatLabel')}</legend>
      <div role="radiogroup" className="grid grid-cols-2 gap-2">
        {items.map(({ v, icon: Icon }) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={clsx(
              'flex items-start gap-2.5 rounded-ctl border p-3 text-left transition-colors',
              value === v ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30',
            )}
          >
            <Icon
              className={clsx('mt-0.5 shrink-0', value === v ? 'text-brand-strong' : 'text-muted')}
              aria-hidden
            />
            <span>
              <span className="block text-sm font-medium">{t(`groups.format.${v}`)}</span>
              <span className="block text-xs text-muted">{t(`groups.formatHint.${v}`)}</span>
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
