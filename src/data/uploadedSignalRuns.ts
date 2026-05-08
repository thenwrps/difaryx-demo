export type Technique = 'XRD' | 'XPS' | 'FTIR' | 'Raman' | 'Unknown';

export type EvidenceQualityState =
  | 'ready'
  | 'needs_mapping'
  | 'insufficient_numeric_data'
  | 'low_signal_variation'
  | 'no_clear_features'
  | 'unsupported_format';

export interface UploadedSignalPoint {
  x: number;
  y: number;
}

export interface TechniqueFeature {
  id: string;
  technique: Technique;
  label: string;
  position: number;
  intensity: number;
  relativeIntensity: number;
  prominence: number;
  context: string;
}

export interface EvidenceQuality {
  state: EvidenceQualityState;
  label: string;
  canInterpret: boolean;
  messages: string[];
}

export interface UploadedLockedContext {
  sampleIdentity: string;
  technique: Technique;
  sourceDataset: string;
  xAxisLabel: string;
  yAxisLabel: string;
  referenceScope: string;
  claimBoundary: string;
  confirmedAt: string;
}

export interface UploadedSignalRun {
  id: string;
  sourceType: 'uploaded';
  fileName: string;
  technique: Technique;
  sampleIdentity: string;
  xAxisLabel: string;
  yAxisLabel: string;
  points: UploadedSignalPoint[];
  extractedFeatures: TechniqueFeature[];
  evidenceQuality: EvidenceQuality;
  claimBoundary: string[];
  lockedContext: UploadedLockedContext;
  createdAt: string;
}

export interface UploadStorageStatus {
  available: boolean;
  corrupted: boolean;
  savedCount: number;
  message: string;
}

export interface ParsedUploadedSignalSuccess {
  ok: true;
  fileName: string;
  format: string;
  points: UploadedSignalPoint[];
  numericRowsData: number[][];
  numericRows: number;
  ignoredRows: number;
  numericColumnCount: number;
  columnMapping: {
    xColumn: number;
    yColumn: number;
    summary: string;
  };
  suggestedTechnique: Technique;
  warnings: string[];
}

export interface ParsedUploadedSignalFailure {
  ok: false;
  fileName: string;
  evidenceQuality: EvidenceQuality;
  error: string;
}

export type ParsedUploadedSignal = ParsedUploadedSignalSuccess | ParsedUploadedSignalFailure;

export const UPLOADED_SIGNAL_RUNS_KEY = 'difaryx.uploadedSignalRuns.v1';

const MAX_PERSISTED_RUNS = 8;
const MAX_PERSISTED_POINTS = 1200;

export const SUPPORTED_UPLOAD_EXTENSIONS = ['csv', 'txt', 'xy', 'dat'] as const;

export const BETA_TECHNIQUES: Technique[] = ['XRD', 'XPS', 'FTIR', 'Raman', 'Unknown'];

export const EVIDENCE_ROLE_BY_TECHNIQUE: Record<Technique, string> = {
  XRD: 'Crystal structure / phase evidence',
  XPS: 'Surface composition / oxidation-state evidence',
  FTIR: 'Bonding / functional-group / support evidence',
  Raman: 'Vibrational fingerprint / local structure',
  Unknown: 'Generic signal inspection only',
};

export const CLAIM_BOUNDARY_BY_TECHNIQUE: Record<Technique, string> = {
  XRD: 'XRD may support phase assignment, but phase purity remains validation-limited.',
  XPS: 'XPS may support surface oxidation-state interpretation when calibrated, but cannot establish bulk phase identity alone.',
  FTIR: 'FTIR may contextualize bonding or support features, but cannot independently establish crystalline phase purity.',
  Raman: 'Raman supports local vibrational consistency, but does not replace crystallographic assignment.',
  Unknown: 'Unknown technique supports feature inspection only; no material-specific claim is generated.',
};

export const FEATURE_TABLE_TITLES: Record<Technique, string> = {
  XRD: 'Detected reflections',
  XPS: 'Detected binding-energy regions',
  FTIR: 'Detected band regions',
  Raman: 'Detected mode regions',
  Unknown: 'Detected signal features',
};

