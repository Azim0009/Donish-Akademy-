import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiBookOpen, FiCheckCircle, FiClock } from 'react-icons/fi';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { PATHS } from '@/core/config/paths';
import type { PartnerCourse } from '@/core/types/models';
import { GroupFormatBadge } from '@/shared/components/groups/GroupFormatBadge';
import { formatTjs } from '@/shared/lib/partners';
import { Avatar, Badge, Button, Card, EmptyState, Input, Loader, Select } from '@/shared/ui';
import { useApplyToPartner, usePartnerPublic } from '@/modules/partner/api/partnerApi';

const PHONE_RE = /^\+?[\d\s()-]{9,20}$/;

/** Страница преподавателя-партнёра по его ссылке /p/<код>: курсы и запись */
export default function PartnerPublicPage() {
  const { t } = useTranslation();
  const { code = '' } = useParams();
  const { data, isLoading, isError } = usePartnerPublic(code);
  const apply = useApplyToPartner(code);
  const [form, setForm] = useState({ name: '', phone: '', courseId: '' });
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);

  if (isLoading) return <Loader />;
  if (isError || !data)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card>
          <EmptyState
            title={t('partnerPage.notFound')}
            description={t('partnerPage.notFoundHint')}
            action={
              <Link to={PATHS.home}>
                <Button tabIndex={-1}>{t('partnerPage.toHome')}</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );

  const courseId = form.courseId || data.courses[0]?.id || '';
  const errors = {
    name: form.name.trim().length < 2 ? t('validation.required') : undefined,
    phone: !PHONE_RE.test(form.phone.trim()) ? t('validation.phone') : undefined,
  };
  const submit = () => {
    setTried(true);
    if (errors.name || errors.phone || !courseId) return;
    apply.mutate(
      { name: form.name.trim(), phone: `+992 ${form.phone.trim()}`, courseId },
      { onSuccess: () => setDone(true) },
    );
  };
  const choose = (c: PartnerCourse) => {
    setForm((f) => ({ ...f, courseId: c.id }));
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={data.name} size={88} />
        <div className="min-w-0">
          <Badge tone="green">{t('partnerPage.badge')}</Badge>
          <h1 className="h-display mt-2 text-3xl leading-tight sm:text-4xl">{data.name}</h1>
          <p className="mt-1 text-lg text-muted">{data.specialty}</p>
          {data.bio && <p className="mt-3 max-w-[62ch] text-[15px] leading-7">{data.bio}</p>}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="h-display text-2xl">{t('partnerPage.courses')}</h2>
        {data.courses.length === 0 ? (
          <Card>
            <EmptyState icon={<FiBookOpen />} title={t('partnerPage.noCourses')} />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.courses.map((c) => (
              <Card key={c.id} className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap gap-2">
                  <GroupFormatBadge format={c.format} />
                  <Badge>{t(`partner.level.${c.level}`)}</Badge>
                </div>
                <h3 className="h-display text-xl leading-tight">{c.title}</h3>
                <p className="text-sm text-muted">{c.description}</p>
                {c.program.length > 0 && (
                  <details className="rounded-ctl border border-line px-3 py-2 text-sm [&[open]>summary]:mb-2">
                    <summary className="cursor-pointer font-medium text-brand-strong">
                      {t('partnerPage.program', { count: c.program.length })}
                    </summary>
                    <ol className="flex flex-col gap-2">
                      {c.program.map((m, i) => (
                        <li key={i}>
                          <p className="font-medium">
                            {i + 1}. {m.title}
                          </p>
                          {m.lessons.length > 0 && (
                            <p className="text-xs text-muted">{m.lessons.join(' · ')}</p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
                <p className="flex items-center gap-1.5 text-sm">
                  <FiClock className="text-muted" aria-hidden />
                  {t('partner.course.months', { count: c.durationMonths })} ·{' '}
                  {t('partnerPage.lessons', { count: c.lessonsCount })}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
                  <p>
                    <span className="h-display text-xl">{formatTjs(c.priceMonthly)}</span>
                    <span className="text-sm text-muted"> / {t('partnerPage.month')}</span>
                  </p>
                  <Button onClick={() => choose(c)}>{t('partnerPage.signUp')}</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {data.courses.length > 0 && (
        <section id="apply" className="scroll-mt-24">
          <Card className="mx-auto max-w-xl p-6">
            {done ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <FiCheckCircle className="text-4xl text-brand" aria-hidden />
                <h2 className="h-display text-2xl">{t('partnerPage.doneTitle')}</h2>
                <p className="text-muted">{t('partnerPage.doneText', { name: data.name })}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="h-display text-2xl">{t('partnerPage.formTitle')}</h2>
                  <p className="text-sm text-muted">{t('partnerPage.formHint')}</p>
                </div>
                <Input
                  label={t('partnerPage.name')}
                  id="pp-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  error={tried ? errors.name : undefined}
                />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pp-phone" className="text-sm font-medium">
                    {t('partnerPage.phone')}
                  </label>
                  <div className="flex items-stretch overflow-hidden rounded-ctl border border-line bg-surface focus-within:border-brand">
                    <span className="flex items-center border-r border-line bg-sunken px-3 text-sm text-muted">
                      +992
                    </span>
                    <input
                      id="pp-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="90 123 45 67"
                      className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      aria-invalid={tried && !!errors.phone}
                    />
                  </div>
                  {tried && errors.phone && <p className="text-xs text-danger">{errors.phone}</p>}
                </div>
                <Select
                  label={t('partnerPage.course')}
                  id="pp-course"
                  value={courseId}
                  onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                  options={data.courses.map((c) => ({ value: c.id, label: c.title }))}
                />
                {apply.isError && (
                  <p className="text-sm text-danger">{getApiErrorMessage(apply.error)}</p>
                )}
                <Button onClick={submit} loading={apply.isPending}>
                  {t('partnerPage.send')}
                </Button>
              </div>
            )}
          </Card>
        </section>
      )}
    </div>
  );
}
