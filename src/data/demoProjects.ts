import type { ExperimentConditionLock } from './experimentConditionLock';

export type Technique = 'XRD' | 'XPS' | 'FTIR' | 'Raman';

export interface DemoPeak {
  position: number;
  intensity: number;
  label: string;
}

export type ClaimStatus = 'strongly_supported' | 'supported' | 'partial' | 'inconclusive' | 'contradicted';

function formatClaimStatusLabel(status: ClaimStatus): string {
  if (status === 'strongly_supported') return 'Supported assignment with validation boundaries';
  if (status === 'supported') return 'Requires validation';
  if (status === 'partial') return 'Validation-limited';
  if (status === 'inconclusive') return 'Publication-limited';
  return 'Claim boundary';
}
export type ValidationState = 'complete' | 'partial' | 'requires_validation';
export type EvidenceRole = 'primary' | 'supporting' | 'context';

export interface DemoHistoryEntry {
  id: string;
  run: string;
  technique: string;
  claimStatus: ClaimStatus;
  status: string;
  date: string;
  action: 'workspace' | 'notebook' | 'agent';
}

export interface DemoProject {
  id: string;
  name: string;
  material: string;
  techniques: Technique[];
  status: string;
  claimStatus: ClaimStatus;
  validationState: ValidationState;
  phase: string;
  lastUpdated: string;
  createdDate: string;
  summary: string;
  xrdPeaks: DemoPeak[];
  evidence: string[];
  recommendations: string[];
  notebook: {
    title: string;
    pipeline: string[];
    peakDetection: string;
    phaseIdentification: string;
  };
  history: DemoHistoryEntry[];
  workspace: 'xrd' | 'multi';
}

export interface AgentRunResult {
  projectId: string;
  projectName: string;
  material: string;
  selectedDatasets: Technique[];
  decision: string;
  claimStatus: ClaimStatus;
  validationState: ValidationState;
  evidence: string[];
  warnings: string[];
  recommendations: string[];
  detectedPeaks: DemoPeak[];
  pipeline: string[];
  generatedAt: string;
  summary: string;
}

export interface SpectrumPoint {
  x: number;
  y: number;
}

export interface DatasetMetadata {
  experimentTitle: string;
  sampleName: string;
  materialSystem: string;
  operator: string;
  date: string;
  notes: string;
}

export interface Evidence {
  id: string;
  technique: Technique;
  datasetId: string;
  claim: string;
  evidenceRole: EvidenceRole;
  support: string;
  limitations?: string;
}

export interface DemoDataset {
  id: string;
  projectId: string;
  technique: Technique;
  fileName: string;
  sampleName: string;
  xLabel: string;
  yLabel: string;
  dataPoints: SpectrumPoint[];
  metadata: DatasetMetadata;
  processingState: {
    imported: boolean;
    baseline: boolean;
    smoothing: boolean;
    normalize: boolean;
    cropMin?: number;
    cropMax?: number;
  };
  detectedFeatures: DemoPeak[];
  evidence: Evidence[];
  savedRuns: string[];
}

export interface DemoExperiment {
  id: string;
  projectId: string;
  title: string;
  sampleName: string;
  materialSystem: string;
  technique: Technique;
  fileName: string;
  operator: string;
  date: string;
  notes: string;
  datasetIds: string[];
  conditionLock?: ExperimentConditionLock;
}

export interface ProcessingRun {
  id: string;
  datasetId: string;
  projectId: string;
  technique: Technique;
  timestamp: string;
  parameters: Record<string, string | number | boolean>;
  outputData: SpectrumPoint[];
  detectedFeatures: DemoPeak[];
  evidence: Evidence[];
  matchResult?: {
    phase: string;
    claimStatus: ClaimStatus;
    matchedPeaks: number;
    missingPeaks: string[];
    unexplainedPeaks: string[];
    caveat: string;
  };
  log: string[];
}

export const DEFAULT_PROJECT_ID = 'cu-fe2o4-spinel';

const LOCAL_EXPERIMENTS_KEY = 'difaryx-demo-experiments';
const LOCAL_DATASETS_KEY = 'difaryx-demo-datasets';
const LOCAL_RUNS_KEY = 'difaryx-demo-processing-runs';
const LOCAL_EVIDENCE_KEY = 'difaryx-demo-evidence';

