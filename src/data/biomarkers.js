export const EXAM_DATES = [
  '2024-07-12', '2024-11-03', '2025-02-18', '2025-06-04', '2025-10-22', '2026-04-09'
];

export const EXAMS = [
  { id: 'e6', date: '2026-04-09', lab: 'Lab. Fleury',  type: 'Check-up completo',                  pages: 14, status: 'parsed' },
  { id: 'e5', date: '2025-10-22', lab: 'Lab. Sabin',   type: 'Hemograma + Lipidograma + Tireoide', pages: 7,  status: 'parsed' },
  { id: 'e4', date: '2025-06-04', lab: 'Hosp. Sírio',  type: 'Check-up anual',                     pages: 16, status: 'parsed' },
  { id: 'e3', date: '2025-02-18', lab: 'Lab. Fleury',  type: 'Tireoide + Vitaminas + Hormônios',   pages: 5,  status: 'parsed' },
  { id: 'e2', date: '2024-11-03', lab: 'Lab. DASA',    type: 'Glicêmico + Renal + Hepática',       pages: 6,  status: 'parsed' },
  { id: 'e1', date: '2024-07-12', lab: 'Lab. Sabin',   type: 'Hemograma + Bioquímica básica',      pages: 8,  status: 'parsed' },
];

export const BIOMARKERS = [
  // ── Hemograma — eritrograma ──
  { id: 'hem',   name: 'Hemácias',           unit: 'milhões/µL', range: [4.5, 5.9],     cat: 'hemograma',     values: [4.92, 4.88, 4.95, 5.01, 4.98, 5.04], trend: 'stable' },
  { id: 'hb',    name: 'Hemoglobina',        unit: 'g/dL',       range: [13.5, 17.5],   cat: 'hemograma',     values: [14.8, 15.1, 14.9, 15.0, 15.2, 15.0], trend: 'stable' },
  { id: 'ht',    name: 'Hematócrito',        unit: '%',          range: [40, 50],        cat: 'hemograma',     values: [44, 45, 44.5, 45.2, 45.8, 45.4],     trend: 'stable' },
  { id: 'vcm',   name: 'VCM',                unit: 'fL',         range: [80, 100],       cat: 'hemograma',     values: [89.4, 90.2, 89.8, 90.5, 91.0, 90.7], trend: 'stable' },
  { id: 'hcm',   name: 'HCM',                unit: 'pg',         range: [27, 33],        cat: 'hemograma',     values: [30.1, 30.5, 30.2, 30.4, 30.7, 30.5], trend: 'stable' },
  { id: 'chcm',  name: 'CHCM',               unit: 'g/dL',       range: [32, 36],        cat: 'hemograma',     values: [33.6, 33.8, 33.7, 33.5, 33.7, 33.6], trend: 'stable' },
  { id: 'rdw',   name: 'RDW',                unit: '%',          range: [11.5, 14.5],    cat: 'hemograma',     values: [12.8, 13.0, 13.1, 12.9, 12.8, 12.7], trend: 'stable' },
  // ── Hemograma — leucograma ──
  { id: 'leu',   name: 'Leucócitos totais',  unit: '/mm³',       range: [4000, 10000],   cat: 'hemograma',     values: [6800, 7100, 6500, 6900, 7200, 6700], trend: 'stable' },
  { id: 'neu',   name: 'Neutrófilos',        unit: '/mm³',       range: [1800, 7000],    cat: 'hemograma',     values: [3800, 4100, 3600, 4000, 4200, 3900], trend: 'stable' },
  { id: 'lin',   name: 'Linfócitos',         unit: '/mm³',       range: [1000, 4000],    cat: 'hemograma',     values: [2200, 2300, 2100, 2150, 2200, 2050], trend: 'stable' },
  { id: 'mon',   name: 'Monócitos',          unit: '/mm³',       range: [200, 900],      cat: 'hemograma',     values: [480, 520, 450, 490, 510, 470],       trend: 'stable' },
  { id: 'eos',   name: 'Eosinófilos',        unit: '/mm³',       range: [40, 500],       cat: 'hemograma',     values: [180, 220, 280, 210, 240, 200],       trend: 'stable' },
  // ── Hemograma — plaquetas ──
  { id: 'plaq',  name: 'Plaquetas',          unit: '/mm³',       range: [150000, 450000],cat: 'hemograma',     values: [240000, 252000, 248000, 261000, 258000, 255000], trend: 'stable' },
  { id: 'vpm',   name: 'VPM',                unit: 'fL',         range: [7.5, 11.5],     cat: 'hemograma',     values: [9.2, 9.4, 9.1, 9.3, 9.2, 9.0],      trend: 'stable' },

  // ── Lipidograma ──
  { id: 'colt',  name: 'Colesterol total',   unit: 'mg/dL', range: [0, 190],   cat: 'lipidograma', values: [212, 218, 205, 198, 192, 188],           trend: 'improving' },
  { id: 'ldl',   name: 'LDL',                unit: 'mg/dL', range: [0, 130],   cat: 'lipidograma', values: [142, 148, 135, 128, 122, 118],           trend: 'improving' },
  { id: 'hdl',   name: 'HDL',                unit: 'mg/dL', range: [40, 100],  cat: 'lipidograma', values: [48, 47, 49, 51, 53, 55],                 trend: 'improving' },
  { id: 'vldl',  name: 'VLDL',               unit: 'mg/dL', range: [0, 30],    cat: 'lipidograma', values: [34, 34, 32, 28, 26, 23],                 trend: 'improving' },
  { id: 'nhdl',  name: 'Colesterol não-HDL', unit: 'mg/dL', range: [0, 160],   cat: 'lipidograma', values: [164, 171, 156, 147, 139, 133],           trend: 'improving' },
  { id: 'tri',   name: 'Triglicerídeos',     unit: 'mg/dL', range: [0, 150],   cat: 'lipidograma', values: [168, 172, 158, 142, 128, 115],           trend: 'improving' },
  { id: 'apob',  name: 'Apolipoproteína B',  unit: 'mg/dL', range: [0, 90],    cat: 'lipidograma', values: [null, null, 95, 88, 82, 76],             trend: 'improving' },
  { id: 'lpa',   name: 'Lipoproteína (a)',   unit: 'mg/dL', range: [0, 30],    cat: 'lipidograma', values: [null, null, 22, null, 24, 23],           trend: 'stable' },

  // ── Glicêmico ──
  { id: 'glic',  name: 'Glicemia em jejum',           unit: 'mg/dL',  range: [70, 99],    cat: 'glicemico', values: [98, 102, 105, 103, 101, 99],   trend: 'watch' },
  { id: 'hba1c', name: 'Hemoglobina glicada (HbA1c)', unit: '%',      range: [4.0, 5.6],  cat: 'glicemico', values: [5.5, 5.7, 5.8, 5.7, 5.6, 5.5], trend: 'improving' },
  { id: 'ins',   name: 'Insulina em jejum',           unit: 'µU/mL',  range: [2.6, 24.9], cat: 'glicemico', values: [11.2, 12.5, 13.8, 12.1, 10.5, 9.8], trend: 'improving' },
  { id: 'homa',  name: 'HOMA-IR',                     unit: '',       range: [0, 2.5],    cat: 'glicemico', values: [2.71, 3.14, 3.58, 3.07, 2.62, 2.40], trend: 'improving' },
  { id: 'pep',   name: 'Peptídeo C',                  unit: 'ng/mL',  range: [0.9, 7.1],  cat: 'glicemico', values: [null, 2.4, null, 2.6, null, 2.2], trend: 'stable' },

  // ── Função renal ──
  { id: 'crea',  name: 'Creatinina',      unit: 'mg/dL',          range: [0.7, 1.3],   cat: 'renal', values: [1.0, 1.05, 1.1, 1.08, 1.04, 1.02], trend: 'stable' },
  { id: 'ureia', name: 'Ureia',           unit: 'mg/dL',          range: [10, 50],     cat: 'renal', values: [32, 35, 38, 34, 31, 30],           trend: 'stable' },
  { id: 'tfg',   name: 'TFG estimada',   unit: 'mL/min/1.73m²',  range: [90, 200],    cat: 'renal', values: [95, 92, 89, 91, 94, 96],           trend: 'stable' },
  { id: 'au',    name: 'Ácido úrico',    unit: 'mg/dL',           range: [3.5, 7.2],   cat: 'renal', values: [6.1, 6.4, 6.8, 6.5, 6.0, 5.8],    trend: 'improving' },
  { id: 'malb',  name: 'Microalbuminúria', unit: 'mg/g',          range: [0, 30],      cat: 'renal', values: [null, null, 12, null, 10, 8],       trend: 'stable' },
  { id: 'cist',  name: 'Cistatina C',    unit: 'mg/L',            range: [0.5, 1.0],   cat: 'renal', values: [null, null, null, 0.88, null, 0.85], trend: 'stable' },

  // ── Função hepática ──
  { id: 'tgo',   name: 'TGO (AST)',          unit: 'U/L',   range: [0, 40],    cat: 'hepatica', values: [28, 31, 35, 32, 29, 27], trend: 'stable' },
  { id: 'tgp',   name: 'TGP (ALT)',          unit: 'U/L',   range: [0, 41],    cat: 'hepatica', values: [34, 38, 45, 41, 36, 32], trend: 'improving' },
  { id: 'ggt',   name: 'Gama GT (GGT)',      unit: 'U/L',   range: [0, 60],    cat: 'hepatica', values: [42, 48, 55, 50, 45, 38], trend: 'improving' },
  { id: 'fa',    name: 'Fosfatase alcalina', unit: 'U/L',   range: [40, 130],  cat: 'hepatica', values: [82, 85, 88, 84, 80, 78], trend: 'stable' },
  { id: 'bt',    name: 'Bilirrubina total',  unit: 'mg/dL', range: [0.3, 1.2], cat: 'hepatica', values: [0.7, 0.8, 0.9, 0.8, 0.7, 0.6], trend: 'stable' },
  { id: 'bd',    name: 'Bilirrubina direta', unit: 'mg/dL', range: [0, 0.3],   cat: 'hepatica', values: [0.18, 0.2, 0.22, 0.19, 0.17, 0.16], trend: 'stable' },
  { id: 'alb',   name: 'Albumina',           unit: 'g/dL',  range: [3.5, 5.2], cat: 'hepatica', values: [4.5, 4.4, 4.6, 4.5, 4.6, 4.5], trend: 'stable' },

  // ── Tireoide ──
  { id: 'tsh',   name: 'TSH',       unit: 'µUI/mL', range: [0.4, 4.0], cat: 'tireoide', values: [2.1, 2.4, 2.8, 2.6, 2.3, 2.2],     trend: 'stable' },
  { id: 't4l',   name: 'T4 livre',  unit: 'ng/dL',  range: [0.9, 1.8], cat: 'tireoide', values: [1.2, 1.18, 1.15, 1.21, 1.25, 1.23], trend: 'stable' },
  { id: 't3l',   name: 'T3 livre',  unit: 'pg/mL',  range: [2.3, 4.2], cat: 'tireoide', values: [null, 3.1, 3.0, 3.2, 3.3, 3.2],    trend: 'stable' },
  { id: 'atpo',  name: 'Anti-TPO',  unit: 'UI/mL',  range: [0, 35],    cat: 'tireoide', values: [null, null, 18, null, 22, 24],      trend: 'watch' },

  // ── Vitaminas & minerais ──
  { id: 'vd',    name: 'Vitamina D (25-OH)',        unit: 'ng/mL', range: [30, 100], cat: 'vitaminas', values: [22, 26, 28, 34, 41, 45],          trend: 'improving' },
  { id: 'b12',   name: 'Vitamina B12',              unit: 'pg/mL', range: [200, 900],cat: 'vitaminas', values: [380, 420, 450, 480, 520, 510],      trend: 'improving' },
  { id: 'b9',    name: 'Ácido fólico (B9)',         unit: 'ng/mL', range: [3, 20],   cat: 'vitaminas', values: [null, 8.2, null, 9.5, 10.1, 11.0],  trend: 'improving' },
  { id: 'fer',   name: 'Ferritina',                 unit: 'ng/mL', range: [30, 400], cat: 'vitaminas', values: [125, 138, 145, 152, 160, 158],      trend: 'stable' },
  { id: 'fe',    name: 'Ferro sérico',              unit: 'µg/dL', range: [60, 170], cat: 'vitaminas', values: [98, 105, 112, 108, 115, 110],       trend: 'stable' },
  { id: 'satrf', name: 'Saturação de transferrina', unit: '%',     range: [20, 50],  cat: 'vitaminas', values: [28, 30, 32, 31, 33, 32],            trend: 'stable' },
  { id: 'mg',    name: 'Magnésio',                  unit: 'mg/dL', range: [1.7, 2.5],cat: 'vitaminas', values: [1.9, 1.95, 2.0, 2.05, 2.1, 2.08],  trend: 'stable' },
  { id: 'zn',    name: 'Zinco',                     unit: 'µg/dL', range: [70, 120], cat: 'vitaminas', values: [null, null, 82, null, 88, 92],      trend: 'improving' },

  // ── Hormônios ──
  { id: 'test',  name: 'Testosterona total', unit: 'ng/dL',  range: [264, 916],  cat: 'hormonios', values: [520, 495, 470, 510, 545, 560],      trend: 'improving' },
  { id: 'testl', name: 'Testosterona livre', unit: 'pg/mL',  range: [50, 220],   cat: 'hormonios', values: [null, null, 88, 96, 105, 112],      trend: 'improving' },
  { id: 'shbg',  name: 'SHBG',              unit: 'nmol/L',  range: [10, 57],    cat: 'hormonios', values: [null, null, 32, 30, 28, 27],        trend: 'stable' },
  { id: 'cort',  name: 'Cortisol matinal',  unit: 'µg/dL',   range: [6.2, 19.4], cat: 'hormonios', values: [14.2, 16.8, 18.1, 15.5, 13.2, 12.8], trend: 'improving' },
  { id: 'dheas', name: 'DHEA-S',            unit: 'µg/dL',   range: [89, 457],   cat: 'hormonios', values: [null, 280, null, 295, 310, 305],    trend: 'stable' },
  { id: 'estr',  name: 'Estradiol',         unit: 'pg/mL',   range: [11, 44],    cat: 'hormonios', values: [null, 28, null, 26, 25, 24],        trend: 'stable' },
  { id: 'prol',  name: 'Prolactina',        unit: 'ng/mL',   range: [4, 15.2],   cat: 'hormonios', values: [null, 9.2, 10.1, 9.5, 8.8, 8.4],   trend: 'stable' },
  { id: 'igf1',  name: 'IGF-1',             unit: 'ng/mL',   range: [98, 282],   cat: 'hormonios', values: [null, null, 185, 192, 198, 205],    trend: 'improving' },

  // ── Inflamatórios ──
  { id: 'pcr',   name: 'PCR ultrassensível', unit: 'mg/L',   range: [0, 3.0],   cat: 'inflamatorios', values: [2.1, 2.8, 3.2, 2.5, 1.8, 1.4],  trend: 'improving' },
  { id: 'vhs',   name: 'VHS',               unit: 'mm/h',   range: [0, 15],    cat: 'inflamatorios', values: [9, 11, 13, 10, 7, 6],           trend: 'improving' },
  { id: 'fibr',  name: 'Fibrinogênio',      unit: 'mg/dL',  range: [200, 400], cat: 'inflamatorios', values: [null, 295, 320, 290, 270, 255], trend: 'improving' },
  { id: 'homo',  name: 'Homocisteína',      unit: 'µmol/L', range: [0, 15],    cat: 'inflamatorios', values: [null, null, 11.2, 10.5, 9.8, 9.2], trend: 'improving' },
];

