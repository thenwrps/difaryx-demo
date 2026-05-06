import {
  DEFAULT_PROJECT_ID,
  getProject,
  type DemoPeak,
  type Technique,
} from './demoProjects';
import { canonicalDemoScenario } from './demo';

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
    requiredSections: ['Refined Discussion', 'Evidence Summary', 'Claim Boundary', 'Validation Notes', 'Manuscript Draft'],
    statusLabels: ['Evidence Status', 'Claim Readiness', 'Discussion Readiness', 'Publication Readiness'],
    reportTemplate: 'manuscript',
  },
  rd: {
    mode: 'rd',
    label: 'R&D Mode',
    stepperLabels: ['Need', 'Requirement', 'Prototype', 'Test', 'Optimize', 'Validate', 'Risk', 'Decision'],
    tabs: ['Overview', 'Prototype', 'Metrics', 'Evidence', 'Risk', 'Decision', 'Report'],
    requiredSections: ['Need Summary', 'Prototype Context', 'Evidence Review', 'Risk Boundary', 'Decision Record'],
    statusLabels: ['Development Status', 'Target Achievement', 'Scale-up Readiness', 'Risk Level', 'Go/No-Go Decision'],
    reportTemplate: 'technical_report',
  },
  analytical: {
    mode: 'analytical',
    label: 'Analytical-job Mode',
    stepperLabels: ['Sample', 'Prep', 'Method', 'Calibration', 'Run', 'QA/QC', 'Result', 'Report'],
    tabs: ['Sample', 'Method', 'QA/QC', 'Results', 'Interpretation', 'Report', 'Run Log'],
    requiredSections: ['Sample Context', 'Method Summary', 'QA/QC Review', 'Result Validity', 'Analytical Report'],
    statusLabels: ['QA/QC Status', 'Result Validity', 'Specification Status', 'Report Status'],
    reportTemplate: 'analytical_report',
  },
};

export const RESEARCH_DISCUSSION_DRAFT =
  'The processed XRD pattern supports assignment of the sample to a CuFe2O4 spinel ferrite structure, with the major reflections aligning with the expected cubic spinel reference pattern. Supporting Raman evidence strengthens the interpretation by indicating local spinel symmetry through the A1g mode. However, unresolved weak reflections and the surface-sensitive nature of XPS limit the strength of phase-purity and bulk-composition claims. The current notebook interpretation should therefore be framed as a supported CuFe2O4 spinel assignment with remaining validation requirements, rather than a final publication-level phase-pure confirmation.';

export const CLAIM_BOUNDARY = {
  supported: [
    'CuFe2O4 spinel phase assignment',
    'Literature-consistent lattice relation',
    'Cross-technique convergence with Raman/XPS context',
  ],
  requiresValidation: [
    'Phase purity',
    'Surface oxidation-state assignment',
    'Bulk Cu/Fe stoichiometry',
    'Crystallite size and strain separation',
  ],
  notSupportedYet: [
    'Final phase-pure confirmation',
    'Definitive bulk oxidation-state distribution',
  ],
};

export const VALIDATION_NOTES = [
  'Run Rietveld refinement for quantitative phase assessment.',
  'Review XPS Cu 2p, Fe 2p, and O 1s core-level spectra.',
  'Use TEM to validate morphology and crystallite-size assumptions.',
  'Use ICP-OES if bulk Cu/Fe composition is required.',
];

export function normalizeNotebookTemplateMode(value?: string | null): NotebookTemplateMode {
  if (value === 'rd' || value === 'r-and-d' || value === 'rnd') return 'rd';
  if (value === 'analytical' || value === 'analytical-job') return 'analytical';
  return 'research';
}

