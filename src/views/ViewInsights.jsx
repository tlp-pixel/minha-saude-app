import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { loadBiomarkers, loadExamsIndex, isConfigured } from '../lib/github';
import { statusOf } from '../lib/utils';

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
    const last = m.at(-1).value;
    const prev = m.at(-2).value;
    const wasOut = statusOf(prev, b.range) !== 'ok';
    const nowIn  = statusOf(last, b.range) === 'ok';
    return wasOut && nowIn;
  });

  return (
    <div className="fade-in">
      <PageHead
        eyebrow="análise · histórico"
        title="<em>Insights</em> do seu histórico"
        sub="Achados automáticos baseados nos seus exames reais: o que melhorou, o que merece atenção."
      />

      {!isConfigured() && (
        <div className="card" style={{ borderColor: 'var(--terra)', borderStyle: 'dashed', marginBottom: 24 }}>
          <div className="card-label" style={{ color: 'var(--terra-2)' }}>atenção</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 15, margin: '6px 0 10px', color: 'var(--ink-2)' }}>
            Configure o GitHub em Configurações para ver seus insights.
          </p>
          <button className="btn btn--ghost" onClick={() => navigate('/config')}>Ir para Configurações →</button>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>carregando…</div>
      ) : bioList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 10 }}>Sem dados ainda</div>
          <div className="subtle" style={{ fontSize: 14, marginBottom: 24 }}>Envie pelo menos um exame para ver insights automáticos.</div>
          <button className="btn btn--sage" onClick={() => navigate('/upload')}>＋ Enviar PDF</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div className="grid grid-3" style={{ marginBottom: 8 }}>
            <div className="card">
              <div className="card-label">exames analisados</div>
              <div className="num" style={{ fontSize: 44, lineHeight: 1, marginTop: 6 }}>{exams.length}</div>
            </div>
            <div className="card" style={{ background: outOfRange.length === 0 ? 'var(--sage-soft)' : 'var(--terra-soft)' }}>
              <div className="card-label">fora da faixa agora</div>
              <div className="num" style={{ fontSize: 44, lineHeight: 1, marginTop: 6, color: outOfRange.length === 0 ? 'var(--sage)' : 'var(--terra-2)' }}>
                {outOfRange.length}
              </div>
            </div>
            <div className="card" style={{ background: improving.length > 0 ? 'var(--sage-soft)' : undefined }}>
              <div className="card-label">melhoraram recentemente</div>
              <div className="num" style={{ fontSize: 44, lineHeight: 1, marginTop: 6, color: improving.length > 0 ? 'var(--sage)' : 'var(--ink-3)' }}>
                {improving.length}
              </div>
            </div>
          </div>

          {outOfRange.length > 0 && (
            <div className="card">
              <div className="card-label" style={{ color: 'var(--terra-2)' }}>fora da faixa de referência</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 8 }}>
                {outOfRange.map((b, i) => {
                  const last = b.measurements.at(-1);
                  const st = statusOf(last.value, b.range);
                  return (
                    <div key={b.id} onClick={() => navigate(`/biomarcadores/${b.id}`)}
                      style={{ padding: '14px 0', borderBottom: i < outOfRange.length - 1 ? '1px solid var(--line)' : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{b.name}</div>
                        <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginTop: 4 }}>ref. {b.range[0]}–{b.range[1]} {b.unit}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="num" style={{ fontSize: 20, color: st === 'warn' ? 'var(--terra-2)' : 'var(--rust)' }}>
                          {last.value}<span className="unit" style={{ fontSize: 11 }}>{b.unit}</span>
                        </span>
                        <span className={`pill ${st === 'warn' ? 'pill--terra' : 'pill--rust'}`}>
                          {st === 'warn' ? '⚠ no limite' : '! fora'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {improving.length > 0 && (
            <div className="card">
              <div className="card-label" style={{ color: 'var(--sage)' }}>melhoraram desde o último exame</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 8 }}>
                {improving.map((b, i) => {
                  const last = b.measurements.at(-1);
                  return (
                    <div key={b.id} onClick={() => navigate(`/biomarcadores/${b.id}`)}
                      style={{ padding: '14px 0', borderBottom: i < improving.length - 1 ? '1px solid var(--line)' : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{b.name}</div>
                      <span className="pill pill--sage">✓ voltou à faixa</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {bioList.length > 0 && outOfRange.length === 0 && improving.length === 0 && (
            <div className="card card--soft" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 8 }}>Tudo na faixa ✓</div>
              <div className="subtle">Todos os biomarcadores com referência estão dentro do esperado.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
