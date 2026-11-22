import { useState } from 'react';
import { useNavigate, generatePath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMinus, FiPlus } from 'react-icons/fi';
import clsx from 'clsx';
import type { Branch, BranchStatus } from '@/core/types/models';
import { PATHS } from '@/core/config/paths';
import { formatMoney, formatNumber } from '@/core/utils/format';

// Координаты городов (долгота, широта). Новый филиал без координат — просто не рисуется на карте
const CITY: Record<string, [number, number]> = {
  branch_dushanbe: [68.78, 38.56],
  branch_khujand: [69.63, 40.28],
  branch_bokhtar: [68.78, 37.84],
  branch_kulob: [69.78, 37.91],
  branch_istaravshan: [69.0, 39.91],
  branch_khorog: [71.55, 37.49],
  branch_panjakent: [67.61, 39.49],
};

// Упрощённый контур Таджикистана
const OUTLINE: [number, number][] = [
  [67.35, 39.55],
  [67.75, 39.72],
  [68.3, 39.62],
  [68.55, 40.05],
  [68.75, 40.55],
  [69.25, 40.75],
  [69.4, 41.0],
  [69.95, 41.02],
  [70.4, 41.05],
  [70.75, 40.78],
  [70.5, 40.48],
  [70.95, 40.22],
  [70.6, 40.0],
  [70.6, 39.85],
  [71.5, 39.62],
  [72.5, 39.36],
  [73.6, 39.46],
  [74.1, 39.2],
  [74.9, 38.95],
  [75.15, 38.6],
  [74.85, 38.05],
  [74.9, 37.25],
  [74.4, 37.05],
  [74.0, 37.15],
  [73.3, 37.45],
  [72.6, 37.0],
  [71.65, 36.72],
  [71.45, 37.3],
  [71.55, 37.92],
  [71.3, 38.3],
  [70.77, 38.46],
  [70.3, 38.1],
  [70.0, 37.6],
  [69.5, 37.45],
  [68.9, 37.3],
  [68.3, 37.1],
  [67.8, 37.2],
  [68.0, 37.65],
  [68.15, 38.4],
  [68.4, 38.9],
  [67.8, 39.2],
];

const W = 700;
const H = 505;
const xy = ([lon, lat]: [number, number]) =>
  [((lon - 67.2) / 8.1) * W, ((41.15 - lat) / 4.55) * H] as const;
const outlinePath = OUTLINE.map((p, i) => `${i ? 'L' : 'M'}${xy(p).join(',')}`).join(' ') + 'Z';

const DOT: Record<BranchStatus, string> = {
  active: 'fill-brand',
  suspended: 'fill-muted',
  draft: 'fill-amber',
  archived: 'fill-muted',
};

type MapBranch = Branch & { revenue?: number };

/** Карта филиалов: точки по статусу, клик — открыть филиал */
export function BranchMap({ branches }: { branches: MapBranch[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<string | null>(null);
  // при приближении держим центр на Душанбе — там больше всего филиалов
  const [cx, cy] = xy([69.0, 38.9]);
  const vw = W / zoom;
  const vh = H / zoom;
  const vx = Math.min(Math.max(cx - vw / 2, 0), W - vw);
  const vy = Math.min(Math.max(cy - vh / 2, 0), H - vh);
  const hovered = branches.find((b) => b.id === hover);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <Legend cls="bg-brand" label={t('dashboard.mapActive')} />
        <Legend cls="bg-muted" label={t('dashboard.mapInactive')} />
        <Legend cls="bg-amber" label={t('dashboard.mapModeration')} />
      </div>
      <div className="relative overflow-hidden rounded-ctl border border-line bg-sunken">
        <svg
          viewBox={`${vx} ${vy} ${vw} ${vh}`}
          className="block aspect-[700/505] w-full transition-all duration-300"
          role="img"
          aria-label={t('dashboard.map')}
        >
          <defs>
            <pattern id="mapdots" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" className="fill-line" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#mapdots)" />
          <path
            d={outlinePath}
            className="fill-surface stroke-brand/40"
            strokeWidth={2 / zoom}
            strokeLinejoin="round"
          />
          {branches.map((b) => {
            const c = CITY[b.id];
            if (!c) return null;
            const [x, y] = xy(c);
            const r = 7 / zoom;
            return (
              <g
                key={b.id}
                className="cursor-pointer"
                onMouseEnter={() => setHover(b.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => navigate(generatePath(PATHS.superAdmin.branch, { branchId: b.id }))}
              >
                <circle cx={x} cy={y} r={r * 2.1} className={clsx(DOT[b.status], 'opacity-20')} />
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  className={clsx(DOT[b.status], 'stroke-surface')}
                  strokeWidth={2.5 / zoom}
                />
                <text
                  x={x + r * 1.8}
                  y={y + r * 0.6}
                  className="fill-ink font-semibold"
                  style={{ fontSize: 15 / zoom }}
                >
                  {b.name}
                </text>
              </g>
            );
          })}
        </svg>
        {hovered && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-ctl border border-line bg-surface px-3 py-2 text-xs shadow-pop">
            <p className="font-semibold">{hovered.name}</p>
            <p className="text-muted">
              {t('dashboard.studentsN', { n: formatNumber(hovered.studentsCount) })}
              {hovered.revenue !== undefined && ` · ${formatMoney(hovered.revenue)}`}
            </p>
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-ctl border border-line bg-surface shadow-sm">
          <button
            type="button"
            aria-label={t('dashboard.zoomIn')}
            disabled={zoom >= 2.5}
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.5))}
            className="grid h-8 w-8 place-items-center hover:bg-sunken disabled:opacity-40"
          >
            <FiPlus />
          </button>
          <button
            type="button"
            aria-label={t('dashboard.zoomOut')}
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            className="grid h-8 w-8 place-items-center border-t border-line hover:bg-sunken disabled:opacity-40"
          >
            <FiMinus />
          </button>
        </div>
      </div>
    </div>
  );
}

const Legend = ({ cls, label }: { cls: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={clsx('h-2 w-2 rounded-full', cls)} />
    {label}
  </span>
);
