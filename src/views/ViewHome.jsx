import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import TrendBadge from '../components/TrendBadge';
import { Sparkline, Bullet } from '../components/charts';
import { EXAMS, BIOMARKERS, CATEGORIES } from '../data/biomarkers';
import { fmtDate, latestOf, prevOf, deltaPct, statusOf } from '../lib/utils';

export default function ViewHome() {
  const navigate = useNavigate();
  const recent = EXAMS.slice(0, 3);

  const watchlist = BIOMARKERS.filter(b => {
    const last = latestOf(b);
    return last < b.range[0] || last > b.range[1] || b.trend === 'watch';
  }).slice(0, 4);

  const total = BIOMARKERS.length;
  const inRange = BIOMARKERS.filter(b => {
    const last = latestOf(b);
    return last != null && last >= b.range[0] && last <= b.range[1];
  }).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 19) return 'Boa tarde';
    return 'Boa noite';
  })();

  const highlights = ['ldl', 'vd', 'hba1c', 'pcr']
    .map(id => BIOMARKERS.find(b => b.id === id))
    .filter(Boolean);

  return (
    <div className="fade-in">
      <PageHead
        eyebrow={`hoje · ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`}
        title={`${greeting},<br/><em>Thalita.</em>`}
        sub={`Seu último exame foi em ${fmtDate(EXAMS[0]?.date)}. ${inRange} de ${total} biomarcadores estão dentro da faixa de referência.`}
        actions={<>
          <button className="btn btn--ghost" onClick={() => navigate('/exames')}>Ver exames</button>
          <button className="btn btn--sage" onClick={() => navigate('/upload')}>＋ Enviar PDF</button>
        </>}
      />

      <div className="grid grid-3" style={{ marginBottom: 28 }}>
        <div className="card">
          <div className="card-label">cobertura</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="num" style={{ fontSize: 48, lineHeight: 1 }}>{inRange}</span>
            <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>/ {total}</span>
          </div>
          <div className="subtle tiny" style={{ marginTop: 6 }}>biomarcadores na faixa</div>
          <div style={{ marginTop: 14, display: 'flex', gap: 3 }}>
            {BIOMARKERS.map(b => {
              const last = latestOf(b);
              const ok = last != null && last >= b.range[0] && last <= b.range[1];
              return <div key={b.id} style={{ flex: 1, height: 22, borderRadius: 2, background: ok ? 'var(--sage)' : 'var(--terra-2)', opacity: ok ? 0.5 : 0.85 }} title={b.name} />;
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-label">exames enviados</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="num" style={{ fontSize: 48, lineHeight: 1 }}>{EXAMS.length}</span>
            <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>PDFs lidos</span>
          </div>
          <div className="subtle tiny" style={{ marginTop: 6 }}>último: {fmtDate(EXAMS[0]?.date)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {EXAMS.slice().reverse().map(e => (
              <div key={e.id} style={{ flex: 1, height: 22, borderRadius: 4, border: '1px solid var(--line)', background: 'var(--bg-2)', display: 'grid', placeItems: 'center', fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--ink-3)' }}>
                {new Date(e.date).toLocaleDateString('pt-BR', { month: 'short' })}
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ background: 'var(--ink)', color: 'var(--bg)', borderColor: 'transparent' }}>
          <div className="card-label" style={{ color: 'var(--bg-3)' }}>panorama</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1.25, marginTop: 4 }}>
            Trajetória <em style={{ color: 'var(--terra)' }}>positiva</em> nos últimos exames registrados.
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            <span className="pill" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--bg-2)', borderColor: 'rgba(255,255,255,0.12)' }}>↗ LDL -17%</span>
            <span className="pill" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--bg-2)', borderColor: 'rgba(255,255,255,0.12)' }}>↗ Vit. D +105%</span>
            <span className="pill" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--bg-2)', borderColor: 'rgba(255,255,255,0.12)' }}>↘ PCR -33%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, margin: '8px 0 16px' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, margin: 0, letterSpacing: '-0.015em', lineHeight: 1.2 }}>
          Em <em style={{ fontStyle: 'italic', color: 'var(--sage)' }}>destaque</em>
        </h2>
        <button className="subtle tiny" style={{ fontFamily: 'var(--mono)' }} onClick={() => navigate('/biomarcadores')}>todos →</button>
      </div>
      <div className="grid grid-4" style={{ marginBottom: 36 }}>
        {highlights.map(b => (
          <button key={b.id} className="card" onClick={() => navigate(`/biomarcadores/${b.id}`)} style={{ textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <span className="card-label" style={{ marginBottom: 0 }}>{CATEGORIES.find(c => c.id === b.cat)?.name}</span>
              <TrendBadge trend={b.trend} />
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginTop: 12, marginBottom: 4 }}>{b.name}</div>
            <Bullet value={latestOf(b)} range={b.range} unit={b.unit} name="" />
            <div className="subtle tiny" style={{ marginTop: 10, fontFamily: 'var(--mono)' }}>
              vs {prevOf(b)} · {deltaPct(b) >= 0 ? '+' : ''}{deltaPct(b).toFixed(1)}%
            </div>
          </button>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, margin: 0, lineHeight: 1.2 }}>Últimos exames</h2>
            <button className="subtle tiny" style={{ fontFamily: 'var(--mono)' }} onClick={() => navigate('/exames')}>histórico completo →</button>
          </div>
          <div className="card" style={{ padding: '4px 22px' }}>
            <table className="tbl">
              <tbody>
                {recent.map(e => (
                  <tr key={e.id} className="clickable" onClick={() => navigate(`/exames/${e.id}`)}>
                    <td style={{ width: 100, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
                      {fmtDate(e.date, { day: '2-digit', month: 'short' })}<br/>
                      <span style={{ fontSize: 10.5 }}>{new Date(e.date).getFullYear()}</span>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{e.type}</div>
                      <div className="subtle tiny" style={{ marginTop: 3 }}>{e.lab} · {e.pages} páginas</div>
                    </td>
                    <td className="right"><span className="pill pill--sage">✓ analisado</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, margin: '0 0 14px' }}>Pontos de atenção</h2>
          <div className="card card--soft" style={{ background: 'var(--terra-soft)' }}>
            {watchlist.length === 0 ? (
              <div className="subtle">Nada exigindo atenção no momento. ✓</div>
            ) : watchlist.map((b, i) => (
              <div key={b.id} style={{ padding: '14px 0', borderBottom: i < watchlist.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.25 }}>{b.name}</div>
                  <div className="tiny subtle" style={{ marginTop: 6, fontFamily: 'var(--mono)' }}>
                    ref. {b.range[0]}–{b.range[1]} · {b.trend === 'watch' ? 'observar' : b.trend}
                  </div>
                </div>
                <span className="num" style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.1 }}>
                  {latestOf(b)}<span className="unit">{b.unit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
