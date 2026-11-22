import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Task, TaskPriority } from '@/core/types/models';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { TASK_PRIORITIES } from '@/shared/lib/tasks';
import { Button, Input, Modal, Select, Textarea, toast } from '@/shared/ui';
import { useAssignees, useCreateTask, useUpdateTask } from '../api/tasksApi';

/** Новая задача или изменение своей задачи */
export function TaskFormModal({ task, onClose }: { task?: Task; onClose: () => void }) {
  const { t } = useTranslation();
  const assignees = useAssignees(!task);
  const create = useCreateTask();
  const update = useUpdateTask();
  const [f, setF] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? ('medium' as TaskPriority),
    dueDate: task?.dueDate ?? '',
    assigneeId: task?.assigneeId ?? '',
  });
  const [tried, setTried] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  const errTitle = tried && f.title.trim().length < 3 ? t('tasks.errTitle') : undefined;
  const errWho = tried && !task && !f.assigneeId ? t('tasks.errWho') : undefined;

  const submit = async () => {
    setTried(true);
    if (f.title.trim().length < 3 || (!task && !f.assigneeId)) return;
    const body = {
      title: f.title.trim(),
      description: f.description.trim(),
      priority: f.priority,
      dueDate: f.dueDate || null,
    };
    try {
      if (task) await update.mutateAsync({ id: task.id, ...body });
      else await create.mutateAsync({ ...body, assigneeId: f.assigneeId });
      toast(t(task ? 'tasks.updated' : 'tasks.created'), 'success');
      onClose();
    } catch (e) {
      toast(getApiErrorMessage(e), 'error');
    }
  };

  const options = (assignees.data ?? []).map((a) => ({
    value: a.id,
    label: `${a.name} — ${t(`roles.${a.role}`)}${a.role === 'director' && a.branchName ? ` (${a.branchName})` : ''}`,
  }));

  return (
    <Modal
      open
      onClose={onClose}
      title={t(task ? 'tasks.edit' : 'tasks.new')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={create.isPending || update.isPending}>
            {t(task ? 'common.saveChanges' : 'tasks.create')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t('tasks.title')}
          value={f.title}
          onChange={set('title')}
          maxLength={120}
          error={errTitle}
          autoFocus
          placeholder={t('tasks.titlePh')}
        />
        <Textarea
          label={t('tasks.description')}
          value={f.description}
          onChange={set('description')}
          maxLength={2000}
          rows={4}
          placeholder={t('tasks.descriptionPh')}
        />
        {!task && (
          <Select
            label={t('tasks.assignee')}
            value={f.assigneeId}
            onChange={set('assigneeId')}
            placeholder={assignees.isLoading ? t('common.loading') : t('tasks.pickAssignee')}
            options={options}
            error={errWho}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('tasks.priority')}
            value={f.priority}
            onChange={set('priority')}
            options={TASK_PRIORITIES.map((p) => ({ value: p, label: t(`tasks.prio.${p}`) }))}
          />
          <Input label={t('tasks.due')} type="date" value={f.dueDate} onChange={set('dueDate')} />
        </div>
      </div>
    </Modal>
  );
}
