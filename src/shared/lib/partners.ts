import type { BadgeTone } from '@/shared/ui';
import type { CourseLevel, PartnerStudentStatus } from '@/core/types/models';
import { PATHS } from '@/core/config/paths';

export const COURSE_LEVELS: CourseLevel[] = ['beginner', 'intermediate', 'advanced'];

/** Полная ссылка партнёра для учеников */
export const partnerLink = (code: string) =>
  `${window.location.origin}${PATHS.partnerPage.replace(':code', code)}`;

export const partnerStudentTone: Record<PartnerStudentStatus, BadgeTone> = {
  new: 'blue',
  enrolled: 'green',
  rejected: 'gray',
};

export const formatTjs = (n: number) => `${n.toLocaleString('ru-RU')} TJS`;
