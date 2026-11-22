import { useTranslation } from 'react-i18next';
import type { Contract } from '@/core/types/models';
import { formatDate } from '@/core/utils/format';
import { Button, Modal } from '@/shared/ui';
import { ContractText } from './ContractText';
import { ContractActions } from './ContractActions';

export function ContractViewModal({
  contract,
  onClose,
}: {
  contract: Contract;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={contract.userName}
      description={`${t(`roles.${contract.role}`)}${contract.branchName ? ' · ' + contract.branchName : ''} · ${formatDate(contract.createdAt)}`}
      footer={
        <>
          <ContractActions
            title={contract.title}
            body={contract.body}
            fileName={`${contract.title} — ${contract.userName}`}
            size="md"
          />
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
        </>
      }
    >
      <ContractText title={contract.title} body={contract.body} />
    </Modal>
  );
}
