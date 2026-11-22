import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { BRANCH_FEATURES } from '@/core/navigation/branchFeatures';
import { Badge } from '@/shared/ui';

/** Галочки «какие функции работают в этом филиале» */
export function BranchFeaturesPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const { t } = useTranslation();
  const toggle = (k: string) =>
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] text-muted">{t('features.hint')}</p>
        <div className="flex shrink-0 gap-3 text-[13px]">
          <button
            type="button"
            className="font-medium text-brand-strong hover:underline"
            onClick={() => onChange(BRANCH_FEATURES.map((f) => f.key))}
          >
            {t('access.all')}
          </button>
          <button
            type="button"
            className="font-medium text-muted hover:underline"
            onClick={() => onChange([])}
          >
            {t('access.none')}
          </button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {BRANCH_FEATURES.map(({ key, labelKey, icon: Icon, soon }) => {
          const on = value.includes(key);
          return (
            <label
              key={key}
              className={clsx(
                'flex cursor-pointer items-center gap-3 rounded-ctl border px-3 py-2.5 text-sm transition-colors',
                on ? 'border-brand/50 bg-brand-soft/60' : 'border-line hover:bg-sunken',
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand"
                checked={on}
                onChange={() => toggle(key)}
              />
              <Icon className={on ? 'text-brand-strong' : 'text-muted'} />
              <span className="flex-1 font-medium">{t(labelKey)}</span>
              {soon && <Badge tone="amber">{t('features.soon')}</Badge>}
            </label>
          );
        })}
      </div>
    </div>
  );
}
