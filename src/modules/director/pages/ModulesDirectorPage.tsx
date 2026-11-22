import { useEffect, useState } from 'react';
import { generatePath, Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowDown, FiArrowUp, FiChevronRight, FiPlus } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import type { TrackModule } from '@/core/types/models';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Loader,
  Modal,
  PageHeader,
  Textarea,
  toast,
} from '@/shared/ui';
import { useDirectorModules, useCreateModule, useReorderModules } from '../api/directorApi';

/** Модули направления. Порядок важен: модуль N+1 открывается после N */
export default function ModulesDirectorPage() {
  const { t } = useTranslation();
  const { trackId = '' } = useParams();
  const { data, isLoading, isError, refetch } = useDirectorModules(trackId);
  const create = useCreateModule(trackId);
  const reorder = useReorderModules(trackId);
  const [list, setList] = useState<TrackModule[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  useEffect(() => {
    if (data) setList(data.modules);
  }, [data]);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const move = (i: number, dir: -1 | 1) => {
    const next = [...list];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setList(next);
    reorder.mutate(
      next.map((m) => m.id),
      { onSuccess: () => toast(t('modules.reordered')) },
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        back={{ to: PATHS.director.tracks, label: t('pages.director.tracks') }}
        title={data.track.title}
        description={t('modules.description')}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => setOpen(true)}>
            {t('modules.create')}
          </Button>
        }
      />
      <Card>
        {list.length === 0 ? (
          <EmptyState
            title={t('modules.empty')}
            description={t('modules.emptyHint')}
            action={<Button onClick={() => setOpen(true)}>{t('modules.create')}</Button>}
          />
        ) : (
          <ol className="divide-y divide-line">
            {list.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="h-display w-8 text-center text-lg text-brand-strong">{i + 1}</span>
                <Link
                  to={generatePath(PATHS.director.moduleLessons, { moduleId: m.id })}
                  className="group min-w-0 flex-1"
                >
                  <p className="font-medium group-hover:text-brand-strong">{m.title}</p>
                  <p className="truncate text-sm text-muted">
                    {m.description} · {t('student.lessonsCount', { count: m.lessonsCount })}
                  </p>
                </Link>
                <div className="flex items-center">
                  <IconButton
                    label={t('modules.up')}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="disabled:opacity-30"
                  >
                    <FiArrowUp />
                  </IconButton>
                  <IconButton
                    label={t('modules.down')}
                    disabled={i === list.length - 1}
                    onClick={() => move(i, 1)}
                    className="disabled:opacity-30"
                  >
                    <FiArrowDown />
                  </IconButton>
                  <Link
                    to={generatePath(PATHS.director.moduleLessons, { moduleId: m.id })}
                    aria-label={t('modules.lessons')}
                    className="ml-1 p-2 text-muted hover:text-ink"
                  >
                    <FiChevronRight />
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('modules.create')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={form.title.trim().length < 2}
              loading={create.isPending}
              onClick={() =>
                create.mutate(form, {
                  onSuccess: () => {
                    toast(t('modules.created'));
                    setOpen(false);
                    setForm({ title: '', description: '' });
                  },
                })
              }
            >
              {t('modules.create')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label={t('modules.title')}
            placeholder="TypeScript"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label={t('tracks.descriptionLabel')}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
