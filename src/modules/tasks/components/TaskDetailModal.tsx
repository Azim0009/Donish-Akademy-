import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiCheck, FiCornerUpLeft, FiEdit2, FiSend, FiTrash2 } from 'react-icons/fi';
import clsx from 'clsx';
import type { Task, TaskStatus } from '@/core/types/models';
import { formatDate, timeAgo } from '@/core/utils/format';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { ASSIGNEE_STATUSES, isOverdue, priorityTone, TASK_STATUSES } from '@/shared/lib/tasks';
import { Avatar, Badge, Button, IconButton, Modal, Textarea, toast } from '@/shared/ui';
import { useCommentTask, useDeleteTask, useUpdateTask } from '../api/tasksApi';
import { TaskFormModal } from './TaskFormModal';

/** Задача целиком: статус, комментарии; поставивший может изменить, принять или удалить */
export function TaskDetailModal({
  task,
  meId,
  manager,
  onClose,
}: {
  task: Task;
  meId: string;
  manager: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const comment = useCommentTask();
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const err = (e: unknown) => toast(getApiErrorMessage(e), 'error');
  const isAssignee = task.assigneeId === meId;
  const allowed: TaskStatus[] = manager ? TASK_STATUSES : ASSIGNEE_STATUSES;
  const setStatus = (status: TaskStatus) =>
    update.mutate(
      { id: task.id, status },
      { onSuccess: () => toast(t(`tasks.moved.${status}`), 'success'), onError: err },
    );
  const send = () => {
    if (!text.trim()) return;
    comment.mutate({ id: task.id, text }, { onSuccess: () => setText(''), onError: err });
  };

  if (editing) return <TaskFormModal task={task} onClose={() => setEditing(false)} />;

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={task.title}
      footer={
        manager ? (
          <div className="flex w-full flex-wrap items-center gap-2">
            {confirmDel ? (
              <>
                <span className="mr-auto text-sm text-danger">{t('tasks.confirmDelete')}</span>
                <Button variant="secondary" onClick={() => setConfirmDel(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  loading={del.isPending}
                  onClick={() =>
                    del.mutate(task.id, {
                      onSuccess: () => (toast(t('tasks.deleted'), 'success'), onClose()),
                      onError: err,
                    })
                  }
                >
                  {t('common.delete')}
                </Button>
              </>
            ) : (
              <>
                <IconButton
                  label={t('common.delete')}
                  className="text-danger"
                  onClick={() => setConfirmDel(true)}
                >
                  <FiTrash2 />
                </IconButton>
                <Button
                  variant="secondary"
                  leftIcon={<FiEdit2 />}
                  onClick={() => setEditing(true)}
                  className="mr-auto"
                >
                  {t('common.edit')}
                </Button>
                {task.status === 'review' && (
                  <>
                    <Button
                      variant="secondary"
                      leftIcon={<FiCornerUpLeft />}
                      onClick={() => setStatus('in_progress')}
                    >
                      {t('tasks.backToWork')}
                    </Button>
                    <Button leftIcon={<FiCheck />} onClick={() => setStatus('done')}>
                      {t('tasks.accept')}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        ) : isAssignee && task.status !== 'done' && task.status !== 'review' ? (
          <Button leftIcon={<FiCheck />} onClick={() => setStatus('review')}>
            {t('tasks.markDone')}
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={priorityTone[task.priority]}>{t(`tasks.prio.${task.priority}`)}</Badge>
          {task.dueDate && (
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 text-sm',
                isOverdue(task) ? 'font-medium text-danger' : 'text-muted',
              )}
            >
              <FiCalendar /> {formatDate(task.dueDate)}
              {isOverdue(task) && ` · ${t('tasks.overdue')}`}
            </span>
          )}
        </div>

        {task.description && <p className="whitespace-pre-line text-sm">{task.description}</p>}

        <dl className="grid gap-3 rounded-ctl bg-sunken p-3 text-sm sm:grid-cols-2">
          <Person
            label={t('tasks.assignee')}
            name={task.assigneeName}
            sub={t(`roles.${task.assigneeRole}`) + (task.branchName ? ` · ${task.branchName}` : '')}
          />
          <Person
            label={t('tasks.from')}
            name={task.createdByName}
            sub={`${t(`roles.${task.createdByRole}`)} · ${timeAgo(task.createdAt)}`}
          />
        </dl>

        {(isAssignee || manager) && (
          <div>
            <p className="mb-2 text-[13px] font-medium text-muted">{t('tasks.status')}</p>
            <div
              className="flex flex-wrap gap-1.5"
              role="radiogroup"
              aria-label={t('tasks.status')}
            >
              {allowed.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={task.status === s}
                  disabled={update.isPending}
                  onClick={() => task.status !== s && setStatus(s)}
                  className={clsx(
                    'rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
                    task.status === s
                      ? 'border-brand bg-brand text-brand-ink'
                      : 'border-line hover:border-brand/50 hover:bg-brand-soft/50',
                  )}
                >
                  {t(`tasks.st.${s}`)}
                </button>
              ))}
            </div>
            {!manager && <p className="mt-2 text-xs text-muted">{t('tasks.assigneeHint')}</p>}
          </div>
        )}

        <div>
          <p className="mb-2 text-[13px] font-medium text-muted">
            {t('tasks.comments', { count: task.comments.length })}
          </p>
          <ul className="flex flex-col gap-3">
            {task.comments.map((c) => (
              <li key={c.id} className="flex gap-2.5">
                <Avatar name={c.authorName} size={28} />
                <div className="min-w-0 rounded-ctl bg-sunken px-3 py-2">
                  <p className="text-xs">
                    <span className="font-semibold">{c.authorName}</span>{' '}
                    <span className="text-muted">· {timeAgo(c.createdAt)}</span>
                  </p>
                  <p className="whitespace-pre-line text-sm">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-end gap-2">
            <Textarea
              aria-label={t('tasks.writeComment')}
              placeholder={t('tasks.writeComment')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && send()}
              maxLength={1000}
              rows={2}
              className="flex-1 [&_textarea]:min-h-[44px]"
            />
            <IconButton
              label={t('tasks.send')}
              onClick={send}
              disabled={!text.trim() || comment.isPending}
              className="mb-0.5 bg-brand text-brand-ink hover:bg-brand-strong"
            >
              <FiSend />
            </IconButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Person({ label, name, sub }: { label: string; name: string; sub: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={name} size={32} />
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="truncate font-medium">{name}</dd>
        <dd className="truncate text-xs text-muted">{sub}</dd>
      </div>
    </div>
  );
}
