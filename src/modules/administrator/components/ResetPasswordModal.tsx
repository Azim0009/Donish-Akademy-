import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserListItem } from '@/core/types/models';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { CredentialsFields } from '@/shared/components/CredentialsFields';
import { CredentialsResult } from '@/shared/components/CredentialsResult';
import { generatePassword, isStrongPassword } from '@/shared/lib/credentials';
import { Button, Modal, toast } from '@/shared/ui';
import { useResetStudentPassword } from '../api/administratorApi';

/** Ученик забыл пароль — администратор задаёт новый и отправляет в WhatsApp */
export function ResetPasswordModal({
  student,
  onClose,
}: {
  student: UserListItem;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const reset = useResetStudentPassword();
  const [password, setPassword] = useState(() => generatePassword());
  const [done, setDone] = useState(false);
  const err = isStrongPassword(password) ? undefined : t('credentials.passwordError');

  if (done)
    return (
      <CredentialsResult
        data={{
          name: student.name,
          roleLabel: t('roles.student'),
          login: student.phone,
          password,
          phone: student.phone,
        }}
        onClose={onClose}
      />
    );
  return (
    <Modal
      open
      onClose={onClose}
      title={t('administrator.newPassword')}
      description={t('administrator.newPasswordHint', { name: student.name })}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!!err}
            loading={reset.isPending}
            onClick={() =>
              reset.mutate(
                { id: student.id, password },
                {
                  onSuccess: () => setDone(true),
                  onError: (e) => toast(getApiErrorMessage(e), 'error'),
                },
              )
            }
          >
            {t('administrator.savePassword')}
          </Button>
        </>
      }
    >
      <CredentialsFields
        onlyPassword
        login=""
        password={password}
        onLogin={() => {}}
        onPassword={setPassword}
        errors={{ password: err }}
      />
    </Modal>
  );
}
