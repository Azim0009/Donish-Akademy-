import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/core/config/paths';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { ErrorState, Loader, PageHeader, toast } from '@/shared/ui';
import { useBranch, useUpdateBranch } from '../api/superAdminApi';
import { BranchForm } from '../components/BranchForm';

export default function BranchEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { branchId = '' } = useParams();
  const { data, isLoading, isError, refetch } = useBranch(branchId);
  const update = useUpdateBranch(branchId);
  const detailPath = generatePath(PATHS.superAdmin.branch, { branchId });

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: detailPath, label: data.branch.name }}
        title={t('pages.superAdmin.branchEdit')}
      />
      <BranchForm
        defaultValues={data.branch}
        submitLabel={t('common.saveChanges')}
        loading={update.isPending}
        onCancel={() => navigate(detailPath)}
        onSubmit={(v) =>
          update.mutate(v, {
            onSuccess: () => {
              toast(t('common.saved'));
              navigate(detailPath);
            },
            onError: (e) => toast(getApiErrorMessage(e), 'error'),
          })
        }
      />
    </div>
  );
}
