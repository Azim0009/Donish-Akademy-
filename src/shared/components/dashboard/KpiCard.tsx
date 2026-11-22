import type { ReactNode } from 'react';
import clsx from 'clsx';
import { FiArrowDownRight, FiArrowUpRight } from 'react-icons/fi';
import { Card } from '@/shared/ui';

/** Карточка показателя как в макете: иконка в круге, значение, рост к прошлому периоду */
export function KpiCard({
  icon,
  label,
  value,
  delta,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  delta?: number;
  hint?: string;
}) {
  return (
    <Card className="flex min-w-0 flex-col gap-3 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-lg text-brand-strong">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] text-muted">{label}</p>
          <p className="h-display mt-0.5 truncate text-[22px] leading-tight">{value}</p>
        </div>
      </div>
      {delta !== undefined && (
        <p className="flex items-center gap-1.5 text-xs">
          <span
            className={clsx(
              'inline-flex items-center font-semibold',
              delta >= 0 ? 'text-brand-strong' : 'text-danger',
            )}
          >
            {delta >= 0 ? <FiArrowUpRight /> : <FiArrowDownRight />}
            {Math.abs(delta)}%
          </span>
          {hint && <span className="truncate text-muted">{hint}</span>}
        </p>
      )}
    </Card>
  );
}
