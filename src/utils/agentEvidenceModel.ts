import type { DemoProject } from '../data/demoProjects';

export type TechniqueId = 'xrd' | 'xps' | 'raman' | 'ftir' | 'multi';

export type EvidenceRole = 'primary-structural' | 'surface-state' | 'vibrational-support' | 'bonding-context';

export type AvailabilityStatus = 'available' | 'limited' | 'missing' | 'not-applicable';

export type ReferenceStatus = 'available' | 'missing' | 'required' | 'not-connected' | 'demo-only';

export type TraceEventType =
  | 'parameter_changed'
  | 'evidence_selected'
  | 'feature_extracted'
  | 'candidate_matched'
  | 'reference_missing'
  | 'claim_boundary_updated'
  | 'next_action_generated'
  | 'technique_toggled'
  | 'focus_changed';

export type ParameterProvenance = 'demo-default' | 'user-adjusted' | 'locked' | 'inferred' | 'missing';

export interface TechniqueParameter {
  key: string;
  value: string;
  editable: boolean;
  provenance: ParameterProvenance;
  effectSummary: string;
}

export interface TechniqueParameterGroup {
  techniqueId: TechniqueId;
  displayName: string;
  params: TechniqueParameter[];
}

export interface TechniqueGraphSource {
  techniqueId: TechniqueId;
  hasRealGraph: boolean;
  graphDatasetId?: string;
  structuredEvidenceAvailable: boolean;
}

export interface EvidenceReference {
  type: 'database' | 'literature' | 'google-scholar' | 'agent' | 'experimental';
  label: string;
  status: ReferenceStatus;
  whyItMatters: string;
  boundaryImpact: string;
}

export interface TechniqueEvidenceResult {
  techniqueId: TechniqueId;
  displayName: string;
  summary: string;
  extractedFindings: string[];
  validationLimits: string[];
  requiredReferences: EvidenceReference[];
  missingReferences: EvidenceReference[];
  nextAction: string;
}

export interface ReasoningTraceEvent {
  stepNumber: number;
  timestamp: string;
  eventType: TraceEventType;
  eventLabel: string;
  input: string;
  reasoning: string;
  output: string;
  boundaryImpact: string;
}

export interface ClaimBoundaryState {
  supported: string[];
  validationLimited: string[];
  cannotConclude: string[];
  requiredNext: string[];
}

export interface SelectedTechniqueState {
  techniqueId: TechniqueId;
  displayName: string;
  evidenceRole: EvidenceRole;
  availability: AvailabilityStatus;
  selected: boolean;
  parameters: TechniqueParameter[];
  graphSource: TechniqueGraphSource;
  evidenceResult: TechniqueEvidenceResult;
  validationLimits: string[];
  requiredReferences: EvidenceReference[];
  missingReferences: EvidenceReference[];
  nextAction: string;
}

export interface AgentEvidenceWorkspace {
  projectId: string;
  jobType: 'research' | 'rnd' | 'analytical';
  objective: string;
  techniques: SelectedTechniqueState[];
  focusedTechnique: TechniqueId;
  trace: ReasoningTraceEvent[];
  claimBoundary: ClaimBoundaryState;
  hasParameterOverrides: boolean;
}

