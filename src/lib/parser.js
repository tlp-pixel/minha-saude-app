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

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EXTRACTION_PROMPT = `Você receberá o texto de um exame laboratorial ou laudo de imagem brasileiro.

⚠️ REGRA CRÍTICA — NUNCA INVENTE DADOS:
Extraia SOMENTE valores que existam LITERALMENTE no texto. Jamais fabrique ou infira valores que não estejam explicitamente escritos.

═══ TAREFA 1 — RESULTADOS NUMÉRICOS ═══
Extraia SOMENTE os valores numéricos que estão explicitamente presentes no texto como resultados de exame.

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
• Mama: "Nódulo Mama D [localização] - Dimensão 1" / "Cisto Mama E - Tamanho" (mm). Laudos de mama em prosa (sem tabela) geralmente não têm valores para "results" — use a TAREFA 3 para os nódulos.
Inclua a unidade original (cm, mm, mL, etc.) e refLow/refHigh null (USG não tem referência numérica).

CATEGORIA — atribua uma categoria a cada resultado:
hemograma | leucograma | bioquimica | lipideos | glicemico | renal | hepatico | tireoide | hormonios | vitaminas | inflamatorios | urina | usg | outros

═══ TAREFA 2 — CONCLUSÃO DE LAUDOS DE IMAGEM ═══
Se o texto for um laudo de imagem (ultrassom, vulvoscopia, mamografia, colposcopia, tomografia, ressonância, etc.), extraia o campo "conclusions" com o texto COMPLETO da seção "Conclusão", "Impressão Diagnóstica", ou "Achados" do laudo (como aparece no documento).

═══ TAREFA 3 — NÓDULOS DE MAMA ═══
Se o laudo for de mama (mamografia ou ultrassom de mama), extraia um array "nodules". Cada entrada representa UM nódulo ou cisto individual. Para cada um:
- side: "direita" | "esquerda" | "bilateral"
- location: localização exata como no laudo (ex: "às 3 horas, 3,0 cm do mamilo" / "QSL 10 hs" / "periareolar")
- size: MAIOR dimensão em mm. Se o laudo informar ex. "1,1 x 0,5 x 1,0 cm", o maior valor é 1,1 cm = 11 mm. Converta cm→mm multiplicando por 10. Null se não informado.
- birads: número da categoria BI-RADS se mencionada (ex: 3), null se não
- description: morfologia resumida (ex: "oval, hipoecóico, margens circunscritas")

ATENÇÃO para laudos em prosa: quando o laudo listar nódulos com frases como "- às 3 horas, medindo 1,1 x 0,5 x 1,0 cm" — cada traço/item da lista é um nódulo separado. Preste atenção à separação entre "À esquerda:" e "À direita:" para atribuir o lado correto.

═══ TAREFA 4 — MÉDICO SOLICITANTE ═══
Procure no cabeçalho do documento pelo campo "Solicitante:" ou "Médico Solicitante:" — é quem PEDIU o exame.
Exemplo: "Solicitante: LAURA MOCELLIN TEIXEIRA" → retorne "Laura Mocellin Teixeira"
NÃO retorne quem laudou/assinou: ignore campos "Laudado por", "Laudante", "Responsável Técnico", "Executante".
Sem Dr./Dra., sem CRM. Se não houver campo "Solicitante" explícito no documento, retorne null.

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
`;

export async function extractDoctorFromText(text) {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) return null;
  const snippet = text.slice(0, 3000);
  const prompt = `Neste texto, encontre o campo "Solicitante:" ou "Médico Solicitante:" no cabeçalho — é quem PEDIU o exame.\nExemplo: "Solicitante: LAURA MOCELLIN TEIXEIRA" → responda "Laura Mocellin Teixeira"\nIgnore completamente quem laudou, assinou ou é responsável técnico.\nResponda APENAS com o nome (sem Dr./Dra., sem CRM).\nSe não houver campo "Solicitante" explícito, responda exatamente: null\n\nTexto:\n${snippet}`;
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

export async function extractBiomarkersWithGemini(file) {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) throw new Error('Chave da Gemini API não configurada. Vá em Configurações.');

  const base64 = await fileToBase64(file);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: EXTRACTION_PROMPT },
          { inlineData: { mimeType: 'application/pdf', data: base64 } },
        ]}],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
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
  if (!jsonMatch) throw new Error('Gemini não retornou JSON válido.');

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    // Gemini sometimes writes literal newlines/tabs inside JSON strings (invalid).
    // Walk character-by-character to escape them only while inside a string value.
    const src = jsonMatch[0];
    let out = '';
    let inStr = false;
    let esc = false;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (esc) { out += c; esc = false; continue; }
      if (c === '\\' && inStr) { out += c; esc = true; continue; }
      if (c === '"') { inStr = !inStr; out += c; continue; }
      if (inStr) {
        if (c === '\n') { out += '\\n'; continue; }
        if (c === '\r') { out += '\\r'; continue; }
        if (c === '\t') { out += '\\t'; continue; }
        if (c.charCodeAt(0) < 32) continue; // drop other control chars
      }
      out += c;
    }
    return JSON.parse(out);
  }
}

export function normalizeResults(claudeOutput) {
  const { lab, date, results, conclusions, nodules, doctor } = claudeOutput;

  const normalized = (Array.isArray(results) ? results : []).map((r, i) => ({
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
    nodules: Array.isArray(nodules) ? nodules.map(n => ({
      ...n,
      // Normalize size to mm (Gemini sometimes returns cm despite the prompt)
      size: n.size != null
        ? (n.size < 10 && String(n.size).includes('.') ? Math.round(n.size * 10) : n.size)
        : null,
    })) : [],
    extractedAt: new Date().toISOString(),
  };
}

export async function parsePDF(file, onProgress) {
  onProgress?.('reading', 10);
  const { pages } = await extractTextFromPDF(file);

  onProgress?.('extracting', 40);
  const claudeOutput = await extractBiomarkersWithGemini(file);

  onProgress?.('normalizing', 80);
  const parsed = normalizeResults(claudeOutput);
  parsed.pages = pages;
  parsed.fileName = file.name;
  // Use filename as examId so two exams from the same lab/date never collide
  parsed.examId = file.name.replace(/\.pdf$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

  onProgress?.('done', 100);
  return parsed;
}
