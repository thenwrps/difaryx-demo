import { demoProjects } from './demoProjects';
import { normalizeRegistryProjectId } from './demoProjectRegistry';

export type AnalysisTechnique = 'xrd' | 'xps' | 'ftir' | 'raman';

export type AnalysisStatus =
  | 'draft'
  | 'processing'
  | 'saved'
  | 'completed'
  | 'needs-review'
  | 'error';

export type AnalysisOrigin = 'quick-analysis' | 'project-lab' | 'imported' | 'attached';

export type PipelineStepStatus = 'completed' | 'active' | 'pending' | 'error' | 'skipped';

export interface ProcessingPipelineStep {
  id: string;
  label: string;
  status: PipelineStepStatus;
  timestamp?: string;
  notes?: string;
}

export interface ProcessingParameter {
  id: string;
  label: string;
  value: string;
  unit?: string;
}

export interface ProcessingQualityMetric {
  label: string;
  value: string;
  state: 'good' | 'warning' | 'error' | 'neutral';
}

export interface AnalysisFeature {
  id: string;
  label: string;
  values: Record<string, string>;
}

export interface AnalysisInterpretation {
  quick: string[];
  evidenceContribution: string;
  confidence: string;
  validationImpact: string;
  qualityFlags: string[];
  recommendedNextSteps: string[];
}

export interface ProcessingVersion {
  versionId: string;
  versionLabel: string;
  note: string;
  owner: string;
  timestamp: string;
  pipelineState: string;
  processingParameters: ProcessingParameter[];
  processingPipeline: ProcessingPipelineStep[];
  extractedFeatures: AnalysisFeature[];
  interpretation: AnalysisInterpretation;
  isCurrent: boolean;
}

export interface AnalysisGraphData {
  viewMode: 'raw' | 'processed' | 'raw-vs-processed';
  axisLabel: string;
  yLabel: string;
  markers: Array<{ position: number; intensity: number; label: string }>;
}

export interface AnalysisSession {
  analysisId: string;
  title: string;
  technique: AnalysisTechnique;
  fileName: string;
  fileType: string;
  fileSizeLabel?: string;
  source?: 'quick_analysis' | 'project_lab' | 'imported' | 'attached';
  owner: string;
  createdAt: string;
  updatedAt: string;
  updatedLabel: string;
  origin: AnalysisOrigin;
  projectId?: string;
  projectName?: string;
  status: AnalysisStatus;
  processingState: string;
  processingPipeline: ProcessingPipelineStep[];
  processingParameters: ProcessingParameter[];
  qualityChecks: ProcessingQualityMetric[];
  processingLog: string[];
  graphData: AnalysisGraphData;
  extractedFeatures: AnalysisFeature[];
  interpretation: AnalysisInterpretation;
  notes: string[];
  versions: ProcessingVersion[];
  exportState: {
    result: string;
    report: string;
    graph: string;
    handoff: string;
  };
}

export interface ProjectEvidenceEntry {
  evidenceId: string;
  projectId: string;
  sourceAnalysisId: string;
  technique: AnalysisTechnique;
  fileName: string;
  source: string;
  owner: string;
  attachedAt: string;
  status: AnalysisStatus;
  interpretationSummary: string;
}

export const ANALYSIS_SESSION_STORAGE_KEY = 'difaryx-analysis-sessions-v1';

export const PROJECT_OPTIONS = [
  { id: 'cu-fe2o4-spinel', name: 'CuFe2O4', sample: 'Copper ferrite spinel' },
  { id: 'cufe2o4-sba15', name: 'CuFe2O4/SBA-15', sample: 'CuFe2O4 on SBA-15 support' },
  { id: 'nife2o4', name: 'NiFe2O4', sample: 'Nickel ferrite spinel' },
  { id: 'cofe2o4', name: 'CoFe2O4', sample: 'Cobalt ferrite spinel' },
  { id: 'fe3o4-nanoparticles', name: 'Fe3O4', sample: 'Iron oxide nanoparticles' },
];

export const TECHNIQUE_DEFINITIONS: Record<
  AnalysisTechnique,
  {
    label: string;
    fullName: string;
    useCase: string;
    accent: string;
  }
