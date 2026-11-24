import { useState } from 'react';
import { generatePath, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiArrowRight, FiCheck, FiClock } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { LESSON_STEPS, type LessonStep } from '@/core/types/models';
import { Badge, Button, Card, ErrorState, Loader, PageHeader, toast } from '@/shared/ui';
import { useCompleteLesson, useLesson } from '../hooks/useLearning';
import { LessonStepper } from '../components/lesson/LessonStepper';
import { LiveStep } from '../components/lesson/steps/LiveStep';
import { RecordingStep } from '../components/lesson/steps/RecordingStep';
import { PracticeStep } from '../components/lesson/steps/PracticeStep';
import { TheoryStep } from '../components/lesson/steps/TheoryStep';
import { VideoStep } from '../components/lesson/steps/VideoStep';
import { ExampleStep } from '../components/lesson/steps/ExampleStep';
import { QuizStep } from '../components/lesson/steps/QuizStep';
import { DollAmount } from '@/shared/components/Doll';

/**
 * Экран урока: теория → видео → пример → онлайн-урок с ментором → запись → домашнее задание → тест.
 * ?step=recording — открыть сразу запись (ссылка из расписания).
 */
export default function LessonPage() {
  const { lessonId = '' } = useParams();
  const [params] = useSearchParams();
  // новый урок или ?step= из ссылки — начинаем с чистого состояния
  return <LessonView key={`${lessonId}:${params.get('step') ?? ''}`} lessonId={lessonId} />;
}

function LessonView({ lessonId }: { lessonId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = (LESSON_STEPS as readonly string[]).includes(params.get('step') ?? '')
    ? (params.get('step') as LessonStep)
    : 'theory';
  const { data: lesson, isLoading, isError, refetch } = useLesson(lessonId);
  const complete = useCompleteLesson();
  const [step, setStep] = useState<LessonStep>(initial);
  const [visited, setVisited] = useState<Set<LessonStep>>(new Set([initial]));
  const [quizPassed, setQuizPassed] = useState(false);
  // TODO: сохранять текущий шаг на backend (прогресс внутри урока)

  if (isLoading) return <Loader />;
  if (isError || !lesson) return <ErrorState onRetry={refetch} />;

  const idx = LESSON_STEPS.indexOf(step);
  const go = (s: LessonStep) => {
    setStep(s);
    setVisited((v) => new Set(v).add(s));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finish = () =>
    complete.mutate(lesson.id, {
      onSuccess: ({ xpEarned }) => {
        toast(t('lesson.completed', { xp: xpEarned }));
        navigate(
          lesson.nextLessonId
            ? generatePath(PATHS.student.lesson, { lessonId: lesson.nextLessonId })
            : PATHS.student.root,
        );
      },
    });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        back={{
          to: generatePath(PATHS.student.track, { trackId: lesson.trackId }),
          label: lesson.moduleTitle,
        }}
        title={lesson.title}
        meta={
          <>
            <Badge>
              <FiClock className="mr-0.5" />{' '}
              {t('common.minutes', { count: lesson.durationMinutes })}
            </Badge>
            <Badge tone="amber">
              <DollAmount value={lesson.xpReward} sign size={13} />
            </Badge>
          </>
        }
      />

      <LessonStepper current={step} onChange={go} visited={visited} />

      <Card className="p-5 sm:p-8">
        {step === 'theory' && <TheoryStep content={lesson.theoryContent} />}
        {step === 'video' && <VideoStep url={lesson.videoUrl} title={lesson.title} />}
        {step === 'example' && <ExampleStep code={lesson.exampleCode} />}
        {step === 'live' && <LiveStep lesson={lesson} onWatchRecording={() => go('recording')} />}
        {step === 'recording' && <RecordingStep url={lesson.recordingUrl} title={lesson.title} />}
        {step === 'practice' && <PracticeStep lesson={lesson} />}
        {step === 'quiz' && (
          <QuizStep questions={lesson.quiz} onPassed={() => setQuizPassed(true)} />
        )}
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          disabled={idx === 0}
          onClick={() => go(LESSON_STEPS[idx - 1])}
          leftIcon={<FiArrowLeft />}
        >
          {t('common.back')}
        </Button>
        {idx < LESSON_STEPS.length - 1 ? (
          <Button onClick={() => go(LESSON_STEPS[idx + 1])} rightIcon={<FiArrowRight />}>
            {t(`lesson.steps.${LESSON_STEPS[idx + 1]}`)}
          </Button>
        ) : (
          <Button
            onClick={finish}
            disabled={!quizPassed}
            loading={complete.isPending}
            leftIcon={<FiCheck />}
          >
            {t('lesson.finish')}
          </Button>
        )}
      </div>
    </div>
  );
}
