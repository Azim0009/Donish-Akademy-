import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/core/config/paths';
import { Button, Input, toast } from '@/shared/ui';
import { resetPasswordSchema, type ResetPasswordForm } from '../schemas';
import { authApi } from '../api/authApi';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (d: ResetPasswordForm) => authApi.resetPassword(token, { password: d.password }),
    onSuccess: () => {
      toast(t('auth.passwordChanged'));
      navigate(PATHS.login);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordSchema) });

  return (
    <div>
      <h1 className="h-display text-[28px]">{t('auth.newPassword')}</h1>
      <p className="mt-1 text-muted">{t('auth.newPasswordSubtitle')}</p>
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="mt-8 flex flex-col gap-4"
        noValidate
      >
        <Input
          label={t('auth.password')}
          type="password"
          hint={t('auth.passwordHint')}
          {...register('password')}
          error={errors.password && t(errors.password.message!)}
        />
        <Input
          label={t('auth.confirmPassword')}
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword && t(errors.confirmPassword.message!)}
        />
        <Button type="submit" size="lg" loading={mutation.isPending}>
          {t('auth.savePassword')}
        </Button>
      </form>
    </div>
  );
}