export function getDefaultTechniqueParameters(techniqueId: TechniqueId): TechniqueParameter[] {
  switch (techniqueId) {
    case 'xrd':
      return [
        {
          key: '2θ range',
          value: '10–80°',
          editable: true,
          provenance: 'demo-default',
          effectSummary: 'Defines angular scan range for phase detection',
        },
        {
          key: 'Radiation source',
          value: 'Cu Kα',
          editable: false,
          provenance: 'locked',
          effectSummary: 'Fixed by instrument configuration',
        },
        {
          key: 'Step size',
          value: '0.02°',
          editable: true,
          provenance: 'demo-default',
          effectSummary: 'Affects peak resolution and scan time',
        },
        {
          key: 'Peak threshold',
          value: 'Auto',
          editable: true,
          provenance: 'demo-default',
          effectSummary: 'Controls peak detection sensitivity vs false positives',
        },
        {
          key: 'Phase candidates',
          value: 'Project-defined phase candidates',
          editable: true,
          provenance: 'demo-default',
          effectSummary: 'Candidate phases for pattern matching',
        },
        {
          key: 'Refinement status',
          value: 'Not performed',
          editable: false,
          provenance: 'missing',
          effectSummary: 'Rietveld refinement required for publication-level purity',
        },
      ];
    case 'xps':
      return [
        {
          key: 'Core levels',
          value: 'Metal 2p, Fe 2p, O 1s',
          editable: true,
          provenance: 'demo-default',
          effectSummary: 'Defines which oxidation states are validated',
        },
        {
          key: 'Calibration',
          value: 'C 1s @ 284.8 eV',
          editable: false,
          provenance: 'locked',
          effectSummary: 'Charge correction reference',
        },
        {
          key: 'Surface sensitivity',
          value: '~5 nm',
          editable: false,
          provenance: 'locked',
          effectSummary: 'XPS probes surface only, not bulk phase',
        },
        {
          key: 'Oxidation targets',
          value: 'Project-defined oxidation states',
          editable: true,
          provenance: 'demo-default',
          effectSummary: 'Expected oxidation states for the selected material system',
        },
        {
          key: 'Charge correction',
          value: 'Applied',
          editable: false,
          provenance: 'demo-default',
          effectSummary: 'Corrects for sample charging effects',
        },
      ];
    case 'raman':
      return [
        {
          key: 'Shift range',
          value: '200–800 cm⁻¹',
          editable: true,
          provenance: 'demo-default',
          effectSummary: 'Spectral window for spinel mode detection',
        },
        {
          key: 'Excitation',
          value: '532 nm',
          editable: false,
          provenance: 'locked',
          effectSummary: 'Laser wavelength fixed by instrument',
        },
        {
          key: 'Symmetry focus',
          value: 'Spinel A₁g, T₂g',
          editable: true,
          provenance: 'demo-default',
          effectSummary: 'Expected vibrational modes for spinel structure',
        },
        {
          key: 'Mode assignment',
          value: 'Literature-based',
          editable: true,
          provenance: 'demo-default',
          effectSummary: 'How modes are assigned to structural features',
        },
      ];
    case 'ftir':
      return [
        {
          key: 'Wavenumber range',
          value: '400–4000 cm⁻¹',
          editable: true,
          provenance: 'demo-default',
          effectSummary: 'IR absorption range for bonding detection',
        },
        {
          key: 'Resolution',
          value: '4 cm⁻¹',
          editable: true,
          provenance: 'demo-default',
          effectSummary: 'Spectral resolution for band separation',
        },
      ];
    case 'multi':
      return [];
  }
}

export function getDefaultEvidenceReferences(
  techniqueId: TechniqueId,
  jobType: 'research' | 'rnd' | 'analytical',
): EvidenceReference[] {
  const common: EvidenceReference[] = [
    {
      type: 'agent',
      label: 'Agent reasoning trace',
      status: 'available',
      whyItMatters: 'Provides internal reasoning audit trail',
      boundaryImpact: 'Enables reproducible workflow validation',
    },
  ];

  if (jobType === 'research') {
    common.push(
      {
        type: 'database',
        label: 'Spinel ferrite phase reference',
        status: 'available',
        whyItMatters: 'Provides reference pattern for phase matching',
        boundaryImpact: 'Supports phase assignment but not purity claim',
      },
      {
        type: 'literature',
        label: 'Publication reference',
        status: 'required',
        whyItMatters: 'Required for publication-level claim validation',
        boundaryImpact: 'Missing reference limits publication readiness',
      },
      {
        type: 'google-scholar',
        label: 'Google Scholar',
        status: 'not-connected',
        whyItMatters: 'External literature search for validation context',
        boundaryImpact: 'Not connected in demo; manual search required',
      },
      {
        type: 'experimental',
        label: 'Refinement / control sample',
        status: 'missing',
        whyItMatters: 'Rietveld refinement or control needed for purity claim',
        boundaryImpact: 'Missing refinement limits phase-purity conclusion',
      },
    );
  }

  return common;
}