> = {
  xrd: {
    label: 'XRD',
    fullName: 'X-ray Diffraction',
    useCase: 'Phase, structure, crystallinity, and phase-match evidence.',
    accent: 'blue',
  },
  xps: {
    label: 'XPS',
    fullName: 'X-ray Photoelectron Spectroscopy',
    useCase: 'Surface chemistry, oxidation state, and component fitting.',
    accent: 'indigo',
  },
  ftir: {
    label: 'FTIR',
    fullName: 'Fourier Transform Infrared',
    useCase: 'Functional groups, bonding context, and band assignments.',
    accent: 'rose',
  },
  raman: {
    label: 'Raman',
    fullName: 'Raman Spectroscopy',
    useCase: 'Vibrational modes, local symmetry, and lattice fingerprints.',
    accent: 'emerald',
  },
};

const PIPELINE_LABELS: Record<AnalysisTechnique, string[]> = {
  xrd: [
    'Import / Parse',
    'Baseline Correction',
    'Smoothing',
    'Peak Detection',
    'Peak Fitting',
    'Phase Matching',
    'Refinement Optional',
  ],
  xps: [
    'Import / Parse',
    'Energy Calibration',
    'Background Correction',
    'Region Selection',
    'Peak Fitting',
    'Component Assignment',
    'Oxidation-state Review',
  ],
  ftir: [
    'Import / Parse',
    'Baseline Correction',
    'Smoothing',
    'Band Detection',
    'Band Assignment',
    'Functional Group Review',
  ],
  raman: [
    'Import / Parse',
    'Baseline Correction',
    'Smoothing',
    'Peak Detection',
    'Mode Assignment',
    'Lattice / Symmetry Review',
  ],
};

const PARAMETER_TEMPLATES: Record<AnalysisTechnique, ProcessingParameter[]> = {
  xrd: [
    { id: 'baseline', label: 'Baseline method', value: 'adaptive polynomial' },
    { id: 'wavelength', label: 'lambda / wavelength', value: '1.5406', unit: 'Angstrom' },
    { id: 'smoothing', label: 'Smoothing method', value: 'Savitzky-Golay' },
    { id: 'window', label: 'Smoothing window', value: '11 points' },
    { id: 'threshold', label: 'Peak threshold', value: '0.14 normalized intensity' },
    { id: 'prominence', label: 'Minimum prominence', value: '6.5%' },
    { id: 'fit', label: 'Fit model', value: 'pseudo-Voigt' },
    { id: 'database', label: 'Reference database', value: 'ferrite compact reference set' },
  ],
  xps: [
    { id: 'calibration', label: 'Calibration reference', value: 'C 1s at 284.8 eV' },
    { id: 'background', label: 'Background method', value: 'Shirley' },
    { id: 'fit', label: 'Fitting model', value: 'GL(30)' },
    { id: 'region', label: 'Region selection', value: 'Cu 2p, Fe 2p, O 1s' },
    { id: 'constraints', label: 'Component constraints', value: 'spin-orbit split locked' },
  ],
  ftir: [
    { id: 'baseline', label: 'Baseline method', value: 'rubber-band correction' },
    { id: 'smoothing', label: 'Smoothing', value: '7-point moving window' },
    { id: 'threshold', label: 'Band threshold', value: '3.2% transmittance change' },
    { id: 'library', label: 'Assignment library', value: 'oxide/support functional groups' },
  ],
  raman: [
    { id: 'baseline', label: 'Baseline method', value: 'asymmetric least squares' },
    { id: 'smoothing', label: 'Smoothing', value: 'Savitzky-Golay, 9 points' },
    { id: 'threshold', label: 'Peak threshold', value: '5.0% normalized intensity' },
    { id: 'library', label: 'Mode library', value: 'spinel ferrite mode references' },
  ],
};

