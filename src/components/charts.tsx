import { useState, type ReactNode } from 'react';

/* Validated categorical palette (light surface): teal, blue, orange, purple, red, cyan */
export const SERIES = ['#0f9f7a', '#3b6fe0', '#d9762b', '#8a5cd6', '#d6455d', '#0a8fb8'];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
export const GROSS = [3820, 4210, 4680, 4390, 5120, 5640, 6080, 5870, 6310, 6920, 7480];
export const NET = GROSS.map((g) => Math.round(g * 0.872));
export const CUSTOMERS = [212, 238, 261, 249, 284, 311, 336, 322, 347, 372, 398];
export const DISHES = [
  { name: 'Banh mi', value: 2140 },
  { name: 'Pho Soup', value: 1486 },
  { name: 'Vermicelli Bowls', value: 902 },
  { name: 'Rice Bowls', value: 734 },
  { name: 'Fresh Spring Rolls', value: 618 },
  { name: 'Drinks', value: 602 },
];
export const ORDER_TYPES = [
  { name: 'Pick up', value: 412 },
  { name: 'For here', value: 1286 },
  { name: 'Delivery', value: 238 },
  { name: 'To go', value: 874 },
];

const money = (n: number) => '$' + n.toLocaleString('en-US');

function barPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

function Tooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div className="ch-tip" style={{ left: `${x}%`, top: `${y}%` }}>
      {children}
    </div>
  );
}