export const AXIS_DEFAULTS_BY_TECHNIQUE: Record<Technique, { xAxisLabel: string; yAxisLabel: string }> = {
  XRD: { xAxisLabel: '2theta (deg)', yAxisLabel: 'Intensity (a.u.)' },
  XPS: { xAxisLabel: 'Binding energy (eV)', yAxisLabel: 'Counts (a.u.)' },
  FTIR: { xAxisLabel: 'Wavenumber (cm^-1)', yAxisLabel: 'Absorbance / transmittance' },
  Raman: { xAxisLabel: 'Raman shift (cm^-1)', yAxisLabel: 'Intensity (a.u.)' },
  Unknown: { xAxisLabel: 'X', yAxisLabel: 'Signal' },
};

export const QUALITY_LABELS: Record<EvidenceQualityState, string> = {
  ready: 'Ready',
  needs_mapping: 'Needs mapping',
  insufficient_numeric_data: 'Insufficient numeric data',
  low_signal_variation: 'Low signal variation',
  no_clear_features: 'No clear features',
  unsupported_format: 'Unsupported format',
};

const BOUNDED_INTERPRETATION_MESSAGE =
  'Interpretation is bounded by current evidence coverage.';

export const INSUFFICIENT_EVIDENCE_MESSAGE =
  'DIFARYX could not generate a bounded interpretation because the uploaded signal does not contain enough detectable evidence under the current beta settings.';

function makeEvidenceQuality(state: EvidenceQualityState, messages: string[]): EvidenceQuality {
  return {
    state,
    label: QUALITY_LABELS[state],
    canInterpret: state === 'ready',
    messages: [BOUNDED_INTERPRETATION_MESSAGE, ...messages],
  };
}

function getExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

