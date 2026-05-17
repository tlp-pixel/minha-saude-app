import { useState } from 'react';
import PageHead from '../components/PageHead';
import { exportCSV, exportBackup, importBackup, clearAllData } from '../lib/storage';

export default function ViewSettings() {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-dark') === 'true');
  const [density, setDensity] = useState(() => document.documentElement.getAttribute('data-density') || 'comfortable');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [clearConfirm, setClearConfirm] = useState('');
  const [clearing, setClearing] = useState(false);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-dark', String(next));
  }

  function applyDensity(d) {
    setDensity(d);
    document.documentElement.setAttribute('data-density', d);
  }

  function saveGeminiKey() {
    localStorage.setItem('gemini_api_key', geminiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  async function handleExportCSV() {
    const csv = await exportCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minha-saude-historico.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleBackup() {
    const json = await exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minha-saude-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRestore(file) {
    setImportStatus('restaurando…');
    try {
      const text = await file.text();
      await importBackup(text);
      setImportStatus('✓ restaurado com sucesso — recarregue a página');
    } catch {
      setImportStatus('erro ao restaurar — verifique o arquivo');
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 720 }}>
      <PageHead
        eyebrow="configurações"
        title="<em>Preferências</em>"
        sub="Chave de API, aparência e backup dos seus dados."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Gemini API */}
        <div className="card">
          <div className="card-label">chave da gemini api</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink-2)', margin: '6px 0 12px', lineHeight: 1.5 }}>
            Necessária para extrair biomarcadores dos PDFs e gerar narrativas nos dossiês. Gratuita em <b>aistudio.google.com</b>.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              placeholder="AIza..."
              style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--bg-2)', fontSize: 13, fontFamily: 'var(--mono)' }}
            />
            <button className="btn btn--ghost" onClick={() => setShowKey(s => !s)}>{showKey ? 'Ocultar' : 'Mostrar'}</button>
            <button className="btn btn--sage" onClick={saveGeminiKey}>{keySaved ? '✓ Salvo' : 'Salvar'}</button>
          </div>
          <div className="subtle tiny" style={{ marginTop: 8, fontFamily: 'var(--mono)' }}>
            Guardada só no seu navegador. Nunca enviada a nenhum servidor nosso.
          </div>
        </div>

        {/* Backup */}
        <div className="card">
          <div className="card-label">backup dos dados</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink-2)', margin: '6px 0 14px', lineHeight: 1.5 }}>
            Seus exames e biomarcadores ficam armazenados neste navegador. Faça backup regularmente e salve no Google Drive para não perder.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn--sage" onClick={handleBackup}>↓ Baixar backup (.json)</button>
            <label className="btn btn--ghost" style={{ cursor: 'pointer' }}>
              ↑ Restaurar backup
              <input type="file" accept=".json" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleRestore(f); e.target.value = ''; }} />
            </label>
          </div>
          {importStatus && (
            <div style={{ marginTop: 12, fontFamily: 'var(--mono)', fontSize: 12, color: importStatus.startsWith('✓') ? 'var(--sage)' : 'var(--rust)' }}>
              {importStatus}
            </div>
          )}
        </div>

        {/* Exportar CSV */}
        <div className="card">
          <div className="card-label">exportar dados</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>Histórico completo em CSV</div>
              <div className="subtle tiny" style={{ marginTop: 4 }}>
                Uma linha por medição: data, biomarcador, valor, unidade, faixa de referência.
              </div>
            </div>
            <button className="btn btn--ghost" onClick={handleExportCSV}>↓ Baixar CSV</button>
          </div>
        </div>

        {/* Limpar dados */}
        <div className="card" style={{ borderColor: 'var(--rust)', borderStyle: 'dashed' }}>
          <div className="card-label" style={{ color: 'var(--rust)' }}>zona de perigo</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink-2)', margin: '6px 0 14px', lineHeight: 1.5 }}>
            Apaga todos os exames, biomarcadores e histórico do navegador. Irreversível — faça backup antes.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={clearConfirm}
              onChange={e => setClearConfirm(e.target.value)}
              placeholder='digite "limpar" para confirmar'
              style={{ padding: '8px 12px', border: '1px solid var(--rust)', borderRadius: 'var(--r-md)', background: 'var(--bg-2)', fontSize: 13, fontFamily: 'var(--mono)', width: 240 }}
            />
            <button
              disabled={clearConfirm !== 'limpar' || clearing}
              onClick={async () => {
                setClearing(true);
                await clearAllData();
                setClearConfirm('');
                setClearing(false);
                window.location.reload();
              }}
              style={{
                padding: '8px 18px', borderRadius: 'var(--r-md)', fontSize: 13, fontFamily: 'var(--mono)',
                background: clearConfirm === 'limpar' ? 'var(--rust)' : 'var(--bg-3)',
                color: clearConfirm === 'limpar' ? 'var(--bg)' : 'var(--ink-3)',
                border: 'none', cursor: clearConfirm === 'limpar' ? 'pointer' : 'default',
                opacity: clearing ? 0.5 : 1,
              }}
            >
              {clearing ? 'limpando…' : 'Limpar tudo'}
            </button>
          </div>
        </div>

        {/* Aparência */}
        <div className="card">
          <div className="card-label">aparência</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>Modo escuro</span>
              <button onClick={toggleDark} style={{
                width: 42, height: 24, borderRadius: 999,
                background: dark ? 'var(--sage)' : 'var(--bg-3)',
                position: 'relative', transition: 'background .2s',
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: dark ? 21 : 3,
                  width: 18, height: 18, borderRadius: '50%', background: 'var(--bg)',
                  transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>Densidade</span>
              <div style={{ display: 'flex', gap: 6, padding: 4, background: 'var(--bg-2)', borderRadius: 999 }}>
                {['comfortable', 'compact'].map(d => (
                  <button key={d} onClick={() => applyDensity(d)} style={{
                    padding: '5px 14px', borderRadius: 999, fontSize: 12, fontFamily: 'var(--mono)',
                    background: density === d ? 'var(--bg)' : 'transparent',
                    color: density === d ? 'var(--ink)' : 'var(--ink-3)',
                  }}>
                    {d === 'comfortable' ? 'Confortável' : 'Compacta'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
