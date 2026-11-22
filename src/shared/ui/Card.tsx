import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-card border border-line bg-surface', className)} {...props} />;
}

interface SectionProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Карточка-секция с заголовком и действием справа */
export function Section({ title, description, action, children, className, bodyClassName }: SectionProps) {
  return (
    <Card className={clsx('flex min-w-0 flex-col', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
            {description && <p className="text-[13px] text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={clsx('flex-1 px-5 pb-5 pt-3', bodyClassName)}>{children}</div>
    </Card>
  );
}
