import { http } from 'msw';
import type { Role } from '@/core/auth/roles';
import type { Task, TaskPriority, TaskStatus } from '@/core/types/models';
import { ENDPOINTS } from '@/core/api/endpoints';
import { ASSIGNEE_STATUSES, TASK_ASSIGN } from '@/shared/lib/tasks';
import { db } from '../db';
import { resolveMe, seedTasks, toAssignee, type Me } from '../tasks';
import { fail, matches, ok, query, roleOf, url } from './utils';

const meOf = (request: Request) => resolveMe(request.headers.get('X-Mock-User'), roleOf(request));
let seeded = false;
const tasks = () => {
  if (!seeded) {
    db.tasks = seedTasks();
    seeded = true;
  }
  return db.tasks;
};

/** Может ли me видеть / управлять задачей как «старший» (поставил или руководит филиалом) */
const isManager = (me: Me, t: Task) =>
  t.createdById === me.id ||
  me.role === 'super_admin' ||
  (me.role === 'director' && t.branchId === me.branchId && t.assigneeRole !== 'director');

function notify(role: Role, title: string, body: string, link: string) {
  (db.notifications[role] ??= []).unshift({
    id: `n_${Date.now()}_${Math.random()}`,
    title,
    body,
    kind: 'info',
    isRead: false,
    link,
    createdAt: new Date().toISOString(),
  });
}
const taskLink = (role: Role) => (role === 'super_admin' ? '/super-admin/tasks' : `/${role}/tasks`);

export const taskHandlers = [
  // кому я могу поставить задачу
  http.get(url(ENDPOINTS.tasks.assignees), ({ request }) => {
    const me = meOf(request);
    const roles = TASK_ASSIGN[me.role] ?? [];
    const list = db.users
      .filter(
        (u) =>
          roles.includes(u.role) &&
          !u.isBlocked &&
          (me.role === 'super_admin' || u.branchId === me.branchId),
      )
      .map((u) =>
        toAssignee({
          id: u.id,
          name: u.name,
          role: u.role,
          branchId: u.branchId,
          branchName: u.branchName,
        }),
      );
    return ok(list);
  }),

  // scope: mine — мне, created — я поставил, all — всё, что я вижу как руководитель
  http.get(url(ENDPOINTS.tasks.list), ({ request }) => {
    const me = meOf(request);
    const q = query(request);
    const scope = q.get('scope') ?? 'mine';
    const list = tasks()
      .filter((t) =>
        scope === 'created'
          ? t.createdById === me.id
          : scope === 'all'
            ? isManager(me, t) || t.assigneeId === me.id
            : t.assigneeId === me.id,
      )
      .filter((t) =>
        matches(
          `${t.title} ${t.assigneeName} ${t.createdByName} ${t.branchName ?? ''}`,
          q.get('search'),
        ),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return ok({ tasks: list, me: toAssignee(me) });
  }),

  http.post(url(ENDPOINTS.tasks.list), async ({ request }) => {
    const me = meOf(request);
    const b = (await request.json()) as {
      title: string;
      description: string;
      priority: TaskPriority;
      dueDate: string | null;
      assigneeId: string;
    };
    const to = db.users.find((u) => u.id === b.assigneeId);
    if (
      !to ||
      !(TASK_ASSIGN[me.role] ?? []).includes(to.role) ||
      (me.role !== 'super_admin' && to.branchId !== me.branchId)
    )
      return fail(403, 'FORBIDDEN', 'Этому сотруднику вы не можете ставить задачи');
    if (!b.title?.trim()) return fail(422, 'VALIDATION_ERROR', 'Название обязательно');
    const now = new Date().toISOString();
    const t: Task = {
      id: `task_${Date.now()}`,
      title: b.title.trim(),
      description: b.description?.trim() ?? '',
      status: 'todo',
      priority: b.priority,
      dueDate: b.dueDate || null,
      assigneeId: to.id,
      assigneeName: to.name,
      assigneeRole: to.role,
      branchId: to.branchId,
      branchName: to.branchName,
      createdById: me.id,
      createdByName: me.name,
      createdByRole: me.role,
      createdAt: now,
      updatedAt: now,
      comments: [],
    };
    tasks().unshift(t);
    notify(to.role, 'Новая задача', `${me.name}: ${t.title}`, taskLink(to.role));
    return ok(t);
  }),

  http.patch(url('/tasks/:id'), async ({ params, request }) => {
    const me = meOf(request);
    const t = tasks().find((x) => x.id === params.id);
    if (!t) return fail(404, 'ENTITY_NOT_FOUND', 'Задача не найдена');
    const b = (await request.json()) as Partial<
      Pick<Task, 'status' | 'title' | 'description' | 'priority' | 'dueDate'>
    >;
    const manager = isManager(me, t);
    const assignee = t.assigneeId === me.id;
    if (!manager && !assignee) return fail(403, 'FORBIDDEN', 'Нет доступа к задаче');
    // исполнитель меняет только статус и только до «На проверке»
    if (!manager) {
      if (Object.keys(b).some((k) => k !== 'status'))
        return fail(403, 'FORBIDDEN', 'Менять задачу может только тот, кто её поставил');
      if (b.status && !ASSIGNEE_STATUSES.includes(b.status as TaskStatus))
        return fail(403, 'FORBIDDEN', 'Закрывает задачу тот, кто её поставил');
    }
    const prev = t.status;
    Object.assign(t, b, { updatedAt: new Date().toISOString() });
    if (b.status === 'review' && prev !== 'review')
      notify(
        t.createdByRole,
        'Задача выполнена — проверьте',
        `${t.assigneeName}: ${t.title}`,
        taskLink(t.createdByRole),
      );
    if (b.status === 'done' && prev !== 'done' && !assignee)
      notify(t.assigneeRole, 'Задача принята', t.title, taskLink(t.assigneeRole));
    return ok(t);
  }),

  http.delete(url('/tasks/:id'), ({ params, request }) => {
    const me = meOf(request);
    const i = tasks().findIndex((x) => x.id === params.id);
    if (i < 0) return fail(404, 'ENTITY_NOT_FOUND', 'Задача не найдена');
    if (!isManager(me, tasks()[i]))
      return fail(403, 'FORBIDDEN', 'Удалить может только тот, кто поставил');
    tasks().splice(i, 1);
    return ok(null);
  }),

  http.post(url('/tasks/:id/comments'), async ({ params, request }) => {
    const me = meOf(request);
    const t = tasks().find((x) => x.id === params.id);
    if (!t) return fail(404, 'ENTITY_NOT_FOUND', 'Задача не найдена');
    if (!isManager(me, t) && t.assigneeId !== me.id)
      return fail(403, 'FORBIDDEN', 'Нет доступа к задаче');
    const { text } = (await request.json()) as { text: string };
    if (!text?.trim()) return fail(422, 'VALIDATION_ERROR', 'Пустой комментарий');
    t.comments.push({
      id: `tc_${Date.now()}`,
      authorName: me.name,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    });
    t.updatedAt = new Date().toISOString();
    const other = t.assigneeId === me.id ? t.createdByRole : t.assigneeRole;
    notify(
      other,
      `Комментарий к задаче: ${t.title}`,
      `${me.name}: ${text.trim()}`,
      taskLink(other),
    );
    return ok(t);
  }),
];
