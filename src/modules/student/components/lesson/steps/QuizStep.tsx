import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiCheck, FiX } from 'react-icons/fi';
import type { QuizQuestion } from '@/core/types/models';
import { Button } from '@/shared/ui';

/** Мини-тест 3–5 вопросов. Сейчас одиночный выбор. TODO: множественный выбор и короткий ответ. */
export function QuizStep({ questions, onPassed }: { questions: QuizQuestion[]; onPassed: (score: number) => void }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);

  // В моках проверяем на фронте; в реальности ответы отправляются на backend
  const score = questions.filter((q) => answers[q.id] === q.correctAnswerIndex).length;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const passed = score / questions.length >= 0.6;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {questions.map((q, qi) => (
        <fieldset key={q.id}>
          <legend className="mb-3 font-medium">
            <span className="mr-2 text-muted">{qi + 1}.</span>
            {q.question}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i;
              const correct = checked && i === q.correctAnswerIndex;
              const wrong = checked && selected && i !== q.correctAnswerIndex;
              return (
                <label
                  key={opt}
                  className={clsx(
                    'flex cursor-pointer items-center gap-3 rounded-ctl border px-4 py-3 text-sm transition-colors',
                    correct ? 'border-brand bg-brand-soft' : wrong ? 'border-danger bg-danger-soft' : selected ? 'border-brand' : 'border-line hover:bg-sunken',
                    checked && 'cursor-default',
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    disabled={checked}
                    checked={selected}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    className="h-4 w-4 accent-[rgb(var(--c-brand))]"
                  />
                  <code className="flex-1">{opt}</code>
                  {correct && <FiCheck className="text-brand-strong" />}
                  {wrong && <FiX className="text-danger" />}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {!checked ? (
        <Button className="self-start" disabled={!allAnswered} onClick={() => { setChecked(true); if (score / questions.length >= 0.6) onPassed(score); }}>
          {t('lesson.checkQuiz')}
        </Button>
      ) : (
        <div className={clsx('flex flex-wrap items-center gap-4 rounded-card p-4', passed ? 'bg-brand-soft' : 'bg-amber-soft')}>
          <p className="h-display text-lg">{t('lesson.quizResult', { score, total: questions.length })}</p>
          <p className="text-sm">{passed ? t('lesson.quizPassed') : t('lesson.quizFailed')}</p>
          {!passed && (
            <Button variant="secondary" size="sm" onClick={() => { setChecked(false); setAnswers({}); }}>
              {t('lesson.tryAgain')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
