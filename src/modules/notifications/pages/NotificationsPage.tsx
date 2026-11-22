import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiAlertTriangle, FiBell, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useMarkAllRead, useMarkRead, useNotifications } from '@/core/notifications/notificationsApi';
import { timeAgo } from '@/core/utils/format';
import { Button, Card, EmptyState, ErrorState, Loader, PageHeader } from '@/shared/ui';

const icon = { info: FiInfo, success: FiCheckCircle, warning: FiAlertTriangle };
const tone = { info: 'bg-info-soft text-info', success: 'bg-brand-soft text-brand-strong', warning: 'bg-amber-soft text-amber' };

/** Центр уведомлений — одна страница для всех 4 ролей */
export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const unread = data.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t('pages.common.notifications')}
        description={unread ? t('notifications.unread', { count: unread }) : t('notifications.allRead')}
        actions={unread > 0 && <Button variant="secondary" loading={markAll.isPending} onClick={() => markAll.mutate()}>{t('notifications.readAll')}</Button>}
      />
      <Card>
        {data.length === 0 ? (
          <EmptyState icon={<FiBell />} title={t('notifications.empty')} />
        ) : (
          <ul className="divide-y divide-line">
            {data.map((n) => {
              const Icon = icon[n.kind];
              return (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      if (!n.isRead) markRead.mutate(n.id);
                      if (n.link) navigate(n.link);
                    }}
                    className={clsx('flex w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-sunken/50', !n.isRead && 'bg-brand-soft/30')}
                  >
                    <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg', tone[n.kind])}><Icon /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={clsx('text-sm', !n.isRead && 'font-semibold')}>{n.title}</span>
                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-brand" aria-label={t('notifications.new')} />}
                      </span>
                      <span className="block text-sm text-muted">{n.body}</span>
                      <span className="mt-1 block text-xs text-muted">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
