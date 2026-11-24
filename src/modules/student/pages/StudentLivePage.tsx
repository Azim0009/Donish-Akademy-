import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiMapPin, FiPlayCircle } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { formatDate } from '@/core/utils/format';
import { Badge, Card, EmptyState, ErrorState, Loader, PageHeader, Section } from '@/shared/ui';
import { JoinButton, LiveSessionCard } from '@/shared/components/LiveSessionCard';
import { useNow } from '@/shared/hooks/useNow';
import { nextSession, sessionState, sessionTone, timeRange } from '@/shared/lib/liveSession';
import { useMyGroup, useMyLiveSessions } from '../hooks/useLearning';

/** Онлайн-уроки ученика: ближайший урок, расписание и записи прошедших уроков */
export default function StudentLivePage() {
  const { t } = useTranslation();
  const now = useNow();
  const { data, isLoading, isError, refetch } = useMyLiveSessions();
  const group = useMyGroup().data;
  const offline = group?.format === 'offline';

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const next = nextSession(data, now);
  const upcoming = data.filter((s) => s.id !== next?.id && sessionState(s, now) !== 'ended');
  const past = data.filter((s) => sessionState(s, now) === 'ended').reverse();
  const lessonLink = (lessonId: string, step?: string) => generatePath(PATHS.student.lesson, { lessonId }) + (step ? `?step=${step}` : '');

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={t('pages.student.live')} description={t('live.studentDescription')} />

      {offline && (
        <Card className="flex flex-col gap-3 border-brand/30 bg-brand-soft/40 p-5 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg text-brand-strong">
            <FiMapPin />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{t('live.offlineTitle', { group: group.name })}</p>
            <p className="text-sm text-muted">{[group.room, group.schedule].filter(Boolean).join(' · ')}</p>
            <p className="mt-1 text-[13px] text-muted">{t('live.offlineHint')}</p>
          </div>
        </Card>
      )}

      {next ? <LiveSessionCard session={next} /> : offline ? null : <Section><EmptyState icon={<FiCalendar />} title={t('live.noUpcoming')} description={t('live.noUpcomingHint')} /></Section>}

      {upcoming.length > 0 && (
        <Section title={t('live.schedule')} bodyClassName="px-0 pb-2">
          <ul className="divide-y divide-line">
            {upcoming.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] text-muted">
                    {formatDate(s.startsAt, { weekday: 'short', day: 'numeric', month: 'short' })} · {timeRange(s)}
                  </p>
                  <Link to={lessonLink(s.lessonId)} className="font-medium hover:text-brand-strong">
                    {t('live.lessonN', { n: s.lessonOrder })}. {s.lessonTitle}
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={sessionTone[sessionState(s, now)]}>{t(`live.state.${sessionState(s, now)}`)}</Badge>
                  <JoinButton session={s} now={now} />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {!(offline && past.length === 0) && (
      <Section title={t('live.recordings')} description={t('live.recordingsDescription')} bodyClassName="px-0 pb-2">
        {past.length === 0 ? (
          <EmptyState icon={<FiPlayCircle />} title={t('live.noRecordingsYet')} />
        ) : (
          <ul className="divide-y divide-line">
            {past.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] text-muted">{formatDate(s.startsAt, { day: 'numeric', month: 'long' })}</p>
                  <p className="font-medium">{t('live.lessonN', { n: s.lessonOrder })}. {s.lessonTitle}</p>
                </div>
                {s.recordingUrl ? (
                  <Link to={lessonLink(s.lessonId, 'recording')} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-strong hover:underline">
                    <FiPlayCircle /> {t('live.watchRecording')}
                  </Link>
                ) : (
                  <Badge tone="amber">{t('live.recordingSoon')}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
      )}
    </div>
  );
}
