import { useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiAlertCircle,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiMessageSquare,
  FiPlus,
  FiSearch,
} from 'react-icons/fi';
import clsx from 'clsx';
import type { Task, TaskStatus } from '@/core/types/models';
import { useAuthStore } from '@/core/auth/authStore';
import { formatDate } from '@/core/utils/format';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import {
  ASSIGNEE_STATUSES,
  canCreateTasks,
  isDueToday,
  isOverdue,
  priorityTone,
  TASK_STATUSES,
} from '@/shared/lib/tasks';
import {
  Avatar,
  Badge,
  Button,
  ErrorState,
  Input,
  Loader,
  PageHeader,
  Tabs,
  toast,
} from '@/shared/ui';
import { useTasks, useUpdateTask, type TaskScope } from '../api/tasksApi';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { TaskFormModal } from '../components/TaskFormModal';

const COLUMN_DOT: Record<TaskStatus, string> = {
  todo: 'bg-muted',
  in_progress: 'bg-info',
  review: 'bg-amber',
  done: 'bg-brand',
};

/**
 * Задачи сотрудникам — одна страница для всех ролей.
 * SuperAdmin → директорам, директор → сотрудникам филиала, администратор → уборщице и продажам.
 * Исполнитель двигает задачу до «На проверке», закрывает тот, кто поставил.
 */
