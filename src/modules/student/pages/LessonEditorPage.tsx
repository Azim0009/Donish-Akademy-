import { useState } from 'react';
import { generatePath, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiSend } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import type { CodeFiles } from '@/core/types/models';
import { Badge, Button, Card, ErrorState, Loader, PageHeader, toast } from '@/shared/ui';
import { CodeEditorPanel } from '@/shared/editor/CodeEditorPanel';
import { useLesson, useSubmitExercise } from '../hooks/useLearning';

/** Практика: условие + Monaco + live preview + отправка решения ментору */
export default function LessonEditorPage() {
  const { t } = useTranslation();
  const { lessonId = '' } = useParams();
  const { data: lesson, isLoading, isError, refetch } = useLesson(lessonId);
  const submit = useSubmitExercise(lesson?.exercise.id ?? '');
  const [code, setCode] = useState<CodeFiles | null>(null);

  if (isLoading) return <Loader />;
  if (isError || !lesson) return <ErrorState onRetry={refetch} />;

  const send = () =>
    submit.mutate(code ?? lesson.exercise.starterCode, {
      onSuccess: () => toast(t('editor.submitted')),
    });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        back={{ to: generatePath(PATHS.student.lesson, { lessonId }), label: lesson.title }}
        title={lesson.exercise.title}
        meta={submit.data && <Badge tone="amber" dot>{t('editor.onReview')}</Badge>}
        actions={
          <Button onClick={send} loading={submit.isPending} leftIcon={<FiSend />}>
            {t('editor.submit')}
          </Button>
        }
      />
      <Card className="flex flex-col gap-3 p-5 lg:flex-row lg:items-start lg:gap-8">
        <p className="max-w-[60ch] flex-1">{lesson.exercise.description}</p>
        <ul className="flex flex-col gap-1.5 lg:w-[360px]">
          {lesson.exercise.criteria.map((c) => (
            <li key={c} className="flex gap-2 text-sm text-muted">
              <FiCheckCircle className="mt-0.5 shrink-0 text-brand" /> {c}
            </li>
          ))}
        </ul>
      </Card>
      <CodeEditorPanel initialCode={lesson.exercise.starterCode} onChange={setCode} height={480} />
    </div>
  );
}
