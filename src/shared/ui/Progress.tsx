import clsx from 'clsx';

export function ProgressBar({ value, className, tone = 'brand', size = 'md' }: { value: number; className?: string; tone?: 'brand' | 'amber' | 'danger'; size?: 'sm' | 'md' }) {
  const v = Math.max(0, Math.min(100, value));
  const bar = { brand: 'bg-brand', amber: 'bg-amber', danger: 'bg-danger' }[tone];
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      className={clsx('w-full overflow-hidden rounded-full bg-sunken', size === 'sm' ? 'h-1.5' : 'h-2', className)}
    >
      <div className={clsx('h-full rounded-full transition-[width] duration-500', bar)} style={{ width: `${v}%` }} />
    </div>
  );
}

/** Кольцевой прогресс */
export function ProgressRing({ value, size = 56, stroke = 6, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-sunken" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len - (len * value) / 100}
          className="stroke-brand transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute text-[13px] font-semibold">{label ?? `${value}%`}</span>
    </div>
  );
}
