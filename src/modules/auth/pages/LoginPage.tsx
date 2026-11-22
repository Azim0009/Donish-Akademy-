import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiAlertCircle } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { env } from '@/core/config/env';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { Button, Input } from '@/shared/ui';
import { loginSchema, type LoginForm } from '../schemas';
import { useLogin } from '../hooks/useLogin';

const demo = ['superadmin', 'director', 'administrator', 'mentor', 'student', 'accountant', 'cleaner', 'sales'];

export default function LoginPage() {
  const { t } = useTranslation();
  const login = useLogin();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  return (
    <div>
      <h1 className="h-display text-[28px]">{t('auth.welcomeBack')}</h1>
      <p className="mt-1 text-muted">{t('auth.loginSubtitle')}</p>

      <form onSubmit={handleSubmit((d) => login.mutate(d))} className="mt-8 flex flex-col gap-4" noValidate>
        <Input label={t('auth.email')} type="email" autoComplete="email" {...register('email')} error={errors.email && t(errors.email.message!)} />
        <div>
          <Input label={t('auth.password')} type="password" autoComplete="current-password" {...register('password')} error={errors.password && t(errors.password.message!)} />
          <Link to={PATHS.forgotPassword} className="mt-2 inline-block text-[13px] font-medium text-brand-strong hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>
        {login.isError && (
          <p className="flex items-center gap-2 rounded-ctl bg-danger-soft px-3 py-2.5 text-sm text-danger">
            <FiAlertCircle /> {getApiErrorMessage(login.error)}
          </p>
        )}
        <Button type="submit" size="lg" loading={login.isPending}>{t('auth.login')}</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to={PATHS.register} className="font-medium text-brand-strong hover:underline">{t('auth.register')}</Link>
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
                  setValue('email', `${d}@donish.tj`);
                  setValue('password', 'password1');
                }}
                className="rounded-full bg-sunken px-3 py-1 text-xs font-medium hover:bg-brand-soft hover:text-brand-strong"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
