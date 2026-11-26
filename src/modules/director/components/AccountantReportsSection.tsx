import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiCornerUpLeft } from 'react-icons/fi';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import type { AccountantReport } from '@/core/types/models';
import {
  useDirectorAccountantReports,
  useReviewAccountantReport,
} from '@/modules/accountant/api/accountingApi';
import {
  AccountantReportHeader,
  AccountantReportSummary,
} from '@/shared/components/reports/AccountantReportCard';
import { Button, Card, Modal, Section, Textarea, toast } from '@/shared/ui';

/** Директор: отчёты бухгалтера — принять (тогда цифры попадут в отчёт SuperAdmin) или вернуть */
export function AccountantReportsSection() {
  const { t } = useTranslation();
  const { data } = useDirectorAccountantReports();
  const review = useReviewAccountantReport();
  const [ret, setRet] = useState<AccountantReport | null>(null);
  const [comment, setComment] = useState('');
  if (!data || data.length === 0) return null;
  const pending = data.filter((r) => r.status === 'sent');
  const done = data.filter((r) => r.status !== 'sent').slice(0, 3);
  const onError = (e: unknown) => toast(getApiErrorMessage(e), 'error');

  return (
    <Section
      title={t('accReports.directorTitle')}
      description={t('accReports.directorHint')}
      className="mb-5"
    >
      <div className="flex flex-col gap-3">
        {pending.length === 0 && <p className="text-sm text-muted">{t('accReports.nothingNew')}</p>}
        {[...pending, ...done].map((r) => (
          <Card key={r.id} className="flex flex-col gap-3 p-4">
            <AccountantReportHeader r={r} />
            <AccountantReportSummary r={r} />
            {r.directorComment && r.status !== 'sent' && (
              <p className="text-xs text-muted">
                {t('accReports.yourComment')}: {r.directorComment}
              </p>
            )}
            {r.status === 'sent' && (
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  leftIcon={<FiCornerUpLeft />}
                  onClick={() => {
                    setRet(r);
                    setComment('');
                  }}
                >
                  {t('accReports.return')}
                </Button>
                <Button
                  leftIcon={<FiCheck />}
                  loading={review.isPending}
                  onClick={() =>
                    review.mutate(
                      { id: r.id, accept: true, comment: '' },
                      { onSuccess: () => toast(t('accReports.acceptedToast'), 'success'), onError },
                    )
                  }
                >
                  {t('accReports.accept')}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      {ret && (
        <Modal
          open
          onClose={() => setRet(null)}
          title={t('accReports.return')}
          footer={
            <>
              <Button variant="secondary" onClick={() => setRet(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                disabled={!comment.trim()}
                loading={review.isPending}
                onClick={() =>
                  review.mutate(
                    { id: ret.id, accept: false, comment },
                    {
                      onSuccess: () => {
                        toast(t('accReports.returnedToast'), 'success');
                        setRet(null);
                      },
                      onError,
                    },
                  )
                }
              >
                {t('accReports.return')}
              </Button>
            </>
          }
        >
          <Textarea
            label={t('accReports.whatToFix')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
        </Modal>
      )}
    </Section>
  );
}
