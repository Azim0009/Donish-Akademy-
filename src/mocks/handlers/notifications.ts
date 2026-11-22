import { http } from 'msw';
import { ENDPOINTS } from '@/core/api/endpoints';
import { db } from '../db';
import { ok, url, roleOf } from './utils';

export const notificationHandlers = [
  http.get(url(ENDPOINTS.notifications.list), ({ request }) =>
    ok(db.notifications[roleOf(request)]),
  ),
  http.patch(url('/notifications/:id/read'), ({ request, params }) => {
    const n = db.notifications[roleOf(request)].find((x) => x.id === params.id);
    if (n) n.isRead = true;
    return ok(null);
  }),
  http.post(url(ENDPOINTS.notifications.readAll), ({ request }) => {
    db.notifications[roleOf(request)].forEach((n) => (n.isRead = true));
    return ok(null);
  }),
];
