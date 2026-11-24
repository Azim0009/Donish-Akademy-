import { useEffect, useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';
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

/**
 * Monaco грузится из интернета (CDN). При плохой связи он может не загрузиться —
 * тогда вместо вечного «Загрузка…» показываем простой редактор, чтобы урок не вставал.
 */
type MonacoState = 'loading' | 'ready' | 'failed';

// У @monaco-editor/loader внутри остаётся промис без catch: при неудачной загрузке скрипта
// он даёт «необработанную ошибку». Мы её уже обработали (простой режим) — гасим только этот случай.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    const target = (e.reason as Event | undefined)?.target as HTMLScriptElement | undefined;
    if (e.reason instanceof Event && target?.src?.includes('monaco')) e.preventDefault();
  });
}
let monacoState: MonacoState = 'loading';
let monacoPromise: Promise<MonacoState> | null = null;
const LOAD_TIMEOUT = 20_000;

function loadMonaco() {
  monacoPromise ??= Promise.race([
    loader.init().then(() => 'ready' as const),
    new Promise<MonacoState>((res) => setTimeout(() => res('failed'), LOAD_TIMEOUT)),
  ])
    .catch(() => 'failed' as const)
    .then((st) => {
      monacoState = st;
      if (st === 'failed') monacoPromise = null; // в следующий раз попробуем снова
      return st;
    });
  return monacoPromise;
}

function useMonaco() {
  const [state, setState] = useState<MonacoState>(monacoState);
  useEffect(() => {
    if (state !== 'loading') return;
    let alive = true;
    loadMonaco().then((st) => alive && setState(st));
    return () => {
      alive = false;
    };
  }, [state]);
  return state;
}

/** Monaco с вкладками HTML/CSS/JS + «Сбросить» + live preview */
export function CodeEditorPanel({
  initialCode,
  height = 420,
  onChange,
  readOnly,
  layout = 'split',
}: Props) {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const [tab, setTab] = useState<Tab>('html');
  const [code, setCode] = useState<CodeFiles>(initialCode);
  const monaco = useMonaco();

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
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="ml-auto"
              leftIcon={<FiRotateCcw />}
            >
              {t('editor.reset')}
            </Button>
          )}
        </div>
        {monaco === 'failed' ? (
          <div>
            <p className="border-b border-line bg-amber-soft px-3 py-1.5 text-xs text-amber">
              {t('editor.simpleMode')}
            </p>
            <textarea
              aria-label={tab.toUpperCase()}
              value={code[tab]}
              onChange={(e) => update(e.target.value)}
              readOnly={readOnly}
              spellCheck={false}
              style={{ height: height - 28 }}
              className="block w-full resize-none bg-surface p-3 font-mono text-[13px] leading-6 text-ink focus:outline-none"
            />
          </div>
        ) : monaco === 'loading' ? (
          <div className="grid place-items-center" style={{ height }}>
            <Spinner className="h-5 w-5 text-brand" />
          </div>
        ) : (
          <Editor
            height={height}
            language={MONACO_LANG[tab]}
            value={code[tab]}
            onChange={(v) => update(v ?? '')}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            loading={<Spinner className="h-5 w-5 text-brand" />}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              readOnly,
              scrollBeyondLastLine: false,
              padding: { top: 12 },
            }}
          />
        )}
      </div>
      <LivePreview code={code} height={height + 45} />
    </div>
  );
}
