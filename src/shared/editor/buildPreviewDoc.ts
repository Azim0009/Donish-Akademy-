import type { CodeFiles } from '@/core/types/models';

/** Собирает HTML/CSS/JS ученика в один документ для iframe */
export function buildPreviewDoc({ html, css, js }: CodeFiles): string {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><style>${css}</style></head>
  <body>
    ${html}
    <script>${js.replace(/<\/script>/gi, '<\\/script>')}</script>
  </body>
</html>`;
}
