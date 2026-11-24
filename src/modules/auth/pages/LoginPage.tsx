import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiAlertCircle, FiBriefcase, FiEye, FiEyeOff, FiSmartphone } from 'react-icons/fi';
import clsx from 'clsx';
import { PATHS } from '@/core/config/paths';
import { env } from '@/core/config/env';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { Button, Input } from '@/shared/ui';
import { loginSchema, type LoginForm } from '../schemas';
import { useLogin } from '../hooks/useLogin';

type Who = 'staff' | 'student';
/** Демо-входы: по одному на роль. Нажал — логин и пароль подставились, осталось «Войти» */
const DEMO: { key: string; role: string; login: string; who: Who }[] = [
  { key: 'superadmin', role: 'roles.super_admin', login: 'superadmin', who: 'staff' },
  { key: 'director', role: 'roles.director', login: 'director', who: 'staff' },
  { key: 'administrator', role: 'roles.administrator', login: 'administrator', who: 'staff' },
  { key: 'mentor', role: 'roles.mentor', login: 'mentor', who: 'staff' },
  { key: 'multi', role: 'access.devMulti', login: 'director.mentor', who: 'staff' },
  { key: 'accountant', role: 'roles.accountant', login: 'accountant', who: 'staff' },
  { key: 'cleaner', role: 'roles.cleaner', login: 'cleaner', who: 'staff' },
  { key: 'sales', role: 'roles.sales', login: 'sales', who: 'staff' },
  { key: 'partner', role: 'roles.partner', login: 'farhod.nazarov', who: 'staff' },
  { key: 'student', role: 'roles.student', login: '+992 90 000 00 01', who: 'student' },
];
const DEMO_PASSWORD = 'password1';
const PHONE_RE = /^\+?[\d\s()-]{9,20}$/;

/**
 * Вход. Сотрудник — логин @donish.tj (можно без «@donish.tj»), ученик — номер телефона.
 * Логин и пароль выдаёт тот, кто создал аккаунт (директор / администратор).
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const login = useLogin();
  const [who, setWho] = useState<Who>('staff');
  const [showPassword, setShowPassword] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
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
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                aria-pressed={showPassword}
                className="grid h-8 w-9 place-items-center rounded-[8px] text-muted hover:bg-sunken hover:text-ink"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            }
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
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  switchTo(d.who);
                  setValue('login', d.login);
                  setValue('password', DEMO_PASSWORD);
                  setPicked(d.key);
                }}
                aria-pressed={picked === d.key}
                className={clsx(
                  'flex min-w-0 flex-col rounded-ctl border px-3 py-2 text-left transition-colors',
                  picked === d.key
                    ? 'border-brand bg-brand-soft'
                    : 'border-line hover:border-brand/50 hover:bg-sunken',
                )}
              >
                <span className="truncate text-[13px] font-medium">{t(d.role)}</span>
                <span className="truncate text-2xs text-muted">{d.login}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
