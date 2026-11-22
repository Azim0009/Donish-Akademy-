import { Fragment } from 'react';
import clsx from 'clsx';

/** Текст договора: абзацы как в документе, незаполненные поля [поле] — подсвечены */
export function ContractText({
  title,
  body,
  className,
}: {
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <article
      className={clsx(
        'rounded-card border border-line bg-surface px-6 py-5 font-serif text-[15px] leading-7',
        className,
      )}
    >
      <h3 className="mb-4 text-center text-base font-bold">{title}</h3>
      {body.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="mb-3 whitespace-pre-line">
          {p.split(/(\[[^\]\n]+\])/g).map((part, j) =>
            /^\[[^\]]+\]$/.test(part) ? (
              <mark key={j} className="rounded bg-amber-soft px-1 text-amber">
                {part}
              </mark>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </p>
      ))}
    </article>
  );
}
