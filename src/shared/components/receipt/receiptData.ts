import type { TFunction } from 'i18next';
import type { Payment } from '@/core/types/models';
import { formatMoney, formatMonth } from '@/core/utils/format';

/** Строки квитанции — одни и те же для экрана, печати и картинки PNG */
export function receiptRows(t: TFunction, p: Payment, ctx: { fee: number; paidTotal: number }) {
  const left = Math.max(0, ctx.fee - ctx.paidTotal);
  return {
    title: t('receipt.title', { no: p.receiptNo }),
    date: new Date(p.createdAt).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    rows: [
      [t('receipt.student'), p.studentName],
      [t('receipt.group'), p.groupName ?? '—'],
      [t('receipt.branch'), p.branchName],
      [t('receipt.purpose'), t('receipt.purposeText', { month: formatMonth(p.month) })],
      [t('receipt.method'), t(`payments.methods.${p.method}`)],
      ...(p.note ? [[t('receipt.note'), p.note]] : []),
      [t('receipt.monthTotal'), `${formatMoney(ctx.paidTotal)} / ${formatMoney(ctx.fee)}`],
      [t('receipt.left'), left > 0 ? formatMoney(left) : t('receipt.fullyPaid')],
    ] as [string, string][],
    amount: formatMoney(p.amount),
    receivedBy: p.receivedByName,
  };
}
