import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // обязательно для доступности
  badge?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, Props>(({ label, badge, className, children, ...props }, ref) => (
  <button
    ref={ref}
    aria-label={label}
    title={label}
    className={clsx(
      'relative inline-flex h-10 w-10 items-center justify-center rounded-ctl text-[18px] text-muted transition-colors hover:bg-sunken hover:text-ink',
      className,
    )}
    {...props}
  >
    {children}
    {!!badge && (
      <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-2xs font-semibold text-white">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
));
IconButton.displayName = 'IconButton';
