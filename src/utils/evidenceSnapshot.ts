import {
  DEFAULT_PROJECT_ID,
  getProject,
  getProjectDatasets,
  getSavedEvidence,
  type DemoDataset,
  type DemoProject,
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
import {
  getRuntimeContextForEvidenceSource,
  type EvidenceSourceMode,
  type PermissionMode,
  type RuntimeApprovalStatus,
  type RuntimeMode,
} from '../runtime/difaryxRuntimeMode';
import {
  getAnalysisSession,
  getAnalysisSessions,
  seedAnalysisSessions,
  type AnalysisSession,
  type AnalysisTechnique,
} from '../data/analysisSessions';
import {
  readUploadedSignalRuns,
  type Technique as UploadedTechnique,
  type UploadedSignalRun,
} from '../data/uploadedSignalRuns';
import {
  createMockDriveEvidencePreview,
  type GoogleDriveImportPreview,
} from '../runtime/googleDriveImport';

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
  sourceMode?: EvidenceSourceMode;
  runtimeMode?: RuntimeMode;
  permissionMode?: PermissionMode;
  sourceLabel?: string;
  approvalStatus?: RuntimeApprovalStatus;
}

export interface ProjectEvidenceSnapshotOptions {
  source?: string | null;
  analysisSessionId?: string | null;
  uploadedRunId?: string | null;
  driveFileId?: string | null;
  driveImportPreview?: GoogleDriveImportPreview | null;
  runtimeMode?: RuntimeMode;
}

const TECHNIQUE_ORDER: Technique[] = ['XRD', 'XPS', 'FTIR', 'Raman'];
const SEED_ANALYSIS_SESSION_IDS = new Set(seedAnalysisSessions.map((session) => session.analysisId));

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

function textMentionsTechnique(text: string, technique: Technique) {
  return text.toLowerCase().includes(technique.toLowerCase());
}

function analysisTechniqueToTechnique(technique: AnalysisTechnique): Technique {
  if (technique === 'xps') return 'XPS';
  if (technique === 'ftir') return 'FTIR';
  if (technique === 'raman') return 'Raman';
  return 'XRD';
}

function uploadedTechniqueToTechnique(technique: UploadedTechnique, fallback: Technique): Technique {
  if (technique === 'XRD' || technique === 'XPS' || technique === 'FTIR' || technique === 'Raman') {
    return technique;
  }
  return fallback;
}

function getExpectedTechniques(project: DemoProject): Technique[] {
  const expected = new Set<Technique>(project.techniques);
  project.evidenceSources.forEach((source) => expected.add(source.technique));
  project.nextDecisions.forEach((decision) => {
    if (decision.linkedTechnique) expected.add(decision.linkedTechnique);
  });
  project.validationGaps.forEach((gap) => {
    TECHNIQUE_ORDER.forEach((technique) => {
      if (
        textMentionsTechnique(gap.description, technique) ||
        textMentionsTechnique(gap.suggestedResolution, technique)
      ) {
        expected.add(technique);
      }
    });
  });
  return TECHNIQUE_ORDER.filter((technique) => expected.has(technique));
}

function getLatestUserSessionForProject(projectId: string): AnalysisSession | null {
  const sessions = getAnalysisSessions()
    .filter((session) => session.projectId === projectId && !SEED_ANALYSIS_SESSION_IDS.has(session.analysisId))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return sessions[0] ?? null;
}

function getUploadedRun(options?: ProjectEvidenceSnapshotOptions): UploadedSignalRun | null {
  const runs = readUploadedSignalRuns();
  if (options?.uploadedRunId) {
    return runs.find((run) => run.id === options.uploadedRunId) ?? null;
  }
  if (options?.source === 'uploaded-beta' || options?.source === 'user_uploaded') {
    return runs[0] ?? null;
  }
  return null;
}

function isUploadedSnapshotRequested(options?: ProjectEvidenceSnapshotOptions) {
  return Boolean(
    options?.uploadedRunId ||
    options?.analysisSessionId ||
    options?.source === 'uploaded-beta' ||
    options?.source === 'quick_analysis' ||
    options?.source === 'user_uploaded',
  );
}

