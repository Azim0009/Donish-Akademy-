import type { UserListItem } from '@/core/types/models';
import { AccessModal } from '@/shared/components/AccessEditor';
import { EditUserModal } from '@/shared/components/EditUserModal';
import { ConfirmDeleteModal } from '@/shared/components/ConfirmDeleteModal';
import type { ManageMode } from '@/shared/components/UserRowActions';
import { DIRECTOR_ASSIGNABLE } from '@/core/auth/access';
import { useDeleteUser, useSaveAccess, useUpdateUser } from '../api/directorApi';

/** Окна управления человеком из панели директора: доступ, изменить, удалить */
export function ManageUser({ mode, user, onClose }: { mode: ManageMode; user: UserListItem; onClose: () => void }) {
  const saveAccess = useSaveAccess(user.id);
  const update = useUpdateUser(user.id);
  const remove = useDeleteUser(user.id);
  if (mode === 'access') return <AccessModal user={user} onClose={onClose} allowedRoles={DIRECTOR_ASSIGNABLE} onSave={(b) => saveAccess.mutateAsync(b)} />;
  if (mode === 'edit') return <EditUserModal user={user} onClose={onClose} onSave={(b) => update.mutateAsync(b)} />;
  return <ConfirmDeleteModal user={user} onClose={onClose} onDelete={() => remove.mutateAsync(undefined)} />;
}
