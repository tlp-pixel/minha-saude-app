import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { Sparkline } from '../components/charts';
import { loadBiomarkers, isConfigured, migrateBiomarkerCategories, mergeBiomarkerAliases } from '../lib/storage';
import { statusOf } from '../lib/utils';

export const CATEGORY_META = {
  hemograma:     { label: 'Hemograma',          emoji: '🩸', order: 1 },
  leucograma:    { label: 'Leucograma',          emoji: '🔬', order: 2 },
  lipideos:      { label: 'Perfil Lipídico',     emoji: '🫀', order: 3 },
  glicemico:     { label: 'Perfil Glicêmico',    emoji: '📊', order: 4 },
  renal:         { label: 'Função Renal',         emoji: '🫘', order: 5 },
  hepatico:      { label: 'Função Hepática',      emoji: '🫁', order: 6 },
  tireoide:      { label: 'Tireoide',             emoji: '⚡', order: 7 },
  hormonios:     { label: 'Hormônios',            emoji: '⚗️', order: 8 },
  vitaminas:     { label: 'Vitaminas e Minerais', emoji: '💊', order: 9 },
  inflamatorios: { label: 'Inflamatórios',        emoji: '🔥', order: 10 },
  bioquimica:    { label: 'Bioquímica',           emoji: '🧪', order: 11 },
  urina:         { label: 'Urina',                emoji: '💧', order: 12 },
  usg:           { label: 'Imagem / USG',         emoji: '🔭', order: 13 },
  outros:        { label: 'Outros',               emoji: '📋', order: 99 },
};

