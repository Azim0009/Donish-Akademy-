import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  ErrorState,
  Input,
  Loader,
  PageHeader,
  Select,
  Switch,
  toast,
} from '@/shared/ui';
import { LANGUAGE_NAME, LANGUAGES } from '@/core/i18n/i18n';
import { useGlobalSettings, useSaveSettings, type GlobalSettings } from '../api/superAdminApi';

export default function GlobalSettingsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useGlobalSettings();
  const save = useSaveSettings();
  const [form, setForm] = useState<GlobalSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || (!form && !isError)) return <Loader />;
  if (isError || !form) return <ErrorState onRetry={refetch} />;

  const set = <K extends keyof GlobalSettings>(k: K, v: GlobalSettings[K]) =>
    setForm({ ...form, [k]: v });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t('pages.superAdmin.globalSettings')}
        description={t('settings.globalDescription')}
        actions={
          <Button
            loading={save.isPending}
            onClick={() => save.mutate(form, { onSuccess: () => toast(t('common.saved')) })}
          >
            {t('common.saveChanges')}
          </Button>
        }
      />
      <div className="flex flex-col gap-6">
        <Card className="grid gap-5 p-6 sm:grid-cols-2">
          <h2 className="text-[15px] font-semibold sm:col-span-2">{t('settings.platform')}</h2>
          <Input
            label={t('settings.platformName')}
            value={form.platformName}
            onChange={(e) => set('platformName', e.target.value)}
          />
          <Input
            label={t('settings.supportEmail')}
            type="email"
            value={form.supportEmail}
            onChange={(e) => set('supportEmail', e.target.value)}
          />
          <Select
            label={t('settings.defaultLanguage')}
            value={form.defaultLanguage}
            onChange={(e) => set('defaultLanguage', e.target.value)}
            options={LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_NAME[l] }))}
          />
        </Card>
        <Card className="flex flex-col gap-5 p-6">
          <h2 className="text-[15px] font-semibold">{t('settings.access')}</h2>
          <Switch
            label={t('settings.registrationOpen')}
            description={t('settings.registrationOpenHint')}
            checked={form.registrationOpen}
            onChange={(v) => set('registrationOpen', v)}
          />
          <Switch
            label={t('settings.emailVerification')}
            description={t('settings.emailVerificationHint')}
            checked={form.emailVerification}
            onChange={(v) => set('emailVerification', v)}
          />
          <Switch
            label={t('settings.maintenance')}
            description={t('settings.maintenanceHint')}
            checked={form.maintenanceMode}
            onChange={(v) => set('maintenanceMode', v)}
          />
        </Card>
        <Card className="grid gap-5 p-6 sm:grid-cols-2">
          <h2 className="text-[15px] font-semibold sm:col-span-2">{t('settings.security')}</h2>
          <Input
            label={t('settings.passwordMin')}
            type="number"
            min={8}
            max={32}
            value={form.passwordMinLength}
            onChange={(e) => set('passwordMinLength', Number(e.target.value))}
          />
          <Input
            label={t('settings.sessionDays')}
            type="number"
            min={1}
            max={30}
            value={form.sessionDays}
            onChange={(e) => set('sessionDays', Number(e.target.value))}
            hint={t('settings.sessionDaysHint')}
          />
        </Card>
      </div>
    </div>
  );
}
