import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LeadSource } from '@/core/types/models';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { LEAD_SOURCES } from '@/shared/lib/leads';
import { Button, Input, Modal, Select, Textarea, toast } from '@/shared/ui';
import { useCreateLead } from '../api/leadsApi';

const PHONE_RE = /^\+?[\d\s()-]{9,20}$/;

/** Новый лид: имя, телефон, откуда пришёл, какой курс интересует */
export function LeadFormModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const create = useCreateLead();
  const [f, setF] = useState({
    name: '',
    phone: '+992 ',
    source: 'instagram' as LeadSource,
    course: 'Fullstack + AI',
    comment: '',
  });
  const [tried, setTried] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  const errName = tried && f.name.trim().length < 2 ? t('validation.min2') : undefined;
  const errPhone = tried && !PHONE_RE.test(f.phone.trim()) ? t('validation.phone') : undefined;

  const submit = () => {
    setTried(true);
    if (f.name.trim().length < 2 || !PHONE_RE.test(f.phone.trim())) return;
    create.mutate(f, {
      onSuccess: (l) => {
        toast(t('leads.created', { name: l.name }), 'success');
        onClose();
      },
      onError: (e) => toast(getApiErrorMessage(e), 'error'),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('leads.new')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            {t('leads.add')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t('common.fullName')}
          value={f.name}
          onChange={set('name')}
          error={errName}
          autoFocus
          maxLength={80}
        />
        <Input
          label={t('branch.phone')}
          value={f.phone}
          onChange={set('phone')}
          error={errPhone}
          inputMode="tel"
          placeholder="+992 90 000 00 00"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('leads.source')}
            value={f.source}
            onChange={set('source')}
            options={LEAD_SOURCES.map((s) => ({ value: s, label: t(`leads.src.${s}`) }))}
          />
          <Input
            label={t('leads.course')}
            value={f.course}
            onChange={set('course')}
            maxLength={60}
          />
        </div>
        <Textarea
          label={t('leads.comment')}
          value={f.comment}
          onChange={set('comment')}
          rows={3}
          maxLength={500}
          placeholder={t('leads.commentPh')}
        />
      </div>
    </Modal>
  );
}
