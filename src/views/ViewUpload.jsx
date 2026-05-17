import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { parsePDF } from '../lib/parser';
import { isConfigured, saveExamsIndex, saveParsedExam, loadExamsIndex, mergeParsedExamIntoBiomarkers } from '../lib/storage';
import { statusOf } from '../lib/utils';

const SUPPORTED = [
  'Hemograma · Bioquímica · Lipidograma',
  'Glicêmico · HbA1c · Insulina',
  'Função renal · Função hepática',
  'Tireoide · Hormônios · Vitaminas',
  'Inflamatórios · Marcadores tumorais',
  'Laudos de ultrassom e imagem',
];

const STAGE_LABELS = {
  reading:      'Lendo PDF e extraindo texto',
  extracting:   'Claude analisando os valores…',
  normalizing:  'Organizando os biomarcadores',
  saving:       'Salvando no GitHub',
  done:         'Concluído',
};

function UploadResult({ parsed, fileName, onAgain }) {
  const navigate = useNavigate();
  const inRange  = parsed.results.filter(r => r.range && statusOf(r.value, r.range) === 'ok').length;
  const outRange = parsed.results.filter(r => r.range && statusOf(r.value, r.range) !== 'ok').length;
  const noRange  = parsed.results.filter(r => !r.range).length;

  return (
    <div className="fade-in">
      <PageHead
        eyebrow="análise concluída ✓"
        title={`<em>${parsed.results.length} valores</em> extraídos`}
        sub={`${fileName} · ${parsed.lab} · ${parsed.date} · salvo no GitHub`}
        actions={<>
          <button className="btn btn--ghost" onClick={onAgain}>Enviar outro</button>
          <button className="btn btn--sage" onClick={() => navigate('/biomarcadores')}>Ver biomarcadores →</button>
        </>}
      />

      <div className="grid grid-3" style={{ marginBottom: 32 }}>
        <div className="card">
          <div className="card-label">na faixa de referência</div>
          <div className="num" style={{ fontSize: 44, lineHeight: 1, color: 'var(--sage)' }}>{inRange}</div>
        </div>
        <div className="card">
          <div className="card-label">fora da faixa</div>
          <div className="num" style={{ fontSize: 44, lineHeight: 1, color: 'var(--terra-2)' }}>{outRange}</div>
        </div>
        <div className="card">
          <div className="card-label">sem referência informada</div>
          <div className="num" style={{ fontSize: 44, lineHeight: 1, color: 'var(--ink-3)' }}>{noRange}</div>
        </div>
      </div>

      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, margin: '0 0 16px' }}>
        Todos os valores extraídos
      </h2>
      <div className="card" style={{ padding: '4px 22px' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Biomarcador</th>
              <th className="right">Valor</th>
              <th>Unidade</th>
              <th>Referência</th>
              <th className="right">Status</th>
            </tr>
          </thead>
          <tbody>
            {parsed.results.map(r => {
              const st = r.range ? statusOf(r.value, r.range) : 'none';
              return (
                <tr key={r.id}>
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

export default function ViewUpload() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState(null);

  function onProgress(stageName, pct) {
    setStage(stageName);
    setProgress(pct);
  }

  async function handleFile(file) {
    if (!file.type.includes('pdf')) {
      setError('Selecione um arquivo PDF.');
      return;
    }

    if (!localStorage.getItem('gemini_api_key')) {
      setError('Configure sua chave da Gemini API em Configurações antes de enviar.');
      return;
    }

    setFileName(file.name);
    setError('');
    setStage('reading');
    setProgress(5);

    try {
      const result = await parsePDF(file, onProgress);
      setParsed(result);

      if (isConfigured()) {
        setStage('saving');
        setProgress(90);
        await saveParsedExam(result.examId, result);

        const indexResult = await loadExamsIndex();
        const index = indexResult || [];
        const exists = index.find(e => e.id === result.examId);
        if (!exists) {
          index.unshift({
            id: result.examId,
            date: result.date,
            lab: result.lab,
            pages: result.pages || 1,
            status: 'parsed',
            resultsCount: result.results.length,
          });
          await saveExamsIndex(index, null);
        }

        await mergeParsedExamIntoBiomarkers(result);
      }

      setStage('done');
      setProgress(100);
    } catch (e) {
      setError(e.message);
      setStage('idle');
      setProgress(0);
    }
  }

  function reset() {
    setStage('idle');
    setProgress(0);
    setFileName('');
    setError('');
    setParsed(null);
  }

  if (stage === 'done' && parsed) {
    return <UploadResult parsed={parsed} fileName={fileName} onAgain={reset} />;
  }

  const isProcessing = stage !== 'idle' && stage !== 'done';
  const stageKeys = ['reading', 'extracting', 'normalizing', 'saving'];
  const curIdx = stageKeys.indexOf(stage);

  return (
    <div className="fade-in">
      <PageHead
        eyebrow="enviar"
        title="Adicione um <em>novo exame</em>"
        sub="Arraste o PDF para a área abaixo. O Claude vai ler e extrair absolutamente todos os valores, sem pular nenhum."
      />

      <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 28 }}>
        <div>
          {!isProcessing && (
            <div
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--sage)'; e.currentTarget.style.background = 'var(--sage-soft)'; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; const f = e.dataTransfer?.files?.[0]; if (f) handleFile(f); }}
              style={{ border: '1.5px dashed var(--line-2)', borderRadius: 'var(--r-xl)', padding: '64px 40px', background: 'var(--bg-2)', textAlign: 'center', transition: 'all .2s ease' }}
            >
              <div style={{ width: 64, height: 80, margin: '0 auto 22px', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 6, position: 'relative' }}>
                <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', fontSize: 22, color: 'var(--sage)' }}>↓</div>
                <div style={{ position: 'absolute', inset: '14px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[80, 65, 75, 50, 70].map((w, i) => <div key={i} style={{ height: 2.5, width: w + '%', background: 'var(--line)' }} />)}
                </div>
                <div style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 8, fontFamily: 'var(--mono)', color: 'var(--ink-3)' }}>PDF</div>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontStyle: 'italic', letterSpacing: '-0.01em', margin: '0 0 6px' }}>
                arraste o PDF aqui
              </div>
              <div className="subtle" style={{ fontSize: 13.5, marginBottom: 22 }}>
                ou selecione manualmente · qualquer laboratório
              </div>
              <label className="btn btn--sage" style={{ cursor: 'pointer' }}>
                escolher arquivo
                <input type="file" accept="application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </label>
              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {['Fleury', 'Sabin', 'DASA', 'Sírio', 'Einstein', 'qualquer outro'].map(l => (
                  <span key={l} className="pill">{l}</span>
                ))}
              </div>

              {error && (
                <div style={{ marginTop: 18, padding: '12px 16px', background: 'var(--rust-soft)', borderRadius: 'var(--r-md)', color: 'var(--rust)', fontSize: 13.5, fontFamily: 'var(--mono)' }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="card" style={{ padding: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <div style={{ width: 44, height: 56, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 4, flexShrink: 0 }}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <div style={{ position: 'absolute', inset: '8px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {[1,2,3,4,5].map(i => <div key={i} style={{ height: 2, background: 'var(--line-2)', width: `${60+i*5}%` }} />)}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>{fileName}</div>
                  <div className="subtle tiny" style={{ marginTop: 3, fontFamily: 'var(--mono)' }}>{progress}% concluído</div>
                </div>
              </div>

              <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden', marginBottom: 28 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--sage)', transition: 'width .4s ease' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stageKeys.map((key, idx) => {
                  const state = idx < curIdx ? 'done' : idx === curIdx ? 'doing' : 'pending';
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: state === 'pending' ? 0.35 : 1 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: state === 'done' ? 'var(--sage)' : state === 'doing' ? 'var(--terra)' : 'var(--bg-3)',
                        display: 'grid', placeItems: 'center', color: 'var(--bg)', fontSize: 10,
                      }} className={state === 'doing' ? 'pulse' : ''}>
                        {state === 'done' ? '✓' : ''}
                      </div>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 15, flex: 1 }}>
                        {STAGE_LABELS[key]}
                      </span>
                      <span className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>
                        {state === 'done' ? 'pronto' : state === 'doing' ? 'em andamento…' : 'aguardando'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {stage === 'extracting' && (
                <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--sage-soft)', borderRadius: 'var(--r-md)', fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  O Claude está lendo cada linha do exame para não perder nenhum valor. Isso pode levar 15–30 segundos dependendo do tamanho do PDF.
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="card card--soft">
            <div className="card-label">o que conseguimos ler</div>
            <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUPPORTED.map(s => (
                <li key={s} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontFamily: 'var(--serif)', fontSize: 15 }}>
                  <span style={{ color: 'var(--sage)' }}>·</span> {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-label">extração completa</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.55, margin: '8px 0 0', color: 'var(--ink-2)' }}>
              O Claude lê <b>todo o texto</b> do PDF e extrai absolutamente todos os valores — inclusive marcadores que o app ainda não conhecia. Nenhum dado é descartado.
            </p>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-label">privacidade</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.55, margin: '8px 0 0', color: 'var(--ink-2)' }}>
              PDFs ficam no <b>seu repositório GitHub privado</b>. A análise roda com sua chave Claude; seus dados não passam por nenhum servidor nosso.
            </p>
          </div>

          {!localStorage.getItem('gemini_api_key') && (
            <div className="card" style={{ marginTop: 16, borderColor: 'var(--terra)', borderStyle: 'dashed' }}>
              <div className="card-label" style={{ color: 'var(--terra-2)' }}>atenção</div>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 15, margin: '8px 0 10px', color: 'var(--ink-2)' }}>
                Configure sua chave da Gemini API antes de enviar um exame.
              </p>
              <button className="btn btn--ghost" onClick={() => navigate('/config')}>Ir para Configurações →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
