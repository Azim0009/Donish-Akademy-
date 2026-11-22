import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/core/config/paths';
import { ErrorState, Loader, PageHeader, ProgressRing } from '@/shared/ui';
import { useModules, useTrack } from '../hooks/useLearning';
import { LearningPath } from '../components/LearningPath';

/**
 * Страница направления: Road Map модулей.
 * Модуль N+1 закрыт, пока не пройден N. Флаг isLocked приходит с backend — фронт только показывает.
 */
export default function TrackDetailPage() {
  const { t } = useTranslation();
  const { trackId = '' } = useParams();
  const track = useTrack(trackId);
  const modules = useModules(trackId);

  if (track.isLoading || modules.isLoading) return <Loader />;
  if (track.isError || !track.data) return <ErrorState onRetry={() => track.refetch()} />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: PATHS.student.tracks, label: t('pages.student.tracks') }}
        title={track.data.title}
        description={track.data.description}
        actions={track.data.progress && <ProgressRing value={track.data.progress.percent} size={64} />}
      />
      {modules.data && <LearningPath modules={modules.data} />}
    </div>
  );
}
