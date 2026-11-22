import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiFileText } from 'react-icons/fi';
import type { ContractRole } from '@/core/types/models';
import { useContractTemplates, type ContractsScope } from '@/shared/api/contractsApi';
import { fillContract, todayRu, type ContractData } from '@/shared/lib/contracts';
import { ContractText } from './ContractText';

/**
 * Договор прямо в форме создания: имя и фамилия, которые вводит создатель,
 * сразу появляются в тексте. После создания договор сохраняется в разделе «Договоры».
 */
export function ContractPreview({
  scope,
  role,
  data,
}: {
  scope: ContractsScope;
  role: ContractRole;
  data: ContractData;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: templates } = useContractTemplates(scope);
  const tpl = templates?.find((x) => x.role === role);
  if (!tpl) return null;

  const filled = fillContract(
    tpl.body,
    { position: t(`roles.${role}`), date: todayRu(), ...data },
    (f) => `[${t(`contracts.fields.${f}`, f)}]`,
  );
  return (
    <div className="rounded-card border border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-ctl bg-brand-soft text-brand-strong">
          <FiFileText />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            {t('contracts.previewTitle')}: {tpl.title}
          </span>
          <span className="block text-xs text-muted">{t('contracts.previewHint')}</span>
        </span>
        <FiChevronDown
          className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="max-h-[360px] overflow-y-auto border-t border-line bg-sunken p-3">
          <ContractText title={tpl.title} body={filled} className="text-[13px] leading-6" />
        </div>
      )}
    </div>
  );
}