/* ---------------- Line / area: revenue ---------------- */
export function RevenueChart() {
  const W = 720, H = 280, L = 52, R = 12, T = 14, B = 30;
  const max = 8000;
  const xs = (i: number) => L + (i * (W - L - R)) / (MONTHS.length - 1);
  const ys = (v: number) => T + (1 - v / max) * (H - T - B);
  const line = (d: number[]) => d.map((v, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join('');
  const area = (d: number[]) => `${line(d)}L${xs(d.length - 1)},${ys(0)}L${xs(0)},${ys(0)}Z`;
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="ch">
      <div className="ch-legend">
        <span><i style={{ background: SERIES[0] }} />Total gross</span>
        <span><i style={{ background: SERIES[1] }} />Total net</span>
      </div>
      <div className="ch-plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Monthly gross and net revenue, January to November 2026">
          <defs>
            <linearGradient id="gGross" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={SERIES[0]} stopOpacity=".22" />
              <stop offset="1" stopColor={SERIES[0]} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 2000, 4000, 6000, 8000].map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={ys(v)} y2={ys(v)} className="ch-grid" />
              <text x={L - 10} y={ys(v) + 4} className="ch-axis" textAnchor="end">{v ? `$${v / 1000}k` : '$0'}</text>
            </g>
          ))}
          {MONTHS.map((m, i) => (
            <text key={m} x={xs(i)} y={H - 8} className="ch-axis" textAnchor="middle">{m}</text>
          ))}
          <path d={area(GROSS)} fill="url(#gGross)" className="ch-fade" />
          <path d={line(GROSS)} fill="none" stroke={SERIES[0]} strokeWidth="2" className="ch-draw" />
          <path d={line(NET)} fill="none" stroke={SERIES[1]} strokeWidth="2" className="ch-draw d2" />
          <text x={xs(10) - 6} y={ys(GROSS[10]) - 12} className="ch-label" textAnchor="end">Gross {money(GROSS[10])}</text>
          {hover !== null && (
            <g>
              <line x1={xs(hover)} x2={xs(hover)} y1={T} y2={ys(0)} className="ch-cross" />
              {[GROSS, NET].map((d, k) => (
                <circle key={k} cx={xs(hover)} cy={ys(d[hover])} r="5" fill={SERIES[k]} stroke="#fff" strokeWidth="2" />
              ))}
            </g>
          )}
          <rect
            x={L} y={T} width={W - L - R} height={H - T - B} fill="transparent"
            onMouseMove={(e) => {
              const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
              const i = Math.round(((e.clientX - r.left) / r.width) * (MONTHS.length - 1));
              setHover(Math.max(0, Math.min(MONTHS.length - 1, i)));
            }}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
        {hover !== null && (
          <Tooltip x={(xs(hover) / W) * 100} y={(ys(GROSS[hover]) / H) * 100}>
            <b>{MONTHS[hover]} 2026</b>
            <span><i style={{ background: SERIES[0] }} />Gross <em>{money(GROSS[hover])}</em></span>
            <span><i style={{ background: SERIES[1] }} />Net <em>{money(NET[hover])}</em></span>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/* ---------------- Vertical bars (single series) ---------------- */
export function BarChart({
  labels, values, max, ticks, fmt, color = SERIES[0], label, height = 260,
}: {
  labels: string[]; values: number[]; max: number; ticks: number[]; fmt: (n: number) => string; color?: string; label: string; height?: number;
}) {
  const W = 720, H = height, L = 46, R = 8, T = 22, B = 30;
  const n = values.length;
  const slot = (W - L - R) / n;
  const bw = Math.min(46, slot * 0.56);
  const ys = (v: number) => T + (1 - v / max) * (H - T - B);
  const [hover, setHover] = useState<number | null>(null);
  const peak = values.indexOf(Math.max(...values));
  return (
    <div className="ch">
      <div className="ch-plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={ys(v)} y2={ys(v)} className="ch-grid" />
              <text x={L - 10} y={ys(v) + 4} className="ch-axis" textAnchor="end">{fmt(v)}</text>
            </g>
          ))}
          {values.map((v, i) => {
            const x = L + i * slot + (slot - bw) / 2;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={L + i * slot} y={T} width={slot} height={H - T - B} fill="transparent" />
                <path
                  d={barPath(x, ys(v), bw, ys(0) - ys(v))}
                  fill={color}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  className="ch-bar"
                  style={{ animationDelay: `${i * 45}ms` }}
                />
                <text x={x + bw / 2} y={H - 8} className="ch-axis" textAnchor="middle">{labels[i]}</text>
                {i === peak && <text x={x + bw / 2} y={ys(v) - 8} className="ch-label" textAnchor="middle">{fmt(v)}</text>}
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <Tooltip x={((L + hover * slot + slot / 2) / W) * 100} y={(ys(values[hover]) / H) * 100}>
            <b>{labels[hover]}</b>
            <span><i style={{ background: color }} />{values[hover].toLocaleString('en-US')}</span>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/* ---------------- Donut: dishes ---------------- */
export function DishesDonut() {
  const total = DISHES.reduce((a, d) => a + d.value, 0);
  const R = 92, r = 64, C = 120;
  const [hover, setHover] = useState<number | null>(null);
  let acc = 0;
  const gap = 0.012; // radians of surface gap between segments
  const arcs = DISHES.map((d) => {
    const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2 + gap;
    acc += d.value;
    const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2 - gap;
    const p = (rad: number, a: number) => `${C + rad * Math.cos(a)},${C + rad * Math.sin(a)}`;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${p(R, a0)}A${R},${R} 0 ${large} 1 ${p(R, a1)}L${p(r, a1)}A${r},${r} 0 ${large} 0 ${p(r, a0)}Z`;
  });
  const cur = hover === null ? null : DISHES[hover];
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 240 240" className="donut" role="img" aria-label="Dishes ordered by category">
        {arcs.map((d, i) => (
          <path
            key={i} d={d} fill={SERIES[i]} className="ch-seg" style={{ animationDelay: `${i * 70}ms` }}
            opacity={hover === null || hover === i ? 1 : 0.35}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
          />
        ))}
        <text x="120" y="116" textAnchor="middle" className="donut-num">{(cur ? cur.value : total).toLocaleString('en-US')}</text>
        <text x="120" y="140" textAnchor="middle" className="donut-cap">{cur ? cur.name.toUpperCase() : 'TOTAL ORDERED'}</text>
      </svg>
      <ul className="donut-legend">
        {DISHES.map((d, i) => (
          <li key={d.name} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={hover === i ? 'on' : ''}>
            <i style={{ background: SERIES[i] }} />
            <span>{d.name}</span>
            <b>{d.value.toLocaleString('en-US')}</b>
            <em>{((d.value / total) * 100).toFixed(1)}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Sparkline for KPI tiles ---------------- */
export function Spark({ data, color = SERIES[0] }: { data: number[]; color?: string }) {
  const W = 120, H = 36;
  const min = Math.min(...data), max = Math.max(...data);
  const d = data.map((v, i) => `${i ? 'L' : 'M'}${(i / (data.length - 1)) * W},${H - 3 - ((v - min) / (max - min)) * (H - 6)}`).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="spark" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2" className="ch-draw" />
    </svg>
  );
}
