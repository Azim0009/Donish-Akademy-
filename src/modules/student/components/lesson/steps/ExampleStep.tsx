import { useTranslation } from 'react-i18next';
import type { CodeFiles } from '@/core/types/models';
import { CodeEditorPanel } from '@/shared/editor/CodeEditorPanel';

/** Интерактивный пример — можно редактировать прямо в уроке */
export function ExampleStep({ code }: { code: CodeFiles }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{t('lesson.exampleHint')}</p>
      <CodeEditorPanel initialCode={code} height={320} />
    </div>
  );
}
