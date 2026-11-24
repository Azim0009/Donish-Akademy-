import { http } from 'msw';
import { delay } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import { AI_DAILY_LIMIT, aiAnswer, aiLog, seedAiLog } from '../ai';
import { db, findLesson } from '../db';
import { resolveMe } from '../tasks';
import { fail, ok, url } from './utils';

const today = () => new Date().toISOString().slice(0, 10);

export const aiHandlers = [
  // Вопрос ученика AI-ментору
  http.post(url(ENDPOINTS.ai.ask), async ({ request }) => {
    seedAiLog();
    const me = resolveMe(request.headers.get('X-Mock-User'), 'student');
    const u = db.users.find((x) => x.id === me.id && x.role === 'student');
    const g = u && db.groups.find((x) => x.id === u.groupId);
    if (!u || !g) return fail(404, 'ENTITY_NOT_FOUND', 'Группа не найдена');
    if (!g.aiMentor) return fail(403, 'FORBIDDEN', 'Ментор выключил AI-помощника для вашей группы');
    const b = (await request.json()) as { question?: string; lessonId?: string | null };
    const question = (b.question ?? '').trim();
    if (question.length < 3) return fail(400, 'VALIDATION_ERROR', 'Напишите вопрос');
    if (question.length > 1000)
      return fail(400, 'VALIDATION_ERROR', 'Вопрос слишком длинный — до 1000 символов');
    const used = aiLog.filter((q) => q.studentId === u.id && q.at.slice(0, 10) === today()).length;
    if (used >= AI_DAILY_LIMIT)
      return fail(
        429,
        'VALIDATION_ERROR',
        `Лимит ${AI_DAILY_LIMIT} вопросов в день. Задай вопрос ментору или продолжи завтра.`,
      );
    const lessonTitle = b.lessonId ? (findLesson(b.lessonId)?.title ?? null) : null;
    const at = new Date().toISOString();
    aiLog.unshift({
      id: `ai_q_${Date.now()}`,
      studentId: u.id,
      studentName: u.name,
      groupId: g.id,
      lessonTitle,
      question,
      at,
    });
    await delay(700); // «AI думает»
    return ok({
      answer: {
        id: `ai_a_${Date.now()}`,
        role: 'assistant',
        text: aiAnswer(question, g.aiHintsOnly, lessonTitle),
        at,
      },
      left: AI_DAILY_LIMIT - used - 1,
    });
  }),
];
