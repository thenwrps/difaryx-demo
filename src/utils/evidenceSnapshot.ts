import {
  DEFAULT_PROJECT_ID,
  getProject,
  getProjectDatasets,
  getSavedEvidence,
  type DemoDataset,
  type Evidence,
  type Technique,
  type ValidationGap,
} from '../data/demoProjects';
import {
  getLatestNotebookEntry,
  getLatestProcessingResult,
  getLatestAgentDiscussionRefinement,
  type AgentDiscussionRefinement,
  type NotebookEntry,
  type ProcessingResult,
} from '../data/workflowPipeline';

export interface EvidenceSnapshotEntry {
  id: string;
  technique: Technique;
  datasetId: string;
  datasetLabel: string;
  status: 'available' | 'pending';
  claim: string;
  support: string;
  limitations?: string;
}

export interface ProjectEvidenceSnapshot {
  projectId: string;
  projectName: string;
  sampleIdentity: string;
  primaryTechnique: Technique;
  availableTechniques: Technique[];
  pendingTechniques: Technique[];
  evidenceEntries: EvidenceSnapshotEntry[];
  activeDataset: DemoDataset | null;
  validationGaps: ValidationGap[];
  claimBoundary: AgentDiscussionRefinement['claimBoundary'] | {
    supported: string[];
    requiresValidation: string[];
    notSupportedYet: string[];
    contextual: string[];
    pending: string[];
  };
  supportedAssignment: string;
  notebookContext: NotebookEntry | null;
  reportContext: ProcessingResult | null;
}

const TECHNIQUE_ORDER: Technique[] = ['XRD', 'XPS', 'FTIR', 'Raman'];

function fallbackProjectId(projectId?: string | null) {
  return getProject(projectId)?.id ?? DEFAULT_PROJECT_ID;
}

function getPrimaryTechnique(techniques: Technique[]): Technique {
  return techniques.find((technique) => technique === 'XRD') ?? techniques[0] ?? 'XRD';
}

function mapEvidenceEntry(evidence: Evidence, dataset: DemoDataset | null): EvidenceSnapshotEntry {
  return {
    id: evidence.id,
    technique: evidence.technique,
    datasetId: evidence.datasetId,
    datasetLabel: dataset?.fileName ?? evidence.datasetId,
    status: dataset ? 'available' : 'pending',
    claim: evidence.claim,
    support: evidence.support,
    limitations: evidence.limitations,
  };
}

export function getProjectEvidenceSnapshot(projectId?: string | null): ProjectEvidenceSnapshot {
  const resolvedProjectId = fallbackProjectId(projectId);
  const project = getProject(resolvedProjectId) ?? getProject(DEFAULT_PROJECT_ID)!;
  const datasets = getProjectDatasets(project.id);
  const availableTechniques = TECHNIQUE_ORDER.filter((technique) =>
    datasets.some((dataset) => dataset.technique === technique && dataset.dataPoints.length > 0) ||
    project.evidenceSources.some((source) => source.technique === technique && source.available),
  );
  const pendingTechniques = TECHNIQUE_ORDER.filter((technique) =>
    project.techniques.includes(technique) && !availableTechniques.includes(technique),
  );
  const primaryTechnique = getPrimaryTechnique(project.techniques);
  const activeDataset =
    datasets.find((dataset) => dataset.technique === primaryTechnique && dataset.dataPoints.length > 0) ??
    datasets.find((dataset) => dataset.dataPoints.length > 0) ??
    null;
  const savedEvidence = getSavedEvidence(project.id);
  const datasetEvidence = datasets.flatMap((dataset) => dataset.evidence);
  const evidenceEntries = [...datasetEvidence, ...savedEvidence].map((entry) =>
    mapEvidenceEntry(entry, datasets.find((dataset) => dataset.id === entry.datasetId) ?? null),
  );
  const refinement = getLatestAgentDiscussionRefinement(project.id);
  const reportContext = getLatestProcessingResult(project.id);
  const notebookContext = getLatestNotebookEntry(project.id);

  return {
    projectId: project.id,
    projectName: project.name,
    sampleIdentity: activeDataset?.sampleName ?? project.material,
    primaryTechnique,
    availableTechniques,
    pendingTechniques,
    evidenceEntries,
    activeDataset,
    validationGaps: project.validationGaps,
    claimBoundary: refinement?.claimBoundary ?? {
      supported: project.evidence.slice(0, 3),
      requiresValidation: project.validationGaps.map((gap) => gap.description),
      notSupportedYet: [`Claims beyond ${project.phase} remain validation-limited.`],
      contextual: project.evidenceSources.map((source) => `${source.technique}: ${source.datasetLabel}`),
      pending: project.nextDecisions.map((decision) => decision.label),
    },
    supportedAssignment: project.phase,
    notebookContext,
    reportContext,
  };
}
