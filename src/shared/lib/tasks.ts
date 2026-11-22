import type { Role } from '@/core/auth/roles';
import type { Task, TaskPriority, TaskStatus } from '@/core/types/models';
import type { BadgeTone } from '@/shared/ui';

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
export const TASK_PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];
export const priorityTone: Record<TaskPriority, BadgeTone> = {
  high: 'red',
  medium: 'amber',
  low: 'gray',
};

/** Кто кому может ставить задачи */
export const TASK_ASSIGN: Partial<Record<Role, Role[]>> = {
  super_admin: ['director'],
  director: ['administrator', 'mentor', 'accountant', 'cleaner', 'sales'],
  administrator: ['cleaner', 'sales'],
};
export const canCreateTasks = (role: Role) => !!TASK_ASSIGN[role]?.length;

/** Исполнитель двигает до «На проверке», закрывает тот, кто поставил */
export const ASSIGNEE_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review'];

const today = () => new Date().toISOString().slice(0, 10);
export const isOverdue = (t: Pick<Task, 'dueDate' | 'status'>) =>
  !!t.dueDate && t.status !== 'done' && t.dueDate < today();
export const isDueToday = (t: Pick<Task, 'dueDate' | 'status'>) =>
  t.dueDate === today() && t.status !== 'done';
