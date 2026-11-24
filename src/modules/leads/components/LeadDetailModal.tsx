import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import {
  FiArrowRight,
  FiCheck,
  FiEdit3,
  FiMessageCircle,
  FiPhone,
  FiPhoneCall,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';
import clsx from 'clsx';
import type { Lead, LeadStatus } from '@/core/types/models';
import { formatDateTime, timeAgo } from '@/core/utils/format';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { whatsappLink } from '@/shared/lib/credentials';
import { LEAD_STATUSES, NEXT_STATUS } from '@/shared/lib/leads';
import { Button, Input, Modal, Textarea, toast } from '@/shared/ui';
import { useLeadNote, useUpdateLead } from '../api/leadsApi';

const NOTE_ICON: Record<Lead['notes'][number]['kind'], IconType> = {
  call: FiPhoneCall,
  note: FiEdit3,
  status: FiRefreshCw,
};

/** Карточка лида: позвонить / WhatsApp, история, перевод по воронке, пробный урок, отказ */
export function LeadDetailModal({
  lead,
  readOnly,
  onClose,
}: {
  lead: Lead;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateLead();
  const addNote = useLeadNote();
  const [text, setText] = useState('');
  const [step, setStep] = useState<null | 'trial' | 'lost'>(null);
  const [trialAt, setTrialAt] = useState(lead.trialAt?.slice(0, 16) ?? '');
  const [reason, setReason] = useState('');
  const err = (e: unknown) => toast(getApiErrorMessage(e), 'error');

  const move = (status: LeadStatus, extra: Partial<Lead> = {}) =>
    update.mutate(
      { id: lead.id, status, ...extra },
      {
        onSuccess: () => (toast(t(`leads.moved.${status}`), 'success'), setStep(null)),
        onError: err,
      },
    );
  const next = NEXT_STATUS[lead.status];
  const onNext = () => (next === 'trial' ? setStep('trial') : next && move(next));
  const log = (kind: 'call' | 'note') => {
    if (!text.trim()) return;
    addNote.mutate({ id: lead.id, text, kind }, { onSuccess: () => setText(''), onError: err });
  };
  const wa = whatsappLink(
    lead.phone,
    t('leads.waText', { name: lead.name.split(' ')[1] ?? lead.name, course: lead.course }),
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={lead.name}
      description={`${t(`leads.src.${lead.source}`)} · ${lead.course} · ${timeAgo(lead.createdAt)}`}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>
            <Button leftIcon={<FiPhone />}>{lead.phone}</Button>
          </a>
          <a href={wa} target="_blank" rel="noreferrer">
            <Button variant="secondary" leftIcon={<FiMessageCircle />}>
              WhatsApp
            </Button>
          </a>
          <span className="ml-auto text-xs text-muted">
            {lead.assignedToName
              ? t('leads.responsible', { name: lead.assignedToName })
              : t('leads.noOne')}
          </span>
        </div>

        {/* воронка */}
        <div>
          <p className="mb-2 text-[13px] font-medium text-muted">{t('leads.stage')}</p>
          <ol className="flex flex-wrap gap-1.5">
            {LEAD_STATUSES.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  disabled={readOnly || update.isPending || s === lead.status}
                  onClick={() =>
                    s === 'trial' ? setStep('trial') : s === 'lost' ? setStep('lost') : move(s)
                  }
                  className={clsx(
                    'rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-default',
                    s === lead.status
                      ? 'border-brand bg-brand text-brand-ink'
                      : 'border-line enabled:hover:border-brand/50 enabled:hover:bg-brand-soft/50',
                    readOnly && s !== lead.status && 'opacity-50',
                  )}
                >
                  {t(`leads.st.${s}`)}
                </button>
              </li>
            ))}
          </ol>
          {lead.status === 'trial' && lead.trialAt && (
            <p className="mt-2 text-sm">
              {t('leads.trialAt')}: <b>{formatDateTime(lead.trialAt)}</b>
            </p>
          )}
          {lead.status === 'lost' && lead.lostReason && (
            <p className="mt-2 text-sm text-danger">
              {t('leads.lostReason')}: {lead.lostReason}
            </p>
          )}
        </div>

        {step === 'trial' && (
          <div className="flex flex-wrap items-end gap-2 rounded-ctl bg-sunken p-3">
            <Input
              label={t('leads.trialAt')}
              type="datetime-local"
              value={trialAt}
              onChange={(e) => setTrialAt(e.target.value)}
              className="min-w-[220px] flex-1"
            />
            <Button variant="secondary" onClick={() => setStep(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!trialAt}
              loading={update.isPending}
              onClick={() => move('trial', { trialAt: new Date(trialAt).toISOString() })}
            >
              {t('leads.bookTrial')}
            </Button>
          </div>
        )}
        {step === 'lost' && (
          <div className="flex flex-wrap items-end gap-2 rounded-ctl bg-sunken p-3">
            <Input
              label={t('leads.lostReason')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('leads.lostPh')}
              className="min-w-[220px] flex-1"
              maxLength={120}
            />
            <Button variant="secondary" onClick={() => setStep(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={!reason.trim()}
              loading={update.isPending}
              onClick={() => move('lost', { lostReason: reason.trim() })}
            >
              {t('leads.markLost')}
            </Button>
          </div>
        )}

        {!readOnly && !step && next && (
          <div className="flex flex-wrap gap-2">
            <Button
              leftIcon={next === 'won' ? <FiCheck /> : <FiArrowRight />}
              onClick={onNext}
              loading={update.isPending}
            >
              {t(`leads.next.${next}`)}
            </Button>
            <Button variant="secondary" leftIcon={<FiX />} onClick={() => setStep('lost')}>
              {t('leads.markLost')}
            </Button>
          </div>
        )}
        {lead.status === 'won' && (
          <p className="rounded-ctl bg-brand-soft/60 px-3 py-2 text-sm text-brand-strong">
            {t('leads.wonHint')}
          </p>
        )}

        {/* история */}
        <div>
          <p className="mb-2 text-[13px] font-medium text-muted">{t('leads.history')}</p>
          {lead.notes.length === 0 ? (
            <p className="text-sm text-muted">{t('leads.noHistory')}</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {[...lead.notes].reverse().map((n) => {
                const Icon = NOTE_ICON[n.kind];
                return (
                  <li key={n.id} className="flex gap-2.5 text-sm">
                    <span
                      className={clsx(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full',
                        n.kind === 'status'
                          ? 'bg-brand-soft text-brand-strong'
                          : 'bg-sunken text-muted',
                      )}
                    >
                      <Icon />
                    </span>
                    <div className="min-w-0">
                      <p className="whitespace-pre-line">{n.text}</p>
                      <p className="text-xs text-muted">
                        {n.authorName} · {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!readOnly && (
            <div className="mt-3 flex flex-col gap-2">
              <Textarea
                aria-label={t('leads.writeNote')}
                placeholder={t('leads.writeNote')}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                maxLength={1000}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<FiPhoneCall />}
                  disabled={!text.trim() || addNote.isPending}
                  onClick={() => log('call')}
                >
                  {t('leads.logCall')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<FiEdit3 />}
                  disabled={!text.trim() || addNote.isPending}
                  onClick={() => log('note')}
                >
                  {t('leads.logNote')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
