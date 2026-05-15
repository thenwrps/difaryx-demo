import {
  DEFAULT_PROJECT_ID,
  getProject,
  type DemoProject,
  type DemoPeak,
  type Technique,
} from './demoProjects';
import { canonicalDemoScenario } from './demo';
import {
  getConditionBoundaryNotes,
  getLatestExperimentConditionLock,
} from './experimentConditionLock';

export type NotebookTemplateMode = 'research' | 'rd' | 'analytical';
export type ReportTemplate = 'manuscript' | 'technical_report' | 'analytical_report';

export interface NotebookTemplate {
  mode: NotebookTemplateMode;
  label: string;
  stepperLabels: string[];
  tabs: string[];
  requiredSections: string[];
  statusLabels: string[];
  reportTemplate: ReportTemplate;
}

export interface ProcessingResult {
  id: string;
  projectId: string;
  technique: Technique;
  sourceRoute: string;
  processedAt: string;
  title: string;
  sampleId: string;
  materialSystem: string;
  processedResult: string;
  summary: string;
  detectedFeatures: DemoPeak[];
  evidenceReview: string[];
  limitations: string[];
  followUpValidation: string[];
  metrics: Array<{ label: string; value: string }>;
}

export interface AgentDiscussionRefinement {
  id: string;
  projectId: string;
  processingResultId: string;
  templateMode: NotebookTemplateMode;
  sourceRoute: string;
  title: string;
  subtitle: string;
  microFlow: string[];
  discussionDraft: string;
  claimBoundary: {
    supported: string[];
    requiresValidation: string[];
    notSupportedYet: string[];
    contextual?: string[];
    pending?: string[];
  };
  validationNotes: string[];
  statusSummary: Array<{ label: string; value: string }>;
  reportTemplate: ReportTemplate;
  refinedAt: string;
}

export interface NotebookEntry {
  id: string;
  projectId: string;
  templateMode: NotebookTemplateMode;
  templateLabel: string;
  refinementId: string;
  processingResultId: string;
  createdAt: string;
  title: string;
  subtitle: string;
  sourceLabel: string;
  stepperLabels: string[];
  tabs: string[];
  requiredSections: string[];
  statusSummary: Array<{ label: string; value: string }>;
  sections: Array<{ heading: string; lines: string[] }>;
  reportTemplate: ReportTemplate;
}

export interface ReportSection {
  id: string;
  projectId: string;
  notebookEntryId: string;
  template: ReportTemplate;
  heading: string;
  body: string;
  lines: string[];
  sourceLabel: string;
}

const PROCESSING_RESULTS_KEY = 'difaryx-workflow-processing-results';
const DISCUSSION_REFINEMENTS_KEY = 'difaryx-workflow-discussion-refinements';
const NOTEBOOK_ENTRIES_KEY = 'difaryx-workflow-notebook-entries';
const DEMO_TIMESTAMP = '2026-04-29T17:30:00.000Z';

export const NOTEBOOK_TEMPLATES: Record<NotebookTemplateMode, NotebookTemplate> = {
  research: {
    mode: 'research',
    label: 'Research Mode',
    stepperLabels: ['Problem', 'Hypothesis', 'Processing', 'Evidence', 'Mechanism', 'Claim', 'Discussion', 'Manuscript'],
    tabs: ['Interpretation', 'Evidence', 'Claim Boundary', 'Validation', 'Manuscript', 'Run Log'],
    requiredSections: ['Refined Discussion', 'Evidence Status', 'Claim Boundary', 'Validation Notes', 'Manuscript Draft'],
    statusLabels: ['Evidence Status', 'Claim Readiness', 'Discussion Readiness', 'Publication Readiness'],
    reportTemplate: 'manuscript',
  },
  rd: {
    mode: 'rd',
    label: 'R&D Mode',
    stepperLabels: ['Need', 'Requirement', 'Prototype', 'Test', 'Optimize', 'Validate', 'Risk', 'Decision'],
    tabs: ['Overview', 'Prototype', 'Metrics', 'Risk Review', 'Go/No-Go', 'Next Plan', 'Report'],
    requiredSections: ['Development Status', 'Prototype Metrics', 'Risk Review', 'Go/No-Go Decision', 'Next Development Plan'],
    statusLabels: ['Development Status', 'Target Achievement', 'Scale-up Readiness', 'Risk Level', 'Go/No-Go Decision'],
    reportTemplate: 'technical_report',
  },
  analytical: {
    mode: 'analytical',
    label: 'Analytical-job Mode',
    stepperLabels: ['Sample', 'Prep', 'Method', 'Calibration', 'Run', 'QA/QC', 'Result', 'Report'],
    tabs: ['Sample', 'Method / SOP', 'Calibration', 'QA/QC', 'Analytical Result', 'Report', 'Run Log'],
    requiredSections: ['Sample Context', 'Method / SOP', 'Calibration and QA/QC', 'Analytical Result', 'Review / Retest Decision'],
    statusLabels: ['QA/QC Status', 'Result Validity', 'Specification Status', 'Report Status'],
    reportTemplate: 'analytical_report',
  },
};

