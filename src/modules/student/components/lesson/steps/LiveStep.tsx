import { useTranslation } from 'react-i18next';
import { FiCalendar } from 'react-icons/fi';
import type { Lesson } from '@/core/types/models';
import { EmptyState } from '@/shared/ui';
import { LiveSessionCard } from '@/shared/components/LiveSessionCard';
import { useNow } from '@/shared/hooks/useNow';
import { sessionState } from '@/shared/lib/liveSession';

/** Шаг 1: онлайн-урок с ментором по видеосвязи */
export function LiveStep({ lesson, onWatchRecording }: { lesson: Lesson; onWatchRecording: () => void }) {
  const { t } = useTranslation();
  const now = useNow();
  const s = lesson.liveSession;
  if (!s) return <EmptyState icon={<FiCalendar />} title={t('live.notScheduled')} description={t('live.notScheduledHint')} />;
  const ended = sessionState(s, now) === 'ended';
  return (
    <div className="flex flex-col gap-4">
      <LiveSessionCard session={s} actions={ended ? <button onClick={onWatchRecording} className="text-sm font-medium text-brand-strong hover:underline">{t('live.watchRecording')} →</button> : undefined} />
      <ul className="grid gap-2 text-sm text-muted sm:grid-cols-3">
        <li className="rounded-ctl bg-sunken px-3 py-2.5">1. {t('live.tip1')}</li>
        <li className="rounded-ctl bg-sunken px-3 py-2.5">2. {t('live.tip2')}</li>
        <li className="rounded-ctl bg-sunken px-3 py-2.5">3. {t('live.tip3')}</li>
      </ul>
    </div>
  );
}
