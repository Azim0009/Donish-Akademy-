import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiAward, FiLock } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { MAIN_TRACK } from '@/core/config/course';
import { useAuthStore } from '@/core/auth/authStore';
import { formatDate, formatNumber } from '@/core/utils/format';
import { Avatar, Button, Card, ErrorState, Loader, ProgressBar, Section } from '@/shared/ui';
import { useModules, useProgress } from '../hooks/useLearning';
import { ActivityCalendar } from '../components/ActivityCalendar';
import { LevelCard } from '../components/LevelCard';

// Бейджи — этап V1, сейчас показываем как цели
const badges = ['Frontend', 'React', 'Backend', 'Fullstack + AI'];

export default function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const progress = useProgress();
  const modules = useModules(MAIN_TRACK.id);

  if (progress.isLoading) return <Loader />;
  if (progress.isError || !progress.data || !user) return <ErrorState onRetry={() => progress.refetch()} />;
  const p = progress.data;
  const doneModules = modules.data?.filter((m) => m.status === 'completed').length ?? 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col items-center p-6 text-center">
          <Avatar name={user.name} src={user.avatarUrl} size={88} />
          <h1 className="h-display mt-4 text-xl">{user.name}</h1>
          <p className="text-sm text-muted">{user.email}</p>
          <p className="mt-1 text-xs text-muted">{t('profile.since', { date: formatDate(user.createdAt) })}</p>
          <Link to={PATHS.student.settings} className="mt-4 w-full">
            <Button variant="secondary" className="w-full" tabIndex={-1}>{t('profile.edit')}</Button>
          </Link>
        </Card>
        <LevelCard progress={p} />
        <Card className="p-5">
          <p className="text-sm text-muted">{t('profile.currentTrack')}</p>
          <Link to={generatePath(PATHS.student.track, { trackId: p.trackId })} className="mt-1 block font-semibold hover:text-brand-strong">
            {MAIN_TRACK.title}
          </Link>
          <ProgressBar value={Math.round((p.completedLessons / p.totalLessons) * 100)} className="mt-3" />
          <p className="mt-2 text-xs text-muted">{t('profile.modulesDone', { done: doneModules, total: modules.data?.length ?? 3 })}</p>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            [t('student.lessonsDone'), p.completedLessons],
            [t('student.streak'), t('common.days', { count: p.streakDays })],
            [t('student.quizAverage'), `${p.quizAverage}%`],
            ['XP', formatNumber(p.xpEarned)],
          ].map(([label, value]) => (
            <Card key={String(label)} className="p-4">
              <p className="text-xs text-muted">{label}</p>
              <p className="h-display mt-1 text-xl">{value}</p>
            </Card>
          ))}
        </div>

        <Section title={t('profile.activity')} description={t('profile.activityHint')}>
          <ActivityCalendar days={p.activityCalendar} />
        </Section>

        <Section title={t('profile.badges')} description={t('profile.badgesHint')}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {badges.map((b, i) => {
              const earned = i === 0;
              return (
                <div key={b} className={clsx('flex flex-col items-center gap-2 rounded-card border p-4 text-center', earned ? 'border-amber/40 bg-amber-soft' : 'border-dashed border-line')}>
                  <span className={clsx('flex h-12 w-12 items-center justify-center rounded-full text-xl', earned ? 'bg-amber text-white' : 'bg-sunken text-muted')}>
                    {earned ? <FiAward /> : <FiLock />}
                  </span>
                  <span className={clsx('text-sm font-medium', !earned && 'text-muted')}>{b}</span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}
