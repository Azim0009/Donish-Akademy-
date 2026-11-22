import { Fragment, type ReactNode } from 'react';

/** Мини-рендер markdown: ## заголовки, - списки, абзацы, `код`. TODO: заменить на react-markdown */
function inline(text: string): ReactNode {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') ? (
      <code key={i} className="rounded bg-sunken px-1.5 py-0.5 text-[0.9em] text-brand-strong">
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function TheoryStep({ content }: { content: string }) {
  const blocks = content.split('\n\n');
  return (
    <article className="max-w-[68ch] text-[16px] leading-7">
      {blocks.map((b, i) => {
        if (b.startsWith('### ')) return <h3 key={i} className="mb-2 mt-6 text-lg font-semibold">{b.slice(4)}</h3>;
        if (b.startsWith('## ')) return <h2 key={i} className="h-display mb-3 text-2xl">{b.slice(3)}</h2>;
        if (b.startsWith('- '))
          return (
            <ul key={i} className="my-3 flex flex-col gap-2">
              {b.split('\n').map((li) => (
                <li key={li} className="flex gap-3">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{inline(li.slice(2))}</span>
                </li>
              ))}
            </ul>
          );
        return <p key={i} className="my-3 text-ink/90">{inline(b)}</p>;
      })}
    </article>
  );
}
