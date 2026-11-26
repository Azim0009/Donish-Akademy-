import { generatePath, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/core/config/paths';
import { LessonEditor } from '@/shared/components/lesson-editor/LessonEditor';
import { ErrorState, Loader, toast } from '@/shared/ui';
import { useDirectorLesson, useSaveLesson } from '../api/directorApi';

/** Конструктор урока директора: теория, видео, пример, задание, тест */
export default function LessonEditDirectorPage() {
  const { t } = useTranslation();
  const { lessonId = '' } = useParams();
  const { data, isLoading, isError, refetch } = useDirectorLesson(lessonId);
  const save = useSaveLesson(lessonId);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <LessonEditor
      initial={data}
      back={{
        to: generatePath(PATHS.director.moduleLessons, { moduleId: data.moduleId }),
        label: data.moduleTitle,
      }}
      saving={save.isPending}
      onSave={(l) => save.mutate(l, { onSuccess: () => toast(t('lessonsDirector.saved')) })}
    />
  );
}
