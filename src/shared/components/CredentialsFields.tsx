import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiEye, FiEyeOff, FiRefreshCw } from 'react-icons/fi';
import { Field } from '@/shared/ui';
import { generatePassword, STAFF_DOMAIN } from '@/shared/lib/credentials';

const control =
  'h-10 w-full rounded-ctl border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 transition-colors hover:border-muted/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

/** Логин (…@donish.tj) и пароль, который задаёт руководитель. Кнопка «Сгенерировать» — надёжный пароль */
export function CredentialsFields({
  login,
  password,
  onLogin,
  onPassword,
  errors,
  onlyPassword,
}: {
  login: string;
  password: string;
  onLogin: (v: string) => void;
  onPassword: (v: string) => void;
  errors?: { login?: string; password?: string };
  /** у ученика логин — номер телефона, поле логина не нужно */
  onlyPassword?: boolean;
}) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  return (
    <div className={clsx('grid gap-4', !onlyPassword && 'sm:grid-cols-2')}>
      {!onlyPassword && (
        <Field
          label={t('credentials.login')}
          htmlFor="cred-login"
          error={errors?.login}
          hint={t('credentials.loginHint')}
        >
          <div
            className={clsx(
              'flex items-stretch overflow-hidden rounded-ctl border border-line bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
              errors?.login && 'border-danger',
            )}
          >
            <input
              id="cred-login"
              value={login}
              onChange={(e) => onLogin(e.target.value.toLowerCase().replace(/\s/g, ''))}
              autoComplete="off"
              spellCheck={false}
              placeholder="name.surname"
              aria-invalid={!!errors?.login}
              className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm focus:outline-none"
            />
            <span className="flex items-center bg-sunken px-2.5 text-sm text-muted">
              @{STAFF_DOMAIN}
            </span>
          </div>
        </Field>
      )}
      <Field
        label={t('credentials.password')}
        htmlFor="cred-password"
        error={errors?.password}
        hint={t('credentials.passwordHint')}
      >
        <div className="relative">
          <input
            id="cred-password"
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            autoComplete="new-password"
            aria-invalid={!!errors?.password}
            className={clsx(control, 'pr-[72px] font-mono', errors?.password && 'border-danger')}
          />
          <div className="absolute inset-y-0 right-1 flex items-center">
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="rounded p-2 text-muted hover:text-ink"
              aria-label={show ? t('credentials.hide') : t('credentials.show')}
            >
              {show ? <FiEyeOff /> : <FiEye />}
            </button>
            <button
              type="button"
              onClick={() => {
                onPassword(generatePassword());
                setShow(true);
              }}
              className="rounded p-2 text-muted hover:text-brand-strong"
              aria-label={t('credentials.generate')}
              title={t('credentials.generate')}
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>
      </Field>
    </div>
  );
}