export function createProcessingResultFromXrdDemo(projectId = DEFAULT_PROJECT_ID): ProcessingResult {
  const project = getProject(projectId);
  const sourceRoute = `/workspace/xrd?project=${project.id}`;

  return {
    id: `processing-${project.id}-xrd-demo`,
    projectId: project.id,
    technique: 'XRD',
    sourceRoute,
    processedAt: DEMO_TIMESTAMP,
    title: `${project.name} XRD processing result`,
    sampleId: canonicalDemoScenario.sampleId,
    materialSystem: canonicalDemoScenario.materialSystem,
    processedResult: 'CuFe2O4 spinel ferrite assignment from XRD-centered processing',
    summary:
      'Processed XRD reflections align with a CuFe2O4 spinel ferrite reference pattern while surface and bulk-composition validation remain open.',
    detectedFeatures: project.xrdPeaks,
    evidenceReview: [
      'Major XRD reflections align with the expected cubic spinel pattern.',
      'Raman context supports local spinel symmetry through the A1g mode.',
      'XPS remains required for surface oxidation-state validation.',
      'FTIR provides bonding and surface context but is not definitive for phase assignment.',
    ],
    limitations: [
      'Weak unresolved reflections limit phase-purity strength.',
      'XPS is surface-sensitive and cannot establish bulk stoichiometry alone.',
      'Crystallite size and strain separation require additional refinement.',
    ],
    followUpValidation: VALIDATION_NOTES,
    metrics: [
      { label: 'Primary Technique', value: canonicalDemoScenario.primaryTechnique },
      { label: 'Supporting Context', value: canonicalDemoScenario.supportingTechniques.join(', ') },
      { label: 'Detected Reflections', value: String(project.xrdPeaks.length) },
      { label: 'Evidence State', value: 'Ready with validation requirements' },
    ],
  };
}

export function refineDiscussionFromProcessing(
  processingResult: ProcessingResult,
  templateMode: NotebookTemplateMode,
): AgentDiscussionRefinement {
  const template = NOTEBOOK_TEMPLATES[templateMode];
  const discussionDraft =
    templateMode === 'research'
      ? RESEARCH_DISCUSSION_DRAFT
      : templateMode === 'rd'
        ? 'The processed characterization result indicates that the CuFe2O4 spinel ferrite candidate is structurally plausible for continued prototype review. The evidence is strong enough to continue optimization around synthesis reproducibility and surface-state validation, but it should not yet be treated as a scale-up-ready material decision. The next R&D decision should focus on closing phase-purity, oxidation-state, and bulk-composition risks before go/no-go review.'
        : 'The processed XRD result is consistent with a CuFe2O4 spinel ferrite assignment for the submitted sample. The result is valid for a characterization report when it is framed with the current method scope and pending QA/QC requirements. Additional XPS review, quantitative phase assessment, and composition validation remain required before issuing a stronger final specification statement.';

  return {
    id: `refinement-${processingResult.id}-${templateMode}`,
    projectId: processingResult.projectId,
    processingResultId: processingResult.id,
    templateMode,
    sourceRoute: `/demo/agent?project=${processingResult.projectId}&processing=${processingResult.id}&template=${templateMode}`,
    title: 'Refined Discussion',
    subtitle: 'Sharpened from processing output and evidence review',
    microFlow: ['Processed Result', 'Evidence Review', 'Discussion Draft'],
    discussionDraft,
    claimBoundary: CLAIM_BOUNDARY,
    validationNotes: VALIDATION_NOTES,
    statusSummary: template.statusLabels.map((label, index) => ({
      label,
      value: index === template.statusLabels.length - 1 ? 'Pending' : index === 0 ? 'Ready' : 'In Progress',
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
    title: `${template.label}: Refined Discussion`,
    subtitle: refinement.subtitle,
    sourceLabel: 'Source: processing + interpretation refinement',
    stepperLabels: template.stepperLabels,
    tabs: template.tabs,
    requiredSections: template.requiredSections,
    statusSummary: refinement.statusSummary,
    sections: [
      { heading: 'Refined Discussion', lines: [refinement.discussionDraft] },
      {
        heading: 'Claim Boundary',
        lines: [
          ...refinement.claimBoundary.supported.map((item) => `Supported: ${item}`),
          ...refinement.claimBoundary.requiresValidation.map((item) => `Requires validation: ${item}`),
          ...refinement.claimBoundary.notSupportedYet.map((item) => `Not supported yet: ${item}`),
        ],
      },
      { heading: 'Validation Notes', lines: refinement.validationNotes },
      { heading: 'Report Template', lines: [`Template: ${template.reportTemplate}`] },
    ],
    reportTemplate: template.reportTemplate,
  };
}

export function createReportSectionFromNotebookEntry(entry: NotebookEntry): ReportSection {
  const discussion = entry.sections.find((section) => section.heading === 'Refined Discussion');
  const lines = discussion?.lines ?? [];

  return {
    id: `report-${entry.id}`,
    projectId: entry.projectId,
    notebookEntryId: entry.id,
    template: entry.reportTemplate,
    heading: 'Refined Discussion',
    body: lines.join('\n'),
    lines,
    sourceLabel: entry.sourceLabel,
  };
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