export const demoProjects: DemoProject[] = [
  {
    id: 'cu-fe2o4-spinel',
    name: 'CuFe₂O₄ Spinel',
    material: 'Copper ferrite spinel',
    techniques: ['XRD', 'Raman'],
    status: 'Report Ready',
    claimStatus: 'strongly_supported',
    validationState: 'complete',
    phase: 'CuFe₂O₄ copper ferrite phase',
    lastUpdated: '2 hours ago',
    createdDate: '2026-04-29',
    summary:
      'XRD analysis identified 9 diffraction peaks. The observed pattern supports CuFe₂O₄ spinel phase assignment, with validation still required before publication-level phase-purity claims.',
    xrdPeaks: [
      { position: 17.1, intensity: 72, label: '(111)' },
      { position: 20.8, intensity: 31, label: '(220)' },
      { position: 25.6, intensity: 25, label: '(311)' },
      { position: 29.7, intensity: 42, label: '(222)' },
      { position: 35.6, intensity: 98, label: '(400)' },
      { position: 36.5, intensity: 51, label: '(422)' },
      { position: 52.4, intensity: 64, label: '(511)' },
      { position: 57.2, intensity: 36, label: '(440)' },
      { position: 61.6, intensity: 44, label: '(533)' },
    ],
    evidence: [
      'XRD reflections near 30.1 deg, 35.5 deg, and 43.2 deg 2theta align with spinel ferrite reference peaks.',
      'Raman A1g/T2g vibrational features support local spinel symmetry.',
      'Peak width and unresolved weak reflections indicate validation is still required before phase-purity claims.',
    ],
    recommendations: [
      'Review notebook synthesis conditions before export.',
      'Run multi-tech correlation if surface oxidation state needs confirmation.',
    ],
    notebook: {
      title: 'Exp-042: CuFe₂O₄ Spinel Phase Confirmation',
      pipeline: [
        'Imported XRD scan and normalized intensity baseline.',
        'Detected local maxima and filtered instrument noise.',
        'Matched observed reflections against ferrite reference phases.',
        'Generated evidence-linked phase interpretation.',
      ],
      peakDetection:
        '9 diffraction peaks detected across 17.1-61.6 degrees 2theta after baseline correction.',
      phaseIdentification:
        'XRD analysis identified 9 diffraction peaks. The observed pattern supports CuFe₂O₄ spinel phase assignment, with validation still required before publication-level phase-purity claims.',
    },
    history: [
      {
        id: 'hist-cu-xrd',
        run: 'XRD phase identification',
        technique: 'XRD',
        claimStatus: 'strongly_supported',
        status: 'Report Ready',
        date: '2026-04-29 07:25',
        action: 'workspace',
      },
      {
        id: 'hist-cu-agent',
        run: 'Agent decision run',
        technique: 'Agent Mode',
        claimStatus: 'strongly_supported',
        status: 'Report-ready discussion',
        date: '2026-04-29 07:36',
        action: 'agent',
      },
      {
        id: 'hist-cu-report',
        run: 'Notebook report generated',
        technique: 'Notebook',
        claimStatus: 'strongly_supported',
        status: 'Export Ready',
        date: '2026-04-29 07:42',
        action: 'notebook',
      },
    ],
    workspace: 'xrd',
  },
  {
    id: 'cufe2o4-sba15',
    name: 'CuFe₂O₄/SBA-15',
    material: 'Copper ferrite on mesoporous silica',
    techniques: ['XRD', 'XPS', 'FTIR', 'Raman'],
    status: 'In Progress',
    claimStatus: 'supported',
    validationState: 'partial',
    phase: 'CuFe₂O₄ dispersed on mesoporous SBA-15',
    lastUpdated: '5 hours ago',
    createdDate: '2026-04-28',
    summary:
      'Processed evidence supports CuFe₂O₄ spinel ferrite reflections in the CuFe₂O₄/SBA-15 sample, consistent with dispersed copper ferrite on mesoporous SBA-15. Phase distribution, loading uniformity, surface oxidation state, and support interaction remain validation-limited.',
    xrdPeaks: [
      { position: 20.9, intensity: 24, label: 'SBA shoulder' },
      { position: 30.1, intensity: 44, label: '(220)' },
      { position: 35.5, intensity: 77, label: '(311)' },
      { position: 43.2, intensity: 49, label: '(400)' },
      { position: 57.1, intensity: 38, label: '(511)' },
    ],
    evidence: [
      'XRD reflections assigned to CuFe₂O₄ remain visible in the supported CuFe₂O₄/SBA-15 sample.',
      'Raman vibrational modes provide supporting evidence for ferrite-like local structure.',
      'FTIR silica/support features contextualize the SBA-15 matrix but do not independently establish ferrite phase purity.',
    ],
    recommendations: [
      'Quantify Cu/Fe ratio from XPS survey scan.',
      'Compare FTIR silica bands before report export.',
    ],
    notebook: {
      title: 'Exp-044: CuFe₂O₄/SBA-15 Multi-Tech Correlation',
      pipeline: [
        'Loaded XRD, XPS, and FTIR datasets under one project context.',
        'Aligned surface-state evidence with bulk phase indicators.',
        'Compared metal-oxygen bands against SBA-15 support signatures.',
        'Prepared multi-tech fusion summary for review.',
      ],
      peakDetection:
        '5 ferrite-related reflections detected with broad SBA-15 support contribution.',
      phaseIdentification:
        'CuFe₂O₄-related reflections observed in a CuFe₂O₄/SBA-15 supported sample. XRD supports structural assignment, while dispersion, loading uniformity, phase purity, and surface oxidation state remain validation-limited.',
    },
    history: [
      {
        id: 'hist-sba-multi',
        run: 'Multi-tech correlation',
        technique: 'XRD + XPS + FTIR',
        claimStatus: 'supported',
        status: 'In Progress',
        date: '2026-04-28 16:18',
        action: 'workspace',
      },
    ],
    workspace: 'multi',
  },
  {
    id: 'nife2o4',
    name: 'NiFe₂O₄',
    material: 'Nickel ferrite spinel',
    techniques: ['XRD'],
    status: 'Report Ready',
    claimStatus: 'supported',
    validationState: 'complete',
    phase: 'Spinel nickel ferrite',
    lastUpdated: '1 day ago',
    createdDate: '2026-04-27',
    summary: 'XRD pattern consistent with spinel nickel ferrite.',
    xrdPeaks: [
      { position: 18.4, intensity: 34, label: '(111)' },
      { position: 30.3, intensity: 48, label: '(220)' },
      { position: 35.7, intensity: 92, label: '(311)' },
      { position: 43.4, intensity: 55, label: '(400)' },
      { position: 57.4, intensity: 41, label: '(511)' },
      { position: 63.0, intensity: 44, label: '(440)' },
    ],
    evidence: [
      'Major XRD reflections align with nickel ferrite spinel.',
      'No dominant secondary oxide peak detected in the working window.',
    ],
    recommendations: ['Export report or run Raman confirmation.'],
    notebook: {
      title: 'Exp-041: NiFe₂O₄ Control Sample',
      pipeline: [
        'Imported XRD control scan.',
        'Detected spinel reflections.',
        'Compared against nickel ferrite reference library.',
      ],
      peakDetection: '6 major reflections detected after background subtraction.',
      phaseIdentification: 'Pattern is consistent with spinel nickel ferrite, supported by evidence.',
    },
    history: [
      {
        id: 'hist-ni-xrd',
        run: 'XRD phase identification',
        technique: 'XRD',
        claimStatus: 'supported',
        status: 'Report Ready',
        date: '2026-04-27 14:05',
        action: 'workspace',
      },
    ],
    workspace: 'xrd',
  },
  {
    id: 'cofe2o4',
    name: 'CoFe₂O₄',
    material: 'Cobalt ferrite spinel',
    techniques: ['XRD', 'XPS'],
    status: 'Report Ready',
    claimStatus: 'strongly_supported',
    validationState: 'complete',
    phase: 'Cobalt ferrite spinel phase',
    lastUpdated: '2 days ago',
    createdDate: '2026-04-26',
    summary: 'Evidence supports cobalt ferrite spinel phase.',
    xrdPeaks: [
      { position: 18.2, intensity: 32, label: '(111)' },
      { position: 30.0, intensity: 46, label: '(220)' },
      { position: 35.4, intensity: 94, label: '(311)' },
      { position: 43.1, intensity: 58, label: '(400)' },
      { position: 57.0, intensity: 42, label: '(511)' },
      { position: 62.6, intensity: 47, label: '(440)' },
    ],
    evidence: [
      'XRD confirms cobalt ferrite spinel reflections.',
      'XPS supports expected cobalt and iron oxidation-state envelope.',
    ],
    recommendations: ['Review XPS oxidation-state fit before archiving.'],
    notebook: {
      title: 'Exp-039: CoFe₂O₄ Spinel Verification',
      pipeline: [
        'Processed XRD scan and XPS survey.',
        'Matched ferrite phase pattern.',
        'Linked surface chemistry evidence to phase result.',
      ],
      peakDetection: '6 ferrite reflections detected in the XRD pattern.',
      phaseIdentification: 'Evidence supports cobalt ferrite spinel phase. Status: requires validation.',
    },
    history: [
      {
        id: 'hist-co-xrd',
        run: 'XRD + XPS review',
        technique: 'XRD + XPS',
        claimStatus: 'strongly_supported',
        status: 'Report Ready',
        date: '2026-04-26 11:20',
        action: 'workspace',
      },
    ],
    workspace: 'xrd',
  },
  {
    id: 'fe3o4-nanoparticles',
    name: 'Fe₃O₄ Nanoparticles',
    material: 'Iron oxide nanoparticles',
    techniques: ['FTIR', 'Raman'],
    status: 'In Progress',
    claimStatus: 'partial',
    validationState: 'requires_validation',
    phase: 'Iron oxide nanoparticle signatures',
    lastUpdated: '1 week ago',
    createdDate: '2026-04-22',
    summary:
      'FTIR/Raman evidence suggests iron oxide nanoparticle signatures with surface hydroxyl contribution.',
    xrdPeaks: [
      { position: 30.2, intensity: 39, label: '(220)' },
      { position: 35.5, intensity: 82, label: '(311)' },
      { position: 43.2, intensity: 45, label: '(400)' },
      { position: 57.1, intensity: 34, label: '(511)' },
      { position: 62.7, intensity: 38, label: '(440)' },
    ],
    evidence: [
      'FTIR metal-oxygen band indicates iron oxide lattice vibration.',
      'Raman band pattern suggests magnetite-like nanoparticle signatures.',
      'Surface hydroxyl contribution remains visible in FTIR.',
    ],
    recommendations: ['Run XRD confirmation to distinguish Fe₃O₄ from gamma-Fe₂O₃.'],
    notebook: {
      title: 'Exp-040: Fe₃O₄ Nanoparticle Surface Signature',
      pipeline: [
        'Imported FTIR and Raman spectra.',
        'Marked metal-oxygen and hydroxyl bands.',
        'Compared Raman bands with iron oxide nanoparticle references.',
      ],
      peakDetection: 'Raman and FTIR bands suggest iron oxide nanoparticle signatures.',
      phaseIdentification:
        'Iron oxide nanoparticle assignment is in progress, partially supported by current evidence.',
    },
    history: [
      {
        id: 'hist-fe-ftir',
        run: 'FTIR/Raman evidence review',
        technique: 'FTIR + Raman',
        claimStatus: 'partial',
        status: 'In Progress',
        date: '2026-04-22 09:15',
        action: 'workspace',
      },
    ],
    workspace: 'multi',
  },
];

