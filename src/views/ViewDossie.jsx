import { useState, useEffect, useRef } from 'react';
import PageHead from '../components/PageHead';
import { parseConsultationFile, generateNarrative } from '../lib/consultation';
import { isConfigured, readJSON, writeJSON } from '../lib/storage';

const DOSSIES_KEY = 'dossies/index.json';
const dossieFile = id => `dossies/${id}.json`;

const TYPE_STYLE = {
  consulta: { bg: 'var(--bg-2)',       border: 'var(--line)',   label: 'Consulta',    pill: '' },
  cirurgia: { bg: 'var(--terra-soft)', border: 'var(--terra)',  label: 'Procedimento',pill: 'pill--terra' },
  exame:    { bg: 'var(--sage-soft)',  border: 'var(--sage)',   label: 'Exame',       pill: 'pill--sage' },
  laudo:    { bg: 'var(--bg-2)',       border: 'var(--line)',   label: 'Laudo',       pill: '' },
};

function Timeline({ events }) {
  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      <div style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 1.5, background: 'var(--line)' }} />
      {sorted.map((ev, i) => {
        const s = TYPE_STYLE[ev.type] || TYPE_STYLE.consulta;
        return (
          <div key={i} style={{ position: 'relative', marginBottom: 20 }}>
            <div style={{
              position: 'absolute', left: -28, top: 16,
              width: 12, height: 12, borderRadius: '50%',
              background: s.border, border: '2px solid var(--bg)',
            }} />
            <div className="card" style={{ background: s.bg, borderColor: 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', marginBottom: 6 }}>
                    {new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.25, marginBottom: 6 }}>{ev.title}</div>
                  {ev.detail && <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{ev.detail}</div>}
                  {ev.professional && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
                      {ev.professional}{ev.location ? ` · ${ev.location}` : ''}
                    </div>
                  )}
                </div>
                <span className={`pill ${s.pill}`} style={{ flexShrink: 0 }}>{s.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NewDossieModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('var(--sage)');
  const COLORS = ['var(--sage)', 'var(--terra)', 'var(--rust)', 'var(--ink-2)'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div className="card" style={{ width: 400, padding: 28 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 20 }}>Novo dossiê</div>
        <div style={{ marginBottom: 14 }}>
          <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 6 }}>nome do dossiê</div>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ex: Ginecologia, Tireóide, Sono…"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--bg-2)', fontSize: 14, fontFamily: 'var(--serif)' }}
          />
        </div>
        <div style={{ marginBottom: 22 }}>
          <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 8 }}>cor</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c,
                border: color === c ? '3px solid var(--ink)' : '2px solid transparent',
              }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--sage" disabled={!name.trim()} onClick={() => onSave(name.trim(), color)}>Criar</button>
        </div>
      </div>
    </div>
  );
}

function NarrativePanel({ events, narrative, onRegenerate, generating }) {
  return (
    <div className="card" style={{ borderStyle: 'dashed', borderColor: 'var(--sage-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--sage)', display: 'grid', placeItems: 'center', color: 'var(--bg)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13 }}>c</div>
        <div className="card-label" style={{ margin: 0 }}>narrativa · claude</div>
      </div>
      {generating ? (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>gerando narrativa…</div>
      ) : narrative ? (
        <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.6, margin: 0, color: 'var(--ink-2)' }}>{narrative}</p>
      ) : (
        <p style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>
          Adicione eventos ao dossiê e gere uma narrativa que conecta toda a história.
        </p>
      )}
      {events.length > 0 && (
        <button className="btn btn--ghost" style={{ marginTop: 14, fontSize: 12 }} onClick={onRegenerate} disabled={generating}>
          {narrative ? 'Regenerar narrativa' : 'Gerar narrativa'}
        </button>
      )}
    </div>
  );
}