export const CATEGORIES = [
  { id: 'hemograma',     name: 'Hemograma',            desc: 'Eritrograma, leucograma e plaquetas' },
  { id: 'lipidograma',   name: 'Lipidograma',          desc: 'Perfil lipídico completo + ApoB' },
  { id: 'glicemico',     name: 'Glicêmico',            desc: 'Glicemia, HbA1c, insulina, HOMA-IR' },
  { id: 'renal',         name: 'Função renal',         desc: 'Creatinina, ureia, TFG, ácido úrico' },
  { id: 'hepatica',      name: 'Função hepática',      desc: 'TGO, TGP, GGT, bilirrubinas, albumina' },
  { id: 'tireoide',      name: 'Tireoide',             desc: 'TSH, T4/T3 livre, anti-TPO' },
  { id: 'vitaminas',     name: 'Vitaminas & minerais', desc: 'D, B12, B9, ferro, Zn, Mg' },
  { id: 'hormonios',     name: 'Hormônios',            desc: 'Testosterona, cortisol, IGF-1, DHEA-S' },
  { id: 'inflamatorios', name: 'Inflamatórios',        desc: 'PCR-us, VHS, fibrinogênio, homocisteína' },
];

export const INSIGHTS = [
  { id: 'i1', severity: 'positive', title: 'Perfil lipídico em trajetória de melhora consistente', summary: 'LDL caiu de 142 para 118 mg/dL em 22 meses; HDL subiu de 48 para 55. Triglicerídeos saíram da faixa elevada (168) para dentro da meta (115). ApoB acompanhou: 95 → 76.', related: ['ldl', 'hdl', 'tri', 'apob'], since: '2024-07' },
  { id: 'i2', severity: 'positive', title: 'Vitamina D normalizada após suplementação', summary: 'Saiu de deficiência leve (22 ng/mL em jul/24) para 45 ng/mL no último exame. Manter dose atual e revalidar em 6 meses.', related: ['vd'], since: '2024-07' },
  { id: 'i3', severity: 'watch', title: 'Glicemia de jejum no limite superior', summary: 'Glicemia oscilou entre 98–105 nos últimos 22 meses, próxima ao corte de 99. HbA1c estável em 5.5–5.8% e HOMA-IR caindo (3.58 → 2.40). Considerar curva glicêmica no próximo check-up.', related: ['glic', 'hba1c', 'homa', 'ins'], since: '2024-11' },
  { id: 'i4', severity: 'positive', title: 'Inflamação sistêmica reduzindo', summary: 'PCR-us caiu de 3.2 (limite) para 1.4 mg/L. Fibrinogênio e homocisteína acompanharam. Coerente com melhora do perfil lipídico.', related: ['pcr', 'vhs', 'fibr', 'homo'], since: '2025-02' },
  { id: 'i5', severity: 'neutral', title: 'Função hepática voltou ao basal após pico em jun/25', summary: 'TGP atingiu 45 U/L em jun/25 (acima do corte 41), normalizou para 32 no exame mais recente. GGT acompanhou (55 → 38). Sem ação necessária.', related: ['tgp', 'tgo', 'ggt'], since: '2025-06' },
  { id: 'i6', severity: 'watch', title: 'Anti-TPO em elevação lenta', summary: 'Anti-TPO foi de 18 (fev/25) para 24 UI/mL (abr/26), ainda dentro da faixa. TSH e T4 livre estáveis. Acompanhar — pode indicar tireoidite incipiente.', related: ['atpo', 'tsh', 't4l'], since: '2025-02' },
];