function isGoogleConnectedSnapshotRequested(options?: ProjectEvidenceSnapshotOptions) {
  return options?.source === 'google_drive_connected' ||
    options?.source === 'google-drive-connected' ||
    (options?.source === 'mixed' && Boolean(options.driveFileId));
}

function makeSessionDataset(project: DemoProject, session: AnalysisSession, technique: Technique): DemoDataset {
  const markerPoints = session.graphData.markers.map((marker) => ({
    x: marker.position,
    y: marker.intensity,
  }));

  return {
    id: session.analysisId,
    projectId: project.id,
    technique,
    fileName: session.fileName,
    sampleName: session.projectName ?? session.title,
    xLabel: session.graphData.axisLabel,
    yLabel: session.graphData.yLabel,
    dataPoints: markerPoints,
    metadata: {
      experimentTitle: session.title,
      sampleName: session.projectName ?? session.title,
      materialSystem: project.material,
      operator: session.owner,
      date: session.updatedAt,
      notes: 'User-uploaded analysis session. Interpretation remains validation-limited until project-specific references are reviewed.',
    },
    processingState: {
      imported: true,
      baseline: session.processingPipeline.some((step) => step.label.toLowerCase().includes('baseline') && step.status === 'completed'),
      smoothing: session.processingPipeline.some((step) => step.label.toLowerCase().includes('smoothing') && step.status === 'completed'),
      normalize: false,
    },
    detectedFeatures: session.graphData.markers.map((marker) => ({
      position: marker.position,
      intensity: marker.intensity,
      label: marker.label,
    })),
    evidence: [],
    savedRuns: [session.analysisId],
  };
}

function makeUploadedRunDataset(project: DemoProject, run: UploadedSignalRun, technique: Technique): DemoDataset {
  return {
    id: run.id,
    projectId: project.id,
    technique,
    fileName: run.fileName,
    sampleName: run.sampleIdentity,
    xLabel: run.xAxisLabel,
    yLabel: run.yAxisLabel,
    dataPoints: run.points,
    metadata: {
      experimentTitle: `Uploaded evidence - ${run.fileName}`,
      sampleName: run.sampleIdentity,
      materialSystem: project.material,
      operator: 'User upload',
      date: run.createdAt,
      notes: run.lockedContext.referenceScope,
    },
    processingState: {
      imported: true,
      baseline: false,
      smoothing: false,
      normalize: false,
    },
    detectedFeatures: run.extractedFeatures.map((feature) => ({
      position: feature.position,
      intensity: feature.intensity,
      label: feature.label,
    })),
    evidence: [],
    savedRuns: [run.id],
  };
}

function makeDrivePreviewDataset(
  project: DemoProject,
  preview: GoogleDriveImportPreview,
  technique: Technique,
): DemoDataset {
  const basePoints = technique === 'XRD'
    ? [
        { x: 30.1, y: 22 },
        { x: 35.5, y: 85 },
        { x: 43.2, y: 48 },
        { x: 57.1, y: 38 },
        { x: 62.7, y: 34 },
      ]
    : [
        { x: 120, y: 12 },
        { x: 360, y: 34 },
        { x: 690, y: 28 },
        { x: 1010, y: 42 },
        { x: 1350, y: 31 },
      ];

  return {
    id: preview.selectedFile.fileId,
    projectId: project.id,
    technique,
    fileName: preview.selectedFile.fileName,
    sampleName: preview.sampleIdentity,
    xLabel: technique === 'XRD' ? '2theta (deg)' : 'Signal axis',
    yLabel: 'Intensity (a.u.)',
    dataPoints: basePoints,
    metadata: {
      experimentTitle: `Drive import shell - ${preview.selectedFile.fileName}`,
      sampleName: preview.sampleIdentity,
      materialSystem: project.material,
      operator: 'Google Drive import shell',
      date: preview.selectedFile.modifiedTimeLabel,
      notes: 'Mock Drive evidence preview. Read-only connected evidence; no real Drive file access or external write occurred.',
    },
    processingState: {
      imported: true,
      baseline: false,
      smoothing: false,
      normalize: false,
    },
    detectedFeatures: basePoints.slice(1, 4).map((point, index) => ({
      position: point.x,
      intensity: point.y,
      label: `${technique}-${index + 1}`,
    })),
    evidence: [],
    savedRuns: [preview.selectedFile.fileId],
  };
}

