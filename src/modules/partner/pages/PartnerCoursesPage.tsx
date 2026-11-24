import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBookOpen, FiEdit2, FiEye, FiEyeOff, FiPlus, FiTrash2 } from 'react-icons/fi';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import type { PartnerCourse } from '@/core/types/models';
import { GroupFormatBadge } from '@/shared/components/groups/GroupFormatBadge';
import { formatTjs } from '@/shared/lib/partners';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loader,
  PageHeader,
  toast,
} from '@/shared/ui';
import { useDeleteCourse, usePartnerCourses, useSetCourseStatus } from '../api/partnerApi';
import { CourseFormModal } from '../components/CourseFormModal';

/** Курсы партнёра: черновик → опубликован (виден на его странице по ссылке) */
export default function PartnerCoursesPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = usePartnerCourses();
  const setStatus = useSetCourseStatus();
  const remove = useDeleteCourse();
  const [edit, setEdit] = useState<PartnerCourse | null | 'new'>(null);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const toggle = (c: PartnerCourse) =>
    setStatus.mutate(
      { id: c.id, status: c.status === 'published' ? 'draft' : 'published' },
      {
        onSuccess: () =>
          toast(
            t(c.status === 'published' ? 'partner.course.unpublished' : 'partner.course.published'),
            'success',
          ),
      },
    );
  const del = (c: PartnerCourse) =>
    remove.mutate(c.id, {
      onSuccess: () => toast(t('partner.course.deleted'), 'success'),
      onError: (e) => toast(getApiErrorMessage(e)),
    });

  return (
    <>
      <PageHeader
        title={t('pages.partner.courses')}
        description={t('partner.coursesHint')}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => setEdit('new')}>
            {t('partner.course.new')}
          </Button>
        }
      />
      {data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FiBookOpen />}
            title={t('partner.noCourses')}
            description={t('partner.noCoursesHint')}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((c) => (
            <Card key={c.id} className="flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={c.status === 'published' ? 'green' : 'gray'}>
                  {t(`partner.course.status.${c.status}`)}
                </Badge>
                <GroupFormatBadge format={c.format} />
                <Badge>{t(`partner.level.${c.level}`)}</Badge>
              </div>
              <div>
                <h3 className="h-display text-lg leading-tight">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted">{t('partner.course.priceShort')}</dt>
                  <dd className="font-medium">{formatTjs(c.priceMonthly)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t('partner.course.durationShort')}</dt>
                  <dd className="font-medium">
                    {t('partner.course.months', { count: c.durationMonths })} · {c.lessonsCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t('partner.enrolled')}</dt>
                  <dd className="font-medium">{c.studentsCount}</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-3">
                <Button
                  size="sm"
                  variant={c.status === 'published' ? 'secondary' : 'primary'}
                  leftIcon={c.status === 'published' ? <FiEyeOff /> : <FiEye />}
                  onClick={() => toggle(c)}
                  disabled={setStatus.isPending}
                >
                  {c.status === 'published'
                    ? t('partner.course.unpublish')
                    : t('partner.course.publish')}
                </Button>
                <Button size="sm" variant="ghost" leftIcon={<FiEdit2 />} onClick={() => setEdit(c)}>
                  {t('common.edit')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<FiTrash2 />}
                  onClick={() => del(c)}
                  disabled={remove.isPending}
                  className="ml-auto text-danger"
                >
                  {t('common.delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {edit && (
        <CourseFormModal course={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />
      )}
    </>
  );
}
