import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import type { Group, GroupFormat } from '@/core/types/models';
import { GroupFormatPicker } from '@/shared/components/groups/GroupFormatPicker';
import { Button, Input, Modal, toast } from '@/shared/ui';
import { useUpdateGroupFormat } from '../api/directorApi';

/** Перевести группу в онлайн или офлайн */
export function GroupFormatModal({ group, onClose }: { group: Group; onClose: () => void }) {
  const { t } = useTranslation();
  const save = useUpdateGroupFormat(group.id);
  const [format, setFormat] = useState<GroupFormat>(group.format);
  const [room, setRoom] = useState(group.room ?? '');
  const [error, setError] = useState('');

  const submit = () => {
    if (format === 'offline' && room.trim().length < 2) return setError(t('groups.roomRequired'));
    save.mutate(
      { format, room: format === 'offline' ? room.trim() : null },
      {
        onSuccess: () => {
          toast(t('groups.formatSaved'), 'success');
          onClose();
        },
        onError: (e) => toast(getApiErrorMessage(e)),
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('groups.changeFormat')}
      description={t('groups.groupName', { name: group.name })}
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
      <div className="flex flex-col gap-4">
        <GroupFormatPicker value={format} onChange={setFormat} />
        {format === 'offline' && (
          <Input
            label={t('groups.room')}
            placeholder={t('groups.roomPlaceholder')}
            value={room}
            onChange={(e) => {
              setRoom(e.target.value);
              setError('');
            }}
            error={error}
          />
        )}
      </div>
    </Modal>
  );
}
