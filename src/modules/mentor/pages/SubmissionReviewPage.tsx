import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiX } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { formatDateTime } from '@/core/utils/format';
import { submissionTone } from '@/shared/lib/statusTone';
import { Avatar, Badge, Button, Card, ErrorState, Loader, PageHeader, Textarea, toast } from '@/shared/ui';
import { CodeEditorPanel } from '@/shared/editor/CodeEditorPanel';
import { useReview, useSubmission } from '../api/mentorApi';

export default function SubmissionReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { submissionId = '' } = useParams();
  const { data: s, isLoading, isError, refetch } = useSubmission(submissionId);
  const review = useReview(submissionId);
  const [feedback, setFeedback] = useState('');

  if (isLoading) return <Loader />;
  if (isError || !s) return <ErrorState onRetry={refetch} />;

  const decide = (status: 'passed' | 'failed') =>
    review.mutate(
      { status, feedback },
      {
        onSuccess: () => {
          toast(status === 'passed' ? t('mentor.passedToast', { name: s.studentName }) : t('mentor.failedToast', { name: s.studentName }));
          navigate(PATHS.mentor.reviewQueue);
        },
      },
    );

  return (
    <>
      <PageHeader
        back={{ to: PATHS.mentor.reviewQueue, label: t('pages.mentor.reviewQueue') }}
        title={s.exerciseTitle}
        meta={<Badge tone={submissionTone[s.status]} dot>{t(`submission.${s.status}`)}</Badge>}
        description={`${s.moduleTitle} · ${s.lessonTitle}`}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <CodeEditorPanel initialCode={s.code} readOnly layout="stack" height={300} />
        <div className="flex flex-col gap-4">
          <Card className="flex items-center gap-3 p-5">
            <Avatar name={s.studentName} size={44} />
            <div>
              <p className="font-medium">{s.studentName}</p>
              <p className="text-xs text-muted">{s.groupName} · {t('mentor.attemptN', { n: s.attempt })}</p>
              <p className="text-xs text-muted">{formatDateTime(s.submittedAt)}</p>
            </div>
          </Card>
          <Card className="flex flex-col gap-4 p-5">
            {s.status === 'pending' ? (
              <>
                <Textarea label={t('mentor.feedback')} placeholder={t('mentor.feedbackPlaceholder')} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" leftIcon={<FiX />} disabled={!feedback.trim()} loading={review.isPending && review.variables?.status === 'failed'} onClick={() => decide('failed')}>
                    {t('mentor.reject')}
                  </Button>
                  <Button leftIcon={<FiCheck />} loading={review.isPending && review.variables?.status === 'passed'} onClick={() => decide('passed')}>
                    {t('mentor.accept')}
                  </Button>
                </div>
                <p className="text-xs text-muted">{t('mentor.rejectHint')}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">{t('mentor.feedback')}</p>
                <p className="text-sm text-muted">{s.feedback}</p>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
