import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { DeltaBar } from '../components/charts';
import { EXAMS, EXAM_DATES, BIOMARKERS, CATEGORIES } from '../data/biomarkers';
import { fmtDate, statusOf } from '../lib/utils';

function ExamPicker({ label, value, onChange, exclude }) {
  const [open, setOpen] = useState(false);
  const exam = EXAMS.find(e => e.id === value);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} className="card" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
        <div className="card-label">{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <div className="num" style={{ fontSize: 28, lineHeight: 1 }}>{new Date(exam.date).getDate()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>{exam.type}</div>
            <div className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>{exam.lab} · {fmtDate(exam.date)}</div>
          </div>
          <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 10, padding: 6, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}>
          {EXAMS.map(e => (
            <button key={e.id} disabled={e.id === exclude} onClick={() => { onChange(e.id); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                cursor: e.id === exclude ? 'not-allowed' : 'pointer',
                opacity: e.id === exclude ? 0.35 : 1,
                background: e.id === value ? 'var(--bg-3)' : 'transparent',
              }}>
              <span className="num" style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{new Date(e.date).getDate()}</span>
              <span style={{ flex: 1 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 14.5, display: 'block' }}>{e.type}</span>
                <span className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>{e.lab} · {fmtDate(e.date, { month: 'short', year: 'numeric' })}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ViewCompare() {
  const navigate = useNavigate();
  const [leftId, setLeftId] = useState(EXAMS[1]?.id);
  const [rightId, setRightId] = useState(EXAMS[0]?.id);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const left  = EXAMS.find(e => e.id === leftId);
  const right = EXAMS.find(e => e.id === rightId);
  const leftIdx  = EXAM_DATES.indexOf(left?.date);
  const rightIdx = EXAM_DATES.indexOf(right?.date);

  const rows = BIOMARKERS
    .filter(b => categoryFilter === 'all' || b.cat === categoryFilter)
    .map(b => {
      const a = b.values[leftIdx];
      const c = b.values[rightIdx];
      const deltaPctVal = (a != null && c != null && a !== 0) ? ((c - a) / a) * 100 : null;
      const stA = statusOf(a, b.range);
      const stC = statusOf(c, b.range);
      return { b, a, c, deltaPctVal, stA, stC };
    })
    .filter(r => {
      if (r.a == null && r.c == null) return false;
      if (filter === 'changed') return r.deltaPctVal != null && Math.abs(r.deltaPctVal) >= 5;
      if (filter === 'concerning') return r.stC !== 'ok' && r.stC !== 'none';
      return true;
    });

  const byCat = CATEGORIES.map(cat => ({
    cat, items: rows.filter(r => r.b.cat === cat.id)
  })).filter(g => g.items.length > 0);

  const summary = {
    improved: rows.filter(r => r.deltaPctVal != null && r.b.trend === 'improving' && Math.abs(r.deltaPctVal) >= 2).length,
    worsened: rows.filter(r => r.stC !== 'ok' && r.stA === 'ok').length,
    crossed:  rows.filter(r => r.stA !== 'ok' && r.stC === 'ok').length,
  };

  if (!left || !right) return null;

  return (
    <div className="fade-in">
      <PageHead
        eyebrow="comparar"
        title="<em>Comparar</em> exames"
        sub="Escolha dois exames para ver lado a lado o que mudou de forma relevante."
      />

      <div className="grid grid-2" style={{ marginBottom: 32 }}>
        <ExamPicker label="exame A · base" value={leftId} onChange={setLeftId} exclude={rightId} />
        <ExamPicker label="exame B · referência" value={rightId} onChange={setRightId} exclude={leftId} />
      </div>

      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <div className="card">
          <div className="card-label">total comparado</div>
          <div className="num" style={{ fontSize: 38, lineHeight: 1, marginTop: 6 }}>{rows.length}</div>
          <div className="subtle tiny" style={{ marginTop: 6 }}>biomarcadores em comum</div>
        </div>
        <div className="card">
          <div className="card-label">melhoraram</div>
          <div className="num" style={{ fontSize: 38, lineHeight: 1, marginTop: 6, color: 'var(--sage)' }}>{summary.improved}</div>
        </div>
        <div className="card">
          <div className="card-label">saíram da faixa</div>
          <div className="num" style={{ fontSize: 38, lineHeight: 1, marginTop: 6, color: 'var(--rust)' }}>{summary.worsened}</div>
        </div>
        <div className="card">
          <div className="card-label">voltaram à faixa</div>
          <div className="num" style={{ fontSize: 38, lineHeight: 1, marginTop: 6, color: 'var(--sage)' }}>{summary.crossed}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, padding: 4, background: 'var(--bg-2)', borderRadius: 999 }}>
          {[{ id: 'all', label: 'tudo' }, { id: 'changed', label: 'mudou ≥ 5%' }, { id: 'concerning', label: 'fora da faixa' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '6px 14px', borderRadius: 999,
              background: filter === f.id ? 'var(--bg)' : 'transparent',
              color: filter === f.id ? 'var(--ink)' : 'var(--ink-3)',
              fontSize: 12, fontFamily: 'var(--mono)',
              boxShadow: filter === f.id ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
            }}>{f.label}</button>
          ))}
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid var(--line-2)', background: 'var(--bg)', fontSize: 12, fontFamily: 'var(--mono)' }}>
          <option value="all">todas as categorias</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {byCat.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)' }}>
          Nenhum marcador correspondendo ao filtro.
        </div>
      ) : byCat.map(({ cat, items }) => (
        <section key={cat.id} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, margin: 0 }}>{cat.name}</h2>
            <span className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>{items.length} marcadores</span>
          </div>
          <div className="card" style={{ padding: '4px 22px' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Marcador</th>
                  <th className="right">A · {fmtDate(left.date, { month: 'short', year: '2-digit' })}</th>
                  <th className="right">B · {fmtDate(right.date, { month: 'short', year: '2-digit' })}</th>
                  <th className="right">Δ</th>
                  <th style={{ width: 90 }}></th>
                  <th className="right">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.b.id} className="clickable" onClick={() => navigate(`/biomarcadores/${r.b.id}`)}>
                    <td>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 14.5 }}>{r.b.name}</div>
                      <div className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>ref. {r.b.range[0]}–{r.b.range[1]} {r.b.unit}</div>
                    </td>
                    <td className="right">
                      <span className="num" style={{ fontSize: 15, color: r.stA === 'ok' ? 'var(--ink-2)' : r.stA === 'warn' ? 'var(--terra-2)' : 'var(--rust)' }}>{r.a ?? '—'}</span>
                    </td>
                    <td className="right">
                      <span className="num" style={{ fontSize: 16, color: r.stC === 'ok' ? 'var(--ink)' : r.stC === 'warn' ? 'var(--terra-2)' : 'var(--rust)' }}>{r.c ?? '—'}</span>
                    </td>
                    <td className="right">
                      {r.deltaPctVal == null ? <span className="subtle tiny">—</span> : (
                        <span className={`trend-arrow ${r.deltaPctVal > 1 ? 'up' : r.deltaPctVal < -1 ? 'down' : 'flat'}`}>
                          {r.deltaPctVal > 0 ? '+' : ''}{r.deltaPctVal.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td><DeltaBar a={r.a} c={r.c} range={r.b.range} /></td>
                    <td className="right">
                      {r.stA === r.stC
                        ? <span className="pill" style={{ background: 'transparent', color: 'var(--ink-3)' }}>sem mudança</span>
                        : r.stC === 'ok' ? <span className="pill pill--sage">↗ voltou à faixa</span>
                        : r.stA === 'ok' ? <span className="pill pill--rust">↘ saiu da faixa</span>
                        : <span className="pill pill--terra">mudou</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