export function getProject(projectId?: string | null) {
  return demoProjects.find((project) => project.id === projectId) ?? demoProjects[0];
}

function readLocalList<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocalList<T>(key: string, value: T[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function titleCaseTechnique(technique: Technique) {
  if (technique === 'FTIR') return 'FTIR';
  if (technique === 'XPS') return 'XPS';
  if (technique === 'XRD') return 'XRD';
  return 'Raman';
}

export function normalizeTechnique(value?: string | null): Technique {
  const normalized = value?.toLowerCase();
  if (normalized === 'xps') return 'XPS';
  if (normalized === 'ftir') return 'FTIR';
  if (normalized === 'raman') return 'Raman';
  return 'XRD';
}

export function getDefaultTechnique(project: DemoProject): Technique {
  return project.techniques.includes('XRD') ? 'XRD' : project.techniques[0] ?? 'XRD';
}

export function getMultiTechEntryTechnique(project: DemoProject): Technique {
  return project.techniques.find((technique) => technique !== 'XRD') ?? getDefaultTechnique(project);
}

export function getWorkspaceRoute(
  project: DemoProject,
  technique: Technique | string = getDefaultTechnique(project),
  dataset?: DemoDataset | string | null,
) {
  const selectedTechnique = normalizeTechnique(String(technique));
  const params = new URLSearchParams({ project: project.id });
  const datasetId = typeof dataset === 'string' ? dataset : dataset?.id;

  if (datasetId) params.set('dataset', datasetId);

  return `/workspace/${selectedTechnique.toLowerCase()}?${params.toString()}`;
}

export function getWorkspacePath(project: DemoProject) {
  return project.workspace === 'multi' ? `/workspace/multi?project=${project.id}` : getWorkspaceRoute(project);
}

export function getNotebookPath(project: DemoProject) {
  return `/notebook?project=${project.id}`;
}

export function getAgentPath(project: DemoProject) {
  return `/demo/agent?project=${project.id}`;
}

export function getProjectInsight(project: DemoProject) {
  const confidenceLevel = project.claimStatus === 'strongly_supported' ? 'high' :
    project.claimStatus === 'supported' ? 'medium' : 'low';
  return {
    primaryResult: project.phase,
    confidenceScore: project.claimStatus === 'strongly_supported' ? 0.92 :
      project.claimStatus === 'supported' ? 0.74 : 0.45,
    confidenceLevel,
    claimStatus: project.claimStatus,
    validationState: project.validationState,
    interpretation: project.summary,
    keyEvidence: project.evidence,
    warnings: project.status === 'In Progress'
      ? ['XRD provides bulk-averaged structural evidence. Surface-sensitive and phase-purity claims remain validation-limited.']
      : ['XRD provides bulk-averaged structural evidence. Surface-sensitive and phase-purity claims remain validation-limited.'],
    recommendedNextStep: project.recommendations,
  };
}

export function getTechniqueEvidence(project: DemoProject, selectedDatasets: Technique[]) {
  const selected = new Set(selectedDatasets);
  const evidence: string[] = [];

  if (selected.has('XRD')) {
    evidence.push(
      `${project.xrdPeaks.length} XRD peaks matched the ${project.phase} reference pattern.`,
    );
  }

  if (selected.has('Raman')) {
    const ramanEvidence = project.evidence.find((item) => item.toLowerCase().includes('raman'));
    evidence.push(ramanEvidence ?? 'Raman fingerprint supports the assigned ferrite structure.');
  }

  if (selected.has('XPS')) {
    const xpsEvidence = project.evidence.find((item) => item.toLowerCase().includes('xps'));
    evidence.push(xpsEvidence ?? 'XPS oxidation-state envelope is consistent with the selected material system.');
  }

  if (selected.has('FTIR')) {
    const ftirEvidence = project.evidence.find((item) => item.toLowerCase().includes('ftir'));
    evidence.push(ftirEvidence ?? 'FTIR metal-oxygen band supports the ferrite bonding environment.');
  }

  selectedDatasets.forEach((technique) => {
    getSavedEvidence(project.id, technique).forEach((item) => {
      evidence.push(`${technique}: ${item.claim}`);
    });
  });

  if (evidence.length === 0) {
    evidence.push('No datasets selected; the agent cannot build an evidence-linked decision.');
  }

  return evidence;
}

/**
 * Derive claim status based on evidence relationships (NO NUMERIC THRESHOLDS)
 */
export function deriveClaimStatus(
  project: DemoProject,
  selectedDatasets: Technique[]
): ClaimStatus {
  if (selectedDatasets.length === 0) {
    return 'inconclusive';
  }

  const selected = new Set(selectedDatasets);
  const primaryEvidence: Technique[] = [];
  const supportingEvidence: Technique[] = [];

  // Classify evidence by role
  selectedDatasets.forEach((technique) => {
    if (technique === 'XRD') {
      primaryEvidence.push(technique);
    } else if (technique === 'XPS' || technique === 'FTIR' || technique === 'Raman') {
      supportingEvidence.push(technique);
    }
  });

  // Reasoning rules based on evidence relationships
  // Rule 1: Multiple primary + supporting evidence = well-supported
  if (primaryEvidence.length >= 1 && supportingEvidence.length >= 2) {
    return 'strongly_supported';
  }

  // Rule 2: Primary evidence with at least one supporting = supported
  if (primaryEvidence.length >= 1 && supportingEvidence.length >= 1) {
    return 'supported';
  }

  // Rule 3: Primary evidence alone = supported (but note missing techniques)
  if (primaryEvidence.length >= 1) {
    const missingCoreTechniques = project.techniques.filter((t) => !selected.has(t));
    if (missingCoreTechniques.length > 0) {
      return 'supported';
    }
    return 'supported';
  }

  // Rule 4: Only supporting evidence (no primary) = partial
  if (supportingEvidence.length >= 2) {
    return 'partial';
  }

  // Rule 5: Single supporting technique = inconclusive
  if (supportingEvidence.length === 1) {
    return 'inconclusive';
  }

  return 'inconclusive';
}

/**
 * Derive validation state based on evidence completeness
 */
export function deriveValidationState(
  project: DemoProject,
  selectedDatasets: Technique[]
): ValidationState {
  if (selectedDatasets.length === 0) {
    return 'requires_validation';
  }

  const selected = new Set(selectedDatasets);
  const missingCoreTechniques = project.techniques.filter((t) => !selected.has(t));

  // Complete: all project techniques included
  if (missingCoreTechniques.length === 0) {
    return 'complete';
  }

  // Partial: some techniques included but not all
  if (selectedDatasets.length >= 2) {
    return 'partial';
  }

  // Requires validation: only one technique or missing critical evidence
  return 'requires_validation';
}

export function buildAgentRun(project: DemoProject, selectedDatasets: Technique[]): AgentRunResult {
  const claimStatus = deriveClaimStatus(project, selectedDatasets);
  const validationState = deriveValidationState(project, selectedDatasets);
  const evidence = getTechniqueEvidence(project, selectedDatasets);
  const warnings: string[] = [];
  const missingCoreTechniques = project.techniques.filter((technique) => !selectedDatasets.includes(technique));

  if (selectedDatasets.length === 0) {
    warnings.push('No dataset is selected, so evidence strength is reduced and the decision is evidence-limited.');
  }

  if (selectedDatasets.length === 1 && selectedDatasets.includes('XRD')) {
    warnings.push('XRD-only evidence strength is lower because surface and vibrational evidence were excluded.');
  }

  if (missingCoreTechniques.length > 0) {
    warnings.push(`Missing project evidence: ${missingCoreTechniques.join(', ')} dataset not included.`);
  }

  if (project.id === 'cufe2o4-sba15' && (!selectedDatasets.includes('XPS') || !selectedDatasets.includes('FTIR'))) {
    warnings.push('CuFe₂O₄/SBA-15 benefits from XPS and FTIR correlation before stronger reporting.');
  }

  const datasetPhrase = selectedDatasets.length > 0 ? selectedDatasets.join(' + ') : 'no selected datasets';

  return {
    projectId: project.id,
    projectName: project.name,
    material: project.material,
    selectedDatasets,
    decision: `${project.phase} — supported assignment from ${datasetPhrase}`,
    claimStatus,
    validationState,
    evidence,
    warnings,
    recommendations: project.recommendations,
    detectedPeaks: selectedDatasets.includes('XRD') ? project.xrdPeaks : [],
    pipeline: [
      `Loaded project context for ${project.name}.`,
      `Selected datasets: ${datasetPhrase}.`,
      selectedDatasets.includes('XRD')
        ? `Detected ${project.xrdPeaks.length} diffraction peaks and matched the reference phase.`
        : 'Skipped XRD peak matching because XRD was not selected.',
      'Fused selected technique evidence into a traceable decision.',
      `Evidence assessment: ${formatClaimStatusLabel(claimStatus)}.`,
    ],
    generatedAt: new Date().toISOString(),
    summary: `${project.summary} Processing run used ${datasetPhrase} with evidence status: ${formatClaimStatusLabel(claimStatus)}.`,
  };
}

export function generateNotebookSections(project: DemoProject, runResult?: AgentRunResult | null) {
  const result = runResult ?? buildAgentRun(project, project.techniques);

  return {
    title: project.notebook.title,
    summary: result.summary,
    decision: result.decision,
    claimStatus: result.claimStatus,
    validationState: result.validationState,
    evidence: result.evidence,
    warnings: result.warnings,
    recommendations: result.recommendations,
    processingPipeline: result.pipeline,
    peakDetection:
      result.detectedPeaks.length > 0
        ? `${result.detectedPeaks.length} diffraction peaks used in the generated run.`
        : project.notebook.peakDetection,
    phaseInterpretation: `${project.phase}. ${formatClaimStatusLabel(result.claimStatus)} from ${result.selectedDatasets.join(' + ') || 'no selected datasets'}.`,
  };
}

export function saveAgentRunResult(result: AgentRunResult) {
  localStorage.setItem(`difaryx-agent-run:${result.projectId}`, JSON.stringify(result));
}

export function loadAgentRunResult(projectId: string): AgentRunResult | null {
  const raw = localStorage.getItem(`difaryx-agent-run:${projectId}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AgentRunResult;
  } catch {
    return null;
  }
}

function gaussian(x: number, center: number, width: number) {
  const scaled = (x - center) / width;
  return Math.exp(-0.5 * scaled * scaled);
}

export function makeXrdPattern(project: DemoProject) {
  return Array.from({ length: 420 }, (_, index) => {
    const x = 10 + (70 * index) / 419;
    const baseline = 8 + 2.2 * Math.exp(-(x - 10) / 35) + 0.55 * Math.sin(x * 0.35);
    const peakSignal = project.xrdPeaks.reduce(
      (sum, peak) => sum + peak.intensity * gaussian(x, peak.position, 0.19 + peak.intensity / 850),
      0,
    );
    const noise = 0.8 * Math.sin(index * 0.61) + 0.45 * Math.sin(index * 1.37);
    return {
      x: Number(x.toFixed(2)),
      y: Number(Math.max(0, baseline + peakSignal + noise).toFixed(3)),
    };
  });
}

export function makeBaselinePattern(project: DemoProject) {
  return makeXrdPattern(project).map((point) => ({
    x: point.x,
    y: Number((7.8 + 2.1 * Math.exp(-(point.x - 10) / 35)).toFixed(3)),
  }));
}

function makeXpsPattern(project: DemoProject) {
  const centers = project.material.toLowerCase().includes('cobalt')
    ? [
        { c: 531, h: 66, w: 7.5 },
        { c: 710, h: 72, w: 8.8 },
        { c: 724, h: 51, w: 9.3 },
        { c: 780, h: 60, w: 9.5 },
        { c: 796, h: 43, w: 10.8 },
      ]
    : [
        { c: 531, h: 68, w: 7.4 },
        { c: 710, h: 78, w: 8.8 },
        { c: 724, h: 52, w: 9.5 },
        { c: 933, h: 55, w: 8.8 },
        { c: 953, h: 38, w: 10.5 },
      ];

  return Array.from({ length: 520 }, (_, index) => {
    const x = Number(((1200 * index) / 519).toFixed(1));
    const background = 24 + 18 * Math.exp(-x / 520) + 5 * Math.sin(index * 0.017);
    const signal = centers.reduce((sum, peak) => sum + peak.h * gaussian(x, peak.c, peak.w), background);
    const noise = 1.2 * Math.sin(index * 0.61) + 0.7 * Math.sin(index * 1.11);
    return { x, y: Number(Math.max(0, signal + noise).toFixed(3)) };
  });
}

function makeFtirPattern(project: DemoProject) {
  const supportBand = project.material.toLowerCase().includes('silica')
    ? { c: 1080, h: 28, w: 80 }
    : { c: 620, h: 20, w: 48 };
  const bands = [
    { c: 3420, h: 14, w: 160 },
    { c: 1625, h: 10, w: 70 },
    supportBand,
    { c: 580, h: 18, w: 42 },
  ];

  return Array.from({ length: 520 }, (_, index) => {
    const x = Number((400 + ((4000 - 400) * index) / 519).toFixed(1));
    const background = 94 - 1.8 * Math.sin((x - 400) / 620);
    const signal = bands.reduce((sum, band) => sum - band.h * gaussian(x, band.c, band.w), background);
    const noise = 0.5 * Math.sin(index * 0.73) + 0.3 * Math.sin(index * 1.23);
    return { x, y: Number(Math.max(20, signal + noise).toFixed(3)) };
  });
}

function makeRamanPattern(project: DemoProject) {
  const mainMode = project.material.toLowerCase().includes('iron oxide') ? 670 : 690;
  const peaks = [
    { c: 220, h: 12, w: 13 },
    { c: 382, h: 20, w: 17 },
    { c: 585, h: 40, w: 18 },
    { c: mainMode, h: 72, w: 21 },
    { c: 960, h: 24, w: 24 },
    { c: 1348, h: 30, w: 36 },
  ];

  return Array.from({ length: 520 }, (_, index) => {
    const x = Number((100 + ((3200 - 100) * index) / 519).toFixed(1));
    const background = 7 + 16 * Math.exp(-(x - 100) / 1650) + 2.3 * Math.sin(x / 430);
    const signal = peaks.reduce((sum, peak) => sum + peak.h * gaussian(x, peak.c, peak.w), background);
    const noise = 0.9 * Math.sin(index * 0.49) + 0.55 * Math.sin(index * 1.17);
    return { x, y: Number(Math.max(0, signal + noise).toFixed(3)) };
  });
}

export function makeTechniquePattern(project: DemoProject, technique: Technique): SpectrumPoint[] {
  if (technique === 'XPS') return makeXpsPattern(project);
  if (technique === 'FTIR') return makeFtirPattern(project);
  if (technique === 'Raman') return makeRamanPattern(project);
  return makeXrdPattern(project);
}

export function getTechniqueLabels(technique: Technique) {
  if (technique === 'XPS') {
    return { xLabel: 'Binding energy (eV)', yLabel: 'Counts (a.u.)' };
  }
  if (technique === 'FTIR') {
    return { xLabel: 'Wavenumber (cm-1)', yLabel: 'Transmittance (%)' };
  }
  if (technique === 'Raman') {
    return { xLabel: 'Raman shift (cm-1)', yLabel: 'Intensity (a.u.)' };
  }
  return { xLabel: '2theta (deg)', yLabel: 'Intensity (a.u.)' };
}

export function getBuiltInDatasets(project: DemoProject): DemoDataset[] {
  return project.techniques.map((technique) => {
    const labels = getTechniqueLabels(technique);
    const datasetId = `${project.id}-${technique.toLowerCase()}-demo`;

    return {
      id: datasetId,
      projectId: project.id,
      technique,
      fileName: `${project.id}_${technique.toLowerCase()}_demo.xy`,
      sampleName: project.name,
      xLabel: labels.xLabel,
      yLabel: labels.yLabel,
      dataPoints: makeTechniquePattern(project, technique),
      metadata: {
        experimentTitle: project.notebook.title,
        sampleName: project.name,
        materialSystem: project.material,
        operator: 'DIFARYX demo',
        date: project.createdDate,
        notes: project.summary,
      },
      processingState: {
        imported: false,
        baseline: false,
        smoothing: false,
        normalize: false,
      },
      detectedFeatures: technique === 'XRD' ? project.xrdPeaks : [],
      evidence: [],
      savedRuns: [],
    };
  });
}

export function getLocalExperiments(projectId?: string) {
  const experiments = readLocalList<DemoExperiment>(LOCAL_EXPERIMENTS_KEY);
  return projectId ? experiments.filter((experiment) => experiment.projectId === projectId) : experiments;
}

export function getLocalDatasets(projectId?: string) {
  const datasets = readLocalList<DemoDataset>(LOCAL_DATASETS_KEY);
  return projectId ? datasets.filter((dataset) => dataset.projectId === projectId) : datasets;
}

export function getProjectDatasets(projectId: string) {
  const project = getProject(projectId);
  return [...getBuiltInDatasets(project), ...getLocalDatasets(projectId)];
}

export function getDatasetsByTechnique(projectId: string, technique: Technique) {
  return getProjectDatasets(projectId).filter((dataset) => dataset.technique === technique);
}

export function getDataset(datasetId?: string | null) {
  if (!datasetId) return null;

  for (const project of demoProjects) {
    const dataset = getProjectDatasets(project.id).find((item) => item.id === datasetId);
    if (dataset) return dataset;
  }

  return null;
}

export function saveExperiment(experiment: Omit<DemoExperiment, 'id'> & { id?: string }) {
  const experiments = getLocalExperiments();
  const nextExperiment: DemoExperiment = {
    ...experiment,
    id: experiment.id ?? makeId('experiment'),
  };
  writeLocalList(
    LOCAL_EXPERIMENTS_KEY,
    [...experiments.filter((item) => item.id !== nextExperiment.id), nextExperiment],
  );
  return nextExperiment;
}

export function saveDataset(dataset: Omit<DemoDataset, 'id' | 'evidence' | 'savedRuns'> & Partial<Pick<DemoDataset, 'id' | 'evidence' | 'savedRuns'>>) {
  const datasets = getLocalDatasets();
  const nextDataset: DemoDataset = {
    ...dataset,
    id: dataset.id ?? makeId('dataset'),
    evidence: dataset.evidence ?? [],
    savedRuns: dataset.savedRuns ?? [],
  };
  writeLocalList(
    LOCAL_DATASETS_KEY,
    [...datasets.filter((item) => item.id !== nextDataset.id), nextDataset],
  );
  return nextDataset;
}

export function getProcessingRuns(datasetId?: string) {
  const runs = readLocalList<ProcessingRun>(LOCAL_RUNS_KEY);
  return datasetId ? runs.filter((run) => run.datasetId === datasetId) : runs;
}

export function getProcessingRun(runId?: string | null) {
  if (!runId) return null;
  return getProcessingRuns().find((run) => run.id === runId) ?? null;
}

export function getLatestProcessingRun(datasetId?: string | null) {
  if (!datasetId) return null;
  const runs = getProcessingRuns(datasetId);
  return runs.length > 0 ? runs[runs.length - 1] : null;
}

export function saveProcessingRun(run: Omit<ProcessingRun, 'id' | 'timestamp'> & Partial<Pick<ProcessingRun, 'id' | 'timestamp'>>) {
  const runs = getProcessingRuns();
  const nextRun: ProcessingRun = {
    ...run,
    id: run.id ?? makeId('run'),
    timestamp: run.timestamp ?? new Date().toISOString(),
  };
  writeLocalList(LOCAL_RUNS_KEY, [...runs.filter((item) => item.id !== nextRun.id), nextRun]);
  return nextRun;
}

export function getSavedEvidence(projectId?: string, technique?: Technique) {
  const evidence = readLocalList<Evidence>(LOCAL_EVIDENCE_KEY);
  return evidence.filter((item) => {
    const dataset = getDataset(item.datasetId);
    const projectMatches = projectId ? dataset?.projectId === projectId : true;
    const techniqueMatches = technique ? item.technique === technique : true;
    return projectMatches && techniqueMatches;
  });
}

export function saveEvidence(evidence: Omit<Evidence, 'id'> & { id?: string }) {
  const evidenceList = readLocalList<Evidence>(LOCAL_EVIDENCE_KEY);
  const nextEvidence: Evidence = {
    ...evidence,
    id: evidence.id ?? makeId('evidence'),
  };
  writeLocalList(
    LOCAL_EVIDENCE_KEY,
    [...evidenceList.filter((item) => item.id !== nextEvidence.id), nextEvidence],
  );
  return nextEvidence;
}

export function getAllHistoryEntries() {
  return demoProjects.flatMap((project) =>
    project.history.map((entry) => ({
      ...entry,
      projectId: project.id,
      projectName: project.name,
      workspacePath: getWorkspacePath(project),
      notebookPath: getNotebookPath(project),
      agentPath: getAgentPath(project),
    })),
  );
}
