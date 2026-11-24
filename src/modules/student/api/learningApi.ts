import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type {
  CodeFiles,
  Lesson,
  LiveSession,
  MyScores,
  Progress,
  Submission,
  Track,
  TrackModule,
} from '@/core/types/models';

const get = <T>(url: string) => api.get<ApiResponse<T>>(url).then((r) => r.data.data);

export const learningApi = {
  getTracks: () => get<Track[]>(ENDPOINTS.tracks.list),
  getTrack: (id: string) => get<Track>(ENDPOINTS.tracks.one(id)),
  getModules: (trackId: string) => get<TrackModule[]>(ENDPOINTS.tracks.modules(trackId)),
  getLesson: (id: string) => get<Lesson>(ENDPOINTS.lessons.one(id)),
  getProgress: () => get<Progress>(ENDPOINTS.progress.me),
  getMyScores: () => get<MyScores>(ENDPOINTS.progress.scores),
  getMyLiveSessions: () => get<LiveSession[]>(ENDPOINTS.liveSessions.my),
  completeLesson: (id: string) =>
    api
      .post<ApiResponse<{ xpEarned: number }>>(ENDPOINTS.progress.completeLesson(id))
      .then((r) => r.data.data),
  submitExercise: (exerciseId: string, code: CodeFiles) =>
    api
      .post<
        ApiResponse<Pick<Submission, 'id' | 'status' | 'submittedAt'>>
      >(ENDPOINTS.exercises.submit(exerciseId), { code })
      .then((r) => r.data.data),
};
