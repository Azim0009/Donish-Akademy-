import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiClock, FiLayers } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { Badge, Card, ErrorState, Loader, PageHeader, ProgressBar } from '@/shared/ui';
import { useTracks } from '../hooks/useLearning';

/** Каталог направлений. В MVP активно одно — Fullstack + AI, остальные «скоро» (V1) */
export default function TracksCatalogPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useTracks();

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const [main, ...soon] = [...data.filter((d) => d.isActive), ...data.filter((d) => !d.isActive)];

  return (
    <>
      <PageHeader title={t('pages.student.tracks')} description={t('student.tracksDescription')} />

      {main && (
        <Link to={generatePath(PATHS.student.track, { trackId: main.id })} className="group block">
          <Card className="grid gap-6 p-6 transition-colors group-hover:border-brand/50 sm:p-8 md:grid-cols-[1fr_auto]">
            <div>
              <Badge tone="green" dot>{t('student.yourTrack')}</Badge>
              <h2 className="h-display mt-3 text-[28px]">{main.title}</h2>
              <p className="mt-1 max-w-xl text-muted">{main.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {main.stack.map((s) => (
                  <span key={s} className="rounded-full border border-line px-3 py-1 text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
            <div className="flex min-w-[220px] flex-col justify-end gap-2">
              <div className="flex gap-4 text-sm text-muted">
                <span className="flex items-center gap-1.5"><FiLayers /> {t('student.modulesCount', { count: main.modulesCount })}</span>
                <span className="flex items-center gap-1.5"><FiClock /> {t('student.lessonsCount', { count: main.lessonsCount })}</span>
              </div>
              {main.progress && (
                <>
                  <ProgressBar value={main.progress.percent} />
                  <span className="text-sm font-medium">{t('student.trackProgress', { percent: main.progress.percent })}</span>
                </>
              )}
            </div>
          </Card>
        </Link>
      )}

      <h2 className="mb-3 mt-10 text-[15px] font-semibold">{t('student.soonTracks')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {soon.map((tr) => (
          <Card key={tr.id} className={clsx('flex flex-col gap-3 p-5', !tr.isActive && 'bg-transparent')}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{tr.title}</h3>
              <Badge>{t('student.soon')}</Badge>
            </div>
            <p className="text-sm text-muted">{tr.description}</p>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {tr.stack.map((s) => (
                <span key={s} className="rounded-full bg-sunken px-2.5 py-0.5 text-xs text-muted">{s}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
