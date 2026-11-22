import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiRotateCcw } from 'react-icons/fi';
import type { CodeFiles } from '@/core/types/models';
import { useThemeStore } from '@/core/theme/themeStore';
import { Button, Spinner } from '@/shared/ui';
import { LivePreview } from './LivePreview';

const TABS = ['html', 'css', 'js'] as const;
type Tab = (typeof TABS)[number];
const MONACO_LANG: Record<Tab, string> = { html: 'html', css: 'css', js: 'javascript' };

interface Props {
  initialCode: CodeFiles;
  height?: number;
  onChange?: (code: CodeFiles) => void;
  readOnly?: boolean;
  /** 'split' — редактор и превью рядом; 'stack' — друг под другом */
  layout?: 'split' | 'stack';
}

/** Monaco с вкладками HTML/CSS/JS + «Сбросить» + live preview */
export function CodeEditorPanel({ initialCode, height = 420, onChange, readOnly, layout = 'split' }: Props) {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const [tab, setTab] = useState<Tab>('html');
  const [code, setCode] = useState<CodeFiles>(initialCode);

  const update = (value: string) => {
    const next = { ...code, [tab]: value };
    setCode(next);
    onChange?.(next);
    // TODO: автосохранение черновика в БД (debounce)
  };

  const reset = () => {
    setCode(initialCode);
    onChange?.(initialCode);
  };

  return (
    <div className={clsx('grid gap-3', layout === 'split' && 'xl:grid-cols-2')}>
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
          {TABS.map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={clsx(
                'h-8 rounded-[8px] px-3 text-xs font-semibold uppercase tracking-wide transition-colors',
                tb === tab ? 'bg-brand-soft text-brand-strong' : 'text-muted hover:text-ink',
              )}
            >
              {tb}
            </button>
          ))}
          {!readOnly && (
            <Button variant="ghost" size="sm" onClick={reset} className="ml-auto" leftIcon={<FiRotateCcw />}>
              {t('editor.reset')}
            </Button>
          )}
        </div>
        <Editor
          height={height}
          language={MONACO_LANG[tab]}
          value={code[tab]}
          onChange={(v) => update(v ?? '')}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          loading={<Spinner className="h-5 w-5 text-brand" />}
          options={{ minimap: { enabled: false }, fontSize: 14, readOnly, scrollBeyondLastLine: false, padding: { top: 12 } }}
        />
      </div>
      <LivePreview code={code} height={height + 45} />
    </div>
  );
}
