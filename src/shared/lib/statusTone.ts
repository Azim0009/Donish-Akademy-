import type { BadgeTone } from '@/shared/ui';
import type { AuditAction, BranchStatus, SubmissionStatus } from '@/core/types/models';

export const branchStatusTone: Record<BranchStatus, BadgeTone> = { active: 'green', suspended: 'amber', draft: 'blue', archived: 'gray' };
export const submissionTone: Record<SubmissionStatus, BadgeTone> = { pending: 'amber', passed: 'green', failed: 'red' };
export const auditTone: Record<AuditAction, BadgeTone> = {
  Create: 'green',
  Update: 'blue',
  Delete: 'red',
  AssignRole: 'blue',
  Login: 'gray',
  ChangeStatus: 'amber',
  Block: 'red',
};