function makeUploadValidationGaps(
  project: DemoProject,
  pendingTechniques: Technique[],
  sourceLabel: string,
): ValidationGap[] {
  return [
    {
      id: `${project.id}-uploaded-evidence-boundary`,
      description: `${sourceLabel} is local evidence; project-specific reference review and complementary validation are required before claim closure.`,
      severity: 'moderate',
      suggestedResolution: 'Review references, attach complementary evidence, and preserve the validation-limited claim boundary.',
    },
    ...pendingTechniques.map<ValidationGap>((technique) => ({
      id: `${project.id}-uploaded-pending-${technique.toLowerCase()}`,
      description: `${technique} validation evidence remains pending for the uploaded evidence bundle.`,
      severity: 'moderate',
      suggestedResolution: `Add ${technique} evidence or keep the report validation-limited.`,
    })),
  ];
}

function buildUploadedSessionSnapshot(
  project: DemoProject,
  session: AnalysisSession,
  expectedTechniques: Technique[],
  options?: ProjectEvidenceSnapshotOptions,
): ProjectEvidenceSnapshot {
  const technique = analysisTechniqueToTechnique(session.technique);
  const runtimeContext = getRuntimeContextForEvidenceSource('user_uploaded', options?.runtimeMode);
  const pendingTechniques = expectedTechniques.filter((candidate) => candidate !== technique);
  const activeDataset = makeSessionDataset(project, session, technique);
  const sourceLabel = 'User-uploaded evidence';
  const support = `${technique} uploaded session "${session.fileName}" is available with ${session.extractedFeatures.length} extracted feature${session.extractedFeatures.length === 1 ? '' : 's'}; assignment remains validation-limited until project-specific references are reviewed.`;
  const validationGaps = makeUploadValidationGaps(project, pendingTechniques, sourceLabel);

  return {
    projectId: project.id,
    projectName: project.name,
    sampleIdentity: session.projectName ?? session.title,
    primaryTechnique: technique,
    availableTechniques: [technique],
    pendingTechniques,
    evidenceEntries: [{
      id: `uploaded-session-${session.analysisId}`,
      technique,
      datasetId: session.analysisId,
      datasetLabel: session.fileName,
      status: 'available',
      claim: `User-uploaded ${technique} evidence`,
      support,
      limitations: 'Uploaded evidence is read-only local context and does not close the project claim boundary by itself.',
    }],
    activeDataset,
    validationGaps,
    claimBoundary: {
      supported: [support],
      requiresValidation: validationGaps.map((gap) => gap.description),
      notSupportedYet: [`Uploaded ${technique} evidence does not by itself confirm ${project.phase}.`],
      contextual: [`Source: ${sourceLabel}`, `File: ${session.fileName}`],
      pending: pendingTechniques.map((candidate) => `${candidate} validation evidence pending`),
    },
    supportedAssignment: `Uploaded ${technique} evidence for ${session.projectName ?? session.title}`,
    notebookContext: null,
    reportContext: null,
    sourceMode: runtimeContext.sourceMode,
    runtimeMode: runtimeContext.runtimeMode,
    permissionMode: runtimeContext.permissionMode,
    sourceLabel: runtimeContext.sourceLabel,
    approvalStatus: runtimeContext.approvalStatus,
  };
}

