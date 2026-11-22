import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import { db } from '../db';
import { ok, url } from './utils';

// Демо-сотрудники работают в филиале Душанбе
const BRANCH = 'branch_dushanbe';
const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const isToday = (schedule: string) =>
  schedule.split(' · ')[0].split('/').includes(DAYS[new Date().getDay()]);

export const staffHandlers = [
  // Главная сотрудника: филиал, кому звонить, кто сегодня занимается
  http.get(url(ENDPOINTS.staff.home), () => {
    const branch = db.branches.find((b) => b.id === BRANCH)!;
    const contact = (role: 'director' | 'administrator') => {
      const u = db.users.find((x) => x.branchId === BRANCH && x.role === role);
      return u ? { name: u.name, phone: u.phone, role } : null;
    };
    return ok({
      branch: { name: branch.name, address: branch.address, phone: branch.phone },
      contacts: [contact('director'), contact('administrator')].filter(Boolean),
      today: db.groups
        .filter((g) => g.branchId === BRANCH && isToday(g.schedule))
        .map((g) => ({
          id: g.id,
          name: g.name,
          time: g.schedule.split(' · ')[1] ?? '',
          studentsCount: g.studentsCount,
        }))
        .sort((a, b) => a.time.localeCompare(b.time)),
    });
  }),
];
