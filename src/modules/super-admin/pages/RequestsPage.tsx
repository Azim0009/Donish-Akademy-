import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import {
  FiBookOpen,
  FiCheck,
  FiMapPin,
  FiRepeat,
  FiSearch,
  FiUserCheck,
  FiX,
} from 'react-icons/fi';
import type { CrossRequest, CrossRequestType } from '@/core/types/models';
import { formatDateTime } from '@/core/utils/format';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loader,
  PageHeader,
  Tabs,
  toast,
} from '@/shared/ui';
import { useCrossRequests, useSetRequestStatus } from '../api/superAdminApi';

type Filter = 'new' | 'approved' | 'rejected' | 'all';
const TYPE_ICON: Record<CrossRequestType, IconType> = {
  transfer: FiRepeat,
  courseAccess: FiBookOpen,
  mentorMove: FiUserCheck,
  newBranch: FiMapPin,
};

/** Межфилиальные запросы: директора просят перевести ученика, открыть курс, перевести ментора */
export default function RequestsPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Filter>('new');
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useCrossRequests({ status, search });
  const all = useCrossRequests({ status: 'all' });
  const count = (s: Filter) => (all.data ?? []).filter((r) => s === 'all' || r.status === s).length;

  return (
    <>
      <PageHeader title={t('pages.superAdmin.requests')} description={t('requests.description')} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs<Filter>
          value={status}
          onChange={setStatus}
          tabs={(['new', 'approved', 'rejected', 'all'] as Filter[]).map((s) => ({
            value: s,
            label: t(`requests.status.${s}`),
            count: count(s),
          }))}
        />
        <Input
          className="w-full sm:ml-auto sm:w-72"
          aria-label={t('common.search')}
          placeholder={t('requests.search')}
          leftIcon={<FiSearch />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {isLoading ? (
        <Loader />
      ) : isError || !data ? (
        <ErrorState onRetry={refetch} />
      ) : data.length === 0 ? (
        <Card className="p-6">
          <EmptyState title={t('requests.empty')} />
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.map((r) => (
            <RequestCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </>
  );
}

function RequestCard({ r }: { r: CrossRequest }) {
  const { t } = useTranslation();
  const set = useSetRequestStatus();
  const Icon = TYPE_ICON[r.type];
  const decide = (status: 'approved' | 'rejected') =>
    set.mutate(
      { id: r.id, status },
      {
        onSuccess: () => toast(t(`requests.done.${status}`), 'success'),
        onError: (e) => toast(getApiErrorMessage(e), 'error'),
      },
    );

  return (
    <Card className="flex min-w-0 flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong">
          <Icon />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{t(`requests.types.${r.type}`)}</p>
            {r.status !== 'new' && (
              <Badge tone={r.status === 'approved' ? 'green' : 'red'}>
                {t(`requests.status.${r.status}`)}
              </Badge>
            )}
          </div>
          <p className="text-sm">
            {r.subject} ·{' '}
            <span className="text-muted">
              {r.fromBranch}
              {r.toBranch && ` → ${r.toBranch}`}
            </span>
          </p>
        </div>
      </div>
      <p className="rounded-ctl bg-sunken px-3 py-2 text-[13px]">{r.comment}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {r.createdBy} · {formatDateTime(r.createdAt)}
        </p>
        {r.status === 'new' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<FiX />}
              disabled={set.isPending}
              onClick={() => decide('rejected')}
            >
              {t('requests.reject')}
            </Button>
            <Button
              size="sm"
              leftIcon={<FiCheck />}
              disabled={set.isPending}
              onClick={() => decide('approved')}
            >
              {t('requests.approve')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
