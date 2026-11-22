import type { ReactNode } from 'react';
import clsx from 'clsx';
import { FiArrowDownRight, FiArrowUpRight } from 'react-icons/fi';
import { Card } from './Card';

interface Props {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  delta?: number; // % изменения
  hint?: string;
  tone?: 'brand' | 'amber' | 'info' | 'danger';
}

const tones = {
  brand: 'bg-brand-soft text-brand-strong',
  amber: 'bg-amber-soft text-amber',
  info: 'bg-info-soft text-info',
  danger: 'bg-danger-soft text-danger',
};

export function StatCard({ label, value, icon, delta, hint, tone = 'brand' }: Props) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-muted">{label}</span>
        {icon && <span className={clsx('flex h-9 w-9 items-center justify-center rounded-ctl text-lg', tones[tone])}>{icon}</span>}
      </div>
      <div className="h-display text-[26px] leading-none">{value}</div>
      {(delta !== undefined || hint) && (
        <div className="flex items-center gap-1.5 text-[13px]">
          {delta !== undefined && (
            <span className={clsx('inline-flex items-center font-medium', delta >= 0 ? 'text-brand-strong' : 'text-danger')}>
              {delta >= 0 ? <FiArrowUpRight /> : <FiArrowDownRight />}
              {Math.abs(delta)}%
            </span>
          )}
          {hint && <span className="text-muted">{hint}</span>}
        </div>
      )}
    </Card>
  );
}
