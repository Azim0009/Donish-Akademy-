import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiCamera, FiX } from 'react-icons/fi';
import { checkImageFile, fileToDataUrl, PASSPORT_MAX_MB, PASSPORT_TYPES } from '@/shared/lib/passport';

/**
 * Одно фото с превью (фото филиала). Значение — ссылка на картинку (в моках data URL;
 * настоящий backend примет файл и вернёт ссылку).
 */
export function ImageUpload({ label, hint, value, onChange, className }: { label: string; hint?: string; value: string | null; onChange: (url: string | null) => void; className?: string }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    const e = checkImageFile(f);
    if (e) return setError(t(e, { mb: PASSPORT_MAX_MB }));
    setError(null);
    try {
      onChange(await fileToDataUrl(f));
    } catch {
      setError(t('passport.readError'));
    }
  };

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <span className="text-[13px] font-medium">{label}</span>
      <div className={clsx('relative flex aspect-[16/7] max-h-56 items-center justify-center overflow-hidden rounded-card border-2 border-dashed bg-sunken', error ? 'border-danger' : value ? 'border-transparent' : 'border-line hover:border-brand/50')}>
        {value ? (
          <>
            <img src={value} alt={label} className="h-full w-full object-cover" />
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button type="button" onClick={() => ref.current?.click()} className="rounded-full bg-ink/70 px-3 py-1.5 text-xs font-medium text-white hover:bg-ink">
                {t('passport.replace')}
              </button>
              <button type="button" onClick={() => onChange(null)} className="rounded-full bg-ink/70 p-1.5 text-white hover:bg-ink" aria-label={t('passport.remove')}>
                <FiX />
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => ref.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-sm text-muted hover:text-brand-strong">
            <FiCamera className="text-2xl" />
            {t('passport.upload')}
            <span className="text-xs">JPG, PNG · {t('passport.upTo', { mb: PASSPORT_MAX_MB })}</span>
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept={PASSPORT_TYPES.join(',')}
          className="hidden"
          aria-label={label}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {error ? <span className="text-[13px] text-danger">{error}</span> : hint && <span className="text-[13px] text-muted">{hint}</span>}
    </div>
  );
}
