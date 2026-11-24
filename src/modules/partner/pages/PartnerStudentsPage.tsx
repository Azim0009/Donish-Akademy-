import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiMessageCircle, FiX } from 'react-icons/fi';
import { formatDate } from '@/core/utils/format';
import type { PartnerStudent, PartnerStudentStatus } from '@/core/types/models';
import { whatsappLink } from '@/shared/lib/credentials';
import { partnerStudentTone } from '@/shared/lib/partners';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loader,
  PageHeader,
  Table,
  Tabs,
  toast,
  type Column,
} from '@/shared/ui';
import { usePartnerStudents, useSetStudentStatus } from '../api/partnerApi';

type Filter = 'all' | PartnerStudentStatus;

/** Ученики и заявки, пришедшие по ссылке партнёра */
export default function PartnerStudentsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = usePartnerStudents();
  const setStatus = useSetStudentStatus();
  const [filter, setFilter] = useState<Filter>('all');
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const count = (f: PartnerStudentStatus) => data.filter((s) => s.status === f).length;
  const rows = filter === 'all' ? data : data.filter((s) => s.status === filter);
  const change = (s: PartnerStudent, status: PartnerStudentStatus) =>
    setStatus.mutate(
      { id: s.id, status },
      { onSuccess: () => toast(t(`partner.statusToast.${status}`, { name: s.name }), 'success') },
    );

  const columns: Column<PartnerStudent>[] = [
    {
      key: 'name',
      header: t('common.fullName'),
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size={32} />
          <div className="min-w-0">
            <p className="truncate font-medium">{s.name}</p>
            <p className="text-xs text-muted">{s.phone}</p>
          </div>
        </div>
      ),
    },
    { key: 'course', header: t('partner.courseCol'), cell: (s) => s.courseTitle },
    {
      key: 'date',
      header: t('partner.dateCol'),
      hideOnMobile: true,
      cell: (s) => formatDate(s.createdAt),
    },
    {
      key: 'status',
      header: t('partner.statusCol'),
      cell: (s) => (
        <Badge tone={partnerStudentTone[s.status]}>{t(`partner.status.${s.status}`)}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (s) => {
        const wa = whatsappLink(
          s.phone,
          t('partner.waText', { name: s.name, course: s.courseTitle }),
        );
        return (
          <div className="flex justify-end gap-1.5">
            {s.status === 'new' && (
              <>
                <Button
                  size="sm"
                  leftIcon={<FiCheck />}
                  onClick={() => change(s, 'enrolled')}
                  disabled={setStatus.isPending}
                >
                  {t('partner.enroll')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t('partner.reject')}
                  onClick={() => change(s, 'rejected')}
                  disabled={setStatus.isPending}
                >
                  <FiX />
                </Button>
              </>
            )}
            {s.status === 'rejected' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => change(s, 'new')}
                disabled={setStatus.isPending}
              >
                {t('partner.restore')}
              </Button>
            )}
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="inline-flex"
              >
                <Button size="sm" variant="ghost" tabIndex={-1}>
                  <FiMessageCircle />
                </Button>
              </a>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader title={t('pages.partner.students')} description={t('partner.studentsHint')} />
      <div className="-mx-1 mb-4 overflow-x-auto px-1">
        <Tabs<Filter>
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: 'all', label: t('common.all'), count: data.length },
            { value: 'new', label: t('partner.status.new'), count: count('new') },
            { value: 'enrolled', label: t('partner.status.enrolled'), count: count('enrolled') },
            { value: 'rejected', label: t('partner.status.rejected'), count: count('rejected') },
          ]}
        />
      </div>
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            title={t('partner.noApplications')}
            description={t('partner.noApplicationsHint')}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table columns={columns} rows={rows} rowKey={(s) => s.id} />
        </Card>
      )}
    </>
  );
}
