const DB_NAME = 'minha-saude';
const DB_VERSION = 1;
const STORE = 'files';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    let keys, values;
    store.getAllKeys().onsuccess = e => { keys = e.target.result; };
    store.getAll().onsuccess = e => { values = e.target.result; };
    tx.oncomplete = () => {
      const result = {};
      keys.forEach((k, i) => { result[k] = values[i]; });
      resolve(result);
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Drop-in replacements for github.js functions
export function isConfigured() { return true; }
export function saveConfig() {}

export async function readJSON(path) {
  const data = await dbGet(path);
  return data != null ? { data, sha: null } : null;
}

export async function writeJSON(path, data) {
  await dbPut(path, data);
  return { sha: null };
}

export async function loadExamsIndex() {
  return (await dbGet('exames/exams-index.json')) || [];
}

export async function saveExamsIndex(exams) {
  await dbPut('exames/exams-index.json', exams);
}

export async function saveParsedExam(examId, parsed) {
  await dbPut(`exames/parsed/${examId}.json`, parsed);
}

export async function loadParsedExam(examId) {
  return dbGet(`exames/parsed/${examId}.json`);
}

export async function loadBiomarkers() {
  return (await dbGet('exames/biomarkers.json')) || {};
}

export async function saveBiomarkers(biomarkers) {
  await dbPut('exames/biomarkers.json', biomarkers);
}

export function normalizeBioId(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function mergeParsedExamIntoBiomarkers(parsed) {
  const biomarkers = await loadBiomarkers();
  for (const r of parsed.results) {
    if (r.value == null || isNaN(r.value)) continue;
    const bioId = normalizeBioId(r.name);
    if (!biomarkers[bioId]) {
      biomarkers[bioId] = { id: bioId, name: r.name, unit: r.unit, range: r.range, category: r.category || 'outros', measurements: [] };
    }
    const bio = biomarkers[bioId];
    if (r.range && !bio.range) bio.range = r.range;
    if (r.category && bio.category === 'outros') bio.category = r.category;
    const exists = bio.measurements.some(m => m.examId === parsed.examId);
    if (!exists) {
      bio.measurements.push({ date: parsed.date, examId: parsed.examId, value: r.value });
      bio.measurements.sort((a, b) => a.date.localeCompare(b.date));
    }
  }
  await saveBiomarkers(biomarkers);
  return biomarkers;
}

export async function deleteExam(examId) {
  // Remove from index
  const index = await loadExamsIndex();
  await saveExamsIndex(index.filter(e => e.id !== examId));

  // Remove parsed file
  await dbDelete(`exames/parsed/${examId}.json`);

  // Remove measurements from biomarkers
  const biomarkers = await loadBiomarkers();
  for (const bio of Object.values(biomarkers)) {
    bio.measurements = (bio.measurements || []).filter(m => m.examId !== examId);
  }
  // Remove biomarkers that now have no measurements
  const cleaned = Object.fromEntries(
    Object.entries(biomarkers).filter(([, b]) => b.measurements.length > 0)
  );
  await saveBiomarkers(cleaned);
}

const CATEGORY_RULES = [
  [/hemoglobin|hematocrit|eritrocit|hemacia|plaqueta|vcm|hcm|chcm|rdw|reticuloc/i, 'hemograma'],
  [/neutrofil|linfocit|monocit|eosinofil|basofil|leucocit|baston|segmenta/i, 'leucograma'],
  [/colesterol|triglicerid|hdl|ldl|vldl|lipid/i, 'lipideos'],
  [/glicose|glicemia|insulina|hba1c|hemoglobina glicada|peptidio c|peptídeo c/i, 'glicemico'],
  [/creatinin|ureia|uréia|acido uric|ácido úrico|tfg|clearance/i, 'renal'],
  [/tgo|tgp|alt|ast|gama|ggt|fosfatase|bilirrub|albumin|proteina total|globulin/i, 'hepatico'],
  [/tsh|t3|t4|tireoide|tiroxin/i, 'tireoide'],
  [/testosteron|estradiol|progesterona|fsh|lh|prolactin|dhea|cortisol|androstenedion/i, 'hormonios'],
  [/vitamina|ferritin|ferro seric|transferrin|tibc|folato|acido folico|b12|cobalamina|zinco|magnesio/i, 'vitaminas'],
  [/pcr|proteina c|vhs|interleucina|tnf/i, 'inflamatorios'],
  [/urina|densidade urin|ph urin|leuco.*urina|nitrito|proteina.*urina|glicose.*urina/i, 'urina'],
  [/sodio|potassio|cloro|calcio|fosforo|magnesio|bicarbonato/i, 'bioquimica'],
];

export function inferCategory(name) {
  if (!name) return 'outros';
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(name)) return cat;
  }
  return 'outros';
}

export async function migrateBiomarkerCategories() {
  const biomarkers = await loadBiomarkers();
  let changed = false;
  for (const bio of Object.values(biomarkers)) {
    if (!bio.category || bio.category === 'outros') {
      const guessed = inferCategory(bio.name);
      if (guessed !== 'outros') {
        bio.category = guessed;
        changed = true;
      }
    }
  }
  if (changed) await saveBiomarkers(biomarkers);
}

export async function exportCSV() {
  const biomarkers = await loadBiomarkers();
  const rows = ['data,exame_id,biomarcador_id,biomarcador,valor,unidade,ref_min,ref_max'];
  for (const [bioId, bio] of Object.entries(biomarkers)) {
    for (const m of bio.measurements || []) {
      rows.push([
        m.date, m.examId, bioId,
        `"${bio.name}"`, m.value,
        `"${bio.unit}"`, bio.range?.[0] ?? '', bio.range?.[1] ?? '',
      ].join(','));
    }
  }
  return rows.join('\n');
}

export async function exportBackup() {
  const all = await dbGetAll();
  return JSON.stringify(all, null, 2);
}

export async function importBackup(json) {
  const all = JSON.parse(json);
  for (const [key, value] of Object.entries(all)) {
    await dbPut(key, value);
  }
}
