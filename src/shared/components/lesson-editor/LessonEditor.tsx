import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { Lesson, QuizQuestion } from '@/core/types/models';
import { Button, Card, IconButton, Input, PageHeader, Tabs, Textarea } from '@/shared/ui';
import { CodeEditorPanel } from '@/shared/editor/CodeEditorPanel';
import { toEmbedUrl } from '@/shared/lib/liveSession';

type Tab = 'theory' | 'video' | 'example' | 'practice' | 'quiz';

/**
 * Конструктор урока: теория, видео, пример, задание, тест.
 * Общий для директора и партнёра-преподавателя — сохранение передаёт страница.
 */
export function LessonEditor({
  initial,
  back,
  onSave,
  saving,
}: {
  initial: Lesson;
  back: { to: string; label: string };
  onSave: (lesson: Lesson) => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('theory');
  const [lesson, setLesson] = useState<Lesson>(initial);

  useEffect(() => {
    setLesson(initial);
  }, [initial]);

  const patch = (p: Partial<Lesson>) => setLesson({ ...lesson, ...p });
  const patchQ = (i: number, p: Partial<QuizQuestion>) =>
    patch({ quiz: lesson.quiz.map((q, qi) => (qi === i ? { ...q, ...p } : q)) });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        back={back}
        title={lesson.title}
        actions={
          <Button loading={saving} onClick={() => onSave(lesson)}>
            {t('lessonsDirector.publish')}
          </Button>
        }
      />

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        className="mb-5"
        tabs={[
          { value: 'theory', label: t('lesson.steps.theory') },
          { value: 'video', label: t('lesson.steps.video') },
          { value: 'example', label: t('lesson.steps.example') },
          { value: 'practice', label: t('lesson.steps.practice') },
          { value: 'quiz', label: t('lesson.steps.quiz'), count: lesson.quiz.length },
        ]}
      />

      {tab === 'theory' && (
        <Card className="flex flex-col gap-4 p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <Input
              label={t('lessonsDirector.title')}
              value={lesson.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
            <Input
              label={t('lessonsDirector.duration')}
              type="number"
              value={lesson.durationMinutes}
              onChange={(e) => patch({ durationMinutes: Number(e.target.value) })}
            />
          </div>
          <Textarea
            label={t('lessonsDirector.theory')}
            hint={t('lessonsDirector.markdownHint')}
            value={lesson.theoryContent}
            onChange={(e) => patch({ theoryContent: e.target.value })}
            className="[&_textarea]:min-h-[320px] [&_textarea]:font-mono [&_textarea]:text-[13px]"
          />
        </Card>
      )}

      {tab === 'video' && (
        <Card className="flex flex-col gap-4 p-6">
          <Input
            label={t('lessonsDirector.videoUrl')}
            hint={t('lessonsDirector.videoHint')}
            value={lesson.videoUrl}
            onChange={(e) => patch({ videoUrl: e.target.value })}
          />
          {toEmbedUrl(lesson.videoUrl) && (
            <div className="aspect-video max-w-2xl overflow-hidden rounded-card bg-ink">
              <iframe
                src={toEmbedUrl(lesson.videoUrl) ?? undefined}
                title={lesson.title}
                className="h-full w-full"
                allowFullScreen
              />
            </div>
          )}
        </Card>
      )}

      {tab === 'example' && (
        <CodeEditorPanel
          initialCode={lesson.exampleCode}
          onChange={(c) => patch({ exampleCode: c })}
          height={380}
        />
      )}

      {tab === 'practice' && (
        <div className="flex flex-col gap-5">
          <Card className="grid gap-4 p-6">
            <Input
              label={t('lessonsDirector.exerciseTitle')}
              value={lesson.exercise.title}
              onChange={(e) => patch({ exercise: { ...lesson.exercise, title: e.target.value } })}
            />
            <Textarea
              label={t('lessonsDirector.exerciseText')}
              value={lesson.exercise.description}
              onChange={(e) =>
                patch({ exercise: { ...lesson.exercise, description: e.target.value } })
              }
            />
            <Textarea
              label={t('lesson.criteria')}
              hint={t('lessonsDirector.criteriaHint')}
              value={lesson.exercise.criteria.join('\n')}
              onChange={(e) =>
                patch({ exercise: { ...lesson.exercise, criteria: e.target.value.split('\n') } })
              }
            />
          </Card>
          <h3 className="text-[15px] font-semibold">{t('lessonsDirector.starterCode')}</h3>
          <CodeEditorPanel
            initialCode={lesson.exercise.starterCode}
            onChange={(c) => patch({ exercise: { ...lesson.exercise, starterCode: c } })}
            height={260}
          />
        </div>
      )}

      {tab === 'quiz' && (
        <div className="flex flex-col gap-4">
          {lesson.quiz.map((q, qi) => (
            <Card key={q.id} className="flex flex-col gap-4 p-6">
              <div className="flex items-start gap-3">
                <span className="h-display mt-8 w-6 text-brand-strong">{qi + 1}</span>
                <Input
                  label={t('lessonsDirector.question')}
                  value={q.question}
                  onChange={(e) => patchQ(qi, { question: e.target.value })}
                  className="flex-1"
                />
                <IconButton
                  label={t('common.delete')}
                  className="mt-6"
                  onClick={() => patch({ quiz: lesson.quiz.filter((_, i) => i !== qi) })}
                >
                  <FiTrash2 />
                </IconButton>
              </div>
              <fieldset className="grid gap-2 pl-9 sm:grid-cols-2">
                <legend className="mb-2 text-[13px] text-muted">
                  {t('lessonsDirector.correctHint')}
                </legend>
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctAnswerIndex === oi}
                      onChange={() => patchQ(qi, { correctAnswerIndex: oi })}
                      className="h-4 w-4 accent-[rgb(var(--c-brand))]"
                      aria-label={t('lessonsDirector.markCorrect')}
                    />
                    <Input
                      aria-label={t('lessonsDirector.option', { n: oi + 1 })}
                      value={opt}
                      onChange={(e) =>
                        patchQ(qi, {
                          options: q.options.map((o, i) => (i === oi ? e.target.value : o)),
                        })
                      }
                      className="flex-1"
                    />
                  </label>
                ))}
              </fieldset>
            </Card>
          ))}
          <Button
            variant="secondary"
            leftIcon={<FiPlus />}
            className="self-start"
            onClick={() =>
              patch({
                quiz: [
                  ...lesson.quiz,
                  {
                    id: `q_${Date.now()}`,
                    type: 'single_choice',
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswerIndex: 0,
                  },
                ],
              })
            }
          >
            {t('lessonsDirector.addQuestion')}
          </Button>
        </div>
      )}
    </div>
  );
}
