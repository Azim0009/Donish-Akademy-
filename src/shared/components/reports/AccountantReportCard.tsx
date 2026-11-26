import { useTranslation } from 'react-i18next';
import type { AccountantReport } from '@/core/types/models';
import { formatDate, formatDateTime, formatMoney } from '@/core/utils/format';
import { reportStatusTone } from '@/shared/lib/reports';
import { Badge } from '@/shared/ui';

/** «1 нояб. – 26 нояб. 2026 г.» */
const formatPeriod = (from: string, to: string) => {
  const d = (s: string) => new Date(`${s}T00:00:00`).toISOString();
  return `${formatDate(d(from), { day: 'numeric', month: 'short' })} – ${formatDate(d(to))}`;
};

const sum = (xs: { amount: number }[]) => xs.reduce((s, x) => s + (Number(x.amount) || 0), 0);

/** Строка «название … сумма» с пунктиром */
function Row({ label, amount }: { label: string; amount: number }) {
  return (
    <li className="flex justify-between gap-3 border-b border-dashed border-line py-1">
      <span className="text-muted">{label}</span>
      <span className="shrink-0 whitespace-nowrap tabular-nums">{formatMoney(amount)}</span>
    </li>
  );
}

/** Цифры отчёта бухгалтера: приход, расходы, остаток + зарплаты и прочие расходы по строкам */
export function AccountantReportSummary({
  r,
  lists = true,
}: {
  r: AccountantReport;
  /** false — только плитки с цифрами (в редакторе строки и так видны) */
  lists?: boolean;
}) {
  const { t } = useTranslation();
  const salaries = sum(r.salaries);
  const other = sum(r.expenses);
  const spent = salaries + other;
  const left = r.income - spent;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          [
            t('accReports.income'),
            r.income,
            t('accReports.paymentsCount', { count: r.paymentsCount }),
          ],
          [
            t('accReports.expenses'),
            spent,
            t('accReports.inclSalaries', { sum: formatMoney(salaries) }),
          ],
          [t('accReports.balance'), left, ''],
        ].map(([label, v, hint], i) => (
          <div
            key={i}
            className="flex items-baseline justify-between gap-2 rounded-ctl bg-sunken px-3 py-2 sm:block"
          >
            <p className="text-xs text-muted">
              {label}
              {hint && <span className="ml-1 sm:hidden">· {hint}</span>}
            </p>
            <p
              className={`whitespace-nowrap text-sm font-semibold tabular-nums sm:text-base ${i === 2 && Number(v) < 0 ? 'text-danger' : ''}`}
            >
              {formatMoney(Number(v))}
            </p>
            {hint && <p className="hidden text-2xs text-muted sm:block">{hint}</p>}
          </div>
        ))}
      </div>
      {lists && r.salaries.length > 0 && (
        <div>
          <p className="mb-1 flex justify-between text-sm font-medium">
            <span>{t('accReports.salaries')}</span>
            <span className="tabular-nums">{formatMoney(salaries)}</span>
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {r.salaries.map((x) => (
              <Row
                key={x.id}
                label={`${x.employeeName} · ${t(`roles.${x.role}`)}${x.note ? ` · ${x.note}` : ''}`}
                amount={x.amount}
              />
            ))}
          </ul>
        </div>
      )}
      {lists && r.expenses.length > 0 && (
        <div>
          <p className="mb-1 flex justify-between text-sm font-medium">
            <span>{t('accReports.otherExpenses')}</span>
            <span className="tabular-nums">{formatMoney(other)}</span>
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {r.expenses.map((e) => (
              <Row
                key={e.id}
                label={`${t(`reports.cat.${e.category}`)}${e.note ? ` · ${e.note}` : ''}`}
                amount={e.amount}
              />
            ))}
          </ul>
        </div>
      )}
      {lists && r.comment && (
        <p className="rounded-ctl bg-sunken px-3 py-2 text-sm">💬 {r.comment}</p>
      )}
    </div>
  );
}

export function AccountantReportHeader({ r }: { r: AccountantReport }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="font-semibold">
        {t('accReports.titleFor', { period: formatPeriod(r.dateFrom, r.dateTo) })}
      </p>
      <Badge tone={reportStatusTone[r.status]}>{t(`reports.status.${r.status}`)}</Badge>
      <span className="text-xs text-muted">
        {r.accountantName}
        {r.sentAt && ` · ${t('reports.sentAt', { date: formatDateTime(r.sentAt) })}`}
      </span>
    </div>
  );
}
