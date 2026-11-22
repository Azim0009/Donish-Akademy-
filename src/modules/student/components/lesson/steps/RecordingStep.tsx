import { useTranslation } from 'react-i18next';
import { FiFilm } from 'react-icons/fi';
import { EmptyState } from '@/shared/ui';
import { RecordingPlayer } from '@/shared/components/LiveSessionCard';
import { toEmbedUrl } from '@/shared/lib/liveSession';

/** Шаг 2: запись урока — можно пересмотреть в любое время */
export function RecordingStep({ url, title }: { url: string; title: string }) {
  const { t } = useTranslation();
  const embed = toEmbedUrl(url);
  if (!embed) return <EmptyState icon={<FiFilm />} title={t('live.noRecording')} description={t('live.noRecordingHint')} />;
  return (
    <div className="flex flex-col gap-3">
      <RecordingPlayer embedUrl={embed} title={title} />
      <p className="text-[13px] text-muted">{t('live.recordingHint')}</p>
    </div>
  );
}