const TEMPLATE_MICRO_FLOWS: Record<NotebookTemplateMode, string[]> = {
  research: ['Processing Result', 'Interpretation Refinement', 'Notebook Entry', 'Report Section'],
  rd: ['Test Result', 'Risk Review', 'Go/No-Go Rationale'],
  analytical: ['Analytical Run', 'QA/QC Review', 'Reviewed Result'],
};

const TEMPLATE_STATUS_VALUES: Record<NotebookTemplateMode, string[]> = {
  research: ['Requires validation', 'Bounded', 'Publication-limited', 'Publication-limited'],
  rd: ['Prototype validation', 'Meets structural target', 'Not scale-up ready', 'Medium', 'Continue with validation'],
  analytical: ['Review-ready', 'Valid within method scope', 'Requires validation', 'Report-ready'],
};

export const RESEARCH_DISCUSSION_DRAFT =
  'The processed XRD pattern supports assignment of the sample to a CuFe₂O₄ spinel ferrite structure, with the major reflections aligning with the expected cubic spinel reference pattern. Supporting Raman evidence strengthens the interpretation by indicating local spinel symmetry through the A1g mode. However, unresolved weak reflections and the surface-sensitive nature of XPS limit the strength of phase-purity and bulk-composition claims. The current notebook interpretation should therefore be framed as a supported CuFe₂O₄ spinel assignment with remaining validation requirements, rather than a publication-level phase-pure confirmation.';

const SBA15_RESEARCH_DISCUSSION_DRAFT =
  'The processed evidence supports CuFe₂O₄ spinel ferrite reflections in the CuFe₂O₄/SBA-15 sample, consistent with dispersed copper ferrite on mesoporous SBA-15. Supporting Raman evidence is consistent with ferrite-like local symmetry, while FTIR contextualizes the silica support environment. Phase distribution, loading uniformity, surface oxidation state, and support interaction remain validation-limited.';

export const CLAIM_BOUNDARY = {
  supported: [
    'CuFe₂O₄ spinel phase assignment',
    'Literature-consistent lattice relation',
  ],
  requiresValidation: [
    'Phase purity',
    'Surface oxidation-state assignment',
    'Bulk Cu/Fe stoichiometry',
    'Crystallite size and strain separation',
  ],
  notSupportedYet: [
    'Publication-level phase-pure confirmation',
    'Bulk oxidation-state distribution not supported yet',
  ],
  contextual: [
    'Raman/FTIR support features',
  ],
  pending: [
    'XPS surface-state validation',
  ],
};

export const VALIDATION_NOTES = [
  'Run Rietveld refinement for quantitative phase assessment.',
  'Review XPS Cu 2p, Fe 2p, and O 1s core-level spectra.',
  'Use TEM to validate morphology and crystallite-size assumptions.',
  'Use ICP-OES if bulk Cu/Fe composition is required.',
];

function getWorkflowProject(projectId?: string | null) {
  return getProject(projectId) ?? getProject(DEFAULT_PROJECT_ID)!;
}

function getPrimaryTechnique(project: DemoProject): Technique {
  return project.techniques.find((technique) => technique === 'XRD') ?? project.techniques[0] ?? 'XRD';
}

