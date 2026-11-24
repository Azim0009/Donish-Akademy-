import { useEffect, useRef, useState } from 'react';
import { useMatch } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiCpu, FiSend, FiX } from 'react-icons/fi';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { PATHS } from '@/core/config/paths';
import type { AiMessage } from '@/core/types/models';
import { Badge, Spinner } from '@/shared/ui';
import { learningApi } from '../api/learningApi';
import { useMyGroup } from '../hooks/useLearning';

const QUICK = ['ai.quick.flex', 'ai.quick.error', 'ai.quick.margin'];

/**
 * AI-ментор ученика: появляется, только если ментор включил его для группы.
 * На странице урока вопрос уходит с контекстом урока.
 */
export function AiMentorWidget() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const group = useMyGroup().data;
  const lessonId = useMatch(PATHS.student.lesson)?.params.lessonId ?? null;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [left, setLeft] = useState<number | null>(null);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const ask = useMutation({
    mutationFn: (q: string) => learningApi.askAi(q, lessonId),
    onSuccess: (r) => {
      setMessages((m) => [...m, r.answer]);
      setLeft(r.left);
    },
    onError: (e) => {
      setError(getApiErrorMessage(e));
      // ментор мог выключить AI — обновим данные группы
      qc.invalidateQueries({ queryKey: ['learning', 'group'] });
    },
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, ask.isPending]);

  if (!group?.aiMentor) return null;

  const send = (q = text) => {
    const question = q.trim();
    if (question.length < 3 || ask.isPending) return;
    setError('');
    setMessages((m) => [
      ...m,
      { id: `u_${Date.now()}`, role: 'user', text: question, at: new Date().toISOString() },
    ]);
    setText('');
    ask.mutate(question);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-4 font-medium text-brand-ink shadow-pop transition-colors hover:bg-brand-strong"
        >
          <FiCpu aria-hidden /> {t('ai.button')}
        </button>
      )}
      {open && (
        <section
          role="dialog"
          aria-label={t('ai.mentorTitle')}
          className="fixed inset-0 z-50 flex flex-col bg-surface sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(620px,calc(100vh-6rem))] sm:w-[400px] sm:rounded-card sm:border sm:border-line sm:shadow-pop"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand-strong">
              <FiCpu aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{t('ai.mentorTitle')}</p>
              <p className="truncate text-xs text-muted">
                {group.aiHintsOnly ? t('ai.modeHints') : t('ai.modeFull')}
              </p>
            </div>
            <button
              type="button"
              aria-label={t('common.close')}
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-sunken hover:text-ink"
            >
              <FiX />
            </button>
          </header>

          <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex flex-col gap-3">
                <p className="rounded-card bg-sunken px-3.5 py-3 text-sm">
                  {t('ai.welcome', { mentor: group.mentorName ?? t('ai.yourMentor') })}
                </p>
                {lessonId && <Badge tone="blue">{t('ai.lessonContext')}</Badge>}
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => send(t(k))}
                      className="rounded-full border border-line px-3 py-1.5 text-left text-[13px] hover:border-brand hover:text-brand-strong"
                    >
                      {t(k)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={clsx(
                  'max-w-[88%] whitespace-pre-wrap rounded-card px-3.5 py-2.5 text-sm leading-6',
                  m.role === 'user' ? 'self-end bg-brand text-brand-ink' : 'self-start bg-sunken',
                )}
              >
                {m.text}
              </div>
            ))}
            {ask.isPending && (
              <div className="flex items-center gap-2 self-start rounded-card bg-sunken px-3.5 py-2.5 text-sm text-muted">
                <Spinner className="h-4 w-4" /> {t('ai.thinking')}
              </div>
            )}
            {error && (
              <p className="rounded-card bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}
          </div>

          <form
            className="flex flex-col gap-1.5 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                aria-label={t('ai.placeholder')}
                placeholder={t('ai.placeholder')}
                rows={2}
                maxLength={1000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="min-h-[44px] flex-1 resize-none rounded-ctl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="submit"
                aria-label={t('ai.send')}
                disabled={text.trim().length < 3 || ask.isPending}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-ctl bg-brand text-brand-ink transition-colors hover:bg-brand-strong disabled:opacity-40"
              >
                <FiSend />
              </button>
            </div>
            <p className="text-2xs text-muted">
              {left !== null ? t('ai.left', { count: left }) : t('ai.disclaimer')}
            </p>
          </form>
        </section>
      )}
    </>
  );
}
