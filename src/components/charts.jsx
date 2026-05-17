import { useState } from 'react';
import { statusOf, pctInRange, latestVal } from '../lib/utils';

export function RefBar({ value, range }) {
  if (value == null || !range) return <div className="refbar" />;
  const [low, high] = range;
  const span = high - low;
  const min = low - span * 0.4;
  const max = high + span * 0.4;
  const left = ((low - min) / (max - min)) * 100;
  const width = (span / (max - min)) * 100;
  const dotLeft = pctInRange(value, range) * 100;
  const status = statusOf(value, range);
  return (
    <div className="refbar">
      <div className="range" style={{ left: `${left}%`, width: `${width}%` }} />
      <div className={`dot ${status === 'warn' ? 'warn' : status === 'bad' ? 'bad' : ''}`} style={{ left: `${dotLeft}%` }} />
    </div>
  );
}

export function Sparkline({ values, range, width = 92, height = 26, ariaLabel }) {
  if (!values || values.length < 2) return null;
  const all = [...values.filter(v => v != null), range?.[0], range?.[1]].filter(v => v != null);
  if (all.length < 2) return null;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const pad = 2;

  const segments = [];
  let cur = [];
  values.forEach((v, i) => {
    if (v == null) { if (cur.length) { segments.push(cur); cur = []; } return; }
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    cur.push([x, y]);
  });
  if (cur.length) segments.push(cur);
  if (!segments.length) return null;

  const last = latestVal(values);
  const lastStatus = statusOf(last, range);
  const stroke = lastStatus === 'ok' ? 'var(--sage)' : lastStatus === 'warn' ? 'var(--terra-2)' : 'var(--rust)';

  let band = null;
  if (range) {
    const yHigh = height - pad - ((range[1] - min) / span) * (height - pad * 2);
    const yLow  = height - pad - ((range[0] - min) / span) * (height - pad * 2);
    band = <rect x={0} y={Math.min(yHigh, yLow)} width={width} height={Math.abs(yHigh - yLow)} fill="var(--sage-soft)" opacity="0.55" />;
  }
  const lastPoint = segments[segments.length - 1][segments[segments.length - 1].length - 1];

  return (
    <svg width={width} height={height} aria-label={ariaLabel} role="img">
      {band}
      {segments.map((seg, si) => (
        <path key={si}
          d={seg.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
          fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="2.5" fill={stroke} />
    </svg>
  );
}

export function LineChart({ values, dates, range, unit, width = 720, height = 280 }) {
  const padL = 56, padR = 24, padT = 24, padB = 38;
  const w = width - padL - padR;
  const h = height - padT - padB;
  const all = [...values.filter(v => v != null), range?.[0], range?.[1]].filter(v => v != null);
  const minRaw = Math.min(...all);
  const maxRaw = Math.max(...all);
  const span = (maxRaw - minRaw) || 1;
  const min = minRaw - span * 0.12;
  const max = maxRaw + span * 0.12;

  const x = i => padL + (i / Math.max(1, values.length - 1)) * w;
  const y = v => padT + h - ((v - min) / (max - min)) * h;

  const segments = [];
  let cur = [];
  values.forEach((v, i) => {
    if (v == null) { if (cur.length) { segments.push(cur); cur = []; } return; }
    cur.push({ x: x(i), y: y(v), v, i });
  });
  if (cur.length) segments.push(cur);

  const yLow  = y(range[0]);
  const yHigh = y(range[1]);

  const yTicks = 4;
  const ticks = [];
  for (let i = 0; i <= yTicks; i++) {
    const v = min + (i / yTicks) * (max - min);
    ticks.push({ v: v.toFixed(v >= 100 ? 0 : 1), y: y(v) });
  }

  const [hover, setHover] = useState(null);

  return (
    <svg width={width} height={height} style={{ display: 'block', maxWidth: '100%' }}>
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sage)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--sage)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x={padL} y={Math.min(yLow, yHigh)} width={w} height={Math.abs(yLow - yHigh)} fill="var(--sage-soft)" opacity="0.55" />
      <line x1={padL} y1={yLow}  x2={padL + w} y2={yLow}  stroke="var(--sage)" strokeOpacity="0.45" strokeDasharray="3 4" />
      <line x1={padL} y1={yHigh} x2={padL + w} y2={yHigh} stroke="var(--sage)" strokeOpacity="0.45" strokeDasharray="3 4" />
      <text x={padL + w - 4} y={Math.min(yLow, yHigh) - 6} fill="var(--sage)" fontSize="10" fontFamily="var(--mono)" textAnchor="end">faixa de referência</text>

      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={padL + w} y2={t.y} stroke="var(--line)" strokeOpacity="0.6" />
          <text x={padL - 10} y={t.y + 4} textAnchor="end" fontSize="10.5" fill="var(--ink-3)" fontFamily="var(--mono)">{t.v}</text>
        </g>
      ))}

      {segments.map((seg, si) => {
        const linePath = seg.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
        const areaPath = seg.length >= 2 ? `${linePath} L${seg[seg.length - 1].x},${padT + h} L${seg[0].x},${padT + h} Z` : '';
        return (
          <g key={si}>
            {areaPath && <path d={areaPath} fill="url(#lineFill)" />}
            <path d={linePath} fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}

      {segments.flat().map((p, k) => {
        const status = statusOf(p.v, range);
        const fill = status === 'ok' ? 'var(--bg)' : status === 'warn' ? 'var(--terra-2)' : 'var(--rust)';
        const stroke = status === 'ok' ? 'var(--ink)' : fill;
        return (
          <g key={k}>
            <circle cx={p.x} cy={p.y} r="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
            <circle cx={p.x} cy={p.y} r="14" fill="transparent"
              onMouseEnter={() => setHover(p.i)} onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }} />
          </g>
        );
      })}

      {dates.map((d, i) => {
        const lbl = new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        return (
          <text key={i} x={x(i)} y={padT + h + 22} textAnchor="middle" fontSize="10.5" fill="var(--ink-3)" fontFamily="var(--mono)">{lbl}</text>
        );
      })}

      {hover != null && values[hover] != null && (
        <g pointerEvents="none">
          <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + h} stroke="var(--ink)" strokeOpacity="0.2" />
          <g transform={`translate(${x(hover)}, ${y(values[hover]) - 14})`}>
            <rect x={-46} y={-30} width="92" height="28" rx="6" fill="var(--ink)" />
            <text x="0" y="-16" textAnchor="middle" fill="var(--bg)" fontSize="11.5" fontFamily="var(--serif)" fontStyle="italic">{values[hover]}{unit ? ' ' + unit : ''}</text>
            <text x="0" y="-4" textAnchor="middle" fill="var(--bg)" opacity="0.7" fontSize="9.5" fontFamily="var(--mono)">{new Date(dates[hover]).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</text>
          </g>
        </g>
      )}
    </svg>
  );
}

