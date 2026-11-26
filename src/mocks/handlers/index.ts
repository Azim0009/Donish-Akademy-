import { authHandlers } from './auth';
import { studentHandlers } from './student';
import { mentorHandlers } from './mentor';
import { directorHandlers } from './director';
import { administratorHandlers } from './administrator';
import { staffHandlers } from './staff';
import { superAdminHandlers } from './superAdmin';
import { notificationHandlers } from './notifications';
import { taskHandlers } from './tasks';
import { leadHandlers } from './leads';
import { partnerHandlers } from './partners';
import { aiHandlers } from './ai';
import { inventoryHandlers } from './inventory';
import { accountingHandlers } from './accounting';

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
  ...leadHandlers,
  ...partnerHandlers,
  ...aiHandlers,
  ...inventoryHandlers,
  ...accountingHandlers,
];