export function buildDefaultTechniqueState(
  techniqueId: TechniqueId,
  project: DemoProject,
  selected: boolean,
): SelectedTechniqueState {
  const displayNames: Record<TechniqueId, string> = {
    xrd: 'XRD',
    xps: 'XPS',
    raman: 'Raman',
    ftir: 'FTIR',
    multi: 'Multi-tech',
  };

  const evidenceRoles: Record<TechniqueId, EvidenceRole> = {
    xrd: 'primary-structural',
    xps: 'surface-state',
    raman: 'vibrational-support',
    ftir: 'bonding-context',
    multi: 'primary-structural',
  };

  const hasDataset = project.evidenceSources.some((d) => d.technique.toLowerCase() === techniqueId);
  const availability: AvailabilityStatus = hasDataset ? 'available' : 'limited';

  const parameters = getDefaultTechniqueParameters(techniqueId);
  const references = getDefaultEvidenceReferences(techniqueId, project.jobType || 'research');

  const graphSource: TechniqueGraphSource = {
    techniqueId,
    hasRealGraph: techniqueId === 'xrd' && hasDataset,
    graphDatasetId: hasDataset ? project.evidenceSources.find((d) => d.technique.toLowerCase() === techniqueId)?.datasetId : undefined,
    structuredEvidenceAvailable: true,
  };

  let summary = '';
  let extractedFindings: string[] = [];
  let validationLimits: string[] = [];
  let nextAction = '';

  switch (techniqueId) {
    case 'xrd':
      summary = 'XRD pattern shows major reflections consistent with the selected project phase assignment.';
      extractedFindings = [
        'Major reflections extracted from the configured XRD scan window',
        'Strongest reflection supports the project phase candidate',
        'Pattern is consistent with the selected structural assignment',
      ];
      validationLimits = [
        'XPS is surface-sensitive and cannot alone confirm bulk phase assignment',
        'Missing Rietveld refinement limits phase-purity claim',
        'Missing literature reference limits publication readiness',
      ];
      nextAction = 'Add refinement or control reference for publication-level validation';
      break;
    case 'xps':
      summary = 'XPS validates surface oxidation-state context for the selected material system.';
      extractedFindings = [
        'Metal core-level envelope supports the project oxidation-state context',
        'Fe core-level envelope supports iron oxide coordination context',
        'Surface composition supports the registry claim boundary',
      ];
      validationLimits = [
        'XPS probes only ~5 nm surface depth, not bulk phase',
        'Surface oxidation may differ from bulk composition',
        'Cannot conclude bulk stoichiometry from XPS alone',
      ];
      nextAction = 'Verify oxidation state through XPS reference database';
      break;
    case 'raman':
      summary = 'Raman modes support local spinel symmetry assignment.';
      extractedFindings = [
        'Characteristic Raman mode supports local structural symmetry',
        'T₂g modes in 400–600 cm⁻¹ range',
        'Mode pattern is consistent with the selected local symmetry assignment',
      ];
      validationLimits = [
        'Raman is supportive but not full phase refinement',
        'Mode assignment is literature-based, not ab initio',
        'Cannot replace XRD for phase identification',
      ];
      nextAction = 'Use Raman as supporting evidence for spinel assignment';
      break;
    case 'ftir':
      summary = 'FTIR shows metal-oxygen bonding consistent with spinel ferrite.';
      extractedFindings = ['Metal-oxygen stretching bands in 400–600 cm⁻¹ range'];
      validationLimits = ['FTIR provides bonding context but not phase identity'];
      nextAction = 'Use FTIR as bonding validation support';
      break;
  }

  const evidenceResult: TechniqueEvidenceResult = {
    techniqueId,
    displayName: displayNames[techniqueId],
    summary,
    extractedFindings,
    validationLimits,
    requiredReferences: references.filter((r) => r.status === 'required' || r.status === 'missing'),
    missingReferences: references.filter((r) => r.status === 'missing' || r.status === 'not-connected'),
    nextAction,
  };

  return {
    techniqueId,
    displayName: displayNames[techniqueId],
    evidenceRole: evidenceRoles[techniqueId],
    availability,
    selected,
    parameters,
    graphSource,
    evidenceResult,
    validationLimits,
    requiredReferences: references.filter((r) => r.status === 'required' || r.status === 'missing'),
    missingReferences: references.filter((r) => r.status === 'missing' || r.status === 'not-connected'),
    nextAction,
  };
}