function buildUploadedRunSnapshot(
  project: DemoProject,
  run: UploadedSignalRun,
  expectedTechniques: Technique[],
  options?: ProjectEvidenceSnapshotOptions,
): ProjectEvidenceSnapshot {
  const fallbackTechnique = getPrimaryTechnique(project.techniques);
  const technique = uploadedTechniqueToTechnique(run.technique, fallbackTechnique);
  const hasKnownTechnique = run.technique !== 'Unknown';
  const runtimeContext = getRuntimeContextForEvidenceSource('user_uploaded', options?.runtimeMode);
  const availableTechniques = hasKnownTechnique ? [technique] : [];
  const pendingTechniques = expectedTechniques.filter((candidate) => !availableTechniques.includes(candidate));
  const activeDataset = makeUploadedRunDataset(project, run, technique);
  const sourceLabel = 'User-uploaded evidence';
  const support = hasKnownTechnique
    ? `${technique} uploaded signal "${run.fileName}" produced ${run.extractedFeatures.length} bounded feature${run.extractedFeatures.length === 1 ? '' : 's'} for ${run.sampleIdentity}.`
    : `Uploaded signal "${run.fileName}" is available for ${run.sampleIdentity}, but technique mapping is still required.`;
  const validationGaps = [
    {
      id: `${project.id}-uploaded-quality-${run.id}`,
      description: run.evidenceQuality.canInterpret
        ? 'Uploaded evidence is feature-ready, but remains validation-limited until reference scope and complementary evidence are reviewed.'
        : `Uploaded evidence quality is ${run.evidenceQuality.label}; bounded interpretation is not yet ready.`,
      severity: run.evidenceQuality.canInterpret ? 'moderate' as const : 'critical' as const,
      suggestedResolution: run.evidenceQuality.canInterpret
        ? 'Attach complementary evidence and preserve uploaded provenance in Notebook/Report.'
        : 'Review mapping, signal quality, and technique assignment before Notebook/Report handoff.',
    },
    ...makeUploadValidationGaps(project, pendingTechniques, sourceLabel),
  ];

  return {
    projectId: project.id,
    projectName: project.name,
    sampleIdentity: run.sampleIdentity,
    primaryTechnique: technique,
    availableTechniques,
    pendingTechniques,
    evidenceEntries: hasKnownTechnique ? [{
      id: `uploaded-run-${run.id}`,
      technique,
      datasetId: run.id,
      datasetLabel: run.fileName,
      status: 'available',
      claim: `User-uploaded ${technique} evidence`,
      support,
      limitations: run.claimBoundary.join(' '),
    }] : [],
    activeDataset,
    validationGaps,
    claimBoundary: {
      supported: hasKnownTechnique ? [support] : [],
      requiresValidation: validationGaps.map((gap) => gap.description),
      notSupportedYet: [`Uploaded evidence does not by itself confirm ${project.phase}.`],
      contextual: [`Source: ${sourceLabel}`, `File: ${run.fileName}`, `Reference scope: ${run.lockedContext.referenceScope}`],
      pending: pendingTechniques.map((candidate) => `${candidate} validation evidence pending`),
    },
    supportedAssignment: hasKnownTechnique
      ? `Uploaded ${technique} evidence for ${run.sampleIdentity}`
      : `Uploaded evidence for ${run.sampleIdentity}`,
    notebookContext: null,
    reportContext: null,
    sourceMode: runtimeContext.sourceMode,
    runtimeMode: runtimeContext.runtimeMode,
    permissionMode: runtimeContext.permissionMode,
    sourceLabel: runtimeContext.sourceLabel,
    approvalStatus: runtimeContext.approvalStatus,
  };
}

function buildGoogleDriveSnapshot(
  project: DemoProject,
  expectedTechniques: Technique[],
  options?: ProjectEvidenceSnapshotOptions,
): ProjectEvidenceSnapshot {
  const primaryTechnique = getPrimaryTechnique(project.techniques);
  const preview = options?.driveImportPreview ?? createMockDriveEvidencePreview({
    projectId: project.id,
    projectName: project.name,
    sampleIdentity: project.material,
    supportedTechnique: primaryTechnique,
    expectedTechniques,
    driveFileId: options?.driveFileId,
  });
  const runtimeContext = getRuntimeContextForEvidenceSource('google_drive_connected', 'connected');
  const activeDataset = makeDrivePreviewDataset(project, preview, preview.detectedTechnique);
  const availableTechniques = [preview.detectedTechnique];
  const pendingTechniques = expectedTechniques.filter((technique) => !availableTechniques.includes(technique));

  return {
    projectId: project.id,
    projectName: project.name,
    sampleIdentity: preview.sampleIdentity,
    primaryTechnique: preview.detectedTechnique,
    availableTechniques,
    pendingTechniques,
    evidenceEntries: preview.evidenceEntries,
    activeDataset,
    validationGaps: preview.validationGaps,
    claimBoundary: preview.claimBoundary,
    supportedAssignment: `Read-only Drive ${preview.detectedTechnique} evidence for ${preview.sampleIdentity}`,
    notebookContext: null,
    reportContext: null,
    sourceMode: runtimeContext.sourceMode,
    runtimeMode: runtimeContext.runtimeMode,
    permissionMode: runtimeContext.permissionMode,
    sourceLabel: runtimeContext.sourceLabel,
    approvalStatus: runtimeContext.approvalStatus,
  };
}

