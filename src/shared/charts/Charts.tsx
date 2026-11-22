import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useChartColors } from './useChartColors';

const tooltipStyle = (c: ReturnType<typeof useChartColors>) => ({
  contentStyle: {
    background: c.surface,
    border: `1px solid ${c.line}`,
    borderRadius: 12,
    fontSize: 13,
    color: c.ink,
  },
  labelStyle: { color: c.muted },
  cursor: { stroke: c.line, fill: c.line, fillOpacity: 0.3 },
});

/** Линейный тренд с заливкой */
export function TrendChart({
  data,
  xKey,
  yKey,
  height = 240,
  name,
  yFormat,
}: {
  data: object[];
  xKey: string;
  yKey: string;
  height?: number;
  name?: string;
  yFormat?: (v: number) => string;
}) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.brand} stopOpacity={0.25} />
            <stop offset="100%" stopColor={c.brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={c.line} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tick={{ fill: c.muted, fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: c.muted, fontSize: 12 }}
          tickFormatter={yFormat}
          width={yFormat ? 48 : 60}
        />
        <Tooltip {...tooltipStyle(c)} />
        <Area
          type="monotone"
          dataKey={yKey}
          name={name}
          stroke={c.brand}
          strokeWidth={2.5}
          fill="url(#trendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Сравнение: столбцы (текущий период + предыдущий) */
export function CompareBarChart({
  data,
  xKey,
  bars,
  height = 260,
  yFormat,
}: {
  data: object[];
  xKey: string;
  bars: { key: string; name: string; muted?: boolean }[];
  height?: number;
  yFormat?: (v: number) => string;
}) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke={c.line} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tick={{ fill: c.muted, fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: c.muted, fontSize: 12 }}
          tickFormatter={yFormat}
          width={yFormat ? 48 : 60}
        />
        <Tooltip {...tooltipStyle(c)} />
        {bars.map((b) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.name}
            fill={b.muted ? c.line : c.brand}
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Кольцевая диаграмма + легенда */
export function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 180,
}: {
  data: { name: string; value: number; color?: string }[];
  centerLabel?: string;
  centerValue?: string | number;
  size?: number;
}) {
  const c = useChartColors();
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={d.color ?? c.series[i % c.series.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle(c)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="h-display text-2xl">{centerValue ?? total}</span>
          {centerLabel && <span className="text-xs text-muted">{centerLabel}</span>}
        </div>
      </div>
      <ul className="flex w-full flex-col gap-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: d.color ?? c.series[i % c.series.length] }}
            />
            <span className="flex-1 text-muted">{d.name}</span>
            <span className="font-medium">{d.value}</span>
            <span className="w-10 text-right text-xs text-muted">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
