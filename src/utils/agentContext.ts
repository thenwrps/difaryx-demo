/**
 * agentContext.ts
 *
 * Builds the `AgentContext` consumed by CenterColumn, RightPanel, and
 * notebook/export payloads. Delegates all project-level evidence decisions to
 * `projectEvidence.ts` (single source of truth) and applies user parameter
 * overrides on top.
 *
 * Parameter overrides propagate to:
 *   - selected evidence layer summary (marked as parameters-modified)
 *   - trace steps (override step prepended)
 *   - boundary context (validation-limited entry added)
 *   - notebook payload (parameterOverrides list)
 */

import type {
  DemoProject,
  DemoPeak,
  Technique,
  ValidationGap,
  NextDecision,
  JobType,
} from '../data/demoProjects';
import {
  type EvidenceLayer,
  type EvidenceMode,
  type GraphType,
  type DataPoint,
  type Parameter,
  type ParameterGroup,
  type ParameterGroupId,
  type ParameterProvenance,
  getProjectJobType,
  getProjectTechniques,
  getProjectEvidenceLayers,
  getProjectParameterGroups,
} from './projectEvidence';

export { type EvidenceLayer, type EvidenceMode, type GraphType, type DataPoint };
export { type Parameter, type ParameterGroup, type ParameterGroupId, type ParameterProvenance };

export type AgentMode = 'deterministic' | 'guided' | 'autonomous';

export interface MetricData {
  label: string;
  value: string;
  sublabel?: string;
}

