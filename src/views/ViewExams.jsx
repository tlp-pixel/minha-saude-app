import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { loadExamsIndex, isConfigured } from '../lib/storage';

export default function ViewExams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isConfigured()) { setLoading(false); return; }
    loadExamsIndex().then(data => {
      setExams(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const years = [...new Set(exams.map(e => e.date?.slice(0, 4)).filter(Boolean))].sort().reverse();
  const filters = [{ id: 'all', label: 'todos' }, ...years.map(y => ({ id: y, label: y }))];
  const filtered = exams.filter(e => filter === 'all' || e.date?.startsWith(filter));
  const totalPages = exams.reduce((a, e) => a + (e.pages || 1), 0);

  return (
    <div className="fade-in">
      <PageHead
        eyebrow={`${exams.length} arquivo${exams.length !== 1 ? 's' : ''} · ${totalPages} página${totalPages !== 1 ? 's' : ''} no total`}
        title="Seus <em>exames</em>"
        sub="Histórico cronológico dos PDFs enviados, do mais recente ao mais antigo."
        actions={<button className="btn btn--ghost" onClick={() => navigate('/upload')}>＋ Enviar novo</button>}
      />

      {!isConfigured() && (
        <div className="card" style={{ borderColor: 'var(--terra)', borderStyle: 'dashed', marginBottom: 24 }}>
          <div className="card-label" style={{ color: 'var(--terra-2)' }}>atenção</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 15, margin: '6px 0 10px', color: 'var(--ink-2)' }}>
            Configure o GitHub em Configurações para ver seus exames.
          </p>
          <button className="btn btn--ghost" onClick={() => navigate('/config')}>Ir para Configurações →</button>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>carregando…</div>
      ) : exams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 10 }}>Nenhum exame ainda</div>
          <div className="subtle" style={{ fontSize: 14, marginBottom: 24 }}>Envie seu primeiro PDF para começar.</div>
          <button className="btn btn--sage" onClick={() => navigate('/upload')}>＋ Enviar PDF</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 22, padding: 4, background: 'var(--bg-2)', borderRadius: 999, width: 'fit-content' }}>
            {filters.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '6px 14px', borderRadius: 999,
                background: filter === f.id ? 'var(--bg)' : 'transparent',
                color: filter === f.id ? 'var(--ink)' : 'var(--ink-3)',
                fontSize: 12.5, fontFamily: 'var(--mono)',
                boxShadow: filter === f.id ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
              }}>{f.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(e => (
              <button key={e.id} className="card" onClick={() => navigate(`/exames/${e.id}`)} style={{
                display: 'grid', gridTemplateColumns: '120px 60px 1fr auto',
                gap: 22, alignItems: 'center', textAlign: 'left', cursor: 'pointer',
              }}>
                <div>
                  <div className="num" style={{ fontSize: 30, lineHeight: 1 }}>
                    {e.date ? new Date(e.date + 'T12:00:00').getDate() : '—'}
                  </div>
                  <div className="subtle tiny" style={{ marginTop: 4, fontFamily: 'var(--mono)' }}>
                    {e.date ? new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : ''}
                  </div>
                </div>
                <div style={{ width: 44, height: 56, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 4, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: '8px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 2, background: 'var(--line-2)', width: `${55 + i * 5}%` }} />)}
                  </div>
                  <div style={{ position: 'absolute', bottom: 3, right: 3, fontSize: 7.5, fontFamily: 'var(--mono)', color: 'var(--ink-3)' }}>PDF</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 19 }}>{e.lab || 'Laboratório'}</div>
                  <div className="subtle tiny" style={{ marginTop: 4 }}>
                    {e.resultsCount ?? '—'} marcadores extraídos · {e.pages || 1} página{(e.pages || 1) !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="pill pill--sage">✓ analisado</span>
                  <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 16 }}>→</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
