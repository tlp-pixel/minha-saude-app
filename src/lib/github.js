const BASE = 'https://api.github.com';

function getConfig() {
  return {
    token: localStorage.getItem('github_token') || '',
    owner: localStorage.getItem('github_owner') || '',
    repo:  localStorage.getItem('github_repo')  || '',
  };
}

export function isConfigured() {
  const { token, owner, repo } = getConfig();
  return !!(token && owner && repo);
}

export function saveConfig({ token, owner, repo }) {
  localStorage.setItem('github_token', token);
  localStorage.setItem('github_owner', owner);
  localStorage.setItem('github_repo', repo);
}

function headers() {
  const { token } = getConfig();
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export async function testConnection() {
  const { owner, repo } = getConfig();
  const res = await fetch(`${BASE}/repos/${owner}/${repo}`, { headers: headers() });
  if (!res.ok) throw new Error(`Erro ${res.status}: repositório não encontrado ou token inválido.`);
  return await res.json();
}

export async function readFile(path) {
  const { owner, repo } = getConfig();
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, { headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Erro ao ler ${path}: ${res.status}`);
  const data = await res.json();
  const content = atob(data.content.replace(/\n/g, ''));
  return { content, sha: data.sha };
}

export async function writeFile(path, content, message, sha = null) {
  const { owner, repo } = getConfig();
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Erro ao escrever ${path}: ${err.message}`);
  }
  return await res.json();
}

export async function readJSON(path) {
  const file = await readFile(path);
  if (!file) return null;
  return { data: JSON.parse(file.content), sha: file.sha };
}

export async function writeJSON(path, data, message, sha = null) {
  return writeFile(path, JSON.stringify(data, null, 2), message, sha);
}

export async function listFolder(path) {
  const { owner, repo } = getConfig();
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, { headers: headers() });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Erro ao listar ${path}: ${res.status}`);
  const items = await res.json();
  return Array.isArray(items) ? items : [];
}

export async function uploadPDF(filename, base64Content) {
  const path = `exames/pdfs/${filename}`;
  const existing = await readFile(path);
  return writeFile(
    path,
    base64Content,
    `Upload: ${filename}`,
    existing?.sha ?? null
  );
}

export async function loadExamsIndex() {
  const result = await readJSON('exames/exams-index.json');
  return result ? result.data : [];
}

export async function saveExamsIndex(exams, sha) {
  return writeJSON('exames/exams-index.json', exams, 'Atualiza índice de exames', sha);
}

export async function loadBiomarkers() {
  const result = await readJSON('exames/biomarkers.json');
  return result ? result.data : {};
}

export async function saveBiomarkers(biomarkers, sha) {
  return writeJSON('exames/biomarkers.json', biomarkers, 'Atualiza série temporal de biomarcadores', sha);
}

export async function saveParsedExam(examId, parsed, sha = null) {
  return writeJSON(`exames/parsed/${examId}.json`, parsed, `Parsed: exame ${examId}`, sha);
}

export async function loadParsedExam(examId) {
  const result = await readJSON(`exames/parsed/${examId}.json`);
  return result ? result.data : null;
}

export async function loadConsultations() {
  const result = await readJSON('consultas/index.json');
  return result ? result.data : [];
}

export async function saveConsultation(id, data, sha = null) {
  return writeJSON(`consultas/${id}.json`, data, `Salva consulta: ${id}`, sha);
}

export async function exportCSV() {
  const biomarkers = await loadBiomarkers();
  const rows = ['data,exame_id,biomarcador_id,biomarcador,valor,unidade,ref_min,ref_max'];
  for (const [bioId, bio] of Object.entries(biomarkers)) {
    for (const m of bio.measurements || []) {
      rows.push([
        m.date, m.examId, bioId,
        `"${bio.name}"`, m.value,
        `"${bio.unit}"`, bio.range?.[0] ?? '', bio.range?.[1] ?? ''
      ].join(','));
    }
  }
  return rows.join('\n');
}
