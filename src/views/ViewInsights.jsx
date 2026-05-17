import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { loadBiomarkers, loadExamsIndex, isConfigured } from '../lib/storage';
import { statusOf } from '../lib/utils';

// ── Optimal ranges (functional medicine framework) ────────────────────────────
// null means "no bound in that direction"

const OPTIMAL = {
  'glicose':             { optMin: 75,   optMax: 86,   label: 'Glicose (jejum)',   unit: 'mg/dL', note: '87–99 = zona de atenção metabólica' },
  'insulina':            { optMin: 2,    optMax: 5,    label: 'Insulina',          unit: 'μUI/mL', note: '> 8 = resistência insulínica mesmo com glicemia normal' },
  'hemoglobina-glicada': { optMin: 4.6,  optMax: 5.2,  label: 'HbA1c',            unit: '%', note: '> 5.5% = variabilidade glicêmica' },
  'acido-urico':         { optMin: 3.0,  optMax: 5.5,  label: 'Ácido Úrico',      unit: 'mg/dL', note: 'marcador precoce de resistência insulínica' },
  'colesterol-total':    { optMin: 160,  optMax: 200,  label: 'Colesterol Total',  unit: 'mg/dL', note: '< 150 pode prejudicar síntese hormonal' },
  'ldl-colesterol':      { optMin: null, optMax: 100,  label: 'LDL',              unit: 'mg/dL', note: 'LDL alto + TG baixo + HDL alto = risco menor real' },
  'hdl-colesterol':      { optMin: 60,   optMax: null, label: 'HDL',              unit: 'mg/dL', note: 'fator cardioprotetor independente' },
  'triglicerideos':      { optMin: null, optMax: 70,   label: 'Triglicerídeos',   unit: 'mg/dL', note: '> 100 associado a resistência insulínica' },
  'tgo-ast':             { optMin: 10,   optMax: 26,   label: 'TGO/AST',          unit: 'U/L', note: 'AST isolado elevado → provável origem muscular' },
  'tgp-alt':             { optMin: 10,   optMax: 26,   label: 'TGP/ALT',          unit: 'U/L', note: 'marcador mais sensível de gordura hepática' },
  'gama-gt':             { optMin: 10,   optMax: 20,   label: 'Gama GT',          unit: 'U/L', note: 'preditor independente de risco CV e diabetes' },
  'creatinina':          { optMin: 0.6,  optMax: 0.9,  label: 'Creatinina',       unit: 'mg/dL', note: 'validar com TFG estimada' },
  'ureia':               { optMin: 13,   optMax: 22,   label: 'Ureia',            unit: 'mg/dL', note: '< 13 em dieta vegana pode indicar baixa ingestão proteica' },
  'tsh':                 { optMin: 1.0,  optMax: 2.0,  label: 'TSH',              unit: 'mUI/L', note: '2–4 = hipotireoidismo subclínico funcional possível' },
  't4-livre':            { optMin: 1.1,  optMax: 1.5,  label: 'T4 Livre',         unit: 'ng/dL', note: 'quartil inferior pode indicar produção tireoidiana baixa' },
  't3-livre':            { optMin: 3.0,  optMax: 3.5,  label: 'T3 Livre',         unit: 'pg/mL', note: 'T4L ok + T3L baixo = problema de conversão periférica' },
  'anti-tpo':            { optMin: null, optMax: 35,   label: 'Anti-TPO',         unit: 'UI/mL', note: 'autoimunidade precede disfunção em anos' },
  'anti-tireoglobulina': { optMin: null, optMax: 20,   label: 'Anti-Tireoglobulina', unit: 'UI/mL' },
  'vitamina-d':          { optMin: 40,   optMax: 60,   label: 'Vitamina D',       unit: 'ng/mL', note: '< 30 impacta imunidade, tireoide, humor e ossos' },
  'vitamina-b12':        { optMin: 500,  optMax: 800,  label: 'Vitamina B12',     unit: 'pg/mL', note: '300–500 = zona cinza com possível deficiência funcional' },
  'acido-folico':        { optMin: 10,   optMax: null, label: 'Ácido Fólico',     unit: 'ng/mL', note: 'folato alto + B12 baixa = risco neurológico silencioso' },
  'ferritina':           { optMin: 50,   optMax: 100,  label: 'Ferritina',        unit: 'ng/mL', note: '< 50 impacta conversão T4→T3 e função mitocondrial' },
  'ferro-serico':        { optMin: 60,   optMax: 120,  label: 'Ferro Sérico',     unit: 'μg/dL' },
  'pcr':                 { optMin: null, optMax: 0.5,  label: 'PCR',              unit: 'mg/L', note: '0.5–1.0 = inflamação de baixo grau' },
  'vhs':                 { optMin: null, optMax: 10,   label: 'VHS',              unit: 'mm/h' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getOptStatus(value, bioId) {
  const o = OPTIMAL[bioId];
  if (!o || value == null) return null;
  const tooLow  = o.optMin != null && value < o.optMin;
  const tooHigh = o.optMax != null && value > o.optMax;
  return tooLow || tooHigh ? 'subopt' : 'opt';
}

function computeTrend(measurements) {
  if (measurements.length < 3) return null;
  const n = measurements.length;
  const third = Math.max(1, Math.floor(n / 3));
  const firstAvg = measurements.slice(0, third).reduce((s, m) => s + m.value, 0) / third;
  const lastAvg  = measurements.slice(-third).reduce((s, m) => s + m.value, 0) / third;
  const pct = (lastAvg - firstAvg) / Math.abs(firstAvg || 1) * 100;
  if (pct >  10) return { dir: 'rising',  pct };
  if (pct < -10) return { dir: 'falling', pct };
  return { dir: 'stable', pct };
}

// ── Pattern detection (Section 11 of framework) ───────────────────────────────

function detectPatterns(bioMap) {
  const byId   = id => bioMap[id]?.measurements?.at(-1)?.value ?? null;
  const byName = re => Object.values(bioMap).find(b => re.test(b.name))?.measurements?.at(-1)?.value ?? null;

  const glicose  = byId('glicose');
  const insulina = byId('insulina');
  const homaIR   = glicose != null && insulina != null ? (glicose * insulina) / 405 : null;
  const tg       = byId('triglicerideos');
  const hdl      = byId('hdl-colesterol');
  const tgHdl    = tg != null && hdl != null && hdl > 0 ? tg / hdl : null;
  const ct       = byId('colesterol-total');
  const ctHdl    = ct != null && hdl != null && hdl > 0 ? ct / hdl : null;

  const neutroV   = byName(/neutrofil/i);
  const linfocitV = byName(/linfocit/i);
  const nlr       = neutroV != null && linfocitV != null && linfocitV > 0 ? neutroV / linfocitV : null;

  const tsh        = byId('tsh');
  const t4l        = byId('t4-livre');
  const t3l        = byId('t3-livre');
  const antiTpo    = byId('anti-tpo');
  const vitD       = byId('vitamina-d');
  const ferritina  = byId('ferritina');
  const zinco      = byName(/\bzinco\b/i);
  const b12        = byId('vitamina-b12');
  const hcy        = byName(/homocistein/i);
  const pcr        = byId('pcr');
  const ureia      = byId('ureia');
  const albumina   = byName(/\balbumin/i);
  const cortisol   = byName(/\bcortisol\b/i);
  const dheas      = byName(/dhea/i);
  const progesterona = byName(/progesterona/i);
  const gamaGt     = byId('gama-gt');
  const acidoUrico = byId('acido-urico');

  const patterns = [];

  // Pattern 1: Síndrome Metabólica Subclínica
  const p1signals = [
    glicose  != null && glicose >= 87 && glicose <= 99,
    insulina != null && insulina > 6,
    homaIR   != null && homaIR > 1.5,
    tg       != null && tg > 100,
    hdl      != null && hdl < 50,
    acidoUrico != null && acidoUrico > 5.5,
    gamaGt   != null && gamaGt > 25,
  ];
  const p1 = p1signals.filter(Boolean).length;
  if (p1 >= 2) patterns.push({
    id: 'metabolica', score: p1, total: 7, color: 'terra',
    title: 'Síndrome Metabólica Subclínica',
    description: 'Resistência insulínica estabelecida, mas pré-diagnóstica. Todos os marcadores "normais" no laudo convencional — o padrão em conjunto é inequívoco.',
    action: 'Reduzir carboidratos refinados e frutose · exercício de resistência · melhorar sono · avaliar composição corporal (gordura visceral). Reavaliar em 90 dias.',
  });

  // Pattern 2: Tireoide Subclínica com Autoimunidade
  const p2signals = [
    tsh    != null && tsh >= 2.5 && tsh <= 4.5,
    t4l    != null && t4l <= 1.0,
    t3l    != null && t3l < 3.0,
    antiTpo!= null && antiTpo > 35,
    vitD   != null && vitD < 30,
    ferritina != null && ferritina < 50,
    zinco  != null && zinco < 80,
  ];
  const p2 = p2signals.filter(Boolean).length;
  if (p2 >= 2) patterns.push({
    id: 'tireoide', score: p2, total: 7, color: 'terra',
    title: 'Tireoide Subclínica com Autoimunidade',
    description: 'Possível Hashimoto pré-clínico. A autoimunidade destrói a tireoide lentamente — TSH ainda no range, mas o conjunto aponta disfunção emergente.',
    action: 'Suplementar Vitamina D, ferro, zinco, selênio · avaliar sensibilidade ao glúten · monitorar anti-TPO semestralmente · acompanhar tendência de TSH/T4L/T3L.',
  });

  // Pattern 3: Estresse Crônico com Cascata Hormonal
  const p3signals = [
    cortisol    != null && (cortisol > 18 || cortisol < 8),
    dheas       != null && dheas < 100,
    progesterona!= null && progesterona < 5,
    t3l         != null && t3l < 3.0,
    pcr         != null && pcr > 1.0,
    nlr         != null && nlr > 2.5,
  ];
  const p3 = p3signals.filter(Boolean).length;
  if (p3 >= 2) patterns.push({
    id: 'estresse', score: p3, total: 6, color: 'rust',
    title: 'Estresse Crônico com Cascata Hormonal',
    description: 'Eixo HPA desregulado impactando todos os outros em cascata: tireoide (T3 cai), hormônios sexuais (progesterona cai), metabolismo (resistência insulínica), imunidade.',
    action: 'Não adianta tratar os eixos downstream sem abordar o HPA. Priorizar: sono, gestão de estresse, magnésio. Considerar cortisol salivar 4 pontos para mapear curva diurna.',
  });

  // Pattern 4: Depleção Vegana
  const p4signals = [
    b12       != null && b12 < 500,
    hcy       != null && hcy > 8,
    ferritina != null && ferritina < 50,
    zinco     != null && zinco < 80,
    ureia     != null && ureia < 13,
    albumina  != null && albumina < 3.9,
  ];
  const p4 = p4signals.filter(Boolean).length;
  if (p4 >= 2) patterns.push({
    id: 'vegana', score: p4, total: 6, color: 'terra',
    title: 'Depleção Vegana',
    description: 'Depleção gradual de nutrientes críticos escassos em dieta vegana. Pode demorar anos para aparecer no hemograma. VCM subindo progressivamente é sinal precoce e sutil.',
    action: 'B12 contínua (metilcobalamina ou hidroxocobalamina) · ferro + Vitamina C · zinco (com cuidado para não desbalancear cobre) · DHA/EPA de alga. Monitorar semestralmente.',
  });

  // Pattern 5: Inflamação Crônica de Baixo Grau
  const p5signals = [
    pcr       != null && pcr > 1.0,
    ferritina != null && ferritina > 150,
    gamaGt    != null && gamaGt > 25,
    nlr       != null && nlr > 2.5,
    acidoUrico!= null && acidoUrico > 5.5,
    hcy       != null && hcy > 10,
    tgHdl     != null && tgHdl > 2.0,
  ];
  const p5 = p5signals.filter(Boolean).length;
  if (p5 >= 2) patterns.push({
    id: 'inflamacao', score: p5, total: 7, color: 'rust',
    title: 'Inflamação Crônica de Baixo Grau',
    description: 'Inflamação sistêmica subclínica — terreno fértil para doenças metabólicas, autoimunes e cardiovasculares. Origens possíveis: gordura visceral, disbiose, sensibilidades alimentares.',
    action: 'Identificar fonte · eliminar ultraprocessados · avaliar saúde intestinal e oral · ômega-3, curcumina, exercício regular.',
  });

  return { patterns, homaIR, tgHdl, ctHdl, nlr };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, unit, status, thresholds, note }) {
  const colMap = { opt: 'var(--sage)',   warn: 'var(--terra-2)', bad: 'var(--rust)',   none: 'var(--ink-3)' };
  const bgMap  = { opt: 'var(--sage-soft)', warn: 'var(--terra-soft)', bad: 'var(--rust-soft)', none: 'var(--bg-2)' };
  return (
    <div className="card" style={{ padding: '14px 16px', background: bgMap[status] || bgMap.none }}>
      <div className="card-label">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
        <span className="num" style={{ fontSize: 28, color: colMap[status] || colMap.none }}>{value}</span>
        {unit && <span className="unit" style={{ fontSize: 11 }}>{unit}</span>}
      </div>
      {thresholds && <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginTop: 4, lineHeight: 1.4 }}>{thresholds}</div>}
      {note && <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.4 }}>{note}</div>}
    </div>
  );
}

