import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle } from 'react-icons/fi';
import type { UserListItem } from '@/core/types/models';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { Button, Modal, toast } from '@/shared/ui';

/** Подтверждение удаления сотрудника или ученика */
export function ConfirmDeleteModal({ user, onClose, onDelete }: { user: UserListItem; onClose: () => void; onDelete: () => Promise<unknown> }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await onDelete();
      toast(t('people.deleted', { name: user.name }), 'success');
      onClose();
    } catch (e) {
      toast(getApiErrorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={t('people.deleteTitle', { name: user.name })}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={run} loading={busy}>{t('common.delete')}</Button>
        </>
      }
    >
      <div className="flex gap-3">
        <FiAlertTriangle className="mt-0.5 shrink-0 text-xl text-danger" />
        <p className="text-sm">{t('people.deleteText')}</p>
      </div>
    </Modal>
  );
}
