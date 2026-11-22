import { useTranslation } from 'react-i18next';
import { FiBookOpen, FiLayers, FiPlayCircle, FiUsers } from 'react-icons/fi';
import { formatNumber } from '@/core/utils/format';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Loader,
  PageHeader,
  Switch,
  toast,
} from '@/shared/ui';
import { useNetworkTracks, useToggleTrack, type NetworkTrack } from '../api/superAdminApi';

/** Курсы всей сети: где идут, сколько учеников. SuperAdmin может скрыть курс во всех филиалах */
export default function CoursesPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useNetworkTracks();
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  return (
    <>
      <PageHeader title={t('pages.superAdmin.courses')} description={t('courses.description')} />
      {data.length === 0 ? (
        <Card className="p-6">
          <EmptyState title={t('courses.empty')} />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {[...data]
            .sort((a, b) => b.branches.length - a.branches.length)
            .map((tr) => (
              <CourseCard key={tr.id} tr={tr} />
            ))}
        </div>
      )}
    </>
  );
}

function CourseCard({ tr }: { tr: NetworkTrack }) {
  const { t } = useTranslation();
  const toggle = useToggleTrack();
  const total = tr.branches.reduce((s, b) => s + b.students, 0);
  return (
    <Card className="flex min-w-0 flex-col gap-5 p-5 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-card bg-brand-soft text-xl text-brand-strong">
            <FiBookOpen />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{tr.title}</h2>
              {tr.modulesCount === 0 ? (
                <Badge tone="blue">{t('courses.draft')}</Badge>
              ) : (
                <Badge tone={tr.isActive ? 'green' : 'gray'}>
                  {t(tr.isActive ? 'courses.active' : 'courses.hidden')}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted">{tr.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <FiLayers className="text-muted" />
            {t('courses.modules', { count: tr.modulesCount })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FiPlayCircle className="text-muted" />
            {t('courses.lessons', { count: tr.lessonsCount })}
          </span>
          {total > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <FiUsers className="text-muted" />
              {t('dashboard.studentsN', { n: formatNumber(total) })}
            </span>
          )}
        </div>
        {tr.modulesCount > 0 && (
          <div className="max-w-sm">
            <Switch
              checked={tr.isActive}
              onChange={(v) =>
                toggle.mutate(
                  { id: tr.id, isActive: v },
                  {
                    onSuccess: () =>
                      toast(t(v ? 'courses.shown' : 'courses.hiddenToast'), 'success'),
                  },
                )
              }
              label={t('courses.visible')}
              description={t('courses.visibleHint')}
            />
          </div>
        )}
      </div>
      {tr.branches.length === 0 ? (
        <p className="self-center text-sm text-muted lg:w-[340px]">{t('courses.notRunning')}</p>
      ) : (
        <div className="w-full shrink-0 lg:w-[340px]">
          <p className="mb-2 text-[13px] font-medium text-muted">
            {t('courses.inBranches', { count: tr.branches.length })}
          </p>
          <ul className="flex flex-col divide-y divide-line rounded-ctl border border-line">
            {tr.branches.map((b) => (
              <li key={b.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{b.name}</span>
                <span className="tabular-nums text-muted">{formatNumber(b.students)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
