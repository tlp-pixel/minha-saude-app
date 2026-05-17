import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { Sparkline } from '../components/charts';
import { ConfidenceRing } from '../components/charts';
import { INSIGHTS, PATTERNS, BIOMARKERS } from '../data/biomarkers';
import { fmtDate, latestOf } from '../lib/utils';

const SEV_COLOR = {
  positive: { pill: 'pill--sage',  label: 'positivo',    glyph: '✓' },
  watch:    { pill: 'pill--terra', label: 'observar',    glyph: '⚠' },
  neutral:  { pill: '',            label: 'informativo', glyph: '·' },
  negative: { pill: 'pill--rust',  label: 'atenção',     glyph: '!' },
};

export default function ViewInsights() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('insights');

  return (
    <div className="fade-in">
      <PageHead
        eyebrow="análise · claude"
        title="<em>Insights</em> do seu histórico"
        sub="O Claude separa achados pontuais (insights) de comportamentos recorrentes (padrões) que se repetem ao longo dos seus exames."
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 32, padding: 4, background: 'var(--bg-2)', borderRadius: 999, width: 'fit-content' }}>
        {[
          { id: 'insights', label: `Insights · ${INSIGHTS.length}` },
          { id: 'patterns', label: `Padrões · ${PATTERNS.length}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: 999,
            background: tab === t.id ? 'var(--bg)' : 'transparent',
            color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
            fontSize: 13.5, fontFamily: 'var(--serif)',
            boxShadow: tab === t.id ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'insights' && (
        <div className="grid grid-2">
          {INSIGHTS.map(ins => {
            const sev = SEV_COLOR[ins.severity];
            return (
              <div key={ins.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className={`pill ${sev.pill}`}>{sev.glyph} {sev.label}</span>
                  <span className="tiny subtle" style={{ fontFamily: 'var(--mono)' }}>desde {fmtDate(ins.since + '-01', { month: 'short', year: 'numeric' })}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 21, margin: '0 0 10px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{ins.title}</h3>
                <p style={{ color: 'var(--ink-2)', margin: 0, fontSize: 14, lineHeight: 1.55 }}>{ins.summary}</p>
                <div className="divider" style={{ margin: '18px 0 14px' }} />
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  {ins.related.map(rid => {
                    const b = BIOMARKERS.find(x => x.id === rid);
                    if (!b) return null;
                    return (
                      <button key={rid} onClick={() => navigate(`/biomarcadores/${rid}`)}
                        style={{ display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer', textAlign: 'left' }}>
                        <span className="tiny subtle" style={{ fontFamily: 'var(--mono)' }}>{b.name}</span>
                        <Sparkline values={b.values} range={b.range} width={100} height={26} />
                        <span className="num" style={{ fontSize: 15 }}>{latestOf(b)}<span className="unit">{b.unit}</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'patterns' && (
        <div>
          <div className="card card--soft" style={{ marginBottom: 28, display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--sage)', display: 'grid', placeItems: 'center', color: 'var(--bg)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, flexShrink: 0 }}>c</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 4 }}>O que são padrões?</div>
              <div className="subtle" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                Diferente de um insight pontual, um padrão é uma <em style={{ fontStyle: 'italic' }}>regra de comportamento</em> que se repete — sazonalidade, correlação entre marcadores, lag temporal. Vão ficando mais precisos com mais exames.
              </div>
            </div>
          </div>

          <div className="grid grid-2">
            {PATTERNS.map(p => (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className="pill">{p.kind}</span>
                  <ConfidenceRing value={p.confidence} />
                </div>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 22, margin: '0 0 10px', letterSpacing: '-0.015em', lineHeight: 1.2 }}>{p.title}</h3>
                <p style={{ color: 'var(--ink-2)', margin: 0, fontSize: 14, lineHeight: 1.55 }}>{p.summary}</p>
                <div style={{ display: 'flex', gap: 14, marginTop: 18, alignItems: 'center' }}>
                  <Sparkline values={p.sparkline} range={null} width={140} height={32} />
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.04em', lineHeight: 1.6 }}>
                    {p.observations} OBSERVAÇÕES<br/>
                    {(p.confidence * 100).toFixed(0)}% CONFIANÇA
                  </div>
                </div>
                <div className="divider" style={{ margin: '16px 0 12px' }} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {p.related.map(rid => {
                    const b = BIOMARKERS.find(x => x.id === rid);
                    if (!b) return null;
                    return (
                      <button key={rid} onClick={() => navigate(`/biomarcadores/${rid}`)} className="pill" style={{ cursor: 'pointer' }}>
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
