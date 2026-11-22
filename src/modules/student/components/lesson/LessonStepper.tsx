import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiHelpCircle, FiPlayCircle, FiTerminal, FiVideo } from 'react-icons/fi';
import { LESSON_STEPS, type LessonStep } from '@/core/types/models';

const icons = { live: FiVideo, recording: FiPlayCircle, practice: FiTerminal, quiz: FiHelpCircle };

/** 4 шага урока: онлайн-урок → запись → домашнее задание → тест */
export function LessonStepper({ current, onChange, visited }: { current: LessonStep; onChange: (s: LessonStep) => void; visited: Set<LessonStep> }) {
  const { t } = useTranslation();
  const idx = LESSON_STEPS.indexOf(current);
  return (
    <nav aria-label={t('lesson.stepsLabel')} className="grid grid-cols-4 gap-1.5">
      {LESSON_STEPS.map((step, i) => {
        const Icon = icons[step];
        const isCurrent = step === current;
        const passed = i < idx || visited.has(step);
        return (
          <button
            key={step}
            onClick={() => onChange(step)}
            aria-current={isCurrent ? 'step' : undefined}
            className="group flex flex-col gap-2 text-left"
          >
            <span className={clsx('h-1.5 rounded-full transition-colors', isCurrent ? 'bg-brand' : passed ? 'bg-brand/40' : 'bg-line')} />
            <span className={clsx('flex items-center gap-1.5 text-xs font-medium sm:text-[13px]', isCurrent ? 'text-ink' : 'text-muted group-hover:text-ink')}>
              <Icon className="hidden shrink-0 sm:block" />
              <span className="truncate">{t(`lesson.steps.${step}`)}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
