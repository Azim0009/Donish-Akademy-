import { useTranslation } from 'react-i18next';
import { FiFilm } from 'react-icons/fi';
import { RecordingPlayer } from '@/shared/components/LiveSessionCard';
import { toEmbedUrl } from '@/shared/lib/liveSession';
import { EmptyState } from '@/shared/ui';

/** Видеоурок, который добавил директор в конструкторе курса */
export function VideoStep({ url, title }: { url: string; title: string }) {
  const { t } = useTranslation();
  const embed = toEmbedUrl(url);
  if (!embed)
    return (
      <EmptyState
        icon={<FiFilm />}
        title={t('lesson.noVideo')}
        description={t('lesson.noVideoHint')}
      />
    );
  return (
    <div className="flex flex-col gap-3">
      <RecordingPlayer embedUrl={embed} title={title} />
      <p className="text-[13px] text-muted">{t('lesson.videoHint')}</p>
    </div>
  );
}
