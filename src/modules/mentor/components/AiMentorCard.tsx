import { useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiCpu } from 'react-icons/fi';
import { timeAgo } from '@/core/utils/format';
import { Badge, Card, Switch, toast } from '@/shared/ui';
import { useGroupAi, useSetGroupAi } from '../api/mentorApi';

/** Ментор включает и выключает AI-помощника для группы и видит, о чём спрашивают ученики */
export function AiMentorCard({ groupId }: { groupId: string }) {
  const { t } = useTranslation();
  const { data } = useGroupAi(groupId);
  const save = useSetGroupAi(groupId);
  const [open, setOpen] = useState(false);
  if (!data) return null;

  const set = (b: { aiMentor?: boolean; aiHintsOnly?: boolean }, msg: string) =>
    save.mutate(b, { onSuccess: () => toast(msg, 'success') });

  return (
    <Card className="mb-5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={clsx(
              'grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg',
              data.aiMentor ? 'bg-brand-soft text-brand-strong' : 'bg-sunken text-muted',
            )}
          >
            <FiCpu aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{t('ai.mentorTitle')}</p>
              <Badge tone={data.aiMentor ? 'green' : 'gray'}>
                {data.aiMentor ? t('ai.on') : t('ai.off')}
              </Badge>
            </div>
            <p className="text-sm text-muted">{t('ai.mentorHint')}</p>
            {data.aiMentor && (
              <p className="mt-1 text-[13px]">
                {t('ai.weekStats', { count: data.weekCount, students: data.askedStudents })}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:w-80">
          <Switch
            checked={data.aiMentor}
            label={t('ai.enable')}
            description={t('ai.enableHint')}
            onChange={(v) => set({ aiMentor: v }, t(v ? 'ai.enabledToast' : 'ai.disabledToast'))}
          />
          {data.aiMentor && (
            <Switch
              checked={data.aiHintsOnly}
              label={t('ai.hintsOnly')}
              description={t('ai.hintsOnlyHint')}
              onChange={(v) =>
                set({ aiHintsOnly: v }, t(v ? 'ai.hintsOnToast' : 'ai.hintsOffToast'))
              }
            />
          )}
        </div>
      </div>
      {data.recent.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-strong"
          >
            {t('ai.recentQuestions')}
            <FiChevronDown
              className={clsx('transition-transform', open && 'rotate-180')}
              aria-hidden
            />
          </button>
          {open && (
            <ul className="mt-2 flex flex-col divide-y divide-line">
              {data.recent.map((q) => (
                <li key={q.id} className="py-2">
                  <p className="text-sm">«{q.question}»</p>
                  <p className="text-xs text-muted">
                    {q.studentName} · {timeAgo(q.at)}
                    {q.lessonTitle && ` · ${q.lessonTitle}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