export function getProjectEvidenceSnapshot(
  projectId?: string | null,
  options?: ProjectEvidenceSnapshotOptions,
): ProjectEvidenceSnapshot {
  const resolvedProjectId = fallbackProjectId(projectId);
  const project = getProject(resolvedProjectId) ?? getProject(DEFAULT_PROJECT_ID)!;
  const datasets = getProjectDatasets(project.id);
  const expectedTechniques = getExpectedTechniques(project);
  const explicitSession = getAnalysisSession(options?.analysisSessionId ?? undefined);
  const uploadedRun = getUploadedRun(options);
  const projectUserSession = options?.source === 'user_uploaded' ? getLatestUserSessionForProject(project.id) : null;

  if (uploadedRun && isUploadedSnapshotRequested(options)) {
    return buildUploadedRunSnapshot(project, uploadedRun, expectedTechniques, options);
  }

  if ((explicitSession || projectUserSession) && isUploadedSnapshotRequested(options)) {
    return buildUploadedSessionSnapshot(project, explicitSession ?? projectUserSession!, expectedTechniques, options);
  }

  if (isGoogleConnectedSnapshotRequested(options)) {
    return buildGoogleDriveSnapshot(project, expectedTechniques, options);
  }

  const availableTechniques = TECHNIQUE_ORDER.filter((technique) =>
    expectedTechniques.includes(technique) &&
    (
      datasets.some((dataset) => dataset.technique === technique && dataset.dataPoints.length > 0) ||
      project.evidenceSources.some((source) => source.technique === technique && source.available)
    )
  );
  const pendingTechniques = TECHNIQUE_ORDER.filter((technique) =>
    expectedTechniques.includes(technique) && !availableTechniques.includes(technique),
  );
  const primaryTechnique = getPrimaryTechnique(project.techniques);
  const activeDataset =
    datasets.find((dataset) => dataset.technique === primaryTechnique && dataset.dataPoints.length > 0) ??
    datasets.find((dataset) => dataset.dataPoints.length > 0) ??
    null;
  const savedEvidence = getSavedEvidence(project.id);
  const datasetEvidence = datasets.flatMap((dataset) => dataset.evidence);
  const sourceEvidence: EvidenceSnapshotEntry[] = project.evidenceSources.map((source) => ({
    id: `${project.id}-${source.technique.toLowerCase()}-${source.datasetId}`,
    technique: source.technique,
    datasetId: source.datasetId,
    datasetLabel: source.datasetLabel,
    status: source.available ? 'available' : 'pending',
    claim: source.description,
    support: source.description,
    limitations: project.validationGaps.find((gap) =>
      textMentionsTechnique(gap.description, source.technique) ||
      textMentionsTechnique(gap.suggestedResolution, source.technique)
    )?.description,
  }));
  const evidenceEntries = [
    ...sourceEvidence,
    ...datasetEvidence.map((entry) =>
      mapEvidenceEntry(entry, datasets.find((dataset) => dataset.id === entry.datasetId) ?? null),
    ),
    ...savedEvidence.map((entry) =>
      mapEvidenceEntry(entry, datasets.find((dataset) => dataset.id === entry.datasetId) ?? null),
    ),
  ];
  const refinement = getLatestAgentDiscussionRefinement(project.id);
  const reportContext = getLatestProcessingResult(project.id);
  const notebookContext = getLatestNotebookEntry(project.id);
  const runtimeContext = isGoogleConnectedSnapshotRequested(options)
    ? getRuntimeContextForEvidenceSource('google_drive_connected', 'connected')
    : getRuntimeContextForEvidenceSource('demo_preloaded');

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
    sourceMode: runtimeContext.sourceMode,
    runtimeMode: runtimeContext.runtimeMode,
    permissionMode: runtimeContext.permissionMode,
    sourceLabel: runtimeContext.sourceLabel,
    approvalStatus: runtimeContext.approvalStatus,
  };
}
