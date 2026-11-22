import clsx from 'clsx';

/** Знак Donish — зелёный квадрат с «D» */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={clsx('shrink-0', className)} aria-hidden>
      <rect width="64" height="64" rx="16" className="fill-brand" />
      <path d="M20 16h13c9.4 0 16 6.6 16 16s-6.6 16-16 16H20V16zm9 8v16h4c4.6 0 7.5-3.2 7.5-8s-2.9-8-7.5-8h-4z" fill="#fff" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-semibold tracking-tight">Donish</span>
        <span className="text-[11px] font-medium text-brand-strong">Academy</span>
      </span>
    </span>
  );
}
