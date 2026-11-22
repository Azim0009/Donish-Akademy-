import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiCopy, FiSend } from 'react-icons/fi';
import { Button, Modal, toast } from '@/shared/ui';
import { whatsappLink } from '@/shared/lib/credentials';

export interface CreatedCredentials {
  name: string;
  roleLabel: string;
  login: string;
  password: string;
  phone: string;
}

/**
 * После создания аккаунта: показать логин и пароль один раз,
 * скопировать или отправить сотруднику в WhatsApp.
 */
export function CredentialsResult({ data, onClose }: { data: CreatedCredentials; onClose: () => void }) {
  const { t } = useTranslation();
  const text = t('credentials.message', { name: data.name, role: data.roleLabel, login: data.login, password: data.password, url: window.location.origin });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast(t('credentials.copied'), 'success');
    } catch {
      toast(t('credentials.copyFailed'));
    }
  };
  return (
    <Modal open onClose={onClose} title={t('credentials.readyTitle')} description={t('credentials.readyHint')} footer={<Button onClick={onClose}>{t('common.close')}</Button>}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <FiCheckCircle className="text-2xl text-brand" />
          <div>
            <p className="font-medium">{data.name}</p>
            <p className="text-[13px] text-muted">{data.roleLabel}</p>
          </div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-card bg-sunken p-4 text-sm">
          <dt className="text-muted">{t('credentials.login')}</dt>
          <dd className="break-all font-mono font-medium">{data.login}</dd>
          <dt className="text-muted">{t('credentials.password')}</dt>
          <dd className="font-mono font-medium">{data.password}</dd>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leftIcon={<FiCopy />} onClick={copy}>{t('credentials.copy')}</Button>
          {data.phone && (
            <a href={whatsappLink(data.phone, text)} target="_blank" rel="noopener noreferrer">
              <Button leftIcon={<FiSend />} tabIndex={-1}>{t('credentials.whatsapp')}</Button>
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}
