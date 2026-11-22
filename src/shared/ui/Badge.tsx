import type { ReactNode } from 'react';
import clsx from 'clsx';

export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

const tones: Record<BadgeTone, string> = {
  green: 'bg-brand-soft text-brand-strong',
  amber: 'bg-amber-soft text-amber',
  red: 'bg-danger-soft text-danger',
  blue: 'bg-info-soft text-info',
  gray: 'bg-sunken text-muted',
};

export function Badge({ tone = 'gray', children, dot }: { tone?: BadgeTone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
