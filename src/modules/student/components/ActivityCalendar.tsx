import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { formatDate } from '@/core/utils/format';

const level = (count: number) => (count === 0 ? 'bg-sunken' : count < 2 ? 'bg-brand/25' : count < 4 ? 'bg-brand/55' : 'bg-brand');

/** Тепловая карта активности по дням (16 недель) */
export function ActivityCalendar({ days }: { days: { date: string; count: number }[] }) {
  const { t } = useTranslation();
  // разбиваем на недели-колонки по 7 дней
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div>
      <div className="scroll-thin flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {w.map((d) => (
              <span
                key={d.date}
                title={`${formatDate(d.date)} · ${t('profile.activities', { count: d.count })}`}
                className={clsx('h-3.5 w-3.5 rounded-[4px]', level(d.count))}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        {t('profile.less')}
        {[0, 1, 3, 5].map((c) => (
          <span key={c} className={clsx('h-3 w-3 rounded-[3px]', level(c))} />
        ))}
        {t('profile.more')}
      </div>
    </div>
  );
}
