/**
 * demoProjectRegistry.ts — Single source of truth for demo projects across:
 *   Dashboard · Analysis Workspace · Cross-Tech Comparison · Notebook Lab ·
 *   Scientific Workflow Agent · Experiment History.
 *
 * This is an adapter layer over `demoProjects.ts` that adds the richer
 * structures required by the canonical cross-page behavior (cross-technique
 * comparison matrix, detailed notebook entries, agent workflow trace /
 * claim boundary, and project-scoped experiment history events).
 *
 * All pages should read project data via `getRegistryProject(id)` so that
 * the same project always shows identical title, graph, techniques,
 * evidence, notebook, agent reasoning, and history regardless of route.
 */

import {
  demoProjects as rawDemoProjects,
  getProject as getRawProject,
  makeTechniquePattern,
  getTechniqueLabels,
  DEFAULT_PROJECT_ID,
  type DemoProject as RawDemoProject,
  type Technique,
  type SpectrumPoint,
} from './demoProjects';

// ── Canonical types ─────────────────────────────────────────────────

export type JobType = 'research' | 'rd' | 'analytical';

export type TechniqueId = 'xrd' | 'xps' | 'ftir' | 'raman' | 'multi';

export type ClaimStatus =
  | 'supported_assignment'
  | 'requires_validation'
  | 'validation_limited'
  | 'report_ready'
  | 'processing_required';

export type WorkflowStepId =
  | 'objective'
  | 'context'
  | 'evidence'
  | 'reasoning'
  | 'gap'
  | 'decision'
  | 'memory';

export type ExperimentEventType =
  | 'dataset_loaded'
  | 'parameter_checked'
  | 'evidence_processed'
  | 'validation_gap_identified'
  | 'notebook_entry_created'
  | 'report_draft_updated'
  | 'agent_run'
  | 'cross_tech_review';

// ── Evidence / graph / technique ────────────────────────────────────

export interface DemoGraphData {
  kind: 'graph';
  type: TechniqueId;
  xLabel: string;
  yLabel: string;
  data: SpectrumPoint[];
  peaks?: { position: number; intensity: number; label: string }[];
}

export interface DemoStructuredEvidence {
  kind: 'structured';
  type: TechniqueId;
  title: string;
  bulletEvidence: string[];
  limitation: string;
}

export type DemoGraphSource = DemoGraphData | DemoStructuredEvidence;

export interface DemoTechnique {
  id: TechniqueId;
  label: string;
  role: string;
  available: boolean;
  datasetLabel: string;
  description: string;
  parameters: DemoTechniqueParameter[];
}

export interface DemoTechniqueParameter {
  key: string;
  value: string;
  editable: boolean;
  provenance: 'demo-default' | 'locked' | 'missing' | 'inferred';
  effectSummary: string;
}

export interface DemoEvidenceResult {
  techniqueId: TechniqueId;
  displayName: string;
  summary: string;
  supportsClaim: boolean;
  limitation: string;
  findings: string[];
}

// ── Cross-technique comparison ──────────────────────────────────────

export interface DemoCrossTechniqueRow {
  techniqueId: TechniqueId;
  techniqueLabel: string;
  role: string;
  keyFinding: string;
  supportsClaim: 'yes' | 'partial' | 'no' | 'na';
  limitation: string;
  nextAction: string;
}

export interface DemoReferencePlaceholder {
  type: 'database' | 'literature' | 'google_scholar' | 'agent' | 'experimental';
  label: string;
  status: 'available' | 'required' | 'missing' | 'not_connected';
  note: string;
}

export interface DemoCrossTechniqueComparison {
  agreementLevel: 'strong' | 'partial' | 'limited' | 'conflicting';
  agreementSummary: string;
  matrix: DemoCrossTechniqueRow[];
  missingEvidence: string[];
  validationGap: string;
  recommendedNextAction: string;
  references: DemoReferencePlaceholder[];
}

// ── Notebook entry ──────────────────────────────────────────────────

export interface DemoNotebookEntry {
  title: string;
  objective: string;
  evidenceBasis: string[];
  interpretation: string;
  validationGap: string;
  decision: string;
  reportDraft: string;
  missingReferences: string[];
  claimStatus: ClaimStatus;
  validationBoundary: string;
}

// ── Agent workflow ──────────────────────────────────────────────────

export interface DemoTraceEvent {
  stepNumber: number;
  label: string;
  eventType:
    | 'project_loaded'
    | 'evidence_selected'
    | 'feature_extracted'
    | 'candidate_matched'
    | 'parameter_checked'
    | 'reference_missing'
    | 'claim_boundary_updated'
    | 'next_action_generated';
  input: string;
  reasoning: string;
  output: string;
  boundaryImpact: string;
}

export interface DemoClaimBoundary {
  supported: string[];
  validationLimited: string[];
  cannotConclude: string[];
  requiredNext: string[];
}

export interface DemoAgentWorkflow {
  trace: DemoTraceEvent[];
  claimBoundary: DemoClaimBoundary;
  nextDecisionLabel: string;
}

// ── Experiment history events ───────────────────────────────────────

