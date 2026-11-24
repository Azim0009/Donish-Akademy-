import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import { db, getLesson, studentProgress, STUDENT_GROUP } from '../db';
import { coursePosition, studentScores } from '../scores';
import { resolveMe } from '../tasks';
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
  http.get(url(ENDPOINTS.progress.group), ({ request }) => {
    const me = resolveMe(request.headers.get('X-Mock-User'), 'student');
    const u = db.users.find((x) => x.id === me.id && x.role === 'student');
    const g = u && db.groups.find((x) => x.id === u.groupId);
    if (!g) return fail(404, 'ENTITY_NOT_FOUND', 'Группа не найдена');
    return ok({
      id: g.id,
      name: g.name,
      format: g.format,
      room: g.room,
      schedule: g.schedule,
      mentorName: g.mentorName,
      aiMentor: g.aiMentor,
      aiHintsOnly: g.aiHintsOnly,
    });
  }),
  // Мои баллы: все месяцы курса до текущего
  http.get(url(ENDPOINTS.progress.scores), ({ request }) => {
    const me = resolveMe(request.headers.get('X-Mock-User'), 'student');
    const u = db.users.find((x) => x.id === me.id && x.role === 'student');
    const group = u && db.groups.find((g) => g.id === u.groupId);
    if (!u || !group) return fail(404, 'ENTITY_NOT_FOUND', 'Группа не найдена');
    const pos = coursePosition(group);
    return ok({
      groupName: group.name,
      mentorName: group.mentorName,
      ...pos,
      months: Array.from({ length: pos.currentMonth }, (_, i) => ({
        month: i + 1,
        ...studentScores(u.id, group.id, i + 1),
      })),
    });
  }),
  // Онлайн-уроки группы ученика (расписание + записи)
  http.get(url(ENDPOINTS.liveSessions.my), ({ request }) => {
    const me = resolveMe(request.headers.get('X-Mock-User'), 'student');
    const groupId = db.users.find((x) => x.id === me.id)?.groupId ?? STUDENT_GROUP;
    return ok(
      db.liveSessions
        .filter((s) => s.groupId === groupId && !s.isCancelled)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    );
  }),
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
