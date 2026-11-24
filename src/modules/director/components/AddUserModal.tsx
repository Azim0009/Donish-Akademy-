import { useEffect, useState } from 'react';
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
import { useDirectorGroups, useCreateUser, type DirectorUserRole } from '../api/directorApi';
import { DIRECTOR_ASSIGNABLE } from '@/core/auth/access';
import type { ContractRole } from '@/core/types/models';
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
 * Добавить сотрудника или ученика в свой филиал. Логин и пароль задаёт директор:
 * сотрудник входит по логину …@donish.tj, ученик — по номеру телефона.
 * roleSelectable — показать выбор должности (раздел «Сотрудники»).
 */
export function AddUserModal({
  open,
  onClose,
  role: initialRole,
  groupId,
  roleSelectable,
}: {
  open: boolean;
  onClose: () => void;
  role: DirectorUserRole;
  groupId?: string;
  roleSelectable?: boolean;
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
  const [role, setRole] = useState<DirectorUserRole>(initialRole);
  // каждый раз открываем с должностью по умолчанию
  useEffect(() => {
    if (open) setRole(initialRole);
  }, [open, initialRole]);
  const isStudent = role === 'student';
  // договор есть у администратора и ментора (шаблоны в «Договорах»)
  const contractRole: ContractRole | null =
    role === 'administrator' || role === 'mentor' ? role : null;
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
          if (contractRole) invalidateContracts();
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

  const title = roleSelectable
    ? t('staffPage.add')
    : role === 'mentor'
      ? t('users.addMentor')
      : role === 'student'
        ? t('users.addStudent')
        : t('staffPage.addRole', { role: t(`roles.${role}`) });
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
          {roleSelectable && (
            <Select
              label={t('staffPage.position')}
              value={role}
              onChange={(e) => setRole(e.target.value as DirectorUserRole)}
              options={DIRECTOR_ASSIGNABLE.map((r) => ({ value: r, label: t(`roles.${r}`) }))}
              hint={t('staffPage.positionHint')}
            />
          )}
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
          {contractRole && (
            <ContractPreview
              scope="director"
              role={contractRole}
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
