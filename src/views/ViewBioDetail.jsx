import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { Bullet, LineChart } from '../components/charts';
import { loadBiomarkers } from '../lib/github';
import { statusOf } from '../lib/utils';

export default function ViewBioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [biomarkers, setBiomarkers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBiomarkers().then(data => {
      setBiomarkers(data || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="fade-in">
      <button className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 18 }} onClick={() => navigate('/biomarcadores')}>← biomarcadores</button>
      <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>carregando…</div>
    </div>
  );

  const b = biomarkers[id];

  if (!b) return (
    <div className="fade-in">
      <button className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 18 }} onClick={() => navigate('/biomarcadores')}>← biomarcadores</button>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink-2)' }}>Biomarcador não encontrado.</div>
    </div>
  );

  const measurements = [...(b.measurements || [])].sort((a, b) => a.date.localeCompare(b.date));
  const values = measurements.map(m => m.value);
  const dates = measurements.map(m => m.date);
  const last = measurements.at(-1);
  const v = last?.value;
  const status = b.range ? statusOf(v, b.range) : 'none';

  const validValues = values.filter(x => x != null);
  const min = validValues.length ? Math.min(...validValues) : null;
  const max = validValues.length ? Math.max(...validValues) : null;
  const avg = validValues.length ? (validValues.reduce((a, x) => a + x, 0) / validValues.length).toFixed(1) : null;

  const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtShort = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '—';

  return (
    <div className="fade-in">
      <button className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 18 }} onClick={() => navigate('/biomarcadores')}>← biomarcadores</button>

      <PageHead
        eyebrow={`${measurements.length} medição${measurements.length !== 1 ? 'ões' : ''} registrada${measurements.length !== 1 ? 's' : ''}`}
        title={`<em>${b.name}</em>`}
        sub={b.range
          ? `Faixa de referência: ${b.range[0]}–${b.range[1]} ${b.unit}.${measurements.length > 0 ? ` Primeiro registro em ${fmtShort(dates[0])}.` : ''}`
          : `Unidade: ${b.unit || '—'}. Sem faixa de referência informada.`}
      />

      <div className="grid grid-3" style={{ marginBottom: 32 }}>
        <div className="card" style={{ background: status === 'ok' ? 'var(--sage-soft)' : status === 'none' ? 'var(--bg-2)' : 'var(--terra-soft)' }}>
          <div className="card-label">resultado mais recente</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span className="num" style={{ fontSize: 64, lineHeight: 1, letterSpacing: '-0.03em' }}>{v ?? '—'}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 15, color: 'var(--ink-2)' }}>{b.unit}</span>
          </div>
          <div className="subtle tiny" style={{ marginTop: 8, fontFamily: 'var(--mono)' }}>{fmtDate(last?.date)}</div>
        </div>
        <div className="card">
          <div className="card-label">média histórica</div>
          <div className="num" style={{ fontSize: 32, lineHeight: 1, marginTop: 8 }}>{avg ?? '—'}<span className="unit">{b.unit}</span></div>
          <div className="subtle tiny" style={{ marginTop: 8 }}>{validValues.length} medições</div>
        </div>
        <div className="card">
          <div className="card-label">variação</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <div>
              <div className="subtle tiny">mín</div>
              <div className="num" style={{ fontSize: 22 }}>{min ?? '—'}</div>
            </div>
            <div>
              <div className="subtle tiny">máx</div>
              <div className="num" style={{ fontSize: 22 }}>{max ?? '—'}</div>
            </div>
          </div>
          <div className="subtle tiny" style={{ marginTop: 8, fontFamily: 'var(--mono)' }}>{b.unit}</div>
        </div>
      </div>

      {values.length > 1 && (
        <div className="card" style={{ padding: 32, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, margin: 0 }}>Evolução temporal</h2>
            <div style={{ display: 'flex', gap: 18 }}>
              <span className="tiny subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)' }}>
                <span style={{ width: 14, height: 3, background: 'var(--ink)', display: 'inline-block' }} /> medições
              </span>
              {b.range && (
                <span className="tiny subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)' }}>
                  <span style={{ width: 14, height: 8, background: 'var(--sage-soft)', display: 'inline-block' }} /> faixa de referência
                </span>
              )}
            </div>
          </div>
          <LineChart values={values} dates={dates} range={b.range} unit={b.unit} width={840} height={280} />
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 32 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, margin: '0 0 14px' }}>Histórico de medições</h2>
          <div className="card" style={{ padding: '4px 22px' }}>
            <table className="tbl">
              <thead>
                <tr><th>Data</th><th>Exame</th><th className="right">Valor</th><th className="right">Δ</th><th className="right">Status</th></tr>
              </thead>
              <tbody>
                {[...measurements].reverse().map((m, i, arr) => {
                  const prev = arr[i + 1]?.value;
                  const d = prev != null ? ((m.value - prev) / prev) * 100 : null;
                  const st = b.range ? statusOf(m.value, b.range) : 'none';
                  return (
                    <tr key={m.examId + m.date}>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{fmtDate(m.date)}</td>
                      <td className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>{m.examId}</td>
                      <td className="right">
                        <span className="num" style={{ fontSize: 16, color: st === 'ok' ? 'var(--ink)' : st === 'warn' ? 'var(--terra-2)' : st === 'bad' ? 'var(--rust)' : 'var(--ink)' }}>
                          {m.value}
                        </span>
                      </td>
                      <td className="right">
                        <span className={`trend-arrow ${d > 1 ? 'up' : d < -1 ? 'down' : 'flat'}`}>
                          {d != null ? (d > 0 ? '+' : '') + d.toFixed(1) + '%' : '—'}
                        </span>
                      </td>
                      <td className="right">
                        {st === 'ok'   && <span className="pill pill--sage">na faixa</span>}
                        {st === 'warn' && <span className="pill pill--terra">limite</span>}
                        {st === 'bad'  && <span className="pill pill--rust">fora</span>}
                        {st === 'none' && <span className="pill">sem ref.</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside>
          {b.range && (
            <div className="card card--soft" style={{ marginBottom: 16 }}>
              <div className="card-label">faixa de referência</div>
              <div style={{ marginTop: 12 }}>
                <Bullet value={v} range={b.range} unit={b.unit} name={b.name} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
                <span>{b.range[0]}</span>
                <span>{b.range[1]}</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
