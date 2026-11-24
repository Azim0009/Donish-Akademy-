import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type {
  Group,
  GroupMember,
  GroupScores,
  LiveSession,
  LiveSessionInput,
  Submission,
  UserListItem,
  WeekScore,
} from '@/core/types/models';

const E = ENDPOINTS.mentor;
const get = <T>(url: string, params?: object) =>
  api.get<ApiResponse<T>>(url, { params }).then((r) => r.data.data);

export interface MentorDashboard {
  groupsCount: number;
  studentsCount: number;
  pendingCount: number;
  avgProgress: number;
  groups: Group[];
  pending: Submission[];
  lagging: GroupMember[];
}
export interface StudentProgressDetail {
  student: UserListItem;
  modules: {
    id: string;
    title: string;
    lessonsCount: number;
    completedLessons: number;
    quizScore: number | null;
  }[];
  submissions: Submission[];
}

export const useMentorDashboard = () =>
  useQuery({ queryKey: ['mentor', 'dashboard'], queryFn: () => get<MentorDashboard>(E.dashboard) });
export const useMentorGroups = () =>
  useQuery({ queryKey: ['mentor', 'groups'], queryFn: () => get<Group[]>(E.groups) });
export const useMentorGroup = (id: string) =>
  useQuery({
    queryKey: ['mentor', 'group', id],
    queryFn: () => get<{ group: Group; members: GroupMember[] }>(E.group(id)),
  });
export const useStudentProgress = (id: string) =>
  useQuery({
    queryKey: ['mentor', 'student', id],
    queryFn: () => get<StudentProgressDetail>(E.student(id)),
  });
export const useSubmissions = (params: { status: string; search?: string }) =>
  useQuery({
    queryKey: ['mentor', 'submissions', params],
    queryFn: () => get<Submission[]>(E.submissions, params),
    placeholderData: keepPreviousData,
  });
export const useSubmission = (id: string) =>
  useQuery({
    queryKey: ['mentor', 'submission', id],
    queryFn: () => get<Submission>(E.submission(id)),
  });

export const useReview = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: 'passed' | 'failed'; feedback: string }) =>
      api.post(E.review(id), body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor'] }),
  });
};

// --- Онлайн-уроки ---
export interface CourseLesson {
  id: string;
  title: string;
  number: number;
  moduleTitle: string;
}

export const useMentorLiveSessions = () =>
  useQuery({
    queryKey: ['mentor', 'live'],
    queryFn: () => get<LiveSession[]>(E.liveSessions),
    refetchInterval: 60_000,
  });
export const useCourseLessons = () =>
  useQuery({
    queryKey: ['mentor', 'course-lessons'],
    queryFn: () => get<CourseLesson[]>(E.courseLessons),
    staleTime: Infinity,
  });

export const useSaveLiveSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id?: string;
      body: Partial<LiveSessionInput> & { isCancelled?: boolean };
    }) =>
      (id ? api.patch(E.liveSession(id), body) : api.post(E.liveSessions, body)).then(
        (r) => r.data.data as LiveSession,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor', 'live'] }),
  });
};

export const useDeleteLiveSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(E.liveSession(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor', 'live'] }),
  });
};

// --- Журнал баллов ---
export const groupScoresKey = (groupId: string, month: number | null) =>
  ['mentor', 'scores', groupId, month] as const;

/** month = null → текущий месяц группы */
export const useGroupScores = (groupId: string, month: number | null) =>
  useQuery({
    queryKey: groupScoresKey(groupId, month),
    queryFn: () => get<GroupScores>(E.groupScores(groupId), month ? { month } : undefined),
    placeholderData: keepPreviousData,
  });

/** Сохранение недели — без перезагрузки журнала (значения уже на экране) */
export const useSaveWeekScore = () =>
  useMutation({
    mutationFn: (row: WeekScore) =>
      api.put<ApiResponse<WeekScore>>(E.scores, row).then((r) => r.data.data),
  });

export const useSetExtraExam = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { studentId: string; month: number; passed: boolean | null }) =>
      api.put(E.extraExam, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor', 'scores', groupId] }),
  });
};
