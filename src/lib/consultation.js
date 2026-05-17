/**
 * Parses Obsidian-format consultation markdown files.
 *
 * Supports two formats:
 *   1. YAML frontmatter (newer files, 2025+)
 *   2. **Campo:** value + ###### Seção headers (older files, 2022)
 */

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, body: text };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    meta[key] = val;
  }
  return { meta, body: text.slice(match[0].length).trim() };
}

function parseLegacyFields(body) {
  const meta = {};
  const fieldRe = /\*\*([^*]+)\*\*[:\s]+([^\n]+)/g;
  let m;
  while ((m = fieldRe.exec(body)) !== null) {
    meta[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return meta;
}

function extractSections(body) {
  const sections = {};
  const parts = body.split(/^#{3,6}\s+/m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf('\n');
    if (nl === -1) continue;
    const heading = part.slice(0, nl).trim().toLowerCase();
    sections[heading] = part.slice(nl + 1).trim();
  }
  return sections;
}

function guessDate(meta, filename) {
  // Try frontmatter fields
  const candidates = [meta.data, meta.date, meta['data da consulta'], meta['data consulta']];
  for (const c of candidates) {
    if (!c) continue;
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(c)) return c;
    // DD/MM/YYYY
    const m = c.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    // DD-MM-YYYY
    const m2 = c.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
  }
  // Try to parse from filename (e.g. "2022-07-26 Consulta.md")
  const fm = filename?.match(/(\d{4}-\d{2}-\d{2})/);
  if (fm) return fm[1];
  return new Date().toISOString().slice(0, 10);
}

function guessTitle(meta, sections, filename) {
  const t = meta.título || meta.titulo || meta.title || meta.assunto || meta.subject;
  if (t) return t;
  // Try first H1 in body
  const h1 = Object.keys(sections)[0];
  if (h1) return h1.charAt(0).toUpperCase() + h1.slice(1);
  // Fallback to filename without date and extension
  return filename?.replace(/^\d{4}-\d{2}-\d{2}\s*/, '').replace(/\.md$/, '') || 'Consulta';
}

function guessProfessional(meta) {
  return meta.médico || meta.medico || meta.médica || meta.medica ||
    meta.profissional || meta.doctor || meta['nome do médico'] || '';
}

function guessLocation(meta) {
  return meta.local || meta.clínica || meta.clinica || meta.hospital ||
    meta.location || meta.place || '';
}

function guessSpecialty(meta) {
  return meta.especialidade || meta.specialty || meta.area || '';
}

function guessSummary(meta, sections, body) {
  // Prefer explicit summary/resumo fields
  const s = meta.resumo || meta.summary || meta.conclusão || meta.conclusao;
  if (s) return s;
  // Try sections in priority order
  const preferred = ['resumo', 'conclusão', 'conclusao', 'diagnóstico', 'diagnostico',
    'impressão', 'impressao', 'avaliação', 'avaliacao', 'conduta'];
  for (const k of preferred) {
    if (sections[k]) return sections[k].split('\n').slice(0, 3).join(' ').slice(0, 300);
  }
  // Fallback: first non-empty paragraph of body
  const para = body.split(/\n\n/).find(p => p.trim().length > 20);
  return para ? para.trim().slice(0, 300) : '';
}

export function parseConsultation(text, filename) {
  const { meta: frontMeta, body } = parseFrontmatter(text);
  const hasYaml = Object.keys(frontMeta).length > 0;
  const legacyMeta = hasYaml ? {} : parseLegacyFields(body);
  const meta = { ...legacyMeta, ...frontMeta };
  const sections = extractSections(body);

  const date = guessDate(meta, filename);
  const title = guessTitle(meta, sections, filename);
  const professional = guessProfessional(meta);
  const location = guessLocation(meta);
  const specialty = guessSpecialty(meta);
  const summary = guessSummary(meta, sections, body);

  return {
    date,
    title,
    professional,
    location,
    specialty,
    summary,
    sections,
    rawText: text,
    filename: filename || '',
    type: 'consulta',
  };
}

export function parseConsultationFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        resolve(parseConsultation(e.target.result, file.name));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsText(file, 'utf-8');
  });
}

const NARRATIVE_PROMPT = `Você receberá eventos médicos de um dossiê de saúde pessoal em ordem cronológica.

Escreva uma narrativa clínica concisa (3–6 frases), em português, conectando esses eventos: o que foi identificado, como evoluiu, quais procedimentos foram realizados, e qual o estado atual. Seja factual e empático. Não use bullet points.

Eventos:
`;

export async function generateNarrative(events) {
  const apiKey = localStorage.getItem('claude_api_key');
  if (!apiKey) throw new Error('Chave da Claude API não configurada.');

  const eventList = events
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(ev => `${ev.date} — ${ev.title}${ev.detail ? ': ' + ev.detail : ''}`)
    .join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: NARRATIVE_PROMPT + eventList }],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Claude API: ${err.error?.message || res.status}`);
  }

  const data = await res.json();
  return data.content[0].text.trim();
}