function isSba15Project(projectId: string) {
  return projectId === 'cufe2o4-sba15';
}

function getProjectClaimBoundary(projectId: string): typeof CLAIM_BOUNDARY {
  const project = getWorkflowProject(projectId);
  const validationGaps = project.validationGaps.map((gap) => gap.description);
  const evidenceLines = project.evidence.slice(0, 3);
  const pendingDecisions = project.nextDecisions.map((decision) => decision.label);
  const contextual = project.evidenceSources.map(
    (source) => `${source.technique}: ${source.datasetLabel}`,
  );

  return {
    supported: evidenceLines.length
      ? evidenceLines
      : [`${project.phase} evidence is available for ${project.name}.`],
    requiresValidation: validationGaps.length
      ? validationGaps
      : [`No open validation gaps are recorded for ${project.name}.`],
    notSupportedYet: validationGaps.length
      ? [`Claims beyond ${project.phase} remain gated by project validation state.`]
      : ['No stronger unsupported claim is currently proposed.'],
    contextual,
    pending: pendingDecisions,
  };

  if (!isSba15Project(projectId)) return CLAIM_BOUNDARY;

  return {
    supported: [
      'CuFe₂O₄ spinel ferrite reflections in the supported CuFe₂O₄/SBA-15 sample',
      'Mesoporous SBA-15 context included in the interpretation',
    ],
    requiresValidation: [
      'Phase distribution across the support',
      'Loading uniformity',
      'Surface oxidation-state assignment',
      'Support interaction and dispersion',
    ],
    notSupportedYet: [
      'Pure bulk CuFe₂O₄ phase-purity assignment',
      'Publication-level loading-uniformity and dispersion claims',
    ],
    contextual: [
      'Raman/FTIR support features',
    ],
    pending: [
      'XPS surface-state validation',
    ],
  };
}

function getProjectValidationNotes(projectId: string) {
  const project = getWorkflowProject(projectId);
  const gapResolutions = project.validationGaps.map((gap) => gap.suggestedResolution);
  if (gapResolutions.length) return gapResolutions;
  if (project.recommendations.length) return project.recommendations;
  return [`Preserve current evidence boundary for ${project.name} before report export.`];

  if (!isSba15Project(projectId)) return VALIDATION_NOTES;

  return [
    'Quantify CuFe₂O₄ loading and distribution across SBA-15.',
    'Review XPS Cu/Fe oxidation state and surface enrichment.',
    'Compare FTIR silica bands and metal-oxygen bands under the support matrix.',
    'Use microscopy or mapping evidence to validate dispersion and support interaction.',
  ];
}

