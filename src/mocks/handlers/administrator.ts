import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import { db } from '../db';
import { ok, url, query, matches } from './utils';

// Демо-администратор — ресепшн филиала Душанбе
const BRANCH = 'branch_dushanbe';
// «Пн/Ср/Пт · 14:00–16:00» → есть ли сегодняшний день в расписании
const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const isToday = (schedule: string) =>
  schedule.split(' · ')[0].split('/').includes(DAYS[new Date().getDay()]);
const timeOf = (schedule: string) => schedule.split(' · ')[1] ?? '';

export const administratorHandlers = [
  http.get(url(ENDPOINTS.administrator.dashboard), () => {
    const students = db.users.filter((u) => u.branchId === BRANCH && u.role === 'student');
    const groups = db.groups.filter((g) => g.branchId === BRANCH);
    const today = groups
      .filter((g) => isToday(g.schedule))
      .map((g) => ({
        id: g.id,
        name: g.name,
        mentorName: g.mentorName,
        time: timeOf(g.schedule),
        studentsCount: g.studentsCount,
        capacity: g.capacity,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
    return ok({
      studentsCount: students.length,
      activeCount: students.filter((s) => !s.isBlocked).length,
      groupsCount: groups.length,
      freeSeats: groups.reduce((s, g) => s + Math.max(0, g.capacity - g.studentsCount), 0),
      today,
      recent: [...students].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    });
  }),
  http.get(url(ENDPOINTS.administrator.students), ({ request }) => {
    const q = query(request);
    const groupId = q.get('groupId');
    return ok(
      db.users.filter(
        (u) =>
          u.branchId === BRANCH &&
          u.role === 'student' &&
          (!groupId || u.groupId === groupId) &&
          matches(`${u.name} ${u.phone} ${u.email}`, q.get('search')),
      ),
    );
  }),
];