function parseNumericToken(token: string): number | null {
  const cleaned = token.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function tokenizeLine(line: string): string[] {
  return line
    .replace(/,/g, ' ')
    .replace(/;/g, ' ')
    .replace(/\t/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function inferTechniqueFromFileName(fileName: string): Technique {
  const lower = fileName.toLowerCase();
  if (/\bxrd\b|diffraction|2theta|2-theta/.test(lower)) return 'XRD';
  if (/\bxps\b|binding|survey|core[-_ ]?level/.test(lower)) return 'XPS';
  if (/\bftir\b|\bir\b|infrared/.test(lower)) return 'FTIR';
  if (/raman|shift/.test(lower)) return 'Raman';
  return 'Unknown';
}

export function parseUploadedSignalText(fileName: string, text: string): ParsedUploadedSignal {
  const extension = getExtension(fileName);

  if (!SUPPORTED_UPLOAD_EXTENSIONS.includes(extension as typeof SUPPORTED_UPLOAD_EXTENSIONS[number])) {
    return {
      ok: false,
      fileName,
      evidenceQuality: makeEvidenceQuality('unsupported_format', [
        'Supported public-beta formats are .csv, .txt, .xy, and .dat.',
      ]),
      error: 'Unsupported file format.',
    };
  }

  const points: UploadedSignalPoint[] = [];
  const numericRowsData: number[][] = [];
  let numericRows = 0;
  let ignoredRows = 0;
  let rowsWithOneNumericColumn = 0;
  let numericColumnCount = 0;

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    if (line.startsWith('#') || line.startsWith('//')) {
      ignoredRows += 1;
      return;
    }

    const numericValues = tokenizeLine(line)
      .map(parseNumericToken)
      .filter((value): value is number => value !== null);

    numericColumnCount = Math.max(numericColumnCount, numericValues.length);

    if (numericValues.length >= 2) {
      const [x, y] = numericValues;
      points.push({ x, y });
      numericRowsData.push(numericValues);
      numericRows += 1;
      return;
    }

    if (numericValues.length === 1) rowsWithOneNumericColumn += 1;
    ignoredRows += 1;
  });

  if (points.length === 0 && rowsWithOneNumericColumn > 0) {
    return {
      ok: false,
      fileName,
      evidenceQuality: makeEvidenceQuality('needs_mapping', [
        'At least two numeric columns are required. Map or export an X column and a Y column before analysis.',
      ]),
      error: 'Only one numeric column was detected.',
    };
  }

  if (points.length === 0) {
    return {
      ok: false,
      fileName,
      evidenceQuality: makeEvidenceQuality('insufficient_numeric_data', [
        'No rows with at least two numeric columns were detected.',
      ]),
      error: 'No usable numeric signal rows were detected.',
    };
  }

  return {
    ok: true,
    fileName,
    format: extension,
    points,
    numericRowsData,
    numericRows,
    ignoredRows,
    numericColumnCount,
    columnMapping: {
      xColumn: 1,
      yColumn: 2,
      summary: 'Using first numeric column as X and second numeric column as Y.',
    },
    suggestedTechnique: inferTechniqueFromFileName(fileName),
    warnings: ignoredRows > 0 ? [`${ignoredRows} header, comment, or nonnumeric row${ignoredRows === 1 ? '' : 's'} ignored.`] : [],
  };
}

function compactSignalPoints(points: UploadedSignalPoint[], limit = MAX_PERSISTED_POINTS) {
  const finitePoints = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (finitePoints.length <= limit) return finitePoints;

  const step = (finitePoints.length - 1) / (limit - 1);
  return Array.from({ length: limit }, (_, index) => finitePoints[Math.round(index * step)]);
}

export function mapUploadedSignalColumns(
  parsed: ParsedUploadedSignalSuccess,
  xColumn: number,
  yColumn: number,
): UploadedSignalPoint[] {
  const xIndex = xColumn - 1;
  const yIndex = yColumn - 1;

  if (xIndex === yIndex || xIndex < 0 || yIndex < 0) return [];

  return parsed.numericRowsData
    .map((row) => {
      const x = row[xIndex];
      const y = row[yIndex];
      return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
    })
    .filter((point): point is UploadedSignalPoint => point !== null);
}

function getFeatureSignal(points: UploadedSignalPoint[], technique: Technique) {
  if (technique !== 'FTIR') return points.map((point) => point.y);

  const yValues = points.map((point) => point.y);
  const maxY = Math.max(...yValues);
  return yValues.map((value) => maxY - value);
}

function getTechniqueContext(technique: Technique, position: number): string {
  if (technique === 'XRD') {
    return 'Reflection candidate; phase assignment requires reference-aware validation.';
  }

  if (technique === 'XPS') {
    const coreRegion =
      position >= 280 && position <= 292 ? 'possible C 1s region' :
      position >= 528 && position <= 535 ? 'possible O 1s region' :
      position >= 705 && position <= 735 ? 'possible Fe 2p region' :
      position >= 925 && position <= 965 ? 'possible Cu 2p region' :
      position >= 99 && position <= 105 ? 'possible Si 2p region' :
      position >= 160 && position <= 170 ? 'possible S 2p region' :
      'binding-energy region';

    return `${coreRegion}; calibration and peak fitting are required before oxidation-state claims.`;
  }

  if (technique === 'FTIR') {
    const bandContext =
      position >= 3200 && position <= 3700 ? 'O-H / N-H stretching context' :
      position >= 2800 && position <= 3100 ? 'C-H stretching context' :
      position >= 1650 && position <= 1800 ? 'carbonyl / adsorbate context' :
      position >= 1500 && position <= 1650 ? 'water bending or aromatic / carbonate context' :
      position >= 900 && position <= 1250 ? 'support, Si-O, or C-O bonding context' :
      position >= 400 && position <= 700 ? 'metal-oxygen or lattice-vibration context' :
      'qualitative functional-group context';

    return `${bandContext}; bonding support remains contextual.`;
  }

  if (technique === 'Raman') {
    const modeContext =
      position >= 100 && position <= 800 ? 'lattice or local-structure mode region' :
      position >= 1300 && position <= 1650 ? 'possible carbon D/G or disorder-related region' :
      'vibrational mode region';

    return `${modeContext}; fluorescence and baseline effects should be reviewed.`;
  }

  return 'Generic local maximum; no material-specific claim is generated.';
}

function getFeatureLabel(technique: Technique, index: number, position: number) {
  const roundedPosition = Number(position.toFixed(2));
  if (technique === 'XRD') return `Reflection ${index + 1} at ${roundedPosition}`;
  if (technique === 'XPS') return `Binding-energy region ${index + 1} at ${roundedPosition} eV`;
  if (technique === 'FTIR') return `Band region ${index + 1} at ${roundedPosition} cm^-1`;
  if (technique === 'Raman') return `Mode region ${index + 1} at ${roundedPosition} cm^-1`;
  return `Signal feature ${index + 1} at ${roundedPosition}`;
}

export function extractTechniqueFeatures(
  points: UploadedSignalPoint[],
  technique: Technique,
  limit = 10,
): TechniqueFeature[] {
  if (points.length < 5) return [];

  const signal = getFeatureSignal(points, technique);
  const minSignal = Math.min(...signal);
  const maxSignal = Math.max(...signal);
  const variation = maxSignal - minSignal;
  if (variation <= 0) return [];

  const candidates: Array<Omit<TechniqueFeature, 'id' | 'label' | 'context'> & { index: number }> = [];
  const windowRadius = Math.max(2, Math.min(8, Math.floor(points.length / 80)));

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = signal[index];
    const previous = signal[index - 1];
    const next = signal[index + 1];
    if (!(current >= previous && current > next)) continue;

    const windowStart = Math.max(0, index - windowRadius);
    const windowEnd = Math.min(points.length - 1, index + windowRadius);
    const localWindow = signal.slice(windowStart, windowEnd + 1);
    const localMinimum = Math.min(...localWindow);
    const prominence = current - localMinimum;
    const relativeIntensity = ((current - minSignal) / variation) * 100;

    if (prominence < variation * 0.03 || relativeIntensity < 8) continue;

    candidates.push({
      index,
      technique,
      position: points[index].x,
      intensity: points[index].y,
      relativeIntensity: Number(relativeIntensity.toFixed(1)),
      prominence: Number(prominence.toFixed(4)),
    });
  }

  const selected: typeof candidates = [];
  const xValues = points.map((point) => point.x);
  const xRange = Math.max(...xValues) - Math.min(...xValues);
  const minSpacing = xRange > 0 ? xRange / 120 : 0;

  candidates
    .sort((a, b) => b.prominence - a.prominence || b.relativeIntensity - a.relativeIntensity)
    .forEach((candidate) => {
      const tooClose = selected.some((feature) => Math.abs(feature.position - candidate.position) < minSpacing);
      if (!tooClose && selected.length < limit) selected.push(candidate);
    });

  return selected
    .sort((a, b) => b.relativeIntensity - a.relativeIntensity)
    .map((feature, index) => ({
      id: `feature-${index + 1}`,
      technique,
      label: getFeatureLabel(technique, index, feature.position),
      position: Number(feature.position.toFixed(4)),
      intensity: Number(feature.intensity.toFixed(4)),
      relativeIntensity: feature.relativeIntensity,
      prominence: feature.prominence,
      context: getTechniqueContext(technique, feature.position),
    }));
}

