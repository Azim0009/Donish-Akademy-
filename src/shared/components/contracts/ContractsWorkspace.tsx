import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiEdit2, FiEye, FiFileText, FiSearch } from 'react-icons/fi';
import type { Contract, ContractTemplate } from '@/core/types/models';
import { formatDate, formatDateTime } from '@/core/utils/format';
import {
  useContracts,
  useContractTemplates,
  useSaveTemplate,
  type ContractsScope,
} from '@/shared/api/contractsApi';
import { CONTRACT_ROLES } from '@/shared/lib/contracts';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ErrorState,
  IconButton,
  Input,
  Loader,
  PageHeader,
  Select,
  Table,
  Tabs,
  type Column,
} from '@/shared/ui';
import { ContractViewModal } from './ContractViewModal';
import { TemplateEditorModal } from './TemplateEditorModal';
import { ContractActions } from './ContractActions';

type Tab = 'contracts' | 'templates';

/**
 * Раздел «Договоры»: готовые договоры сотрудников (создаются автоматически при добавлении)
 * и шаблоны, которые можно редактировать. Директор правит шаблоны администратора и ментора,
 * суперадмин — все, включая договор директора.
 */
export function ContractsWorkspace({ scope }: { scope: ContractsScope }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('contracts');
  return (
    <>
      <PageHeader
        title={t('pages.common.contracts')}
        description={t(scope === 'superAdmin' ? 'contracts.descSuper' : 'contracts.descDirector')}
      />
      <Tabs<Tab>
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'contracts', label: t('contracts.signed') },
          { value: 'templates', label: t('contracts.templates') },
        ]}
      />
      {tab === 'contracts' ? <ContractsList scope={scope} /> : <TemplatesList scope={scope} />}
    </>
  );
}

function ContractsList({ scope }: { scope: ContractsScope }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [open, setOpen] = useState<Contract | null>(null);
  const { data, isLoading, isError, refetch } = useContracts(scope, { search, role });
  const roles =
    scope === 'superAdmin' ? CONTRACT_ROLES : CONTRACT_ROLES.filter((r) => r !== 'director');

  const columns: Column<Contract>[] = [
    {
      key: 'who',
      header: t('contracts.employee'),
      cell: (c) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={c.userName} size={30} />
          <div className="min-w-0">
            <p className="truncate font-medium">{c.userName}</p>
            <p className="text-xs text-muted">
              {t(`roles.${c.role}`)}
              {scope === 'superAdmin' && c.branchName ? ` · ${c.branchName}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: t('contracts.date'),
      hideOnMobile: true,
      className: 'whitespace-nowrap text-muted',
      cell: (c) => formatDate(c.createdAt),
    },
    {
      key: 'act',
      header: '',
      className: 'w-0',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <IconButton label={t('contracts.open')} onClick={() => setOpen(c)}>
            <FiEye />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <Card className="p-5">
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px] lg:w-[620px]">
        <Input
          aria-label={t('common.search')}
          placeholder={t('contracts.search')}
          leftIcon={<FiSearch />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          aria-label={t('contracts.role')}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder={t('contracts.allRoles')}
          options={roles.map((r) => ({ value: r, label: t(`roles.${r}`) }))}
        />
      </div>
      {isLoading ? (
        <Loader />
      ) : isError || !data ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <Table
          columns={columns}
          rows={data}
          rowKey={(c) => c.id}
          onRowClick={setOpen}
          emptyTitle={t('contracts.empty')}
        />
      )}
      {open && <ContractViewModal contract={open} onClose={() => setOpen(null)} />}
    </Card>
  );
}

function TemplatesList({ scope }: { scope: ContractsScope }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useContractTemplates(scope);
  const save = useSaveTemplate(scope);
  const [edit, setEdit] = useState<ContractTemplate | null>(null);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <>
      <p className="mb-4 rounded-ctl bg-amber-soft px-4 py-3 text-[13px] text-amber">
        {t('contracts.demoNote')}
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((tpl) => (
          <Card key={tpl.id} className="flex min-w-0 flex-col gap-3 p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-ctl bg-brand-soft text-lg text-brand-strong">
                <FiFileText />
              </span>
              <div className="min-w-0">
                <Badge tone="blue">{t(`roles.${tpl.role}`)}</Badge>
                <p className="mt-1.5 font-semibold leading-snug">{tpl.title}</p>
              </div>
            </div>
            <p className="line-clamp-3 text-[13px] text-muted">
              {tpl.body.replace(
                /\{\{(\w+)\}\}/g,
                (_, f: string) => `[${t(`contracts.fields.${f}`, f)}]`,
              )}
            </p>
            <p className="mt-auto text-xs text-muted">
              {t('contracts.updated', { date: formatDateTime(tpl.updatedAt), who: tpl.updatedBy })}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" leftIcon={<FiEdit2 />} onClick={() => setEdit(tpl)}>
                {t('common.edit')}
              </Button>
              <ContractActions
                title={tpl.title}
                body={tpl.body}
                fileName={tpl.title}
                className="contents"
              />
            </div>
          </Card>
        ))}
      </div>
      {edit && (
        <TemplateEditorModal
          template={edit}
          onClose={() => setEdit(null)}
          onSave={(b) => save.mutateAsync({ id: edit.id, ...b })}
        />
      )}
    </>
  );
}