export interface DemoExperimentHistoryEvent {
  id: string;
  projectId: string;
  projectTitle: string;
  timestampLabel: string;
  eventType: ExperimentEventType;
  title: string;
  techniqueId: TechniqueId;
  summary: string;
  boundaryImpact: string;
}

// ── Project context ─────────────────────────────────────────────────

export interface DemoProjectContext {
  materialSystem: string;
  sampleDescription: string;
  experimentalSetup: string;
  datasetSources: string[];
}

// ── The canonical registry project ──────────────────────────────────

export interface RegistryProject {
  // Dashboard card core
  id: string;
  title: string;
  materialSystem: string;
  jobType: JobType;
  createdLabel: string;
  statusLabel: string;
  claimStatus: ClaimStatus;
  reportReadiness: number;
  validationGapCount: number;
  decisionPendingCount: number;

  // Workflow objective / context
  objective: string;
  context: DemoProjectContext;

  // Techniques
  techniques: DemoTechnique[];
  primaryTechnique: TechniqueId;
  selectedTechniques: TechniqueId[];

  // Graph sources
  graphPreview: DemoGraphData;
  workspaceGraphs: Partial<Record<TechniqueId, DemoGraphSource>>;

  // Evidence
  evidenceSummary: string;
  evidenceResults: DemoEvidenceResult[];
  crossTechniqueComparison: DemoCrossTechniqueComparison;

  // Agent + notebook + history
  agentWorkflow: DemoAgentWorkflow;
  notebook: DemoNotebookEntry;
  experimentHistory: DemoExperimentHistoryEvent[];

  // Workflow path shown on cards
  workflowPath: WorkflowStepId[];

  // Back-compat pointer into raw project
  _raw: RawDemoProject;
}

export interface DemoFocusedEvidenceSource {
  title: string;
  techniqueId: TechniqueId;
  role: string;
  sourceType: 'graph' | 'structured' | 'comparison';
  graphData?: DemoGraphData;
  structuredEvidence?: DemoStructuredEvidence;
  comparisonData?: DemoCrossTechniqueComparison;
  status: string;
  limitation: string;
  nextAction: string;
}

// ── Normalization helpers ───────────────────────────────────────────

const DEFAULT_WORKFLOW_PATH: WorkflowStepId[] = [
  'objective',
  'context',
  'evidence',
  'reasoning',
  'gap',
  'decision',
  'memory',
];

function normalizeJobType(raw: RawDemoProject['jobType']): JobType {
  if (raw === 'rnd') return 'rd';
  if (raw === 'analytical') return 'analytical';
  return 'research';
}

function normalizeTechniqueId(tech: Technique): TechniqueId {
  return tech.toLowerCase() as TechniqueId;
}

function normalizeClaimStatus(raw: RawDemoProject['claimStatus']): ClaimStatus {
  switch (raw) {
    case 'strongly_supported':
      return 'supported_assignment';
    case 'supported':
      return 'requires_validation';
    case 'partial':
      return 'validation_limited';
    case 'inconclusive':
      return 'processing_required';
    default:
      return 'requires_validation';
  }
}

function statusLabelFor(claim: ClaimStatus): string {
  switch (claim) {
    case 'supported_assignment':
      return 'Supported assignment';
    case 'requires_validation':
      return 'Requires validation';
    case 'validation_limited':
      return 'Validation-limited';
    case 'report_ready':
      return 'Report-ready';
    case 'processing_required':
      return 'Requires processing';
    default:
      return 'Requires validation';
  }
}

// ── Project-specific enrichment builders ────────────────────────────

function buildPrimaryGraph(project: RawDemoProject): DemoGraphData {
  const preferred: Technique = project.techniques.includes('XRD')
    ? 'XRD'
    : project.techniques[0];
  const points = makeTechniquePattern(project, preferred);
  const labels = getTechniqueLabels(preferred);
  return {
    kind: 'graph',
    type: normalizeTechniqueId(preferred),
    xLabel: labels.xLabel,
    yLabel: labels.yLabel,
    data: points || [],
    peaks: preferred === 'XRD' ? project.xrdPeaks : undefined,
  };
}

function buildWorkspaceGraphs(project: RawDemoProject): Partial<Record<TechniqueId, DemoGraphSource>> {
  const out: Partial<Record<TechniqueId, DemoGraphSource>> = {};
  for (const tech of project.techniques) {
    const techId = normalizeTechniqueId(tech);
    const points = makeTechniquePattern(project, tech);
    const labels = getTechniqueLabels(tech);
    if (points && points.length > 0) {
      out[techId] = {
        kind: 'graph',
        type: techId,
        xLabel: labels.xLabel,
        yLabel: labels.yLabel,
        data: points,
        peaks: tech === 'XRD' ? project.xrdPeaks : undefined,
      };
    } else {
      // Fallback structured evidence card
      const source = project.evidenceSources.find((s) => s.technique === tech);
      out[techId] = {
        kind: 'structured',
        type: techId,
        title: `${tech} evidence`,
        bulletEvidence: source ? [source.description] : project.evidence.slice(0, 2),
        limitation: project.validationGaps[0]?.description || 'No additional limitation logged.',
      };
    }
  }
  return out;
}

