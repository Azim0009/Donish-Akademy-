import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CodeFiles } from '@/core/types/models';
import { buildPreviewDoc } from './buildPreviewDoc';

/**
 * Превью кода в изолированном iframe.
 * sandbox="allow-scripts" БЕЗ allow-same-origin — код ученика не видит токены и состояние приложения.
 */
export function LivePreview({ code, delay = 400, height = 420 }: { code: CodeFiles; delay?: number; height?: number }) {
  const { t } = useTranslation();
  const [doc, setDoc] = useState(() => buildPreviewDoc(code));

  useEffect(() => {
    const id = setTimeout(() => setDoc(buildPreviewDoc(code)), delay); // debounce
    return () => clearTimeout(id);
  }, [code, delay]);

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand/80" />
        </span>
        <span className="text-xs text-muted">{t('editor.preview')}</span>
      </div>
      <iframe title="preview" sandbox="allow-scripts" srcDoc={doc} className="w-full flex-1 bg-white" style={{ minHeight: height - 45 }} />
    </div>
  );
}
