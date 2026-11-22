import clsx from 'clsx';

const palette = ['#1F9D4C', '#3E7BFA', '#E9A23B', '#9B5DE5', '#E05780', '#0FA3B1', '#6D8B74'];

function colorFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function Avatar({ name, src, size = 36, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (src) return <img src={src} alt={name} style={style} className={clsx('shrink-0 rounded-full object-cover', className)} />;
  return (
    <span
      aria-hidden
      style={{ ...style, backgroundColor: colorFor(name) }}
      className={clsx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
    >
      {initials(name)}
    </span>
  );
}
