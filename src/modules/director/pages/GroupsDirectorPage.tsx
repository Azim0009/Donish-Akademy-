import { useState } from 'react';
import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiPlus, FiSearch } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loader,
  PageHeader,
  ProgressBar,
} from '@/shared/ui';
import { useDirectorGroups } from '../api/directorApi';
import { CreateGroupModal } from '../components/CreateGroupModal';

export default function GroupsDirectorPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useDirectorGroups(search);

  return (
    <>
      <PageHeader
        title={t('pages.director.groups')}
        description={t('groups.description')}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => setOpen(true)}>
            {t('groups.create')}
          </Button>
        }
      />
      <Input
        aria-label={t('common.search')}
        placeholder={t('groups.search')}
        leftIcon={<FiSearch />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5 sm:w-80"
      />
      {isLoading ? (
        <Loader />
      ) : isError || !data ? (
        <ErrorState onRetry={refetch} />
      ) : data.length === 0 ? (
        <Card>
          <EmptyState title={t('common.nothingFound')} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((g) => {
            const fill = Math.round((g.studentsCount / g.capacity) * 100);
            return (
              <Link
                key={g.id}
                to={generatePath(PATHS.director.group, { groupId: g.id })}
                className="group"
              >
                <Card className="flex h-full flex-col gap-4 p-5 transition-colors group-hover:border-brand/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="h-display text-xl">{g.name}</h3>
                      <p className="text-sm text-muted">{g.trackTitle}</p>
                    </div>
                    <Badge tone={fill >= 90 ? 'amber' : 'green'}>
                      {g.studentsCount}/{g.capacity}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-2 text-sm">
                    <FiCalendar className="text-muted" /> {g.schedule}
                  </p>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs text-muted">
                      <span>{t('groups.avgProgress')}</span>
                      <span>{g.avgProgress}%</span>
                    </div>
                    <ProgressBar value={g.avgProgress} />
                  </div>
                  <div className="mt-auto flex items-center gap-2 border-t border-line pt-3 text-sm">
                    {g.mentorName ? (
                      <>
                        <Avatar name={g.mentorName} size={26} /> {g.mentorName}
                      </>
                    ) : (
                      <span className="text-muted">{t('groups.noMentor')}</span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <CreateGroupModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
