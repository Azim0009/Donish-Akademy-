import { useTranslation } from 'react-i18next';
import { FiZap } from 'react-icons/fi';
import type { Progress } from '@/core/types/models';
import { formatNumber } from '@/core/utils/format';
import { Card, ProgressBar } from '@/shared/ui';

export function LevelCard({ progress }: { progress: Progress }) {
  const { t } = useTranslation();
  const span = progress.xpForNextLevel - (progress.xpEarned - progress.xpInLevel);
  const pct = Math.round((progress.xpInLevel / span) * 100);
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 flex-col items-center justify-center rounded-card bg-amber-soft text-amber">
          <span className="text-[10px] font-semibold leading-none">LVL</span>
          <span className="h-display text-xl leading-tight">{progress.level}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <FiZap className="text-amber" /> {formatNumber(progress.xpEarned)} XP
          </p>
          <ProgressBar value={pct} tone="amber" className="mt-2" />
          <p className="mt-1.5 text-xs text-muted">{t('profile.toNextLevel', { xp: formatNumber(progress.xpForNextLevel - progress.xpEarned), level: progress.level + 1 })}</p>
        </div>
      </div>
    </Card>
  );
}