export const PATTERNS = [
  { id: 'p1', title: 'Cortisol matinal sobe em janeiro–março', kind: 'sazonal', summary: 'Em 2 das últimas 2 baterias de inverno, cortisol veio acima de 16 µg/dL. Coincide com período de maior carga no trabalho. Considerar marcar exame fora dessa janela ou monitorar sono.', confidence: 0.78, observations: 4, related: ['cort'], sparkline: [14.2, 16.8, 18.1, 15.5, 13.2, 12.8] },
  { id: 'p2', title: 'LDL e PCR-us se movem juntos', kind: 'correlação', summary: 'Correlação positiva (r ≈ 0.91) entre LDL e PCR-us ao longo das 6 medições. Sugere componente inflamatório no perfil lipídico. Quando você baixa um, o outro acompanha.', confidence: 0.91, observations: 6, related: ['ldl', 'pcr'], sparkline: [142, 148, 135, 128, 122, 118] },
  { id: 'p3', title: 'HOMA-IR responde 3 meses depois de mudanças no triglicerídeo', kind: 'lag temporal', summary: 'Toda vez que triglicerídeos caem, HOMA-IR cai no exame seguinte (~4 meses depois). Confirma resistência à insulina como ponta do iceberg metabólica.', confidence: 0.74, observations: 5, related: ['homa', 'tri'], sparkline: [2.71, 3.14, 3.58, 3.07, 2.62, 2.40] },
  { id: 'p4', title: 'Vit. D abaixo de 30 está associada a TSH mais alto', kind: 'correlação', summary: 'Nas 3 medições com vitamina D < 30 ng/mL, TSH médio foi 2.43. Nas 3 medições acima, TSH médio caiu para 2.10. Plausível mas observacional.', confidence: 0.62, observations: 6, related: ['vd', 'tsh'], sparkline: [22, 26, 28, 34, 41, 45] },
  { id: 'p5', title: 'Hemograma é o seu marcador mais estável', kind: 'estabilidade', summary: '14 parâmetros do hemograma com coeficiente de variação < 4% no período. Útil como linha de base para detectar mudanças sutis no futuro.', confidence: 0.95, observations: 6, related: ['hb', 'ht', 'leu', 'plaq'], sparkline: [14.8, 15.1, 14.9, 15.0, 15.2, 15.0] },
];