function getProcessingResultCopy(projectId: string) {
  const project = getWorkflowProject(projectId);
  const primaryTechnique = getPrimaryTechnique(project);
  const evidenceReview = project.evidence.length
    ? project.evidence
    : project.evidenceSources.map((source) => source.description);
  const limitations = project.validationGaps.length
    ? project.validationGaps.map((gap) => gap.description)
    : [project.reportReadiness.label];
  const processedSource = project.evidenceSources.find((source) => source.technique === primaryTechnique);

  return {
    processedResult: `${project.name} ${primaryTechnique} evidence review`,
    summary: project.summary,
    evidenceReview: evidenceReview.length
      ? evidenceReview
      : [`No processed ${primaryTechnique} evidence is available for ${project.name}.`],
    limitations: limitations.length
      ? limitations
      : [`${project.name} has no active limitations recorded for the selected evidence bundle.`],
    materialSystem: project.material,
    datasetLabel: processedSource?.datasetLabel ?? `${project.name} ${primaryTechnique}`,
  };

  if (!isSba15Project(projectId)) {
    return {
      processedResult: 'CuFe₂O₄ spinel ferrite assignment from XRD-centered processing',
      summary:
        'Processed XRD reflections align with a CuFe₂O₄ spinel ferrite reference pattern while surface and bulk-composition validation remain open.',
      evidenceReview: [
        'Major XRD reflections align with the expected cubic spinel pattern.',
        'Raman context supports local spinel symmetry through the A1g mode.',
        'XPS remains required for surface oxidation-state validation.',
        'FTIR provides bonding and surface context but is not sufficient for phase assignment.',
      ],
      limitations: [
        'Weak unresolved reflections limit phase-purity strength.',
        'XPS is surface-sensitive and cannot establish bulk stoichiometry alone.',
        'Crystallite size and strain separation require additional refinement.',
      ],
      materialSystem: canonicalDemoScenario.materialSystem,
      datasetLabel: 'XRD reference dataset',
    };
  }

  return {
    processedResult: 'Dispersed CuFe₂O₄ reflections in CuFe₂O₄/SBA-15 XRD-centered processing',
    summary:
      'Processed evidence supports CuFe₂O₄ spinel ferrite reflections in the supported CuFe₂O₄/SBA-15 sample while support interaction, loading uniformity, and surface oxidation-state assignment remain validation-limited.',
    evidenceReview: [
      'CuFe₂O₄-assigned XRD reflections remain visible in the supported CuFe₂O₄/SBA-15 sample.',
      'Raman context supports ferrite-like local structure but does not establish loading uniformity.',
      'FTIR silica/support features contextualize the SBA-15 matrix.',
      'XPS remains required for surface oxidation-state and enrichment review.',
    ],
    limitations: [
      'The result should not be framed as pure or bulk CuFe₂O₄ phase confirmation.',
      'Phase distribution and loading uniformity across SBA-15 remain validation-limited.',
      'Support interaction and surface oxidation state require additional validation.',
    ],
    materialSystem: 'CuFe₂O₄ on mesoporous SBA-15',
    datasetLabel: 'XRD reference dataset',
  };
}

function getDiscussionDraft(projectId: string, templateMode: NotebookTemplateMode) {
  const project = getWorkflowProject(projectId);
  const validationLine = project.validationGaps.length
    ? project.validationGaps.map((gap) => gap.description).join(' ')
    : 'No open validation gap is recorded in the selected project context.';
  const nextDecision = project.nextDecisions[0]?.label ?? 'Preserve the current evidence boundary';

  if (templateMode === 'research') {
    return `${project.notebook.phaseIdentification} ${project.notebook.keyEvidence} ${validationLine}`;
  }

  if (templateMode === 'rd') {
    return `The selected ${project.name} evidence supports continued R&D review within the current ${project.validationState.replace(/_/g, ' ')} state. The next workflow decision is: ${nextDecision}. ${validationLine}`;
  }

  return `The selected ${project.name} result is valid within the recorded project evidence scope: ${project.summary} ${validationLine}`;

  if (templateMode === 'research') {
    return isSba15Project(projectId) ? SBA15_RESEARCH_DISCUSSION_DRAFT : RESEARCH_DISCUSSION_DRAFT;
  }

  if (templateMode === 'rd') {
    return isSba15Project(projectId)
      ? 'The processed characterization result supports continued R&D review of dispersed CuFe₂O₄ on mesoporous SBA-15. The evidence is suitable for optimization planning around loading uniformity, dispersion, support interaction, and surface-state validation, but it should not yet be treated as a scale-up-ready material decision.'
      : 'The processed characterization result indicates that the CuFe₂O₄ spinel ferrite candidate is structurally plausible for continued prototype review. The evidence is strong enough to continue optimization around synthesis reproducibility and surface-state validation, but it should not yet be treated as a scale-up-ready material decision. The next R&D decision should focus on closing phase-purity, oxidation-state, and bulk-composition risks before go/no-go review.';
  }

  return isSba15Project(projectId)
    ? 'The processed evidence is consistent with CuFe₂O₄ spinel ferrite reflections in the supported CuFe₂O₄/SBA-15 sample within the current method scope. Additional validation of phase distribution, loading uniformity, support interaction, and surface oxidation state remains required before issuing a stronger analytical specification statement.'
    : 'The processed XRD result is consistent with a CuFe₂O₄ spinel ferrite assignment for the submitted sample. The result is valid for a characterization report when it is framed with the current method scope and pending QA/QC requirements. Additional XPS review, quantitative phase assessment, and composition validation remain required before issuing a stronger specification statement.';
}

