import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { LineChart } from '../components/charts';
import { loadBiomarkers, isConfigured } from '../lib/storage';
import { statusOf } from '../lib/utils';
import { CATEGORY_META } from './ViewBiomarkers';

// ── Pivot table ──────────────────────────────────────────────────────────────

function PivotTable({ biomarkers }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const allBios = Object.values(biomarkers)
    .filter(b => b.measurements?.length > 0)
    .sort((a, b) => {
      const co = (CATEGORY_META[a.category]?.order ?? 99) - (CATEGORY_META[b.category]?.order ?? 99);
      return co !== 0 ? co : a.name.localeCompare(b.name, 'pt-BR');
    });

  // Build date → {bioId → measurement} lookup
  const lookup = {};
  for (const b of allBios) {
    for (const m of b.measurements || []) {
      if (!lookup[m.date]) lookup[m.date] = {};
      if (lookup[m.date][b.id] == null) lookup[m.date][b.id] = m.value;
    }
  }
  const allDates = Object.keys(lookup).sort();

  const filteredBios = allBios.filter(b => {
    if (catFilter !== 'all' && b.category !== catFilter) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Only dates that have at least one value for visible rows
  const visibleDates = allDates.filter(d =>
    filteredBios.some(b => lookup[d]?.[b.id] != null)
  );

  const cats = [...new Set(allBios.map(b => b.category || 'outros'))]
    .sort((a, b) => (CATEGORY_META[a]?.order ?? 99) - (CATEGORY_META[b]?.order ?? 99));

  const fmtCol = d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

  // Sticky column styles
  const stickyCell = {
    position: 'sticky', left: 0, background: 'var(--bg)',
    zIndex: 2, borderRight: '1px solid var(--line)',
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filtrar biomarcador…"
          style={{ padding: '7px 14px', border: '1px solid var(--line-2)', borderRadius: 999, background: 'var(--bg-2)', fontSize: 13, fontFamily: 'var(--serif)', width: 200 }}
        />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => setCatFilter('all')} style={{
            padding: '5px 12px', borderRadius: 999, fontSize: 11.5, fontFamily: 'var(--mono)',
            background: catFilter === 'all' ? 'var(--ink)' : 'var(--bg-2)', color: catFilter === 'all' ? 'var(--bg)' : 'var(--ink-3)',
          }}>todas</button>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(catFilter === c ? 'all' : c)} style={{
              padding: '5px 12px', borderRadius: 999, fontSize: 11.5, fontFamily: 'var(--mono)',
              background: catFilter === c ? 'var(--ink)' : 'var(--bg-2)', color: catFilter === c ? 'var(--bg)' : 'var(--ink-3)',
            }}>{CATEGORY_META[c]?.label ?? c}</button>
          ))}
        </div>
        <span className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginLeft: 'auto' }}>
          {filteredBios.length} marcadores · {visibleDates.length} datas
        </span>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 'var(--r-xl)', border: '1px solid var(--line)' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', minWidth: visibleDates.length * 72 + 220 }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)' }}>
              <th style={{ ...stickyCell, background: 'var(--bg-2)', padding: '10px 16px', textAlign: 'left', fontFamily: 'var(--serif)', fontSize: 13, fontWeight: 600, minWidth: 200 }}>
                Biomarcador
              </th>
              {visibleDates.map(d => (
                <th key={d} style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, whiteSpace: 'nowrap', minWidth: 68 }}>
                  {fmtCol(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBios.map((b, ri) => {
              const hasAny = visibleDates.some(d => lookup[d]?.[b.id] != null);
              if (!hasAny) return null;
              return (
                <tr key={b.id} style={{ borderTop: '1px solid var(--line)', background: ri % 2 === 0 ? 'var(--bg)' : 'var(--bg-2)' }}>
                  <td style={{ ...stickyCell, padding: '9px 16px', background: ri % 2 === 0 ? 'var(--bg)' : 'var(--bg-2)' }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.2 }}>{b.name}</div>
                    {b.unit && <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{b.unit}{b.range ? ` · ${b.range[0]}–${b.range[1]}` : ''}</div>}
                  </td>
                  {visibleDates.map(d => {
                    const v = lookup[d]?.[b.id];
                    if (v == null) return <td key={d} style={{ padding: '9px 8px', textAlign: 'center', color: 'var(--line-2)', fontSize: 11 }}>·</td>;
                    const st = b.range ? statusOf(v, b.range) : 'none';
                    const bg = st === 'bad' ? 'var(--rust-soft)' : st === 'warn' ? 'rgba(var(--terra-rgb,180,120,60),0.08)' : 'transparent';
                    const col = st === 'bad' ? 'var(--rust)' : st === 'warn' ? 'var(--terra-2)' : 'var(--ink)';
                    return (
                      <td key={d} style={{ padding: '9px 8px', textAlign: 'center', background: bg }}>
                        <span className="num" style={{ fontSize: 14, color: col }}>{v}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="subtle tiny" style={{ marginTop: 10, fontFamily: 'var(--mono)', textAlign: 'right' }}>
        vermelho = fora da faixa · amarelo = no limite · · = não medido nesta data
      </div>
    </div>
  );
}

// ── Chart comparison (existing) ───────────────────────────────────────────────

function ChartView({ biomarkers }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const bioList = Object.values(biomarkers)
    .filter(b => b.measurements?.length > 1)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const filtered = bioList.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()));

  function toggle(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 4 ? [...s, id] : s);
  }

  const selectedBios = selected.map(id => biomarkers[id]).filter(Boolean);
  const COLORS = ['var(--sage)', 'var(--terra)', 'var(--rust)', 'var(--ink-2)'];

  if (bioList.length < 2) return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 10 }}>Dados insuficientes</div>
      <div className="subtle" style={{ fontSize: 14, marginBottom: 24 }}>Envie pelo menos 2 exames para comparar.</div>
      <button className="btn btn--sage" onClick={() => navigate('/upload')}>＋ Enviar PDF</button>
    </div>
  );

  return (
    <div className="grid" style={{ gridTemplateColumns: '260px 1fr', gap: 28 }}>
      <div>
        <div className="card-label" style={{ marginBottom: 10 }}>selecionar ({selected.length}/4)</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--bg-2)', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 520, overflowY: 'auto' }}>
          {filtered.map(b => {
            const isSelected = selected.includes(b.id);
            const v = b.measurements?.at(-1)?.value;
            const st = b.range ? statusOf(v, b.range) : 'none';
            return (
              <button key={b.id} onClick={() => toggle(b.id)} style={{
                padding: '9px 12px', borderRadius: 'var(--r-md)', textAlign: 'left',
                background: isSelected ? 'var(--sage-soft)' : 'var(--bg-2)',
                border: `1.5px solid ${isSelected ? 'var(--sage)' : 'transparent'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                opacity: !isSelected && selected.length === 4 ? 0.4 : 1,
              }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 14 }}>{b.name}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: st === 'ok' ? 'var(--sage)' : st !== 'none' ? 'var(--terra-2)' : 'var(--ink-3)' }}>{v} {b.unit}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        {selectedBios.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '64px 40px', color: 'var(--ink-3)' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 8 }}>Selecione biomarcadores</div>
            <div style={{ fontSize: 13.5 }}>Escolha até 4 na lista à esquerda.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {selectedBios.map((b, i) => {
              const ms = [...(b.measurements || [])].sort((a, z) => a.date.localeCompare(z.date));
              const v = ms.at(-1)?.value;
              const st = b.range ? statusOf(v, b.range) : 'none';
              return (
                <div key={b.id} className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i], display: 'inline-block' }} />
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>{b.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="num" style={{ fontSize: 22 }}>{v}<span className="unit">{b.unit}</span></span>
                      {st === 'ok'   && <span className="pill pill--sage">na faixa</span>}
                      {st === 'warn' && <span className="pill pill--terra">no limite</span>}
                      {st === 'bad'  && <span className="pill pill--rust">fora</span>}
                    </div>
                  </div>
                  <LineChart values={ms.map(m => m.value)} dates={ms.map(m => m.date)} range={b.range} unit={b.unit} width={600} height={180} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ViewCompare() {
  const [biomarkers, setBiomarkers] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tabela');

  useEffect(() => {
    if (!isConfigured()) { setLoading(false); return; }
    loadBiomarkers().then(data => {
      setBiomarkers(data || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const total = Object.values(biomarkers).filter(b => b.measurements?.length > 0).length;

  return (
    <div className="fade-in">
      <PageHead
        eyebrow="análise comparativa"
        title="<em>Comparar</em>"
        sub="Tabela pivot com todos os marcadores × datas, ou gráficos de evolução lado a lado."
      />

      {loading ? (
        <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>carregando…</div>
      ) : total === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 10 }}>Nenhum dado ainda</div>
          <div className="subtle" style={{ fontSize: 14 }}>Envie exames para começar.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 28, padding: 4, background: 'var(--bg-2)', borderRadius: 999, width: 'fit-content' }}>
            {[{ id: 'tabela', label: 'Tabela pivot' }, { id: 'graficos', label: 'Gráficos' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '7px 18px', borderRadius: 999, fontSize: 13, fontFamily: 'var(--mono)',
                background: tab === t.id ? 'var(--bg)' : 'transparent',
                color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}>{t.label}</button>
            ))}
          </div>

          {tab === 'tabela' ? <PivotTable biomarkers={biomarkers} /> : <ChartView biomarkers={biomarkers} />}
        </>
      )}
    </div>
  );
}