export function buildInitialTrace(project: DemoProject, selectedTechniques: TechniqueId[]): ReasoningTraceEvent[] {
  const trace: ReasoningTraceEvent[] = [
    {
      stepNumber: 1,
      timestamp: new Date().toISOString(),
      eventType: 'evidence_selected',
      eventLabel: 'Project loaded',
      input: `Project: ${project.name}`,
      reasoning: `Research objective requires ${selectedTechniques.map((t) => t.toUpperCase()).join(', ')} evidence review.`,
      output: `Techniques selected: ${selectedTechniques.join(', ')}`,
      boundaryImpact: 'Initial evidence scope defined',
    },
  ];

  if (selectedTechniques.includes('xrd')) {
    trace.push({
      stepNumber: 2,
      timestamp: new Date().toISOString(),
      eventType: 'feature_extracted',
      eventLabel: 'XRD peaks extracted',
      input: 'XRD pattern analysis',
      reasoning: 'Major reflections extracted from diffraction pattern for phase matching.',
      output: 'Project XRD peaks identified from the selected dataset',
      boundaryImpact: 'Peak positions enable phase candidate matching',
    });

    trace.push({
      stepNumber: 3,
      timestamp: new Date().toISOString(),
      eventType: 'candidate_matched',
      eventLabel: 'Phase candidate matched',
      input: 'XRD peaks at 17.1–61.6° 2θ',
      reasoning:
        'Major reflections align with the selected project reference positions and strongest expected reflection.',
      output: 'Phase identity supported, but purity remains validation-limited.',
      boundaryImpact: 'Do not claim publication-level phase purity without refinement.',
    });
  }

  return trace;
}

export function buildClaimBoundary(
  selectedTechniques: SelectedTechniqueState[],
  jobType: 'research' | 'rnd' | 'analytical',
): ClaimBoundaryState {
  const supported: string[] = [];
  const validationLimited: string[] = [];
  const cannotConclude: string[] = [];
  const requiredNext: string[] = [];

  const hasXRD = selectedTechniques.some((t) => t.techniqueId === 'xrd' && t.selected);
  const hasXPS = selectedTechniques.some((t) => t.techniqueId === 'xps' && t.selected);
  const hasRaman = selectedTechniques.some((t) => t.techniqueId === 'raman' && t.selected);

  if (hasXRD) {
    supported.push('XRD supports the selected project phase assignment');
  }

  if (hasRaman) {
    supported.push('Raman supports local spinel symmetry');
  }

  if (hasXPS) {
    supported.push('XPS supports project surface oxidation-state context');
  }

  if (hasXPS) {
    validationLimited.push('XPS is surface-sensitive and cannot alone confirm bulk phase assignment');
  }

  if (hasRaman) {
    validationLimited.push('Raman is supportive but not full phase refinement');
  }

  if (jobType === 'research') {
    validationLimited.push('Missing literature/reference link limits publication-readiness');
    validationLimited.push('Missing refinement limits phase-purity claim');
  }

  if (jobType === 'research') {
    cannotConclude.push('Publication-level phase purity without Rietveld refinement');
  }

  if (hasXPS) {
    cannotConclude.push('Bulk oxidation-state distribution from XPS alone');
  }

  cannotConclude.push('Quantitative stoichiometry without additional validation');

  if (jobType === 'research') {
    requiredNext.push('Add refinement / control reference');
    requiredNext.push('Add literature reference');
  }

  if (hasXPS) {
    requiredNext.push('Verify oxidation state through XPS reference');
  }

  requiredNext.push('Send evidence summary to notebook/report');

  return {
    supported,
    validationLimited,
    cannotConclude,
    requiredNext,
  };
}

