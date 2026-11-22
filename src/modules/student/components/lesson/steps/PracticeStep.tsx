import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiCode } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import type { Lesson } from '@/core/types/models';
import { Button } from '@/shared/ui';

/**
 * Практика. В MVP — только type='code'. Остальные типы заложены под направления V1
 * (дизайн, DevOps, PM), чтобы потом не переписывать экран урока.
 */
export function PracticeStep({ lesson }: { lesson: Lesson }) {
  const { t } = useTranslation();
  const ex = lesson.exercise;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div>
        <h2 className="h-display text-xl">{ex.title}</h2>
        <p className="mt-2 max-w-[60ch] text-[16px] leading-7">{ex.description}</p>
        <h3 className="mb-2 mt-6 text-sm font-semibold">{t('lesson.criteria')}</h3>
        <ul className="flex flex-col gap-2">
          {ex.criteria.map((c) => (
            <li key={c} className="flex gap-2.5 text-sm">
              <FiCheckCircle className="mt-0.5 shrink-0 text-brand" /> {c}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col justify-between gap-4 rounded-card bg-brand-soft p-5">
        <div>
          <FiCode className="text-2xl text-brand-strong" />
          <p className="mt-2 text-sm">{ex.type === 'code' ? t('lesson.practiceHint') : t('exercise.notSupportedYet')}</p>
        </div>
        {ex.type === 'code' && (
          <Link to={generatePath(PATHS.student.lessonEditor, { lessonId: lesson.id })}>
            <Button className="w-full" tabIndex={-1}>{t('lesson.openEditor')}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