export default function TasksPage() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.user?.role) ?? 'student';
  const creator = canCreateTasks(role);
  const boss = role === 'super_admin' || role === 'director';
  // SuperAdmin задачи не получает — сразу «Я поставил»
  const [scope, setScope] = useState<TaskScope>(role === 'super_admin' ? 'created' : 'mine');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isError, refetch } = useTasks({ scope, search });
  const mine = useTasks({ scope: 'mine' });
  const created = useTasks({ scope: 'created' });
  const update = useUpdateTask();

  const meId = data?.me.id ?? '';
  const tasks = data?.tasks ?? [];
  const opened = tasks.find((x) => x.id === open);
  // руководитель задачи: поставил сам, SuperAdmin, или директор — для задач своих сотрудников (не своих личных)
  const isManager = (task: Task) =>
    task.createdById === meId ||
    role === 'super_admin' ||
    (role === 'director' && task.assigneeId !== meId);
  const openCount = (list?: Task[]) => (list ?? []).filter((x) => x.status !== 'done').length;
  const overdue = tasks.filter(isOverdue).length;
  const today = tasks.filter(isDueToday).length;

  const move = (task: Task, status: TaskStatus) => {
    if (task.status === status) return;
    const allowed = isManager(task) ? TASK_STATUSES : ASSIGNEE_STATUSES;
    if (!allowed.includes(status)) return toast(t('tasks.onlyCreatorCloses'), 'error');
    update.mutate(
      { id: task.id, status },
      {
        onSuccess: () => toast(t(`tasks.moved.${status}`), 'success'),
        onError: (e) => toast(getApiErrorMessage(e), 'error'),
      },
    );
  };

  const tabs = [
    ...(role === 'super_admin'
      ? []
      : [
          {
            value: 'mine' as TaskScope,
            label: t('tasks.scope.mine'),
            count: openCount(mine.data?.tasks),
          },
        ]),
    ...(creator
      ? [
          {
            value: 'created' as TaskScope,
            label: t('tasks.scope.created'),
            count: openCount(created.data?.tasks),
          },
        ]
      : []),
    ...(boss
      ? [
          {
            value: 'all' as TaskScope,
            label: t(role === 'super_admin' ? 'tasks.scope.allNetwork' : 'tasks.scope.allBranch'),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title={t('pages.common.tasks')}
        description={t(creator ? `tasks.desc.${role}` : 'tasks.desc.staff', {
          defaultValue: t('tasks.desc.staff'),
        })}
        actions={
          creator && (
            <Button leftIcon={<FiPlus />} onClick={() => setCreating(true)}>
              {t('tasks.new')}
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {tabs.length > 1 && <Tabs<TaskScope> value={scope} onChange={setScope} tabs={tabs} />}
        {overdue > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-xs font-medium text-danger">
            <FiAlertCircle /> {t('tasks.overdueN', { count: overdue })}
          </span>
        )}
        {today > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-soft px-3 py-1 text-xs font-medium text-amber">
            <FiClock /> {t('tasks.todayN', { count: today })}
          </span>
        )}
        <Input
          className="w-full sm:ml-auto sm:w-64"
          aria-label={t('common.search')}
          placeholder={t('tasks.search')}
          leftIcon={<FiSearch />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Loader />
      ) : isError || !data ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((s) => (
            <Column
              key={s}
              status={s}
              tasks={tasks.filter((x) => x.status === s)}
              scope={scope}
              onOpen={setOpen}
              onDrop={(id) => {
                const task = tasks.find((x) => x.id === id);
                if (task) move(task, s);
              }}
            />
          ))}
        </div>
      )}

      {creating && <TaskFormModal onClose={() => setCreating(false)} />}
      {opened && (
        <TaskDetailModal
          task={opened}
          meId={meId}
          manager={isManager(opened)}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

function Column({
  status,
  tasks,
  scope,
  onOpen,
  onDrop,
}: {
  status: TaskStatus;
  tasks: Task[];
  scope: TaskScope;
  onOpen: (id: string) => void;
  onDrop: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [over, setOver] = useState(false);
  const shown = status === 'done' ? tasks.slice(0, 8) : tasks;
  return (
    <section
      aria-label={t(`tasks.st.${status}`)}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        onDrop(e.dataTransfer.getData('text/task'));
      }}
      className={clsx(
        'flex min-w-0 flex-col gap-2.5 rounded-card border bg-sunken/60 p-3 transition-colors',
        over ? 'border-brand bg-brand-soft/40' : 'border-transparent',
      )}
    >
      <header className="flex items-center gap-2 px-1 pb-1">
        <span className={clsx('h-2 w-2 rounded-full', COLUMN_DOT[status])} />
        <h2 className="text-sm font-semibold">{t(`tasks.st.${status}`)}</h2>
        <span className="text-xs text-muted">{tasks.length}</span>
      </header>
      {shown.length === 0 ? (
        <p className="rounded-ctl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
          {t('tasks.emptyColumn')}
        </p>
      ) : (
        shown.map((task) => (
          <TaskCard key={task.id} task={task} scope={scope} onOpen={() => onOpen(task.id)} />
        ))
      )}
      {tasks.length > shown.length && (
        <p className="px-1 text-xs text-muted">
          {t('tasks.moreDone', { count: tasks.length - shown.length })}
        </p>
      )}
    </section>
  );
}

function TaskCard({ task, scope, onOpen }: { task: Task; scope: TaskScope; onOpen: () => void }) {
  const { t } = useTranslation();
  const late = isOverdue(task);
  // во «Мне» показываем, кто поставил; в остальных — кому
  const who = scope === 'mine' ? task.createdByName : task.assigneeName;
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/task', task.id)}
      onClick={onOpen}
      className={clsx(
        'flex w-full flex-col gap-2 rounded-ctl border bg-surface p-3 text-left shadow-sm transition-shadow hover:shadow-md',
        late ? 'border-danger/40' : 'border-line',
        task.status === 'done' && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={clsx(
            'text-sm font-medium leading-snug',
            task.status === 'done' && 'line-through decoration-muted',
          )}
        >
          {task.title}
        </p>
        {task.status !== 'done' && (
          <Badge tone={priorityTone[task.priority]}>{t(`tasks.prio.${task.priority}`)}</Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Avatar name={who} size={20} />
          <span className="truncate">
            {scope === 'mine' ? `${t('tasks.fromShort')} ` : ''}
            {who}
          </span>
        </span>
        {task.dueDate && (
          <span
            className={clsx(
              'inline-flex items-center gap-1',
              late && 'font-medium text-danger',
              isDueToday(task) && 'font-medium text-amber',
            )}
          >
            <FiCalendar />{' '}
            {isDueToday(task)
              ? t('tasks.today')
              : formatDate(task.dueDate, { day: 'numeric', month: 'short' })}
          </span>
        )}
        {task.comments.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <FiMessageSquare /> {task.comments.length}
          </span>
        )}
        {scope !== 'mine' && task.branchName && task.assigneeRole === 'director' && (
          <span className="inline-flex items-center gap-1">
            <FiMapPin /> {task.branchName}
          </span>
        )}
      </div>
    </button>
  );
}
