import { generatePath, Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiLock, FiMail, FiPhone, FiUnlock } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { formatDate, formatNumber, timeAgo } from '@/core/utils/format';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loader,
  PageHeader,
  ProgressBar,
  Section,
  toast,
} from '@/shared/ui';
import { useDirectorUser, useToggleBlock } from '../api/directorApi';

export default function UserDetailDirectorPage() {
  const { t } = useTranslation();
  const { userId = '' } = useParams();
  const { data, isLoading, isError, refetch } = useDirectorUser(userId);
  const toggle = useToggleBlock();

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const u = data.user;
  const isStudent = u.role === 'student';

  return (
    <>
      <PageHeader
        back={{
          to: isStudent ? PATHS.director.students : PATHS.director.mentors,
          label: isStudent ? t('pages.director.students') : t('pages.director.mentors'),
        }}
        title={t('pages.director.user')}
      />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Card className="flex flex-col items-center p-6 text-center">
          <Avatar name={u.name} size={80} />
          <h2 className="h-display mt-4 text-xl">{u.name}</h2>
          <div className="mt-2 flex gap-2">
            <Badge tone={isStudent ? 'gray' : 'blue'}>{t(`roles.${u.role}`)}</Badge>
            {u.isBlocked ? (
              <Badge tone="red">{t('users.blocked')}</Badge>
            ) : (
              <Badge tone="green" dot>
                {t('users.active')}
              </Badge>
            )}
          </div>
          <ul className="mt-5 flex w-full flex-col gap-2.5 border-t border-line pt-5 text-left text-sm">
            <li className="flex items-center gap-3">
              <FiMail className="text-muted" /> {u.email}
            </li>
            <li className="flex items-center gap-3">
              <FiPhone className="text-muted" /> {u.phone}
            </li>
          </ul>
          <dl className="mt-4 grid w-full grid-cols-2 gap-2 text-left text-sm">
            <dt className="text-muted">{t('users.registered')}</dt>
            <dd>{formatDate(u.createdAt)}</dd>
            <dt className="text-muted">{t('common.lastActive')}</dt>
            <dd>{timeAgo(u.lastActiveAt)}</dd>
          </dl>
          <Button
            variant={u.isBlocked ? 'soft' : 'secondary'}
            className="mt-6 w-full"
            leftIcon={u.isBlocked ? <FiUnlock /> : <FiLock />}
            loading={toggle.isPending}
            onClick={() =>
              toggle.mutate(u.id, {
                onSuccess: (r) =>
                  toast(
                    r.isBlocked
                      ? t('users.blockedToast', { name: r.name })
                      : t('users.unblockedToast', { name: r.name }),
                  ),
              })
            }
          >
            {u.isBlocked ? t('users.unblock') : t('users.block')}
          </Button>
        </Card>

        <div className="flex flex-col gap-6">
          {isStudent && (
            <Section title={t('users.learning')}>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted">{t('users.progress')}</p>
                  <p className="h-display mt-1 text-2xl">{u.progress}%</p>
                  <ProgressBar value={u.progress} className="mt-2" />
                </div>
                <div>
                  <p className="text-xs text-muted">XP</p>
                  <p className="h-display mt-1 text-2xl">{formatNumber(u.xp)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">{t('users.group')}</p>
                  <p className="h-display mt-1 text-2xl">{u.groupName ?? '—'}</p>
                </div>
              </div>
            </Section>
          )}
          <Section title={isStudent ? t('users.group') : t('branch.groups')}>
            {data.groups.length ? (
              <ul className="divide-y divide-line">
                {data.groups.map((g) => (
                  <li key={g.id}>
                    <Link
                      to={generatePath(PATHS.director.group, { groupId: g.id })}
                      className="flex items-center justify-between gap-3 py-3 hover:text-brand-strong"
                    >
                      <span>
                        <span className="block font-medium">{g.name}</span>
                        <span className="block text-xs text-muted">{g.schedule}</span>
                      </span>
                      <span className="text-sm text-muted">
                        {t('groups.studentsOf', { count: g.studentsCount, capacity: g.capacity })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t('users.noGroup')} />
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
