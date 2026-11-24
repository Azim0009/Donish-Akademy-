import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { CredentialsFields } from '@/shared/components/CredentialsFields';
import { CredentialsResult, type CreatedCredentials } from '@/shared/components/CredentialsResult';
import { generatePassword, isStrongPassword } from '@/shared/lib/credentials';
import { Button, Input, Modal, Select, toast } from '@/shared/ui';
import { useCreateStudent } from '../api/administratorApi';

const PHONE_RE = /^\+?[\d\s()-]{9,20}$/;

/**
 * Новый ученик: логин — номер телефона, пароль задаёт администратор.
 * После создания — показать данные и отправить ученику в WhatsApp.
 * prefill — из лида отдела продаж (имя, телефон).
 */
export function AddStudentModal({
  onClose,
  groups,
  prefill,
}: {
  onClose: () => void;
  groups: { value: string; label: string }[];
  prefill?: { name: string; phone: string; leadId: string };
}) {
  const { t } = useTranslation();
  const create = useCreateStudent();
  const [f, setF] = useState({
    name: prefill?.name ?? '',
    phone: prefill?.phone ?? '+992 ',
    groupId: '',
  });
  const [password, setPassword] = useState(() => generatePassword());
  const [tried, setTried] = useState(false);
  const [created, setCreated] = useState<CreatedCredentials | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  const errName = tried && f.name.trim().length < 2 ? t('validation.min2') : undefined;
  const errPhone = tried && !PHONE_RE.test(f.phone.trim()) ? t('validation.phone') : undefined;
  const errPass = tried && !isStrongPassword(password) ? t('credentials.passwordError') : undefined;

  const submit = () => {
    setTried(true);
    if (f.name.trim().length < 2 || !PHONE_RE.test(f.phone.trim()) || !isStrongPassword(password))
      return;
    create.mutate(
      {
        name: f.name.trim(),
        phone: f.phone.trim(),
        groupId: f.groupId || undefined,
        password,
        leadId: prefill?.leadId,
      },
      {
        onSuccess: (u) => {
          toast(t('users.created', { name: u.name }), 'success');
          setCreated({
            name: u.name,
            roleLabel: t('roles.student'),
            login: u.phone,
            password,
            phone: u.phone,
          });
        },
        onError: (e) => toast(getApiErrorMessage(e), 'error'),
      },
    );
  };

  if (created) return <CredentialsResult data={created} onClose={onClose} />;
  return (
    <Modal
      open
      onClose={onClose}
      title={t('users.addStudent')}
      description={t('credentials.studentHint')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            {t('users.addStudent')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t('common.fullName')}
          value={f.name}
          onChange={set('name')}
          error={errName}
          autoFocus
          maxLength={80}
        />
        <Input
          label={t('branch.phone')}
          value={f.phone}
          onChange={set('phone')}
          error={errPhone}
          inputMode="tel"
          hint={t('credentials.phoneIsLogin')}
        />
        <Select
          label={t('users.group')}
          value={f.groupId}
          onChange={set('groupId')}
          placeholder={t('users.noGroup')}
          options={groups}
        />
        <CredentialsFields
          onlyPassword
          login=""
          password={password}
          onLogin={() => {}}
          onPassword={setPassword}
          errors={{ password: errPass }}
        />
      </div>
    </Modal>
  );
}
