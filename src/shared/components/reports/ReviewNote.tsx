import { useTranslation } from 'react-i18next';
import { FiMessageSquare } from 'react-icons/fi';
import clsx from 'clsx';
import type { BranchReport } from '@/core/types/models';
import { formatDateTime } from '@/core/utils/format';

/** Статус отчёта: ждёт проверки / комментарий SuperAdmin при возврате или принятии */
export function ReviewNote({
  report: r,
  viewer = 'director',
}: {
  report: BranchReport;
  viewer?: 'director' | 'super';
}) {
  const { t } = useTranslation();
  if (r.status === 'sent')
    return (
      <p className="mb-4 rounded-card bg-info-soft px-4 py-3 text-sm text-info">
        {t(viewer === 'super' ? 'reports.waitingSuper' : 'reports.waiting', {
          date: formatDateTime(r.sentAt!),
        })}
      </p>
    );
  if (!r.reviewComment && r.status !== 'accepted') return null;
  return (
    <div
      className={clsx(
        'mb-4 flex gap-3 rounded-card border px-4 py-3',
        r.status === 'returned'
          ? 'border-amber/30 bg-amber-soft'
          : 'border-brand/30 bg-brand-soft/60',
      )}
    >
      <FiMessageSquare
        className={clsx(
          'mt-0.5 shrink-0',
          r.status === 'returned' ? 'text-amber' : 'text-brand-strong',
        )}
      />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">
          {r.status === 'returned' ? t('reports.returnedBy') : t('reports.acceptedBy')}
        </p>
        {r.reviewComment && <p className="mt-0.5 whitespace-pre-line">{r.reviewComment}</p>}
        {r.reviewedAt && <p className="mt-1 text-xs text-muted">{formatDateTime(r.reviewedAt)}</p>}
      </div>
    </div>
  );
}
