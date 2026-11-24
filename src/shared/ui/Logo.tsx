import clsx from 'clsx';
import mark from '@/assets/logo-mark.png';

/** Знак Donish Academy — зелёная «D» (фирменный логотип) */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src={mark}
      width={size}
      height={size}
      alt=""
      aria-hidden
      draggable={false}
      className={clsx('shrink-0 select-none object-contain', className)}
    />
  );
}

/** Логотип: знак + «DONISH / ACADEMY», как на фирменном логотипе */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2', className)} aria-label="Donish Academy">
      <LogoMark />
      <span className="flex flex-col leading-none" aria-hidden>
        <span className="font-display text-[15px] font-bold uppercase tracking-[0.14em] text-brand-strong">
          Donish
        </span>
        <span className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.42em] text-muted">Academy</span>
      </span>
    </span>
  );
}