function ListView({ filtered, navigate }) {
  return (
    <div className="card" style={{ padding: '4px 22px', overflowX: 'auto' }}>
      <table className="tbl" style={{ minWidth: 700 }}>
        <thead>
          <tr>
            <th>Biomarcador</th>
            <th>Categoria</th>
            <th className="right">Último valor</th>
            <th>Unidade</th>
            <th>Referência</th>
            <th className="right">Var.</th>
            <th className="right">Status</th>
            <th className="right">n</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(b => {
            const m = b.measurements || [];
            const last = m.at(-1);
            const v = last?.value;
            const st = b.range ? statusOf(v, b.range) : 'none';
            const prev = m.at(-2)?.value;
            const delta = prev != null && v != null ? ((v - prev) / prev) * 100 : null;
            return (
              <tr key={b.id} onClick={() => navigate(`/biomarcadores/${b.id}`)} style={{ cursor: 'pointer' }}>
                <td style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>{b.name}</td>
                <td className="subtle tiny" style={{ fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>{CATEGORY_META[b.category]?.label ?? b.category ?? '—'}</td>
                <td className="right">
                  <span className="num" style={{ fontSize: 16, color: st === 'bad' ? 'var(--rust)' : st === 'warn' ? 'var(--terra-2)' : 'var(--ink)' }}>{v ?? '—'}</span>
                </td>
                <td className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>{b.unit}</td>
                <td className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>{b.range ? `${b.range[0]}–${b.range[1]}` : '—'}</td>
                <td className="right">
                  {delta != null && <span className={`trend-arrow ${delta > 1 ? 'up' : delta < -1 ? 'down' : 'flat'}`} style={{ fontSize: 11 }}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>}
                </td>
                <td className="right">
                  {st === 'ok'   && <span className="pill pill--sage" style={{ fontSize: 10 }}>✓ ok</span>}
                  {st === 'warn' && <span className="pill pill--terra" style={{ fontSize: 10 }}>limite</span>}
                  {st === 'bad'  && <span className="pill pill--rust" style={{ fontSize: 10 }}>fora</span>}
                  {st === 'none' && <span className="pill" style={{ fontSize: 10 }}>—</span>}
                </td>
                <td className="right subtle tiny" style={{ fontFamily: 'var(--mono)' }}>{m.length}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BioCard({ b, navigate }) {
  const measurements = b.measurements || [];
  const last = measurements.at(-1);
  const v = last?.value;
  const status = b.range ? statusOf(v, b.range) : 'none';
  const values = measurements.map(m => m.value);
  const prev = measurements.at(-2)?.value;
  const delta = prev != null && v != null ? ((v - prev) / prev) * 100 : null;

  return (
    <button className="card" onClick={() => navigate(`/biomarcadores/${b.id}`)} style={{ textAlign: 'left', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.2 }}>{b.name}</div>
        {status === 'warn' && <span className="pill pill--terra" style={{ flexShrink: 0 }}>limite</span>}
        {status === 'bad'  && <span className="pill pill--rust" style={{ flexShrink: 0 }}>fora</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
        <span className="num" style={{
          fontSize: 26, lineHeight: 1,
          color: status === 'bad' ? 'var(--rust)' : status === 'warn' ? 'var(--terra-2)' : 'var(--ink)',
        }}>{v ?? '—'}</span>
        <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{b.unit}</span>
        {delta != null && (
          <span className={`trend-arrow ${delta > 1 ? 'up' : delta < -1 ? 'down' : 'flat'}`} style={{ marginLeft: 'auto', fontSize: 11 }}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
          </span>
        )}
      </div>
      {b.range && (
        <div className="subtle tiny" style={{ marginTop: 3, fontFamily: 'var(--mono)' }}>
          ref. {b.range[0]}–{b.range[1]}
        </div>
      )}
      {values.length > 1 && (
        <div style={{ marginTop: 10 }}>
          <Sparkline values={values} range={b.range} width={220} height={30} />
        </div>
      )}
      <div className="subtle tiny" style={{ marginTop: 8, fontFamily: 'var(--mono)' }}>
        {measurements.length} medição{measurements.length !== 1 ? 'ões' : ''} · {last?.date ? new Date(last.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '—'}
      </div>
    </button>
  );
}

function CategoryCard({ cat, meta, bios, navigate, onClick }) {
  const total = bios.length;
  const outOfRange = bios.filter(b => {
    const v = b.measurements?.at(-1)?.value;
    return b.range && v != null && statusOf(v, b.range) !== 'ok';
  }).length;
  const withData = bios.filter(b => (b.measurements?.length || 0) > 1).length;

  return (
    <button className="card" onClick={onClick} style={{ textAlign: 'left', cursor: 'pointer', position: 'relative' }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{meta?.emoji ?? '📋'}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', marginBottom: 6 }}>{meta?.label ?? cat}</div>
      <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 10 }}>
        {total} marcador{total !== 1 ? 'es' : ''}
        {withData > 0 ? ` · ${withData} com histórico` : ''}
      </div>
      {outOfRange > 0 && (
        <span className="pill pill--rust">{outOfRange} fora da faixa</span>
      )}
      {outOfRange === 0 && total > 0 && bios.some(b => b.range) && (
        <span className="pill pill--sage">✓ todos ok</span>
      )}
    </button>
  );
}

export default function ViewBiomarkers() {
  const navigate = useNavigate();
  const [biomarkers, setBiomarkers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    if (!isConfigured()) { setLoading(false); return; }
    mergeBiomarkerAliases().catch(() => {}).then(() => migrateBiomarkerCategories().catch(() => {})).finally(() => {
      loadBiomarkers().then(data => {
        setBiomarkers(data || {});
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  const bioList = Object.values(biomarkers)
    .filter(b => b.measurements?.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  // Group by category
  const grouped = {};
  bioList.forEach(b => {
    const cat = b.category || 'outros';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(b);
  });
  const sortedCats = Object.keys(grouped).sort(
    (a, b) => (CATEGORY_META[a]?.order ?? 99) - (CATEGORY_META[b]?.order ?? 99)
  );

  const outOfRange = bioList.filter(b => {
    const v = b.measurements?.at(-1)?.value;
    return b.range && v != null && statusOf(v, b.range) !== 'ok';
  }).length;

  // When a category is selected: filter + search within it
  const catBios = selectedCat ? (grouped[selectedCat] || []) : bioList;
  const filtered = catBios.filter(b => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'fora') {
      const v = b.measurements?.at(-1)?.value;
      return b.range && v != null && statusOf(v, b.range) !== 'ok';
    }
    if (filter === 'sem-ref') return !b.range;
    return true;
  });

  const isBrowsing = selectedCat || search || filter !== 'all';

  return (
    <div className="fade-in">
      <PageHead
        eyebrow={`${bioList.length} biomarcadores · ${sortedCats.length} categorias`}
        title="<em>Biomarcadores</em>"
        sub={selectedCat
          ? `${CATEGORY_META[selectedCat]?.label ?? selectedCat} — ${catBios.length} marcadores`
          : 'Clique em uma categoria para explorar, ou busque diretamente.'}
      />

      {loading ? (
        <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>carregando…</div>
      ) : bioList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 10 }}>Nenhum biomarcador ainda</div>
          <div className="subtle" style={{ fontSize: 14, marginBottom: 24 }}>Envie um PDF e os marcadores aparecem aqui.</div>
          <button className="btn btn--sage" onClick={() => navigate('/upload')}>＋ Enviar PDF</button>
        </div>
      ) : (
        <>
          {/* Search + filter bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center' }}>
            {selectedCat && (
              <button
                onClick={() => { setSelectedCat(null); setSearch(''); setFilter('all'); }}
                style={{ padding: '7px 14px', borderRadius: 999, fontSize: 12, fontFamily: 'var(--mono)', background: 'var(--bg-2)', border: '1px solid var(--line-2)', color: 'var(--ink-2)', cursor: 'pointer' }}
              >
                ← categorias
              </button>
            )}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={selectedCat ? `Buscar em ${CATEGORY_META[selectedCat]?.label ?? selectedCat}…` : 'Buscar biomarcador…'}
              style={{ padding: '8px 14px', border: '1px solid var(--line-2)', borderRadius: 999, background: 'var(--bg-2)', fontSize: 13, fontFamily: 'var(--serif)', width: 220 }}
            />
            {isBrowsing && (
              <div style={{ display: 'flex', gap: 6, padding: 4, background: 'var(--bg-2)', borderRadius: 999 }}>
                {[
                  { id: 'all',      label: `todos (${catBios.length})` },
                  { id: 'fora',     label: `fora (${catBios.filter(b => { const v = b.measurements?.at(-1)?.value; return b.range && v != null && statusOf(v, b.range) !== 'ok'; }).length})` },
                  { id: 'sem-ref',  label: 'sem ref.' },
                ].map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)} style={{
                    padding: '5px 12px', borderRadius: 999, fontSize: 12, fontFamily: 'var(--mono)',
                    background: filter === f.id ? 'var(--bg)' : 'transparent',
                    color: filter === f.id ? 'var(--ink)' : 'var(--ink-3)',
                  }}>{f.label}</button>
                ))}
              </div>
            )}
            {!isBrowsing && outOfRange > 0 && (
              <button onClick={() => setFilter('fora')} className="pill pill--rust" style={{ cursor: 'pointer' }}>
                {outOfRange} fora da faixa
              </button>
            )}
            {isBrowsing && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, padding: 4, background: 'var(--bg-2)', borderRadius: 999 }}>
                {[{ id: 'grid', icon: '⊞' }, { id: 'list', icon: '≡' }].map(v => (
                  <button key={v.id} onClick={() => setViewMode(v.id)} style={{
                    padding: '5px 10px', borderRadius: 999, fontSize: 14,
                    background: viewMode === v.id ? 'var(--bg)' : 'transparent',
                    color: viewMode === v.id ? 'var(--ink)' : 'var(--ink-3)',
                  }}>{v.icon}</button>
                ))}
              </div>
            )}
          </div>

          {/* Catalog: category cards */}
          {!isBrowsing && (
            <div className="grid grid-3" style={{ marginBottom: 40 }}>
              {sortedCats.map(cat => (
                <CategoryCard
                  key={cat}
                  cat={cat}
                  meta={CATEGORY_META[cat]}
                  bios={grouped[cat]}
                  navigate={navigate}
                  onClick={() => setSelectedCat(cat)}
                />
              ))}
            </div>
          )}

          {/* Biomarker cards/list (when category selected or searching) */}
          {isBrowsing && (
            viewMode === 'list'
              ? <ListView filtered={filtered} navigate={navigate} />
              : (
                <div className="grid grid-3">
                  {filtered.map(b => <BioCard key={b.id} b={b} navigate={navigate} />)}
                  {filtered.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--ink-3)', fontFamily: 'var(--serif)', fontSize: 16 }}>
                      Nenhum biomarcador encontrado.
                    </div>
                  )}
                </div>
              )
          )}
        </>
      )}
    </div>
  );
}
