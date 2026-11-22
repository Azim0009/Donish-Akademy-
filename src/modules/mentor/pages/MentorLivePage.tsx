import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiEdit2, FiFilm, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { LiveSession } from '@/core/types/models';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { formatDate } from '@/core/utils/format';
import { Badge, Button, EmptyState, ErrorState, IconButton, Loader, PageHeader, Section, Tabs, toast } from '@/shared/ui';
import { JoinButton, LiveSessionCard } from '@/shared/components/LiveSessionCard';
import { useNow } from '@/shared/hooks/useNow';
import { nextSession, PROVIDER_LABEL, sessionState, sessionTone, timeRange } from '@/shared/lib/liveSession';
import { useDeleteLiveSession, useMentorGroups, useMentorLiveSessions } from '../api/mentorApi';
import { LiveSessionModal, type LiveModalMode } from '../components/LiveSessionModal';

/**
 * Онлайн-уроки ментора: расписание звонков по группам, кнопка «Начать урок»,
 * после урока — добавить запись, чтобы ученики могли пересмотреть.
 */
export default function MentorLivePage() {
  const { t } = useTranslation();
  const now = useNow();
  const sessions = useMentorLiveSessions();
  const groups = useMentorGroups();
  const remove = useDeleteLiveSession();
  const [modal, setModal] = useState<LiveModalMode | null>(null);
  const [groupFilter, setGroupFilter] = useState('all');

  if (sessions.isLoading || groups.isLoading) return <Loader />;
  if (sessions.isError || !sessions.data) return <ErrorState onRetry={() => sessions.refetch()} />;

  const list = sessions.data.filter((s) => groupFilter === 'all' || s.groupId === groupFilter);
  const next = nextSession(list, now);
  const upcoming = list.filter((s) => s.id !== next?.id && sessionState(s, now) !== 'ended');
  const past = list.filter((s) => sessionState(s, now) === 'ended').reverse();
  const noRecording = past.filter((s) => !s.recordingUrl).length;

  const onDelete = (s: LiveSession) => {
    if (!window.confirm(t('live.deleteConfirm', { title: s.lessonTitle, group: s.groupName }))) return;
    remove.mutate(s.id, { onSuccess: () => toast(t('live.deleted'), 'success'), onError: (e) => toast(getApiErrorMessage(e)) });
  };

  const rowActions = (s: LiveSession) => (
    <div className="flex items-center gap-1">
      <IconButton label={t('common.edit')} onClick={() => setModal({ kind: 'edit', session: s })}><FiEdit2 /></IconButton>
      <IconButton label={t('common.delete')} onClick={() => onDelete(s)} className="hover:text-danger"><FiTrash2 /></IconButton>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title={t('pages.mentor.live')}
        description={t('live.mentorDescription')}
        actions={<Button leftIcon={<FiPlus />} onClick={() => setModal({ kind: 'create' })}>{t('live.create')}</Button>}
      />

      {(groups.data?.length ?? 0) > 1 && (
        <Tabs
          value={groupFilter}
          onChange={setGroupFilter}
          tabs={[{ value: 'all', label: t('common.all') }, ...(groups.data ?? []).map((g) => ({ value: g.id, label: g.name }))]}
        />
      )}

      {next ? (
        <LiveSessionCard
          session={next}
          actions={
            <>
              <JoinButton session={next} now={now} size="lg" />
              <Button size="lg" variant="secondary" leftIcon={<FiEdit2 />} onClick={() => setModal({ kind: 'edit', session: next })}>{t('common.edit')}</Button>
            </>
          }
        />
      ) : (
        <Section><EmptyState icon={<FiCalendar />} title={t('live.noUpcoming')} description={t('live.mentorEmptyHint')} /></Section>
      )}

      {upcoming.length > 0 && (
        <Section title={t('live.schedule')} bodyClassName="px-0 pb-2">
          <ul className="divide-y divide-line">
            {upcoming.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] text-muted">
                    {formatDate(s.startsAt, { weekday: 'short', day: 'numeric', month: 'short' })} · {timeRange(s)} · {s.groupName} · {PROVIDER_LABEL[s.provider]}
                  </p>
                  <p className="font-medium">{t('live.lessonN', { n: s.lessonOrder })}. {s.lessonTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={sessionTone[sessionState(s, now)]}>{t(`live.state.${sessionState(s, now)}`)}</Badge>
                  {rowActions(s)}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        title={t('live.pastLessons')}
        description={noRecording ? t('live.needRecordings', { count: noRecording }) : t('live.allRecorded')}
        bodyClassName="px-0 pb-2"
      >
        {past.length === 0 ? (
          <EmptyState icon={<FiFilm />} title={t('live.noPast')} />
        ) : (
          <ul className="divide-y divide-line">
            {past.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] text-muted">{formatDate(s.startsAt, { day: 'numeric', month: 'long' })} · {s.groupName}</p>
                  <p className="font-medium">{t('live.lessonN', { n: s.lessonOrder })}. {s.lessonTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.recordingUrl ? (
                    <>
                      <Badge tone="green">{t('live.recorded')}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => setModal({ kind: 'recording', session: s })}>{t('live.changeRecording')}</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="soft" leftIcon={<FiFilm />} onClick={() => setModal({ kind: 'recording', session: s })}>{t('live.addRecording')}</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {modal && <LiveSessionModal mode={modal} groups={groups.data ?? []} onClose={() => setModal(null)} />}
    </div>
  );
}
