export function statusOf(value, range) {
  if (value == null || range == null) return 'none';
  const [low, high] = range;
  if (low != null && value < low) return value < low * 0.85 ? 'bad' : 'warn';
  if (high != null && value > high) return value > high * 1.15 ? 'bad' : 'warn';
  return 'ok';
}

export function latestVal(values) {
  for (let i = values.length - 1; i >= 0; i--) if (values[i] != null) return values[i];
  return null;
}

export function prevVal(values) {
  let found = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] != null) {
      found++;
      if (found === 2) return values[i];
    }
  }
  return null;
}

export function latestOf(b) { return latestVal(b.values); }
export function prevOf(b)   { return prevVal(b.values); }
export function deltaPct(b) {
  const a = prevOf(b), c = latestOf(b);
  if (!a || c == null) return 0;
  return ((c - a) / a) * 100;
}

export function fmtDate(iso, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', opts);
}

export function pctInRange(v, range) {
  const [low, high] = range;
  const span = high - low;
  const min = low - span * 0.4;
  const max = high + span * 0.4;
  return Math.min(1, Math.max(0, (v - min) / (max - min)));
}