export function applyParameterChange(
  workspace: AgentEvidenceWorkspace,
  techniqueId: TechniqueId,
  paramKey: string,
  newValue: string,
): AgentEvidenceWorkspace {
  const updatedTechniques = workspace.techniques.map((tech) => {
    if (tech.techniqueId !== techniqueId) return tech;

    const updatedParams = tech.parameters.map((p) => {
      if (p.key !== paramKey) return p;
      return {
        ...p,
        value: newValue,
        provenance: 'user-adjusted' as ParameterProvenance,
      };
    });

    let updatedSummary = tech.evidenceResult.summary;
    if (paramKey === 'Peak threshold' && techniqueId === 'xrd') {
      updatedSummary = `XRD pattern shows major reflections consistent with the selected project phase assignment (threshold: ${newValue}).`;
    }

    return {
      ...tech,
      parameters: updatedParams,
      evidenceResult: {
        ...tech.evidenceResult,
        summary: updatedSummary,
      },
    };
  });

  const traceEvent: ReasoningTraceEvent = {
    stepNumber: workspace.trace.length + 1,
    timestamp: new Date().toISOString(),
    eventType: 'parameter_changed',
    eventLabel: 'Parameter adjusted',
    input: `${techniqueId.toUpperCase()} ${paramKey} changed to ${newValue}`,
    reasoning: `User adjusted ${paramKey} to ${newValue}. This may affect ${
      techniqueId === 'xrd' ? 'peak detection sensitivity' : 'evidence interpretation'
    }.`,
    output: 'Recomputed evidence summary with updated parameter.',
    boundaryImpact: 'Phase support remains valid, purity claim remains limited.',
  };

  const updatedTrace = [...workspace.trace, traceEvent];
  const updatedBoundary = buildClaimBoundary(updatedTechniques, workspace.jobType);

  return {
    ...workspace,
    techniques: updatedTechniques,
    trace: updatedTrace,
    claimBoundary: updatedBoundary,
    hasParameterOverrides: true,
  };
}

export function toggleTechnique(
  workspace: AgentEvidenceWorkspace,
  techniqueId: TechniqueId,
): AgentEvidenceWorkspace {
  const updatedTechniques = workspace.techniques.map((tech) => {
    if (tech.techniqueId !== techniqueId) return tech;
    return { ...tech, selected: !tech.selected };
  });

  const traceEvent: ReasoningTraceEvent = {
    stepNumber: workspace.trace.length + 1,
    timestamp: new Date().toISOString(),
    eventType: 'technique_toggled',
    eventLabel: 'Technique toggled',
    input: `${techniqueId.toUpperCase()} ${updatedTechniques.find((t) => t.techniqueId === techniqueId)?.selected ? 'selected' : 'deselected'}`,
    reasoning: `User ${updatedTechniques.find((t) => t.techniqueId === techniqueId)?.selected ? 'added' : 'removed'} ${techniqueId.toUpperCase()} evidence.`,
    output: `Evidence scope updated: ${updatedTechniques.filter((t) => t.selected).map((t) => t.techniqueId.toUpperCase()).join(', ')}`,
    boundaryImpact: 'Claim boundary updated to reflect selected techniques.',
  };

  const updatedTrace = [...workspace.trace, traceEvent];
  const updatedBoundary = buildClaimBoundary(updatedTechniques, workspace.jobType);

  return {
    ...workspace,
    techniques: updatedTechniques,
    trace: updatedTrace,
    claimBoundary: updatedBoundary,
  };
}

export function changeFocusedTechnique(
  workspace: AgentEvidenceWorkspace,
  techniqueId: TechniqueId,
): AgentEvidenceWorkspace {
  const traceEvent: ReasoningTraceEvent = {
    stepNumber: workspace.trace.length + 1,
    timestamp: new Date().toISOString(),
    eventType: 'focus_changed',
    eventLabel: 'Focus changed',
    input: `Focus changed to ${techniqueId.toUpperCase()}`,
    reasoning: `User requested detailed view of ${techniqueId.toUpperCase()} evidence.`,
    output: `Central panel now displays ${techniqueId.toUpperCase()} evidence.`,
    boundaryImpact: 'No boundary change; focus shift only.',
  };

  return {
    ...workspace,
    focusedTechnique: techniqueId,
    trace: [...workspace.trace, traceEvent],
  };
}
