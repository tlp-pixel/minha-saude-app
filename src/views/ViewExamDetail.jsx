import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { Sparkline, RefBar } from '../components/charts';
import { EXAMS, EXAM_DATES, BIOMARKERS, CATEGORIES } from '../data/biomarkers';
import { fmtDate, statusOf } from '../lib/utils';

export default function ViewExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const exam = EXAMS.find(e => e.id === id) || EXAMS[0];
  const examIdx = EXAMS.indexOf(exam);
  const examPos = EXAM_DATES.length - 1 - examIdx;

  const includedCats = examIdx <= 1
    ? CATEGORIES.map(c => c.id)
    : ['hemograma', 'lipidograma', 'glicemico', 'renal'];

  const grouped = includedCats.map(cid => ({
    cat: CATEGORIES.find(c => c.id === cid),
    items: BIOMARKERS.filter(b => b.cat === cid),
  })).filter(g => g.cat);

  const allValues = grouped.flatMap(g => g.items);
  const outOfRange = allValues.filter(b => {
    const v = b.values[examPos];
    return v != null && (v < b.range[0] || v > b.range[1]);
  });

  return (
    <div className="fade-in">
      <button className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 18 }} onClick={() => navigate('/exames')}>← exames</button>

      <PageHead
        eyebrow={`${exam.lab.toLowerCase()} · ${exam.pages} páginas · processado pelo claude`}
        title={exam.type}
        sub={`Coletado em ${fmtDate(exam.date)}. ${allValues.length} biomarcadores extraídos, ${outOfRange.length} fora da faixa de referência.`}
        actions={<>
          <button className="btn btn--ghost">↓ Baixar PDF</button>
          <button className="btn btn--ghost">⎘ Compartilhar</button>
        </>}
      />

      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 32 }}>
        <div>
          {grouped.map(g => (
            <section key={g.cat.id} style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>{g.cat.name}</h2>
                <span className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>{g.items.length} marcadores</span>
              </div>
              <div className="card" style={{ padding: '4px 22px' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Marcador</th>
                      <th className="right">Resultado</th>
                      <th>Referência</th>
                      <th style={{ width: 110 }}>Faixa</th>
                      <th className="right">Histórico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map(b => {
                      const v = b.values[examPos];
                      const status = statusOf(v, b.range);
                      return (
                        <tr key={b.id} className="clickable" onClick={() => navigate(`/biomarcadores/${b.id}`)}>
                          <td><span style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>{b.name}</span></td>
                          <td className="right">
                            <span className="num" style={{ fontSize: 17, color: status === 'ok' ? 'var(--ink)' : status === 'warn' ? 'var(--terra-2)' : 'var(--rust)' }}>
                              {v ?? '—'}<span className="unit">{b.unit}</span>
                            </span>
                          </td>
                          <td className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>{b.range[0]}–{b.range[1]}</td>
                          <td><RefBar value={v} range={b.range} /></td>
                          <td className="right">
                            <Sparkline values={b.values.slice(0, examPos + 1)} range={b.range} width={86} height={24} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <aside style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
          <div className="card card--soft" style={{ marginBottom: 16 }}>
            <div className="card-label">resumo</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <span className="subtle">na faixa</span>
              <span className="num" style={{ fontSize: 17, color: 'var(--sage)' }}>{allValues.length - outOfRange.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <span className="subtle">fora da faixa</span>
              <span className="num" style={{ fontSize: 17, color: 'var(--terra-2)' }}>{outOfRange.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span className="subtle">total extraído</span>
              <span className="num" style={{ fontSize: 17 }}>{allValues.length}</span>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16, borderColor: 'var(--sage-2)', borderStyle: 'dashed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--sage)', display: 'grid', placeItems: 'center', color: 'var(--bg)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13 }}>c</div>
              <div className="card-label" style={{ margin: 0 }}>interpretação · claude</div>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.55, margin: 0 }}>
              Exame com tendência <em style={{ color: 'var(--sage)' }}>positiva</em>.{' '}
              {outOfRange.length > 0
                ? `${outOfRange.length} marcadores merecem acompanhamento.`
                : 'Todos os valores estão na faixa.'}
            </p>
          </div>

          <div className="card">
            <div className="card-label">arquivo original</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <div style={{ width: 38, height: 50, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 4, position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: '6px 5px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ height: 1.5, background: 'var(--line-2)', width: `${55 + i * 8}%` }} />)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exam.lab.toLowerCase().replace(/[^a-z]/g, '')}-{exam.date}.pdf
                </div>
                <div className="subtle tiny" style={{ marginTop: 2 }}>{exam.pages} pág · {(exam.pages * 0.42).toFixed(1)} MB</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
