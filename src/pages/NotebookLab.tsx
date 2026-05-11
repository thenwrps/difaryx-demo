import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BarChart3, ChevronDown, ChevronLeft, ChevronRight, Download, FileText, FlaskConical, MoreHorizontal, Plus, Printer, Save, Share2, Target, X } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AIInsightPanel } from '../components/ui/AIInsightPanel';
import { ExperimentModal } from '../components/workspace/ExperimentModal';
import {
  ProcessingRun,
  demoProjects,
  generateNotebookSections,
  getAgentPath,
  getDataset,
  getLocalExperiments,
  getLocalProjectNotebooks,
  deleteProjectNotebook,
  getNotebookPath,
  getNotebookTypeBadge,
  getProcessingRun,
  getProcessingRuns,
  getProject,
  getProjectInsight,
  getWorkspaceRoute,
  loadAgentRunResult,
  type ProjectNotebook,
} from '../data/demoProjects';
import { DemoExportFormat, exportDemoArtifact } from '../utils/demoExport';
import { getRun, type AgentRun } from '../data/runModel';
import {
  NOTEBOOK_TEMPLATES,
  createNotebookEntryFromRefinement,
  createProcessingResultFromXrdDemo,
  createReportSectionFromNotebookEntry,
  getLatestAgentDiscussionRefinement,
  getLatestNotebookEntry,
  getLatestProcessingResult,
  getNotebookEntry,
  normalizeNotebookTemplateMode,
  refineDiscussionFromProcessing,
  saveAgentDiscussionRefinement,
  saveNotebookEntry,
  saveProcessingResult,
  type NotebookTemplateMode,
} from '../data/workflowPipeline';
import {
  XRD_DEMO_DATASETS,
  getXrdProjectCompatibility,
  isDatasetCompatibleWithProject,
} from '../data/xrdDemoDatasets';
import { getLockedContext } from '../data/lockedContext';
import {
  formatConditionLockTimestamp,
  getConditionBoundaryNotes,
  getExperimentConditionLock,
  getConditionLockSectionLines,
  getConditionLockStatusLabel,
} from '../data/experimentConditionLock';

const NOTEBOOK_TEMPLATE_MODES: NotebookTemplateMode[] = ['research', 'rd', 'analytical'];
const NOTEBOOK_TABS = ['Objective', 'Evidence', 'Interpretation', 'Validation Gap', 'Decision', 'Report Draft'] as const;
type ActiveNotebookTab = typeof NOTEBOOK_TABS[number];

function formatClaimStatus(status: string): string {
  switch (status) {
    case 'strongly_supported': return 'Supported assignment with validation boundaries';
    case 'supported': return 'Requires validation';
    case 'partial': return 'Validation-limited';
    case 'inconclusive': return 'Publication-limited';
    case 'contradicted': return 'Claim boundary';
    default: return status;
  }
}

/**
 * Safe confidence display: returns the mapped claim-status label when it
 * resolves to a known phrase; otherwise derives a neutral fallback from
 * active-project evidence and validation-gap state.
 */
function resolveConfidenceLabel(
  claimStatus: string | undefined | null,
  hasEvidenceLinked: boolean,
  openValidationGaps: number,
): string {
  const known = new Set([
    'strongly_supported',
    'supported',
    'partial',
    'inconclusive',
    'contradicted',
  ]);
  if (claimStatus && known.has(claimStatus)) {
    const label = formatClaimStatus(claimStatus);
    if (label && label.trim()) return label;
  }
  if (!hasEvidenceLinked) return 'Pending';
  if (openValidationGaps > 0) return 'Medium-high · validation-limited';
  return 'High';
}

const NOTEBOOK_TEMPLATE_DETAILS: Record<
  NotebookTemplateMode,
  {
    description: string;
    output: string;
    status: string;
    primaryLabel: string;
    reportPreview: string;
    badges: string[];
  }
> = {
  research: {
    description:
      'For hypothesis-driven research, evidence fusion, claim boundaries, mechanism discussion, and manuscript-ready interpretation.',
    output: 'Report-ready for internal scientific review; publication-level claims remain validation-limited.',
    status: 'Publication-limited',
    primaryLabel: 'Refined Discussion',
    reportPreview: 'Manuscript discussion section generated from this notebook entry.',
    badges: ['Source workflow', 'Refined discussion', 'Evidence review', 'Claim boundary', 'Validation notes'],
  },
  rd: {
    description:
      'For prototype development, technical validation, optimization, feasibility review, and go/no-go decisions.',
    output: 'Technical report + development status + next action.',
    status: 'Review-ready',
    primaryLabel: 'Go/No-Go Rationale',
    reportPreview: 'Technical report section generated from prototype metrics, risk review, and decision rationale.',
    badges: ['Source workflow', 'Risk review', 'Go/No-Go rationale', 'Development status', 'Next development plan'],
  },
  analytical: {
    description:
      'For sample analysis, method execution, calibration, QA/QC, result validity, and analytical reporting.',
    output: 'Analytical report + QA/QC status + review or retest decision.',
    status: 'Report-ready',
    primaryLabel: 'Reviewed Result',
    reportPreview: 'Analytical report section generated from method, QA/QC, and result validity.',
    badges: ['Source workflow', 'QA/QC review', 'Result validity', 'Analytical result', 'Review / Retest'],
  },
};

type SupportingDataItem = {
  technique: string;
  evidence: string;
  strength: 'Ready' | 'Review' | 'In Progress';
  dataset: string;
  caveat: string;
};

const DETERMINISTIC_TRACE = [
  'load_xrd_dataset',
  'detect_xrd_peaks',
  'search_phase_database',
  'evaluate_phase_candidates',
  'analyze_peak_conflicts',
  'interpretation_refinement',
  'generate_xrd_discussion',
];

const SBA15_DETERMINISTIC_TRACE = [
  'load_primary_xrd_dataset',
  'detect_xrd_reflections',
  'compare_spinel_reference_scope',
  'attach_raman_ftir_context',
  'flag_xps_surface_state_gap',
  'validation_boundary_review',
  'generate_multitech_discussion',
];

const NIFE2O4_DETERMINISTIC_TRACE = [
  'load_xrd_control_dataset',
  'detect_spinel_reflections',
  'compare_nickel_ferrite_reference',
  'confirm_absence_secondary_oxide',
  'generate_control_sample_discussion',
];

const COFE2O4_DETERMINISTIC_TRACE = [
  'load_xrd_and_xps_datasets',
  'detect_xrd_spinel_reflections',
  'evaluate_cobalt_ferrite_phase',
  'analyze_xps_oxidation_envelope',
  'flag_xps_fit_refinement_gap',
  'generate_multitech_discussion',
];

const FE3O4_DETERMINISTIC_TRACE = [
  'load_ftir_spectrum',
  'assign_metal_oxygen_band',
  'load_raman_spectrum',
  'compare_iron_oxide_nanoparticle_references',
  'flag_xrd_phase_ambiguity_gap',
  'generate_nanoparticle_surface_discussion',
];

function hasMatchedXrdDemoData(projectId: string): boolean {
  /* Check XRD-compatible datasets first */
  const compatibility = getXrdProjectCompatibility(projectId);
  if (compatibility) {
    const hasXrdMatch = compatibility.datasetIds.some((datasetId) => (
      isDatasetCompatibleWithProject(datasetId, projectId) &&
      XRD_DEMO_DATASETS.some((dataset) => dataset.id === datasetId)
    ));
    if (hasXrdMatch) return true;
  }

  /* Also check if the project has non-XRD built-in evidence sources (FTIR, Raman, XPS) */
  const project = getProject(projectId);
  if (project && project.evidenceSources && project.evidenceSources.length > 0) {
    return true;
  }

  return false;
}

