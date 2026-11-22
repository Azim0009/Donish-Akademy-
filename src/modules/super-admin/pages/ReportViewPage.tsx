import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiCheck, FiCornerUpLeft, FiPrinter } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { formatMonth } from '@/core/utils/format';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import { useReportForReview, useReviewReport } from '@/shared/api/reportsApi';
import { lastMonths, reportStatusTone } from '@/shared/lib/reports';
import { ReportBody } from '@/shared/components/reports/ReportBody';
import { ReviewNote } from '@/shared/components/reports/ReviewNote';
import { Badge, Button, ErrorState, Loader, Modal, Textarea, toast } from '@/shared/ui';

/** SuperAdmin читает отчёт филиала и принимает его или возвращает с комментарием */
export default function ReportViewPage() {
  const { reportId = '' } = useParams();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useReportForReview(reportId);
  const review = useReviewReport(reportId);
  const [returning, setReturning] = useState(false);
  const [comment, setComment] = useState('');

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const r = data.report;
  const decide = (decision: 'accepted' | 'returned') =>
    review.mutate(
      { decision, comment: decision === 'returned' ? comment : undefined },
      {
        onSuccess: () => {
          toast(
            t(decision === 'accepted' ? 'reports.acceptedToast' : 'reports.returnedToast'),
            'success',
          );
          setReturning(false);
          refetch();
        },
        onError: (e) => toast(getApiErrorMessage(e), 'error'),
      },
    );

  return (
    <>
      <Link
        to={PATHS.superAdmin.reports}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink print:hidden"
      >
        <FiArrowLeft /> {t('pages.superAdmin.reports')}
      </Link>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="h-display text-2xl">
              {r.branchName} · {formatMonth(r.month)}
            </h1>
            <Badge tone={reportStatusTone[r.status]}>{t(`reports.status.${r.status}`)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {r.directorName}
            {data.previous &&
              ` · ${t('reports.comparedTo', { month: formatMonth(data.previous.month) })}`}
            {r.month === lastMonths(1)[0] && ` · ${t('reports.partialMonth')}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" leftIcon={<FiPrinter />} onClick={() => window.print()}>
            {t('contracts.print')}
          </Button>
          {r.status === 'sent' && (
            <>
              <Button
                variant="secondary"
                leftIcon={<FiCornerUpLeft />}
                onClick={() => setReturning(true)}
              >
                {t('reports.sendBack')}
              </Button>
              <Button
                leftIcon={<FiCheck />}
                loading={review.isPending && !returning}
                onClick={() => decide('accepted')}
              >
                {t('reports.accept')}
              </Button>
            </>
          )}
        </div>
      </div>
      {r.status !== 'sent' && <ReviewNote report={r} viewer="super" />}
      <ReportBody report={r} previous={data.previous} />

      <Modal
        open={returning}
        onClose={() => setReturning(false)}
        title={t('reports.sendBack')}
        description={t('reports.returnHint')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReturning(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => decide('returned')}
              loading={review.isPending}
              disabled={!comment.trim()}
            >
              {t('reports.sendBack')}
            </Button>
          </>
        }
      >
        <Textarea
          label={t('reports.whatToFix')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
          autoFocus
        />
      </Modal>
    </>
  );
}