const QUALITY_TEMPLATES: Record<AnalysisTechnique, ProcessingQualityMetric[]> = {
  xrd: [
    { label: 'S/N ratio', value: '42:1', state: 'good' },
    { label: 'Baseline deviation', value: '1.8%', state: 'good' },
    { label: 'Peak resolution', value: 'publication-limited', state: 'warning' },
    { label: 'Fit quality', value: 'Rwp 8.4%', state: 'good' },
    { label: 'Parse quality', value: 'complete', state: 'good' },
  ],
  xps: [
    { label: 'S/N ratio', value: '29:1', state: 'good' },
    { label: 'Baseline deviation', value: 'Shirley stable', state: 'good' },
    { label: 'Peak resolution', value: 'fit incomplete', state: 'warning' },
    { label: 'Fit quality', value: 'residual review needed', state: 'warning' },
    { label: 'Parse quality', value: 'complete', state: 'good' },
  ],
  ftir: [
    { label: 'S/N ratio', value: '34:1', state: 'good' },
    { label: 'Baseline deviation', value: '2.6%', state: 'good' },
    { label: 'Peak resolution', value: 'band overlap noted', state: 'warning' },
    { label: 'Fit quality', value: 'not required', state: 'neutral' },
    { label: 'Parse quality', value: 'complete', state: 'good' },
  ],
  raman: [
    { label: 'S/N ratio', value: '31:1', state: 'good' },
    { label: 'Baseline deviation', value: 'fluorescence corrected', state: 'good' },
    { label: 'Peak resolution', value: 'mode separation adequate', state: 'good' },
    { label: 'Fit quality', value: 'mode assignment pending', state: 'warning' },
    { label: 'Parse quality', value: 'complete', state: 'good' },
  ],
};

