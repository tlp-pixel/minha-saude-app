import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { Sparkline } from '../components/charts';
import { loadBiomarkers, isConfigured, migrateBiomarkerCategories, mergeBiomarkerAliases } from '../lib/storage';
import { statusOf } from '../lib/utils';

const CATEGORY_META = {
  hemograma:     { label: 'Hemograma',         order: 1 },
  leucograma:    { label: 'Leucograma',         order: 2 },
  lipideos:      { label: 'Perfil Lipídico',    order: 3 },
  glicemico:     { label: 'Perfil Glicêmico',   order: 4 },
  renal:         { label: 'Função Renal',        order: 5 },
  hepatico:      { label: 'Função Hepática',     order: 6 },
  tireoide:      { label: 'Tireoide',            order: 7 },
  hormonios:     { label: 'Hormônios',           order: 8 },
  vitaminas:     { label: 'Vitaminas e Minerais',order: 9 },
  inflamatorios: { label: 'Inflamatórios',       order: 10 },
  bioquimica:    { label: 'Bioquímica',          order: 11 },
  urina:         { label: 'Urina',               order: 12 },
  outros:        { label: 'Outros',              order: 99 },
};

function BioCard({ b, navigate }) {
  const measurements = b.measurements || [];
  const last = measurements.at(-1);
  const v = last?.value;
  const status = b.range ? statusOf(v, b.range) : 'none';
  const values = measurements.map(m => m.value);
  const prev = measurements.at(-2)?.value;
  const delta = prev != null && v != null ? ((v - prev) / prev) * 100 : null;

  return (
    <button key={b.id} className="card" onClick={() => navigate(`/biomarcadores/${b.id}`)} style={{ textAlign: 'left', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.2 }}>{b.name}</div>
        {status === 'warn' && <span className="pill pill--terra">no limite</span>}
        {status === 'bad'  && <span className="pill pill--rust">fora</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
        <span className="num" style={{
          fontSize: 28, lineHeight: 1,
          color: status === 'ok' ? 'var(--ink)' : status === 'warn' ? 'var(--terra-2)' : status === 'bad' ? 'var(--rust)' : 'var(--ink)',
        }}>{v ?? '—'}</span>
        <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{b.unit}</span>
        {delta != null && (
          <span className={`trend-arrow ${delta > 1 ? 'up' : delta < -1 ? 'down' : 'flat'}`} style={{ marginLeft: 'auto', fontSize: 11 }}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
          </span>
        )}
      </div>
      {b.range && (
        <div className="subtle tiny" style={{ marginTop: 4, fontFamily: 'var(--mono)' }}>
          ref. {b.range[0]}–{b.range[1]}
        </div>
      )}
      {values.length > 1 && (
        <div style={{ marginTop: 12 }}>
          <Sparkline values={values} range={b.range} width={240} height={34} />
        </div>
      )}
      <div className="subtle tiny" style={{ marginTop: 8, fontFamily: 'var(--mono)' }}>
        {measurements.length} medição{measurements.length !== 1 ? 'ões' : ''} · último: {last?.date ? new Date(last.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '—'}
      </div>
    </button>
  );
}

export default function ViewBiomarkers() {
  const navigate = useNavigate();
  const [biomarkers, setBiomarkers] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('category');

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

  const withRange = bioList.filter(b => b.range);
  const outOfRange = withRange.filter(b => {
    const last = b.measurements?.at(-1)?.value;
    return last != null && statusOf(last, b.range) !== 'ok';
  });

  const filtered = bioList.filter(b => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'fora') {
      const last = b.measurements?.at(-1)?.value;
      return b.range && last != null && statusOf(last, b.range) !== 'ok';
    }
    if (filter === 'sem-ref') return !b.range;
    return true;
  });

  const isSearching = search.length > 0 || filter !== 'all';

  const grouped = {};
  filtered.forEach(b => {
    const cat = b.category || 'outros';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(b);
  });
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (CATEGORY_META[a]?.order ?? 99) - (CATEGORY_META[b]?.order ?? 99)
  );

  return (
    <div className="fade-in">
      <PageHead
        eyebrow={`${bioList.length} biomarcadores rastreados`}
        title="<em>Biomarcadores</em>"
        sub="Tudo que foi extraído dos seus PDFs. Clique para ver a evolução temporal."
      />

      {loading ? (
        <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>carregando…</div>
      ) : bioList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 10 }}>Nenhum biomarcador ainda</div>
          <div className="subtle" style={{ fontSize: 14, marginBottom: 24 }}>Envie um PDF de exame e os marcadores aparecem aqui automaticamente.</div>
          <button className="btn btn--sage" onClick={() => navigate('/upload')}>＋ Enviar PDF</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar biomarcador…"
              style={{ padding: '8px 14px', border: '1px solid var(--line-2)', borderRadius: 999, background: 'var(--bg-2)', fontSize: 13, fontFamily: 'var(--serif)', width: 240 }}
            />
            <div style={{ display: 'flex', gap: 6, padding: 4, background: 'var(--bg-2)', borderRadius: 999 }}>
              {[
                { id: 'all', label: `todos (${bioList.length})` },
                { id: 'fora', label: `fora da faixa (${outOfRange.length})` },
                { id: 'sem-ref', label: `sem referência` },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding: '5px 12px', borderRadius: 999, fontSize: 12, fontFamily: 'var(--mono)',
                  background: filter === f.id ? 'var(--bg)' : 'transparent',
                  color: filter === f.id ? 'var(--ink)' : 'var(--ink-3)',
                }}>{f.label}</button>
              ))}
            </div>
            {!isSearching && (
              <div style={{ display: 'flex', gap: 6, padding: 4, background: 'var(--bg-2)', borderRadius: 999, marginLeft: 'auto' }}>
                {[
                  { id: 'category', label: 'por categoria' },
                  { id: 'flat', label: 'lista' },
                ].map(g => (
                  <button key={g.id} onClick={() => setGroupBy(g.id)} style={{
                    padding: '5px 12px', borderRadius: 999, fontSize: 12, fontFamily: 'var(--mono)',
                    background: groupBy === g.id ? 'var(--bg)' : 'transparent',
                    color: groupBy === g.id ? 'var(--ink)' : 'var(--ink-3)',
                  }}>{g.label}</button>
                ))}
              </div>
            )}
          </div>

          {(isSearching || groupBy === 'flat') ? (
            <div className="grid grid-3">
              {filtered.map(b => <BioCard key={b.id} b={b} navigate={navigate} />)}
            </div>
          ) : (
            sortedCategories.map(cat => (
              <div key={cat} style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic' }}>
                    {CATEGORY_META[cat]?.label ?? cat}
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                  <div className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>{grouped[cat].length}</div>
                </div>
                <div className="grid grid-3">
                  {grouped[cat].map(b => <BioCard key={b.id} b={b} navigate={navigate} />)}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
