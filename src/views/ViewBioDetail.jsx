import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../components/PageHead';
import TrendBadge from '../components/TrendBadge';
import { Sparkline, LineChart, Bullet } from '../components/charts';
import { BIOMARKERS, CATEGORIES, EXAM_DATES, EXAMS } from '../data/biomarkers';
import { fmtDate, latestOf, statusOf } from '../lib/utils';

export default function ViewBioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const b = BIOMARKERS.find(x => x.id === id) || BIOMARKERS[0];
  const v = latestOf(b);
  const status = statusOf(v, b.range);
  const cat = CATEGORIES.find(c => c.id === b.cat);
  const related = BIOMARKERS.filter(x => x.cat === b.cat && x.id !== b.id);

  const validValues = b.values.filter(x => x != null);
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const avg = (validValues.reduce((a, x) => a + x, 0) / validValues.length).toFixed(1);

  return (
    <div className="fade-in">
      <button className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 18 }} onClick={() => navigate('/biomarcadores')}>← biomarcadores</button>

      <PageHead
        eyebrow={`${cat?.name.toLowerCase()} · ${b.values.length} medições`}
        title={`<em>${b.name}</em>`}
        sub={`Faixa de referência ${b.range[0]}–${b.range[1]} ${b.unit}. ${validValues.length} medições registradas desde ${fmtDate(EXAM_DATES[0], { month: 'long', year: 'numeric' })}.`}
        actions={<TrendBadge trend={b.trend} />}
      />

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ background: status === 'ok' ? 'var(--sage-soft)' : 'var(--terra-soft)' }}>
          <div className="card-label">resultado mais recente</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span className="num" style={{ fontSize: 72, lineHeight: 1, letterSpacing: '-0.03em' }}>{v}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--ink-2)' }}>{b.unit}</span>
          </div>
          <div className="subtle tiny" style={{ marginTop: 10, fontFamily: 'var(--mono)' }}>
            {fmtDate(EXAM_DATES[EXAM_DATES.length - 1])}
          </div>
        </div>
        <div className="card">
          <div className="card-label">média histórica</div>
          <div className="num" style={{ fontSize: 32, lineHeight: 1, marginTop: 8 }}>{avg}<span className="unit">{b.unit}</span></div>
          <div className="subtle tiny" style={{ marginTop: 8 }}>todas as medições</div>
        </div>
        <div className="card">
          <div className="card-label">mínimo</div>
          <div className="num" style={{ fontSize: 32, lineHeight: 1, marginTop: 8 }}>{min}<span className="unit">{b.unit}</span></div>
          <div className="subtle tiny" style={{ marginTop: 8, fontFamily: 'var(--mono)' }}>
            {fmtDate(EXAM_DATES[b.values.indexOf(min)], { month: 'short', year: '2-digit' })}
          </div>
        </div>
        <div className="card">
          <div className="card-label">máximo</div>
          <div className="num" style={{ fontSize: 32, lineHeight: 1, marginTop: 8 }}>{max}<span className="unit">{b.unit}</span></div>
          <div className="subtle tiny" style={{ marginTop: 8, fontFamily: 'var(--mono)' }}>
            {fmtDate(EXAM_DATES[b.values.indexOf(max)], { month: 'short', year: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 32, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, margin: 0 }}>Evolução temporal</h2>
          <div style={{ display: 'flex', gap: 18 }}>
            <span className="tiny subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)' }}>
              <span style={{ width: 14, height: 3, background: 'var(--ink)', display: 'inline-block' }} /> medições
            </span>
            <span className="tiny subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)' }}>
              <span style={{ width: 14, height: 8, background: 'var(--sage-soft)', display: 'inline-block' }} /> faixa de referência
            </span>
          </div>
        </div>
        <LineChart values={b.values} dates={EXAM_DATES} range={b.range} unit={b.unit} width={840} height={300} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 32 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, margin: '0 0 14px' }}>Histórico de medições</h2>
          <div className="card" style={{ padding: '4px 22px' }}>
            <table className="tbl">
              <thead>
                <tr><th>Data</th><th>Origem</th><th className="right">Valor</th><th className="right">Δ</th><th className="right">Status</th></tr>
              </thead>
              <tbody>
                {b.values.map((val, i) => {
                  if (val == null) return null;
                  const prev = b.values.slice(0, i).filter(x => x != null).at(-1);
                  const d = prev ? ((val - prev) / prev) * 100 : 0;
                  const st = statusOf(val, b.range);
                  const exam = EXAMS[EXAMS.length - 1 - i];
                  return (
                    <tr key={i}>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{fmtDate(EXAM_DATES[i])}</td>
                      <td className="subtle tiny">{exam?.lab || '—'}</td>
                      <td className="right"><span className="num" style={{ fontSize: 16, color: st === 'ok' ? 'var(--ink)' : st === 'warn' ? 'var(--terra-2)' : 'var(--rust)' }}>{val}</span></td>
                      <td className="right"><span className={`trend-arrow ${d > 1 ? 'up' : d < -1 ? 'down' : 'flat'}`}>{prev ? (d > 0 ? '+' : '') + d.toFixed(1) + '%' : '—'}</span></td>
                      <td className="right">
                        {st === 'ok' ? <span className="pill pill--sage">na faixa</span> :
                         st === 'warn' ? <span className="pill pill--terra">limite</span> :
                         <span className="pill pill--rust">fora</span>}
                      </td>
                    </tr>
                  );
                }).reverse()}
              </tbody>
            </table>
          </div>
        </div>

        <aside>
          <div className="card" style={{ marginBottom: 16, borderColor: 'var(--sage-2)', borderStyle: 'dashed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--sage)', display: 'grid', placeItems: 'center', color: 'var(--bg)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13 }}>c</div>
              <div className="card-label" style={{ margin: 0 }}>interpretação · claude</div>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 15.5, lineHeight: 1.55, margin: 0 }}>
              {b.trend === 'improving' && <>Tendência de <em style={{ color: 'var(--sage)' }}>melhora consistente</em>. Valor atual {v >= b.range[0] && v <= b.range[1] ? 'dentro da faixa' : 'fora da faixa'}.</>}
              {b.trend === 'stable' && <>Comportamento <em>estável</em>, oscilando entre {min} e {max} {b.unit}.</>}
              {b.trend === 'watch' && <>Valores oscilando próximos ao <em style={{ color: 'var(--terra-2)' }}>limite</em> da faixa. Vale acompanhar.</>}
            </p>
          </div>

          <div className="card card--soft">
            <div className="card-label">faixa de referência</div>
            <div style={{ marginTop: 12 }}>
              <Bullet value={v} range={b.range} unit={b.unit} name={b.name} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="card-label">relacionados em {cat?.name.toLowerCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {related.map(r => (
                <button key={r.id} className="card" onClick={() => navigate(`/biomarcadores/${r.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 14.5, flex: 1 }}>{r.name}</span>
                  <Sparkline values={r.values} range={r.range} width={64} height={20} />
                  <span className="num" style={{ fontSize: 15 }}>{latestOf(r)}<span className="unit">{r.unit}</span></span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
