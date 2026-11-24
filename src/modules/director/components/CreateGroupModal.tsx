import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { MAIN_TRACK } from '@/core/config/course';
import { Button, Input, Modal, Select, toast } from '@/shared/ui';
import { useDirectorUsers, useCreateGroup } from '../api/directorApi';

const schema = z.object({
  name: z.string().min(2, 'validation.min2'),
  mentorId: z.string().min(1, 'validation.required'),
  schedule: z.string().min(3, 'validation.required'),
  capacity: z.coerce.number().min(4).max(40),
});
type Form = z.infer<typeof schema>;

export function CreateGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const mentors = useDirectorUsers({ role: 'mentor' });
  const create = useCreateGroup();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { capacity: 16 } });
  const err = (k: keyof Form) => errors[k]?.message && t(String(errors[k]!.message));

  const submit = handleSubmit((v) =>
    create.mutate(v, {
      onSuccess: (g) => {
        toast(t('groups.created', { name: g.name }));
        reset();
        onClose();
      },
    }),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('groups.create')}
      description={MAIN_TRACK.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            {t('groups.create')}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('groups.name')}
          placeholder="FS-05"
          {...register('name')}
          error={err('name')}
        />
        <Input
          label={t('groups.capacity')}
          type="number"
          {...register('capacity')}
          error={err('capacity')}
        />
        <Select
          label={t('groups.mentor')}
          placeholder={t('common.choose')}
          className="sm:col-span-2"
          {...register('mentorId')}
          error={err('mentorId')}
          options={(mentors.data ?? []).map((m) => ({
            value: m.id,
            label: `${m.name} · ${t('groups.groupsCount', { count: m.groupsCount })}`,
          }))}
        />
        <Input
          label={t('groups.schedule')}
          placeholder="Пн/Ср/Пт · 14:00–16:00"
          className="sm:col-span-2"
          {...register('schedule')}
          error={err('schedule')}
        />
      </form>
    </Modal>
  );
}
