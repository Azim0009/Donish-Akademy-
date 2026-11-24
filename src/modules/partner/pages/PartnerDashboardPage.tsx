import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiDollarSign, FiInbox, FiMousePointer, FiUsers } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { formatDate } from '@/core/utils/format';
import { KpiCard } from '@/shared/components/dashboard/KpiCard';
import { formatTjs, partnerStudentTone } from '@/shared/lib/partners';
import { Avatar, Badge, EmptyState, ErrorState, Loader, PageHeader, Section } from '@/shared/ui';
import { usePartnerDashboard } from '../api/partnerApi';
import { PartnerLinkCard } from '../components/PartnerLinkCard';

/** Главная партнёра: своя ссылка, переходы, заявки, ученики и доход */
export default function PartnerDashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = usePartnerDashboard();
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const p = data.partner;
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('partner.hello', { name: p.name.split(' ')[0] })}
        description={t('partner.dashboardHint', { specialty: p.specialty, share: p.sharePercent })}
      />
      <PartnerLinkCard code={p.code} name={p.name} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<FiMousePointer />} label={t('partner.clicks')} value={data.clicks} />
        <KpiCard icon={<FiInbox />} label={t('partner.applications')} value={data.applications} />
        <KpiCard icon={<FiUsers />} label={t('partner.enrolled')} value={data.enrolled} />
        <KpiCard
          icon={<FiDollarSign />}
          label={t('partner.income')}
          value={formatTjs(data.monthlyIncome)}
        />
      </div>
      <Section
        title={t('partner.recent')}
        action={
          <Link
            to={PATHS.partner.students}
            className="text-sm font-medium text-brand-strong hover:underline"
          >
            {t('partner.allStudents')}
          </Link>
        }
        bodyClassName="px-0 pb-2"
      >
        {data.recent.length === 0 ? (
          <EmptyState
            title={t('partner.noApplications')}
            description={t('partner.noApplicationsHint')}
          />
        ) : (
          <ul className="divide-y divide-line">
            {data.recent.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={s.name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="truncate text-xs text-muted">
                    {s.courseTitle} · {formatDate(s.createdAt)}
                  </p>
                </div>
                <Badge tone={partnerStudentTone[s.status]}>{t(`partner.status.${s.status}`)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