export function normalizeNotebookTemplateMode(value?: string | null): NotebookTemplateMode {
  if (value === 'rd' || value === 'r-and-d' || value === 'rnd') return 'rd';
  if (value === 'analytical' || value === 'analytical-job') return 'analytical';
  return 'research';
}

export function createProcessingResultFromXrdDemo(projectId = DEFAULT_PROJECT_ID): ProcessingResult {
  const project = getWorkflowProject(projectId);
  const primaryTechnique = getPrimaryTechnique(project);
  const sourceRoute = `/workspace/${primaryTechnique.toLowerCase()}?project=${project.id}`;
  const copy = getProcessingResultCopy(project.id);
  const detectedFeatures = primaryTechnique === 'XRD' && project.techniques.includes('XRD')
    ? project.xrdPeaks
    : [];

  return {
    id: `processing-${project.id}-${primaryTechnique.toLowerCase()}-demo`,
    projectId: project.id,
    technique: primaryTechnique,
    sourceRoute,
    processedAt: DEMO_TIMESTAMP,
    title: `${project.name} ${primaryTechnique} processing result`,
    sampleId: project.id,
    materialSystem: copy.materialSystem,
    processedResult: copy.processedResult,
    summary: copy.summary,
    detectedFeatures,
    evidenceReview: copy.evidenceReview,
    limitations: copy.limitations,
    followUpValidation: getProjectValidationNotes(project.id),
    metrics: [
      { label: 'Primary Technique', value: primaryTechnique },
      { label: 'Evidence Bundle', value: `${project.evidenceSources.length} project sources` },
      { label: 'Detected Features', value: detectedFeatures.length ? String(detectedFeatures.length) : copy.datasetLabel },
      { label: 'Evidence State', value: project.reportReadiness.label },
    ],
  };
}

export function refineDiscussionFromProcessing(
  processingResult: ProcessingResult,
  templateMode: NotebookTemplateMode,
): AgentDiscussionRefinement {
  const template = NOTEBOOK_TEMPLATES[templateMode];
  const discussionDraft = getDiscussionDraft(processingResult.projectId, templateMode);
  const projectClaimBoundary = getProjectClaimBoundary(processingResult.projectId);
  const conditionLock = getLatestExperimentConditionLock(processingResult.projectId);
  const conditionBoundaryNotes = conditionLock
    ? getConditionBoundaryNotes(conditionLock, [processingResult.technique])
    : [];
  const claimBoundary = {
    ...projectClaimBoundary,
    pending: [
      ...(projectClaimBoundary.pending ?? []),
      ...conditionBoundaryNotes,
    ],
  };
  const validationNotes = [
    ...getProjectValidationNotes(processingResult.projectId),
    ...conditionBoundaryNotes,
  ];

  return {
    id: `refinement-${processingResult.id}-${templateMode}`,
    projectId: processingResult.projectId,
    processingResultId: processingResult.id,
    templateMode,
    sourceRoute: `/demo/agent?project=${processingResult.projectId}&processing=${processingResult.id}&template=${templateMode}`,
    title: 'Refined Discussion',
    subtitle: `Refined from ${processingResult.technique} processing result and evidence review`,
    microFlow: TEMPLATE_MICRO_FLOWS[templateMode],
    discussionDraft,
    claimBoundary,
    validationNotes,
    statusSummary: template.statusLabels.map((label, index) => ({
      label,
      value: TEMPLATE_STATUS_VALUES[templateMode][index] ?? 'Review-ready',
    })),
    reportTemplate: template.reportTemplate,
    refinedAt: DEMO_TIMESTAMP,
  };
}

