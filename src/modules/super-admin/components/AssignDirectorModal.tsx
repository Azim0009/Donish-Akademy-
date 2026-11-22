import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { accessPayload, type AccessValue } from '@/core/auth/access';
import type { Branch } from '@/core/types/models';
import { Button, Input, Modal, Select, toast } from '@/shared/ui';
import { CredentialsFields } from '@/shared/components/CredentialsFields';
import { CredentialsResult, type CreatedCredentials } from '@/shared/components/CredentialsResult';
import { PassportUpload } from '@/shared/components/PassportUpload';
import {
  generatePassword,
  isStrongPassword,
  LOGIN_RE,
  loginFromName,
} from '@/shared/lib/credentials';
import { checkPassportFile, fileToDataUrl, type PassportFiles } from '@/shared/lib/passport';
import { useAssignDirector } from '../api/superAdminApi';
import { AccessEditor } from './AccessModal';
import { ContractPreview } from '@/shared/components/contracts/ContractPreview';
import { useInvalidateContracts } from '@/shared/api/contractsApi';

const PHONE = /^\+?[\d\s()-]{9,20}$/;
const NAME = /^[^<>0-9]{2,40}$/;
const schema = z.object({
  branchId: z.string().min(1, 'validation.required'),
  firstName: z.string().trim().regex(NAME, 'validation.min2'),
  lastName: z.string().trim().regex(NAME, 'validation.min2'),
  phone: z.string().regex(PHONE, 'validation.phone'),
  phone2: z.string().refine((v) => !v || PHONE.test(v), 'validation.phone'),
});
type Form = z.infer<typeof schema>;
const EMPTY = { branchId: '', firstName: '', lastName: '', phone: '', phone2: '' };

/**
 * Назначение директора филиала: имя, фамилия, 2 телефона, паспорт (2 стороны),
 * логин …@donish.tj и пароль (задаёт SuperAdmin), доступ к разделам.
 */
export function AssignDirectorModal({
  open,
  onClose,
  branches,
  branchId,
}: {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  branchId?: string;
}) {
  const { t } = useTranslation();
  const assign = useAssignDirector();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    values: { ...EMPTY, branchId: branchId ?? '' },
  });
  const err = (k: keyof Form) => errors[k]?.message && t(errors[k]!.message!);
  const [access, setAccess] = useState<AccessValue>({ roles: ['director'], denied: new Set() });
  const [login, setLogin] = useState('');
  const [loginTouched, setLoginTouched] = useState(false);
  const [password, setPassword] = useState(() => generatePassword());
  const [passport, setPassport] = useState<PassportFiles>({ front: null, back: null });
  const [extraErrors, setExtraErrors] = useState<{
    login?: string;
    password?: string;
    front?: string;
    back?: string;
  }>({});
  const [created, setCreated] = useState<CreatedCredentials | null>(null);
  const [sending, setSending] = useState(false);
  const invalidateContracts = useInvalidateContracts();
  const selectedBranch = branches.find((b) => b.id === watch('branchId'));

  // логин подставляется из имени и фамилии, пока его не поменяли руками
  const shownLogin = loginTouched
    ? login
    : loginFromName(`${watch('firstName') ?? ''} ${watch('lastName') ?? ''}`);

  const resetAll = () => {
    reset();
    setAccess({ roles: ['director'], denied: new Set() });
    setLogin('');
    setLoginTouched(false);
    setPassword(generatePassword());
    setPassport({ front: null, back: null });
    setExtraErrors({});
  };

  const fileError = (f: File | null) =>
    !f ? t('passport.required') : checkPassportFile(f) && t(checkPassportFile(f)!, { mb: 5 });

  const submit = handleSubmit(async (v) => {
    const e = {
      login: LOGIN_RE.test(shownLogin) ? undefined : t('credentials.loginError'),
      password: isStrongPassword(password) ? undefined : t('credentials.passwordError'),
      front: fileError(passport.front) || undefined,
      back: fileError(passport.back) || undefined,
    };
    setExtraErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setSending(true);
    try {
      const [passportFront, passportBack] = await Promise.all([
        fileToDataUrl(passport.front!),
        fileToDataUrl(passport.back!),
      ]);
      const name = `${v.firstName.trim()} ${v.lastName.trim()}`;
      assign.mutate(
        {
          ...v,
          name,
          login: shownLogin,
          password,
          passportFront,
          passportBack,
          ...accessPayload(access),
        },
        {
          onSuccess: (u) => {
            toast(t('directors.assigned', { name: u.name }), 'success');
            invalidateContracts();
            setCreated({
              name: u.name,
              roleLabel: t('roles.director'),
              login: u.email,
              password,
              phone: u.phone,
            });
            resetAll();
            onClose();
          },
          onError: (er) => toast(getApiErrorMessage(er), 'error'),
          onSettled: () => setSending(false),
        },
      );
    } catch {
      setSending(false);
      toast(t('passport.readError'), 'error');
    }
  });

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={t('directors.assign')}
        description={t('credentials.createHint')}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submit} loading={sending || assign.isPending}>
              {t('directors.create')}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Select
            label={t('branch.branch')}
            placeholder={t('common.choose')}
            {...register('branchId')}
            error={err('branchId')}
            options={branches
              .filter((b) => b.status !== 'archived')
              .map((b) => ({ value: b.id, label: b.name }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('people.firstName')}
              autoComplete="off"
              {...register('firstName')}
              error={err('firstName')}
            />
            <Input
              label={t('people.lastName')}
              autoComplete="off"
              {...register('lastName')}
              error={err('lastName')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('people.phone1')}
              placeholder="+992 90 000 00 00"
              inputMode="tel"
              {...register('phone')}
              error={err('phone')}
            />
            <Input
              label={t('people.phone2')}
              placeholder="+992 90 000 00 00"
              inputMode="tel"
              {...register('phone2')}
              error={err('phone2')}
              hint={t('people.optional')}
            />
          </div>
          <PassportUpload
            value={passport}
            onChange={(p) => {
              setPassport(p);
              setExtraErrors((x) => ({ ...x, front: undefined, back: undefined }));
            }}
            errors={{ front: extraErrors.front, back: extraErrors.back }}
          />
          <CredentialsFields
            login={shownLogin}
            password={password}
            onLogin={(val) => {
              setLoginTouched(true);
              setLogin(val);
            }}
            onPassword={setPassword}
            errors={extraErrors}
          />
          <ContractPreview
            scope="superAdmin"
            role="director"
            data={{
              firstName: watch('firstName'),
              lastName: watch('lastName'),
              fullName: `${watch('firstName') ?? ''} ${watch('lastName') ?? ''}`,
              phone: watch('phone'),
              login: shownLogin,
              branch: selectedBranch?.name,
              branchAddress: selectedBranch?.address,
              city: selectedBranch?.name,
            }}
          />
          <div className="mt-2 border-t border-line pt-4">
            <h3 className="mb-3 font-semibold">{t('access.button')}</h3>
            <AccessEditor primary="director" value={access} onChange={setAccess} />
          </div>
        </form>
      </Modal>
      {created && <CredentialsResult data={created} onClose={() => setCreated(null)} />}
    </>
  );
}
