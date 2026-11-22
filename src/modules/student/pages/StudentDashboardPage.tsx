import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowRight, FiAward, FiBookOpen, FiTrendingUp } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { MAIN_TRACK } from '@/core/config/course';
import { LiveSessionCard } from '@/shared/components/LiveSessionCard';
import { useNow } from '@/shared/hooks/useNow';
import { nextSession } from '@/shared/lib/liveSession';
import { useAuthStore } from '@/core/auth/authStore';
import { Button, Card, ErrorState, Loader, Section, StatCard } from '@/shared/ui';
import { useModules, useMyLiveSessions, useProgress } from '../hooks/useLearning';
import { LearningPath } from '../components/LearningPath';
import { LevelCard } from '../components/LevelCard';

export default function StudentDashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const progress = useProgress();
  const modules = useModules(MAIN_TRACK.id);
  const live = useMyLiveSessions();
  const now = useNow();

  if (progress.isLoading || modules.isLoading) return <Loader />;
  if (progress.isError || !progress.data) return <ErrorState onRetry={() => progress.refetch()} />;

  const p = progress.data;
  const percent = Math.round((p.completedLessons / p.totalLessons) * 100);
  const firstName = user?.name.split(' ')[0] ?? '';
  const next = live.data ? nextSession(live.data, now) : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="h-display text-[26px]">{t('student.greeting', { name: firstName })}</h1>

      {/* Ближайший онлайн-урок с ментором */}
      {next && (
        <section aria-label={t('live.nextLesson')} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">{t('live.nextLesson')}</h2>
            <Link to={PATHS.student.live} className="text-sm font-medium text-brand-strong hover:underline">{t('live.allSchedule')}</Link>
          </div>
          <LiveSessionCard session={next} />
        </section>
      )}

      {/* Продолжить обучение — главный блок */}
      {p.currentLesson && (
        <Card className="relative overflow-hidden !border-0 !bg-brand p-6 text-brand-ink sm:p-8">
          <span aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full border-[28px] border-white/10" />
          <p className="text-sm opacity-80">{t('student.continueLabel', { module: p.currentLesson.moduleTitle })}</p>
          <p className="h-display mt-1 text-[28px] leading-tight sm:text-[34px]">{p.currentLesson.title}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link to={generatePath(PATHS.student.lesson, { lessonId: p.currentLesson.id })}>
              <Button size="lg" className="bg-white !text-brand-strong hover:bg-white/90" rightIcon={<FiArrowRight />} tabIndex={-1}>
                {t('student.continue')}
              </Button>
            </Link>
            <span className="text-sm opacity-80">{t('student.trackProgress', { percent })}</span>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LevelCard progress={p} />
        <StatCard label={t('student.lessonsDone')} value={`${p.completedLessons}/${p.totalLessons}`} icon={<FiBookOpen />} />
        <StatCard label={t('student.streak')} value={t('common.days', { count: p.streakDays })} icon={<FiTrendingUp />} tone="amber" />
        <StatCard label={t('student.quizAverage')} value={`${p.quizAverage}%`} icon={<FiAward />} tone="info" />
      </div>

      <Section
        title={t('student.roadmap')}
        description={MAIN_TRACK.title}
        action={
          <Link to={generatePath(PATHS.student.track, { trackId: MAIN_TRACK.id })} className="text-sm font-medium text-brand-strong hover:underline">
            {t('common.openAll')}
          </Link>
        }
      >
        {modules.data && <LearningPath modules={modules.data} />}
      </Section>
    </div>
  );
}
