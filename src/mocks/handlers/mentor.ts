import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { LiveSessionInput, WeekScore } from '@/core/types/models';
import { MONTHS, SCORE_KEYS, WEEKS, clampScore, monthResult } from '@/shared/lib/scoring';
import { detectProvider, isValidHttpsUrl } from '@/shared/lib/liveSession';
import { courseLessons, db, findLesson } from '../db';
import { coursePosition, groupScores, saveWeek, setExtra, studentScores } from '../scores';
import { aiLog, seedAiLog } from '../ai';
import { ok, fail, url, query, matches } from './utils';

// Демо-ментор = первый ментор Душанбе (у него группы FS-01 и FS-04) + FS-02
const mentorGroups = () =>
  db.groups.filter((g) => g.mentorId === db.groups[0].mentorId || g.name === 'FS-02');
const moduleShare = () => 100 / db.modules.length;

const membersOf = (groupId: string) =>
  db.users
    .filter((u) => u.role === 'student' && u.groupId === groupId)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      progress: u.progress,
      xp: u.xp,
      currentModule:
        db.modules[Math.min(db.modules.length - 1, Math.floor(u.progress / moduleShare()))].title,
      quizAverage: Math.min(100, 55 + Math.round(u.progress / 2.5)),
      lastActiveAt: u.lastActiveAt,
      isBlocked: u.isBlocked,
    }));

