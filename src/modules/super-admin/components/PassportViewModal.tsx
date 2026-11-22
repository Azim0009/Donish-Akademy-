import { useTranslation } from 'react-i18next';
import type { UserListItem } from '@/core/types/models';
import { Button, Modal } from '@/shared/ui';

/** Просмотр паспорта сотрудника (только для руководства) */
export function PassportViewModal({ user, onClose }: { user: UserListItem; onClose: () => void }) {
  const { t } = useTranslation();
  const sides = [
    [t('passport.front'), user.passportFront],
    [t('passport.back'), user.passportBack],
  ] as const;
  return (
    <Modal
      open
      onClose={onClose}
      title={`${t('passport.title')}: ${user.name}`}
      footer={<Button onClick={onClose}>{t('common.close')}</Button>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {sides.map(([label, src]) => (
          <figure key={label} className="flex flex-col gap-1.5">
            <figcaption className="text-[13px] font-medium">{label}</figcaption>
            {src ? (
              <a href={src} target="_blank" rel="noopener noreferrer">
                <img
                  src={src}
                  alt={label}
                  className="aspect-[3/2] w-full rounded-ctl border border-line object-cover"
                />
              </a>
            ) : (
              <div className="flex aspect-[3/2] items-center justify-center rounded-ctl bg-sunken text-sm text-muted">
                {t('passport.none')}
              </div>
            )}
          </figure>
        ))}
      </div>
    </Modal>
  );
}