export function evaluateEvidenceQuality(
  points: UploadedSignalPoint[],
  features: TechniqueFeature[],
): EvidenceQuality {
  if (points.length < 5) {
    return makeEvidenceQuality('insufficient_numeric_data', [
      'At least five numeric X/Y points are required for beta feature extraction.',
    ]);
  }

  const yValues = points.map((point) => point.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const variation = maxY - minY;
  const meanAbs = yValues.reduce((sum, value) => sum + Math.abs(value), 0) / yValues.length || 1;

  if (variation <= Number.EPSILON || variation / meanAbs < 0.01) {
    return makeEvidenceQuality('low_signal_variation', [
      'The uploaded signal varies too little for bounded feature extraction under the beta gate.',
    ]);
  }

  if (features.length === 0) {
    return makeEvidenceQuality('no_clear_features', [
      'No clear peaks, bands, or modes were detected with the current beta settings.',
    ]);
  }

  return makeEvidenceQuality('ready', [
    'Feature extraction is ready for bounded Notebook/Report handoff.',
  ]);
}

export function createUploadedSignalRun(input: {
  fileName: string;
  technique: Technique;
  sampleIdentity: string;
  xAxisLabel: string;
  yAxisLabel: string;
  referenceScope?: string;
  points: UploadedSignalPoint[];
}): UploadedSignalRun {
  const createdAt = new Date().toISOString();
  const extractedFeatures = extractTechniqueFeatures(input.points, input.technique);
  const evidenceQuality = evaluateEvidenceQuality(input.points, extractedFeatures);
  const claimBoundary = [
    CLAIM_BOUNDARY_BY_TECHNIQUE[input.technique],
    BOUNDED_INTERPRETATION_MESSAGE,
  ];
  const safeFileSlug = input.fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'signal';
  const createdAtMs = Date.parse(createdAt);

  return {
    id: `uploaded-${safeFileSlug}-${createdAtMs}`,
    sourceType: 'uploaded',
    fileName: input.fileName,
    technique: input.technique,
    sampleIdentity: input.sampleIdentity.trim(),
    xAxisLabel: input.xAxisLabel.trim(),
    yAxisLabel: input.yAxisLabel.trim(),
    points: input.points,
    extractedFeatures,
    evidenceQuality,
    claimBoundary,
    lockedContext: {
      sampleIdentity: input.sampleIdentity.trim(),
      technique: input.technique,
      sourceDataset: input.fileName,
      xAxisLabel: input.xAxisLabel.trim(),
      yAxisLabel: input.yAxisLabel.trim(),
      referenceScope: input.referenceScope?.trim() || 'User-provided beta upload context',
      claimBoundary: CLAIM_BOUNDARY_BY_TECHNIQUE[input.technique],
      confirmedAt: createdAt,
    },
    createdAt,
  };
}

function isUploadedSignalRun(value: unknown): value is UploadedSignalRun {
  if (!value || typeof value !== 'object') return false;
  const run = value as UploadedSignalRun;

  return (
    run.sourceType === 'uploaded' &&
    typeof run.id === 'string' &&
    typeof run.fileName === 'string' &&
    BETA_TECHNIQUES.includes(run.technique) &&
    typeof run.sampleIdentity === 'string' &&
    Array.isArray(run.points) &&
    Array.isArray(run.claimBoundary) &&
    typeof run.createdAt === 'string'
  );
}

function compactUploadedSignalRunForStorage(run: UploadedSignalRun): UploadedSignalRun {
  return {
    ...run,
    points: compactSignalPoints(run.points),
    extractedFeatures: run.extractedFeatures.slice(0, 12),
  };
}

export function readUploadedSignalRuns(): UploadedSignalRun[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];

  try {
    const raw = window.localStorage.getItem(UPLOADED_SIGNAL_RUNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isUploadedSignalRun)
      .map(compactUploadedSignalRunForStorage)
      .slice(0, MAX_PERSISTED_RUNS);
  } catch {
    return [];
  }
}

