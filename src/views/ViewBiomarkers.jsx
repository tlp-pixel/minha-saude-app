import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { Sparkline } from '../components/charts';
import { loadBiomarkers, isConfigured } from '../lib/storage';
import { statusOf } from '../lib/utils';

export default function ViewBiomarkers() {
  const navigate = useNavigate();
  const [biomarkers, setBiomarkers] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isConfigured()) { setLoading(false); return; }
    loadBiomarkers().then(data => {
      setBiomarkers(data || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const bioList = Object.values(biomarkers)
    .filter(b => b.measurements?.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const filtered = bioList.filter(b => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'fora') {
      const last = b.measurements?.at(-1)?.value;
      return b.range && last != null && statusOf(last, b.range) !== 'ok';
    }
    if (filter === 'sem-ref') return !b.range;
    return true;
  });

  const withRange = bioList.filter(b => b.range);
  const outOfRange = withRange.filter(b => {
    const last = b.measurements?.at(-1)?.value;
    return last != null && statusOf(last, b.range) !== 'ok';
  });

  return (
    <div className="fade-in">
      <PageHead
        eyebrow={`${bioList.length} biomarcadores rastreados`}
        title="<em>Biomarcadores</em>"
        sub="Tudo que foi extraído dos seus PDFs. Clique para ver a evolução temporal."
      />

      {!isConfigured() && (
        <div className="card" style={{ borderColor: 'var(--terra)', borderStyle: 'dashed', marginBottom: 24 }}>
          <div className="card-label" style={{ color: 'var(--terra-2)' }}>atenção</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 15, margin: '6px 0 10px', color: 'var(--ink-2)' }}>
            Configure o GitHub em Configurações para ver seus biomarcadores.
          </p>
          <button className="btn btn--ghost" onClick={() => navigate('/config')}>Ir para Configurações →</button>
        </div>
      )}

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
          </div>

          <div className="grid grid-3">
            {filtered.map(b => {
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
            })}
          </div>
        </>
      )}
    </div>
  );
}
