import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { EXAMS } from '../data/biomarkers';
import { fmtDate } from '../lib/utils';

export default function ViewExams() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const years = [...new Set(EXAMS.map(e => e.date.slice(0, 4)))];
  const filters = [{ id: 'all', label: 'todos' }, ...years.map(y => ({ id: y, label: y }))];
  const exams = EXAMS.filter(e => filter === 'all' || e.date.startsWith(filter));
  const totalPages = EXAMS.reduce((a, e) => a + e.pages, 0);

  return (
    <div className="fade-in">
      <PageHead
        eyebrow={`${EXAMS.length} arquivos · ${totalPages} páginas no total`}
        title="Seus <em>exames</em>"
        sub="Histórico cronológico dos PDFs enviados, do mais recente ao mais antigo."
        actions={<button className="btn btn--ghost" onClick={() => navigate('/upload')}>＋ Enviar novo</button>}
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 22, padding: 4, background: 'var(--bg-2)', borderRadius: 999, width: 'fit-content' }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '6px 14px', borderRadius: 999,
            background: filter === f.id ? 'var(--bg)' : 'transparent',
            color: filter === f.id ? 'var(--ink)' : 'var(--ink-3)',
            fontSize: 12.5, fontFamily: 'var(--mono)', letterSpacing: '0.02em',
            transition: 'background .15s ease',
            boxShadow: filter === f.id ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {exams.map(e => (
          <button key={e.id} className="card" onClick={() => navigate(`/exames/${e.id}`)} style={{
            display: 'grid', gridTemplateColumns: '120px 60px 1fr auto',
            gap: 22, alignItems: 'center', textAlign: 'left', cursor: 'pointer',
          }}>
            <div>
              <div className="num" style={{ fontSize: 30, lineHeight: 1 }}>{new Date(e.date).getDate()}</div>
              <div className="subtle tiny" style={{ marginTop: 4, fontFamily: 'var(--mono)' }}>
                {new Date(e.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div style={{ width: 44, height: 56, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 4, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '8px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 2, background: 'var(--line-2)', width: `${55 + i * 5}%` }} />)}
              </div>
              <div style={{ position: 'absolute', bottom: 3, right: 3, fontSize: 7.5, fontFamily: 'var(--mono)', color: 'var(--ink-3)' }}>PDF</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 19, letterSpacing: '-0.01em' }}>{e.type}</div>
              <div className="subtle tiny" style={{ marginTop: 4 }}>
                {e.lab} · {e.pages} páginas · {Math.round(e.pages * 0.42 * 10) / 10} MB
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="pill pill--sage">✓ analisado</span>
              <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 16 }}>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
