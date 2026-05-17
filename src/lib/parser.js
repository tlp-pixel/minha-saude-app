import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPDF(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ');
    pages.push(text);
  }
  return { text: pages.join('\n\n'), pages: pdf.numPages };
}

const EXTRACTION_PROMPT = `Você receberá o texto de um exame laboratorial ou laudo de imagem brasileiro.

═══ TAREFA 1 — RESULTADOS NUMÉRICOS ═══
Extraia ABSOLUTAMENTE TODOS os valores numéricos. Não pule nenhum.

── EXAMES LABORATORIAIS ──
VALORES DUPLOS (leucograma): Neutrófilos, Linfócitos, Monócitos, Eosinófilos, Basófilos, Bastões — quando aparecerem % E valor absoluto, extraia os DOIS. Acrescente " %" ou " Abs." ao nome.

NOMES PADRONIZADOS:
• Glicose · Hemoglobina Glicada · Ureia · Creatinina · Insulina · Peptídeo C
• Colesterol Total · HDL Colesterol · LDL Colesterol · VLDL Colesterol · Triglicerídeos
• TSH · T4 Livre · T4 Total · T3 Livre · T3 Total
• Vitamina D · Vitamina B12 · Ácido Fólico · Ferritina · Ferro Sérico · TIBC
• PCR · VHS · PSA Total · PSA Livre
• Para leucograma: "Neutrófilos %" / "Neutrófilos Abs." / "Linfócitos %" / etc.

── LAUDOS DE IMAGEM (USG, tomografia, ressonância, elastografia) ──
Extraia TODAS as medidas numéricas como resultados rastreáveis.
Use o formato de nome: "Órgão [Lado] - Medida" — exemplos:
• Tireoide: "Tireoide Lobo D - Comprimento" / "Tireoide Lobo E - Comprimento" / "Tireoide - Volume Total" / "Istmo - Espessura"
• Nódulo tireoidiano: "Nódulo Tireoide - Tamanho" (mm)
• Útero: "Útero - Comprimento" / "Útero - Largura" / "Útero - Espessura AP"
• Endométrio: "Endométrio - Espessura" (mm)
• Ovários: "Ovário D - Volume" / "Ovário E - Volume" / "Ovário D - Comprimento" / "Folículos Ovário D - Contagem"
• Rins: "Rim D - Comprimento" / "Rim E - Comprimento"
• Fígado: "Fígado - Maior Dimensão"
• Mama: "Nódulo Mama D - Tamanho" (mm)
Inclua a unidade original (cm, mm, mL, etc.) e refLow/refHigh null (USG não tem referência numérica).

CATEGORIA — atribua uma categoria a cada resultado:
hemograma | leucograma | bioquimica | lipideos | glicemico | renal | hepatico | tireoide | hormonios | vitaminas | inflamatorios | urina | usg | outros

═══ TAREFA 2 — CONCLUSÃO DE LAUDOS DE IMAGEM ═══
Se o texto for um laudo de imagem (ultrassom, vulvoscopia, mamografia, colposcopia, tomografia, ressonância, etc.), extraia o campo "conclusions" com o texto COMPLETO da seção "Conclusão", "Impressão Diagnóstica", ou "Achados" do laudo (como aparece no documento).

═══ TAREFA 3 — NÓDULOS DE MAMA ═══
Se o laudo for de mama (mamografia ou ultrassom de mama), extraia um array "nodules". Para cada nódulo:
- side: "direita" | "esquerda" | "bilateral"
- location: texto do quadrante/localização exato como no laudo
- size: número em mm (só o número, null se não informado)
- birads: categoria BI-RADS se mencionada (null se não)
- description: texto descritivo resumido do nódulo

═══ TAREFA 4 — MÉDICO SOLICITANTE ═══
Extraia o campo "doctor" com o nome completo do médico solicitante/responsável (sem CRM, sem títulos como Dr./Dra., sem especialidade). Null se não encontrar.

IMPORTANTE — NÃO extraia como biomarcador:
• CRM, RG, CPF, número de registro profissional
• Números de pedido, protocolo, código de barras, número de laudo
• Datas, endereços, nomes de paciente, convênio, número de carteirinha
• Qualquer campo que não seja um resultado laboratorial ou medição clínica

Formato de resposta — SOMENTE JSON válido, nada mais:
{
  "lab": "nome do laboratório ou clínica",
  "date": "YYYY-MM-DD",
  "patientName": "nome se encontrar, null se não",
  "doctor": "nome do médico solicitante sem CRM, null se não encontrar",
  "conclusions": "texto completo da conclusão/impressão do laudo de imagem, null se não aplicável",
  "nodules": [],
  "results": [
    { "name": "...", "value": 0, "unit": "...", "refLow": 0, "refHigh": 0, "status": "normal", "category": "bioquimica", "rawText": "..." }
  ]
}

Texto do exame:
`;

export async function extractDoctorFromText(text) {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) return null;
  const snippet = text.slice(0, 3000);
  const prompt = `Neste texto de exame laboratorial ou laudo, qual é o nome completo do médico solicitante ou responsável?\nResponda APENAS com o nome (sem CRM, sem "Dr."/"Dra.", sem especialidade).\nSe não encontrar, responda exatamente: null\n\nTexto:\n${snippet}`;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 60 } }) }
    );
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!raw || raw.toLowerCase() === 'null') return null;
    return raw.replace(/^["']|["']$/g, '').trim() || null;
  } catch { return null; }
}

export async function extractBiomarkersWithGemini(text) {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) throw new Error('Chave da Gemini API não configurada. Vá em Configurações.');

  const truncatedText = text.slice(0, 12000);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: EXTRACTION_PROMPT + truncatedText }] }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Gemini API: ${err.error?.message || res.status}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini não retornou resposta.');

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude não retornou JSON válido.');

  return JSON.parse(jsonMatch[0]);
}

export function normalizeResults(claudeOutput) {
  const { lab, date, results, conclusions, nodules, doctor } = claudeOutput;

  const normalized = results.map((r, i) => ({
    id: `r${i}`,
    name: r.name,
    value: typeof r.value === 'number' ? r.value : parseFloat(r.value),
    unit: r.unit || '',
    range: (r.refLow != null && r.refHigh != null) ? [r.refLow, r.refHigh] : null,
    status: r.status || 'indeterminado',
    category: r.category || 'outros',
    rawText: r.rawText || '',
    unverified: false,
  })).filter(r => !isNaN(r.value));

  const detectedDate = date || new Date().toISOString().slice(0, 10);

  return {
    date: detectedDate,
    lab: lab || 'Laboratório',
    doctor: doctor || null,
    results: normalized,
    conclusions: conclusions || null,
    nodules: Array.isArray(nodules) ? nodules : [],
    extractedAt: new Date().toISOString(),
  };
}

export async function parsePDF(file, onProgress) {
  onProgress?.('reading', 10);
  const { text, pages } = await extractTextFromPDF(file);

  onProgress?.('extracting', 40);
  const claudeOutput = await extractBiomarkersWithGemini(text);

  onProgress?.('normalizing', 80);
  const parsed = normalizeResults(claudeOutput);
  parsed.pages = pages;
  parsed.fileName = file.name;
  // Use filename as examId so two exams from the same lab/date never collide
  parsed.examId = file.name.replace(/\.pdf$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

  onProgress?.('done', 100);
  return parsed;
}
