import { useState, type ReactNode } from 'react';
import { generatePath, Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiClock, FiCode, FiEdit2, FiHelpCircle, FiPlus, FiVideo } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loader,
  Modal,
  PageHeader,
  toast,
} from '@/shared/ui';
import { useDirectorLessons, useCreateLesson } from '../api/directorApi';

function Indicator({ on, icon, label }: { on: boolean; icon: ReactNode; label: string }) {
  return (
    <span
      title={label}
      aria-label={label}
      className={clsx(
        'flex h-7 w-7 items-center justify-center rounded-full text-sm',
        on ? 'bg-brand-soft text-brand-strong' : 'bg-sunken text-muted/50',
      )}
    >
      {icon}
    </span>
  );
}

export default function LessonsDirectorPage() {
  const { t } = useTranslation();
  const { moduleId = '' } = useParams();
  const { data, isLoading, isError, refetch } = useDirectorLessons(moduleId);
  const create = useCreateLesson(moduleId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(6);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const { module: m, track } = data;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        back={{
          to: generatePath(PATHS.director.trackModules, { trackId: track.id }),
          label: track.title,
        }}
        title={m.title}
        description={m.description}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => setOpen(true)}>
            {t('lessonsDirector.create')}
          </Button>
        }
      />
      <Card>
        {m.lessons.length === 0 ? (
          <EmptyState
            title={t('lessonsDirector.empty')}
            action={<Button onClick={() => setOpen(true)}>{t('lessonsDirector.create')}</Button>}
          />
        ) : (
          <ol className="divide-y divide-line">
            {m.lessons.map((l) => (
              <li key={l.id}>
                <Link
                  to={generatePath(PATHS.director.lessonEdit, { lessonId: l.id })}
                  className="group flex items-center gap-4 px-4 py-3.5 hover:bg-sunken/50 sm:px-5"
                >
                  <span className="w-6 text-center text-sm text-muted">{l.order}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium group-hover:text-brand-strong">
                      {l.title}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <FiClock /> {t('common.minutes', { count: l.durationMinutes })}
                    </span>
                  </span>
                  <span className="hidden gap-1.5 sm:flex">
                    <Indicator on={l.hasVideo} icon={<FiVideo />} label={t('lesson.steps.video')} />
                    <Indicator
                      on={l.hasExercise}
                      icon={<FiCode />}
                      label={t('lesson.steps.practice')}
                    />
                    <Indicator
                      on={l.quizCount > 0}
                      icon={<FiHelpCircle />}
                      label={t('lessonsDirector.quizCount', { count: l.quizCount })}
                    />
                  </span>
                  <FiEdit2 className="text-muted group-hover:text-ink" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('lessonsDirector.create')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={title.trim().length < 2}
              loading={create.isPending}
              onClick={() =>
                create.mutate(
                  { title, durationMinutes: duration },
                  {
                    onSuccess: () => {
                      toast(t('lessonsDirector.created'));
                      setOpen(false);
                      setTitle('');
                    },
                  },
                )
              }
            >
              {t('lessonsDirector.create')}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Input
            label={t('lessonsDirector.title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label={t('lessonsDirector.duration')}
            type="number"
            min={2}
            max={20}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
      </Modal>
    </div>
  );
}
