import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CodeFiles } from '@/core/types/models';
import { learningApi } from '../api/learningApi';

// Ключи кэша React Query — в одном месте
export const learningKeys = {
  tracks: ['tracks'] as const,
  track: (id: string) => ['tracks', id] as const,
  modules: (trackId: string) => ['tracks', trackId, 'modules'] as const,
  lesson: (id: string) => ['lessons', id] as const,
  progress: ['progress', 'me'] as const,
  live: ['live-sessions', 'me'] as const,
};

export const useTracks = () => useQuery({ queryKey: learningKeys.tracks, queryFn: learningApi.getTracks });

export const useTrack = (id: string) => useQuery({ queryKey: learningKeys.track(id), queryFn: () => learningApi.getTrack(id) });

export const useModules = (trackId: string) =>
  useQuery({ queryKey: learningKeys.modules(trackId), queryFn: () => learningApi.getModules(trackId) });

export const useLesson = (id: string) => useQuery({ queryKey: learningKeys.lesson(id), queryFn: () => learningApi.getLesson(id) });

export const useProgress = () => useQuery({ queryKey: learningKeys.progress, queryFn: learningApi.getProgress });

/** Расписание онлайн-уроков группы ученика (обновляем раз в минуту) */
export const useMyLiveSessions = () =>
  useQuery({ queryKey: learningKeys.live, queryFn: learningApi.getMyLiveSessions, refetchInterval: 60_000 });

export const useCompleteLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: learningApi.completeLesson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracks'] });
      qc.invalidateQueries({ queryKey: learningKeys.progress });
    },
  });
};

export const useSubmitExercise = (exerciseId: string) =>
  useMutation({ mutationFn: (code: CodeFiles) => learningApi.submitExercise(exerciseId, code) });
