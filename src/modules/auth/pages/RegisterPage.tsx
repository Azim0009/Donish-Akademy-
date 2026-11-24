import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiAlertCircle } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { Button, Input } from '@/shared/ui';
import { registerSchema, type RegisterForm } from '../schemas';
import { useRegister } from '../hooks/useRegister';

export default function RegisterPage() {
  const { t } = useTranslation();
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const err = (k: keyof RegisterForm) => errors[k]?.message && t(errors[k]!.message!);

  return (
    <div>
      <h1 className="h-display text-[28px]">{t('auth.registerTitle')}</h1>
      <p className="mt-1 text-muted">{t('auth.registerSubtitle')}</p>
      <form
        onSubmit={handleSubmit((d) =>
          registerUser.mutate({ name: d.name, email: d.email, password: d.password }),
        )}
        className="mt-8 flex flex-col gap-4"
        noValidate
      >
        <Input
          label={t('auth.name')}
          autoComplete="name"
          {...register('name')}
          error={err('name')}
        />
        <Input
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          {...register('email')}
          error={err('email')}
        />
        <Input
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          hint={t('auth.passwordHint')}
          {...register('password')}
          error={err('password')}
        />
        <Input
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          error={err('confirmPassword')}
        />
        {registerUser.isError && (
          <p className="flex items-center gap-2 rounded-ctl bg-danger-soft px-3 py-2.5 text-sm text-danger">
            <FiAlertCircle /> {getApiErrorMessage(registerUser.error)}
          </p>
        )}
        <Button type="submit" size="lg" loading={registerUser.isPending}>
          {t('auth.createAccount')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to={PATHS.login} className="font-medium text-brand-strong hover:underline">
          {t('auth.login')}
        </Link>
      </p>
    </div>
  );
}