export const mentorHandlers = [
  http.get(url(ENDPOINTS.mentor.dashboard), () => {
    const groups = mentorGroups();
    const members = groups.flatMap((g) => membersOf(g.id));
    return ok({
      groupsCount: groups.length,
      studentsCount: members.length,
      pendingCount: db.submissions.filter((s) => s.status === 'pending').length,
      avgProgress: Math.round(members.reduce((s, m) => s + m.progress, 0) / (members.length || 1)),
      groups,
      pending: db.submissions.filter((s) => s.status === 'pending').slice(0, 5),
      lagging: members
        .filter((m) => !m.isBlocked)
        .sort((a, b) => a.progress - b.progress)
        .slice(0, 5),
    });
  }),
  http.get(url(ENDPOINTS.mentor.groups), () => ok(mentorGroups())),
  http.get(url('/mentor/groups/:id'), ({ params }) => {
    const group = db.groups.find((g) => g.id === params.id);
    return group
      ? ok({ group, members: membersOf(group.id) })
      : fail(404, 'ENTITY_NOT_FOUND', 'Группа не найдена');
  }),
  // --- AI-ментор группы: включить / выключить, о чём спрашивают ---
  http.get(url('/mentor/groups/:id/ai'), ({ params }) => {
    seedAiLog();
    const g = db.groups.find((x) => x.id === params.id);
    if (!g) return fail(404, 'ENTITY_NOT_FOUND', 'Группа не найдена');
    const week = Date.now() - 7 * 86_400_000;
    const mine = aiLog.filter((q) => q.groupId === g.id);
    const weekQ = mine.filter((q) => new Date(q.at).getTime() >= week);
    return ok({
      aiMentor: g.aiMentor,
      aiHintsOnly: g.aiHintsOnly,
      weekCount: weekQ.length,
      askedStudents: new Set(weekQ.map((q) => q.studentId)).size,
      recent: mine.slice(0, 6),
    });
  }),
  http.patch(url('/mentor/groups/:id/ai'), async ({ params, request }) => {
    const g = mentorGroups().find((x) => x.id === params.id);
    if (!g) return fail(404, 'ENTITY_NOT_FOUND', 'Группа не найдена');
    const b = (await request.json()) as { aiMentor?: boolean; aiHintsOnly?: boolean };
    if (b.aiMentor !== undefined) g.aiMentor = !!b.aiMentor;
    if (b.aiHintsOnly !== undefined) g.aiHintsOnly = !!b.aiHintsOnly;
    return ok({ aiMentor: g.aiMentor, aiHintsOnly: g.aiHintsOnly });
  }),
  // --- Журнал баллов (как в CRM Donish) ---
  http.get(url('/mentor/groups/:id/scores'), ({ params, request }) => {
    const group = db.groups.find((g) => g.id === params.id);
    if (!group) return fail(404, 'ENTITY_NOT_FOUND', 'Группа не найдена');
    const pos = coursePosition(group);
    const month = Number(query(request).get('month')) || pos.currentMonth;
    if (month < 1 || month > pos.currentMonth)
      return fail(400, 'VALIDATION_ERROR', 'Этот месяц ещё не начался');
    const students = db.users
      .filter((u) => u.role === 'student' && u.groupId === group.id)
      .map((u) => ({ id: u.id, name: u.name, phone: u.phone, isBlocked: u.isBlocked }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    return ok({
      group: {
        id: group.id,
        name: group.name,
        trackTitle: group.trackTitle,
        schedule: group.schedule,
      },
      month,
      ...pos,
      students,
      ...groupScores(group.id, month),
    });
  }),
  http.put(url(ENDPOINTS.mentor.scores), async ({ request }) => {
    const b = (await request.json()) as Partial<WeekScore>;
    const u = db.users.find((x) => x.id === b.studentId && x.role === 'student');
    const group = u && db.groups.find((g) => g.id === u.groupId);
    if (!u || !group) return fail(404, 'ENTITY_NOT_FOUND', 'Ученик не найден');
    const month = Number(b.month);
    const week = Number(b.week);
    const pos = coursePosition(group);
    if (
      !(month >= 1 && month <= Math.min(MONTHS, pos.currentMonth)) ||
      !(week >= 1 && week <= WEEKS)
    )
      return fail(400, 'VALIDATION_ERROR', 'Неверный месяц или неделя');
    const row = { studentId: u.id, month, week } as WeekScore;
    SCORE_KEYS.forEach((k) => {
      row[k] = clampScore(k, b[k]);
    });
    return ok(saveWeek(row));
  }),
  http.put(url(ENDPOINTS.mentor.extraExam), async ({ request }) => {
    const b = (await request.json()) as {
      studentId?: string;
      month?: number;
      passed?: boolean | null;
    };
    const u = db.users.find((x) => x.id === b.studentId && x.role === 'student');
    if (!u || !u.groupId) return fail(404, 'ENTITY_NOT_FOUND', 'Ученик не найден');
    const month = Number(b.month);
    const r = monthResult(studentScores(u.id, u.groupId, month).weeks);
    if (b.passed !== null && (!r.done || r.status !== 'extra'))
      return fail(400, 'VALIDATION_ERROR', 'Доп. экзамен только для итога 75–79');
    setExtra(u.id, month, b.passed ?? null);
    return ok({ studentId: u.id, month, passed: b.passed ?? null });
  }),
  http.get(url('/mentor/students/:id'), ({ params }) => {
    const u = db.users.find((x) => x.id === params.id);
    if (!u) return fail(404, 'ENTITY_NOT_FOUND', 'Ученик не найден');
    const share = moduleShare();
    const doneModules = Math.floor(u.progress / share);
    return ok({
      student: u,
      modules: db.modules.map((m, i) => ({
        id: m.id,
        title: m.title,
        lessonsCount: m.lessonsCount,
        completedLessons:
          i < doneModules
            ? m.lessonsCount
            : i === doneModules
              ? Math.round(((u.progress % share) / share) * m.lessonsCount)
              : 0,
        quizScore: i < doneModules ? 70 + ((i * 7 + u.xp) % 30) : null,
      })),
      submissions: db.submissions.filter((s) => s.userId === u.id),
    });
  }),
  http.get(url(ENDPOINTS.mentor.submissions), ({ request }) => {
    const q = query(request);
    const status = q.get('status');
    return ok(
      db.submissions.filter(
        (s) =>
          (!status || status === 'all' || s.status === status) &&
          matches(s.studentName + s.exerciseTitle, q.get('search')),
      ),
    );
  }),
  http.get(url('/mentor/submissions/:id'), ({ params }) => {
    const s = db.submissions.find((x) => x.id === params.id);
    return s ? ok(s) : fail(404, 'ENTITY_NOT_FOUND', 'Работа не найдена');
  }),
  http.post(url('/mentor/submissions/:id/review'), async ({ params, request }) => {
    const s = db.submissions.find((x) => x.id === params.id);
    if (!s) return fail(404, 'ENTITY_NOT_FOUND', 'Работа не найдена');
    const body = (await request.json()) as { status: 'passed' | 'failed'; feedback: string };
    Object.assign(s, body);
    return ok(s);
  }),

  // --- Онлайн-уроки ментора ---
  http.get(url(ENDPOINTS.mentor.courseLessons), () => ok(courseLessons())),
  http.get(url(ENDPOINTS.mentor.liveSessions), () => {
    const ids = new Set(mentorGroups().map((g) => g.id));
    return ok(
      db.liveSessions
        .filter((s) => ids.has(s.groupId))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    );
  }),
  http.post(url(ENDPOINTS.mentor.liveSessions), async ({ request }) => {
    const body = (await request.json()) as LiveSessionInput;
    const group = mentorGroups().find((g) => g.id === body.groupId);
    const lesson = findLesson(body.lessonId);
    if (!group || !lesson) return fail(400, 'VALIDATION_ERROR', 'Проверьте группу и урок');
    if (group.format === 'offline')
      return fail(400, 'VALIDATION_ERROR', 'Группа занимается офлайн — онлайн-урок не нужен');
    if (!isValidHttpsUrl(body.joinUrl))
      return fail(400, 'VALIDATION_ERROR', 'Ссылка на звонок должна начинаться с https://');
    const session = {
      id: `live_${Date.now()}`,
      groupId: group.id,
      groupName: group.name,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      lessonOrder: lesson.number,
      moduleTitle: lesson.moduleTitle,
      mentorName: group.mentorName ?? '—',
      startsAt: body.startsAt,
      durationMinutes: body.durationMinutes,
      joinUrl: body.joinUrl.trim(),
      provider: detectProvider(body.joinUrl),
      recordingUrl: body.recordingUrl?.trim() || null,
      isCancelled: false,
    };
    db.liveSessions.push(session);
    return ok(session);
  }),
  http.patch(url('/mentor/live-sessions/:id'), async ({ params, request }) => {
    const s = db.liveSessions.find((x) => x.id === params.id);
    if (!s) return fail(404, 'ENTITY_NOT_FOUND', 'Онлайн-урок не найден');
    const body = (await request.json()) as Partial<LiveSessionInput> & { isCancelled?: boolean };
    if (body.joinUrl !== undefined && !isValidHttpsUrl(body.joinUrl))
      return fail(400, 'VALIDATION_ERROR', 'Ссылка на звонок должна начинаться с https://');
    if (body.lessonId) {
      const lesson = findLesson(body.lessonId);
      if (lesson)
        Object.assign(s, {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonOrder: lesson.number,
          moduleTitle: lesson.moduleTitle,
        });
    }
    if (body.groupId) {
      const group = mentorGroups().find((g) => g.id === body.groupId);
      if (group) Object.assign(s, { groupId: group.id, groupName: group.name });
    }
    if (body.startsAt) s.startsAt = body.startsAt;
    if (body.durationMinutes) s.durationMinutes = body.durationMinutes;
    if (body.joinUrl)
      Object.assign(s, { joinUrl: body.joinUrl.trim(), provider: detectProvider(body.joinUrl) });
    if (body.recordingUrl !== undefined) s.recordingUrl = body.recordingUrl?.trim() || null;
    if (body.isCancelled !== undefined) s.isCancelled = body.isCancelled;
    return ok(s);
  }),
  http.delete(url('/mentor/live-sessions/:id'), ({ params }) => {
    db.liveSessions = db.liveSessions.filter((x) => x.id !== params.id);
    return ok(null);
  }),
];
