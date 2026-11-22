import { generatePath, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/core/config/paths';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { PageHeader, toast } from '@/shared/ui';
import { useCreateBranch } from '../api/superAdminApi';
import { BranchForm } from '../components/BranchForm';

export default function BranchCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateBranch();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: PATHS.superAdmin.branches, label: t('pages.superAdmin.branches') }}
        title={t('pages.superAdmin.branchCreate')}
        description={t('superAdmin.createHint')}
      />
      <BranchForm
        submitLabel={t('superAdmin.createBranch')}
        loading={create.isPending}
        onCancel={() => navigate(PATHS.superAdmin.branches)}
        onSubmit={(v) =>
          create.mutate(v, {
            onSuccess: (b) => {
              toast(t('superAdmin.branchCreated', { name: b.name }));
              navigate(generatePath(PATHS.superAdmin.branch, { branchId: b.id }));
            },
            onError: (e) => toast(getApiErrorMessage(e), 'error'),
          })
        }
      />
    </div>
  );
}
