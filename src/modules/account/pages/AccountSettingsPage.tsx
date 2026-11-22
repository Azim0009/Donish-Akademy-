import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import { useAuthStore } from '@/core/auth/authStore';
import { useThemeStore } from '@/core/theme/themeStore';
import { Avatar, Button, Card, Input, Modal, PageHeader, toast } from '@/shared/ui';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import clsx from 'clsx';

const profileSchema = z.object({ name: z.string().min(2, 'validation.min2'), email: z.string().email('validation.email') });
const passwordSchema = z
  .object({
    current: z.string().min(1, 'validation.required'),
    password: z.string().min(8, 'validation.passwordMin').regex(/\d/, 'validation.passwordDigit'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'validation.passwordsMatch', path: ['confirm'] });

/** Настройки аккаунта — одна страница для всех 4 ролей */
export default function AccountSettingsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const token = useAuthStore((s) => s.accessToken);
  const { theme, setTheme } = useThemeStore();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const profile = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), values: { name: user?.name ?? '', email: user?.email ?? '' } });
  const password = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) });

  const saveProfile = useMutation({
    mutationFn: (v: z.infer<typeof profileSchema>) => api.patch(ENDPOINTS.users.me, v),
    onSuccess: (_, v) => {
      if (user) setSession({ ...user, ...v }, token ?? '');
      toast(t('common.saved'));
    },
  });
  const savePassword = useMutation({
    mutationFn: (v: { current: string; password: string }) => api.patch(ENDPOINTS.users.password, v),
    onSuccess: () => {
      password.reset();
      toast(t('auth.passwordChanged'));
    },
  });

  if (!user) return null;
  const pe = profile.formState.errors;
  const pw = password.formState.errors;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('pages.common.settings')} description={t('account.description')} />
      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold">{t('account.profile')}</h2>
          <form onSubmit={profile.handleSubmit((v) => saveProfile.mutate(v))} className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr]">
            <Avatar name={user.name} src={user.avatarUrl} size={72} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t('auth.name')} {...profile.register('name')} error={pe.name && t(pe.name.message!)} />
              <Input label={t('auth.email')} type="email" {...profile.register('email')} error={pe.email && t(pe.email.message!)} />
              <div className="sm:col-span-2">
                <Button type="submit" loading={saveProfile.isPending}>{t('common.saveChanges')}</Button>
              </div>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-[15px] font-semibold">{t('account.appearance')}</h2>
          <div className="mt-5 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm">{t('switchers.theme')}</span>
              <div className="inline-flex rounded-ctl bg-sunken p-0.5">
                {(['light', 'dark'] as const).map((th) => (
                  <button key={th} onClick={() => setTheme(th)} aria-pressed={theme === th} className={clsx('h-8 rounded-[8px] px-3 text-sm font-medium', theme === th ? 'bg-surface shadow-sm' : 'text-muted')}>
                    {t(`account.theme.${th}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm">{t('switchers.language')}</span>
              <LanguageSwitcher />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-[15px] font-semibold">{t('account.password')}</h2>
          <form onSubmit={password.handleSubmit(({ current, password: p }) => savePassword.mutate({ current, password: p }))} className="mt-5 grid gap-4 sm:grid-cols-3">
            <Input label={t('account.currentPassword')} type="password" {...password.register('current')} error={pw.current && t(pw.current.message!)} />
            <Input label={t('auth.newPassword')} type="password" {...password.register('password')} error={pw.password && t(pw.password.message!)} />
            <Input label={t('auth.confirmPassword')} type="password" {...password.register('confirm')} error={pw.confirm && t(pw.confirm.message!)} />
            <div className="sm:col-span-3">
              <Button type="submit" variant="secondary" loading={savePassword.isPending}>{t('account.changePassword')}</Button>
            </div>
          </form>
        </Card>

        {user.role === 'student' && (
          <Card className="flex flex-col gap-4 border-danger/30 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">{t('account.deleteTitle')}</h2>
              <p className="text-sm text-muted">{t('account.deleteHint')}</p>
            </div>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>{t('account.delete')}</Button>
          </Card>
        )}
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('account.deleteConfirm')}
        description={t('account.deleteHint')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={() => { setDeleteOpen(false); toast(t('account.deleteRequested')); }}>{t('account.delete')}</Button>
          </>
        }
      >
        <p className="text-sm">{t('account.deleteBody')}</p>
      </Modal>
    </div>
  );
}
