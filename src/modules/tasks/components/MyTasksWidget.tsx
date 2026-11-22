import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowRight, FiCalendar, FiCheckSquare } from 'react-icons/fi';
import clsx from 'clsx';
import { formatDate } from '@/core/utils/format';
import { isDueToday, isOverdue, priorityTone } from '@/shared/lib/tasks';
import { Badge, EmptyState, Section } from '@/shared/ui';
import { useTasks } from '../api/tasksApi';

/** «Мои задачи» на главной сотрудника: открытые задачи, сначала срочные */
export function MyTasksWidget({ to, className }: { to: string; className?: string }) {
  const { t } = useTranslation();
  const { data } = useTasks({ scope: 'mine' });
  const open = (data?.tasks ?? [])
    .filter((x) => x.status !== 'done')
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
    .slice(0, 4);
  return (
    <Section
      className={className}
      title={t('tasks.myTasks')}
      action={
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-strong hover:underline"
        >
          {t('common.openAll')} <FiArrowRight />
        </Link>
      }
    >
      {open.length === 0 ? (
        <EmptyState icon={<FiCheckSquare />} title={t('tasks.noOpen')} />
      ) : (
        <ul className="flex flex-col">
          {open.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 border-b border-line py-2.5 first:pt-0 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to={to}
                  className="block truncate text-sm font-medium hover:text-brand-strong"
                >
                  {task.title}
                </Link>
                <p className="truncate text-xs text-muted">
                  {t(`tasks.st.${task.status}`)} · {t('tasks.fromShort')} {task.createdByName}
                </p>
              </div>
              {task.dueDate && (
                <span
                  className={clsx(
                    'inline-flex shrink-0 items-center gap-1 text-xs',
                    isOverdue(task)
                      ? 'font-medium text-danger'
                      : isDueToday(task)
                        ? 'font-medium text-amber'
                        : 'text-muted',
                  )}
                >
                  <FiCalendar />{' '}
                  {isDueToday(task)
                    ? t('tasks.today')
                    : formatDate(task.dueDate, { day: 'numeric', month: 'short' })}
                </span>
              )}
              <Badge tone={priorityTone[task.priority]}>{t(`tasks.prio.${task.priority}`)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
