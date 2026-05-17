import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { loadExamsIndex, loadBiomarkers, isConfigured } from '../lib/github';
import { statusOf } from '../lib/utils';

export default function ViewHome() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [biomarkers, setBiomarkers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured()) { setLoading(false); return; }
    Promise.all([loadExamsIndex(), loadBiomarkers()])
      .then(([e, b]) => {
        setExams(e || []);
        setBiomarkers(b || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 19) return 'Boa tarde';
    return 'Boa noite';
  })();

  const bioList = Object.values(biomarkers);
  const withRange = bioList.filter(b => b.range);
  const inRange = withRange.filter(b => {
    const last = b.measurements?.at(-1)?.value;
    return last != null && statusOf(last, b.range) === 'ok';
  }).length;
  const outRange = withRange.filter(b => {
    const last = b.measurements?.at(-1)?.value;
    return last != null && statusOf(last, b.range) !== 'ok';
  });

  const lastExam = exams[0];
  const recent = exams.slice(0, 3);
  const configured = isConfigured();

  return (
    <div className="fade-in">
      <PageHead
        eyebrow={`hoje · ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`}
        title={`${greeting},<br/><em>Thalita.</em>`}
        sub={
          !configured ? 'Configure o GitHub e a Gemini API em Configurações para começar.' :
          loading ? 'Carregando seus dados…' :
          exams.length === 0 ? 'Envie seu primeiro exame em PDF para começar.' :
          `Último exame: ${lastExam?.lab} · ${lastExam?.date ? new Date(lastExam.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}. ${bioList.length} biomarcadores acompanhados.`
        }
        actions={<>
          <button className="btn btn--ghost" onClick={() => navigate('/exames')}>Ver exames</button>
          <button className="btn btn--sage" onClick={() => navigate('/upload')}>＋ Enviar PDF</button>
        </>}
      />

      {!configured && (
        <div className="card" style={{ borderColor: 'var(--terra)', borderStyle: 'dashed', marginBottom: 28 }}>
          <div className="card-label" style={{ color: 'var(--terra-2)' }}>para começar</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 15, margin: '6px 0 12px', color: 'var(--ink-2)' }}>
            Configure sua chave da Gemini API e conecte o GitHub para salvar e analisar seus exames.
          </p>
          <button className="btn btn--sage" onClick={() => navigate('/config')}>Ir para Configurações →</button>
        </div>
      )}

      {configured && !loading && exams.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 26, marginBottom: 12 }}>Tudo pronto!</div>
          <div className="subtle" style={{ fontSize: 15, marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>
            Envie seu primeiro PDF de exame e o Gemini vai extrair todos os biomarcadores automaticamente.
          </div>
          <button className="btn btn--sage" onClick={() => navigate('/upload')}>＋ Enviar primeiro exame</button>
        </div>
      )}

      {!loading && exams.length > 0 && (
        <>
          <div className="grid grid-3" style={{ marginBottom: 28 }}>
            <div className="card">
              <div className="card-label">na faixa de referência</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="num" style={{ fontSize: 48, lineHeight: 1, color: 'var(--sage)' }}>{inRange}</span>
                <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>/ {withRange.length}</span>
              </div>
              <div className="subtle tiny" style={{ marginTop: 6 }}>biomarcadores com referência</div>
            </div>

            <div className="card">
              <div className="card-label">exames enviados</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="num" style={{ fontSize: 48, lineHeight: 1 }}>{exams.length}</span>
                <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>PDFs</span>
              </div>
              <div className="subtle tiny" style={{ marginTop: 6 }}>
                último: {lastExam?.date ? new Date(lastExam.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>

            <div className="card">
              <div className="card-label">biomarcadores</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="num" style={{ fontSize: 48, lineHeight: 1 }}>{bioList.length}</span>
                <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>rastreados</span>
              </div>
              <div className="subtle tiny" style={{ marginTop: 6 }}>
                {outRange.length > 0 ? `${outRange.length} fora da faixa` : 'todos na faixa ✓'}
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, margin: 0 }}>Últimos exames</h2>
                <button className="subtle tiny" style={{ fontFamily: 'var(--mono)' }} onClick={() => navigate('/exames')}>histórico completo →</button>
              </div>
              <div className="card" style={{ padding: '4px 22px' }}>
                <table className="tbl">
                  <tbody>
                    {recent.map(e => (
                      <tr key={e.id} className="clickable" onClick={() => navigate(`/exames/${e.id}`)}>
                        <td style={{ width: 100, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
                          {e.date ? new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}<br/>
                          <span style={{ fontSize: 10.5 }}>{e.date?.slice(0, 4)}</span>
                        </td>
                        <td>
                          <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{e.lab || 'Laboratório'}</div>
                          <div className="subtle tiny" style={{ marginTop: 3 }}>{e.resultsCount ?? '—'} marcadores · {e.pages || 1} pág.</div>
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
              {outRange.length === 0 ? (
                <div className="card card--soft">
                  <div className="subtle">Nenhum marcador fora da faixa. ✓</div>
                </div>
              ) : (
                <div className="card card--soft" style={{ background: 'var(--terra-soft)' }}>
                  {outRange.slice(0, 5).map((b, i) => {
                    const last = b.measurements?.at(-1);
                    const st = statusOf(last?.value, b.range);
                    return (
                      <div key={b.id} style={{ padding: '14px 0', borderBottom: i < Math.min(outRange.length, 5) - 1 ? '1px solid rgba(0,0,0,0.06)' : 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>{b.name}</div>
                          <div className="tiny subtle" style={{ marginTop: 4, fontFamily: 'var(--mono)' }}>
                            ref. {b.range[0]}–{b.range[1]} {b.unit}
                          </div>
                        </div>
                        <span className="num" style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.1, color: st === 'warn' ? 'var(--terra-2)' : 'var(--rust)' }}>
                          {last?.value}<span className="unit" style={{ fontSize: 11 }}>{b.unit}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
