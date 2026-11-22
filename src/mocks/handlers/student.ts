import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import { db, getLesson, studentProgress, STUDENT_GROUP } from '../db';
import { ok, fail, url } from './utils';

export const studentHandlers = [
  http.get(url(ENDPOINTS.tracks.list), () => ok(db.tracks)),
  http.get(url('/tracks/:id'), ({ params }) => {
    const track = db.tracks.find((t) => t.id === params.id);
    return track ? ok(track) : fail(404, 'ENTITY_NOT_FOUND', 'Направление не найдено');
  }),
  http.get(url('/tracks/:id/modules'), ({ params }) =>
    ok(db.modules.filter((m) => m.trackId === params.id)),
  ),
  http.get(url('/lessons/:id'), ({ params }) => {
    const lesson = getLesson(params.id as string);
    return lesson ? ok(lesson) : fail(404, 'ENTITY_NOT_FOUND', 'Урок не найден');
  }),
  http.post(url('/exercises/:id/submit'), () =>
    ok({
      id: `submission_${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }),
  ),
  http.get(url(ENDPOINTS.progress.me), () => ok(studentProgress())),
  // Онлайн-уроки группы ученика (расписание + записи)
  http.get(url(ENDPOINTS.liveSessions.my), () =>
    ok(
      db.liveSessions
        .filter((s) => s.groupId === STUDENT_GROUP && !s.isCancelled)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    ),
  ),
  http.post(url('/progress/lesson/:id/complete'), ({ params }) => {
    for (const m of db.modules) {
      const l = m.lessons.find((x) => x.id === params.id);
      if (l && l.status !== 'completed') {
        l.status = 'completed';
        m.completedLessons++;
      }
    }
    return ok({ xpEarned: 50 });
  }),
];
