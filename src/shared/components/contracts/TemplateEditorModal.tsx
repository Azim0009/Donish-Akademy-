import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiEye, FiEdit3 } from 'react-icons/fi';
import type { ContractTemplate } from '@/core/types/models';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { Button, Input, Modal, Tabs, toast } from '@/shared/ui';
import { CONTRACT_FIELDS, fillContract, todayRu } from '@/shared/lib/contracts';
import { ContractText } from './ContractText';

/**
 * Редактор шаблона договора. Поля {{...}} вставляются кнопками —
 * в каждом договоре они заменятся данными сотрудника (ФИО, филиал, телефон…).
 */
export function TemplateEditorModal({
  template,
  onClose,
  onSave,
}: {
  template: ContractTemplate;
  onClose: () => void;
  onSave: (b: { title: string; body: string }) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(template.title);
  const [body, setBody] = useState(template.body);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const insert = (field: string) => {
    const el = ref.current;
    const token = `{{${field}}}`;
    if (!el) return setBody((b) => b + token);
    const { selectionStart: s, selectionEnd: e } = el;
    setBody(body.slice(0, s) + token + body.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + token.length, s + token.length);
    });
  };

  // пример данных, чтобы увидеть, как будет выглядеть готовый договор
  const sample = {
    fullName: 'Фаридун Рахимов',
    firstName: 'Фаридун',
    lastName: 'Рахимов',
    position: t(`roles.${template.role}`),
    branch: 'Душанбе',
    branchAddress: 'г. Душанбе, пр. Рудаки, 84',
    city: 'Душанбе',
    phone: '+992 90 123 45 67',
    login: 'faridun.rakhimov@donish.tj',
    date: todayRu(),
  };

  const submit = async () => {
    if (title.trim().length < 3 || body.trim().length < 20)
      return toast(t('contracts.tooShort'), 'error');
    setSaving(true);
    try {
      await onSave({ title: title.trim(), body });
      toast(t('contracts.templateSaved'), 'success');
      onClose();
    } catch (e) {
      toast(getApiErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={t('contracts.editTemplate', { role: t(`roles.${template.role}`) })}
      description={t('contracts.editHint')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={saving}>
            {t('common.saveChanges')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t('contracts.docTitle')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
        />
        <Tabs<'edit' | 'preview'>
          value={view}
          onChange={setView}
          tabs={[
            { value: 'edit', label: t('contracts.text'), icon: <FiEdit3 /> },
            { value: 'preview', label: t('contracts.preview'), icon: <FiEye /> },
          ]}
        />
        {view === 'edit' ? (
          <>
            <div>
              <p className="mb-2 text-[13px] text-muted">{t('contracts.insertField')}</p>
              <div className="flex flex-wrap gap-1.5">
                {CONTRACT_FIELDS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => insert(f)}
                    className="rounded-full border border-line px-2.5 py-1 text-xs font-medium hover:border-brand hover:bg-brand-soft hover:text-brand-strong"
                  >
                    + {t(`contracts.fields.${f}`)}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              ref={ref}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
              aria-label={t('contracts.text')}
              className="min-h-[420px] w-full rounded-ctl border border-line bg-surface p-3 font-mono text-[13px] leading-6 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </>
        ) : (
          <ContractText title={title} body={fillContract(body, sample)} />
        )}
      </div>
    </Modal>
  );
}
