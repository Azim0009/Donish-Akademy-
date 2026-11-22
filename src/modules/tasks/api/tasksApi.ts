import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type { Task, TaskAssignee, TaskPriority } from '@/core/types/models';
import { useAuthStore } from '@/core/auth/authStore';

/** Кэш задач — свой у каждого пользователя (иначе после смены входа видны чужие задачи) */
const useUid = () => useAuthStore((s) => s.user?.id ?? 'anon');

export type TaskScope = 'mine' | 'created' | 'all';
const E = ENDPOINTS.tasks;
const KEY = ['tasks'] as const;
const get = <T>(u: string, params?: object) =>
  api.get<ApiResponse<T>>(u, { params }).then((r) => r.data.data);

export const useTasks = (params: { scope: TaskScope; search?: string }) => {
  const uid = useUid();
  return useQuery({
    queryKey: [...KEY, uid, params],
    queryFn: () => get<{ tasks: Task[]; me: TaskAssignee }>(E.list, params),
    placeholderData: keepPreviousData,
  });
};

export const useAssignees = (enabled: boolean) => {
  const uid = useUid();
  return useQuery({
    queryKey: [...KEY, uid, 'assignees'],
    queryFn: () => get<TaskAssignee[]>(E.assignees),
    enabled,
  });
};

const useTaskMutation = <V, R = Task>(fn: (v: V) => Promise<R>) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
};
const data = <T>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);

export interface TaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string;
}
export const useCreateTask = () =>
  useTaskMutation((b: TaskInput) => data<Task>(api.post(E.list, b)));
export const useUpdateTask = () =>
  useTaskMutation(({ id, ...b }: { id: string } & Partial<Omit<Task, 'id'>>) =>
    data<Task>(api.patch(E.one(id), b)),
  );
export const useDeleteTask = () =>
  useTaskMutation((id: string) => data<null>(api.delete(E.one(id))));
export const useCommentTask = () =>
  useTaskMutation(({ id, text }: { id: string; text: string }) =>
    data<Task>(api.post(E.comments(id), { text })),
  );
