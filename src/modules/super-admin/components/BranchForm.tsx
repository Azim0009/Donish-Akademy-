import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Select, Textarea } from '@/shared/ui';
import { ALL_FEATURES } from '@/core/navigation/branchFeatures';
import { ImageUpload } from '@/shared/components/ImageUpload';
import type { BranchInput } from '../api/superAdminApi';
import { BranchFeaturesPicker } from './BranchFeaturesPicker';

// Правила из архитектуры: название 2–150, уникальный код, корректный email/телефон, без HTML
const noHtml = (s: string) => !/[<>]/.test(s);
const schema = z.object({
  name: z.string().min(2, 'validation.min2').max(150).refine(noHtml, 'validation.noHtml'),
  code: z.string().regex(/^[A-Z]{2,5}$/, 'validation.branchCode'),
  status: z.enum(['draft', 'active', 'suspended', 'archived']),
  address: z.string().min(3, 'validation.required').refine(noHtml, 'validation.noHtml'),
  phone: z.string().regex(/^\+?[\d\s()-]{9,20}$/, 'validation.phone'),
  phone2: z
    .string()
    .refine((v) => !v || /^\+?[\d\s()-]{9,20}$/.test(v), 'validation.phone')
    .optional(),
  email: z.string().email('validation.email'),
  timeZone: z.string(),
  description: z.string().max(500).refine(noHtml, 'validation.noHtml'),
});

interface Props {
  defaultValues?: Partial<BranchInput>;
  onSubmit: (v: BranchInput) => void;
  loading?: boolean;
  submitLabel: string;
  onCancel: () => void;
}

export function BranchForm({ defaultValues, onSubmit, loading, submitLabel, onCancel }: Props) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BranchInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'draft',
      timeZone: 'Asia/Dushanbe',
      description: '',
      phone2: '',
      ...defaultValues,
    },
  });
  // фото и функции — вне react-hook-form, добавляем при отправке
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultValues?.photoUrl ?? null);
  const [features, setFeatures] = useState<string[]>(defaultValues?.features ?? ALL_FEATURES);
  const err = (k: keyof BranchInput) => errors[k]?.message && t(errors[k]!.message!);

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit({ ...v, photoUrl, features }))}
      className="flex flex-col gap-6"
    >
      <Card className="grid gap-5 p-6 md:grid-cols-2">
        <h2 className="text-[15px] font-semibold md:col-span-2">{t('branch.main')}</h2>
        <Input
          label={t('branch.name')}
          placeholder="Душанбе"
          {...register('name')}
          error={err('name')}
        />
        <Input
          label={t('branch.code')}
          placeholder="DSH"
          hint={t('branch.codeHint')}
          {...register('code')}
          error={err('code')}
        />
        <Select
          label={t('branch.status')}
          {...register('status')}
          options={(['draft', 'active', 'suspended', 'archived'] as const).map((s) => ({
            value: s,
            label: t(`branchStatus.${s}`),
          }))}
        />
        <Select
          label={t('branch.timeZone')}
          {...register('timeZone')}
          options={[{ value: 'Asia/Dushanbe', label: 'Asia/Dushanbe (UTC+5)' }]}
        />
        <Textarea
          label={t('branch.description')}
          className="md:col-span-2"
          {...register('description')}
          error={err('description')}
        />
        <ImageUpload
          label={t('branch.photo')}
          hint={t('branch.photoHint')}
          value={photoUrl}
          onChange={setPhotoUrl}
          className="md:col-span-2"
        />
      </Card>
      <Card className="grid gap-5 p-6 md:grid-cols-2">
        <h2 className="text-[15px] font-semibold md:col-span-2">{t('branch.contacts')}</h2>
        <Input
          label={t('branch.address')}
          className="md:col-span-2"
          {...register('address')}
          error={err('address')}
        />
        <Input
          label={t('people.phone1')}
          placeholder="+992 37 000 00 00"
          inputMode="tel"
          {...register('phone')}
          error={err('phone')}
        />
        <Input
          label={t('people.phone2')}
          placeholder="+992 90 000 00 00"
          inputMode="tel"
          hint={t('people.optional')}
          {...register('phone2')}
          error={err('phone2')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="dsh@donish.tj"
          className="md:col-span-2"
          {...register('email')}
          error={err('email')}
        />
      </Card>
      <Card className="p-6">
        <h2 className="mb-1 text-[15px] font-semibold">{t('features.title')}</h2>
        <BranchFeaturesPicker value={features} onChange={setFeatures} />
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
