import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { loadExamsIndex, isConfigured, deleteExam, loadPDFBlob } from '../lib/storage';

export default function ViewExams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [openingPdf, setOpeningPdf] = useState(null);

  useEffect(() => {
    if (!isConfigured()) { setLoading(false); return; }
    loadExamsIndex().then(data => {
      setExams(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleOpenPDF(e, examId) {
    e.stopPropagation();
    setOpeningPdf(examId);
    const blob = await loadPDFBlob(examId);
    setOpeningPdf(null);
    if (!blob) { alert('PDF original não encontrado. Exames enviados antes desta versão não têm o arquivo salvo.'); return; }
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  async function handleDelete(e, examId) {
    e.stopPropagation();
    if (!window.confirm('Excluir este exame? Os biomarcadores extraídos dele também serão removidos.')) return;
    setDeleting(examId);
    await deleteExam(examId);
    setExams(prev => prev.filter(x => x.id !== examId));
    setDeleting(null);
  }

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
                  <div className="subtle tiny" style={{ marginTop: 3 }}>
                    {e.resultsCount > 0
                      ? `${e.resultsCount} marcadores`
                      : e.noduleCount > 0
                        ? 'laudo de imagem'
                        : '0 marcadores'
                    } · {e.pages || 1} pág.
                  </div>
                  {e.noduleCount > 0 && (
                    <div style={{ marginTop: 5 }}>
                      <span className="pill pill--terra" style={{ fontSize: 10 }}>
                        {e.noduleCount} nódulo{e.noduleCount !== 1 ? 's' : ''} detectado{e.noduleCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {e.fileName && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>
                      {e.fileName}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pill pill--sage">✓ analisado</span>
                  <button
                    onClick={ev => handleOpenPDF(ev, e.id)}
                    disabled={openingPdf === e.id}
                    style={{ padding: '5px 10px', borderRadius: 'var(--r-md)', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--ink-2)', background: 'transparent', border: '1px solid var(--line-2)', opacity: openingPdf === e.id ? 0.5 : 1 }}
                  >
                    {openingPdf === e.id ? '…' : 'PDF ↗'}
                  </button>
                  <button
                    onClick={ev => handleDelete(ev, e.id)}
                    disabled={deleting === e.id}
                    style={{ padding: '5px 10px', borderRadius: 'var(--r-md)', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--rust)', background: 'transparent', border: '1px solid var(--rust)', opacity: deleting === e.id ? 0.5 : 1 }}
                  >
                    {deleting === e.id ? '…' : 'excluir'}
                  </button>
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