export function getUploadedSignalStorageStatus(): UploadStorageStatus {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      available: false,
      corrupted: false,
      savedCount: 0,
      message: 'Browser storage is unavailable; uploaded runs remain in this session only.',
    };
  }

  try {
    const raw = window.localStorage.getItem(UPLOADED_SIGNAL_RUNS_KEY);
    if (!raw) {
      return {
        available: true,
        corrupted: false,
        savedCount: 0,
        message: 'No saved beta uploads yet.',
      };
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return {
        available: true,
        corrupted: true,
        savedCount: 0,
        message: 'Saved beta upload data was not in the expected format and was ignored.',
      };
    }

    const savedCount = parsed.filter(isUploadedSignalRun).length;
    return {
      available: true,
      corrupted: savedCount !== parsed.length,
      savedCount,
      message: savedCount === 0
        ? 'No readable saved beta uploads were found.'
        : `${savedCount} saved beta upload${savedCount === 1 ? '' : 's'} available.`,
    };
  } catch {
    return {
      available: true,
      corrupted: true,
      savedCount: 0,
      message: 'Saved beta uploads could not be read and were ignored for this session.',
    };
  }
}

export function saveUploadedSignalRun(run: UploadedSignalRun): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    const existing = readUploadedSignalRuns();
    const storedRun = compactUploadedSignalRunForStorage(run);
    const next = [storedRun, ...existing.filter((item) => item.id !== storedRun.id)].slice(0, MAX_PERSISTED_RUNS);
    window.localStorage.setItem(UPLOADED_SIGNAL_RUNS_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}