function buildTechniqueParameters(project: RawDemoProject, tech: Technique): DemoTechniqueParameter[] {
  const common: DemoTechniqueParameter[] = [
    {
      key: 'Material system',
      value: project.material,
      editable: false,
      provenance: 'locked',
      effectSummary: 'Keeps the evidence tied to the Dashboard project card.',
    },
    {
      key: 'Dataset role',
      value: tech === project.techniques[0] ? 'Primary evidence' : 'Supporting evidence',
      editable: false,
      provenance: 'inferred',
      effectSummary: 'Defines how this technique contributes to the claim boundary.',
    },
  ];

  if (tech === 'XRD') {
    return [
      ...common,
      {
        key: '2theta range',
        value: '10-80 deg',
        editable: true,
        provenance: 'demo-default',
        effectSummary: 'Controls the diffraction window used for phase assignment.',
      },
      {
        key: 'Peak threshold',
        value: 'Auto',
        editable: true,
        provenance: 'demo-default',
        effectSummary: 'Changes peak detection sensitivity before matching.',
      },
      {
        key: 'Refinement',
        value: 'Not performed',
        editable: false,
        provenance: 'missing',
        effectSummary: 'Limits publication-level phase-purity claims.',
      },
    ];
  }

  if (tech === 'XPS') {
    return [
      ...common,
      {
        key: 'Core levels',
        value: project.material.toLowerCase().includes('cobalt') ? 'Co 2p, Fe 2p, O 1s' : 'Cu 2p, Fe 2p, O 1s',
        editable: true,
        provenance: 'demo-default',
        effectSummary: 'Defines the oxidation-state envelope under review.',
      },
      {
        key: 'Surface sensitivity',
        value: '~5-10 nm',
        editable: false,
        provenance: 'locked',
        effectSummary: 'Marks XPS as surface context rather than bulk proof.',
      },
      {
        key: 'Peak fitting',
        value: 'Review required',
        editable: true,
        provenance: 'demo-default',
        effectSummary: 'Controls whether surface-state claims can be strengthened.',
      },
    ];
  }

  if (tech === 'FTIR') {
    return [
      ...common,
      {
        key: 'Wavenumber range',
        value: '400-4000 cm-1',
        editable: true,
        provenance: 'demo-default',
        effectSummary: 'Sets the bonding and surface functional region under review.',
      },
      {
        key: 'Band assignment',
        value: project.id === 'cufe2o4-sba15' ? 'Silica support + metal-oxygen' : 'Metal-oxygen + surface hydroxyl',
        editable: true,
        provenance: 'demo-default',
        effectSummary: 'Determines whether FTIR is support context or nanoparticle bonding context.',
      },
    ];
  }

  return [
    ...common,
    {
      key: 'Raman shift range',
      value: '100-1200 cm-1',
      editable: true,
      provenance: 'demo-default',
      effectSummary: 'Sets the vibrational window for lattice-mode review.',
    },
    {
      key: 'Mode assignment',
      value: project.id === 'fe3o4-nanoparticles' ? 'Magnetite-like nanoparticle signature' : 'Spinel lattice modes',
      editable: true,
      provenance: 'demo-default',
      effectSummary: 'Controls how local symmetry evidence is interpreted.',
    },
  ];
}

function buildTechniqueList(project: RawDemoProject): DemoTechnique[] {
  return project.techniqueMetadata.map((meta) => {
    const source = project.evidenceSources.find((s) => s.technique === meta.key);
    return {
      id: normalizeTechniqueId(meta.key),
      label: meta.label,
      role: meta.role,
      available: meta.dataAvailable,
      datasetLabel: source?.datasetLabel || `${meta.key} dataset`,
      description: source?.description || `${meta.label} evidence context.`,
      parameters: buildTechniqueParameters(project, meta.key),
    };
  });
}

function buildEvidenceResults(project: RawDemoProject): DemoEvidenceResult[] {
  return project.techniqueMetadata.map((meta) => {
    const source = project.evidenceSources.find((s) => s.technique === meta.key);
    const findings = source ? [source.description] : project.evidence.slice(0, 2);
    const limitation =
      project.validationGaps.find((g) =>
        g.description.toLowerCase().includes(meta.key.toLowerCase()),
      )?.description || project.validationGaps[0]?.description || 'Limitation not logged.';
    return {
      techniqueId: normalizeTechniqueId(meta.key),
      displayName: meta.label,
      summary: source?.description || meta.role,
      supportsClaim: meta.dataAvailable,
      limitation,
      findings,
    };
  });
}

