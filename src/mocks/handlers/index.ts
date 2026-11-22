import { authHandlers } from './auth';
import { studentHandlers } from './student';
import { mentorHandlers } from './mentor';
import { directorHandlers } from './director';
import { administratorHandlers } from './administrator';
import { staffHandlers } from './staff';
import { superAdminHandlers } from './superAdmin';
import { notificationHandlers } from './notifications';
import { taskHandlers } from './tasks';

export const handlers = [
  ...authHandlers,
  ...studentHandlers,
  ...mentorHandlers,
  ...directorHandlers,
  ...administratorHandlers,
  ...staffHandlers,
  ...superAdminHandlers,
  ...notificationHandlers,
  ...taskHandlers,
];