export function createNotebookEntryFromRefinement(
  refinement: AgentDiscussionRefinement,
  templateMode: NotebookTemplateMode,
): NotebookEntry {
  const template = NOTEBOOK_TEMPLATES[templateMode];

  return {
    id: `notebook-${refinement.projectId}-${templateMode}`,
    projectId: refinement.projectId,
    templateMode,
    templateLabel: template.label,
    refinementId: refinement.id,
    processingResultId: refinement.processingResultId,
    createdAt: DEMO_TIMESTAMP,
    title: `${template.label}: ${getTemplateEntryTitle(templateMode)}`,
    subtitle: refinement.subtitle,
    sourceLabel: 'Source: Processing Result -> Interpretation Refinement -> Notebook Entry',
    stepperLabels: template.stepperLabels,
    tabs: template.tabs,
    requiredSections: template.requiredSections,
    statusSummary: refinement.statusSummary,
    sections: getTemplateSections(refinement, templateMode),
    reportTemplate: template.reportTemplate,
  };
}

export function createReportSectionFromNotebookEntry(entry: NotebookEntry): ReportSection {
  const discussion =
    entry.sections.find((section) => section.heading === getReportSourceSectionHeading(entry.templateMode)) ??
    entry.sections[0];
  const lines = discussion?.lines ?? [];

  return {
    id: `report-${entry.id}`,
    projectId: entry.projectId,
    notebookEntryId: entry.id,
    template: entry.reportTemplate,
    heading: getReportSectionHeading(entry.templateMode),
    body: lines.join('\n'),
    lines,
    sourceLabel: entry.sourceLabel,
  };
}

function getTemplateEntryTitle(templateMode: NotebookTemplateMode) {
  if (templateMode === 'rd') return 'Go/No-Go Rationale';
  if (templateMode === 'analytical') return 'Reviewed Result';
  return 'Refined Discussion';
}

function getReportSourceSectionHeading(templateMode: NotebookTemplateMode) {
  if (templateMode === 'rd') return 'Go/No-Go Decision';
  if (templateMode === 'analytical') return 'Analytical Result';
  return 'Refined Discussion';
}

function getReportSectionHeading(templateMode: NotebookTemplateMode) {
  if (templateMode === 'rd') return 'Technical Report Section';
  if (templateMode === 'analytical') return 'Analytical Report Section';
  return 'Manuscript Discussion Section';
}

function getTemplateSections(
  refinement: AgentDiscussionRefinement,
  templateMode: NotebookTemplateMode,
): NotebookEntry['sections'] {
  if (templateMode === 'rd') {
    return [
      { heading: 'Development Status', lines: ['Prototype characterization supports continued technical validation.'] },
      {
        heading: 'Prototype Metrics',
        lines: [
          'Target Achievement: spinel ferrite assignment is structurally plausible.',
          'Technical Requirement: close phase-purity and oxidation-state validation gaps before scale-up review.',
          'Metrics: detected reflections and cross-technique support meet the current prototype review threshold.',
        ],
      },
      {
        heading: 'Risk Review',
        lines: [
          ...refinement.claimBoundary.requiresValidation.map((item) => `Risk Level: ${item}`),
          ...refinement.claimBoundary.notSupportedYet.map((item) => `Scale-up readiness gap: ${item}`),
        ],
      },
      {
        heading: 'Go/No-Go Decision',
        lines: [
          'Go/No-Go Decision: continue optimization with validation gates.',
          'Go/No-Go Rationale: prototype evidence is sufficient for the next development plan but not yet scale-up ready.',
        ],
      },
      { heading: 'Next Development Plan', lines: refinement.validationNotes },
    ];
  }

  if (templateMode === 'analytical') {
    return [
      {
        heading: 'Sample Context',
        lines: [
          'Sample: CuFe₂O₄ spinel ferrite characterization specimen.',
          'Analytical Run: XRD-centered method execution with supporting Raman, XPS, and FTIR context.',
        ],
      },
      {
        heading: 'Method / SOP',
        lines: [
          'Method / SOP: process XRD reflections, compare diagnostic spinel peaks, and document QA/QC limitations.',
          'Calibration: reference-pattern comparison remains the current calibration boundary.',
        ],
      },
      {
        heading: 'QA/QC Review',
        lines: [
          'QA/QC Status: review-ready within method scope.',
          ...refinement.claimBoundary.requiresValidation.map((item) => `QA/QC requirement: ${item}`),
        ],
      },
      {
        heading: 'Analytical Result',
        lines: [
          'Analytical Result: result validity supports a CuFe₂O₄ spinel ferrite assignment within the current method scope.',
          'Result Validity: screening-level support; retest or complementary validation required for stronger specification claims.',
        ],
      },
      {
        heading: 'Review / Retest Decision',
        lines: ['Review / Retest: screening-level support with retest requirements for phase purity, surface state, and bulk composition.'],
      },
    ];
  }

  return [
    { heading: 'Refined Discussion', lines: [refinement.discussionDraft] },
    { heading: 'Evidence Status', lines: ['Evidence Status: ready with validation requirements.'] },
    {
      heading: 'Claim Boundary',
      lines: [
        ...refinement.claimBoundary.supported.map((item) => `Supported: ${item}`),
        ...(refinement.claimBoundary.contextual?.map((item) => `Contextual: ${item}`) ?? []),
        ...refinement.claimBoundary.requiresValidation.map((item) => `Requires validation: ${item}`),
        ...(refinement.claimBoundary.pending?.map((item) => `Pending: ${item}`) ?? []),
        ...refinement.claimBoundary.notSupportedYet.map((item) => `Not supported yet: ${item}`),
      ],
    },
    { heading: 'Validation Notes', lines: refinement.validationNotes },
    { heading: 'Manuscript Draft', lines: ['Publication Readiness: publication-limited until validation notes are closed.'] },
  ];
}

