import { useState } from 'react';
import { generatePath, Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiArrowDown,
  FiArrowUp,
  FiChevronDown,
  FiClock,
  FiEdit2,
  FiFilm,
  FiHelpCircle,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';
import clsx from 'clsx';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { PATHS } from '@/core/config/paths';
import type { PartnerModule } from '@/core/types/models';
import { GroupFormatBadge } from '@/shared/components/groups/GroupFormatBadge';
import {
  Badge,
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
import {
  useCreateModule,
  useCreatePartnerLesson,
  useDeleteModule,
  useDeletePartnerLesson,
  usePartnerCourseBuilder,
  useReorderModules,
  useUpdateModule,
} from '../api/partnerApi';

type ModuleForm = { id?: string; title: string; description: string };

/** Конструктор курса партнёра: модули → уроки, как у директора */
export default function PartnerCourseBuilderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courseId = '' } = useParams();
  const { data, isLoading, isError, refetch } = usePartnerCourseBuilder(courseId);
  const createModule = useCreateModule(courseId);
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const reorder = useReorderModules(courseId);
  const createLesson = useCreatePartnerLesson();
  const deleteLesson = useDeletePartnerLesson();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [modForm, setModForm] = useState<ModuleForm | null>(null);
  const [lessonFor, setLessonFor] = useState<PartnerModule | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', duration: '90' });
  const [tried, setTried] = useState(false);
  const [confirm, setConfirm] = useState<{
    kind: 'module' | 'lesson';
    id: string;
    title: string;
  } | null>(null);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const { course, modules } = data;
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const onError = (e: unknown) => toast(getApiErrorMessage(e), 'error');

  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const move = (i: number, dir: -1 | 1) => {
    const ids = modules.map((m) => m.id);
    [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
    reorder.mutate(ids, { onError });
  };
  const saveModule = () => {
    setTried(true);
    if (!modForm || modForm.title.trim().length < 2) return;
    const done = () => {
      toast(
        t(modForm.id ? 'partner.builder.moduleSaved' : 'partner.builder.moduleCreated'),
        'success',
      );
      setModForm(null);
      setTried(false);
    };
    if (modForm.id)
      updateModule.mutate({ ...modForm, id: modForm.id }, { onSuccess: done, onError });
    else
      createModule.mutate(modForm, {
        onSuccess: (m) => {
          setOpen((o) => new Set(o).add(m.id));
          done();
        },
        onError,
      });
  };
  const saveLesson = () => {
    setTried(true);
    const dur = Number(lessonForm.duration);
    if (!lessonFor || lessonForm.title.trim().length < 2 || !(dur >= 5 && dur <= 600)) return;
    createLesson.mutate(
      { moduleId: lessonFor.id, title: lessonForm.title.trim(), durationMinutes: dur },
      {
        onSuccess: (l) => {
          toast(t('partner.builder.lessonCreated'), 'success');
          setLessonFor(null);
          setTried(false);
          navigate(generatePath(PATHS.partner.lesson, { lessonId: l.id }));
        },
        onError,
      },
    );
  };
  const doDelete = () => {
    if (!confirm) return;
    const opts = {
      onSuccess: () => {
        toast(t('partner.builder.deleted'), 'success');
        setConfirm(null);
      },
      onError,
    };
    if (confirm.kind === 'module') deleteModule.mutate(confirm.id, opts);
    else deleteLesson.mutate(confirm.id, opts);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        back={{ to: PATHS.partner.courses, label: t('pages.partner.courses') }}
        title={course.title}
        description={t('partner.builder.summary', {
          modules: modules.length,
          lessons: totalLessons,
        })}
        meta={
          <>
            <Badge tone={course.status === 'published' ? 'green' : 'gray'}>
              {t(`partner.course.status.${course.status}`)}
            </Badge>
            <GroupFormatBadge format={course.format} />
          </>
        }
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => setModForm({ title: '', description: '' })}>
            {t('partner.builder.addModule')}
          </Button>
        }
      />

      {modules.length === 0 ? (
        <Card>
          <EmptyState
            title={t('partner.builder.noModules')}
            description={t('partner.builder.noModulesHint')}
            action={
              <Button
                leftIcon={<FiPlus />}
                onClick={() => setModForm({ title: '', description: '' })}
              >
                {t('partner.builder.addModule')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {modules.map((m, i) => {
            const isOpen = open.has(m.id);
            return (
              <Card key={m.id} className="overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand-strong">
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    aria-expanded={isOpen}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate font-semibold">{m.title}</p>
                    <p className="truncate text-xs text-muted">
                      {t('partner.builder.lessonsCount', { count: m.lessons.length })}
                      {m.description && ` · ${m.description}`}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <IconButton
                      label={t('partner.builder.up')}
                      disabled={i === 0 || reorder.isPending}
                      onClick={() => move(i, -1)}
                    >
                      <FiArrowUp />
                    </IconButton>
                    <IconButton
                      label={t('partner.builder.down')}
                      disabled={i === modules.length - 1 || reorder.isPending}
                      onClick={() => move(i, 1)}
                    >
                      <FiArrowDown />
                    </IconButton>
                    <IconButton
                      label={t('common.edit')}
                      onClick={() =>
                        setModForm({ id: m.id, title: m.title, description: m.description })
                      }
                    >
                      <FiEdit2 />
                    </IconButton>
                    <IconButton
                      label={t('common.delete')}
                      onClick={() => setConfirm({ kind: 'module', id: m.id, title: m.title })}
                    >
                      <FiTrash2 />
                    </IconButton>
                    <IconButton label={t('partner.builder.toggle')} onClick={() => toggle(m.id)}>
                      <FiChevronDown
                        className={clsx('transition-transform', isOpen && 'rotate-180')}
                      />
                    </IconButton>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-line">
                    {m.lessons.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-muted">
                        {t('partner.builder.noLessons')}
                      </p>
                    ) : (
                      <ul className="divide-y divide-line">
                        {m.lessons.map((l) => (
                          <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                            <span className="w-6 text-center text-xs tabular-nums text-muted">
                              {l.order}
                            </span>
                            <Link
                              to={generatePath(PATHS.partner.lesson, { lessonId: l.id })}
                              className="min-w-0 flex-1 truncate font-medium hover:text-brand-strong"
                            >
                              {l.title}
                            </Link>
                            <span className="hidden items-center gap-3 text-xs text-muted sm:flex">
                              <span className="inline-flex items-center gap-1">
                                <FiClock aria-hidden />{' '}
                                {t('partner.builder.minutes', { n: l.durationMinutes })}
                              </span>
                              {l.hasVideo && <FiFilm aria-label={t('lesson.steps.video')} />}
                              {l.quizCount > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <FiHelpCircle aria-hidden /> {l.quizCount}
                                </span>
                              )}
                            </span>
                            <IconButton
                              label={t('common.edit')}
                              onClick={() =>
                                navigate(generatePath(PATHS.partner.lesson, { lessonId: l.id }))
                              }
                            >
                              <FiEdit2 />
                            </IconButton>
                            <IconButton
                              label={t('common.delete')}
                              onClick={() =>
                                setConfirm({ kind: 'lesson', id: l.id, title: l.title })
                              }
                            >
                              <FiTrash2 />
                            </IconButton>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="border-t border-line px-5 py-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<FiPlus />}
                        onClick={() => {
                          setLessonFor(m);
                          setLessonForm({ title: '', duration: '90' });
                          setTried(false);
                        }}
                      >
                        {t('partner.builder.addLesson')}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {modForm && (
        <Modal
          open
          onClose={() => setModForm(null)}
          title={modForm.id ? t('partner.builder.editModule') : t('partner.builder.addModule')}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModForm(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={saveModule}
                loading={createModule.isPending || updateModule.isPending}
              >
                {t('common.saveChanges')}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Input
              label={t('partner.builder.moduleTitle')}
              id="pm-title"
              placeholder="Figma с нуля"
              value={modForm.title}
              onChange={(e) => setModForm({ ...modForm, title: e.target.value })}
              error={
                tried && modForm.title.trim().length < 2
                  ? t('partner.course.titleError2')
                  : undefined
              }
            />
            <Textarea
              label={t('partner.builder.moduleDescription')}
              id="pm-desc"
              rows={2}
              value={modForm.description}
              onChange={(e) => setModForm({ ...modForm, description: e.target.value })}
            />
          </div>
        </Modal>
      )}

      {lessonFor && (
        <Modal
          open
          onClose={() => setLessonFor(null)}
          title={t('partner.builder.addLesson')}
          description={t('partner.builder.lessonHint', { module: lessonFor.title })}
          footer={
            <>
              <Button variant="secondary" onClick={() => setLessonFor(null)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={saveLesson} loading={createLesson.isPending}>
                {t('partner.builder.createLesson')}
              </Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Input
              label={t('partner.builder.lessonTitle')}
              id="pl-title"
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              error={
                tried && lessonForm.title.trim().length < 2
                  ? t('partner.course.titleError2')
                  : undefined
              }
            />
            <Input
              label={t('partner.builder.duration')}
              id="pl-dur"
              type="number"
              min={5}
              max={600}
              value={lessonForm.duration}
              onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
              error={
                tried && !(Number(lessonForm.duration) >= 5 && Number(lessonForm.duration) <= 600)
                  ? t('partner.builder.durationError')
                  : undefined
              }
            />
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal
          open
          onClose={() => setConfirm(null)}
          title={
            confirm.kind === 'module'
              ? t('partner.builder.deleteModule')
              : t('partner.builder.deleteLesson')
          }
          description={
            confirm.kind === 'module'
              ? t('partner.builder.deleteModuleHint', { title: confirm.title })
              : t('partner.builder.deleteLessonHint', { title: confirm.title })
          }
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirm(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={doDelete}
                loading={deleteModule.isPending || deleteLesson.isPending}
              >
                {t('common.delete')}
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted">{t('partner.builder.cannotUndo')}</p>
        </Modal>
      )}
    </div>
  );
}
