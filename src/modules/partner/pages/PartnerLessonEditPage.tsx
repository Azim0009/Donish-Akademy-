import { generatePath, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { PATHS } from '@/core/config/paths';
import { LessonEditor } from '@/shared/components/lesson-editor/LessonEditor';
import { ErrorState, Loader, toast } from '@/shared/ui';
import { usePartnerLesson, useSavePartnerLesson } from '../api/partnerApi';

/** Урок курса партнёра: теория, видео, пример, домашнее задание, тест */
export default function PartnerLessonEditPage() {
  const { t } = useTranslation();
  const { lessonId = '' } = useParams();
  const { data, isLoading, isError, refetch } = usePartnerLesson(lessonId);
  const save = useSavePartnerLesson(lessonId);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <LessonEditor
      initial={data}
      back={{
        to: generatePath(PATHS.partner.course, { courseId: data.trackId }),
        label: data.moduleTitle,
      }}
      saving={save.isPending}
      onSave={(l) =>
        save.mutate(l, {
          onSuccess: () => toast(t('lessonsDirector.saved'), 'success'),
          onError: (e) => toast(getApiErrorMessage(e), 'error'),
        })
      }
    />
  );
}
