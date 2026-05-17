import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { RefBar } from '../components/charts';
import { loadParsedExam } from '../lib/github';
import { statusOf } from '../lib/utils';

export default function ViewExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParsedExam(id).then(data => {
      setExam(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="fade-in">
      <button className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 18 }} onClick={() => navigate('/exames')}>← exames</button>
      <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>carregando…</div>
    </div>
  );

  if (!exam) return (
    <div className="fade-in">
      <button className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 18 }} onClick={() => navigate('/exames')}>← exames</button>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink-2)' }}>Exame não encontrado.</div>
    </div>
  );

  const results = exam.results || [];
  const inRange = results.filter(r => r.range && statusOf(r.value, r.range) === 'ok').length;
  const outOfRange = results.filter(r => r.range && statusOf(r.value, r.range) !== 'ok').length;
  const noRange = results.filter(r => !r.range).length;

  return (
    <div className="fade-in">
      <button className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 18 }} onClick={() => navigate('/exames')}>← exames</button>

      <PageHead
        eyebrow={`${exam.lab?.toLowerCase() || 'laboratório'} · ${results.length} marcadores extraídos`}
        title={`<em>${exam.lab || 'Exame'}</em>`}
        sub={`Coletado em ${exam.date ? new Date(exam.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}. Processado pelo Gemini.`}
      />

      <div className="grid grid-3" style={{ marginBottom: 32 }}>
        <div className="card">
          <div className="card-label">na faixa de referência</div>
          <div className="num" style={{ fontSize: 44, lineHeight: 1, color: 'var(--sage)', marginTop: 6 }}>{inRange}</div>
        </div>
        <div className="card">
          <div className="card-label">fora da faixa</div>
          <div className="num" style={{ fontSize: 44, lineHeight: 1, color: 'var(--terra-2)', marginTop: 6 }}>{outOfRange}</div>
        </div>
        <div className="card">
          <div className="card-label">sem referência informada</div>
          <div className="num" style={{ fontSize: 44, lineHeight: 1, color: 'var(--ink-3)', marginTop: 6 }}>{noRange}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '4px 22px' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Biomarcador</th>
              <th className="right">Valor</th>
              <th>Unidade</th>
              <th style={{ width: 130 }}>Referência</th>
              <th style={{ width: 110 }}>Faixa</th>
              <th className="right">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              const st = r.range ? statusOf(r.value, r.range) : 'none';
              return (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>{r.name}</td>
                  <td className="right">
                    <span className="num" style={{
                      fontSize: 16,
                      color: st === 'ok' ? 'var(--ink)' : st === 'warn' ? 'var(--terra-2)' : st === 'bad' ? 'var(--rust)' : 'var(--ink-2)',
                    }}>{r.value}</span>
                  </td>
                  <td className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>{r.unit}</td>
                  <td className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>
                    {r.range ? `${r.range[0]} – ${r.range[1]}` : '—'}
                  </td>
                  <td><RefBar value={r.value} range={r.range} /></td>
                  <td className="right">
                    {st === 'ok'   && <span className="pill pill--sage">✓ na faixa</span>}
                    {st === 'warn' && <span className="pill pill--terra">⚠ no limite</span>}
                    {st === 'bad'  && <span className="pill pill--rust">! fora</span>}
                    {st === 'none' && <span className="pill">sem ref.</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
