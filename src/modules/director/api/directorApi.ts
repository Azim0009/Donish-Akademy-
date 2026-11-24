import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type { Period } from '@/shared/lib/period';
import type { LeadSource } from '@/core/types/models';
import type { DirectorAssignable } from '@/core/auth/access';

/** Кого директор добавляет в филиал: сотрудников и учеников */
export type DirectorUserRole = DirectorAssignable | 'student';
import type {
  Group,
  Lesson,
  LessonSummary,
  Track,
  TrackModule,
  UserListItem,
} from '@/core/types/models';

const E = ENDPOINTS.director;
const get = <T>(url: string, params?: object) =>
  api.get<ApiResponse<T>>(url, { params }).then((r) => r.data.data);

export interface DirectorDashboard {
  period: Period;
  branchName: string;
  kpi: Record<
    'students' | 'groups' | 'mentors' | 'applications' | 'revenue',
    { value: number; delta: number }
  >;
  groups: Group[];
  mentorLoad: { id: string; name: string; groups: number; students: number; load: number }[];
  applications: {
    id: string;
    name: string;
    source: LeadSource;
    course: string;
    createdAt: string;
  }[];
  today: {
    groupId: string;
    groupName: string;
    trackTitle: string;
    mentorName: string | null;
    from: string;
    to: string;
    startsAt: string;
    endsAt: string;
  }[];
  reviews: { groupId: string; groupName: string; count: number; mentorName: string | null }[];
  pendingTotal: number;
}
export interface DirectorStats {
  daily: { label: string; active: number }[];
  registrations: { label: string; value: number }[];
  byGroup: { name: string; progress: number; students: number }[];
  completedModules: number;
  activeStudents: number;
  registrationsMonth: number;
}

const keys = {
  all: ['director'] as const,
  dashboard: ['director', 'dashboard'] as const,
  tracks: ['director', 'tracks'] as const,
  modules: (id: string) => ['director', 'modules', id] as const,
  lessons: (id: string) => ['director', 'lessons', id] as const,
  lesson: (id: string) => ['director', 'lesson', id] as const,
  groups: (s: string) => ['director', 'groups', s] as const,
  group: (id: string) => ['director', 'group', id] as const,
  users: (p: object) => ['director', 'users', p] as const,
  user: (id: string) => ['director', 'user', id] as const,
  stats: ['director', 'stats'] as const,
};

export const useDirectorDashboard = (period: Period = 7) =>
  useQuery({
    queryKey: [...keys.dashboard, period],
    queryFn: () => get<DirectorDashboard>(E.dashboard, { period }),
    placeholderData: keepPreviousData,
  });
export const useDirectorTracks = () =>
  useQuery({ queryKey: keys.tracks, queryFn: () => get<Track[]>(E.tracks) });
export const useDirectorModules = (trackId: string) =>
  useQuery({
    queryKey: keys.modules(trackId),
    queryFn: () => get<{ track: Track; modules: TrackModule[] }>(E.trackModules(trackId)),
  });
export const useDirectorLessons = (moduleId: string) =>
  useQuery({
    queryKey: keys.lessons(moduleId),
    queryFn: () => get<{ module: TrackModule; track: Track }>(E.moduleLessons(moduleId)),
  });
export const useDirectorLesson = (id: string) =>
  useQuery({ queryKey: keys.lesson(id), queryFn: () => get<Lesson>(E.lesson(id)) });
export const useDirectorGroups = (search = '') =>
  useQuery({
    queryKey: keys.groups(search),
    queryFn: () => get<Group[]>(E.groups, { search }),
    placeholderData: keepPreviousData,
  });
export const useDirectorGroup = (id: string) =>
  useQuery({
    queryKey: keys.group(id),
    queryFn: () => get<{ group: Group; members: UserListItem[] }>(E.group(id)),
  });
export const useDirectorUsers = (params: {
  /** staff — все сотрудники филиала */
  role: DirectorUserRole | 'staff';
  search?: string;
  groupId?: string;
}) =>
  useQuery({
    queryKey: keys.users(params),
    queryFn: () => get<UserListItem[]>(E.users, params),
    placeholderData: keepPreviousData,
  });
export const useDirectorUser = (id: string) =>
  useQuery({
    queryKey: keys.user(id),
    queryFn: () => get<{ user: UserListItem; groups: Group[] }>(E.user(id)),
  });
export const useDirectorStats = () =>
  useQuery({ queryKey: keys.stats, queryFn: () => get<DirectorStats>(E.statistics) });

function useDirectorMutation<TVars, TRes>(fn: (v: TVars) => Promise<TRes>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
const post = <T>(url: string, body: unknown) =>
  api.post<ApiResponse<T>>(url, body).then((r) => r.data.data);

export const useCreateTrack = () =>
  useDirectorMutation((b: { title: string; description: string }) => post<Track>(E.tracks, b));
export const useCreateModule = (trackId: string) =>
  useDirectorMutation((b: { title: string; description: string }) =>
    post<TrackModule>(E.trackModules(trackId), b),
  );
export const useReorderModules = (trackId: string) =>
  useDirectorMutation((order: string[]) => api.put(E.trackModules(trackId), { order }));
export const useCreateLesson = (moduleId: string) =>
  useDirectorMutation((b: { title: string; durationMinutes: number }) =>
    post<LessonSummary>(E.moduleLessons(moduleId), b),
  );
export const useSaveLesson = (id: string) =>
  useDirectorMutation((b: Lesson) => api.put(E.lesson(id), b));
export const useCreateGroup = () =>
  useDirectorMutation((b: { name: string; mentorId: string; schedule: string; capacity: number }) =>
    post<Group>(E.groups, b),
  );
export const useCreateUser = () =>
  useDirectorMutation(
    (b: {
      name: string;
      email?: string;
      phone: string;
      role: DirectorUserRole;
      groupId?: string;
      login?: string;
      password?: string;
    }) => post<UserListItem>(E.users, b),
  );
export const useUpdateUser = (id: string) =>
  useDirectorMutation((b: object) =>
    api.patch<ApiResponse<UserListItem>>(E.user(id), b).then((r) => r.data.data),
  );
export const useDeleteUser = (id: string) => useDirectorMutation(() => api.delete(E.user(id)));
export const useSaveAccess = (id: string) =>
  useDirectorMutation((b: { roles: string[]; deniedSections: string[] }) =>
    api.patch<ApiResponse<UserListItem>>(E.userAccess(id), b).then((r) => r.data.data),
  );
export const useToggleBlock = () =>
  useDirectorMutation((id: string) =>
    api.patch<ApiResponse<UserListItem>>(E.userBlock(id)).then((r) => r.data.data),
  );
