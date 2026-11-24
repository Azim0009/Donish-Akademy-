import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { Button, Input } from '@/shared/ui';
import { forgotPasswordSchema, type ForgotPasswordForm } from '../schemas';
import { authApi } from '../api/authApi';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const mutation = useMutation({ mutationFn: authApi.forgotPassword });
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) });

  return (
    <div>
      <Link
        to={PATHS.login}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <FiArrowLeft /> {t('auth.backToLogin')}
      </Link>
      {mutation.isSuccess ? (
        <div>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-2xl text-brand-strong">
            <FiMail />
          </span>
          <h1 className="h-display mt-5 text-[26px]">{t('auth.checkEmail')}</h1>
          <p className="mt-2 text-muted">
            {t('auth.resetLinkSent', { email: getValues('email') })}
          </p>
        </div>
      ) : (
        <>
          <h1 className="h-display text-[28px]">{t('auth.forgotTitle')}</h1>
          <p className="mt-1 text-muted">{t('auth.forgotSubtitle')}</p>
          <form
            onSubmit={handleSubmit((d) => mutation.mutate(d))}
            className="mt-8 flex flex-col gap-4"
            noValidate
          >
            <Input
              label={t('auth.email')}
              type="email"
              {...register('email')}
              error={errors.email && t(errors.email.message!)}
            />
            <Button type="submit" size="lg" loading={mutation.isPending}>
              {t('auth.sendLink')}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
