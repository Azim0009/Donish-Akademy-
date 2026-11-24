import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiExternalLink, FiPlus, FiUserCheck } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { formatTjs } from '@/shared/lib/partners';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loader,
  PageHeader,
  Switch,
  Table,
  toast,
  type Column,
} from '@/shared/ui';
import { usePartners, useUpdatePartner, type PartnerRow } from '../api/superAdminApi';
import { CreatePartnerModal } from '../components/CreatePartnerModal';

/** Преподаватели-партнёры сети: свои курсы, своя ссылка, доля с оплат */
export default function PartnersPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = usePartners();
  const update = useUpdatePartner();
  const [open, setOpen] = useState(false);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const columns: Column<PartnerRow>[] = [
    {
      key: 'name',
      header: t('superAdmin.partners.partner'),
      cell: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size={34} />
          <div className="min-w-0">
            <p className="truncate font-medium">{p.name}</p>
            <p className="truncate text-xs text-muted">{p.specialty}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'link',
      header: t('superAdmin.partners.link'),
      hideOnMobile: true,
      cell: (p) => (
        <a
          href={PATHS.partnerPage.replace(':code', p.code)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-brand-strong hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          /p/{p.code} <FiExternalLink aria-hidden />
        </a>
      ),
    },
    {
      key: 'courses',
      header: t('superAdmin.partners.courses'),
      className: 'text-right',
      cell: (p) => p.coursesCount,
    },
    {
      key: 'students',
      header: t('superAdmin.partners.students'),
      className: 'text-right',
      cell: (p) => p.studentsCount,
    },
    {
      key: 'income',
      header: t('superAdmin.partners.income'),
      hideOnMobile: true,
      className: 'text-right',
      cell: (p) => (
        <span>
          {formatTjs(p.monthlyIncome)} <Badge tone="gray">{p.sharePercent}%</Badge>
        </span>
      ),
    },
    {
      key: 'active',
      header: t('superAdmin.partners.active'),
      cell: (p) => (
        <Switch
          checked={p.isActive}
          label={p.isActive ? t('superAdmin.partners.on') : t('superAdmin.partners.off')}
          onChange={(v) =>
            update.mutate(
              { id: p.id, isActive: v },
              {
                onSuccess: () =>
                  toast(
                    t(v ? 'superAdmin.partners.enabled' : 'superAdmin.partners.disabled', {
                      name: p.name,
                    }),
                    'success',
                  ),
              },
            )
          }
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('pages.superAdmin.partners')}
        description={t('superAdmin.partners.description')}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => setOpen(true)}>
            {t('superAdmin.partners.create')}
          </Button>
        }
      />
      {data.length === 0 ? (
        <Card>
          <EmptyState icon={<FiUserCheck />} title={t('superAdmin.partners.empty')} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-5">
            <Table columns={columns} rows={data} rowKey={(p) => p.id} />
          </div>
        </Card>
      )}
      {open && <CreatePartnerModal onClose={() => setOpen(false)} />}
    </>
  );
}
