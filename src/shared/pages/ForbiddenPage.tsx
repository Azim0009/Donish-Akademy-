import { useTranslation } from 'react-i18next';
import { ErrorScreen } from './NotFoundPage';

export function ForbiddenPage() {
  const { t } = useTranslation();
  return <ErrorScreen code="403" title={t('errors.forbidden')} text={t('errors.forbiddenText')} />;
}
