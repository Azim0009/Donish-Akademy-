import { useState } from 'react';
import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiCheck, FiChevronDown, FiClock, FiLock, FiPlay } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import type { TrackModule } from '@/core/types/models';
import { Badge, ProgressBar } from '@/shared/ui';

/**
 * Road Map направления — главный визуальный элемент кабинета ученика.
 * Модули идут путём: пройден → текущий → закрыт. Текущий раскрыт со списком уроков.
 */
export function LearningPath({ modules }: { modules: TrackModule[] }) {
  const { t } = useTranslation();
  const current = modules.find((m) => m.status === 'in_progress')?.id ?? null;
  const [openId, setOpenId] = useState<string | null>(current);

  return (
    <ol className="relative flex flex-col">
      {modules.map((m, i) => {
        const done = m.status === 'completed';
        const active = m.status === 'in_progress';
        const open = openId === m.id && !m.isLocked;
        const percent = m.lessonsCount ? Math.round((m.completedLessons / m.lessonsCount) * 100) : 0;
        return (
          <li key={m.id} className="relative flex gap-4 pb-4 last:pb-0 sm:gap-5">
            {/* линия пути */}
            {i < modules.length - 1 && (
              <span className={clsx('absolute left-[21px] top-12 h-[calc(100%-40px)] w-[3px] rounded-full', done ? 'bg-brand' : 'bg-line')} />
            )}
            {/* узел */}
            <span
              className={clsx(
                'relative z-10 mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold',
                done && 'bg-brand text-brand-ink',
                active && 'animate-pulse-ring border-[3px] border-brand bg-surface text-brand-strong',
                m.isLocked && 'border-2 border-dashed border-line bg-canvas text-muted',
              )}
            >
              {done ? <FiCheck className="text-lg" /> : m.isLocked ? <FiLock /> : m.order}
            </span>

            <div
              className={clsx(
                'min-w-0 flex-1 rounded-card border bg-surface transition-colors',
                active ? 'border-brand/50' : 'border-line',
                m.isLocked && 'bg-transparent',
              )}
            >
              <button
                disabled={m.isLocked}
                onClick={() => setOpenId(open ? null : m.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-4 p-4 text-left disabled:cursor-not-allowed sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={clsx('font-display text-[17px] font-semibold', m.isLocked && 'text-muted')}>{m.title}</h3>
                    {done && <Badge tone="green">{t('module.status.completed')}</Badge>}
                    {active && <Badge tone="amber">{t('module.status.in_progress')}</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{m.isLocked ? t('module.lockedHint') : m.description}</p>
                  {!m.isLocked && (
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={percent} size="sm" className="max-w-[220px]" />
                      <span className="text-xs text-muted">
                        {m.completedLessons}/{m.lessonsCount} {t('module.lessons')}
                      </span>
                    </div>
                  )}
                </div>
                {!m.isLocked && <FiChevronDown className={clsx('shrink-0 text-muted transition-transform', open && 'rotate-180')} />}
              </button>

              {open && (
                <ul className="border-t border-line p-2">
                  {m.lessons.map((l) => {
                    const lessonDone = l.status === 'completed';
                    const lessonCurrent = l.status === 'in_progress';
                    const available = lessonDone || lessonCurrent;
                    const inner = (
                      <>
                        <span
                          className={clsx(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
                            lessonDone && 'bg-brand-soft text-brand-strong',
                            lessonCurrent && 'bg-brand text-brand-ink',
                            !available && 'bg-sunken text-muted',
                          )}
                        >
                          {lessonDone ? <FiCheck /> : lessonCurrent ? <FiPlay className="ml-0.5" /> : l.order}
                        </span>
                        <span className={clsx('flex-1 text-sm', !available && 'text-muted', lessonCurrent && 'font-semibold')}>{l.title}</span>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <FiClock /> {t('common.minutes', { count: l.durationMinutes })}
                        </span>
                      </>
                    );
                    return (
                      <li key={l.id}>
                        {available ? (
                          <Link
                            to={generatePath(PATHS.student.lesson, { lessonId: l.id })}
                            className={clsx('flex items-center gap-3 rounded-ctl px-3 py-2.5 hover:bg-sunken', lessonCurrent && 'bg-brand-soft/60')}
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-3 py-2.5" title={t('module.lessonLocked')}>
                            {inner}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