// Per-project cross-technique comparison authored to match Dashboard summaries
function buildCrossTechniqueComparison(project: RawDemoProject): DemoCrossTechniqueComparison {
  const projectId = project.id;

  const base = (): DemoCrossTechniqueComparison => ({
    agreementLevel: 'partial',
    agreementSummary: `${project.techniques.length} techniques selected for validation of ${project.material}.`,
    matrix: [],
    missingEvidence: project.validationGaps.map((g) => g.description),
    validationGap: project.validationGaps[0]?.description || 'No logged validation gap.',
    recommendedNextAction: project.nextDecisions[0]?.label || 'Review evidence.',
    references: [
      { type: 'database', label: 'Reference database', status: 'available', note: 'Spinel ferrite phase reference available for XRD matching.' },
      { type: 'literature', label: 'Literature reference', status: 'required', note: 'Required for publication-level validation.' },
      { type: 'google_scholar', label: 'Google Scholar', status: 'not_connected', note: 'Not connected in demo; external search required.' },
      { type: 'agent', label: 'Agent reasoning trace', status: 'available', note: 'Internal reasoning audit trail available.' },
      { type: 'experimental', label: 'Refinement / control sample', status: 'missing', note: 'Rietveld refinement or control sample unavailable in demo.' },
    ],
  });

  const comp = base();

  if (projectId === 'cu-fe2o4-spinel') {
    comp.agreementLevel = 'strong';
    comp.agreementSummary = 'XRD, XPS, and Raman converge on CuFe₂O₄ spinel phase identity with validation boundaries.';
    comp.matrix = [
      {
        techniqueId: 'xrd', techniqueLabel: 'XRD', role: 'Primary structural evidence',
        keyFinding: 'Major reflections at 17.1°, 28.5°, 35.6°, 42.8°, 53.2°, 56.8°, 61.6° 2θ consistent with spinel (311) family.',
        supportsClaim: 'yes',
        limitation: 'Phase purity claim limited without Rietveld refinement.',
        nextAction: 'Add refinement or control reference for publication-level validation.',
      },
      {
        techniqueId: 'xps', techniqueLabel: 'XPS', role: 'Surface chemistry / oxidation state',
        keyFinding: 'Cu 2p and Fe 2p envelope consistent with Cu²⁺ / Fe³⁺ context in spinel.',
        supportsClaim: 'partial',
        limitation: 'Surface-sensitive (~5 nm); cannot alone confirm bulk phase.',
        nextAction: 'Verify oxidation state through reference database.',
      },
      {
        techniqueId: 'raman', techniqueLabel: 'Raman', role: 'Local symmetry support',
        keyFinding: 'A₁g mode near 690 cm⁻¹ and T₂g modes in 400–600 cm⁻¹ consistent with cubic spinel.',
        supportsClaim: 'partial',
        limitation: 'Supportive only; not full phase refinement.',
        nextAction: 'Use Raman as supporting evidence for spinel assignment.',
      },
    ];
    comp.validationGap = 'Phase purity and publication-level claim require Rietveld refinement and literature reference link.';
    comp.recommendedNextAction = 'Run XPS oxidation-state confirmation and add refinement/control sample reference.';
  } else if (projectId === 'cufe2o4-sba15') {
    comp.agreementLevel = 'partial';
    comp.agreementSummary = 'Multi-tech evidence supports dispersed CuFe₂O₄ on SBA-15, but loading uniformity and surface oxidation state remain unresolved.';
    comp.matrix = [
      {
        techniqueId: 'xrd', techniqueLabel: 'XRD', role: 'Spinel reflection detection on silica support',
        keyFinding: 'CuFe₂O₄ spinel reflections visible above broad SBA-15 amorphous background.',
        supportsClaim: 'yes',
        limitation: 'Broad support signal limits quantitative phase analysis.',
        nextAction: 'Synchrotron XRD or TEM-EDX for spatial phase distribution.',
      },
      {
        techniqueId: 'xps', techniqueLabel: 'XPS', role: 'Surface oxidation + support interaction',
        keyFinding: 'Cu 2p shows Cu²⁺ envelope; Fe 2p consistent with Fe³⁺; O 1s shows support interaction.',
        supportsClaim: 'partial',
        limitation: 'Cu/Fe ratio and loading uniformity not yet quantified.',
        nextAction: 'Complete XPS Cu/Fe ratio quantification vs nominal loading.',
      },
      {
        techniqueId: 'ftir', techniqueLabel: 'FTIR', role: 'Silica support + surface hydroxyl context',
        keyFinding: 'Si–O–Si asymmetric stretch near 1080 cm⁻¹ confirms SBA-15; surface hydroxyl bands near 3400 cm⁻¹.',
        supportsClaim: 'partial',
        limitation: 'Does not resolve ferrite phase identity directly.',
        nextAction: 'Compare silica bands before/after ferrite loading for interaction evidence.',
      },
    ];
    comp.validationGap = 'Ferrite loading uniformity and surface oxidation state remain unresolved.';
    comp.recommendedNextAction = 'Quantify Cu/Fe ratio via XPS survey scan; verify silica interaction bands via FTIR difference spectrum.';
  } else if (projectId === 'nife2o4') {
    comp.agreementLevel = 'partial';
    comp.agreementSummary = 'XRD supports NiFe₂O₄ spinel; Raman and FTIR support lattice and bonding context but require additional confirmation.';
    comp.matrix = [
      {
        techniqueId: 'xrd', techniqueLabel: 'XRD', role: 'Primary structural evidence',
        keyFinding: 'Spinel (311) family reflections consistent with NiFe₂O₄.',
        supportsClaim: 'yes',
        limitation: 'Analytical disposition requires replicate confirmation.',
        nextAction: 'Run Raman for vibrational fingerprint confirmation.',
      },
      {
        techniqueId: 'raman', techniqueLabel: 'Raman', role: 'Lattice mode confirmation',
        keyFinding: 'A₁g and T₂g modes expected for cubic spinel; measurement pending.',
        supportsClaim: 'na',
        limitation: 'Raman data not yet acquired on this sample.',
        nextAction: 'Acquire Raman spectrum on NiFe₂O₄ control sample.',
      },
      {
        techniqueId: 'ftir', techniqueLabel: 'FTIR', role: 'Metal-oxygen bonding context',
        keyFinding: 'Metal-oxygen stretch in 400–600 cm⁻¹ region consistent with spinel bonding.',
        supportsClaim: 'partial',
        limitation: 'Bonding context only; not phase-conclusive.',
        nextAction: 'Supplement with Raman lattice mode evidence.',
      },
    ];
    comp.validationGap = 'Analytical disposition requires vibrational and replicate confirmation.';
    comp.recommendedNextAction = 'Acquire Raman and repeat XRD for analytical-grade confidence.';
  } else if (projectId === 'cofe2o4') {
    comp.agreementLevel = 'strong';
    comp.agreementSummary = 'XRD supports CoFe₂O₄ spinel phase; XPS supports Co²⁺/Fe³⁺ oxidation-state context.';
    comp.matrix = [
      {
        techniqueId: 'xrd', techniqueLabel: 'XRD', role: 'Primary structural evidence',
        keyFinding: 'Spinel reflections consistent with CoFe₂O₄.',
        supportsClaim: 'yes',
        limitation: 'Fine peak fitting not completed for purity claim.',
        nextAction: 'Review Rietveld-grade refinement before final export.',
      },
      {
        techniqueId: 'xps', techniqueLabel: 'XPS', role: 'Oxidation-state validation',
        keyFinding: 'Co 2p envelope consistent with Co²⁺; Fe 2p consistent with Fe³⁺.',
        supportsClaim: 'partial',
        limitation: 'Oxidation-state envelope fit not fully resolved.',
        nextAction: 'Refine Co 2p and Fe 2p peak fitting before archival.',
      },
    ];
    comp.validationGap = 'XPS peak fitting refinement required before final catalyst precursor characterization.';
    comp.recommendedNextAction = 'Refine XPS oxidation-state envelope fit; export notebook with validation boundary noted.';
  } else if (projectId === 'fe3o4-nanoparticles') {
    comp.agreementLevel = 'limited';
    comp.agreementSummary = 'FTIR and Raman suggest iron oxide nanoparticle signatures; XRD needed to distinguish Fe₃O₄ from γ-Fe₂O₃.';
    comp.matrix = [
      {
        techniqueId: 'ftir', techniqueLabel: 'FTIR', role: 'Metal-oxygen bonding + surface hydroxyl',
        keyFinding: 'Fe–O stretch near 580 cm⁻¹; surface hydroxyl near 3400 cm⁻¹.',
        supportsClaim: 'partial',
        limitation: 'Cannot distinguish magnetite from maghemite.',
        nextAction: 'Run XRD to resolve phase ambiguity.',
      },
      {
        techniqueId: 'raman', techniqueLabel: 'Raman', role: 'Lattice mode / magnetite signature',
        keyFinding: 'A₁g mode near 670 cm⁻¹ consistent with magnetite-like local symmetry.',
        supportsClaim: 'partial',
        limitation: 'γ-Fe₂O₃ can show similar A₁g features; not conclusive alone.',
        nextAction: 'XRD confirmation essential for phase-purity claim.',
      },
      {
        techniqueId: 'xrd', techniqueLabel: 'XRD', role: 'Phase identity (pending)',
        keyFinding: 'XRD data not yet acquired.',
        supportsClaim: 'na',
        limitation: 'No XRD data to resolve Fe₃O₄ vs γ-Fe₂O₃.',
        nextAction: 'Acquire XRD pattern on nanoparticle sample.',
      },
    ];
    comp.validationGap = 'Cannot distinguish Fe₃O₄ from γ-Fe₂O₃ without XRD; particle size distribution uncharacterized.';
    comp.recommendedNextAction = 'Run XRD phase confirmation and TEM/DLS for size distribution.';
  }

  return comp;
}

