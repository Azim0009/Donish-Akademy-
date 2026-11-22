import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiCamera, FiX } from 'react-icons/fi';
import { PASSPORT_MAX_MB, PASSPORT_TYPES, type PassportFiles } from '@/shared/lib/passport';

function Slot({
  label,
  file,
  onChange,
  error,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);
  const url = file ? URL.createObjectURL(file) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium">{label}</span>
      <div
        className={clsx(
          'relative flex aspect-[3/2] items-center justify-center overflow-hidden rounded-ctl border-2 border-dashed bg-sunken transition-colors',
          error ? 'border-danger' : file ? 'border-brand/50' : 'border-line hover:border-brand/50',
        )}
      >
        {url ? (
          <>
            <img
              src={url}
              alt={label}
              className="h-full w-full object-cover"
              onLoad={() => URL.revokeObjectURL(url)}
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1.5 top-1.5 rounded-full bg-ink/70 p-1.5 text-white hover:bg-ink"
              aria-label={t('passport.remove')}
            >
              <FiX />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-sm text-muted hover:text-brand-strong"
          >
            <FiCamera className="text-xl" />
            {t('passport.upload')}
            <span className="text-xs">
              JPG, PNG · {t('passport.upTo', { mb: PASSPORT_MAX_MB })}
            </span>
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept={PASSPORT_TYPES.join(',')}
          className="hidden"
          aria-label={label}
          onChange={(e) => {
            onChange(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
      </div>
      {error && <span className="text-[13px] text-danger">{error}</span>}
    </div>
  );
}

/** Две ячейки: лицевая и обратная сторона паспорта */
export function PassportUpload({
  value,
  onChange,
  errors,
}: {
  value: PassportFiles;
  onChange: (v: PassportFiles) => void;
  errors?: { front?: string; back?: string };
}) {
  const { t } = useTranslation();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{t('passport.title')}</legend>
      <div className="grid grid-cols-2 gap-3">
        <Slot
          label={t('passport.front')}
          file={value.front}
          onChange={(front) => onChange({ ...value, front })}
          error={errors?.front}
        />
        <Slot
          label={t('passport.back')}
          file={value.back}
          onChange={(back) => onChange({ ...value, back })}
          error={errors?.back}
        />
      </div>
      <p className="mt-2 text-[13px] text-muted">{t('passport.hint')}</p>
    </fieldset>
  );
}
