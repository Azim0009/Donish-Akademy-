import { generatePath, Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiCheck } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { formatNumber, timeAgo } from '@/core/utils/format';
import { submissionTone } from '@/shared/lib/statusTone';
import { Avatar, Badge, Card, EmptyState, ErrorState, Loader, PageHeader, ProgressBar, Section } from '@/shared/ui';
import { useStudentProgress } from '../api/mentorApi';
import { CURRENCY } from '@/shared/components/Doll';

export default function StudentProgressPage() {
  const { t } = useTranslation();
  const { studentId = '' } = useParams();
  const { data, isLoading, isError, refetch } = useStudentProgress(studentId);
  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const s = data.student;

  return (
    <>
      <PageHeader back={{ to: s.groupId ? generatePath(PATHS.mentor.group, { groupId: s.groupId }) : PATHS.mentor.groups, label: s.groupName ?? t('pages.mentor.groups') }} title={t('pages.mentor.studentProgress')} />
      <Card className="mb-6 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar name={s.name} size={64} />
        <div className="flex-1">
          <h2 className="h-display text-xl">{s.name}</h2>
          <p className="text-sm text-muted">{s.email} · {t('common.lastActive')}: {timeAgo(s.lastActiveAt)}</p>
        </div>
        <div className="grid grid-cols-2 gap-6 text-center">
          <div><p className="h-display text-2xl">{s.progress}%</p><p className="text-xs text-muted">{t('users.progress')}</p></div>
          <div><p className="h-display text-2xl">{formatNumber(s.xp)}</p><p className="text-xs text-muted">{CURRENCY}</p></div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title={t('mentor.modulesProgress')}>
          <ul className="flex flex-col gap-4">
            {data.modules.map((m, i) => {
              const pct = Math.round((m.completedLessons / m.lessonsCount) * 100);
              return (
                <li key={m.id} className="grid grid-cols-[32px_1fr_auto] items-center gap-3">
                  <span className={clsx('flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold', pct === 100 ? 'bg-brand text-brand-ink' : pct > 0 ? 'bg-brand-soft text-brand-strong' : 'bg-sunken text-muted')}>
                    {pct === 100 ? <FiCheck /> : i + 1}
                  </span>
                  <span>
                    <span className="flex justify-between text-sm"><span className="font-medium">{m.title}</span><span className="text-xs text-muted">{m.completedLessons}/{m.lessonsCount}</span></span>
                    <ProgressBar value={pct} size="sm" className="mt-1.5" />
                  </span>
                  <span className="w-16 text-right text-xs">{m.quizScore !== null ? <Badge tone={m.quizScore >= 80 ? 'green' : 'amber'}>{m.quizScore}%</Badge> : <span className="text-muted">—</span>}</span>
                </li>
              );
            })}
          </ul>
        </Section>
        <Section title={t('mentor.submissions')}>
          {data.submissions.length ? (
            <ul className="divide-y divide-line">
              {data.submissions.map((sub) => (
                <li key={sub.id}>
                  <Link to={generatePath(PATHS.mentor.submission, { submissionId: sub.id })} className="flex items-center justify-between gap-3 py-3 hover:text-brand-strong">
                    <span>
                      <span className="block text-sm font-medium">{sub.exerciseTitle}</span>
                      <span className="block text-xs text-muted">{sub.moduleTitle} · {timeAgo(sub.submittedAt)}</span>
                    </span>
                    <Badge tone={submissionTone[sub.status]}>{t(`submission.${sub.status}`)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t('mentor.noSubmissions')} />
          )}
        </Section>
      </div>
    </>
  );
}
