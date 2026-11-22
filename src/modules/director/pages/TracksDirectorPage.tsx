import { useState } from 'react';
import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiLayers, FiPlus, FiUsers } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  Loader,
  Modal,
  PageHeader,
  Textarea,
  toast,
} from '@/shared/ui';
import { useDirectorTracks, useCreateTrack } from '../api/directorApi';

export default function TracksDirectorPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useDirectorTracks();
  const create = useCreateTrack();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const submit = () =>
    create.mutate(
      { title, description },
      {
        onSuccess: () => {
          toast(t('tracks.created'));
          setOpen(false);
          setTitle('');
          setDescription('');
        },
      },
    );

  return (
    <>
      <PageHeader
        title={t('pages.director.tracks')}
        description={t('tracks.description')}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => setOpen(true)}>
            {t('tracks.create')}
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((tr) => (
          <Link
            key={tr.id}
            to={generatePath(PATHS.director.trackModules, { trackId: tr.id })}
            className="group"
          >
            <Card className="flex h-full flex-col gap-3 p-5 transition-colors group-hover:border-brand/50">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-[17px] font-semibold">{tr.title}</h3>
                {tr.isActive ? (
                  <Badge tone="green" dot>
                    {t('tracks.published')}
                  </Badge>
                ) : (
                  <Badge>{t('tracks.draft')}</Badge>
                )}
              </div>
              <p className="text-sm text-muted">{tr.description}</p>
              <div className="mt-auto flex gap-4 pt-2 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <FiLayers /> {t('student.modulesCount', { count: tr.modulesCount })}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiUsers /> {tr.studentsCount}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('tracks.create')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submit} disabled={title.trim().length < 2} loading={create.isPending}>
              {t('tracks.create')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label={t('tracks.title')}
            placeholder="Backend Developer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            label={t('tracks.descriptionLabel')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