export interface WorkflowStep {
  number: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

export interface BoundaryContext {
  jobType: JobType;
  supported: string[];
  validationLimited: string[];
  cannotConclude: string[];
  requiredNext: string[];
}

export interface TraceContext {
  mode: AgentMode;
  jobType: JobType;
  steps: Array<{ label: string; detail: string }>;
  outputLabel: string;
}

export interface DiscussionContext {
  interpretation: string;
  agreement: string;
  uncertainty: string;
}

export interface ComparisonContext {
  paperScholar: string;
  agentCompare: string;
}

export interface ParameterOverride {
  groupId: ParameterGroupId;
  groupTitle: string;
  key: string;
  previousValue: string;
  value: string;
}

export interface NotebookPayload {
  projectId: string;
  projectTitle: string;
  jobType: JobType;
  mode: AgentMode;
  evidenceMode: EvidenceMode;
  activeTechniques: Technique[];
  includedTechniques: Technique[];
  selectedTechnique: Technique;
  evidenceLayers: EvidenceLayer[];
  claimBoundary: string;
  validationGaps: ValidationGap[];
  recommendedActions: NextDecision[];
  parameterOverrides: ParameterOverride[];
}

export type WorkspaceParameters = Partial<Record<ParameterGroupId, Record<string, string>>>;

export interface AgentContext {
  projectId: string;
  projectTitle: string;
  materialSystem: string;
  objective: string;
  jobType: JobType;
  evidenceMode: EvidenceMode;
  primaryTechnique: Technique;
  selectedTechnique: Technique;
  activeTechniques: Technique[];
  includedTechniques: Technique[];
  evidenceLayers: EvidenceLayer[];
  workspaceTitle: string;
  workspaceDescription: string;
  workflowSteps: WorkflowStep[];
  metricCards: MetricData[];
  parameterGroups: ParameterGroup[];
  parameterOverrides: ParameterOverride[];
  hasParameterOverrides: boolean;
  discussionContext: DiscussionContext;
  comparisonContext: ComparisonContext;
  traceContext: TraceContext;
  boundaryContext: BoundaryContext;
  evidenceSummary: string;
  claimBoundary: string;
  validationGaps: ValidationGap[];
  recommendedActions: NextDecision[];
  hasGraphData: boolean;
  graphType: GraphType;
  graphData: DataPoint[];
  peakMarkers?: DemoPeak[];
  baselineData?: DataPoint[];
  notebookPayload: NotebookPayload;
}

export interface BuildAgentContextOptions {
  selectedTechnique?: Technique;
  includedTechniques?: Technique[];
  workspaceParameters?: WorkspaceParameters;
  isLocked?: boolean;
}

// ─── Workspace metadata ───────────────────────────────────────────────────────

export function getEvidenceMode(techniques: Technique[]): EvidenceMode {
  return techniques.length > 1 ? 'multi-tech' : 'single-tech';
}

export function getWorkspaceTitle(
  evidenceMode: EvidenceMode,
  primaryTechnique: Technique,
): string {
  if (evidenceMode === 'multi-tech') return 'Multi-tech Evidence Review';
  const map: Record<Technique, string> = {
    XRD: 'XRD Phase Identification',
    XPS: 'XPS Surface Chemistry Review',
    FTIR: 'FTIR Bonding Evidence Review',
    Raman: 'Raman Structural / Vibrational Review',
  };
  return map[primaryTechnique] || 'Evidence Review';
}

export function getWorkspaceDescription(
  evidenceMode: EvidenceMode,
  evidenceLayers: EvidenceLayer[],
): string {
  if (evidenceMode === 'multi-tech' && evidenceLayers.length > 1) {
    const primary = evidenceLayers[0];
    const rest = evidenceLayers.slice(1).map((l) => l.technique).join(' and ');
    return `${primary.technique} anchors phase assignment while ${rest} provide validation context.`;
  }
  const technique = evidenceLayers[0]?.technique;
  const map: Record<Technique, string> = {
    XRD: 'Primary structural evidence workflow for phase identification.',
    XPS: 'Surface chemistry analysis for oxidation-state validation.',
    FTIR: 'Bonding analysis for functional group identification.',
    Raman: 'Vibrational fingerprint for local structural symmetry.',
  };
  return map[technique as Technique] || 'Evidence review workflow.';
}

// ─── Metric cards ─────────────────────────────────────────────────────────────

function getMultiTechMetricCards(evidenceLayers: EvidenceLayer[]): MetricData[] {
  const available = evidenceLayers.filter((l) => l.status === 'available').length;
  const required = evidenceLayers.filter((l) => l.status === 'required').length;
  const techs = evidenceLayers.map((l) => l.technique).join(', ');
  const agreement = available === evidenceLayers.length ? 'Supported' : available > 0 ? 'Partial' : 'Pending';
  const readiness = required === 0 && available === evidenceLayers.length ? 'Ready' : required > 0 ? 'Requires validation' : 'Pending';
  return [
    { label: 'Evidence sources', value: String(evidenceLayers.length), sublabel: 'active techniques' },
    { label: 'Technique coverage', value: techs, sublabel: `${available}/${evidenceLayers.length} available` },
    { label: 'Agreement level', value: agreement, sublabel: 'cross-technique' },
    { label: 'Validation readiness', value: readiness },
  ];
}

function getSingleTechMetricCards(technique: Technique): MetricData[] {
  const map: Record<Technique, MetricData[]> = {
    XRD: [
      { label: 'Detected peaks', value: 'Pending' },
      { label: '2θ range', value: '10° – 80°' },
      { label: 'Dominant reflections', value: 'Pending', sublabel: 'highest intensity' },
      { label: 'Signal quality', value: 'Pending' },
    ],
    XPS: [
      { label: 'Core levels', value: 'Pending' },
      { label: 'Surface chemistry', value: 'Pending', sublabel: 'oxidation states' },
      { label: 'Oxidation state', value: 'Pending' },
      { label: 'Evidence readiness', value: 'Ready' },
    ],
    FTIR: [
      { label: 'Bands detected', value: 'Pending' },
      { label: 'Bonding region', value: '400 – 4000 cm⁻¹' },
      { label: 'Functional groups', value: 'Pending', sublabel: 'bonding features' },
      { label: 'Evidence readiness', value: 'Ready' },
    ],
    Raman: [
      { label: 'Raman bands', value: 'Pending' },
      { label: 'Structural mode', value: 'Pending', sublabel: 'vibrational modes' },
      { label: 'Local symmetry', value: 'Pending' },
      { label: 'Evidence readiness', value: 'Ready' },
    ],
  };
  return (
    map[technique] || [
      { label: 'Features', value: 'Pending' },
      { label: 'Range', value: 'N/A' },
      { label: 'Dominant', value: 'Pending' },
      { label: 'Readiness', value: 'Pending' },
    ]
  );
}

// ─── Parameter groups with overrides ──────────────────────────────────────────

/**
 * Applies workspaceParameters overrides on top of the canonical
 * project parameter groups and computes the diff list.
 */
function applyParameterOverrides(
  project: DemoProject,
  workspaceParameters: WorkspaceParameters | undefined,
  isLocked: boolean | undefined,
): { groups: ParameterGroup[]; overrides: ParameterOverride[] } {
  const baseline = getProjectParameterGroups(project);
  const overrides: ParameterOverride[] = [];

  const groups: ParameterGroup[] = baseline.map((group) => {
    const overrideMap = workspaceParameters?.[group.id] || {};
    const params: Parameter[] = group.params.map((p) => {
      const overrideValue = overrideMap[p.key];
      let value = p.value;
      let provenance: ParameterProvenance = p.provenance;
      let editable = p.editable;
      if (overrideValue !== undefined && overrideValue !== p.value) {
        overrides.push({
          groupId: group.id,
          groupTitle: group.title,
          key: p.key,
          previousValue: p.value,
          value: overrideValue,
        });
        value = overrideValue;
        provenance = 'user-adjusted';
      }
      if (isLocked && editable) {
        editable = false;
        if (provenance === 'demo-default') provenance = 'locked';
      }
      return { key: p.key, value, provenance, editable };
    });
    return { id: group.id, title: group.title, params };
  });

  return { groups, overrides };
}

// ─── Workflow steps (mode × evidenceMode × jobType) ───────────────────────────

function getWorkflowSteps(
  mode: AgentMode,
  evidenceMode: EvidenceMode,
  jobType: JobType,
): WorkflowStep[] {
  // jobType-specific step sequences for autonomous/guided; deterministic keeps the pipeline wording.
  const p = (n: number, title: string, description: string): WorkflowStep => ({
    number: n,
    title,
    description,
    status: 'pending',
  });

  if (jobType === 'research') {
    if (mode === 'autonomous') {
      return [
        p(1, 'Parse objective', 'Understand research objective and hypothesis'),
        p(2, 'Review evidence', 'Inspect evidence layers across techniques'),
        p(3, 'Extract features', 'Detect peaks / bands / components per technique'),
        p(4, 'Cross-tech agreement', 'Evaluate consistency across evidence layers'),
        p(5, 'Identify validation gaps', 'Detect claims limited by missing evidence'),
        p(6, 'Suggest next experiment', 'Propose next experimental action'),
      ];
    }
    if (mode === 'guided') {
      return [
        p(1, 'Load evidence', 'Retrieve evidence layers for review'),
        p(2, 'Review hypothesis', 'Parse researcher question / hypothesis'),
        p(3, 'Inspect evidence', 'Examine technique-specific evidence'),
        p(4, 'Discuss interpretation', 'Draft interpretation with researcher'),
        p(5, 'Boundary review', 'Update publication-limited boundary'),
        p(6, 'Next experiment', 'Record next experiment suggestion'),
      ];
    }
    return [
      p(1, 'Load dataset', 'Load primary technique dataset'),
      p(2, 'Extract features', 'Detect peaks / bands / components'),
      p(3, 'Match candidates', 'Compare to reference database'),
      p(4, 'Evaluate evidence', 'Assess structural fit / agreement'),
      p(5, 'Generate interpretation', 'Build evidence-grounded interpretation'),
      p(6, 'Identify gaps', 'Detect validation-limited claims'),
    ];
  }

  if (jobType === 'rnd') {
    if (mode === 'autonomous') {
      return [
        p(1, 'Parse development objective', 'Understand process / formulation goal'),
        p(2, 'Review evidence', 'Inspect evidence layers across techniques'),
        p(3, 'Assess performance relevance', 'Link evidence to performance / formulation'),
        p(4, 'Assess risk', 'Identify development risks and limitations'),
        p(5, 'Identify required evidence', 'Detect missing validation'),
        p(6, 'Recommend next iteration', 'Propose next iteration / decision'),
      ];
    }
    if (mode === 'guided') {
      return [
        p(1, 'Load evidence', 'Retrieve evidence layers'),
        p(2, 'Review development question', 'Parse development question'),
        p(3, 'Inspect evidence', 'Examine technique-specific evidence'),
        p(4, 'Discuss performance', 'Connect to formulation / process'),
        p(5, 'Risk and boundary review', 'Mark scale-up risks'),
        p(6, 'Next iteration', 'Record next iteration plan'),
      ];
    }
    return [
      p(1, 'Load dataset', 'Load primary technique dataset'),
      p(2, 'Extract features', 'Detect peaks / bands / components'),
      p(3, 'Match candidates', 'Compare to reference patterns'),
      p(4, 'Evaluate evidence', 'Assess structural / surface / bonding fit'),
      p(5, 'Formulation / process review', 'Map evidence to development decision'),
      p(6, 'Risk review', 'Flag scale-up or transfer risk'),
    ];
  }

  // analytical
  if (mode === 'autonomous') {
    return [
      p(1, 'Parse sample / request', 'Understand sample and method request'),
      p(2, 'Review method parameters', 'Check method parameters and acceptance criteria'),
      p(3, 'Inspect results', 'Inspect evidence results per technique'),
      p(4, 'Compare to acceptance criteria', 'Evaluate reportable boundary'),
      p(5, 'Identify confirmatory need', 'Flag required confirmatory tests'),
      p(6, 'Recommend disposition', 'Propose sample disposition'),
    ];
  }
  if (mode === 'guided') {
    return [
      p(1, 'Load sample / method', 'Retrieve sample and method context'),
      p(2, 'Review request', 'Parse analytical request'),
      p(3, 'Inspect results', 'Inspect evidence results'),
      p(4, 'Review acceptance', 'Compare results to acceptance criteria'),
      p(5, 'Reportable boundary', 'Update reportable boundary'),
      p(6, 'Confirmatory plan', 'Record confirmatory test plan'),
    ];
  }
  return [
    p(1, 'Load sample', 'Load sample and method metadata'),
    p(2, 'Extract features', 'Detect peaks / bands / components'),
    p(3, 'Match candidates', 'Compare to reference library'),
    p(4, 'Evaluate acceptance', 'Compare to acceptance criteria'),
    p(5, 'Reportable status', 'Assess reportable status'),
    p(6, 'Confirmatory requirement', 'Identify confirmatory testing needs'),
  ];
}

// ─── Boundary context ─────────────────────────────────────────────────────────

function buildBoundaryContext(
  project: DemoProject,
  jobType: JobType,
  evidenceLayers: EvidenceLayer[],
  overrides: ParameterOverride[],
): BoundaryContext {
  const available = evidenceLayers.filter((l) => l.status === 'available');
  const required = evidenceLayers.filter((l) => l.status === 'required');
  const pending = evidenceLayers.filter((l) => l.status === 'pending');

  const overrideLimitation =
    overrides.length > 0
      ? `Interpretation based on user-modified parameters (${overrides
          .map((o) => `${o.groupId} ${o.key}`)
          .slice(0, 3)
          .join(', ')}${overrides.length > 3 ? '…' : ''})`
      : null;

  if (jobType === 'rnd') {
    const validationLimited = [
      ...pending.map((l) => `${l.technique}: ${l.limitation}`),
      ...(overrideLimitation ? [overrideLimitation] : []),
    ];
    return {
      jobType,
      supported: available.map((l) => `${l.technique} evidence supports development decision`),
      validationLimited,
      cannotConclude: [
        'Process optimization not validated without all technique coverage',
        'Scale-up decision requires full evidence',
      ],
      requiredNext: required.map((l) => `${l.technique}: ${l.summary}`),
    };
  }
  if (jobType === 'analytical') {
    const validationLimited = [
      ...pending.map((l) => `${l.technique}: requires confirmatory testing`),
      ...(overrideLimitation ? [overrideLimitation] : []),
    ];
    return {
      jobType,
      supported: available.map((l) => `${l.technique} result reportable`),
      validationLimited,
      cannotConclude: ['Final disposition requires all required techniques'],
      requiredNext: required.map((l) => `${l.technique}: ${l.summary}`),
    };
  }
  // research
  const validationLimited = [
    ...[...pending, ...required].map((l) => `${l.technique}: ${l.limitation}`),
    ...(overrideLimitation ? [overrideLimitation] : []),
  ];
  return {
    jobType,
    supported: available.map((l) => `${l.technique} supports scientific claim`),
    validationLimited,
    cannotConclude: project.validationGaps?.map((g) => g.description) || [
      'Validation gaps not yet assessed',
    ],
    requiredNext: required.map((l) => `${l.technique}: ${l.summary}`),
  };
}

// ─── Trace context ────────────────────────────────────────────────────────────

function buildTraceContext(
  mode: AgentMode,
  jobType: JobType,
  workflowSteps: WorkflowStep[],
  overrides: ParameterOverride[],
): TraceContext {
  const steps: Array<{ label: string; detail: string }> = [];

  if (overrides.length > 0) {
    const firstFew = overrides
      .slice(0, 3)
      .map((o) => `${o.groupId} ${o.key} → ${o.value}`)
      .join('; ');
    steps.push({
      label: 'Parameter override',
      detail: `User-adjusted parameters applied before review: ${firstFew}${
        overrides.length > 3 ? `; +${overrides.length - 3} more` : ''
      }`,
    });
  }

  workflowSteps.forEach((s) => {
    steps.push({ label: s.title, detail: s.description });
  });

  const outputLabels: Record<JobType, string> = {
    research: 'Publication-limited claim / next experiment',
    rnd: 'Optimization next step / risk state',
    analytical: 'Sample disposition / reportable result status',
  };
  return { mode, jobType, steps, outputLabel: outputLabels[jobType] };
}

// ─── Discussion & Comparison ──────────────────────────────────────────────────

function buildDiscussionContext(
  project: DemoProject,
  overrides: ParameterOverride[],
): DiscussionContext {
  const evidence = project.evidence || [];
  const base =
    evidence.length > 0
      ? evidence.join(' ')
      : 'Interpretation pending evidence review execution.';
  const interpretation =
    overrides.length > 0
      ? `${base} Parameters modified by user; interpretation depends on adjusted context.`
      : base;
  return {
    interpretation,
    agreement:
      evidence.length > 1
        ? 'Multiple evidence statements available for cross-technique agreement assessment.'
        : 'Single evidence source; cross-technique agreement not applicable.',
    uncertainty: project.validationGaps?.length
      ? `${project.validationGaps.length} validation gap(s) introduce uncertainty.`
      : 'No explicit validation gaps identified.',
  };
}

function buildComparisonContext(): ComparisonContext {
  return {
    paperScholar:
      'External literature comparison is not connected in this demo. Use this section to document manual reference checks.',
    agentCompare:
      'External agent comparison is not connected in this demo. Agent comparison currently reflects deterministic demo reasoning.',
  };
}

// ─── Layer annotation for parameter overrides ─────────────────────────────────

function annotateLayersWithOverrides(
  layers: EvidenceLayer[],
  overrides: ParameterOverride[],
): EvidenceLayer[] {
  if (overrides.length === 0) return layers;
  return layers.map((layer) => {
    const layerOverrides = overrides.filter((o) => o.groupId === layer.technique);
    if (layerOverrides.length === 0) return layer;
    const note = ` (parameters modified: ${layerOverrides.map((o) => o.key).join(', ')})`;
    return {
      ...layer,
      summary: layer.summary + note,
      parameters: {
        ...layer.parameters,
        ...Object.fromEntries(layerOverrides.map((o) => [o.key, o.value])),
      },
    };
  });
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildAgentContext(
  project: DemoProject,
  mode: AgentMode,
  selectedTechniqueOrOptions?: Technique | BuildAgentContextOptions,
  includedTechniques?: Technique[],
): AgentContext {
  // Backward-compat: allow legacy positional signature (selectedTechnique, includedTechniques)
  let options: BuildAgentContextOptions = {};
  if (typeof selectedTechniqueOrOptions === 'string') {
    options = { selectedTechnique: selectedTechniqueOrOptions, includedTechniques };
  } else if (selectedTechniqueOrOptions) {
    options = selectedTechniqueOrOptions;
  }

  const jobType = getProjectJobType(project);
  const activeTechniques = getProjectTechniques(project);
  const included =
    options.includedTechniques && options.includedTechniques.length > 0
      ? options.includedTechniques
      : activeTechniques;
  const evidenceMode = getEvidenceMode(activeTechniques);

  const baselineLayers = getProjectEvidenceLayers(project);
  const primaryTechnique = activeTechniques[0] || ('Unknown' as Technique);

  // Parameter group + overrides
  const { groups: parameterGroups, overrides: parameterOverrides } = applyParameterOverrides(
    project,
    options.workspaceParameters,
    options.isLocked,
  );

  // Annotate layers if overrides exist
  const evidenceLayers = annotateLayersWithOverrides(baselineLayers, parameterOverrides);

  // Determine selectedTechnique: prefer passed value, else first with graph data, else primary
  let selected: Technique = options.selectedTechnique || primaryTechnique;
  if (!options.selectedTechnique) {
    const layerWithGraph = evidenceLayers.find((l) => l.hasGraphData);
    if (layerWithGraph) selected = layerWithGraph.technique;
  }

  const selectedLayer = evidenceLayers.find((l) => l.technique === selected);
  const hasGraph =
    selectedLayer?.hasGraphData === true && selectedLayer.graphData.length > 0;

  const workflowSteps = getWorkflowSteps(mode, evidenceMode, jobType);
  const metricCards =
    evidenceMode === 'multi-tech'
      ? getMultiTechMetricCards(evidenceLayers)
      : getSingleTechMetricCards(primaryTechnique);

  const boundaryContext = buildBoundaryContext(project, jobType, evidenceLayers, parameterOverrides);
  const traceContext = buildTraceContext(mode, jobType, workflowSteps, parameterOverrides);
  const discussionContext = buildDiscussionContext(project, parameterOverrides);
  const comparisonContext = buildComparisonContext();

  const claimBoundary =
    project.summary ||
    (project.evidence && project.evidence.length > 0
      ? project.evidence[0]
      : 'Claim boundary under review.');
  const baseEvidenceSummary =
    project.evidence && project.evidence.length > 0
      ? project.evidence.join(' ')
      : 'Evidence summary pending workflow execution.';
  const evidenceSummary =
    parameterOverrides.length > 0
      ? `${baseEvidenceSummary} (Context reflects ${parameterOverrides.length} user-adjusted parameter${parameterOverrides.length === 1 ? '' : 's'}.)`
      : baseEvidenceSummary;

  const notebookPayload: NotebookPayload = {
    projectId: project.id,
    projectTitle: project.name,
    jobType,
    mode,
    evidenceMode,
    activeTechniques,
    includedTechniques: included,
    selectedTechnique: selected,
    evidenceLayers,
    claimBoundary,
    validationGaps: project.validationGaps || [],
    recommendedActions: project.nextDecisions || [],
    parameterOverrides,
  };

  return {
    projectId: project.id,
    projectTitle: project.name,
    materialSystem: project.material || 'Material system',
    objective: project.objective || 'Evidence review and validation',
    jobType,
    evidenceMode,
    primaryTechnique,
    selectedTechnique: selected,
    activeTechniques,
    includedTechniques: included,
    evidenceLayers,
    workspaceTitle: getWorkspaceTitle(evidenceMode, primaryTechnique),
    workspaceDescription: getWorkspaceDescription(evidenceMode, evidenceLayers),
    workflowSteps,
    metricCards,
    parameterGroups,
    parameterOverrides,
    hasParameterOverrides: parameterOverrides.length > 0,
    discussionContext,
    comparisonContext,
    traceContext,
    boundaryContext,
    evidenceSummary,
    claimBoundary,
    validationGaps: project.validationGaps || [],
    recommendedActions: project.nextDecisions || [],
    hasGraphData: hasGraph,
    graphType: selectedLayer?.graphType || 'xrd',
    graphData: hasGraph ? selectedLayer!.graphData : [],
    peakMarkers: hasGraph ? selectedLayer!.peakMarkers : undefined,
    baselineData: hasGraph ? selectedLayer!.baselineData : undefined,
    notebookPayload,
  };
}
