import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import clsx from 'clsx';
import { FiCalendar, FiClock, FiExternalLink, FiUser, FiVideo } from 'react-icons/fi';
import type { LiveSession } from '@/core/types/models';
import { formatDate } from '@/core/utils/format';
import { Badge, Button } from '@/shared/ui';
import { canJoin, PROVIDER_LABEL, sessionState, sessionTone, timeRange } from '@/shared/lib/liveSession';
import { useNow } from '@/shared/hooks/useNow';

/** Через сколько начнётся: «через 10 мин», «через 2 ч», «через 3 дн.» */
function startsIn(s: LiveSession, now: number, t: TFunction) {
  const min = Math.round((new Date(s.startsAt).getTime() - now) / 60_000);
  if (min < 60) return t('live.inMinutes', { count: Math.max(1, min) });
  if (min < 60 * 24) return t('live.inHours', { count: Math.round(min / 60) });
  return t('live.inDays', { count: Math.round(min / 60 / 24) });
}

/** Ссылка на звонок открывается в новой вкладке (Google Meet / Zoom / Telegram) */
export function JoinButton({ session, now, size = 'md', className }: { session: LiveSession; now: number; size?: 'md' | 'lg'; className?: string }) {
  const { t } = useTranslation();
  const open = canJoin(session, now);
  const btn = (
    <Button size={size} disabled={!open} leftIcon={<FiVideo />} rightIcon={open ? <FiExternalLink /> : undefined} className={className} tabIndex={open ? -1 : undefined}>
      {t('live.join')}
    </Button>
  );
  return open ? (
    <a href={session.joinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
      {btn}
    </a>
  ) : (
    btn
  );
}

/** Большая карточка ближайшего онлайн-урока */
export function LiveSessionCard({ session, actions, compact }: { session: LiveSession; actions?: ReactNode; compact?: boolean }) {
  const { t } = useTranslation();
  const now = useNow();
  const state = sessionState(session, now);
  return (
    <div className={clsx('flex flex-col gap-5 rounded-card border p-5 sm:p-6', state === 'live' || state === 'soon' ? 'border-brand/40 bg-brand-soft/50' : 'border-line bg-surface')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={sessionTone[state]} dot={state === 'live'}>{t(`live.state.${state}`)}</Badge>
            {state === 'upcoming' && <span className="text-[13px] text-muted">{startsIn(session, now, t)}</span>}
            <Badge>{PROVIDER_LABEL[session.provider]}</Badge>
          </div>
          <p className="mt-3 text-[13px] text-muted">{t('live.lessonN', { n: session.lessonOrder })} · {session.moduleTitle}</p>
          <h3 className={clsx('h-display mt-0.5 leading-tight', compact ? 'text-lg' : 'text-[22px] sm:text-[26px]')}>{session.lessonTitle}</h3>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">{actions ?? <JoinButton session={session} now={now} size={compact ? 'md' : 'lg'} />}</div>
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <div className="flex items-center gap-1.5"><FiCalendar /> <dt className="sr-only">{t('live.date')}</dt><dd className="text-ink">{formatDate(session.startsAt, { weekday: 'long', day: 'numeric', month: 'long' })}</dd></div>
        <div className="flex items-center gap-1.5"><FiClock /> <dt className="sr-only">{t('live.time')}</dt><dd className="text-ink">{timeRange(session)}</dd></div>
        <div className="flex items-center gap-1.5"><FiUser /> <dt className="sr-only">{t('live.mentor')}</dt><dd>{t('live.mentorName', { name: session.mentorName })} · {session.groupName}</dd></div>
      </dl>
      {!compact && state === 'upcoming' && <p className="text-[13px] text-muted">{t('live.joinHint')}</p>}
    </div>
  );
}

/** Встроенный плеер записи урока */
export function RecordingPlayer({ embedUrl, title }: { embedUrl: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-card bg-ink">
      <iframe src={embedUrl} title={title} className="h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
    </div>
  );
}
