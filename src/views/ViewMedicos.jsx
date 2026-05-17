import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { loadExamsIndex } from '../lib/storage';

export default function ViewMedicos() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadExamsIndex().then(data => {
      setExams(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Build doctors map: name → list of exams
  const doctorsMap = {};
  for (const e of exams) {
    const name = e.doctor?.trim();
    if (!name) continue;
    if (!doctorsMap[name]) doctorsMap[name] = [];
    doctorsMap[name].push(e);
  }
  const doctors = Object.entries(doctorsMap)
    .map(([name, list]) => ({ name, exams: list.sort((a, b) => b.date?.localeCompare(a.date)) }))
    .sort((a, b) => b.exams.length - a.exams.length);

  const unknownExams = exams.filter(e => !e.doctor?.trim());

  return (
    <div className="fade-in">
      <PageHead
        eyebrow={`${doctors.length} médico${doctors.length !== 1 ? 's' : ''} identificado${doctors.length !== 1 ? 's' : ''}`}
        title="<em>Médicos</em>"
        sub="Profissionais que solicitaram seus exames. Extraído automaticamente dos PDFs."
      />

      {loading ? (
        <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>carregando…</div>
      ) : doctors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 10 }}>Nenhum médico identificado ainda</div>
          <div className="subtle" style={{ fontSize: 14, marginBottom: 24 }}>
            Os próximos PDFs enviados vão extrair o nome do médico solicitante automaticamente.
          </div>
          <button className="btn btn--ghost" onClick={() => navigate('/upload')}>＋ Enviar exame</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '280px 1fr' : '1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {doctors.map(d => (
              <button
                key={d.name}
                onClick={() => setSelected(selected?.name === d.name ? null : d)}
                className="card"
                style={{
                  textAlign: 'left', cursor: 'pointer',
                  borderColor: selected?.name === d.name ? 'var(--sage)' : 'transparent',
                }}
              >
                <div style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>{d.name}</div>
                <div className="subtle tiny" style={{ marginTop: 4, fontFamily: 'var(--mono)' }}>
                  {d.exams.length} exame{d.exams.length !== 1 ? 's' : ''}
                  {d.exams[0]?.date ? ` · último: ${new Date(d.exams[0].date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` : ''}
                </div>
              </button>
            ))}

            {unknownExams.length > 0 && (
              <button
                onClick={() => setSelected(selected?.name === '—' ? null : { name: '—', exams: unknownExams })}
                className="card"
                style={{
                  textAlign: 'left', cursor: 'pointer', opacity: 0.55,
                  borderColor: selected?.name === '—' ? 'var(--line-2)' : 'transparent',
                }}
              >
                <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink-3)' }}>Não identificado</div>
                <div className="subtle tiny" style={{ marginTop: 4, fontFamily: 'var(--mono)' }}>
                  {unknownExams.length} exame{unknownExams.length !== 1 ? 's' : ''}
                </div>
              </button>
            )}
          </div>

          {selected && (
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', marginBottom: 18 }}>
                {selected.name === '—' ? 'Sem médico identificado' : selected.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.exams.map(e => (
                  <button
                    key={e.id}
                    className="card"
                    onClick={() => navigate(`/exames/${e.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 18, textAlign: 'left', cursor: 'pointer' }}
                  >
                    <div style={{ minWidth: 90 }}>
                      <div className="num" style={{ fontSize: 26, lineHeight: 1 }}>
                        {e.date ? new Date(e.date + 'T12:00:00').getDate() : '—'}
                      </div>
                      <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginTop: 3 }}>
                        {e.date ? new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : ''}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{e.lab || 'Laboratório'}</div>
                      {e.fileName && (
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{e.fileName}</div>
                      )}
                    </div>
                    <div className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>→</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
