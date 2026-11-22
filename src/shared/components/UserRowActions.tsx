import { useTranslation } from 'react-i18next';
import { FiEdit2, FiKey, FiTrash2 } from 'react-icons/fi';
import type { UserListItem } from '@/core/types/models';
import { IconButton } from '@/shared/ui';

export type ManageMode = 'access' | 'edit' | 'delete';

/** Кнопки в строке таблицы: доступ, изменить, удалить */
export function UserRowActions({ user, onAction, access = true }: { user: UserListItem; onAction: (mode: ManageMode, user: UserListItem) => void; access?: boolean }) {
  const { t } = useTranslation();
  const stop = (mode: ManageMode) => (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onAction(mode, user);
  };
  return (
    <div className="flex items-center justify-end gap-0.5">
      {access && (
        <IconButton label={t('access.button')} onClick={stop('access')}>
          <FiKey />
        </IconButton>
      )}
      <IconButton label={t('common.edit')} onClick={stop('edit')}>
        <FiEdit2 />
      </IconButton>
      <IconButton label={t('common.delete')} onClick={stop('delete')} className="hover:bg-danger-soft hover:text-danger">
        <FiTrash2 />
      </IconButton>
    </div>
  );
}
