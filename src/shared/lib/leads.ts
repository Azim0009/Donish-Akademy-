import type { LeadSource, LeadStatus } from '@/core/types/models';
import type { BadgeTone } from '@/shared/ui';

export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'trial', 'won', 'lost'];
export const LEAD_SOURCES: LeadSource[] = [
  'instagram',
  'site',
  'telegram',
  'call',
  'walk_in',
  'referral',
];
export const leadStatusTone: Record<LeadStatus, BadgeTone> = {
  new: 'blue',
  contacted: 'gray',
  trial: 'amber',
  won: 'green',
  lost: 'red',
};
/** следующий шаг воронки — для кнопки «дальше» */
export const NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
  new: 'contacted',
  contacted: 'trial',
  trial: 'won',
};
export const isToday = (iso: string | null) =>
  !!iso && new Date(iso).toDateString() === new Date().toDateString();
