import { useTranslation } from 'react-i18next';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import { Button, toast } from '@/shared/ui';
import { downloadContractDoc, printContract } from '@/shared/lib/contracts';

/** Скачать в Word и напечатать */
export function ContractActions({
  title,
  body,
  fileName,
  size = 'sm',
  className = 'flex flex-wrap gap-2',
}: {
  title: string;
  body: string;
  fileName: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={className}>
      <Button
        size={size}
        variant="secondary"
        leftIcon={<FiDownload />}
        onClick={() => downloadContractDoc(title, body, fileName)}
      >
        {t('contracts.word')}
      </Button>
      <Button
        size={size}
        variant="secondary"
        leftIcon={<FiPrinter />}
        onClick={() => printContract(title, body) || toast(t('contracts.popupBlocked'))}
      >
        {t('contracts.print')}
      </Button>
    </div>
  );
}