function PatternCard({ pattern }) {
  const [open, setOpen] = useState(false);
  const isRust = pattern.color === 'rust';
  const col = isRust ? 'var(--rust)' : 'var(--terra-2)';
  const bg  = isRust ? 'var(--rust-soft)' : 'var(--terra-soft)';
  return (
    <div className="card" style={{ background: bg, borderColor: col }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic', color: col }}>{pattern.title}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: col, color: 'var(--bg)', padding: '2px 8px', borderRadius: 999 }}>
              {pattern.score}/{pattern.total} marcadores
            </span>
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            {pattern.description}
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)}
          style={{ fontSize: 20, background: 'none', border: 'none', padding: '2px 6px', color: col, flexShrink: 0, cursor: 'pointer', lineHeight: 1 }}>
          {open ? '−' : '+'}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${col}` }}>
          <div className="card-label" style={{ color: col, marginBottom: 4 }}>ação sugerida</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            {pattern.action}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function ViewInsights() {
  const navigate = useNavigate();
  const [biomarkers, setBiomarkers] = useState({});
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured()) { setLoading(false); return; }
    Promise.all([loadBiomarkers(), loadExamsIndex()])
      .then(([b, e]) => { setBiomarkers(b || {}); setExams(e || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const bioList = Object.values(biomarkers).filter(b => b.measurements?.length > 0);
  const withRange = bioList.filter(b => b.range);

  const outOfRange = withRange.filter(b => {
    const v = b.measurements?.at(-1)?.value;
    return v != null && statusOf(v, b.range) !== 'ok';
  });

  const improving = withRange.filter(b => {
    const m = b.measurements || [];
    if (m.length < 2) return false;
    return statusOf(m.at(-2).value, b.range) !== 'ok' && statusOf(m.at(-1).value, b.range) === 'ok';
  });

  // Suboptimal by framework (within lab range but outside functional optimal)
  const frameworkAlerts = bioList.filter(b => {
    const v = b.measurements?.at(-1)?.value;
    if (v == null) return false;
    if (b.range && statusOf(v, b.range) !== 'ok') return false;
    return getOptStatus(v, b.id) === 'subopt';
  });

  // Trend analysis (≥ 3 measurements)
  const trendData = bioList
    .map(b => {
      const sorted = [...(b.measurements || [])].sort((a, z) => a.date.localeCompare(z.date));
      return { b, sorted, trend: computeTrend(sorted) };
    })
    .filter(({ trend }) => trend && trend.dir !== 'stable');

  const risingBios  = trendData.filter(({ trend }) => trend.dir === 'rising');
  const fallingBios = trendData.filter(({ trend }) => trend.dir === 'falling');

  const { patterns, homaIR, tgHdl, ctHdl, nlr } = detectPatterns(biomarkers);
  const hasMetrics = homaIR != null || tgHdl != null || ctHdl != null || nlr != null;

  return (
    <div className="fade-in">
      <PageHead
        eyebrow="análise · histórico"
        title="<em>Insights</em>"
        sub="Padrões clínicos, métricas calculadas e alertas baseados em medicina funcional e integrativa."
      />

      {loading ? (
        <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>carregando…</div>
      ) : bioList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 10 }}>Sem dados ainda</div>
          <div className="subtle" style={{ fontSize: 14, marginBottom: 24 }}>
            Envie pelo menos um exame para ver insights automáticos.
          </div>
          <button className="btn btn--sage" onClick={() => navigate('/upload')}>＋ Enviar PDF</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Stats row ── */}
          <div className="grid grid-3">
            <div className="card">
              <div className="card-label">histórico</div>
              <div className="num" style={{ fontSize: 40, lineHeight: 1, marginTop: 4 }}>{exams.length}</div>
              <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginTop: 4 }}>exames · {bioList.length} biomarcadores</div>
            </div>
            <div className="card" style={{ background: outOfRange.length === 0 ? 'var(--sage-soft)' : 'var(--rust-soft)' }}>
              <div className="card-label">fora da faixa convencional</div>
              <div className="num" style={{ fontSize: 40, lineHeight: 1, marginTop: 4, color: outOfRange.length === 0 ? 'var(--sage)' : 'var(--rust)' }}>
                {outOfRange.length}
              </div>
              <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginTop: 4 }}>
                {frameworkAlerts.length} subótimos pelo framework
              </div>
            </div>
            <div className="card" style={{ background: patterns.length > 0 ? 'var(--terra-soft)' : undefined }}>
              <div className="card-label">padrões detectados</div>
              <div className="num" style={{ fontSize: 40, lineHeight: 1, marginTop: 4, color: patterns.length > 0 ? 'var(--terra-2)' : 'var(--ink-3)' }}>
                {patterns.length}
              </div>
              <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginTop: 4 }}>
                {improving.length > 0 ? `${improving.length} melhoraram recentemente` : 'de 5 padrões monitorados'}
              </div>
            </div>
          </div>

          {/* ── Calculated metrics ── */}
          {hasMetrics && (
            <div>
              <div className="card-label" style={{ marginBottom: 10 }}>métricas calculadas</div>
              <div className="grid grid-3" style={{ gap: 10 }}>
                {homaIR != null && (
                  <MetricCard
                    label="HOMA-IR"
                    value={homaIR.toFixed(2)}
                    unit=""
                    status={homaIR < 1.0 ? 'opt' : homaIR <= 2.0 ? 'warn' : 'bad'}
                    thresholds="< 1.0 ótimo · 1–2 atenção · > 2 resistência"
                    note="Glicose × Insulina ÷ 405 — marcador mais sensível de resistência insulínica"
                  />
                )}
                {tgHdl != null && (
                  <MetricCard
                    label="TG / HDL"
                    value={tgHdl.toFixed(2)}
                    unit=""
                    status={tgHdl < 1.0 ? 'opt' : tgHdl <= 2.0 ? 'warn' : 'bad'}
                    thresholds="< 1.0 ótimo · 1–2 aceitável · > 2 risco CV"
                    note="Melhor preditor de risco cardiovascular acessível. Correlaciona com tamanho de partícula LDL"
                  />
                )}
                {ctHdl != null && (
                  <MetricCard
                    label="Colesterol Total / HDL"
                    value={ctHdl.toFixed(2)}
                    unit=""
                    status={ctHdl < 3.5 ? 'opt' : ctHdl <= 5.0 ? 'warn' : 'bad'}
                    thresholds="< 3.5 ótimo · 3.5–5 aceitável · > 5 risco"
                    note="Perfil lipídico qualitativo"
                  />
                )}
                {nlr != null && (
                  <MetricCard
                    label="NLR (Neutróf. / Linfócit.)"
                    value={nlr.toFixed(2)}
                    unit=""
                    status={nlr < 2.0 ? 'opt' : nlr <= 3.0 ? 'warn' : 'bad'}
                    thresholds="1–2 ótimo · 2–3 atenção · > 3 inflamação"
                    note="Marcador gratuito de inflamação crônica, calculado do hemograma"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Cross-axis patterns ── */}
          {patterns.length > 0 && (
            <div>
              <div className="card-label" style={{ marginBottom: 10 }}>padrões clínicos identificados</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...patterns].sort((a, b) => b.score - a.score).map(p => (
                  <PatternCard key={p.id} pattern={p} />
                ))}
              </div>
              <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginTop: 8, textAlign: 'right' }}>
                baseado em medicina funcional e integrativa · não substitui avaliação médica
              </div>
            </div>
          )}

          {/* ── Out of range (conventional) ── */}
          {outOfRange.length > 0 && (
            <div className="card">
              <div className="card-label" style={{ color: 'var(--rust)' }}>fora da faixa convencional</div>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}>
                {outOfRange.map((b, i) => {
                  const last = b.measurements.at(-1);
                  const st = statusOf(last.value, b.range);
                  return (
                    <div key={b.id} onClick={() => navigate(`/biomarcadores/${b.id}`)}
                      style={{ padding: '12px 0', borderBottom: i < outOfRange.length - 1 ? '1px solid var(--line)' : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>{b.name}</div>
                        <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginTop: 2 }}>
                          ref. {b.range[0]}–{b.range[1]} {b.unit}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="num" style={{ fontSize: 18, color: st === 'warn' ? 'var(--terra-2)' : 'var(--rust)' }}>
                          {last.value}<span className="unit" style={{ fontSize: 10 }}>{b.unit}</span>
                        </span>
                        <span className={`pill ${st === 'warn' ? 'pill--terra' : 'pill--rust'}`}>
                          {st === 'warn' ? '⚠ limite' : '! fora'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Framework alerts (suboptimal) ── */}
          {frameworkAlerts.length > 0 && (
            <div className="card">
              <div className="card-label" style={{ color: 'var(--terra-2)' }}>subótimos pelo framework funcional</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--ink-2)', marginTop: 4, marginBottom: 12, lineHeight: 1.5 }}>
                Dentro do range convencional, mas fora das faixas ótimas de medicina funcional — onde mora a prevenção.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {frameworkAlerts.map((b, i) => {
                  const v = b.measurements.at(-1).value;
                  const opt = OPTIMAL[b.id];
                  const optStr = opt?.optMin != null && opt?.optMax != null ? `${opt.optMin}–${opt.optMax}` :
                    opt?.optMax != null ? `< ${opt.optMax}` : opt?.optMin != null ? `> ${opt.optMin}` : '—';
                  return (
                    <div key={b.id} onClick={() => navigate(`/biomarcadores/${b.id}`)}
                      style={{ padding: '10px 0', borderBottom: i < frameworkAlerts.length - 1 ? '1px solid var(--line)' : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 14 }}>{b.name}</div>
                        <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginTop: 2 }}>
                          ótimo: {optStr} {b.unit || opt?.unit}
                          {opt?.note ? ` · ${opt.note}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span className="num" style={{ fontSize: 17, color: 'var(--terra-2)' }}>
                          {v}<span className="unit" style={{ fontSize: 10 }}>{b.unit}</span>
                        </span>
                        <span className="pill pill--terra" style={{ fontSize: 10 }}>subótimo</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Trends ── */}
          {(risingBios.length > 0 || fallingBios.length > 0) && (
            <div>
              <div className="card-label" style={{ marginBottom: 10 }}>tendências históricas (≥ 3 medições)</div>
              <div className="grid grid-3" style={{ gap: 10 }}>
                {[...risingBios, ...fallingBios].map(({ b, trend }) => {
                  const v = b.measurements.at(-1)?.value;
                  const optSt = getOptStatus(v, b.id);
                  const isRising = trend.dir === 'rising';
                  const opt = OPTIMAL[b.id];
                  // Concerning if moving away from optimal
                  const concerning = optSt === 'subopt' && (
                    (isRising && opt?.optMax != null && v > opt.optMax) ||
                    (!isRising && opt?.optMin != null && v < opt.optMin)
                  );
                  const arrowColor = concerning ? 'var(--terra-2)' : 'var(--ink-3)';
                  return (
                    <div key={b.id} className="card" onClick={() => navigate(`/biomarcadores/${b.id}`)}
                      style={{ padding: '14px 16px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.2, flex: 1 }}>{b.name}</div>
                        <span style={{ fontSize: 20, color: arrowColor, marginLeft: 8 }}>{isRising ? '↗' : '↘'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
                        <span className="num" style={{ fontSize: 22 }}>{v}</span>
                        <span className="unit">{b.unit}</span>
                      </div>
                      <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginTop: 4 }}>
                        {trend.pct > 0 ? '+' : ''}{trend.pct.toFixed(1)}% · {b.measurements.length} medições
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Improving ── */}
          {improving.length > 0 && (
            <div className="card">
              <div className="card-label" style={{ color: 'var(--sage)' }}>melhoraram recentemente</div>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
                {improving.map((b, i) => (
                  <div key={b.id} onClick={() => navigate(`/biomarcadores/${b.id}`)}
                    style={{ padding: '10px 0', borderBottom: i < improving.length - 1 ? '1px solid var(--line)' : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>{b.name}</div>
                    <span className="pill pill--sage">✓ voltou à faixa</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── All good state ── */}
          {outOfRange.length === 0 && frameworkAlerts.length === 0 && patterns.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 8 }}>Tudo em ordem ✓</div>
              <div className="subtle" style={{ fontSize: 14 }}>Nenhum alerta convencional ou funcional detectado.</div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
