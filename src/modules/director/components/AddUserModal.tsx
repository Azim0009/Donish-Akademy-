import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { Button, Input, Modal, Select, toast } from '@/shared/ui';
import { CredentialsFields } from '@/shared/components/CredentialsFields';
import { CredentialsResult, type CreatedCredentials } from '@/shared/components/CredentialsResult';
import {
  generatePassword,
  isStrongPassword,
  LOGIN_RE,
  loginFromName,
} from '@/shared/lib/credentials';
import { useDirectorGroups, useCreateUser } from '../api/directorApi';
import { ContractPreview } from '@/shared/components/contracts/ContractPreview';
import { useInvalidateContracts } from '@/shared/api/contractsApi';
import { useAuthStore } from '@/core/auth/authStore';

const schema = z.object({
  name: z.string().min(2, 'validation.min2'),
  phone: z.string().regex(/^\+?[\d\s()-]{9,20}$/, 'validation.phone'),
  groupId: z.string().optional(),
});
type Form = z.infer<typeof schema>;

/**
 * Добавить ментора или ученика в свой филиал. Логин и пароль задаёт директор:
 * ментор входит по логину …@donish.tj, ученик — по номеру телефона.
 */
export function AddUserModal({
  open,
  onClose,
  role,
  groupId,
}: {
  open: boolean;
  onClose: () => void;
  role: 'mentor' | 'student';
  groupId?: string;
}) {
  const { t } = useTranslation();
  const groups = useDirectorGroups();
  const create = useCreateUser();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    values: { name: '', phone: '', groupId: groupId ?? '' },
  });
  const err = (k: keyof Form) => errors[k]?.message && t(String(errors[k]!.message));
  const [login, setLogin] = useState('');
  const [loginTouched, setLoginTouched] = useState(false);
  const [password, setPassword] = useState(() => generatePassword());
  const [credErrors, setCredErrors] = useState<{ login?: string; password?: string }>({});
  const [created, setCreated] = useState<CreatedCredentials | null>(null);
  const isStudent = role === 'student';
  const invalidateContracts = useInvalidateContracts();
  const me = useAuthStore((st) => st.user);
  const shownLogin = loginTouched ? login : loginFromName(watch('name') ?? '');

  const submit = handleSubmit((v) => {
    const e = {
      login: isStudent || LOGIN_RE.test(shownLogin) ? undefined : t('credentials.loginError'),
      password: isStrongPassword(password) ? undefined : t('credentials.passwordError'),
    };
    setCredErrors(e);
    if (e.login || e.password) return;
    create.mutate(
      { ...v, role, password, ...(isStudent ? {} : { login: shownLogin }) },
      {
        onSuccess: (u) => {
          toast(t('users.created', { name: u.name }), 'success');
          if (!isStudent) invalidateContracts();
          setCreated({
            name: u.name,
            roleLabel: t(`roles.${role}`),
            login: isStudent ? u.phone : u.email,
            password,
            phone: u.phone,
          });
          reset();
          setLogin('');
          setLoginTouched(false);
          setPassword(generatePassword());
          onClose();
        },
        onError: (er) => toast(getApiErrorMessage(er), 'error'),
      },
    );
  });

  const title = role === 'mentor' ? t('users.addMentor') : t('users.addStudent');
  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={title}
        description={isStudent ? t('credentials.studentHint') : t('credentials.createHint')}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submit} loading={create.isPending}>
              {title}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input label={t('common.fullName')} {...register('name')} error={err('name')} />
          <Input
            label={t('branch.phone')}
            placeholder="+992 90 000 00 00"
            {...register('phone')}
            error={err('phone')}
            hint={isStudent ? t('credentials.phoneIsLogin') : undefined}
          />
          {isStudent && (
            <Select
              label={t('users.group')}
              placeholder={t('users.noGroup')}
              {...register('groupId')}
              options={(groups.data ?? []).map((g) => ({
                value: g.id,
                label: `${g.name} · ${g.schedule}`,
              }))}
            />
          )}
          {isStudent ? (
            <CredentialsFields
              onlyPassword
              login=""
              password={password}
              onLogin={() => {}}
              onPassword={setPassword}
              errors={credErrors}
            />
          ) : (
            <CredentialsFields
              login={shownLogin}
              password={password}
              onLogin={(v) => {
                setLoginTouched(true);
                setLogin(v);
              }}
              onPassword={setPassword}
              errors={credErrors}
            />
          )}
          {!isStudent && (
            <ContractPreview
              scope="director"
              role="mentor"
              data={{
                fullName: watch('name'),
                firstName: (watch('name') ?? '').trim().split(/\s+/)[0],
                lastName: (watch('name') ?? '').trim().split(/\s+/).slice(1).join(' '),
                phone: watch('phone'),
                login: shownLogin,
                branch: me?.branchName ?? undefined,
                city: me?.branchName ?? undefined,
              }}
            />
          )}
        </form>
      </Modal>
      {created && <CredentialsResult data={created} onClose={() => setCreated(null)} />}
    </>
  );
}
