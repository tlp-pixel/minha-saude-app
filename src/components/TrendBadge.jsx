const MAP = {
  improving: { cls: 'pill--sage',  arrow: '↗', label: 'melhorando' },
  stable:    { cls: '',            arrow: '→', label: 'estável' },
  watch:     { cls: 'pill--terra', arrow: '↗', label: 'observar' },
  worsening: { cls: 'pill--rust',  arrow: '↘', label: 'piorando' },
};

export default function TrendBadge({ trend }) {
  const m = MAP[trend] || MAP.stable;
  return <span className={`pill ${m.cls}`}>{m.arrow} {m.label}</span>;
}
