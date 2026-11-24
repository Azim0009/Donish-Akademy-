import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { CredentialsFields } from '@/shared/components/CredentialsFields';
import { CredentialsResult, type CreatedCredentials } from '@/shared/components/CredentialsResult';
import {
  generatePassword,
  isStrongPassword,
  LOGIN_RE,
  loginFromName,
  staffEmail,
} from '@/shared/lib/credentials';
import { Button, Input, Modal, toast } from '@/shared/ui';
import { useCreatePartner } from '../api/superAdminApi';

const PHONE = /^\+?[\d\s()-]{9,20}$/;
const CODE = /^[a-z0-9-]{3,30}$/;

/** Новый преподаватель-партнёр: данные, код ссылки, доля, логин и пароль */
export function CreatePartnerModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const create = useCreatePartner();
  const [f, setF] = useState({ name: '', phone: '', specialty: '', code: '', share: '30' });
  const [codeTouched, setCodeTouched] = useState(false);
  const [login, setLogin] = useState('');
  const [loginTouched, setLoginTouched] = useState(false);
  const [password, setPassword] = useState(() => generatePassword());
  const [tried, setTried] = useState(false);
  const [created, setCreated] = useState<CreatedCredentials | null>(null);

  const auto = loginFromName(f.name);
  const code = codeTouched ? f.code : (auto.split('.')[0] ?? '');
  const loginValue = loginTouched ? login : auto;
  const errors = {
    name: f.name.trim().length < 3 ? t('superAdmin.partners.nameError') : undefined,
    phone: !PHONE.test(f.phone.trim()) ? t('validation.phone') : undefined,
    specialty: f.specialty.trim().length < 2 ? t('validation.required') : undefined,
    code: !CODE.test(code) ? t('superAdmin.partners.codeError') : undefined,
    share: !(Number(f.share) >= 5 && Number(f.share) <= 70)
      ? t('superAdmin.partners.shareError')
      : undefined,
    login: !LOGIN_RE.test(loginValue) ? t('credentials.loginError') : undefined,
    password: !isStrongPassword(password) ? t('credentials.passwordError') : undefined,
  };
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    create.mutate(
      {
        name: f.name.trim(),
        phone: f.phone.trim(),
        specialty: f.specialty.trim(),
        code,
        sharePercent: Number(f.share),
        login: loginValue,
        password,
      },
      {
        onSuccess: (p) => {
          toast(t('superAdmin.partners.created', { name: p.name }), 'success');
          setCreated({
            name: p.name,
            roleLabel: t('roles.partner'),
            login: staffEmail(loginValue),
            password,
            phone: p.phone,
          });
        },
        onError: (e) => toast(getApiErrorMessage(e)),
      },
    );
  };

  if (created) return <CredentialsResult data={created} onClose={onClose} />;

  return (
    <Modal
      open
      onClose={onClose}
      title={t('superAdmin.partners.create')}
      description={t('superAdmin.partners.createHint')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            {t('superAdmin.partners.create')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('common.fullName')}
            id="pt-name"
            value={f.name}
            onChange={set('name')}
            error={show('name')}
          />
          <Input
            label={t('superAdmin.partners.phone')}
            id="pt-phone"
            type="tel"
            placeholder="+992 90 123 45 67"
            value={f.phone}
            onChange={set('phone')}
            error={show('phone')}
          />
          <Input
            label={t('superAdmin.partners.specialty')}
            id="pt-spec"
            placeholder="UI/UX-дизайнер"
            className="sm:col-span-2"
            value={f.specialty}
            onChange={set('specialty')}
            error={show('specialty')}
          />
          <Input
            label={t('superAdmin.partners.code')}
            id="pt-code"
            hint={`${window.location.origin}/p/${code || '…'}`}
            value={code}
            onChange={(e) => {
              setCodeTouched(true);
              setF((x) => ({ ...x, code: e.target.value.toLowerCase() }));
            }}
            error={show('code')}
          />
          <Input
            label={t('superAdmin.partners.share')}
            id="pt-share"
            type="number"
            min={5}
            max={70}
            hint={t('superAdmin.partners.shareHint')}
            value={f.share}
            onChange={set('share')}
            error={show('share')}
          />
        </div>
        <CredentialsFields
          login={loginValue}
          password={password}
          onLogin={(v) => {
            setLoginTouched(true);
            setLogin(v);
          }}
          onPassword={setPassword}
          errors={{ login: show('login'), password: show('password') }}
        />
      </div>
    </Modal>
  );
}
