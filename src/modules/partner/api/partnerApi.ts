import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type {
  Lesson,
  PartnerCourseBuilder,
  PartnerModule,
  PartnerCourse,
  PartnerCourseInput,
  PartnerDashboard,
  PartnerPublic,
  PartnerStudent,
  PartnerStudentStatus,
} from '@/core/types/models';

const E = ENDPOINTS.partner;
const get = <T>(url: string) => api.get<ApiResponse<T>>(url).then((r) => r.data.data);

export const usePartnerDashboard = () =>
  useQuery({
    queryKey: ['partner', 'dashboard'],
    queryFn: () => get<PartnerDashboard>(E.dashboard),
  });
export const usePartnerCourses = () =>
  useQuery({ queryKey: ['partner', 'courses'], queryFn: () => get<PartnerCourse[]>(E.courses) });
export const usePartnerStudents = () =>
  useQuery({ queryKey: ['partner', 'students'], queryFn: () => get<PartnerStudent[]>(E.students) });

function usePartnerMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner'] }),
  });
}

export const useSaveCourse = () =>
  usePartnerMutation(({ id, body }: { id?: string; body: PartnerCourseInput }) =>
    (id ? api.patch(E.course(id), body) : api.post(E.courses, body)).then(
      (r) => (r.data as ApiResponse<PartnerCourse>).data,
    ),
  );
export const useSetCourseStatus = () =>
  usePartnerMutation(({ id, status }: { id: string; status: PartnerCourse['status'] }) =>
    api.patch(E.course(id), { status }),
  );
export const useDeleteCourse = () => usePartnerMutation((id: string) => api.delete(E.course(id)));
export const useSetStudentStatus = () =>
  usePartnerMutation(({ id, status }: { id: string; status: PartnerStudentStatus }) =>
    api.patch(E.student(id), { status }),
  );

// --- Публичная страница партнёра ---
export const usePartnerPublic = (code: string) =>
  useQuery({
    queryKey: ['public', 'partner', code],
    queryFn: () => get<PartnerPublic>(ENDPOINTS.publicPartner.page(code)),
    retry: false,
  });
export const useApplyToPartner = (code: string) =>
  useMutation({
    mutationFn: (b: { name: string; phone: string; courseId: string }) =>
      api.post(ENDPOINTS.publicPartner.apply(code), b),
  });

// --- Конструктор курса: модули и уроки ---
export const usePartnerCourseBuilder = (courseId: string) =>
  useQuery({
    queryKey: ['partner', 'builder', courseId],
    queryFn: () => get<PartnerCourseBuilder>(E.courseModules(courseId)),
  });
export const useCreateModule = (courseId: string) =>
  usePartnerMutation((b: { title: string; description: string }) =>
    api.post<ApiResponse<PartnerModule>>(E.courseModules(courseId), b).then((r) => r.data.data),
  );
export const useUpdateModule = () =>
  usePartnerMutation(({ id, ...b }: { id: string; title: string; description: string }) =>
    api.patch(E.module(id), b),
  );
export const useDeleteModule = () => usePartnerMutation((id: string) => api.delete(E.module(id)));
export const useReorderModules = (courseId: string) =>
  usePartnerMutation((ids: string[]) => api.post(E.reorderModules(courseId), { ids }));
export const useCreatePartnerLesson = () =>
  usePartnerMutation(
    ({ moduleId, ...b }: { moduleId: string; title: string; durationMinutes: number }) =>
      api.post<ApiResponse<Lesson>>(E.moduleLessons(moduleId), b).then((r) => r.data.data),
  );
export const useDeletePartnerLesson = () =>
  usePartnerMutation((id: string) => api.delete(E.lesson(id)));
export const usePartnerLesson = (id: string) =>
  useQuery({ queryKey: ['partner', 'lesson', id], queryFn: () => get<Lesson>(E.lesson(id)) });
export const useSavePartnerLesson = (id: string) =>
  usePartnerMutation((b: Lesson) =>
    api.put<ApiResponse<Lesson>>(E.lesson(id), b).then((r) => r.data.data),
  );
