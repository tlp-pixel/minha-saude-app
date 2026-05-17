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

const EXTRACTION_PROMPT = `Você receberá o texto de um exame laboratorial brasileiro.

Extraia ABSOLUTAMENTE TODOS os biomarcadores e resultados numéricos que aparecerem.
Não pule nenhum — hemograma completo, bioquímica, hormônios, vitaminas, urina, tudo.

Para cada resultado, retorne um objeto JSON com:
- name: nome do exame exatamente como aparece no laudo
- value: valor numérico (número, não string)
- unit: unidade de medida
- refLow: limite inferior da faixa de referência (null se não informado)
- refHigh: limite superior da faixa de referência (null se não informado)
- status: "normal" | "alto" | "baixo" | "indeterminado"
- rawText: trecho original do texto com esse resultado

Retorne SOMENTE um JSON válido neste formato:
{
  "lab": "nome do laboratório",
  "date": "YYYY-MM-DD",
  "patientName": "nome se encontrar, null se não",
  "results": [ { "name": "...", "value": 0, "unit": "...", "refLow": 0, "refHigh": 0, "status": "normal", "rawText": "..." } ]
}

Texto do exame:
`;

export async function extractBiomarkersWithGemini(text) {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) throw new Error('Chave da Gemini API não configurada. Vá em Configurações.');

  const truncatedText = text.slice(0, 12000);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`,
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
  const { lab, date, results } = claudeOutput;

  const normalized = results.map((r, i) => ({
    id: `r${i}`,
    name: r.name,
    value: typeof r.value === 'number' ? r.value : parseFloat(r.value),
    unit: r.unit || '',
    range: (r.refLow != null && r.refHigh != null) ? [r.refLow, r.refHigh] : null,
    status: r.status || 'indeterminado',
    rawText: r.rawText || '',
    unverified: false,
  })).filter(r => !isNaN(r.value));

  const detectedDate = date || new Date().toISOString().slice(0, 10);
  const examId = detectedDate.replace(/-/g, '') + '-' + (lab || 'lab').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);

  return {
    examId,
    date: detectedDate,
    lab: lab || 'Laboratório',
    results: normalized,
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

  onProgress?.('done', 100);
  return parsed;
}