function getProjectNotebookContent(projectId: string) {
  /* ── CuFe₂O₄/SBA-15 ──────────────────────────────────────── */
  if (projectId === 'cufe2o4-sba15') {
    return {
      experimentTitle: 'Exp-044: CuFe₂O₄/SBA-15 Multi-Tech Correlation',
      summary:
        'XRD Phase Identification: CuFe₂O₄-related reflections observed in a CuFe₂O₄/SBA-15 supported sample. XRD supports structural assignment, while dispersion, loading uniformity, phase purity, and surface oxidation state remain validation-limited.',
      discussion:
        'The processed evidence supports CuFe₂O₄ spinel ferrite reflections in the CuFe₂O₄/SBA-15 sample, consistent with dispersed copper ferrite on mesoporous SBA-15. Phase distribution, loading uniformity, surface oxidation state, and support interaction remain validation-limited.',
      reportPreview:
        'The processed evidence supports CuFe₂O₄ spinel ferrite reflections in the CuFe₂O₄/SBA-15 sample. Supporting Raman evidence is consistent with ferrite-like local symmetry, while FTIR contextualizes the silica support environment. The interpretation should remain framed as validation-limited because phase distribution, support interaction, loading uniformity, and surface oxidation-state assignment require additional validation.',
      keyEvidence: [
        'XRD reflections assigned to CuFe₂O₄ remain visible in the supported CuFe₂O₄/SBA-15 sample.',
        'Raman vibrational modes provide supporting evidence for ferrite-like local structure.',
        'FTIR silica/support features contextualize the SBA-15 matrix but do not independently establish ferrite phase purity.',
      ],
      supportingData: [
        {
          technique: 'XRD',
          evidence: 'CuFe₂O₄-assigned reflections remain visible in the supported sample',
          strength: 'Ready' as const,
          dataset: 'xrd-cufe2o4-sba15-demo',
          caveat: 'Reflection visibility supports assignment but not loading uniformity across SBA-15.',
        },
        {
          technique: 'Raman',
          evidence: 'Ferrite-like vibrational modes support local spinel symmetry',
          strength: 'Ready' as const,
          dataset: 'cu-fe2o4-sba15_raman.txt',
          caveat: 'Raman support remains contextual and does not establish phase purity alone.',
        },
        {
          technique: 'FTIR',
          evidence: 'Silica/support bands contextualize the SBA-15 matrix',
          strength: 'In Progress' as const,
          dataset: 'cu-fe2o4-sba15_ftir.csv',
          caveat: 'FTIR support features do not independently establish ferrite phase purity.',
        },
        {
          technique: 'XPS',
          evidence: 'Surface oxidation-state assignment remains under review',
          strength: 'Review' as const,
          dataset: 'cu-fe2o4-sba15_surface_xps.spe',
          caveat: 'Run Cu 2p / Fe 2p review before surface-state claims.',
        },
      ] satisfies SupportingDataItem[],
      validationNotes: [
        'Quantify CuFe₂O₄ loading and distribution across SBA-15.',
        'Review XPS Cu/Fe oxidation state and surface enrichment.',
        'Compare FTIR silica bands and metal-oxygen bands under the support matrix.',
        'Use microscopy or mapping evidence to validate dispersion and support interaction.',
      ],
      runLog: [
        ['Processing run', 'xrd-run-044'],
        ['Refinement', 'refine-044'],
        ['Dataset', 'xrd-cufe2o4-sba15-demo'],
        ['Workflow version', 'difaryx-analysis-v0.1'],
      ],
      phaseLabel: 'CuFe₂O₄ dispersed on mesoporous SBA-15',
      peakDetection: '5 ferrite-related reflections detected with broad SBA-15 support contribution.',
    };
  }

  /* ── CuFe₂O₄ Spinel ─────────────────────────────────────── */
  if (projectId === 'cu-fe2o4-spinel') {
    return {
      experimentTitle: 'Exp-042: CuFe₂O₄ Spinel Phase Confirmation',
      summary:
        'XRD Phase Identification: Supported CuFe₂O₄ spinel ferrite phase assignment with validation boundaries.',
      discussion:
        'The processed XRD pattern supports CuFe₂O₄ spinel ferrite phase assignment, with validation still required before publication-level phase-purity claims.',
      reportPreview:
        'The processed XRD pattern supports CuFe₂O₄ spinel ferrite phase assignment. Publication-level phase-purity claims remain validation-limited until supporting cross-technique and replicate evidence are reviewed.',
      keyEvidence: [
        'XRD reflections near 30.1 deg, 35.5 deg, and 43.2 deg 2theta align with spinel ferrite reference peaks.',
        'Raman A1g/T2g vibrational features support local spinel symmetry.',
        'Peak width and unresolved weak reflections indicate validation is still required before phase-purity claims.',
      ],
      supportingData: [
        {
          technique: 'XRD',
          evidence: 'Spinel diffraction peaks align with reference positions',
          strength: 'Ready' as const,
          dataset: 'cufe2o4_clean_demo.xy',
          caveat: 'Reference comparison supports assignment but not publication-level phase purity.',
        },
        {
          technique: 'Raman',
          evidence: 'A1g/T2g vibrational features support local spinel symmetry',
          strength: 'Ready' as const,
          dataset: 'cu-fe2o4-spinel_raman.txt',
          caveat: 'Mode assignment supports phase but does not replace XRD.',
        },
      ] satisfies SupportingDataItem[],
      validationNotes: [
        'Run Rietveld refinement for quantitative phase assessment.',
        'Review XPS Cu 2p, Fe 2p, and O 1s core-level spectra.',
        'Use TEM to validate morphology and crystallite-size assumptions.',
        'Review replicate evidence before publication-level phase-purity claims.',
      ],
      runLog: [
        ['Processing run', 'xrd-run-042'],
        ['Refinement', 'refine-042'],
        ['Dataset', 'xrd-cufe2o4-clean'],
        ['Workflow version', 'difaryx-analysis-v0.1'],
      ],
      phaseLabel: 'CuFe₂O₄ copper ferrite phase',
      peakDetection: '9 diffraction peaks detected across 17.1-61.6 degrees 2theta after baseline correction.',
    };
  }

  /* ── NiFe₂O₄ ────────────────────────────────────────────── */
  if (projectId === 'nife2o4') {
    return {
      experimentTitle: 'Exp-041: NiFe₂O₄ Control Sample',
      summary:
        'XRD Phase Identification: Pattern is consistent with spinel nickel ferrite. Major reflections align with NiFe₂O₄ reference, supported by evidence.',
      discussion:
        'The processed XRD pattern is consistent with spinel nickel ferrite. Six major reflections were detected after background subtraction and matched against nickel ferrite reference. No dominant secondary oxide peak was detected in the working window, supporting phase assignment as a control sample.',
      reportPreview:
        'The processed XRD pattern is consistent with spinel nickel ferrite. Six major reflections were detected after background subtraction and matched against nickel ferrite reference. This control sample supports the ferrite research program baseline. Raman confirmation of vibrational fingerprint remains a validation opportunity.',
      keyEvidence: [
        'Major XRD reflections at 30.3, 35.7, 43.4, 57.4, and 63.0 deg 2theta align with nickel ferrite spinel.',
        'No dominant secondary oxide peak detected in the working window.',
        'Pattern serves as reference control for the ferrite research program.',
      ],
      supportingData: [
        {
          technique: 'XRD',
          evidence: 'Major XRD reflections align with nickel ferrite spinel',
          strength: 'Ready' as const,
          dataset: 'xrd-nife2o4-control',
          caveat: 'Pattern supports assignment as control; Raman confirmation is optional.',
        },
      ] satisfies SupportingDataItem[],
      validationNotes: [
        'Optional: run Raman measurement to confirm lattice mode assignment.',
        'Export as reference control for the ferrite research program.',
        'Review replicate evidence before extending to publication claims.',
      ],
      runLog: [
        ['Processing run', 'xrd-run-041'],
        ['Refinement', 'refine-041'],
        ['Dataset', 'xrd-nife2o4-control'],
        ['Workflow version', 'difaryx-analysis-v0.1'],
      ],
      phaseLabel: 'Spinel nickel ferrite',
      peakDetection: '6 major reflections detected after background subtraction.',
    };
  }

  /* ── CoFe₂O₄ ────────────────────────────────────────────── */
  if (projectId === 'cofe2o4') {
    return {
      experimentTitle: 'Exp-039: CoFe₂O₄ Spinel Verification',
      summary:
        'XRD + XPS Evidence: Evidence supports cobalt ferrite spinel phase with expected cobalt and iron oxidation-state envelope.',
      discussion:
        'The processed evidence supports cobalt ferrite spinel phase assignment. XRD confirms cobalt ferrite spinel reflections, and XPS supports the expected cobalt and iron oxidation-state envelope. XPS peak fitting for Co 2p and Fe 2p regions requires refinement before archival-level claims.',
      reportPreview:
        'The processed evidence supports cobalt ferrite spinel phase. XRD confirms spinel reflections and XPS supports the expected oxidation-state envelope. XPS peak fitting for Co 2p and Fe 2p regions requires refinement before archival-level claims. The phase and surface evidence are strong; export with fit review notes.',
      keyEvidence: [
        'XRD confirms cobalt ferrite spinel reflections at 30.0, 35.4, 43.1, 57.0, and 62.6 deg 2theta.',
        'XPS supports expected cobalt and iron oxidation-state envelope.',
        'XPS peak fitting for Co 2p and Fe 2p regions requires refinement.',
      ],
      supportingData: [
        {
          technique: 'XRD',
          evidence: 'Cobalt ferrite spinel reflections confirmed in XRD pattern',
          strength: 'Ready' as const,
          dataset: 'xrd-cofe2o4-control',
          caveat: 'XRD supports phase assignment but surface fitting is pending.',
        },
        {
          technique: 'XPS',
          evidence: 'XPS supports expected cobalt and iron oxidation-state envelope',
          strength: 'In Progress' as const,
          dataset: 'xps-cofe2o4-demo',
          caveat: 'Co 2p and Fe 2p peak fitting requires refinement.',
        },
      ] satisfies SupportingDataItem[],
      validationNotes: [
        'Review and refine XPS peak fitting for Co 2p and Fe 2p regions.',
        'Compare fitted oxidation states against reference cobalt ferrite spectra.',
        'Export notebook report with fit review notes before archival.',
      ],
      runLog: [
        ['Processing run', 'xrd-run-039'],
        ['Refinement', 'refine-039'],
        ['Dataset', 'xrd-cofe2o4-control'],
        ['Workflow version', 'difaryx-analysis-v0.1'],
      ],
      phaseLabel: 'Cobalt ferrite spinel phase',
      peakDetection: '6 ferrite reflections detected in the XRD pattern.',
    };
  }

  /* ── Fe₃O₄ Nanoparticles ────────────────────────────────── */
  if (projectId === 'fe3o4-nanoparticles') {
    return {
      experimentTitle: 'Exp-040: Fe₃O₄ Nanoparticle Surface Signature',
      summary:
        'FTIR/Raman Evidence: Iron oxide nanoparticle signatures suggested by metal-oxygen band and Raman band pattern, with surface hydroxyl contribution visible.',
      discussion:
        'FTIR and Raman evidence suggests iron oxide nanoparticle signatures with surface hydroxyl contribution. The FTIR metal-oxygen band indicates iron oxide lattice vibration, while the Raman band pattern suggests magnetite-like nanoparticle signatures. XRD data is needed to distinguish Fe₃O₄ from gamma-Fe₂O₃.',
      reportPreview:
        'FTIR and Raman evidence suggests iron oxide nanoparticle signatures with surface hydroxyl contribution. The assignment remains in progress because XRD data is needed to distinguish Fe₃O₄ from gamma-Fe₂O₃. Particle size distribution also requires characterization via TEM or DLS.',
      keyEvidence: [
        'FTIR metal-oxygen band indicates iron oxide lattice vibration.',
        'Raman band pattern suggests magnetite-like nanoparticle signatures.',
        'Surface hydroxyl contribution remains visible in FTIR.',
      ],
      supportingData: [
        {
          technique: 'FTIR',
          evidence: 'Metal-oxygen band indicates iron oxide lattice vibration',
          strength: 'Ready' as const,
          dataset: 'ftir-fe3o4-nanoparticles-demo',
          caveat: 'FTIR supports iron oxide assignment but cannot distinguish Fe₃O₄ from gamma-Fe₂O₃.',
        },
        {
          technique: 'Raman',
          evidence: 'Raman band pattern suggests magnetite-like nanoparticle signatures',
          strength: 'In Progress' as const,
          dataset: 'raman-fe3o4-nanoparticles-demo',
          caveat: 'Raman supports nanoparticle signature but XRD confirmation is needed.',
        },
      ] satisfies SupportingDataItem[],
      validationNotes: [
        'Run XRD measurement to distinguish Fe₃O₄ from gamma-Fe₂O₃.',
        'Characterize particle size distribution via TEM or DLS.',
        'Review surface hydroxyl contribution in context of nanoparticle synthesis.',
      ],
      runLog: [
        ['Processing run', 'ftir-run-040'],
        ['Refinement', 'refine-040'],
        ['Dataset', 'ftir-fe3o4-nanoparticles-demo'],
        ['Workflow version', 'difaryx-analysis-v0.1'],
      ],
      phaseLabel: 'Iron oxide nanoparticle signatures',
      peakDetection: 'Raman and FTIR bands suggest iron oxide nanoparticle signatures.',
    };
  }

  /* ── Fallback for unknown projects ───────────────────────── */
  return {
    experimentTitle: 'No matched experiment',
    summary:
      'No matched processing result is linked to this project. Load compatible data before generating notebook evidence.',
    discussion:
      'No matched processing result is linked to this project. Load compatible data before generating notebook evidence.',
    reportPreview:
      'No matched processing result is linked to this project. Load compatible data before generating report-ready discussion.',
    keyEvidence: [
      'No matched processing result linked to this project.',
    ],
    supportingData: [] satisfies SupportingDataItem[],
    validationNotes: [
      'Load a matched processing result before notebook export.',
      'Evidence review is not generated for this project yet.',
    ],
    runLog: [
      ['Processing run', 'No matched processing result'],
      ['Refinement', 'N/A'],
      ['Dataset', 'No matched dataset'],
      ['Workflow version', 'difaryx-analysis-v0.1'],
    ],
    phaseLabel: 'No matched phase',
    peakDetection: 'No peak detection display is available until compatible evidence is processed.',
  };
}

function sanitizeTraceStep(step: string) {
  const legacyModelStep = 'gemini' + '_reasoner';
  const legacyModelLabel = 'Gemini' + ' reasoner';
  return step
    .replaceAll(legacyModelStep, 'interpretation_refinement')
    .replaceAll(legacyModelLabel, 'interpretation refinement');
}

