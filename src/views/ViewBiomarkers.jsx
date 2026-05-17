import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { Sparkline } from '../components/charts';
import { BIOMARKERS, CATEGORIES } from '../data/biomarkers';
import { latestOf, deltaPct, statusOf } from '../lib/utils';

export default function ViewBiomarkers() {
  const navigate = useNavigate();
  const [cat, setCat] = useState('all');
  const cats = [{ id: 'all', name: 'Tudo' }, ...CATEGORIES];
  const grouped = cat === 'all'
    ? CATEGORIES.map(c => ({ cat: c, items: BIOMARKERS.filter(b => b.cat === c.id) }))
    : [{ cat: CATEGORIES.find(c => c.id === cat), items: BIOMARKERS.filter(b => b.cat === cat) }];

  return (
    <div className="fade-in">
      <PageHead
        eyebrow={`${BIOMARKERS.length} biomarcadores em ${CATEGORIES.length} categorias`}
        title="<em>Biomarcadores</em>"
        sub="Tudo que foi extraído dos seus PDFs, agrupado por sistema. Clique para ver evolução temporal."
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 32, flexWrap: 'wrap' }}>
        {cats.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`pill ${cat === c.id ? 'pill--sage' : ''}`}
            style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}>
            {c.name}
          </button>
        ))}
      </div>

      {grouped.map(({ cat: c, items }) => !c ? null : (
        <section key={c.id} style={{ marginBottom: 44 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, margin: 0, letterSpacing: '-0.015em' }}>{c.name}</h2>
            <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{c.desc}</span>
            <span className="subtle tiny" style={{ marginLeft: 'auto', fontFamily: 'var(--mono)' }}>{items.length} marcadores</span>
          </div>

          <div className="grid grid-3">
            {items.map(b => {
              const v = latestOf(b);
              const status = statusOf(v, b.range);
              const d = deltaPct(b);
              return (
                <button key={b.id} className="card" onClick={() => navigate(`/biomarcadores/${b.id}`)} style={{ textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.2 }}>{b.name}</div>
                    {status === 'ok' ? null : status === 'warn'
                      ? <span className="pill pill--terra">no limite</span>
                      : <span className="pill pill--rust">fora</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
                    <span className="num" style={{ fontSize: 30, lineHeight: 1, color: status === 'ok' ? 'var(--ink)' : status === 'warn' ? 'var(--terra-2)' : 'var(--rust)' }}>
                      {v ?? '—'}
                    </span>
                    <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{b.unit}</span>
                    <span className={`trend-arrow ${d > 1 ? 'up' : d < -1 ? 'down' : 'flat'}`} style={{ marginLeft: 'auto' }}>
                      {d > 0 ? '+' : ''}{d.toFixed(1)}%
                    </span>
                  </div>
                  <div className="subtle tiny" style={{ marginTop: 4, fontFamily: 'var(--mono)' }}>ref. {b.range[0]}–{b.range[1]}</div>
                  <div style={{ marginTop: 14 }}>
                    <Sparkline values={b.values} range={b.range} width={240} height={36} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
