import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import type { PartnerCourse, PartnerCourseInput } from '@/core/types/models';
import { GroupFormatPicker } from '@/shared/components/groups/GroupFormatPicker';
import { COURSE_LEVELS } from '@/shared/lib/partners';
import { Button, Input, Modal, Select, Textarea, toast } from '@/shared/ui';
import { useSaveCourse } from '../api/partnerApi';

const empty: PartnerCourseInput = {
  title: '',
  description: '',
  level: 'beginner',
  format: 'online',
  priceMonthly: 500,
  durationMonths: 3,
  lessonsCount: 24,
};

/** Создать или изменить курс партнёра */
export function CourseFormModal({
  course,
  onClose,
}: {
  course: PartnerCourse | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const save = useSaveCourse();
  const [f, setF] = useState<PartnerCourseInput>(() => (course ? { ...course } : empty));
  const [tried, setTried] = useState(false);
  const set = <K extends keyof PartnerCourseInput>(k: K, v: PartnerCourseInput[K]) =>
    setF((x) => ({ ...x, [k]: v }));

  const errors = {
    title: f.title.trim().length < 3 ? t('partner.course.titleError') : undefined,
    description:
      f.description.trim().length < 10 ? t('partner.course.descriptionError') : undefined,
    priceMonthly: !(f.priceMonthly >= 50 && f.priceMonthly <= 10000)
      ? t('partner.course.priceError')
      : undefined,
    durationMonths: !(f.durationMonths >= 1 && f.durationMonths <= 12)
      ? t('partner.course.durationError')
      : undefined,
    lessonsCount: !(f.lessonsCount >= 1 && f.lessonsCount <= 200)
      ? t('partner.course.lessonsError')
      : undefined,
  };
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  const submit = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    save.mutate(
      { id: course?.id, body: f },
      {
        onSuccess: () => {
          toast(t(course ? 'partner.course.updated' : 'partner.course.created'), 'success');
          onClose();
        },
        onError: (e) => toast(getApiErrorMessage(e)),
      },
    );
  };
  const num = (k: 'priceMonthly' | 'durationMonths' | 'lessonsCount') => ({
    type: 'number' as const,
    value: String(f[k]),
    onChange: (e: { target: { value: string } }) => set(k, Number(e.target.value)),
    error: show(k),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={course ? t('partner.course.edit') : t('partner.course.new')}
      description={course ? course.title : t('partner.course.newHint')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {t('common.saveChanges')}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('partner.course.title')}
          id="pc-title"
          className="sm:col-span-2"
          placeholder="UI/UX-дизайн в Figma"
          value={f.title}
          onChange={(e) => set('title', e.target.value)}
          error={show('title')}
        />
        <Textarea
          label={t('partner.course.description')}
          id="pc-desc"
          className="sm:col-span-2"
          rows={3}
          value={f.description}
          onChange={(e) => set('description', e.target.value)}
          error={show('description')}
        />
        <Select
          label={t('partner.course.level')}
          id="pc-level"
          value={f.level}
          onChange={(e) => set('level', e.target.value as PartnerCourseInput['level'])}
          options={COURSE_LEVELS.map((l) => ({ value: l, label: t(`partner.level.${l}`) }))}
        />
        <Input
          label={t('partner.course.price')}
          id="pc-price"
          min={50}
          step={50}
          {...num('priceMonthly')}
        />
        <Input
          label={t('partner.course.duration')}
          id="pc-months"
          min={1}
          max={12}
          {...num('durationMonths')}
        />
        <Input
          label={t('partner.course.lessons')}
          id="pc-lessons"
          min={1}
          max={200}
          {...num('lessonsCount')}
        />
        <GroupFormatPicker
          className="sm:col-span-2"
          value={f.format}
          onChange={(v) => set('format', v)}
        />
      </div>
    </Modal>
  );
}
