import clsx from 'clsx';
import { formatNumber } from '@/core/utils/format';

/** Название внутренней валюты Donish Academy */
export const CURRENCY = 'Doll';

/** Монета Doll: золотой кружок с зелёной «D» */
export function DollCoin({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={clsx('shrink-0', className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="11" fill="#F2B321" />
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="#C98A0B" strokeWidth="1.2" />
      <path
        d="M9 7h3.4c2.9 0 4.8 2 4.8 5s-1.9 5-4.8 5H9V7zm2.4 2.2v5.6h1c1.5 0 2.4-1.1 2.4-2.8s-.9-2.8-2.4-2.8h-1z"
        fill="#16803C"
      />
    </svg>
  );
}

/** Сумма в Doll: монета + число + «Doll» */
export function DollAmount({
  value,
  sign,
  size = 16,
  className,
}: {
  value: number;
  /** «+» перед числом (награда) */
  sign?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={clsx('inline-flex items-center gap-1 whitespace-nowrap tabular-nums', className)}
    >
      <DollCoin size={size} />
      {sign && '+'}
      {formatNumber(value)} {CURRENCY}
    </span>
  );
}
