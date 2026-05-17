import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { LineChart } from '../components/charts';
import { loadBiomarkers, isConfigured } from '../lib/storage';
import { statusOf } from '../lib/utils';

export default function ViewCompare() {
  const navigate = useNavigate();
  const [biomarkers, setBiomarkers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isConfigured()) { setLoading(false); return; }
    loadBiomarkers().then(data => {
      setBiomarkers(data || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const bioList = Object.values(biomarkers)
    .filter(b => b.measurements?.length > 1)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const filtered = bioList.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 4 ? [...s, id] : s);
  }

  const selectedBios = selected.map(id => biomarkers[id]).filter(Boolean);
  const COLORS = ['var(--sage)', 'var(--terra)', 'var(--rust)', 'var(--ink-2)'];

  return (
    <div className="fade-in">
      <PageHead
        eyebrow="análise comparativa"
        title="<em>Comparar</em> biomarcadores"
        sub="Selecione até 4 biomarcadores para visualizar a evolução lado a lado."
      />

      {!isConfigured() && (
        <div className="card" style={{ borderColor: 'var(--terra)', borderStyle: 'dashed', marginBottom: 24 }}>
          <div className="card-label" style={{ color: 'var(--terra-2)' }}>atenção</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 15, margin: '6px 0 10px', color: 'var(--ink-2)' }}>
            Configure o GitHub em Configurações para usar a comparação.
          </p>
          <button className="btn btn--ghost" onClick={() => navigate('/config')}>Ir para Configurações →</button>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>carregando…</div>
      ) : bioList.length < 2 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 10 }}>Dados insuficientes</div>
          <div className="subtle" style={{ fontSize: 14, marginBottom: 24 }}>Envie pelo menos 2 exames para comparar a evolução dos biomarcadores.</div>
          <button className="btn btn--sage" onClick={() => navigate('/upload')}>＋ Enviar PDF</button>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '280px 1fr', gap: 28 }}>
          <div>
            <div className="card-label" style={{ marginBottom: 10 }}>selecionar ({selected.length}/4)</div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--bg-2)', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 480, overflowY: 'auto' }}>
              {filtered.map(b => {
                const isSelected = selected.includes(b.id);
                const v = b.measurements?.at(-1)?.value;
                const st = b.range ? statusOf(v, b.range) : 'none';
                return (
                  <button key={b.id} onClick={() => toggle(b.id)} style={{
                    padding: '10px 12px', borderRadius: 'var(--r-md)', textAlign: 'left',
                    background: isSelected ? 'var(--sage-soft)' : 'var(--bg-2)',
                    border: `1.5px solid ${isSelected ? 'var(--sage)' : 'transparent'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: !isSelected && selected.length === 4 ? 0.4 : 1,
                  }}>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 14 }}>{b.name}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: st === 'ok' ? 'var(--sage)' : st !== 'none' ? 'var(--terra-2)' : 'var(--ink-3)' }}>
                      {v} {b.unit}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            {selectedBios.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '64px 40px', color: 'var(--ink-3)' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 8 }}>Selecione biomarcadores</div>
                <div style={{ fontSize: 13.5 }}>Escolha até 4 na lista à esquerda para visualizar a evolução.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {selectedBios.map((b, i) => {
                  const measurements = [...(b.measurements || [])].sort((a, z) => a.date.localeCompare(z.date));
                  const values = measurements.map(m => m.value);
                  const dates = measurements.map(m => m.date);
                  const v = measurements.at(-1)?.value;
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
                      <LineChart values={values} dates={dates} range={b.range} unit={b.unit} width={600} height={180} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
