import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { parsePDF } from '../lib/parser';
import { saveExamsIndex, saveParsedExam, loadExamsIndex, mergeParsedExamIntoBiomarkers } from '../lib/storage';
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
  reading:     'Lendo PDF e extraindo texto',
  extracting:  'Gemini analisando os valores…',
  normalizing: 'Organizando os biomarcadores',
  saving:      'Salvando localmente',
  done:        'Concluído',
};

function BatchResult({ results, onAgain }) {
  const navigate = useNavigate();
  const totalMarkers = results.reduce((a, r) => a + (r.parsed?.results?.length ?? 0), 0);
  const ok = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  return (
    <div className="fade-in">
      <PageHead
        eyebrow={`${ok.length} de ${results.length} exames processados`}
        title={`<em>${totalMarkers} valores</em> extraídos`}
        sub="Todos os exames foram analisados pelo Gemini e salvos localmente."
        actions={<>
          <button className="btn btn--ghost" onClick={onAgain}>Enviar mais</button>
          <button className="btn btn--sage" onClick={() => navigate('/biomarcadores')}>Ver biomarcadores →</button>
        </>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {results.map((r, i) => (
          <div key={i} className="card" style={{
            display: 'flex', alignItems: 'center', gap: 16,
            borderColor: r.ok ? 'transparent' : 'var(--rust)',
            background: r.ok ? 'var(--bg)' : 'var(--rust-soft)',
          }}>
            <div style={{ fontSize: 20 }}>{r.ok ? '✓' : '✗'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{r.fileName}</div>
              {r.ok
                ? <div className="subtle tiny" style={{ marginTop: 3 }}>{r.parsed.lab} · {r.parsed.date} · {r.parsed.results.length} marcadores</div>
                : <div style={{ fontSize: 13, color: 'var(--rust)', marginTop: 3 }}>{r.error}</div>
              }
            </div>
            {r.ok && (
              <div style={{ display: 'flex', gap: 8 }}>
                {(() => {
                  const inRange  = r.parsed.results.filter(x => x.range && statusOf(x.value, x.range) === 'ok').length;
                  const outRange = r.parsed.results.filter(x => x.range && statusOf(x.value, x.range) !== 'ok').length;
                  return <>
                    {inRange  > 0 && <span className="pill pill--sage">{inRange} na faixa</span>}
                    {outRange > 0 && <span className="pill pill--terra">{outRange} fora</span>}
                  </>;
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {failed.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--rust)', borderStyle: 'dashed' }}>
          <div className="card-label" style={{ color: 'var(--rust)' }}>arquivos com erro</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink-2)', margin: '6px 0 0' }}>
            {failed.length} arquivo{failed.length > 1 ? 's' : ''} não pôde ser processado. Verifique se são PDFs de exame com texto legível (não escaneados).
          </p>
        </div>
      )}
    </div>
  );
}

export default function ViewUpload() {
  const navigate = useNavigate();
  const [stage, setStage]         = useState('idle');
  const [progress, setProgress]   = useState(0);
  const [current, setCurrent]     = useState({ name: '', index: 0, total: 0 });
  const [error, setError]         = useState('');
  const [batchResults, setBatchResults] = useState(null);

  function onProgress(stageName, pct) {
    setStage(stageName);
    setProgress(pct);
  }

  async function processFile(file) {
    const result = await parsePDF(file, onProgress);

    setStage('saving');
    setProgress(90);
    await saveParsedExam(result.examId, result);

    const index = (await loadExamsIndex()) || [];
    if (!index.find(e => e.id === result.examId)) {
      index.unshift({
        id: result.examId,
        date: result.date,
        lab: result.lab,
        pages: result.pages || 1,
        status: 'parsed',
        resultsCount: result.results.length,
      });
      await saveExamsIndex(index);
    }

    await mergeParsedExamIntoBiomarkers(result);
    return result;
  }

  async function handleFiles(files) {
    const pdfs = [...files].filter(f => f.type.includes('pdf') || f.name.endsWith('.pdf'));
    if (pdfs.length === 0) { setError('Selecione arquivos PDF.'); return; }

    if (!localStorage.getItem('gemini_api_key')) {
      setError('Configure sua chave da Gemini API em Configurações antes de enviar.');
      return;
    }

    setError('');
    setBatchResults(null);
    const results = [];

    for (let i = 0; i < pdfs.length; i++) {
      const file = pdfs[i];
      setCurrent({ name: file.name, index: i + 1, total: pdfs.length });
      setStage('reading');
      setProgress(0);

      try {
        const parsed = await processFile(file);
        results.push({ ok: true, fileName: file.name, parsed });
      } catch (e) {
        results.push({ ok: false, fileName: file.name, error: e.message });
      }
    }

    setStage('idle');
    setProgress(0);
    setBatchResults(results);
  }

  function reset() {
    setStage('idle');
    setProgress(0);
    setCurrent({ name: '', index: 0, total: 0 });
    setError('');
    setBatchResults(null);
  }

  if (batchResults) {
    return <BatchResult results={batchResults} onAgain={reset} />;
  }

  const isProcessing = stage !== 'idle' && stage !== 'done';
  const stageKeys = ['reading', 'extracting', 'normalizing', 'saving'];
  const curIdx = stageKeys.indexOf(stage);

  return (
    <div className="fade-in">
      <PageHead
        eyebrow="enviar"
        title="Adicione <em>novos exames</em>"
        sub="Arraste um PDF ou uma pasta inteira. O Gemini vai ler e extrair absolutamente todos os valores."
      />

      <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 28 }}>
        <div>
          {!isProcessing && (
            <div
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--sage)'; e.currentTarget.style.background = 'var(--sage-soft)'; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.background = '';
                const files = e.dataTransfer?.files;
                if (files?.length) handleFiles(files);
              }}
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
                arraste os PDFs aqui
              </div>
              <div className="subtle" style={{ fontSize: 13.5, marginBottom: 22 }}>
                um ou vários de uma vez · qualquer laboratório
              </div>
              <label className="btn btn--sage" style={{ cursor: 'pointer' }}>
                escolher arquivos
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  hidden
                  onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); }}
                />
              </label>

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
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>{current.name}</div>
                  <div className="subtle tiny" style={{ marginTop: 3, fontFamily: 'var(--mono)' }}>
                    {current.total > 1 ? `arquivo ${current.index} de ${current.total} · ` : ''}{progress}% concluído
                  </div>
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
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 15, flex: 1 }}>{STAGE_LABELS[key]}</span>
                      <span className="subtle tiny" style={{ fontFamily: 'var(--mono)' }}>
                        {state === 'done' ? 'pronto' : state === 'doing' ? 'em andamento…' : 'aguardando'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {stage === 'extracting' && (
                <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--sage-soft)', borderRadius: 'var(--r-md)', fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  O Gemini está lendo cada linha do exame. Isso pode levar 15–30 segundos por arquivo.
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
            <div className="card-label">vários de uma vez</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.55, margin: '8px 0 0', color: 'var(--ink-2)' }}>
              Selecione quantos PDFs quiser de uma vez. O app processa um por um em sequência, mostrando o progresso de cada arquivo.
            </p>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-label">privacidade</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.55, margin: '8px 0 0', color: 'var(--ink-2)' }}>
              PDFs são enviados ao Gemini apenas para extração dos valores. Os dados ficam <b>salvos localmente</b> no seu navegador.
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