function buildNotebookEntry(project: RawDemoProject, claim: ClaimStatus): DemoNotebookEntry {
  const readiness = project.reportReadiness.readinessPercent;
  const reportDraftBase = `${project.name} · ${project.material}. ${project.summary}`;

  let interpretation = project.notebook.phaseIdentification || project.summary;
  let decision = project.nextDecisions[0]?.description || 'Review evidence and plan next experiment.';
  const evidenceBasis = [
    ...project.evidence.slice(0, 3),
    ...project.evidenceSources.slice(0, 2).map((s) => `${s.technique}: ${s.description}`),
  ];
  const validationGap = project.validationGaps[0]?.description || 'No validation gap logged.';
  const missingReferences = ['Literature reference (publication-level)', 'Refinement or control sample reference'];

  const validationBoundary =
    claim === 'supported_assignment'
      ? 'Phase/evidence supported within demo scope; publication-level purity requires refinement.'
      : claim === 'validation_limited'
        ? 'Claim is supported only within current evidence; additional validation required before report.'
        : 'Claim requires validation; further experiments or references needed.';

  return {
    title: project.notebook.title,
    objective: project.objective,
    evidenceBasis,
    interpretation,
    validationGap,
    decision,
    reportDraft: readiness >= 80
      ? `${reportDraftBase} Report-ready with validation boundaries noted.`
      : readiness >= 50
        ? `${reportDraftBase} Discussion-ready; additional validation recommended before publication.`
        : `${reportDraftBase} Processing evidence; report draft pending additional data.`,
    missingReferences,
    claimStatus: claim,
    validationBoundary,
  };
}