function pipelineFor(
  technique: AnalysisTechnique,
  activeIndex: number,
  errorIndex = -1,
  skippedIndex = -1,
): ProcessingPipelineStep[] {
  return PIPELINE_LABELS[technique].map((label, index) => ({
    id: `${technique}-${index + 1}`,
    label,
    status:
      index === errorIndex
        ? 'error'
        : index === skippedIndex
          ? 'skipped'
          : index < activeIndex
            ? 'completed'
            : index === activeIndex
              ? 'active'
              : 'pending',
    timestamp: index <= activeIndex ? `2026-05-14T0${Math.min(index + 8, 9)}:12:00.000Z` : undefined,
    notes: index <= activeIndex ? `${label} state preserved in session.` : undefined,
  }));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function version(
  sessionPartial: Pick<
    AnalysisSession,
    'owner' | 'processingParameters' | 'processingPipeline' | 'extractedFeatures' | 'interpretation'
  >,
  versionLabel: string,
  note: string,
  timestamp: string,
  pipelineState: string,
  isCurrent = false,
): ProcessingVersion {
  return {
    versionId: versionLabel.toLowerCase().replace(/\./g, '-'),
    versionLabel,
    note,
    owner: sessionPartial.owner,
    timestamp,
    pipelineState,
    processingParameters: clone(sessionPartial.processingParameters),
    processingPipeline: clone(sessionPartial.processingPipeline),
    extractedFeatures: clone(sessionPartial.extractedFeatures),
    interpretation: clone(sessionPartial.interpretation),
    isCurrent,
  };
}

const XRD_FEATURES: AnalysisFeature[] = [
  {
    id: 'xrd-001',
    label: 'Primary spinel reflection',
    values: {
      '2theta': '35.5',
      'd-spacing': '2.53 A',
      intensity: '100',
      FWHM: '0.21',
      assignment: '(311) CuFe2O4 spinel',
      'match confidence': 'supported',
      'best match': 'CuFe2O4 spinel',
      'matched peaks count': '8 / 9',
      status: 'Refinement pending',
    },
  },
  {
    id: 'xrd-002',
    label: 'Support shoulder',
    values: {
      '2theta': '20.9',
      'd-spacing': '4.25 A',
      intensity: '24',
      FWHM: 'broad',
      assignment: 'SBA-15 amorphous shoulder',
      'match confidence': 'contextual',
      'best match': 'silica support',
      'matched peaks count': 'context',
      status: 'Support context',
    },
  },
  {
    id: 'xrd-003',
    label: 'Secondary ferrite reflection',
    values: {
      '2theta': '43.2',
      'd-spacing': '2.09 A',
      intensity: '52',
      FWHM: '0.24',
      assignment: '(400) CuFe2O4 spinel',
      'match confidence': 'supported',
      'best match': 'CuFe2O4 spinel',
      'matched peaks count': '8 / 9',
      status: 'Matched',
    },
  },
];

const XPS_FEATURES: AnalysisFeature[] = [
  {
    id: 'xps-001',
    label: 'Cu 2p3/2',
    values: {
      region: 'Cu 2p',
      'binding energy': '933.4 eV',
      component: 'Cu2+ envelope',
      'oxidation-state assignment': 'Cu2+ likely',
      'fitting residual': 'review needed',
      confidence: 'validation-limited',
    },
  },
  {
    id: 'xps-002',
    label: 'Fe 2p3/2',
    values: {
      region: 'Fe 2p',
      'binding energy': '710.8 eV',
      component: 'Fe3+ envelope',
      'oxidation-state assignment': 'Fe3+ likely',
      'fitting residual': 'acceptable',
      confidence: 'supported',
    },
  },
];

const FTIR_FEATURES: AnalysisFeature[] = [
  {
    id: 'ftir-001',
    label: 'Si-O-Si support band',
    values: {
      wavenumber: '1084 cm-1',
      intensity: 'strong',
      assignment: 'Si-O-Si asymmetric stretch',
      'functional group': 'silica support',
      confidence: 'supported',
    },
  },
  {
    id: 'ftir-002',
    label: 'Metal-oxygen band',
    values: {
      wavenumber: '620 cm-1',
      intensity: 'medium',
      assignment: 'M-O vibration',
      'functional group': 'ferrite lattice context',
      confidence: 'contextual',
    },
  },
];

const RAMAN_FEATURES: AnalysisFeature[] = [
  {
    id: 'raman-001',
    label: 'A1g spinel mode',
    values: {
      'Raman shift': '690 cm-1',
      intensity: 'strong',
      'mode assignment': 'A1g',
      'lattice/local symmetry note': 'spinel-like local symmetry',
      confidence: 'supported',
    },
  },
  {
    id: 'raman-002',
    label: 'T2g ferrite mode',
    values: {
      'Raman shift': '585 cm-1',
      intensity: 'medium',
      'mode assignment': 'T2g',
      'lattice/local symmetry note': 'ferrite lattice context',
      confidence: 'contextual',
    },
  },
];

function featuresFor(technique: AnalysisTechnique) {
  if (technique === 'xps') return clone(XPS_FEATURES);
  if (technique === 'ftir') return clone(FTIR_FEATURES);
  if (technique === 'raman') return clone(RAMAN_FEATURES);
  return clone(XRD_FEATURES);
}

function interpretationFor(technique: AnalysisTechnique): AnalysisInterpretation {
  if (technique === 'xps') {
    return {
      quick: [
        'Surface scan supports mixed oxide surface chemistry.',
        'Cu and Fe envelopes are visible, but component fitting is not complete.',
        'Oxidation-state evidence remains validation-limited.',
      ],
      evidenceContribution: 'Supports claim: Surface oxidation-state context',
      confidence: 'validation-limited',
      validationImpact: 'reduces surface-state uncertainty after fit review',
      qualityFlags: ['Component residual review needed', 'Charge calibration preserved'],
      recommendedNextSteps: [
        'Complete component fitting for Cu 2p and Fe 2p.',
        'Attach to project for reasoning over surface chemistry gaps.',
        'Compare O 1s support interaction before report handoff.',
      ],
    };
  }

  if (technique === 'ftir') {
    return {
      quick: [
        'Bands indicate silica support and surface hydroxyl context.',
        'Metal-oxygen bands provide supporting ferrite evidence.',
        'Assignment remains incomplete where support bands overlap.',
      ],
      evidenceContribution: 'Supports claim: Bonding / support context',
      confidence: 'supported, assignment-limited',
      validationImpact: 'reduces support-context gap',
      qualityFlags: ['Band overlap near support region', 'Baseline correction preserved'],
      recommendedNextSteps: [
        'Review XRD or Raman for phase evidence.',
        'Attach to project for cross-technique reasoning.',
        'Export band table for notebook evidence.',
      ],
    };
  }

  if (technique === 'raman') {
    return {
      quick: [
        'Mode pattern is consistent with spinel-like local symmetry.',
        'A1g and T2g features are visible after baseline correction.',
        'Intensity is validation-limited for supported samples.',
      ],
      evidenceContribution: 'Supports claim: Local symmetry / vibrational fingerprint',
      confidence: 'supported, validation-limited',
      validationImpact: 'reduces lattice-mode gap',
      qualityFlags: ['Fluorescence baseline corrected', 'Mode assignment pending review'],
      recommendedNextSteps: [
        'Compare with XRD phase assignment.',
        'Attach to project for multi-tech consistency checking.',
        'Send mode evidence to Notebook.',
      ],
    };
  }

  return {
    quick: [
      'Pattern matches CuFe2O4 spinel structure.',
      'Sharp reflections suggest crystallinity.',
      'No obvious secondary phase detected above threshold.',
    ],
    evidenceContribution: 'Supports claim: Phase / Structure',
    confidence: 'supported, validation-limited',
    validationImpact: 'reduces gap G1',
    qualityFlags: ['Refinement still pending', 'Support shoulder preserved as context'],
    recommendedNextSteps: [
      'Review XPS for surface oxidation state.',
      'Optional refinement for publication-level claim.',
      'Attach to project for reasoning.',
    ],
  };
}

function graphFor(technique: AnalysisTechnique): AnalysisGraphData {
  if (technique === 'xps') {
    return {
      viewMode: 'raw-vs-processed',
      axisLabel: 'Binding energy (eV)',
      yLabel: 'Counts (a.u.)',
      markers: [
        { position: 933.4, intensity: 80, label: 'Cu 2p' },
        { position: 710.8, intensity: 92, label: 'Fe 2p' },
      ],
    };
  }
  if (technique === 'ftir') {
    return {
      viewMode: 'raw-vs-processed',
      axisLabel: 'Wavenumber (cm-1)',
      yLabel: 'Transmittance (%)',
      markers: [
        { position: 1084, intensity: 78, label: 'Si-O-Si' },
        { position: 620, intensity: 64, label: 'M-O' },
      ],
    };
  }
  if (technique === 'raman') {
    return {
      viewMode: 'raw-vs-processed',
      axisLabel: 'Raman shift (cm-1)',
      yLabel: 'Intensity (a.u.)',
      markers: [
        { position: 585, intensity: 64, label: 'T2g' },
        { position: 690, intensity: 96, label: 'A1g' },
      ],
    };
  }
  return {
    viewMode: 'raw-vs-processed',
    axisLabel: '2theta (deg)',
    yLabel: 'Intensity (a.u.)',
    markers: [
      { position: 20.9, intensity: 24, label: 'SBA shoulder' },
      { position: 35.5, intensity: 100, label: 'CuFe2O4 (311)' },
      { position: 43.2, intensity: 52, label: 'CuFe2O4 (400)' },
    ],
  };
}

function baseSession(input: {
  analysisId: string;
  title: string;
  technique: AnalysisTechnique;
  fileName: string;
  fileType: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  updatedLabel: string;
  origin: AnalysisOrigin;
  projectId?: string;
  projectName?: string;
  status: AnalysisStatus;
  processingState: string;
  activeStep: number;
  log: string[];
  notes?: string[];
}): AnalysisSession {
  const processingPipeline = pipelineFor(input.technique, input.activeStep);
  const processingParameters = clone(PARAMETER_TEMPLATES[input.technique]);
  const extractedFeatures = featuresFor(input.technique);
  const interpretation = interpretationFor(input.technique);
  const sessionCore = {
    owner: input.owner,
    processingParameters,
    processingPipeline,
    extractedFeatures,
    interpretation,
  };
  const versions = [
    version(sessionCore, 'v1.0', 'raw import', input.createdAt, 'raw uploaded'),
    version(sessionCore, 'v1.1', 'initial peak detection', input.createdAt, 'peaks extracted'),
    version(sessionCore, 'v1.2', 'refined baseline', input.updatedAt, 'through peak detection'),
    version(sessionCore, 'v1.3 current', 'adjusted threshold and refit current', input.updatedAt, 'all steps complete', true),
  ];

  return {
    ...input,
    processingPipeline,
    processingParameters,
    qualityChecks: clone(QUALITY_TEMPLATES[input.technique]),
    processingLog: input.log,
    graphData: graphFor(input.technique),
    extractedFeatures,
    interpretation,
    notes: input.notes ?? [
      'Session preserves raw reference, graph state, processing parameters, extracted features, and handoff state.',
    ],
    versions,
    exportState: {
      result: 'processed data and table CSV ready',
      report: 'PDF, DOCX, and Markdown report handoff available',
      graph: 'PNG available; SVG support shown as export option',
      handoff: 'Notebook and Agent handoff available',
    },
  };
}

export const seedAnalysisSessions: AnalysisSession[] = [
  baseSession({
    analysisId: 'ANL-2024-000123',
    title: 'CuFe2O4/SBA-15 XRD analysis',
    technique: 'xrd',
    fileName: 'CuFe2O4_SBA15_XRD_001.xy',
    fileType: '.xy',
    owner: 'Worapol',
    createdAt: '2026-05-14T01:20:00.000Z',
    updatedAt: '2026-05-14T07:15:00.000Z',
    updatedLabel: '2h ago',
    origin: 'project-lab',
    projectId: 'cufe2o4-sba15',
    projectName: 'CuFe2O4/SBA-15',
    status: 'saved',
    processingState: 'Peaks OK / Match OK / Refinement pending',
    activeStep: 5,
    log: [
      'File parsed',
      'Baseline applied',
      'Smoothing applied',
      'Peak detection started',
      'Parameters changed',
      'Autosaved',
    ],
    notes: [
      'SBA-15 support shoulder retained as context.',
      'Refinement is pending before publication-level claim.',
    ],
  }),
  baseSession({
    analysisId: 'ANL-2024-000124',
    title: 'Unknown sample FTIR draft',
    technique: 'ftir',
    fileName: 'unknown_sample_ftir.csv',
    fileType: '.csv',
    owner: 'Worapol',
    createdAt: '2026-05-13T10:05:00.000Z',
    updatedAt: '2026-05-13T13:18:00.000Z',
    updatedLabel: 'yesterday',
    origin: 'quick-analysis',
    status: 'draft',
    processingState: 'Bands detected - assignment incomplete',
    activeStep: 4,
    log: ['File parsed', 'Baseline applied', 'Smoothing applied', 'Band detection started', 'Autosaved'],
  }),
  baseSession({
    analysisId: 'ANL-2024-000125',
    title: 'CuFe2O4 Spinel Raman mode review',
    technique: 'raman',
    fileName: 'CuFe2O4_Spinel_raman_01.txt',
    fileType: '.txt',
    owner: 'Netnapong',
    createdAt: '2026-05-14T02:10:00.000Z',
    updatedAt: '2026-05-14T05:22:00.000Z',
    updatedLabel: '4h ago',
    origin: 'project-lab',
    projectId: 'cu-fe2o4-spinel',
    projectName: 'CuFe2O4 Spinel',
    status: 'saved',
    processingState: 'Peaks / Modes / Assignment',
    activeStep: 4,
    log: ['File parsed', 'Baseline applied', 'Peak detection started', 'Mode assignment preserved', 'Autosaved'],
  }),
  baseSession({
    analysisId: 'ANL-2024-000126',
    title: 'NiFe2O4 surface scan XPS',
    technique: 'xps',
    fileName: 'surface_scan_001.csv',
    fileType: '.csv',
    owner: 'teammate',
    createdAt: '2026-05-14T00:40:00.000Z',
    updatedAt: '2026-05-14T04:12:00.000Z',
    updatedLabel: '5h ago',
    origin: 'project-lab',
    projectId: 'nife2o4',
    projectName: 'NiFe2O4 Project',
    status: 'needs-review',
    processingState: 'Fit incomplete - oxidation-state review needed',
    activeStep: 4,
    log: ['File parsed', 'Energy calibration applied', 'Background applied', 'Peak fitting started', 'Autosaved'],
  }),
  baseSession({
    analysisId: 'ANL-2024-000127',
    title: 'Catalyst after run XRD draft',
    technique: 'xrd',
    fileName: 'catalyst_after_run.raw',
    fileType: '.raw',
    owner: 'Worapol',
    createdAt: '2026-05-12T09:00:00.000Z',
    updatedAt: '2026-05-12T12:25:00.000Z',
    updatedLabel: '2d ago',
    origin: 'quick-analysis',
    status: 'draft',
    processingState: 'Raw uploaded',
    activeStep: 0,
    log: ['Raw file uploaded', 'Awaiting parse confirmation', 'Autosaved'],
  }),
];

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredSessions(): AnalysisSession[] | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(ANALYSIS_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnalysisSession[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredSessions(sessions: AnalysisSession[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ANALYSIS_SESSION_STORAGE_KEY, JSON.stringify(sessions));
}

export function getAnalysisSessions(): AnalysisSession[] {
  const stored = readStoredSessions();
  if (!stored || stored.length === 0) return clone(seedAnalysisSessions);
  const seedIds = new Set(stored.map((session) => session.analysisId));
  const missingSeeds = seedAnalysisSessions.filter((session) => !seedIds.has(session.analysisId));
  return [...stored, ...clone(missingSeeds)];
}

export function getAnalysisSession(analysisId: string | undefined): AnalysisSession | null {
  if (!analysisId) return null;
  return getAnalysisSessions().find((session) => session.analysisId === analysisId) ?? null;
}

export function saveAnalysisSession(session: AnalysisSession): AnalysisSession {
  const sessions = getAnalysisSessions();
  const nextSession = {
    ...session,
    updatedAt: new Date().toISOString(),
    updatedLabel: 'just now',
  };
  const next = sessions.some((item) => item.analysisId === nextSession.analysisId)
    ? sessions.map((item) => (item.analysisId === nextSession.analysisId ? nextSession : item))
    : [nextSession, ...sessions];
  writeStoredSessions(next);
  return nextSession;
}

export function createAnalysisSession(technique: AnalysisTechnique, fileName = `new_${technique}_analysis.csv`) {
  const sessions = getAnalysisSessions();
  const maxIdNumber = sessions.reduce((max, session) => {
    const numeric = Number(session.analysisId.replace('ANL-2024-', ''));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 127);
  const id = `ANL-2024-${String(maxIdNumber + 1).padStart(6, '0')}`;
  const fileTypeMatch = fileName.match(/\.[a-z0-9]+$/i);
  const session = baseSession({
    analysisId: id,
    title: `${TECHNIQUE_DEFINITIONS[technique].label} analysis - ${fileName}`,
    technique,
    fileName,
    fileType: fileTypeMatch ? fileTypeMatch[0].toLowerCase() : '.csv',
    owner: 'Worapol',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedLabel: 'just now',
    origin: 'quick-analysis',
    status: 'processing',
    processingState: 'Raw uploaded / Parsed',
    activeStep: 1,
    log: ['File parsed', 'Processing workspace opened', 'Autosaved'],
  });
  writeStoredSessions([session, ...sessions]);
  return session;
}

export function inferTechniqueFromFile(fileName: string): AnalysisTechnique | null {
  const lower = fileName.toLowerCase();
  if (lower.includes('xps') || lower.endsWith('.xps')) return 'xps';
  if (lower.includes('ftir') || lower.includes('ir_')) return 'ftir';
  if (lower.includes('raman')) return 'raman';
  if (lower.includes('xrd') || lower.endsWith('.xy') || lower.endsWith('.raw')) return 'xrd';
  return null;
}

export function updateSessionProject(analysisId: string, projectId: string, projectName: string) {
  const session = getAnalysisSession(analysisId);
  if (!session) return null;
  return saveAnalysisSession({
    ...session,
    projectId,
    projectName,
    status: session.status === 'draft' ? 'saved' : session.status,
    processingLog: [`Attached to ${projectName}`, ...session.processingLog],
  });
}

export function saveCurrentAnalysisVersion(analysisId: string, note = 'saved current session') {
  const session = getAnalysisSession(analysisId);
  if (!session) return null;
  const currentNumber = session.versions.length + 1;
  const newVersion = version(
    session,
    `v1.${currentNumber}`,
    note,
    new Date().toISOString(),
    session.processingState,
    true,
  );
  const updated = saveAnalysisSession({
    ...session,
    status: 'saved',
    versions: [
      newVersion,
      ...session.versions.map((item) => ({ ...item, isCurrent: false })),
    ],
    processingLog: [`Saved ${newVersion.versionLabel}`, ...session.processingLog],
  });
  return updated;
}

export function restoreAnalysisVersion(analysisId: string, versionId: string) {
  const session = getAnalysisSession(analysisId);
  const target = session?.versions.find((item) => item.versionId === versionId);
  if (!session || !target) return null;
  return saveAnalysisSession({
    ...session,
    processingParameters: clone(target.processingParameters),
    processingPipeline: clone(target.processingPipeline),
    extractedFeatures: clone(target.extractedFeatures),
    interpretation: clone(target.interpretation),
    processingState: target.pipelineState,
    versions: session.versions.map((item) => ({ ...item, isCurrent: item.versionId === versionId })),
    processingLog: [`Restored ${target.versionLabel}`, ...session.processingLog],
  });
}

const baseProjectEvidence: ProjectEvidenceEntry[] = [
  {
    evidenceId: 'evidence-cufe-xrd',
    projectId: 'cufe2o4-sba15',
    sourceAnalysisId: 'ANL-2024-000123',
    technique: 'xrd',
    fileName: 'CuFe2O4_SBA15_XRD_001.xy',
    source: 'Analysis Workspace',
    attachedAt: 'May 14, 07:15',
    owner: 'Worapol',
    status: 'saved',
    interpretationSummary: 'CuFe2O4 spinel reflections remain visible above the SBA-15 support background.',
  },
  {
    evidenceId: 'evidence-cufe-xps',
    projectId: 'cufe2o4-sba15',
    sourceAnalysisId: 'ANL-2024-000126',
    technique: 'xps',
    fileName: 'surface_scan_001.csv',
    source: 'Project Lab',
    attachedAt: 'May 14, 04:12',
    owner: 'teammate',
    status: 'needs-review',
    interpretationSummary: 'Surface oxidation-state review remains open after component fitting.',
  },
  {
    evidenceId: 'evidence-cufe-ftir',
    projectId: 'cufe2o4-sba15',
    sourceAnalysisId: 'ANL-2024-000124',
    technique: 'ftir',
    fileName: 'ftir_surface_chem_001.csv',
    source: 'Analysis Workspace',
    attachedAt: 'May 13, 13:18',
    owner: 'Worapol',
    status: 'saved',
    interpretationSummary: 'Si-O-Si and metal-oxygen bands provide support and bonding context.',
  },
];

function toAnalysisTechnique(technique: string): AnalysisTechnique | null {
  const normalized = technique.toLowerCase();
  if (normalized === 'xrd' || normalized === 'xps' || normalized === 'ftir' || normalized === 'raman') {
    return normalized;
  }
  return null;
}

function getRegistryEvidenceEntries(projectId: string): ProjectEvidenceEntry[] {
  const project = demoProjects.find((candidate) => candidate.id === projectId);
  if (!project) return [];

  return project.evidenceSources
    .map<ProjectEvidenceEntry | null>((source) => {
      const technique = toAnalysisTechnique(source.technique);
      if (!technique || !source.available) return null;
      return {
        evidenceId: `evidence-${project.id}-${technique}`,
        projectId: project.id,
        sourceAnalysisId: `registry-${project.id}-${technique}`,
        technique,
        fileName: source.datasetLabel,
        source: 'Preloaded Evidence Bundle',
        attachedAt: project.lastUpdated,
        owner: 'DIFARYX demo',
        status: project.reportReadiness.exportReady ? 'saved' : 'needs-review',
        interpretationSummary: source.description,
      };
    })
    .filter((entry): entry is ProjectEvidenceEntry => Boolean(entry));
}

export function getProjectEvidenceEntries(projectId: string | undefined): ProjectEvidenceEntry[] {
  const normalizedProjectId = normalizeRegistryProjectId(projectId) ?? projectId;
  if (!normalizedProjectId) return [];
  const sessionEvidence = getAnalysisSessions()
    .filter((session) => session.projectId === normalizedProjectId)
    .map<ProjectEvidenceEntry>((session) => ({
      evidenceId: `evidence-${session.analysisId}`,
      projectId: normalizedProjectId,
      sourceAnalysisId: session.analysisId,
      technique: session.technique,
      fileName: session.fileName,
      source: session.origin === 'project-lab' ? 'Project Lab' : 'Analysis Workspace',
      attachedAt: session.updatedLabel,
      owner: session.owner,
      status: session.status,
      interpretationSummary: session.interpretation.quick[0],
    }));

  const keyed = new Map<string, ProjectEvidenceEntry>();
  [...baseProjectEvidence, ...getRegistryEvidenceEntries(normalizedProjectId), ...sessionEvidence]
    .filter((entry) => entry.projectId === normalizedProjectId)
    .forEach((entry) => keyed.set(`${entry.sourceAnalysisId}-${entry.fileName}`, entry));
  return Array.from(keyed.values());
}

export function getStatusLabel(status: AnalysisStatus) {
  if (status === 'needs-review') return 'Needs Review';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getOriginLabel(origin: AnalysisOrigin) {
  if (origin === 'quick-analysis') return 'Quick Analysis';
  if (origin === 'project-lab') return 'Project Lab';
  if (origin === 'attached') return 'Attached';
  return 'Imported';
}
