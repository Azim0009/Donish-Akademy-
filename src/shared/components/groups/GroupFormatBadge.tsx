import { useTranslation } from 'react-i18next';
import { FiMapPin, FiWifi } from 'react-icons/fi';
import type { GroupFormat } from '@/core/types/models';
import { Badge } from '@/shared/ui';

/** «Онлайн» / «Офлайн» у группы */
export function GroupFormatBadge({ format }: { format: GroupFormat }) {
  const { t } = useTranslation();
  return (
    <Badge tone={format === 'online' ? 'blue' : 'gray'}>
      <span className="inline-flex items-center gap-1">
        {format === 'online' ? <FiWifi aria-hidden /> : <FiMapPin aria-hidden />}
        {t(`groups.format.${format}`)}
      </span>
    </Badge>
  );
}