function buildAgentWorkflow(project: RawDemoProject, comp: DemoCrossTechniqueComparison): DemoAgentWorkflow {
  const techniqueLabels = project.techniques.map((t) => t).join(', ');

  const trace: DemoTraceEvent[] = [
    {
      stepNumber: 1,
      label: 'Project loaded',
      eventType: 'project_loaded',
      input: `Project: ${project.name}`,
      reasoning: `Objective requires ${techniqueLabels} evidence review for ${project.material}.`,
      output: `Evidence scope: ${techniqueLabels}.`,
      boundaryImpact: 'Initial evidence scope defined; claim boundary initialized.',
    },
    {
      stepNumber: 2,
      label: 'Evidence selected',
      eventType: 'evidence_selected',
      input: project.evidenceSources.map((s) => s.datasetLabel).join('; '),
      reasoning: 'Agent selected project-linked datasets for structured evidence extraction.',
      output: `${project.evidenceSources.length} datasets loaded.`,
      boundaryImpact: 'Evidence layers available for reasoning.',
    },
  ];

  comp.matrix.forEach((row, i) => {
    trace.push({
      stepNumber: 3 + i,
      label: `${row.techniqueLabel} — ${row.role}`,
      eventType: row.supportsClaim === 'yes' ? 'candidate_matched' : 'feature_extracted',
      input: `${row.techniqueLabel} evidence review`,
      reasoning: row.keyFinding,
      output: row.supportsClaim === 'yes' ? 'Supports claim.' : row.supportsClaim === 'partial' ? 'Partial support.' : 'Does not support / not applicable.',
      boundaryImpact: row.limitation,
    });
  });

  trace.push({
    stepNumber: 3 + comp.matrix.length,
    label: 'Validation gap identified',
    eventType: 'claim_boundary_updated',
    input: 'Cross-technique comparison summary',
    reasoning: comp.validationGap,
    output: 'Claim boundary updated with validation limits.',
    boundaryImpact: comp.validationGap,
  });

  trace.push({
    stepNumber: 4 + comp.matrix.length,
    label: 'Next action generated',
    eventType: 'next_action_generated',
    input: 'Cross-technique comparison + missing references',
    reasoning: 'Agent identified missing references and prioritized next validation action.',
    output: comp.recommendedNextAction,
    boundaryImpact: 'Sends validation-aware claim and next action to notebook.',
  });

  const supported = comp.matrix.filter((r) => r.supportsClaim === 'yes').map((r) => `${r.techniqueLabel} supports: ${r.keyFinding}`);
  const validationLimited = comp.matrix.filter((r) => r.supportsClaim === 'partial').map((r) => `${r.techniqueLabel}: ${r.limitation}`);
  const cannotConclude = [
    comp.validationGap,
    ...comp.matrix.filter((r) => r.supportsClaim === 'no' || r.supportsClaim === 'na').map((r) => r.limitation),
  ];
  const requiredNext = [
    comp.recommendedNextAction,
    ...project.nextDecisions.slice(0, 2).map((d) => d.label),
  ];

  return {
    trace,
    claimBoundary: { supported, validationLimited, cannotConclude, requiredNext },
    nextDecisionLabel: project.nextDecisions[0]?.label || 'Send to notebook.',
  };
}