export default function NotebookLab() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const project = (getProject(searchParams.get('project')) ?? getProject(null))!;
  const runId = searchParams.get('run');
  const entryId = searchParams.get('entry');
  const experimentId = searchParams.get('experiment');
  const agentRun = runId ? getRun(runId) : null;
  const [templateMode, setTemplateMode] = useState<NotebookTemplateMode>(
    () => normalizeNotebookTemplateMode(searchParams.get('template')),
  );
  const [feedback, setFeedback] = useState('');
  const [experimentModalOpen, setExperimentModalOpen] = useState(false);
  const [isProjectRailCollapsed, setIsProjectRailCollapsed] = useState(false);
  const [expandedProjectIds, setExpandedProjectIds] = useState<string[]>(() => [searchParams.get('project') ?? 'cu-fe2o4-spinel']);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => searchParams.get('project') ?? project.id);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(() => searchParams.get('experiment'));
  const [activeNotebookTab, setActiveNotebookTab] = useState<ActiveNotebookTab>('Objective');
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [localExperiments, setLocalExperiments] = useState(() => getLocalExperiments());
  const [wizardNotebooks, setWizardNotebooks] = useState<ProjectNotebook[]>(() => getLocalProjectNotebooks());
  const activeWizardNotebook = useMemo(() => {
    const projectParam = searchParams.get('project');
    if (!projectParam) return null;
    // Demo project IDs always use the demo notebook branch — never treat them as wizard notebooks
    if (demoProjects.some((p) => p.id === projectParam)) return null;
    // Re-read from localStorage so navigation to a newly-created notebook always resolves
    const freshNotebooks = getLocalProjectNotebooks();
    const found = freshNotebooks.find((nb) => nb.id === projectParam) ?? null;
    // Keep sidebar state in sync if a new notebook was found
    if (found && !wizardNotebooks.find((nb) => nb.id === projectParam)) {
      setWizardNotebooks(freshNotebooks);
    }
    return found;
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps
  const [observations, setObservations] = useState<string[]>([]);
  const [attachedRun, setAttachedRun] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [observationOpen, setObservationOpen] = useState(false);
  const [observationDraft, setObservationDraft] = useState('');
  const [attachRunOpen, setAttachRunOpen] = useState(false);
  const runResult = useMemo(() => loadAgentRunResult(project.id), [project.id]);
  const workspaceRun = useMemo(() => getProcessingRun(runId), [runId]);
  const workspaceDataset = useMemo(
    () => (workspaceRun ? getDataset(workspaceRun.datasetId) : null),
    [workspaceRun],
  );
  const availableRuns = useMemo(
    () => getProcessingRuns().filter((run) => run.projectId === project.id),
    [project.id, feedback],
  );
  const selectedExperiment = useMemo(() => {
    const projectExperiments = localExperiments.filter((experiment) => experiment.projectId === project.id);
    return (
      projectExperiments.find((experiment) => experiment.id === experimentId) ??
      [...projectExperiments].reverse().find((experiment) => experiment.conditionLock) ??
      null
    );
  }, [experimentId, localExperiments, project.id]);
  const experimentConditionLock = selectedExperiment?.conditionLock ?? getExperimentConditionLock(project.id, experimentId);
  const experimentConditionLines = getConditionLockSectionLines(experimentConditionLock);
  const experimentConditionBoundaryNotes = getConditionBoundaryNotes(experimentConditionLock, project.techniques);
  const experimentConditionStatus = getConditionLockStatusLabel(experimentConditionLock);
  const attachedRunRecord = useMemo(() => getProcessingRun(attachedRun), [attachedRun]);
  const hasMatchedNotebookData = hasMatchedXrdDemoData(project.id);
  const projectNotebookContent = getProjectNotebookContent(project.id);
  const notebookTemplate = NOTEBOOK_TEMPLATES[templateMode];
  const workflowProcessingResult = useMemo(
    () => getLatestProcessingResult(project.id) ?? createProcessingResultFromXrdDemo(project.id),
    [project.id, feedback],
  );
  const workflowRefinement = useMemo(
    () =>
      getLatestAgentDiscussionRefinement(project.id, templateMode) ??
      refineDiscussionFromProcessing(workflowProcessingResult, templateMode),
    [project.id, templateMode, workflowProcessingResult, feedback],
  );
  const workflowNotebookEntry = useMemo(() => {
    const entryFromRoute = getNotebookEntry(entryId);
    if (entryFromRoute?.templateMode === templateMode) return entryFromRoute;
    return (
      getLatestNotebookEntry(project.id, templateMode) ??
      createNotebookEntryFromRefinement(workflowRefinement, templateMode)
    );
  }, [entryId, project.id, templateMode, workflowRefinement, feedback]);
  const workflowReportSection = useMemo(
    () => createReportSectionFromNotebookEntry(workflowNotebookEntry),
    [workflowNotebookEntry],
  );
  const notebookTemplateDetails = NOTEBOOK_TEMPLATE_DETAILS[templateMode];
  const displayNotebookStatus = hasMatchedNotebookData ? notebookTemplateDetails.status : 'Requires dataset';
  const primaryNotebookSection = workflowNotebookEntry.sections[0];
  const supportingNotebookSections = workflowNotebookEntry.sections.slice(1);
  const notebook = useMemo(() => {
    // If we have an agent run, use that data
    if (agentRun) {
      return {
        title: `Characterization Run: ${project.name}`,
        summary: agentRun.outputs.interpretation,
        decision: agentRun.outputs.phase,
        claimStatus: project.claimStatus,
        validationState: project.validationState,
        evidence: agentRun.outputs.evidence,
        warnings: agentRun.outputs.caveats,
        recommendations: agentRun.outputs.recommendations,
        processingPipeline: [
          `Mission: ${agentRun.mission}`,
          `Selected datasets: ${agentRun.outputs.selectedDatasets.join(', ')}`,
          `Detected ${agentRun.outputs.detectedPeaks?.length ?? 0} peaks`,
          'Prepared evidence-linked interpretation with traceable decision context',
        ],
        peakDetection: `${agentRun.outputs.detectedPeaks?.length ?? 0} peaks detected in evidence review`,
        phaseInterpretation: `${agentRun.outputs.phase} - ${agentRun.outputs.confidenceLabel}`,
      };
    }
    
    const base = generateNotebookSections(project, runResult);
    if (!workspaceRun) return base;

    const claimStatus = workspaceRun.matchResult?.claimStatus ?? project.claimStatus;

    return {
      ...base,
      summary: `${workspaceRun.technique} workspace run generated from ${workspaceDataset?.fileName ?? 'selected dataset'} with ${workspaceRun.detectedFeatures.length} detected features and traceable processing parameters.`,
      decision: workspaceRun.matchResult?.phase ?? `${workspaceRun.technique} evidence saved for ${project.name}`,
      claimStatus,
      validationState: project.validationState,
      evidence: workspaceRun.evidence.map((item) => item.claim),
      warnings: workspaceRun.matchResult?.missingPeaks.length
        ? [`Missing or weak references: ${workspaceRun.matchResult.missingPeaks.join(', ')}.`]
        : [],
      recommendations: project.recommendations,
      processingPipeline: [
        `Dataset: ${workspaceDataset?.fileName ?? workspaceRun.datasetId}.`,
        `Technique: ${workspaceRun.technique}.`,
        ...Object.entries(workspaceRun.parameters).map(([key, value]) => `${key}: ${String(value)}`),
        `Detected features: ${workspaceRun.detectedFeatures.length}.`,
        'Saved evidence and generated notebook section.',
      ],
      peakDetection: `${workspaceRun.detectedFeatures.length} ${workspaceRun.technique === 'XRD' ? 'peaks' : 'features'} detected in the workspace run.`,
      phaseInterpretation: workspaceRun.matchResult
        ? `${workspaceRun.matchResult.phase}. ${workspaceRun.matchResult.caveat}`
        : base.phaseInterpretation,
    };
  }, [project, runResult, workspaceDataset, workspaceRun]);
  const keyEvidenceItems = hasMatchedNotebookData
    ? projectNotebookContent.keyEvidence
    : [
        'No matched processing result is linked to this notebook entry.',
        'Evidence has not been generated for this project in the deterministic XRD demo workflow.',
        'Load a compatible dataset before creating report-ready discussion.',
      ];
  const technicalTrace = hasMatchedNotebookData
    ? (project.id === 'cufe2o4-sba15' ? SBA15_DETERMINISTIC_TRACE
      : project.id === 'nife2o4' ? NIFE2O4_DETERMINISTIC_TRACE
      : project.id === 'cofe2o4' ? COFE2O4_DETERMINISTIC_TRACE
      : project.id === 'fe3o4-nanoparticles' ? FE3O4_DETERMINISTIC_TRACE
      : DETERMINISTIC_TRACE)
    : ['No matched processing result', 'Requires compatible dataset', 'Evidence not generated'];

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjectIds((current) =>
      current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId],
    );
  };

  const openProjectNotebook = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedExperimentId(null);
    navigate(`/notebook?project=${projectId}`);
  };

  const openExperimentNotebook = (nextExperimentId: string, nextProjectId: string) => {
    setSelectedProjectId(nextProjectId);
    setSelectedExperimentId(nextExperimentId);
    setExpandedProjectIds((current) => current.includes(nextProjectId) ? current : [...current, nextProjectId]);
    navigate(`/notebook?project=${nextProjectId}&experiment=${nextExperimentId}`);
  };

  const confidenceLabel = resolveConfidenceLabel(
    notebook.claimStatus,
    hasMatchedNotebookData,
    project.validationGaps.length,
  );

  const evidenceTraceItems = [
    ...project.techniqueMetadata.map((item) => ({
      technique: item.label,
      role: item.role,
      status: item.status,
      confidence: item.dataAvailable ? (hasMatchedNotebookData ? displayNotebookStatus : 'Pending evidence') : 'Not linked',
    })),
    ...(['XRD', 'Raman', 'FTIR', 'XPS'] as const)
      .filter((technique) => !project.techniqueMetadata.some((item) => item.label === technique))
      .map((technique) => ({
        technique,
        role: technique === 'XRD' ? 'Bulk phase' : technique === 'XPS' ? 'Surface state' : technique === 'FTIR' ? 'Bonding context' : 'Lattice mode',
        status: 'not-linked',
        confidence: 'Optional validation',
      })),
  ];

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 1800);
  };

  const exportFeedbackMessage = (format: DemoExportFormat) => {
    if (format === 'md') {
      return 'Markdown report downloaded.';
    }
    if (format === 'png') {
      return 'PNG snapshot downloaded.';
    }
    return 'Available in the connected beta workflow.';
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/notebook?project=${project.id}&template=${templateMode}&entry=${workflowNotebookEntry.id}${workspaceRun ? `&run=${workspaceRun.id}` : ''}`;
    try {
      await navigator.clipboard.writeText(url);
      showFeedback('Share link copied');
    } catch {
      showFeedback(`Share link ready: ${url}`);
    }
  };

  const exportMarkdown = () => {
    const lockedContext = getLockedContext(project.id);
    const evidenceMarkdown = keyEvidenceItems.map((item) => `- ${item}`).join('\n');
    const validationMarkdown = projectNotebookContent.validationNotes.map((item) => `- ${item}`).join('\n');
    const traceMarkdown = technicalTrace.map((step, index) => `${index + 1}. ${sanitizeTraceStep(step)}`).join('\n');
    const sourceRunLines = projectNotebookContent.runLog.map(([label, value]) => `${label}: ${value}`).join('\n');
    const claimBoundaryMarkdown = (
      workflowNotebookEntry.sections.find((section) => section.heading === 'Claim Boundary')?.lines ?? [
        'Requires validation: matched processing result is required before claim-boundary review.',
      ]
    ).map((line) => `- ${line}`).join('\n');
    const experimentConditionMarkdown = [
      ...experimentConditionLines,
      ...experimentConditionBoundaryNotes.map((note) => `Claim boundary: ${note}`),
    ].map((line) => `- ${line}`).join('\n');
    const lockedContextMarkdown = lockedContext
      ? `## Locked Scientific Context

Sample Identity: ${lockedContext.sampleIdentity}
Technique: ${lockedContext.technique}
Source Dataset: ${lockedContext.sourceDataset}
Source Processing Path: ${lockedContext.sourceProcessingPath}
Reference Scope: ${lockedContext.referenceScope}
Claim Boundary: ${lockedContext.claimBoundary}

`
      : '';
    const markdown = `# DIFARYX Notebook Report

## Experiment
${projectNotebookContent.experimentTitle}

${lockedContextMarkdown}## Source Workflow
XRD processing + interpretation refinement

## Pipeline
Processing Result → Interpretation Refinement → Notebook Entry → Report Section

## Mode
${notebookTemplate.label}

## Status
${displayNotebookStatus}

## Summary
${projectNotebookContent.summary}

## Refined Discussion
${projectNotebookContent.discussion}

## Report-ready Discussion
${projectNotebookContent.reportPreview}

## Key Evidence
${evidenceMarkdown}

## Claim Boundary
${claimBoundaryMarkdown}

## Experiment Conditions
${experimentConditionMarkdown}

## Validation Notes
${validationMarkdown}

## Technical Trace
${traceMarkdown}

## Provenance
${sourceRunLines}
`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIFARYX_${project.id}_Notebook_Report.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showFeedback('Markdown report downloaded.');
  };

  const exportNotebook = (format: DemoExportFormat) => {
    if (!hasMatchedNotebookData) {
      setExportMenuOpen(false);
      showFeedback('Requires matched processing result before export.');
      return;
    }

    if (format === 'md') {
      exportMarkdown();
      setExportMenuOpen(false);
      return;
    }
    if (format === 'png') {
      exportDemoArtifact('png', {
        filenameBase: `DIFARYX_${project.id}_Notebook_Report`,
        title: 'DIFARYX Notebook Report',
        sections: [
          { heading: 'Experiment', lines: [projectNotebookContent.experimentTitle] },
          { heading: 'Summary', lines: [projectNotebookContent.summary] },
          { heading: 'Report-ready Discussion', lines: [projectNotebookContent.reportPreview] },
          { heading: 'Key Evidence', lines: keyEvidenceItems },
          { heading: 'Experiment Conditions', lines: experimentConditionLines },
          { heading: 'Status', lines: [displayNotebookStatus] },
          { heading: 'Provenance', lines: projectNotebookContent.runLog.map(([label, value]) => `${label}: ${value}`) },
        ],
      });
      setExportMenuOpen(false);
      showFeedback('PNG snapshot downloaded.');
      return;
    }
    setExportMenuOpen(false);
    showFeedback(exportFeedbackMessage(format));
  };

  const printReport = () => {
    window.print();
    showFeedback('Print dialog opened');
  };

  const addObservation = () => {
    const text = observationDraft.trim() || `${project.name} evidence reviewed in notebook.`;
    const nextObservation = `Added observation ${observations.length + 1}: ${text}`;
    setObservations((current) => [nextObservation, ...current]);
    setObservationDraft('');
    setObservationOpen(false);
    showFeedback('Added observation saved');
  };

  const attachRunToNotebook = (run: ProcessingRun) => {
    setAttachedRun(run.id);
    setAttachRunOpen(false);
    showFeedback(`${run.technique} data attached`);
  };

  const saveWorkflowNotebookEntry = () => {
    if (!hasMatchedNotebookData) {
      showFeedback('Requires matched processing result before saving.');
      return;
    }

    saveProcessingResult(workflowProcessingResult);
    const refinement = refineDiscussionFromProcessing(workflowProcessingResult, templateMode);
    saveAgentDiscussionRefinement(refinement);
    const entry = createNotebookEntryFromRefinement(refinement, templateMode);
    saveNotebookEntry(entry);
    showFeedback(`${NOTEBOOK_TEMPLATES[templateMode].label} entry saved`);
  };

  const copyAgentSummary = async () => {
    const summary = hasMatchedNotebookData
      ? projectNotebookContent.reportPreview
      : 'No matched processing result is linked to this project. Evidence and report discussion are not generated.';
    try {
      await navigator.clipboard.writeText(summary);
      showFeedback('Summary copied');
    } catch {
      showFeedback('Summary ready to copy');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 h-full flex overflow-hidden bg-background">
        <div className={`${isProjectRailCollapsed ? 'w-16' : 'w-72'} border-r border-border bg-surface flex flex-col shrink-0 transition-all duration-200`}>
          <div className="p-3 border-b border-border flex justify-between items-center gap-2">
            {!isProjectRailCollapsed && <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">Projects</h2>}
            <div className="flex items-center gap-1">
              {!isProjectRailCollapsed && <Button variant="ghost" size="sm" className="px-2 h-7" onClick={() => setExperimentModalOpen(true)}><Plus size={14} /></Button>}
              <Button variant="ghost" size="sm" className="px-2 h-7" onClick={() => setIsProjectRailCollapsed((collapsed) => !collapsed)}>
                {isProjectRailCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </Button>
            </div>
          </div>
          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
            {demoProjects.map((item) => {
              const itemHasMatchedData = hasMatchedXrdDemoData(item.id);
              const isExpanded = expandedProjectIds.includes(item.id);
              const isActiveProject = !activeWizardNotebook && item.id === project.id;
              const projectExperiments = localExperiments.filter((experiment) => experiment.projectId === item.id);

              return (
                <div key={item.id}>
                  <div className={`flex items-center gap-1 rounded-md border ${isActiveProject ? 'bg-primary/10 text-primary border-primary/20' : 'text-text-muted hover:bg-surface-hover hover:text-text-main border-transparent'}`}>
                    <button type="button" onClick={() => openProjectNotebook(item.id)} className={`${isProjectRailCollapsed ? 'w-full justify-center px-2' : 'flex-1 px-2'} flex items-center gap-2 py-2 text-left text-xs font-medium leading-snug`}>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-[10px] font-bold">{item.name.slice(0, 2).toUpperCase()}</span>
                      {!isProjectRailCollapsed && (
                        <span className="min-w-0">
                          <span className="block truncate">{item.name}</span>
                          <span className={`mt-0.5 block text-[10px] font-semibold ${itemHasMatchedData ? 'text-primary' : 'text-amber-600'}`}>
                            {itemHasMatchedData ? item.reportReadiness.label : 'Requires dataset'}
                          </span>
                        </span>
                      )}
                    </button>
                    {!isProjectRailCollapsed && (
                      <button type="button" onClick={() => toggleProjectExpansion(item.id)} className="mr-1 rounded p-1 hover:bg-background" aria-label={`Toggle ${item.name} experiments`}>
                        <ChevronDown size={13} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                      </button>
                    )}
                  </div>
                  {!isProjectRailCollapsed && isExpanded && (
                    <div className="ml-9 mt-1 space-y-1 border-l border-border pl-2">
                      <button type="button" onClick={() => openProjectNotebook(item.id)} className={`block w-full rounded px-2 py-1.5 text-left text-[11px] ${isActiveProject && !experimentId ? 'text-primary' : 'text-text-muted hover:text-text-main hover:bg-surface-hover'}`}>
                        {item.notebook.title}
                      </button>
                      {projectExperiments.map((experiment) => (
                        <button key={experiment.id} type="button" onClick={() => openExperimentNotebook(experiment.id, experiment.projectId)} className={`block w-full rounded px-2 py-1.5 text-left text-[11px] ${experiment.id === selectedExperimentId ? 'text-primary bg-primary/5' : 'text-text-muted hover:text-text-main hover:bg-surface-hover'}`}>
                          <span className="block truncate">{experiment.title}</span>
                          <span className="block truncate text-[10px] text-text-dim">{experiment.technique} · {experiment.fileName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {wizardNotebooks.map((nb) => {
              const isActive = nb.id === activeWizardNotebook?.id;
              const statusLabel = nb.workflowStatus === 'evidence_ready' ? 'Evidence ready' : 'Setup ready';
              const statusColor = nb.workflowStatus === 'evidence_ready' ? 'text-primary' : 'text-amber-600';
              const modeLabel = nb.mode === 'research' ? 'Research' : nb.mode === 'rd' ? 'R&D' : 'Analytical Job';
              return (
                <Link
                  key={nb.id}
                  to={`/notebook?project=${nb.id}`}
                  className={`block w-full text-left px-3 py-2 rounded-md text-xs font-medium leading-snug transition-colors border ${
                    isActive
                      ? 'bg-primary/5 text-primary border-primary/20'
                      : 'text-text-muted hover:bg-surface-hover hover:text-text-main border-transparent'
                  }`}
                >
                  {isProjectRailCollapsed ? <span className="block text-center">{nb.title.slice(0, 2).toUpperCase()}</span> : (
                    <>
                      <span>{nb.title}</span>
                      <span className="mt-1 block text-[10px] text-text-dim">{modeLabel}</span>
                      <span className={`mt-0.5 block text-[10px] font-semibold ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto relative">
          {activeWizardNotebook ? (
            <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-[11px] text-text-muted mb-2">
                  <span>Created: {new Date(activeWizardNotebook.createdDate).toLocaleDateString()}</span>
                  <span>|</span>
                  <span>Mode: {activeWizardNotebook.mode === 'research' ? 'Research' : activeWizardNotebook.mode === 'rd' ? 'R&D' : 'Analytical Job'}</span>
                  <span>|</span>
                  <span className={activeWizardNotebook.workflowStatus === 'evidence_ready' ? 'text-primary font-semibold' : 'text-amber-600 font-semibold'}>
                    {activeWizardNotebook.workflowStatus === 'evidence_ready' ? 'Evidence ready' : 'Setup ready'}
                  </span>
                </div>
                <h1 className="text-base font-bold text-text-main">{activeWizardNotebook.title}</h1>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    ['Type', getNotebookTypeBadge(activeWizardNotebook.mode)],
                    ['Status', activeWizardNotebook.workflowStatus === 'evidence_ready' ? 'Evidence ready' : 'Setup ready'],
                  ].map(([label, value]) => (
                    <span key={label} className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                      <span className="text-text-dim">{label}: </span>
                      <span className="text-text-main">{value}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Workflow pipeline */}
              <div className="mb-4 rounded-lg border border-border bg-surface p-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-dim mb-2">Workflow</h2>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {activeWizardNotebook.mode === 'research'
                    ? 'Research Objective → Experimental Context → Evidence Workspace → Agent Reasoning → Validation Gap → Next Experiment / Decision → Decision Log → Notebook Memory → Report'
                    : activeWizardNotebook.mode === 'rd'
                    ? 'R&D Objective → Development Context → Evidence Workspace → Agent Reasoning → Validation Gap → Next Action / Decision → Decision Log → Notebook Memory → Report'
                    : 'Analytical Objective → Analytical Context → Evidence Workspace → Agent Reasoning → Validation Gap → Result Decision / Disposition → Decision Log → Notebook Memory → Report'}
                </p>
              </div>

              {/* Objective */}
              {(() => {
                const sf = activeWizardNotebook.setupFields ?? {};
                const objectiveText =
                  activeWizardNotebook.objective?.trim() ||
                  (activeWizardNotebook.mode === 'research'
                    ? sf['projectDescription'] || sf['scientificQuestion'] || ''
                    : activeWizardNotebook.mode === 'rd'
                    ? sf['projectDescription'] || sf['productGoal'] || sf['decisionNeeded'] || ''
                    : sf['jobDescription'] || sf['analysisPurpose'] || '');
                const objectiveLabel =
                  activeWizardNotebook.mode === 'research' ? 'Research Objective'
                  : activeWizardNotebook.mode === 'rd' ? 'R&D Objective'
                  : 'Analytical Objective';
                return (
                  <div className="mb-4 rounded-lg border border-border bg-surface p-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-text-dim mb-2">{objectiveLabel}</h2>
                    {objectiveText ? (
                      <p className="text-sm text-text-main leading-relaxed">{objectiveText}</p>
                    ) : (
                      <p className="text-xs text-text-muted italic">No objective text was provided during setup.</p>
                    )}
                  </div>
                );
              })()}

              {/* Setup fields — context section, non-empty values only */}
              {(() => {
                const sf = activeWizardNotebook.setupFields ?? {};
                // For each mode, pick the context fields (exclude the one already shown as objective)
                const contextKeys =
                  activeWizardNotebook.mode === 'research'
                    ? ['sampleSystem', 'plannedTechniques', 'scientificQuestion', 'projectDescription']
                    : activeWizardNotebook.mode === 'rd'
                    ? ['productGoal', 'targetKpi', 'decisionNeeded', 'projectDescription']
                    : ['sampleSubmitted', 'analysisPurpose', 'methodSop', 'jobDescription'];
                const entries = contextKeys
                  .map((k) => [k, sf[k]] as [string, string])
                  .filter(([, v]) => v && v.trim());
                if (entries.length === 0) return null;
                const contextLabel =
                  activeWizardNotebook.mode === 'research' ? 'Experimental Context'
                  : activeWizardNotebook.mode === 'rd' ? 'Development Context'
                  : 'Analytical Context';
                const keyLabels: Record<string, string> = {
                  projectDescription: 'Project Description',
                  scientificQuestion: 'Scientific Question',
                  sampleSystem: 'Sample System',
                  plannedTechniques: 'Planned Techniques',
                  productGoal: 'Product / Process Goal',
                  targetKpi: 'Target KPI',
                  decisionNeeded: 'Decision Needed',
                  jobDescription: 'Job / Request Description',
                  sampleSubmitted: 'Sample Submitted',
                  analysisPurpose: 'Analysis Purpose',
                  methodSop: 'Method / SOP',
                };
                return (
                  <div className="mb-4 rounded-lg border border-border bg-surface p-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-text-dim mb-3">{contextLabel}</h2>
                    <div className="space-y-2">
                      {entries.map(([key, value]) => (
                        <div key={key} className="flex gap-3 text-sm">
                          <span className="text-text-dim min-w-[140px] shrink-0">{keyLabels[key] ?? key}:</span>
                          <span className="text-text-main">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Data import status */}
              {(() => {
                const imp = activeWizardNotebook.initialDataImport;
                const hasFiles = imp && !imp.skipped && imp.files.length > 0;
                return (
                  <div className="mb-4 rounded-lg border border-border bg-surface p-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-text-dim mb-3">Data Import</h2>
                    {hasFiles ? (
                      <div className="space-y-1.5">
                        <p className="text-xs text-primary font-semibold mb-2">
                          {imp!.files.length} file{imp!.files.length > 1 ? 's' : ''} attached
                        </p>
                        {imp!.files.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-text-muted">
                            <FileText size={12} className="text-primary shrink-0" />
                            <span className="font-medium text-text-main">{file.name}</span>
                            <span className="text-text-dim">({file.type || 'unknown'})</span>
                            <span className="ml-auto text-[10px] text-amber-600 font-semibold uppercase">Pending parse</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted">No data attached yet. Open a workspace to begin evidence collection.</p>
                    )}
                  </div>
                );
              })()}

              {/* Action buttons */}
              <div className="mb-4 flex flex-wrap gap-2">
                <Link
                  to="/workspace/multi"
                  className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  Open Workspace
                </Link>
                <Link
                  to="/history"
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
                >
                  View History
                </Link>
                <button
                  type="button"
                  disabled
                  title="Import data files from the workspace or dashboard."
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-text-muted opacity-50 cursor-not-allowed"
                >
                  Add Data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${activeWizardNotebook.title}"? This cannot be undone.`)) {
                      deleteProjectNotebook(activeWizardNotebook.id);
                      setWizardNotebooks(getLocalProjectNotebooks());
                      navigate('/notebook');
                    }
                  }}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-red-300 px-3 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete Project
                </button>
              </div>

              {/* Next steps */}
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Next Steps</h2>
                <ul className="space-y-1 text-xs text-text-muted">
                  {activeWizardNotebook.workflowStatus !== 'evidence_ready' && (
                    <li className="flex items-start gap-2"><ArrowRight size={12} className="mt-0.5 text-primary shrink-0" /> Add experiments or import data files to begin evidence collection.</li>
                  )}
                  <li className="flex items-start gap-2"><ArrowRight size={12} className="mt-0.5 text-primary shrink-0" /> Open a workspace to process evidence and generate a processing result.</li>
                  <li className="flex items-start gap-2"><ArrowRight size={12} className="mt-0.5 text-primary shrink-0" /> Run the agent to generate a reasoning trace and decision.</li>
                  <li className="flex items-start gap-2"><ArrowRight size={12} className="mt-0.5 text-primary shrink-0" /> Save a notebook entry to preserve the scientific memory.</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              {/* Compact notebook header */}
              <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur border-b border-border px-4 py-2">
                <div className="flex items-center justify-between gap-2 min-h-0">
                  <div className="flex items-center gap-2 text-[11px] text-text-muted flex-wrap min-w-0">
                    <span className="text-sm font-bold text-text-main">Notebook Lab</span>
                    <span>·</span>
                    <span className="font-semibold text-text-main">{project.name}</span>
                    <span>·</span>
                    <span>{notebookTemplate.label}</span>
                    <span>·</span>
                    <span className={hasMatchedNotebookData ? 'text-primary font-semibold' : 'text-amber-600 font-semibold'}>{displayNotebookStatus}</span>
                    {(() => {
                      const lockedContext = getLockedContext(project.id);
                      return lockedContext ? (
                        <span className="rounded border border-amber-500/30 bg-amber-500/5 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          Locked context preserved
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {feedback && (
                      <span className="hidden sm:inline-flex items-center rounded border border-primary/20 bg-primary/10 px-2 text-[11px] font-semibold text-primary">
                        {feedback}
                      </span>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs px-2" onClick={() => setIsEvidenceDrawerOpen(true)}><FlaskConical size={12} /> Evidence Trace</Button>
                    <div className="relative">
                      <Button variant="outline" size="sm" disabled={!hasMatchedNotebookData} title={!hasMatchedNotebookData ? 'Requires matched processing result before export.' : undefined} className="gap-1.5 h-7 text-xs px-2" onClick={() => setExportMenuOpen((open) => !open)}><Download size={12} /> Export</Button>
                      {exportMenuOpen && (
                        <div className="absolute right-0 top-9 z-20 w-52 rounded-lg border border-border bg-white p-2 shadow-xl">
                          <button type="button" onClick={() => exportNotebook('md')} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-surface-hover">Export Markdown<Download size={13} /></button>
                          <button type="button" onClick={() => exportNotebook('png')} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-surface-hover">Export PNG Snapshot<Download size={13} /></button>
                          {(['pdf', 'docx', 'csv'] as DemoExportFormat[]).map((format) => (
                            <button key={format} type="button" disabled title="Available in the connected beta workflow." className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-400 cursor-not-allowed">{format.toUpperCase()} Export - Connected beta workflow</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="primary" size="sm" disabled={!hasMatchedNotebookData} title={!hasMatchedNotebookData ? 'Requires matched processing result before saving.' : undefined} className="gap-1.5 h-7 text-xs px-2" onClick={saveWorkflowNotebookEntry}><Save size={12} /> Save</Button>
                    <div className="relative">
                      <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs px-2" onClick={() => setMoreMenuOpen((open) => !open)}><MoreHorizontal size={12} /> More</Button>
                      {moreMenuOpen && (
                        <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-border bg-white p-2 shadow-xl">
                          <button type="button" onClick={() => { copyShareLink(); setMoreMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-surface-hover"><Share2 size={12} /> Share</button>
                          <button type="button" onClick={() => { printReport(); setMoreMenuOpen(false); }} disabled={!hasMatchedNotebookData} title={!hasMatchedNotebookData ? 'Requires matched processing result before printing.' : undefined} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-surface-hover disabled:text-slate-400 disabled:cursor-not-allowed"><Printer size={12} /> Print</button>
                          <button type="button" onClick={() => { setObservationOpen(true); setMoreMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-surface-hover"><Plus size={12} /> Observe</button>
                          <button type="button" onClick={() => { setAttachRunOpen(true); setMoreMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-surface-hover"><FileText size={12} /> Attach</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-text-muted">
                  <span className="font-semibold">Evidence linked: <span className="text-text-main">{hasMatchedNotebookData ? 'Linked' : 'Pending'}</span></span>
                  <span>·</span>
                  <span className="font-semibold">Validation gaps: <span className="text-text-main">{project.validationGaps.length ? `${project.validationGaps.length} open` : 'Closed'}</span></span>
                  <span>·</span>
                  <span className="font-semibold">Confidence: <span className="text-text-main">{confidenceLabel}</span></span>
                  <span>·</span>
                  <span className="font-semibold">Export: <span className="text-text-main">{hasMatchedNotebookData ? 'Ready' : 'Blocked'}</span></span>
                </div>
                <div className="flex items-center gap-0.5 mt-1.5 -mb-px">
                  {NOTEBOOK_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveNotebookTab(tab)}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-t border-b-2 transition-colors ${
                        activeNotebookTab === tab
                          ? 'text-primary border-primary bg-primary/5'
                          : 'text-text-muted border-transparent hover:text-text-main hover:border-border'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

          {observationOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4">
              <div className="w-full max-w-lg rounded-xl border border-border bg-white p-5 shadow-2xl">
                <h2 className="text-base font-bold text-text-main">Add Observation</h2>
                <p className="mt-1 text-sm text-text-muted">Add a demo notebook note tied to the current project context.</p>
                <textarea
                  value={observationDraft}
                  onChange={(event) => setObservationDraft(event.target.value)}
                  placeholder="Example: Raman A1g mode remains consistent with the XRD phase assignment."
                  className="mt-4 h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-main outline-none focus:border-primary"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setObservationOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={addObservation}>Add Observation</Button>
                </div>
              </div>
            </div>
          )}

          {attachRunOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4">
              <div className="w-full max-w-2xl rounded-xl border border-border bg-white p-5 shadow-2xl">
                <h2 className="text-base font-bold text-text-main">Attach Data</h2>
                <p className="mt-1 text-sm text-text-muted">Select saved processing data to link into this notebook.</p>
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                  {availableRuns.length === 0 && (
                    <p className="rounded-md border border-border bg-background p-3 text-sm text-text-muted">
                      No upstream processing data attached yet. Save processed evidence in a workspace, then attach it here.
                    </p>
                  )}
                  {availableRuns.slice().reverse().map((run) => {
                    const dataset = getDataset(run.datasetId);
                    return (
                      <button
                        key={run.id}
                        type="button"
                        onClick={() => attachRunToNotebook(run)}
                        className="block w-full rounded-md border border-border bg-background p-3 text-left text-sm hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="font-semibold text-text-main">{run.technique} run - {dataset?.fileName ?? run.datasetId}</span>
                        <span className="mt-1 block text-xs text-text-muted">
                          {new Date(run.timestamp).toLocaleString()} / {run.detectedFeatures.length} features / {formatClaimStatus(run.matchResult?.claimStatus || 'supported')}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setAttachRunOpen(false)}>Back to notebook</Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
          <div className="p-3 max-w-7xl w-full mx-auto">

            {activeNotebookTab === 'Objective' && (() => {
              const lockedContext = getLockedContext(project.id);
              const characterizationGoal = hasMatchedNotebookData
                ? projectNotebookContent.phaseLabel
                : `Establish a matched processing result for ${project.name} before characterization goal is defined.`;
              const topDecision = project.nextDecisions[0];
              const decisionQuestion = topDecision
                ? topDecision.description || topDecision.label
                : hasMatchedNotebookData
                  ? `Is the current evidence sufficient to advance the ${project.name} interpretation beyond validation-limited status?`
                  : `What dataset is required to begin ${project.name} characterization?`;
              const objectiveRows: Array<[string, React.ReactNode, boolean?]> = [
                ['Research Objective', project.objective],
                ['Sample system', lockedContext?.sampleIdentity ?? project.material],
                ['Techniques', project.techniques.join(', ')],
                ['Condition lock', experimentConditionStatus],
                ...(lockedContext?.sourceDataset ? [['Source dataset', lockedContext.sourceDataset] as [string, React.ReactNode]] : []),
                ['Characterization Goal', characterizationGoal],
                ['Decision Question', decisionQuestion, true],
              ];
              return (
              <div className="space-y-2">
                {!hasMatchedNotebookData && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Notebook status: </span>
                    <span className="text-xs text-text-muted">No matched processing result. Load a compatible dataset to generate evidence and report discussion.</span>
                  </div>
                )}
                <div className="rounded-md border border-border bg-surface divide-y divide-border">
                  {objectiveRows.map(([label, value, highlight]) => (
                    <div key={label} className={`flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-baseline sm:gap-3 ${highlight ? 'bg-primary/5' : ''}`}>
                      <div className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider sm:w-40 ${highlight ? 'text-primary' : 'text-text-dim'}`}>{label}</div>
                      <div className="text-sm leading-snug text-text-main">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1.5">Notebook Mode</div>
                  <div className="grid grid-cols-1 gap-1.5 md:grid-cols-3">
                    {NOTEBOOK_TEMPLATE_MODES.map((mode) => {
                      const template = NOTEBOOK_TEMPLATES[mode];
                      const details = NOTEBOOK_TEMPLATE_DETAILS[mode];
                      const isSelected = templateMode === mode;
                      return (
                        <button key={mode} type="button" aria-pressed={isSelected} onClick={() => setTemplateMode(mode)}
                          className={`rounded-md border px-2.5 py-2 text-left transition-colors ${isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-text-muted hover:border-primary/30 hover:text-text-main'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-bold text-text-main">{template.label}</div>
                            {isSelected && <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">Selected</span>}
                          </div>
                          <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{details.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              );
            })()}

            {activeNotebookTab === 'Evidence' && (
              <div className="space-y-2">
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Peak Detection: </span>
                  <span className="text-sm text-text-main">{projectNotebookContent.peakDetection}</span>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Key Evidence</div>
                  <div className="space-y-1">
                    {keyEvidenceItems.map((item) => (
                      <div key={item} className="flex items-start gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text-main">
                        <span className="text-primary mt-0.5 shrink-0">–</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Evidence Sources</div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {hasMatchedNotebookData ? projectNotebookContent.supportingData.map((item) => (
                      <div key={item.technique} className="rounded-md border border-border bg-surface px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-text-main">{item.technique}</span>
                          <span className={`text-xs font-semibold ${item.strength === 'Review' ? 'text-amber-600' : item.strength === 'Ready' ? 'text-primary' : 'text-cyan'}`}>{item.strength}</span>
                        </div>
                        <p className="mt-1 text-sm leading-snug text-text-main">{item.evidence}</p>
                        <p className="mt-0.5 text-[11px] text-text-muted">Dataset: {item.dataset}</p>
                        <p className="text-[11px] text-text-muted">{item.caveat}</p>
                      </div>
                    )) : (
                      <div className="col-span-2 rounded-md border border-dashed border-border bg-surface/50 px-3 py-2 text-center">
                        <p className="text-xs text-text-muted">No evidence sources linked yet. Process data in a workspace to generate evidence.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Experiment Conditions: </span>
                      <span className="text-sm font-bold text-text-main">{experimentConditionStatus}</span>
                    </div>
                    <div className="text-[11px] text-text-muted">Locked at: {formatConditionLockTimestamp(experimentConditionLock)}</div>
                  </div>
                  <div className="space-y-0.5">
                    {experimentConditionLines.map((line) => (
                      <div key={line} className="rounded border border-border bg-background px-2 py-0.5 text-[11px] text-text-muted">{line}</div>
                    ))}
                  </div>
                  {experimentConditionBoundaryNotes.length > 0 && (
                    <div className="mt-1.5 rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-0.5">Condition-aware claim boundary</div>
                      {experimentConditionBoundaryNotes.slice(0, 3).map((note) => (
                        <p key={note} className="text-[11px] leading-snug text-text-muted">- {note}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeNotebookTab === 'Interpretation' && (
              <div className="space-y-2">
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Phase Identification: </span>
                      <span className="text-sm font-semibold text-text-main">{hasMatchedNotebookData ? projectNotebookContent.phaseLabel : `No phase assignment for ${project.name} until matched data is linked.`}</span>
                    </div>
                    <span className="text-[11px] text-text-muted">Confidence: {confidenceLabel}</span>
                  </div>
                </div>
                <div className="rounded-md border border-primary/20 bg-surface px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Reasoning Summary — {notebookTemplateDetails.primaryLabel}</div>
                  <p className="text-sm leading-snug text-text-main">
                    {hasMatchedNotebookData ? projectNotebookContent.discussion : 'No matched processing result is linked to this notebook entry.'}
                  </p>
                  <div className="mt-1.5 rounded border border-primary/20 bg-primary/5 px-2 py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Discussion readiness: </span>
                    <span className="text-xs font-semibold text-text-main">{displayNotebookStatus}: {hasMatchedNotebookData ? notebookTemplateDetails.output : 'Load compatible data before report-ready discussion.'}</span>
                  </div>
                </div>
                {hasMatchedNotebookData && projectNotebookContent.supportingData.length > 0 && (
                  <div className="rounded-md border border-border bg-surface px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Cross-Technique Consistency</div>
                    <div className="space-y-1">
                      {projectNotebookContent.supportingData.map((item) => (
                        <div key={item.technique} className="flex items-start gap-2 rounded border border-border bg-background px-2 py-1 text-xs">
                          <span className="font-bold text-text-main w-14 shrink-0">{item.technique}</span>
                          <span className="text-text-muted flex-1">{item.evidence}</span>
                          <span className={`shrink-0 font-semibold ${item.strength === 'Review' ? 'text-amber-600' : item.strength === 'Ready' ? 'text-primary' : 'text-cyan'}`}>{item.strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasMatchedNotebookData && (
                  <div className="rounded-md border border-amber-500/20 bg-surface px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">Caveats</div>
                    <div className="space-y-0.5">
                      {projectNotebookContent.supportingData.map((item) => (
                        <p key={`caveat-${item.technique}`} className="text-xs leading-snug text-text-muted">– <span className="font-semibold text-text-main">{item.technique}:</span> {item.caveat}</p>
                      ))}
                    </div>
                  </div>
                )}
                {hasMatchedNotebookData && (() => {
                  const claimSection = workflowNotebookEntry.sections.find((s) => s.heading === 'Claim Boundary');
                  return claimSection ? (
                    <div className="rounded-md border border-border bg-surface px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Claim Boundary</div>
                      {claimSection.lines.map((line) => <p key={line} className="text-sm leading-snug text-text-main">{line}</p>)}
                    </div>
                  ) : null;
                })()}
                {hasMatchedNotebookData && supportingNotebookSections.filter(s => s.heading !== 'Claim Boundary').length > 0 && (
                  <div className="rounded-md border border-border bg-surface px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Additional Sections</div>
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                      {supportingNotebookSections.filter(s => s.heading !== 'Claim Boundary').map((section) => (
                        <div key={section.heading} className="rounded border border-border bg-background px-2.5 py-1.5">
                          <div className="text-xs font-bold text-text-main mb-0.5">{section.heading}</div>
                          {section.lines.map((line) => <p key={line} className="text-xs leading-snug text-text-muted">{line}</p>)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Reasoning micro-flow</div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-text-muted">
                    {workflowRefinement.microFlow.map((step, index) => (
                      <React.Fragment key={step}>
                        <span className="rounded-full border border-border bg-background px-2 py-0.5">{step}</span>
                        {index < workflowRefinement.microFlow.length - 1 && <ArrowRight size={11} className="text-primary" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {observations.length > 0 && (
                  <div className="rounded-md border border-border bg-surface px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Observations</div>
                    <div className="space-y-1">
                      {observations.map((obs) => (
                        <div key={obs} className="rounded border border-border bg-background px-2 py-1 text-xs text-text-main">{obs}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeNotebookTab === 'Validation Gap' && (
              <div className="space-y-2">
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">Limitations</div>
                  <div className="space-y-1">
                    {(project.validationGaps.length > 0 ? project.validationGaps : []).map((gap) => (
                      <div key={gap.id} className="rounded border border-border bg-background px-2.5 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold leading-snug text-text-main">{gap.description}</div>
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">{gap.severity}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-text-muted">{gap.suggestedResolution}</p>
                      </div>
                    ))}
                    {project.validationGaps.length === 0 && (
                      <p className="text-sm text-text-muted">No open validation gaps are registered for this project.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Missing Evidence</div>
                  {hasMatchedNotebookData ? (
                    <div className="space-y-1">
                      {projectNotebookContent.supportingData.filter((item) => item.strength !== 'Ready').length === 0 ? (
                        <p className="text-xs text-text-muted">All linked technique evidence is marked ready for this project.</p>
                      ) : projectNotebookContent.supportingData.filter((item) => item.strength !== 'Ready').map((item) => (
                        <div key={`missing-${item.technique}`} className="flex items-start gap-2 rounded border border-border bg-background px-2 py-1 text-xs">
                          <span className="font-bold text-text-main w-14 shrink-0">{item.technique}</span>
                          <span className="text-text-muted flex-1">{item.caveat}</span>
                          <span className={`shrink-0 font-semibold ${item.strength === 'Review' ? 'text-amber-600' : 'text-cyan'}`}>{item.strength}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted">No evidence linked for {project.name} yet.</p>
                  )}
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Follow-up Validation</div>
                  <div className="space-y-1">
                    {(hasMatchedNotebookData ? projectNotebookContent.validationNotes : ['Load a matched processing result before validation closure.']).map((item, index) => (
                      <div key={item} className="flex items-start gap-2 rounded border border-border bg-background px-2 py-1 text-sm leading-snug text-text-muted">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{index + 1}</div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Publication Limitations</div>
                  <p className="mt-0.5 text-sm text-text-main">Claim status: <span className="font-semibold">{confidenceLabel}</span></p>
                  <p className="text-xs leading-snug text-text-muted">Export state: {hasMatchedNotebookData ? 'Report-ready for internal review; publication-level claims remain validation-limited until open gaps are closed.' : `Publication not available for ${project.name} until matched evidence is linked.`}</p>
                </div>
              </div>
            )}

            {activeNotebookTab === 'Decision' && (() => {
              const decisionState = !hasMatchedNotebookData
                ? 'Hold'
                : project.validationGaps.length > 0 ? 'Validate next' : 'Proceed';
              const decisionStateColor = decisionState === 'Proceed'
                ? 'text-primary border-primary/30 bg-primary/10'
                : decisionState === 'Validate next' ? 'text-amber-700 border-amber-500/30 bg-amber-500/10'
                : 'text-text-muted border-border bg-background';
              return (
              <div className="space-y-2">
                <div className="rounded-md border border-primary/20 bg-surface px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">Recommended Next Experiment</div>
                      <h3 className="text-sm font-bold text-text-main">{notebook.decision}</h3>
                      <p className="mt-1 text-sm leading-snug text-text-muted">{notebook.summary}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${decisionStateColor}`}>{decisionState}</span>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Scientific Decision State</div>
                  <div className="grid grid-cols-1 gap-x-3 gap-y-0.5 text-sm text-text-main sm:grid-cols-2">
                    <div><span className="text-text-dim">Status: </span>{decisionState}</div>
                    <div><span className="text-text-dim">Notebook readiness: </span>{displayNotebookStatus}</div>
                    <div><span className="text-text-dim">Open validation gaps: </span>{project.validationGaps.length}</div>
                    <div><span className="text-text-dim">Evidence linked: </span>{hasMatchedNotebookData ? 'Linked' : 'Pending'}</div>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Confidence Rationale</div>
                  <p className="mt-0.5 text-sm text-text-main">Claim status: <span className="font-semibold">{confidenceLabel}</span></p>
                  <p className="text-xs leading-snug text-text-muted">
                    {hasMatchedNotebookData
                      ? `Rationale based on ${projectNotebookContent.supportingData.length} technique evidence source${projectNotebookContent.supportingData.length === 1 ? '' : 's'} and ${project.validationGaps.length} open validation gap${project.validationGaps.length === 1 ? '' : 's'}.`
                      : `No matched processing result is linked to ${project.name}; confidence remains pending.`}
                  </p>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Candidate Decisions</div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {project.nextDecisions.map((decision) => (
                      <div key={decision.id} className="rounded-md border border-border bg-surface px-2.5 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-bold text-text-main">{decision.label}</div>
                          <span className="text-xs font-semibold text-primary">{decision.urgency}</span>
                        </div>
                        <p className="mt-0.5 text-sm leading-snug text-text-muted">{decision.description}</p>
                        {decision.linkedTechnique && <p className="mt-0.5 text-[11px] text-text-dim">Linked technique: {decision.linkedTechnique}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              );
            })()}

            {activeNotebookTab === 'Report Draft' && (() => {
              const readyTechniques = projectNotebookContent.supportingData
                .filter((item) => item.strength === 'Ready')
                .map((item) => item.technique);
              const pendingTechniques = projectNotebookContent.supportingData
                .filter((item) => item.strength !== 'Ready')
                .map((item) => item.technique);
              const evidenceBasis = hasMatchedNotebookData && readyTechniques.length > 0
                ? readyTechniques.join(' + ')
                : hasMatchedNotebookData && projectNotebookContent.supportingData.length > 0
                  ? projectNotebookContent.supportingData.map((s) => s.technique).join(' + ')
                  : 'Not linked';
              const validationBoundary = !hasMatchedNotebookData
                ? 'Matched processing result required'
                : pendingTechniques.length > 0
                  ? `${pendingTechniques.join(', ')} pending / publication-limited`
                  : project.validationGaps.length > 0
                    ? 'Publication-limited until open validation gaps close'
                    : 'Cleared for internal scientific review';
              const exportReadiness = hasMatchedNotebookData
                ? 'Ready for internal scientific review'
                : 'Blocked — matched evidence required';
              const notebookSource = `Notebook Entry · ${workflowNotebookEntry.id}`;
              const metadataRows: Array<[string, string]> = [
                ['Source', notebookSource],
                ['Evidence basis', evidenceBasis],
                ['Validation boundary', validationBoundary],
                ['Export readiness', exportReadiness],
              ];
              return (
              <div className="space-y-2">
                <div className="rounded-md border border-primary/20 bg-surface px-3 py-2">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Report Section Preview</div>
                      <h3 className="text-sm font-bold text-text-main">{hasMatchedNotebookData ? workflowReportSection.heading : 'No report section available'}</h3>
                      <p className="text-[11px] leading-snug text-text-muted">Evidence-linked report section generated from notebook reasoning.</p>
                    </div>
                    <Button variant="outline" size="sm" disabled title="Report route is not enabled in this demo." className="gap-1.5 h-7 text-xs px-2 shrink-0"><Download size={12} /> Export Section</Button>
                  </div>
                  <div className="rounded border border-border bg-background divide-y divide-border mb-1.5">
                    {metadataRows.map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-0.5 px-2.5 py-1 sm:flex-row sm:items-baseline sm:gap-3">
                        <div className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-text-dim sm:w-36">{label}</div>
                        <div className="text-xs leading-snug text-text-main">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded border border-border bg-background px-2.5 py-1.5">
                    <p className="text-sm leading-snug text-text-main">
                      {hasMatchedNotebookData ? projectNotebookContent.reportPreview : 'No report-oriented section is available until a matched processing result is linked to this project.'}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">Report route is not enabled in this demo. Export-ready sections are generated from notebook entries.</p>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-dim">Characterization Overview</div>
                  {hasMatchedNotebookData ? (
                    <AIInsightPanel result={getProjectInsight(project)} />
                  ) : (
                    <Card className="p-3">
                      <div className="text-sm font-semibold text-text-main">Validation pending</div>
                      <p className="mt-1 text-sm leading-snug text-text-muted">No matched processing result is linked to {project.name}.</p>
                    </Card>
                  )}
                </div>
                {hasMatchedNotebookData && projectNotebookContent.supportingData.length > 0 && (
                  <div className="rounded-md border border-border bg-surface px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Supporting Data</div>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {projectNotebookContent.supportingData.map((item) => (
                        <div key={`rpt-${item.technique}`} className="rounded border border-border bg-background px-2 py-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-text-main">{item.technique}</span>
                            <span className={`text-[10px] font-semibold ${item.strength === 'Review' ? 'text-amber-600' : item.strength === 'Ready' ? 'text-primary' : 'text-cyan'}`}>{item.strength}</span>
                          </div>
                          <p className="mt-0.5 text-xs leading-snug text-text-main">{item.evidence}</p>
                          <p className="text-[11px] text-text-dim">Dataset: {item.dataset}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasMatchedNotebookData && (
                  <div className="rounded-md border border-border bg-surface px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Cross-Technique Insights</div>
                    <ul className="space-y-0.5">
                      {keyEvidenceItems.map((item) => (
                        <li key={`xt-${item}`} className="flex items-start gap-2 text-sm leading-snug text-text-main">
                          <span className="text-primary mt-0.5 shrink-0">–</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rounded-md border border-primary/20 bg-surface px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Interpretation</div>
                  <div className="rounded border border-border bg-background px-2.5 py-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-0.5">
                      {hasMatchedNotebookData ? primaryNotebookSection?.heading ?? notebookTemplateDetails.primaryLabel : 'No matched processing result'}
                    </div>
                    <p className="text-sm leading-snug text-text-main">
                      {hasMatchedNotebookData ? projectNotebookContent.discussion : 'This project does not have a matched processing result. Load compatible data before creating report-ready discussion.'}
                    </p>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Conclusion</div>
                  <p className="mt-0.5 text-sm leading-snug text-text-main">
                    {hasMatchedNotebookData ? projectNotebookContent.summary : `Conclusion for ${project.name} will be generated once matched evidence is linked.`}
                  </p>
                  <p className="text-[11px] text-text-muted">Claim status: <span className="font-semibold">{confidenceLabel}</span></p>
                </div>
                <div className="rounded-md border border-amber-500/20 bg-surface px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">Limitations and Follow-up Validation</div>
                  {project.validationGaps.length > 0 && (
                    <div className="mb-1 space-y-0.5">
                      {project.validationGaps.map((gap) => (
                        <p key={`rpt-gap-${gap.id}`} className="text-xs leading-snug text-text-muted">– <span className="font-semibold text-text-main">{gap.description}</span> — {gap.suggestedResolution}</p>
                      ))}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {(hasMatchedNotebookData ? projectNotebookContent.validationNotes : [`Load a matched processing result for ${project.name} before validation closure.`]).map((item) => (
                      <p key={`rpt-val-${item}`} className="text-xs leading-snug text-text-muted">– {item}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1">Export</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" disabled={!hasMatchedNotebookData} title={!hasMatchedNotebookData ? 'Requires matched processing result.' : undefined} className="gap-1.5 h-7 text-xs px-2" onClick={() => exportNotebook('md')}><Download size={12} /> Export Markdown</Button>
                    <Button variant="outline" size="sm" disabled={!hasMatchedNotebookData} title={!hasMatchedNotebookData ? 'Requires matched processing result.' : undefined} className="gap-1.5 h-7 text-xs px-2" onClick={() => exportNotebook('png')}><Download size={12} /> Export PNG</Button>
                    <Link to={workspaceRun ? getWorkspaceRoute(project, workspaceRun.technique, workspaceRun.datasetId) : getWorkspaceRoute(project)} className="inline-flex h-7 items-center rounded-md border border-border bg-surface px-2 text-xs font-semibold text-text-main hover:border-primary/40 transition-colors">
                      {workspaceRun ? `Open ${workspaceRun.technique} Analysis` : 'Open Workspace'} <ArrowRight size={12} className="inline ml-1" />
                    </Link>
                    <Link to={hasMatchedNotebookData ? getAgentPath(project) : getWorkspaceRoute(project)} className="inline-flex h-7 items-center rounded-md border border-cyan/40 bg-surface px-2 text-xs font-semibold text-cyan hover:bg-cyan/10 transition-colors">
                      {hasMatchedNotebookData ? 'Open Refinement' : 'Open Workspace'} <ArrowRight size={12} className="inline ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
              );
            })()}

          </div>
          </div>
          {isEvidenceDrawerOpen && (
            <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/30">
              <div className="h-full w-full max-w-md border-l border-border bg-surface shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-primary">Evidence Trace</div>
                    <h2 className="mt-1 text-base font-bold text-text-main">{project.name}</h2>
                    <p className="mt-1 text-xs text-text-muted">Technique roles, evidence status, and confidence context.</p>
                  </div>
                  <Button variant="ghost" size="sm" className="px-2" onClick={() => setIsEvidenceDrawerOpen(false)}>
                    <X size={16} />
                  </Button>
                </div>
                <div className="space-y-3 overflow-y-auto p-4">
                  {evidenceTraceItems.map((item) => (
                    <div key={`${item.technique}-${item.role}`} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-bold text-text-main">{item.technique}</div>
                        <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-text-muted">{item.role}</p>
                      <p className="mt-1 text-xs text-text-main">{item.confidence}</p>
                    </div>
                  ))}
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Project-specific sources</div>
                    <div className="mt-2 space-y-2">
                      {project.evidenceSources.map((source) => (
                        <div key={source.datasetId} className="rounded-md border border-border bg-surface p-2">
                          <div className="text-xs font-bold text-text-main">{source.technique} · {source.datasetLabel}</div>
                          <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{source.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="hidden">
            <div>
            <section className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.85fr)_minmax(280px,0.95fr)]">
              <div className="min-w-0">
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">Characterization Overview</div>
                {hasMatchedNotebookData ? (
                  <div className="max-h-[288px] overflow-y-auto rounded-xl">
                    <AIInsightPanel result={getProjectInsight(project)} />
                  </div>
                ) : (
                  <Card className="p-4">
                    <div className="text-sm font-semibold text-text-main">Validation pending</div>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">
                      No matched processing result is linked to this project. Evidence and report discussion are not generated.
                    </p>
                  </Card>
                )}
              </div>
              <div className="min-w-0 rounded-xl border border-border bg-surface p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Experiment Conditions</div>
                    <div className="mt-1 text-sm font-bold text-text-main">{experimentConditionStatus}</div>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      Locked conditions define reproducibility constraints before interpretation handoff.
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] text-text-muted">
                    Locked at: {formatConditionLockTimestamp(experimentConditionLock)}
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {experimentConditionLines.map((line) => (
                    <div key={line} className="rounded-md border border-border bg-background px-2 py-1 text-[11px] leading-relaxed text-text-muted">
                      {line}
                    </div>
                  ))}
                </div>
                <div className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Condition-aware claim boundary</div>
                  <ul className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-text-muted">
                    {experimentConditionBoundaryNotes.slice(0, 3).map((note) => (
                      <li key={note}>- {note}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-primary/20 bg-surface p-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">Refined Discussion / Report Preview</div>
                <div className="mt-2 rounded-md border border-border bg-background p-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    {notebookTemplateDetails.primaryLabel}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-text-main">
                    {hasMatchedNotebookData
                      ? projectNotebookContent.discussion
                      : 'No matched processing result is linked to this notebook entry.'}
                  </p>
                </div>
                <div className="mt-2 rounded-md border border-border bg-background p-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Report section</div>
                  <p className="mt-2 text-xs leading-relaxed text-text-main">
                    {hasMatchedNotebookData
                      ? projectNotebookContent.reportPreview
                      : 'No report-oriented section is available until a matched processing result is linked to this project.'}
                  </p>
                </div>
                <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Discussion readiness</div>
                  <p className="mt-1 text-xs font-semibold text-text-main">
                    {displayNotebookStatus}: {hasMatchedNotebookData ? notebookTemplateDetails.output : 'Load compatible data before report-ready discussion.'}
                  </p>
                </div>
              </div>
            </section>

            {!hasMatchedNotebookData && (
              <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Notebook status</div>
                <h3 className="mt-1 text-base font-bold text-text-main">No matched processing result</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  This project does not yet have a matched deterministic XRD processing result. Notebook discussion, report preview, and export remain validation pending until compatible evidence is processed.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Requires dataset', 'No matched processing result', 'Evidence not generated'].map((badge) => (
                    <span key={badge} className="rounded-full border border-amber-500/30 bg-background px-3 py-1 text-xs font-semibold text-amber-700">
                      {badge}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <details className="rounded-xl border border-border bg-surface">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text-main">
                <span>Full template, refined discussion, and report section</span>
                <span className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] text-primary">
                  Secondary record details
                </span>
              </summary>
              <div className="space-y-4 border-t border-border p-4">
              <details className="rounded-xl border border-border bg-surface">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text-main">
                  <span>Template selector and workflow details</span>
                  <span className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] text-primary">
                    {notebookTemplate.label} · {notebookTemplateDetails.primaryLabel}
                  </span>
                </summary>
                <div className="border-t border-border p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-main">Notebook Template Selector</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      Choose the experiment mode for this notebook entry.
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-right">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Report template</div>
                    <div className="mt-1 text-sm font-bold capitalize text-text-main">
                      {notebookTemplate.reportTemplate.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                  {NOTEBOOK_TEMPLATE_MODES.map((mode) => {
                    const template = NOTEBOOK_TEMPLATES[mode];
                    const details = NOTEBOOK_TEMPLATE_DETAILS[mode];
                    const isSelected = templateMode === mode;

                    return (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setTemplateMode(mode)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background text-text-muted hover:border-primary/30 hover:text-text-main'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-bold text-text-main">{template.label}</div>
                          {isSelected && (
                            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-text-muted">{details.description}</p>
                        <div className="mt-3 rounded-md border border-border bg-surface px-2 py-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Output</div>
                          <div className="mt-0.5 text-xs font-semibold text-text-main">{details.output}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-lg border border-border bg-background p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Template micro-flow</div>
                      <div className="mt-1 text-sm font-semibold text-text-main">{notebookTemplateDetails.primaryLabel}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted">
                      {workflowRefinement.microFlow.map((step, index) => (
                        <React.Fragment key={step}>
                          <span className="rounded-full border border-border bg-surface px-2.5 py-1">{step}</span>
                          {index < workflowRefinement.microFlow.length - 1 && <ArrowRight size={13} className="text-primary" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {notebookTemplate.stepperLabels.map((step) => (
                    <span key={step} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                      {step}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Tabs</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {notebookTemplate.tabs.map((tab) => (
                        <span key={tab} className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text-main">
                          {tab}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Statuses</div>
                    <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {(hasMatchedNotebookData
                        ? workflowNotebookEntry.statusSummary
                        : [
                            { label: 'Notebook Status', value: 'Requires dataset' },
                            { label: 'Evidence Status', value: 'No matched processing result' },
                          ]).map((status) => (
                        <div key={status.label} className="rounded-md border border-border bg-surface px-2 py-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{status.label}</div>
                          <div className="text-xs font-bold text-text-main">{status.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </div>
              </details>

              <div className="rounded-xl border border-primary/20 bg-surface p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {notebookTemplateDetails.primaryLabel}
                    </div>
                    <p className="mt-1 text-sm font-medium text-text-muted">
                      Source workflow converted into a template-based scientific record
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted">
                    {workflowRefinement.microFlow.map((step, index) => (
                      <React.Fragment key={step}>
                        <span className="rounded-full border border-border bg-background px-2.5 py-1">{step}</span>
                        {index < workflowRefinement.microFlow.length - 1 && <ArrowRight size={13} className="text-primary" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-border bg-background p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    {hasMatchedNotebookData ? primaryNotebookSection?.heading ?? notebookTemplateDetails.primaryLabel : 'No matched processing result'}
                  </div>
                  <div className="mt-2 space-y-2">
                    {(hasMatchedNotebookData
                      ? [projectNotebookContent.discussion]
                      : ['This project does not have a matched processing result in the deterministic notebook workflow. Load compatible data before creating report-ready discussion.']).map((line) => (
                      <p key={line} className="text-sm leading-relaxed text-text-main">{line}</p>
                    ))}
                  </div>
                </div>

                <details className="mt-3 rounded-lg border border-border bg-background">
                  <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-text-main">
                    Additional notebook sections
                  </summary>
                  <div className="grid grid-cols-1 gap-3 border-t border-border p-3 lg:grid-cols-2">
                    {(hasMatchedNotebookData ? supportingNotebookSections : [
                      {
                        heading: 'Validation Pending',
                        lines: ['No matched processing result is available for this project.', 'Evidence and report sections remain unavailable until compatible data is processed.'],
                      },
                    ]).map((section) => (
                      <div key={section.heading} className="rounded-lg border border-border bg-surface p-3">
                        <div className="text-xs font-bold text-text-main">{section.heading}</div>
                        <div className="mt-2 space-y-2">
                          {section.lines.map((line) => (
                            <p key={line} className="text-xs leading-relaxed text-text-muted">{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Report Section Preview</div>
                    <h3 className="mt-1 text-base font-bold text-text-main">
                      {hasMatchedNotebookData ? workflowReportSection.heading : 'No report section available'}
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">{notebookTemplateDetails.reportPreview}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="Report route is not enabled in this demo. Export-ready sections are generated from notebook entries."
                    className="gap-2"
                  >
                    <Download size={14} /> Export Report Section
                  </Button>
                </div>
                <div className="mt-3 rounded-lg border border-border bg-background p-3">
                  <p className="text-sm leading-relaxed text-text-main">
                    {hasMatchedNotebookData
                      ? projectNotebookContent.reportPreview
                      : 'No report-oriented section is available until a matched processing result is linked to this project.'}
                  </p>
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  Report route is not enabled in this demo. Export-ready sections are generated from notebook entries.
                </p>
              </div>
              </div>
            </details>

            <details className="rounded-xl border border-border bg-surface">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text-main">
                <span>Supplementary notebook record</span>
                <span className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-text-muted">
                  Supporting data, run log, exports, trace, and validation notes
                </span>
              </summary>
              <div className="space-y-4 border-t border-border p-4">
            <section className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-surface p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-main">Source Workflow</h3>
                    <p className="mt-2 text-sm text-text-muted">Project: {project.name}</p>
                    <p className="mt-1 text-sm text-text-main">
                  Demo notebook entry generated from the current interpretation context.
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-right">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Discussion readiness</div>
                    <div className="mt-1 text-sm font-bold text-text-main">{displayNotebookStatus}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ['Mode', notebookTemplate.label],
                    ['Source workflow', 'XRD processing + interpretation refinement'],
                    ['Pipeline', 'Processing Result → Interpretation Refinement → Notebook Entry → Report Section'],
                    ['Discussion readiness', displayNotebookStatus],
                    ['Report section', hasMatchedNotebookData ? workflowReportSection.heading : 'No report section available'],
                    ['Evidence status', hasMatchedNotebookData ? 'Requires validation' : 'No matched processing result'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-border bg-background p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
                      <div className="mt-1 text-sm font-semibold text-text-main">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {notebookTemplateDetails.badges.map((badge) => (
                    <span key={badge} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Evidence Sources</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {hasMatchedNotebookData ? projectNotebookContent.supportingData.map((item) => (
                  <div key={item.technique} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-text-main">{item.technique}</span>
                      <span className={`text-xs font-semibold ${item.strength === 'Review' ? 'text-amber-600' : item.strength === 'Ready' ? 'text-primary' : 'text-cyan'}`}>
                        {item.strength}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-main">{item.evidence}</p>
                    <p className="mt-2 text-xs font-medium text-text-muted">Linked dataset: {item.dataset}</p>
                    <p className="mt-1 text-xs text-text-muted">{item.caveat}</p>
                  </div>
                )) : (
                  <div className="col-span-2 rounded-lg border border-dashed border-border bg-surface/50 p-4 text-center">
                    <p className="text-xs text-text-muted">No evidence sources linked yet. Process data in a workspace to generate evidence.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">{notebookTemplateDetails.primaryLabel}</h3>
              <div className="rounded-lg border border-border bg-surface p-4">
                {(hasMatchedNotebookData
                  ? [projectNotebookContent.discussion]
                  : ['No matched processing result is linked to this notebook entry. Evidence has not been generated for this project in the deterministic XRD demo workflow.']).map((line) => (
                  <p key={line} className="text-sm leading-relaxed text-text-main">{line}</p>
                ))}
                <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Discussion readiness</div>
                  <p className="mt-1 text-sm font-semibold text-text-main">
                    {displayNotebookStatus}: {hasMatchedNotebookData ? notebookTemplateDetails.output : 'Load compatible data before report-ready discussion.'}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Notebook Run Log</h3>
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ...(hasMatchedNotebookData ? projectNotebookContent.runLog : [
                      ['Processing run', 'No matched processing result'],
                      ['Refinement', 'Not available'],
                      ['Dataset', 'No matched dataset'],
                      ['Workflow version', 'difaryx-analysis-v0.1'],
                    ]),
                    ['Template mode', notebookTemplate.label],
                    ['Discussion readiness', displayNotebookStatus],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-border bg-background p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
                      <div className="mt-1 text-sm font-semibold text-text-main">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Limitations and Follow-up Validation</h3>
              <div className="space-y-2">
                {(hasMatchedNotebookData
                  ? projectNotebookContent.validationNotes
                  : ['Load a matched processing result before notebook export.', 'Evidence review is not generated for this project yet.']).map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {index + 1}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Report Exports</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Button
                  variant="outline"
                  disabled={!hasMatchedNotebookData}
                  title={!hasMatchedNotebookData ? 'Requires matched processing result before export.' : undefined}
                  className="gap-2"
                  onClick={() => exportNotebook('md')}
                >
                  <Download size={14} /> Export Markdown
                </Button>
                <Button
                  variant="outline"
                  disabled={!hasMatchedNotebookData}
                  title={!hasMatchedNotebookData ? 'Requires matched processing result before export.' : undefined}
                  className="gap-2"
                  onClick={() => exportNotebook('png')}
                >
                  <Download size={14} /> Export PNG Snapshot
                </Button>
                {(['pdf', 'docx', 'csv'] as DemoExportFormat[]).map((format) => (
                  <Button key={format} variant="outline" disabled title="Available in the connected beta workflow." className="gap-2 text-slate-400 cursor-not-allowed">
                    <Download size={14} /> {format.toUpperCase()} - Connected beta workflow
                  </Button>
                ))}
                <Button variant="outline" className="gap-2" onClick={copyAgentSummary}>
                  <Share2 size={14} /> Copy Summary
                </Button>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Summary</h3>
              <p className="text-sm text-text-main leading-relaxed">
                {hasMatchedNotebookData ? projectNotebookContent.summary : 'No matched processing result is linked to this notebook entry.'}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Report-ready Discussion</h3>
              <div className="bg-surface p-4 rounded-md border border-border">
                <div className="text-sm leading-relaxed text-text-main">
                  {hasMatchedNotebookData
                    ? projectNotebookContent.reportPreview
                    : 'Report-ready discussion is unavailable until a matched processing result is linked to this project.'}
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="text-xs text-text-muted">
                    Short conclusion: {hasMatchedNotebookData ? 'Supported assignment with validation boundaries.' : 'No matched processing result.'}
                  </div>
                  <div className={`text-sm font-bold ${
                    notebook.claimStatus === 'strongly_supported' ? 'text-emerald-600' :
                    notebook.claimStatus === 'supported' ? 'text-cyan' :
                    notebook.claimStatus === 'partial' ? 'text-amber-500' :
                    'text-text-muted'
                  }`}>{hasMatchedNotebookData ? formatClaimStatus(notebook.claimStatus) : 'Requires dataset'}</div>
                </div>
              </div>
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900">
                {hasMatchedNotebookData
                  ? 'XRD provides bulk-averaged structural evidence. Surface-sensitive and phase-purity claims remain validation-limited.'
                  : 'Notebook status: Requires dataset. Evidence not generated.'}
              </div>
            </section>

            {workspaceRun && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Workspace Data</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-surface p-4 rounded-md border border-border">
                    <div className="text-xs text-text-muted mb-1">Dataset</div>
                    <div className="text-sm font-semibold text-text-main">{workspaceDataset?.fileName ?? workspaceRun.datasetId}</div>
                    <div className="text-xs text-text-muted mt-1">{workspaceDataset?.metadata.sampleName}</div>
                  </div>
                  <div className="bg-surface p-4 rounded-md border border-border">
                    <div className="text-xs text-text-muted mb-1">Technique</div>
                    <div className="text-sm font-semibold text-text-main">{workspaceRun.technique}</div>
                    <div className="text-xs text-text-muted mt-1">{new Date(workspaceRun.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="bg-surface p-4 rounded-md border border-border sm:col-span-2">
                    <div className="text-xs text-text-muted mb-2">Processing Parameters</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(workspaceRun.parameters).map(([key, value]) => (
                        <span key={key} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-text-muted">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {(observations.length > 0 || attachedRun) && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Notebook Additions</h3>
                {attachedRun && (
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-text-muted">
                    <div className="font-semibold text-text-main">
                      Linked data: {attachedRunRecord?.technique ?? 'Workspace'} analysis
                    </div>
                    <div className="mt-1">
                      {attachedRunRecord
                        ? `${new Date(attachedRunRecord.timestamp).toLocaleString()} - ${attachedRunRecord.detectedFeatures.length} features - ${formatClaimStatus(attachedRunRecord.matchResult?.claimStatus || 'supported')}`
                        : attachedRun}
                    </div>
                  </div>
                )}
                {observations.map((observation) => (
                  <div key={observation} className="rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
                    {observation}
                  </div>
                ))}
              </section>
            )}

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><FlaskConical size={14} /> Technical Trace</span>
              </h3>
              <p className="text-xs text-text-muted mb-2">Internal processing steps retained for reproducibility.</p>
              <div className="bg-surface p-4 rounded-md border border-border text-sm font-mono text-text-dim space-y-2">
                {technicalTrace.map((step, i) => (
                  <p key={step}>{i + 1}. {sanitizeTraceStep(step)}</p>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><BarChart3 size={14} /> Peak Detection Results</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-md border border-border">
                  <div className="text-xs text-text-muted mb-1">Peaks Detected</div>
                  <div className="text-2xl font-bold text-primary">
                    {hasMatchedNotebookData ? workspaceRun?.detectedFeatures.length ?? project.xrdPeaks.length : 0}
                  </div>
                </div>
                <div className="bg-surface p-4 rounded-md border border-border">
                  <div className="text-xs text-text-muted mb-1">Peak Positions</div>
                  <div className="text-sm font-mono text-text-main">
                    {hasMatchedNotebookData
                      ? (workspaceRun?.detectedFeatures ?? project.xrdPeaks).map((peak) => `${peak.position.toFixed(1)} ${workspaceRun && workspaceRun.technique !== 'XRD' ? '' : 'deg'}`).join(', ')
                      : 'No matched dataset'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-muted">
                {hasMatchedNotebookData ? projectNotebookContent.peakDetection : 'No peak detection display is available until compatible evidence is processed.'}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><Target size={14} /> Phase Identification</span>
              </h3>
              <div className="bg-surface p-4 rounded-md border border-border flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">{hasMatchedNotebookData ? projectNotebookContent.phaseLabel : project.name}</div>
                  <div className="text-xs text-text-muted mt-1">
                    {hasMatchedNotebookData
                      ? notebook.phaseInterpretation
                      : 'No matched processing result for this project.'}
                  </div>
                </div>
                <div className={`text-sm font-bold ${
                  notebook.claimStatus === 'strongly_supported' ? 'text-emerald-600' :
                  notebook.claimStatus === 'supported' ? 'text-cyan' :
                  notebook.claimStatus === 'partial' ? 'text-amber-500' :
                  'text-text-muted'
                }`}>{confidenceLabel}</div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Key Evidence</h3>
              <div className="space-y-2">
                {keyEvidenceItems.map((item, i) => (
                  <div key={item} className="flex items-start gap-3 rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to={workspaceRun ? getWorkspaceRoute(project, workspaceRun.technique, workspaceRun.datasetId) : getWorkspaceRoute(project)} className="rounded-md border border-border bg-surface p-3 text-sm font-semibold text-text-main hover:border-primary/40 transition-colors">
                {workspaceRun ? `Open ${workspaceRun.technique} Analysis` : 'Open Workspace'} <ArrowRight size={14} className="inline ml-1" />
              </Link>
              <Link
                to={hasMatchedNotebookData ? getAgentPath(project) : getWorkspaceRoute(project)}
                className="rounded-md border border-cyan/40 bg-surface p-3 text-sm font-semibold text-cyan hover:bg-cyan/10 transition-colors"
              >
                {hasMatchedNotebookData ? 'Open Refinement' : 'Open Workspace'} <ArrowRight size={14} className="inline ml-1" />
              </Link>
              <button
                onClick={() => exportNotebook('md')}
                disabled={!hasMatchedNotebookData}
                title={!hasMatchedNotebookData ? 'Requires matched processing result before export.' : undefined}
                className="rounded-md border border-border bg-surface p-3 text-left text-sm font-semibold text-text-main hover:bg-surface-hover transition-colors"
              >
                <FileText size={14} className="inline mr-1" /> Export Markdown
              </button>
            </section>
              </div>
            </details>
          </div>
            </div>
            </>
          )}
        </div>

        <div className="hidden">
          <div className="p-6">
            <div className="mb-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Characterization Overview</div>
            {hasMatchedNotebookData ? (
              <AIInsightPanel result={getProjectInsight(project)} />
            ) : (
              <Card className="p-4">
                <div className="text-sm font-semibold text-text-main">Validation pending</div>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  No matched processing result is linked to this project. Evidence and report discussion are not generated.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
      <ExperimentModal
        open={experimentModalOpen}
        defaultProjectId={project.id}
        onClose={() => setExperimentModalOpen(false)}
        onCreated={() => {
          setLocalExperiments(getLocalExperiments());
          showFeedback('Experiment, dataset, and condition record added');
        }}
      />
    </DashboardLayout>
  );
}