function AddPanel({ onAddConsultation, onAddNote }) {
  const fileRef = useRef();
  const [note, setNote] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [showNote, setShowNote] = useState(false);

  return (
    <div className="card card--soft" style={{ marginTop: 16 }}>
      <div className="card-label">adicionar ao dossiê</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        <label className="btn btn--ghost" style={{ justifyContent: 'flex-start', fontSize: 13, cursor: 'pointer' }}>
          ＋ Consulta em markdown (.md)
          <input
            type="file"
            accept=".md,text/markdown,text/plain"
            multiple
            hidden
            ref={fileRef}
            onChange={e => { onAddConsultation([...e.target.files]); e.target.value = ''; }}
          />
        </label>
        <button className="btn btn--ghost" style={{ justifyContent: 'flex-start', fontSize: 13 }} onClick={() => setShowNote(s => !s)}>
          ＋ Anotação manual
        </button>
      </div>

      {showNote && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={noteTitle}
            onChange={e => setNoteTitle(e.target.value)}
            placeholder="Título do evento"
            style={{ padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--bg)', fontSize: 13, fontFamily: 'var(--serif)' }}
          />
          <input
            type="date"
            value={noteDate}
            onChange={e => setNoteDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--bg)', fontSize: 13, fontFamily: 'var(--mono)' }}
          />
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Descrição, observações…"
            rows={3}
            style={{ padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--bg)', fontSize: 13, resize: 'vertical', lineHeight: 1.5, fontFamily: 'var(--serif)' }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn--ghost" style={{ fontSize: 12 }} onClick={() => { setShowNote(false); setNote(''); setNoteTitle(''); }}>Cancelar</button>
            <button
              className="btn btn--sage"
              style={{ fontSize: 12 }}
              disabled={!noteTitle.trim()}
              onClick={() => {
                onAddNote({ type: 'consulta', date: noteDate, title: noteTitle.trim(), detail: note.trim() });
                setShowNote(false); setNote(''); setNoteTitle(''); setNoteDate(new Date().toISOString().slice(0, 10));
              }}
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ViewDossie() {
  const [dossies, setDossies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [narrative, setNarrative] = useState('');
  const [genNarr, setGenNarr] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    loadDossies();
  }, []);

  useEffect(() => {
    if (selected) setNarrative('');
  }, [selected]);

  async function loadDossies() {
    setLoading(true);
    try {
      if (isConfigured()) {
        const res = await readJSON(DOSSIES_KEY);
        setDossies(res?.data || []);
      }
    } catch {
      // no dossies yet
    }
    setLoading(false);
  }

  async function persistDossies(updated) {
    setDossies(updated);
    if (!isConfigured()) return;
    const existing = await readJSON(DOSSIES_KEY);
    await writeJSON(DOSSIES_KEY, updated, 'Atualiza dossiês', existing?.sha ?? null);
  }

  async function persistDossie(dossie) {
    if (!isConfigured()) return;
    const existing = await readJSON(dossieFile(dossie.id));
    await writeJSON(dossieFile(dossie.id), dossie, `Atualiza dossiê: ${dossie.name}`, existing?.sha ?? null);
  }

  async function handleNewDossie(name, color) {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const newDossie = { id, name, color, events: [], narrative: '' };
    const updated = [...dossies, newDossie];
    await persistDossies(updated.map(({ events, narrative, ...d }) => d));
    await persistDossie(newDossie);
    setDossies(updated);
    setShowNew(false);
    setSelected(id);
  }

  function currentDossie() {
    return dossies.find(d => d.id === selected);
  }

  async function addEvents(newEvents) {
    const updated = dossies.map(d => {
      if (d.id !== selected) return d;
      return { ...d, events: [...(d.events || []), ...newEvents] };
    });
    setDossies(updated);
    setSaveStatus('salvando…');
    try {
      const dossie = updated.find(d => d.id === selected);
      await persistDossie(dossie);
      setSaveStatus('salvo');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch {
      setSaveStatus('erro ao salvar');
    }
  }

  async function handleConsultationFiles(files) {
    const events = [];
    for (const file of files) {
      try {
        const parsed = await parseConsultationFile(file);
        events.push({
          type: 'consulta',
          date: parsed.date,
          title: parsed.title + (parsed.professional ? ` · ${parsed.professional}` : ''),
          detail: parsed.summary || '',
          professional: parsed.professional,
          location: parsed.location,
        });
      } catch (e) {
        console.error('Erro ao parsear', file.name, e);
      }
    }
    if (events.length) await addEvents(events);
  }

  async function handleNote(event) {
    await addEvents([event]);
  }

  async function handleGenerateNarrative() {
    const d = currentDossie();
    if (!d?.events?.length) return;
    setGenNarr(true);
    try {
      const text = await generateNarrative(d.events);
      setNarrative(text);
      const updated = dossies.map(x => x.id === selected ? { ...x, narrative: text } : x);
      setDossies(updated);
      await persistDossie({ ...d, narrative: text });
    } catch (e) {
      setNarrative(`Erro: ${e.message}`);
    }
    setGenNarr(false);
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selected) {
    const d = currentDossie();
    if (!d) { setSelected(null); return null; }
    const events = d.events || [];
    const displayNarrative = narrative || d.narrative || '';

    return (
      <div className="fade-in">
        <button className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginBottom: 18 }} onClick={() => setSelected(null)}>
          ← dossiês
        </button>

        <PageHead
          eyebrow={`dossiê · ${events.length} evento${events.length !== 1 ? 's' : ''}`}
          title={`<em>${d.name}</em>`}
          sub="Linha do tempo cronológica de consultas, procedimentos e exames relacionados."
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {saveStatus && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>{saveStatus}</span>}
            </div>
          }
        />

        <div className="grid" style={{ gridTemplateColumns: '1fr 300px', gap: 32 }}>
          <div>
            {events.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 10 }}>Dossiê vazio</div>
                <div style={{ fontSize: 13.5 }}>Use o painel à direita para adicionar consultas ou anotações.</div>
              </div>
            ) : (
              <Timeline events={events} />
            )}
          </div>

          <aside>
            <NarrativePanel
              events={events}
              narrative={displayNarrative}
              onRegenerate={handleGenerateNarrative}
              generating={genNarr}
            />
            <AddPanel
              onAddConsultation={handleConsultationFiles}
              onAddNote={handleNote}
            />
          </aside>
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      {showNew && <NewDossieModal onClose={() => setShowNew(false)} onSave={handleNewDossie} />}

      <PageHead
        eyebrow="saúde · histórico temático"
        title="<em>Dossiês</em>"
        sub="Pastas temáticas que reúnem consultas, laudos e exames de uma mesma área de saúde numa linha do tempo unificada."
        actions={<button className="btn btn--sage" onClick={() => setShowNew(true)}>＋ Novo dossiê</button>}
      />

      {!isConfigured() && (
        <div className="card" style={{ borderColor: 'var(--terra)', borderStyle: 'dashed', marginBottom: 24 }}>
          <div className="card-label" style={{ color: 'var(--terra-2)' }}>atenção</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 15, margin: '6px 0 0', color: 'var(--ink-2)' }}>
            Conecte o GitHub em Configurações para salvar seus dossiês.
            Sem isso, os dados ficam apenas na sessão atual.
          </p>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>carregando…</div>
      ) : (
        <div className="grid grid-2" style={{ marginBottom: 32 }}>
          {dossies.map(d => {
            const events = d.events || [];
            return (
              <button key={d.id} className="card" onClick={() => setSelected(d.id)} style={{ textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${d.color}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1.2 }}>{d.name}</div>
                    <div className="subtle tiny" style={{ fontFamily: 'var(--mono)', marginTop: 2 }}>{events.length} evento{events.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {events.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[...events].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map((ev, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', flexShrink: 0, width: 56 }}>
                          {new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                        </span>
                        <span style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.3, color: 'var(--ink-2)' }}>{ev.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <span className="subtle" style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>Ver linha do tempo →</span>
                </div>
              </button>
            );
          })}

          <button
            onClick={() => setShowNew(true)}
            style={{
              border: '1.5px dashed var(--line-2)', borderRadius: 'var(--r-lg)',
              padding: 22, textAlign: 'center', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              background: 'transparent', transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-2)', display: 'grid', placeItems: 'center', fontSize: 22, color: 'var(--ink-3)' }}>＋</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink-2)' }}>Novo dossiê</div>
            <div className="subtle tiny">Ginecologia · Tireóide · Sono · qualquer tema</div>
          </button>
        </div>
      )}

      <div className="card card--soft">
        <div className="card-label">como funciona</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 12 }}>
          {[
            { step: '01', title: 'Crie um tema', desc: 'Ginecologia, Tireóide, Sono — qualquer área que quiser acompanhar.' },
            { step: '02', title: 'Adicione documentos', desc: 'Consultas em markdown do Obsidian, anotações manuais, laudos.' },
            { step: '03', title: 'Linha do tempo unificada', desc: 'O Claude conecta os eventos e gera uma narrativa do histórico.' },
          ].map(s => (
            <div key={s.step}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)', marginBottom: 8 }}>{s.step}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17, marginBottom: 6 }}>{s.title}</div>
              <div className="subtle" style={{ fontSize: 13.5, lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