function buildExperimentHistory(project: RawDemoProject, comp: DemoCrossTechniqueComparison): DemoExperimentHistoryEvent[] {
  const events: DemoExperimentHistoryEvent[] = [];
  const pid = project.id;
  const title = project.name;
  const primaryTech = normalizeTechniqueId(project.techniques[0]);

  events.push({
    id: `${pid}-evt-dataset`,
    projectId: pid,
    projectTitle: title,
    timestampLabel: project.createdDate,
    eventType: 'dataset_loaded',
    title: `${project.techniques[0]} dataset loaded`,
    techniqueId: primaryTech,
    summary: `Loaded primary ${project.techniques[0]} dataset for ${project.material}.`,
    boundaryImpact: 'Evidence scope initialized.',
  });

  events.push({
    id: `${pid}-evt-param`,
    projectId: pid,
    projectTitle: title,
    timestampLabel: project.createdDate,
    eventType: 'parameter_checked',
    title: 'Experimental parameters reviewed',
    techniqueId: primaryTech,
    summary: `Confirmed deterministic parameters for ${project.techniques[0]} evidence processing.`,
    boundaryImpact: 'Parameters locked for reproducible analysis.',
  });

  events.push({
    id: `${pid}-evt-evidence`,
    projectId: pid,
    projectTitle: title,
    timestampLabel: project.lastUpdated,
    eventType: 'evidence_processed',
    title: 'Evidence processed',
    techniqueId: primaryTech,
    summary: project.summary,
    boundaryImpact: 'Evidence summary available for reasoning and notebook handoff.',
  });

  events.push({
    id: `${pid}-evt-gap`,
    projectId: pid,
    projectTitle: title,
    timestampLabel: project.lastUpdated,
    eventType: 'validation_gap_identified',
    title: 'Validation gap identified',
    techniqueId: primaryTech,
    summary: comp.validationGap,
    boundaryImpact: 'Claim boundary recorded; validation action queued.',
  });

  events.push({
    id: `${pid}-evt-cross`,
    projectId: pid,
    projectTitle: title,
    timestampLabel: project.lastUpdated,
    eventType: 'cross_tech_review',
    title: 'Cross-technique comparison reviewed',
    techniqueId: 'multi',
    summary: comp.agreementSummary,
    boundaryImpact: `Agreement level: ${comp.agreementLevel}.`,
  });

  events.push({
    id: `${pid}-evt-notebook`,
    projectId: pid,
    projectTitle: title,
    timestampLabel: project.lastUpdated,
    eventType: 'notebook_entry_created',
    title: 'Notebook entry created',
    techniqueId: 'multi',
    summary: `Draft notebook entry for ${title} prepared with validation-aware claim.`,
    boundaryImpact: 'Notebook preserves claim boundary and missing references.',
  });

  events.push({
    id: `${pid}-evt-report`,
    projectId: pid,
    projectTitle: title,
    timestampLabel: project.lastUpdated,
    eventType: 'report_draft_updated',
    title: 'Report draft updated',
    techniqueId: 'multi',
    summary: project.reportReadiness.exportReady
      ? `Report draft for ${title} is ready with validation boundary noted.`
      : `Report draft for ${title} updated; validation limits still control export readiness.`,
    boundaryImpact: project.reportReadiness.label,
  });

  return events;
}

function buildContext(project: RawDemoProject): DemoProjectContext {
  return {
    materialSystem: project.material,
    sampleDescription: project.phase,
    experimentalSetup: `${project.techniques.join(', ')} measurements on ${project.material}.`,
    datasetSources: project.evidenceSources.map((s) => `${s.technique}: ${s.datasetLabel}`),
  };
}

// ── Main builder ────────────────────────────────────────────────────

function buildRegistryProject(raw: RawDemoProject): RegistryProject {
  const claim = normalizeClaimStatus(raw.claimStatus);
  const crossTech = buildCrossTechniqueComparison(raw);
  const techniques = buildTechniqueList(raw);
  const primaryTechnique: TechniqueId = raw.techniques.includes('XRD')
    ? 'xrd'
    : normalizeTechniqueId(raw.techniques[0]);

  return {
    id: raw.id,
    title: raw.name,
    materialSystem: raw.material,
    jobType: normalizeJobType(raw.jobType),
    createdLabel: raw.lastUpdated,
    statusLabel: statusLabelFor(claim),
    claimStatus: claim,
    reportReadiness: raw.reportReadiness.readinessPercent,
    validationGapCount: raw.validationGaps.length,
    decisionPendingCount: raw.nextDecisions.length,

    objective: raw.objective,
    context: buildContext(raw),

    techniques,
    primaryTechnique,
    selectedTechniques: techniques.map((t) => t.id),

    graphPreview: buildPrimaryGraph(raw),
    workspaceGraphs: buildWorkspaceGraphs(raw),

    evidenceSummary: raw.summary,
    evidenceResults: buildEvidenceResults(raw),
    crossTechniqueComparison: crossTech,

    agentWorkflow: buildAgentWorkflow(raw, crossTech),
    notebook: buildNotebookEntry(raw, claim),
    experimentHistory: buildExperimentHistory(raw, crossTech),

    workflowPath: DEFAULT_WORKFLOW_PATH,

    _raw: raw,
  };
}

// ── Registry + accessors ────────────────────────────────────────────

export const demoProjectRegistry: RegistryProject[] = rawDemoProjects.map(buildRegistryProject);

export const DEFAULT_REGISTRY_PROJECT_ID = DEFAULT_PROJECT_ID;

const PROJECT_ID_ALIASES: Record<string, string> = {
  'ni-fe2o4': 'nife2o4',
  'co-fe2o4': 'cofe2o4',
  fe3o4: 'fe3o4-nanoparticles',
  cufe2o4: 'cu-fe2o4-spinel',
};

export function normalizeRegistryProjectId(id: string | null | undefined): string | null {
  if (!id) return null;
  return PROJECT_ID_ALIASES[id] || id;
}

