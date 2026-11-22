import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserListItem } from '@/core/types/models';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { Button, Input, Modal, toast } from '@/shared/ui';
import { CredentialsFields } from '@/shared/components/CredentialsFields';
import { isStrongPassword } from '@/shared/lib/credentials';

const PHONE = /^\+?[\d\s()-]{9,20}$/;
const NAME = /^[^<>0-9]{2,40}$/;

export interface EditUserBody {
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  phone2: string;
  /** новый пароль — только если руководитель решил его сменить */
  password?: string;
}

/** Изменить данные сотрудника или ученика: имя, фамилия, телефоны, новый пароль (по желанию) */
export function EditUserModal({ user, onClose, onSave }: { user: UserListItem; onClose: () => void; onSave: (b: EditUserBody) => Promise<unknown> }) {
  const { t } = useTranslation();
  const [first, ...rest] = user.name.split(' ');
  const [form, setForm] = useState({ firstName: user.firstName ?? first, lastName: user.lastName ?? rest.join(' '), phone: user.phone, phone2: user.phone2 ?? '' });
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const e = {
      firstName: NAME.test(form.firstName.trim()) ? undefined : t('validation.min2'),
      lastName: NAME.test(form.lastName.trim()) ? undefined : t('validation.min2'),
      phone: PHONE.test(form.phone) ? undefined : t('validation.phone'),
      phone2: !form.phone2 || PHONE.test(form.phone2) ? undefined : t('validation.phone'),
      password: !password || isStrongPassword(password) ? undefined : t('credentials.passwordError'),
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setSaving(true);
    try {
      const firstName = form.firstName.trim();
      const lastName = form.lastName.trim();
      await onSave({ ...form, firstName, lastName, name: `${firstName} ${lastName}`, ...(password ? { password } : {}) });
      toast(t('people.saved', { name: `${firstName} ${lastName}` }), 'success');
      onClose();
    } catch (er) {
      toast(getApiErrorMessage(er), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('people.editTitle', { name: user.name })}
      description={user.email || user.phone}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={submit} loading={saving}>{t('common.saveChanges')}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('people.firstName')} value={form.firstName} onChange={set('firstName')} error={errors.firstName} />
          <Input label={t('people.lastName')} value={form.lastName} onChange={set('lastName')} error={errors.lastName} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('people.phone1')} inputMode="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
          <Input label={t('people.phone2')} inputMode="tel" value={form.phone2} onChange={set('phone2')} error={errors.phone2} hint={t('people.optional')} />
        </div>
        <div>
          <CredentialsFields onlyPassword login="" password={password} onLogin={() => {}} onPassword={setPassword} errors={{ password: errors.password }} />
          <p className="mt-1.5 text-[13px] text-muted">{t('people.newPasswordHint')}</p>
        </div>
      </div>
    </Modal>
  );
}
