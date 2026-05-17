import { useState } from 'react';
import PageHead from '../components/PageHead';
import { saveConfig, testConnection, isConfigured, exportCSV } from '../lib/github';

export default function ViewSettings() {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-dark') === 'true');
  const [density, setDensity] = useState(() => document.documentElement.getAttribute('data-density') || 'comfortable');

  const [claudeKey, setClaudeKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showClaudeKey, setShowClaudeKey] = useState(false);

  const [ghToken, setGhToken] = useState(() => localStorage.getItem('github_token') || '');
  const [ghOwner, setGhOwner] = useState(() => localStorage.getItem('github_owner') || 'tlp-pixel');
  const [ghRepo, setGhRepo]   = useState(() => localStorage.getItem('github_repo')  || 'minha-saude-app');
  const [showToken, setShowToken] = useState(false);
  const [ghStatus, setGhStatus] = useState(isConfigured() ? 'saved' : 'idle');
  const [ghError, setGhError] = useState('');

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-dark', String(next));
  }

  function applyDensity(d) {
    setDensity(d);
    document.documentElement.setAttribute('data-density', d);
  }

  function saveClaudeKey() {
    localStorage.setItem('gemini_api_key', claudeKey);
  }

  async function connectGitHub() {
    setGhStatus('testing');
    setGhError('');
    saveConfig({ token: ghToken, owner: ghOwner, repo: ghRepo });
    try {
      await testConnection();
      setGhStatus('ok');
    } catch (e) {
      setGhStatus('error');
      setGhError(e.message);
    }
  }

  async function handleExportCSV() {
    try {
      const csv = await exportCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'minha-saude-historico.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Conecte o GitHub primeiro para exportar os dados reais.');
    }
  }

  const ghStatusLabel = {
    idle:    null,
    saved:   { color: 'var(--sage)',    text: '✓ conectado' },
    testing: { color: 'var(--terra-2)', text: 'verificando…' },
    ok:      { color: 'var(--sage)',    text: '✓ conectado com sucesso' },
    error:   { color: 'var(--rust)',    text: '✗ erro' },
  }[ghStatus];

  return (
    <div className="fade-in" style={{ maxWidth: 720 }}>
      <PageHead
        eyebrow="configurações"
        title="<em>Preferências</em>"
        sub="Como o app deve se comportar e onde seus dados ficam guardados."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* GitHub */}
        <div className="card">
          <div className="card-label">armazenamento · github</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 4 }}>usuário</div>
                <input
                  value={ghOwner}
                  onChange={e => setGhOwner(e.target.value)}
                  placeholder="seu-usuario"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--bg-2)', fontSize: 13, fontFamily: 'var(--mono)' }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 4 }}>repositório</div>
                <input
                  value={ghRepo}
                  onChange={e => setGhRepo(e.target.value)}
                  placeholder="minha-saude-dados"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--bg-2)', fontSize: 13, fontFamily: 'var(--mono)' }}
                />
              </div>
            </div>

            <div>
              <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 4 }}>personal access token</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={ghToken}
                  onChange={e => setGhToken(e.target.value)}
                  placeholder="ghp_..."
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--bg-2)', fontSize: 13, fontFamily: 'var(--mono)' }}
                />
                <button className="btn btn--ghost" onClick={() => setShowToken(s => !s)} style={{ flexShrink: 0 }}>
                  {showToken ? 'Ocultar' : 'Mostrar'}
                </button>
                <button
                  className="btn btn--sage"
                  onClick={connectGitHub}
                  disabled={ghStatus === 'testing' || !ghToken || !ghOwner || !ghRepo}
                  style={{ flexShrink: 0 }}
                >
                  {ghStatus === 'testing' ? 'Verificando…' : 'Conectar'}
                </button>
              </div>
            </div>

            {ghStatusLabel && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: ghStatusLabel.color }}>
                {ghStatusLabel.text}
                {ghStatus === 'error' && ghError && ` — ${ghError}`}
              </div>
            )}

            <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
              PDFs e JSONs ficam em <b>{ghOwner}/{ghRepo}</b> (privado). O token fica só no seu navegador.
            </div>
          </div>
        </div>

        {/* Claude API */}
        <div className="card">
          <div className="card-label">chave da gemini api</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <input
              type={showClaudeKey ? 'text' : 'password'}
              value={claudeKey}
              onChange={e => setClaudeKey(e.target.value)}
              placeholder="AIza..."
              style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--bg-2)', fontSize: 13, fontFamily: 'var(--mono)' }}
            />
            <button className="btn btn--ghost" onClick={() => setShowClaudeKey(s => !s)}>
              {showClaudeKey ? 'Ocultar' : 'Mostrar'}
            </button>
            <button className="btn btn--sage" onClick={saveClaudeKey}>Salvar</button>
          </div>
          <div className="subtle tiny" style={{ marginTop: 8, fontFamily: 'var(--mono)' }}>
            Guardada só no seu navegador. Nunca enviada a nenhum servidor.
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

        {/* Exportar */}
        <div className="card">
          <div className="card-label">exportar dados</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>Histórico completo em CSV</div>
              <div className="subtle tiny" style={{ marginTop: 4 }}>
                Uma linha por medição: data, exame, biomarcador, valor, unidade, faixa de referência.
              </div>
            </div>
            <button className="btn btn--ghost" onClick={handleExportCSV}>↓ Baixar CSV</button>
          </div>
        </div>

      </div>
    </div>
  );
}
