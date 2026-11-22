import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Group, LiveSession } from '@/core/types/models';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { Badge, Button, Input, Modal, Select, toast } from '@/shared/ui';
import { detectProvider, isValidHttpsUrl, PROVIDER_LABEL, toEmbedUrl } from '@/shared/lib/liveSession';
import { useCourseLessons, useSaveLiveSession } from '../api/mentorApi';

const pad = (n: number) => String(n).padStart(2, '0');
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export type LiveModalMode = { kind: 'create' } | { kind: 'edit'; session: LiveSession } | { kind: 'recording'; session: LiveSession };

/** Создать / изменить онлайн-урок, или добавить запись после урока */
export function LiveSessionModal({ mode, groups, onClose }: { mode: LiveModalMode; groups: Group[]; onClose: () => void }) {
  const { t } = useTranslation();
  const lessons = useCourseLessons();
  const save = useSaveLiveSession();
  const s = mode.kind === 'create' ? null : mode.session;
  const start = s ? new Date(s.startsAt) : null;

  const [form, setForm] = useState({
    groupId: s?.groupId ?? groups[0]?.id ?? '',
    lessonId: s?.lessonId ?? '',
    date: start ? localDate(start) : localDate(new Date()),
    time: start ? localTime(start) : '14:00',
    duration: String(s?.durationMinutes ?? 120),
    joinUrl: s?.joinUrl ?? '',
    recordingUrl: s?.recordingUrl ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };

  const lessonOptions = useMemo(
    () => (lessons.data ?? []).map((l) => ({ value: l.id, label: `${l.number}. ${l.title} — ${l.moduleTitle.split(' · ')[0]}` })),
    [lessons.data],
  );
  const provider = form.joinUrl ? detectProvider(form.joinUrl) : null;
  const onlyRecording = mode.kind === 'recording';

  const validate = () => {
    const e: Record<string, string> = {};
    if (!onlyRecording) {
      if (!form.groupId) e.groupId = t('validation.required');
      if (!form.lessonId) e.lessonId = t('validation.required');
      if (!form.date) e.date = t('validation.required');
      if (!/^\d{2}:\d{2}$/.test(form.time)) e.time = t('validation.required');
      const d = Number(form.duration);
      if (!Number.isInteger(d) || d < 15 || d > 300) e.duration = t('live.durationError');
      if (!isValidHttpsUrl(form.joinUrl)) e.joinUrl = t('live.linkError');
    }
    if (form.recordingUrl.trim() && !toEmbedUrl(form.recordingUrl)) e.recordingUrl = t('live.recordingError');
    if (onlyRecording && !form.recordingUrl.trim()) e.recordingUrl = t('validation.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const recordingUrl = form.recordingUrl.trim() || null;
    const body = onlyRecording
      ? { recordingUrl }
      : {
          groupId: form.groupId,
          lessonId: form.lessonId,
          startsAt: new Date(`${form.date}T${form.time}:00`).toISOString(),
          durationMinutes: Number(form.duration),
          joinUrl: form.joinUrl.trim(),
          recordingUrl,
        };
    save.mutate(
      { id: s?.id, body },
      {
        onSuccess: () => {
          toast(t(onlyRecording ? 'live.recordingSaved' : s ? 'live.updated' : 'live.created'), 'success');
          onClose();
        },
        onError: (err) => toast(getApiErrorMessage(err)),
      },
    );
  };

  const title = mode.kind === 'create' ? t('live.create') : mode.kind === 'edit' ? t('live.edit') : t('live.addRecording');
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={s ? `${s.groupName} · ${t('live.lessonN', { n: s.lessonOrder })}. ${s.lessonTitle}` : t('live.createHint')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={submit} loading={save.isPending}>{t('common.saveChanges')}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!onlyRecording && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label={t('live.group')} id="live-group" value={form.groupId} onChange={set('groupId')} options={groups.map((g) => ({ value: g.id, label: g.name }))} error={errors.groupId} />
              <Input label={t('live.durationLabel')} id="live-duration" type="number" min={15} max={300} step={15} value={form.duration} onChange={set('duration')} error={errors.duration} />
            </div>
            <Select label={t('live.lesson')} id="live-lesson" value={form.lessonId} onChange={set('lessonId')} options={lessonOptions} placeholder={t('common.choose')} error={errors.lessonId} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t('live.date')} id="live-date" type="date" value={form.date} onChange={set('date')} error={errors.date} />
              <Input label={t('live.time')} id="live-time" type="time" value={form.time} onChange={set('time')} error={errors.time} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Input
                label={t('live.joinUrl')}
                id="live-url"
                type="url"
                inputMode="url"
                placeholder="https://meet.google.com/abc-defg-hij"
                value={form.joinUrl}
                onChange={set('joinUrl')}
                error={errors.joinUrl}
                hint={t('live.joinUrlHint')}
              />
              {provider && isValidHttpsUrl(form.joinUrl) && (
                <span className="text-[13px] text-muted">
                  {t('live.detected')} <Badge tone={provider === 'other' ? 'gray' : 'green'}>{PROVIDER_LABEL[provider]}</Badge>
                </span>
              )}
            </div>
          </>
        )}
        <Input
          label={t('live.recordingUrl')}
          id="live-recording"
          type="url"
          inputMode="url"
          placeholder="https://youtu.be/…"
          value={form.recordingUrl}
          onChange={set('recordingUrl')}
          error={errors.recordingUrl}
          hint={t('live.recordingUrlHint')}
        />
      </div>
    </Modal>
  );
}