export function getRegistryProject(id: string | null | undefined): RegistryProject {
  const normalizedId = normalizeRegistryProjectId(id);
  if (!normalizedId) {
    return (
      demoProjectRegistry.find((p) => p.id === DEFAULT_REGISTRY_PROJECT_ID) ||
      demoProjectRegistry[0]
    );
  }
  const found = demoProjectRegistry.find((p) => p.id === normalizedId);
  if (found) return found;
  // Fallback: default project with a note via console; UI consumer may show banner.
  return (
    demoProjectRegistry.find((p) => p.id === DEFAULT_REGISTRY_PROJECT_ID) ||
    demoProjectRegistry[0]
  );
}

export function isKnownProjectId(id: string | null | undefined): boolean {
  const normalizedId = normalizeRegistryProjectId(id);
  if (!normalizedId) return false;
  return demoProjectRegistry.some((p) => p.id === normalizedId);
}

export function getAllExperimentHistoryEvents(): DemoExperimentHistoryEvent[] {
  return demoProjectRegistry.flatMap((p) => p.experimentHistory);
}

export function getExperimentHistoryForProject(id: string | null | undefined): DemoExperimentHistoryEvent[] {
  const project = getRegistryProject(id);
  return project.experimentHistory;
}

export function getRegistryProjectFromRaw(raw: RawDemoProject): RegistryProject {
  return getRegistryProject(raw.id);
}

export function getFocusedEvidenceSource(
  project: RegistryProject,
  focusedTechnique: TechniqueId,
): DemoFocusedEvidenceSource {
  if (focusedTechnique === 'multi') {
    return {
      title: 'Multi-tech evidence matrix',
      techniqueId: 'multi',
      role: 'Cross-technique comparison',
      sourceType: 'comparison',
      comparisonData: project.crossTechniqueComparison,
      status: agreementLabel(project.crossTechniqueComparison.agreementLevel),
      limitation: project.crossTechniqueComparison.validationGap,
      nextAction: project.crossTechniqueComparison.recommendedNextAction,
    };
  }

  const source = project.workspaceGraphs[focusedTechnique];
  const evidence = project.evidenceResults.find((item) => item.techniqueId === focusedTechnique);
  const comparisonRow = project.crossTechniqueComparison.matrix.find((row) => row.techniqueId === focusedTechnique);
  const technique = project.techniques.find((item) => item.id === focusedTechnique);
  const label = technique?.label || evidence?.displayName || focusedTechnique.toUpperCase();
  const role = comparisonRow?.role || technique?.role || evidence?.summary || 'Evidence layer';
  const limitation = comparisonRow?.limitation || evidence?.limitation || project.notebook.validationBoundary;
  const nextAction = comparisonRow?.nextAction || project.crossTechniqueComparison.recommendedNextAction;
  const status = evidence?.supportsClaim
    ? 'Available'
    : comparisonRow?.supportsClaim === 'na'
      ? 'Required'
      : 'Limited';

  if (source?.kind === 'graph') {
    return {
      title: `${label} evidence`,
      techniqueId: focusedTechnique,
      role,
      sourceType: 'graph',
      graphData: source,
      status,
      limitation,
      nextAction,
    };
  }

  if (source?.kind === 'structured') {
    return {
      title: source.title,
      techniqueId: focusedTechnique,
      role,
      sourceType: 'structured',
      structuredEvidence: source,
      status,
      limitation,
      nextAction,
    };
  }

  return {
    title: `${label} evidence required`,
    techniqueId: focusedTechnique,
    role,
    sourceType: 'structured',
    structuredEvidence: {
      kind: 'structured',
      type: focusedTechnique,
      title: `${label} evidence required`,
      bulletEvidence: evidence?.findings?.length ? evidence.findings : [evidence?.summary || project.evidenceSummary],
      limitation,
    },
    status: 'Required',
    limitation,
    nextAction,
  };
}

// ── Small label helpers ─────────────────────────────────────────────

export function jobTypeLabel(jt: JobType): string {
  if (jt === 'research') return 'Research';
  if (jt === 'rd') return 'R&D';
  return 'Analytical';
}

export function jobTypeBadgeClass(jt: JobType): string {
  if (jt === 'research') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (jt === 'rd') return 'bg-purple-50 text-purple-700 border-purple-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

export function agreementLabel(level: DemoCrossTechniqueComparison['agreementLevel']): string {
  if (level === 'strong') return 'Strong agreement';
  if (level === 'partial') return 'Partial agreement';
  if (level === 'limited') return 'Limited agreement';
  return 'Conflicting evidence';
}

export function agreementBadgeClass(level: DemoCrossTechniqueComparison['agreementLevel']): string {
  if (level === 'strong') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (level === 'partial') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (level === 'limited') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

export function claimStatusLabel(cs: ClaimStatus): string {
  return statusLabelFor(cs);
}

export function claimStatusColorClass(cs: ClaimStatus): string {
  if (cs === 'supported_assignment' || cs === 'report_ready') return 'text-emerald-600';
  if (cs === 'requires_validation') return 'text-blue-600';
  if (cs === 'validation_limited') return 'text-amber-600';
  return 'text-red-600';
}

// ── Back-compat re-export ───────────────────────────────────────────

export { getRawProject };
