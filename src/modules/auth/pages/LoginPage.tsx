import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiAlertCircle, FiBriefcase, FiSmartphone } from 'react-icons/fi';
import clsx from 'clsx';
import { PATHS } from '@/core/config/paths';
import { env } from '@/core/config/env';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { Button, Input } from '@/shared/ui';
import { loginSchema, type LoginForm } from '../schemas';
import { useLogin } from '../hooks/useLogin';

type Who = 'staff' | 'student';
const demo = [
  'superadmin',
  'director',
  'administrator',
  'mentor',
  'accountant',
  'cleaner',
  'sales',
];
const PHONE_RE = /^\+?[\d\s()-]{9,20}$/;

/**
 * Вход. Сотрудник — логин @donish.tj (можно без «@donish.tj»), ученик — номер телефона.
 * Логин и пароль выдаёт тот, кто создал аккаунт (директор / администратор).
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const login = useLogin();
  const [who, setWho] = useState<Who>('staff');
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', password: '' },
  });

  const switchTo = (w: Who) => {
    setWho(w);
    setValue('login', w === 'student' ? '+992 ' : '');
    clearErrors();
    login.reset();
  };
  const submit = handleSubmit((d) => {
    if (who === 'student' && !PHONE_RE.test(d.login))
      return setError('login', { message: 'validation.phone' });
    login.mutate(d);
  });

  return (
    <div>
      <h1 className="h-display text-[28px]">{t('auth.welcomeBack')}</h1>
      <p className="mt-1 text-muted">{t('auth.loginSubtitle')}</p>

      <div
        role="tablist"
        aria-label={t('auth.whoAreYou')}
        className="mt-6 grid grid-cols-2 gap-1 rounded-ctl bg-sunken p-1"
      >
        {(['staff', 'student'] as Who[]).map((w) => (
          <button
            key={w}
            type="button"
            role="tab"
            aria-selected={who === w}
            onClick={() => switchTo(w)}
            className={clsx(
              'flex items-center justify-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors',
              who === w ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {w === 'staff' ? <FiBriefcase /> : <FiSmartphone />}
            {t(`auth.who.${w}`)}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-4" noValidate>
        {who === 'staff' ? (
          <Input
            label={t('auth.loginLabel')}
            autoComplete="username"
            autoCapitalize="none"
            placeholder="ism.familiya@donish.tj"
            hint={t('auth.loginHint')}
            {...register('login')}
            error={errors.login && t(errors.login.message!)}
          />
        ) : (
          <Input
            label={t('auth.phoneLabel')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+992 90 000 00 00"
            hint={t('auth.phoneHint')}
            {...register('login')}
            error={errors.login && t(errors.login.message!)}
          />
        )}
        <div>
          <Input
            label={t('auth.password')}
            type="password"
            autoComplete="current-password"
            {...register('password')}
            error={errors.password && t(errors.password.message!)}
          />
          {who === 'staff' ? (
            <Link
              to={PATHS.forgotPassword}
              className="mt-2 inline-block text-[13px] font-medium text-brand-strong hover:underline"
            >
              {t('auth.forgotPassword')}
            </Link>
          ) : (
            <p className="mt-2 text-[13px] text-muted">{t('auth.studentForgot')}</p>
          )}
        </div>
        {login.isError && (
          <p className="flex items-center gap-2 rounded-ctl bg-danger-soft px-3 py-2.5 text-sm text-danger">
            <FiAlertCircle /> {getApiErrorMessage(login.error)}
          </p>
        )}
        <Button type="submit" size="lg" loading={login.isPending}>
          {t('auth.login')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to={PATHS.register} className="font-medium text-brand-strong hover:underline">
          {t('auth.register')}
        </Link>
      </p>

      {env.useMocks && (
        <div className="mt-8 rounded-card border border-dashed border-line p-4">
          <p className="text-xs text-muted">{t('auth.demoHint')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {demo.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  switchTo('staff');
                  setValue('login', `${d}@donish.tj`);
                  setValue('password', 'password1');
                }}
                className="rounded-full bg-sunken px-3 py-1 text-xs font-medium hover:bg-brand-soft hover:text-brand-strong"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                switchTo('student');
                setValue('login', '+992 90 000 00 01');
                setValue('password', 'password1');
              }}
              className="rounded-full bg-sunken px-3 py-1 text-xs font-medium hover:bg-brand-soft hover:text-brand-strong"
            >
              student (+992 90 000 00 01)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