export function getNotebookTemplate(mode: NotebookTemplateMode): NotebookTemplate {
  return NOTEBOOK_TEMPLATES[mode];
}

export function getProcessingResult(id?: string | null): ProcessingResult | null {
  if (!id) return null;
  return readWorkflowList<ProcessingResult>(PROCESSING_RESULTS_KEY).find((item) => item.id === id) ?? null;
}

export function getLatestProcessingResult(projectId = DEFAULT_PROJECT_ID): ProcessingResult | null {
  const results = readWorkflowList<ProcessingResult>(PROCESSING_RESULTS_KEY).filter((item) => item.projectId === projectId);
  return results.length > 0 ? results[results.length - 1] : null;
}

export function saveProcessingResult(result: ProcessingResult): ProcessingResult {
  upsertWorkflowItem(PROCESSING_RESULTS_KEY, result);
  return result;
}

export function getLatestAgentDiscussionRefinement(
  projectId = DEFAULT_PROJECT_ID,
  templateMode?: NotebookTemplateMode,
): AgentDiscussionRefinement | null {
  const refinements = readWorkflowList<AgentDiscussionRefinement>(DISCUSSION_REFINEMENTS_KEY).filter(
    (item) => item.projectId === projectId && (!templateMode || item.templateMode === templateMode),
  );
  return refinements.length > 0 ? refinements[refinements.length - 1] : null;
}

export function saveAgentDiscussionRefinement(refinement: AgentDiscussionRefinement): AgentDiscussionRefinement {
  upsertWorkflowItem(DISCUSSION_REFINEMENTS_KEY, refinement);
  return refinement;
}

export function getNotebookEntry(id?: string | null): NotebookEntry | null {
  if (!id) return null;
  return readWorkflowList<NotebookEntry>(NOTEBOOK_ENTRIES_KEY).find((item) => item.id === id) ?? null;
}

export function getLatestNotebookEntry(
  projectId = DEFAULT_PROJECT_ID,
  templateMode?: NotebookTemplateMode,
): NotebookEntry | null {
  const entries = readWorkflowList<NotebookEntry>(NOTEBOOK_ENTRIES_KEY).filter(
    (item) => item.projectId === projectId && (!templateMode || item.templateMode === templateMode),
  );
  return entries.length > 0 ? entries[entries.length - 1] : null;
}

export function saveNotebookEntry(entry: NotebookEntry): NotebookEntry {
  upsertWorkflowItem(NOTEBOOK_ENTRIES_KEY, entry);
  return entry;
}

function readWorkflowList<T>(key: string): T[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function upsertWorkflowItem<T extends { id: string }>(key: string, item: T) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const items = readWorkflowList<T>(key);
  window.localStorage.setItem(key, JSON.stringify([...items.filter((current) => current.id !== item.id), item]));
}