export function Bullet({ value, range, unit, name }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{name}</span>
        <span className="num" style={{ fontSize: 18 }}>
          {value ?? '—'}<span className="unit">{unit}</span>
        </span>
      </div>
      <RefBar value={value} range={range} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span className="tiny subtle" style={{ fontFamily: 'var(--mono)' }}>{range[0]}</span>
        <span className="tiny subtle" style={{ fontFamily: 'var(--mono)' }}>{range[1]}</span>
      </div>
    </div>
  );
}

export function DeltaBar({ a, c, range }) {
  if (a == null || c == null) return null;
  const [low, high] = range;
  const span = high - low;
  const min = low - span * 0.4;
  const max = high + span * 0.4;
  const pct = v => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  const aPct = pct(a), cPct = pct(c);
  const bandLeft = ((low - min) / (max - min)) * 100;
  const bandWidth = (span / (max - min)) * 100;
  const fromX = Math.min(aPct, cPct);
  const toX = Math.max(aPct, cPct);
  const direction = c > a ? 'up' : c < a ? 'down' : 'flat';
  return (
    <div style={{ position: 'relative', height: 18, width: '100%' }}>
      <div style={{ position: 'absolute', top: 7, left: 0, right: 0, height: 4, background: 'var(--bg-3)', borderRadius: 999 }} />
      <div style={{ position: 'absolute', top: 7, left: `${bandLeft}%`, width: `${bandWidth}%`, height: 4, background: 'var(--sage-soft)', borderRadius: 999 }} />
      <div style={{ position: 'absolute', top: 8, left: `${fromX}%`, width: `${toX - fromX}%`, height: 2, background: direction === 'up' ? 'var(--sage)' : direction === 'down' ? 'var(--rust)' : 'var(--ink-3)' }} />
      <div style={{ position: 'absolute', top: 5, left: `${aPct}%`, transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: 'var(--bg)', border: '1.5px solid var(--ink-3)' }} />
      <div style={{ position: 'absolute', top: 5, left: `${cPct}%`, transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: 'var(--ink)', border: '1.5px solid var(--ink)' }} />
    </div>
  );
}

export function ConfidenceRing({ value }) {
  const R = 14, C = 2 * Math.PI * R;
  const off = C * (1 - value);
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" aria-label={`confiança ${(value * 100).toFixed(0)}%`}>
      <circle cx={16} cy={16} r={R} fill="none" stroke="var(--bg-3)" strokeWidth="2.5" />
      <circle cx={16} cy={16} r={R} fill="none" stroke="var(--sage)" strokeWidth="2.5"
        strokeDasharray={C} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 16 16)" />
      <text x={16} y={19} textAnchor="middle" fontSize="9" fontFamily="var(--mono)" fill="var(--ink-2)">
        {(value * 100).toFixed(0)}
      </text>
    </svg>
  );
}
