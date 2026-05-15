import type { Technique, ValidationGap } from '../data/demoProjects';
import type { ProjectEvidenceSnapshot } from '../utils/evidenceSnapshot';
import type { PermissionMode, RuntimeMode } from './difaryxRuntimeMode';

export type EvidenceBundleSource = 'demo_preloaded' | 'user_uploaded' | 'google_drive_connected' | 'mixed';

export type EvidenceBundleFileStatus = 'available' | 'pending' | 'missing_required' | 'generated';

export type EvidenceBundleFileRole = 'primary' | 'supporting' | 'validation' | 'context' | 'generated';

export interface EvidenceBundleFile {
  fileId: string;
  fileName: string;
  sourceMode: Exclude<EvidenceBundleSource, 'mixed'>;
  sourceLabel: string;
  technique: Technique;
  fileType: string;
  status: EvidenceBundleFileStatus;
  role: EvidenceBundleFileRole;
  sampleIdentity: string;
  datasetLabel: string;
  provenanceLabel: string;
  readOnly: boolean;
}

export interface EvidenceBundle {
  bundleId: string;
  projectId: string;
  projectName: string;
  sampleIdentity: string;
  sourceMode: EvidenceBundleSource;
  sourceLabel: string;
  files: EvidenceBundleFile[];
  availableTechniques: Technique[];
  pendingTechniques: Technique[];
  missingRequiredTechniques: Technique[];
  generatedArtifacts: EvidenceBundleFile[];
  validationGaps: ValidationGap[];
  claimBoundary: ProjectEvidenceSnapshot['claimBoundary'];
  supportedAssignment: string;
  evidenceCompletenessScore: number;
  runtimeMode: RuntimeMode;
  permissionMode: PermissionMode;
}

interface CreateEvidenceBundleOptions {
  includeDemoContext?: boolean;
  generatedArtifacts?: EvidenceBundleFile[];
}

const TECHNIQUES: Technique[] = ['XRD', 'XPS', 'FTIR', 'Raman'];

function fileTypeFromName(fileName: string) {
  const match = fileName.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? 'registry';
}

function roleForTechnique(technique: Technique, primaryTechnique: Technique): EvidenceBundleFileRole {
  if (technique === primaryTechnique) return 'primary';
  if (technique === 'XPS' || technique === 'Raman') return 'validation';
  return 'supporting';
}

function sourceModeFromSnapshot(snapshot: ProjectEvidenceSnapshot): Exclude<EvidenceBundleSource, 'mixed'> {
  if (snapshot.sourceMode === 'user_uploaded') return 'user_uploaded';
  if (snapshot.sourceMode === 'google_drive_connected') return 'google_drive_connected';
  return 'demo_preloaded';
}

function sourceLabelForSource(sourceMode: EvidenceBundleSource) {
  if (sourceMode === 'mixed') return 'Mixed evidence bundle';
  if (sourceMode === 'google_drive_connected') return 'Google Drive connected evidence';
  if (sourceMode === 'user_uploaded') return 'User-uploaded evidence';
  return 'Demo evidence';
}

function makeAvailableFile(
  snapshot: ProjectEvidenceSnapshot,
  technique: Technique,
  datasetId: string,
  datasetLabel: string,
  sourceMode: Exclude<EvidenceBundleSource, 'mixed'>,
  role?: EvidenceBundleFileRole,
): EvidenceBundleFile {
  return {
    fileId: datasetId,
    fileName: datasetLabel,
    sourceMode,
    sourceLabel: sourceLabelForSource(sourceMode),
    technique,
    fileType: fileTypeFromName(datasetLabel),
    status: 'available',
    role: role ?? roleForTechnique(technique, snapshot.primaryTechnique),
    sampleIdentity: snapshot.sampleIdentity,
    datasetLabel,
    provenanceLabel: `${sourceLabelForSource(sourceMode)} / ${datasetLabel}`,
    readOnly: sourceMode !== 'demo_preloaded',
  };
}

function missingFile(snapshot: ProjectEvidenceSnapshot, technique: Technique): EvidenceBundleFile {
  return {
    fileId: `${snapshot.projectId}-${technique.toLowerCase()}-missing`,
    fileName: `${technique} validation evidence pending`,
    sourceMode: 'demo_preloaded',
    sourceLabel: 'Pending evidence',
    technique,
    fileType: 'pending',
    status: 'missing_required',
    role: 'validation',
    sampleIdentity: snapshot.sampleIdentity,
    datasetLabel: 'Pending validation evidence',
    provenanceLabel: `${technique} validation evidence missing from bundle`,
    readOnly: true,
  };
}

function demoContextFile(snapshot: ProjectEvidenceSnapshot): EvidenceBundleFile {
  return {
    fileId: `${snapshot.projectId}-demo-context`,
    fileName: `${snapshot.projectName} demo project context`,
    sourceMode: 'demo_preloaded',
    sourceLabel: 'Demo evidence',
    technique: snapshot.primaryTechnique,
    fileType: 'context',
    status: 'available',
    role: 'context',
    sampleIdentity: snapshot.sampleIdentity,
    datasetLabel: 'Project registry context',
    provenanceLabel: 'Demo project context included for mixed-bundle readiness',
    readOnly: true,
  };
}

function uniqueFiles(files: EvidenceBundleFile[]) {
  const seen = new Set<string>();
  return files.filter((file) => {
    const key = `${file.sourceMode}:${file.fileId}:${file.technique}:${file.status}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveBundleSource(files: EvidenceBundleFile[], fallback: EvidenceBundleSource): EvidenceBundleSource {
  const sources = new Set(files.filter((file) => file.status !== 'missing_required').map((file) => file.sourceMode));
  if (sources.size > 1) return 'mixed';
  return sources.values().next().value ?? fallback;
}

function scientificBoundaryLines(bundle: Pick<EvidenceBundle, 'availableTechniques'>) {
  const lines: string[] = [];
  if (bundle.availableTechniques.includes('XRD')) {
    lines.push('XRD supports crystal phase assignment but cannot confirm surface oxidation state alone.');
  }
  if (bundle.availableTechniques.includes('XPS')) {
    lines.push('XPS supports surface oxidation-state context but cannot confirm bulk crystal phase alone.');
  }
  if (bundle.availableTechniques.includes('Raman')) {
    lines.push('Raman supports local vibrational or spinel-related modes but not full phase purity alone.');
  }
  if (bundle.availableTechniques.includes('FTIR')) {
    lines.push('FTIR supports bonding or surface functional context but not crystal phase confirmation alone.');
  }
  return lines;
}

function recomputeBundle(
  base: Omit<EvidenceBundle, 'sourceMode' | 'sourceLabel' | 'availableTechniques' | 'pendingTechniques' | 'missingRequiredTechniques' | 'generatedArtifacts' | 'validationGaps' | 'claimBoundary' | 'evidenceCompletenessScore' | 'runtimeMode' | 'permissionMode'>,
  files: EvidenceBundleFile[],
  validationGaps: ValidationGap[],
  claimBoundary: ProjectEvidenceSnapshot['claimBoundary'],
): EvidenceBundle {
  const normalizedFiles = uniqueFiles(files);
  const availableTechniques = TECHNIQUES.filter((technique) =>
    normalizedFiles.some((file) => file.technique === technique && (file.status === 'available' || file.status === 'generated')),
  );
  const missingRequiredTechniques = TECHNIQUES.filter((technique) =>
    normalizedFiles.some((file) => file.technique === technique && file.status === 'missing_required'),
  );
  const pendingTechniques = TECHNIQUES.filter((technique) =>
    normalizedFiles.some((file) => file.technique === technique && file.status === 'pending'),
  );
  const generatedArtifacts = normalizedFiles.filter((file) => file.status === 'generated' || file.role === 'generated');
  const sourceMode = resolveBundleSource(normalizedFiles, 'demo_preloaded');
  const hasConnectedEvidence = sourceMode === 'mixed' || sourceMode === 'google_drive_connected' ||
    normalizedFiles.some((file) => file.sourceMode === 'google_drive_connected');
  const coverageDenominator = Math.max(1, availableTechniques.length + missingRequiredTechniques.length + pendingTechniques.length);
  const evidenceCompletenessScore = Math.round((availableTechniques.length / coverageDenominator) * 100);
  const bundleShell = { availableTechniques };
  const boundaryAdditions = scientificBoundaryLines(bundleShell);
  const reducedValidationGaps = availableTechniques.includes('XRD') && availableTechniques.includes('Raman') && availableTechniques.includes('XPS')
    ? validationGaps.map((gap) => ({ ...gap, severity: gap.severity === 'critical' ? 'moderate' : gap.severity }))
    : validationGaps;

  return {
    ...base,
    files: normalizedFiles,
    sourceMode,
    sourceLabel: sourceLabelForSource(sourceMode),
    availableTechniques,
    pendingTechniques,
    missingRequiredTechniques,
    generatedArtifacts,
    validationGaps: reducedValidationGaps,
    claimBoundary: {
      ...claimBoundary,
      requiresValidation: [
        ...claimBoundary.requiresValidation,
        ...boundaryAdditions,
      ],
      pending: [
        ...(claimBoundary.pending ?? []),
        ...missingRequiredTechniques.map((technique) => `${technique} validation evidence pending`),
      ],
    },
    evidenceCompletenessScore,
    runtimeMode: hasConnectedEvidence ? 'connected' : 'demo',
    permissionMode: hasConnectedEvidence ? 'approval_required' : 'read_only',
  };
}

export function createEvidenceBundleFromSnapshot(
  snapshot: ProjectEvidenceSnapshot,
  options: CreateEvidenceBundleOptions = {},
): EvidenceBundle {
  const sourceMode = sourceModeFromSnapshot(snapshot);
  const files: EvidenceBundleFile[] = [];
  if (snapshot.activeDataset) {
    files.push(makeAvailableFile(
      snapshot,
      snapshot.activeDataset.technique,
      snapshot.activeDataset.id,
      snapshot.activeDataset.fileName,
      sourceMode,
      'primary',
    ));
  }
  snapshot.evidenceEntries.forEach((entry) => {
    files.push(makeAvailableFile(snapshot, entry.technique, entry.datasetId, entry.datasetLabel, sourceMode));
  });
  snapshot.pendingTechniques.forEach((technique) => files.push(missingFile(snapshot, technique)));
  if (options.includeDemoContext && sourceMode !== 'demo_preloaded') {
    files.push(demoContextFile(snapshot));
  }
  if (options.generatedArtifacts?.length) {
    files.push(...options.generatedArtifacts);
  }

  const base = {
    bundleId: `bundle-${snapshot.projectId}-${sourceMode}-${snapshot.availableTechniques.join('-') || 'pending'}`,
    projectId: snapshot.projectId,
    projectName: snapshot.projectName,
    sampleIdentity: snapshot.sampleIdentity,
    files: [],
    supportedAssignment: snapshot.supportedAssignment,
  };

  return recomputeBundle(base, files, snapshot.validationGaps, snapshot.claimBoundary);
}

export function mergeEvidenceFilesIntoBundle(
  bundle: EvidenceBundle,
  files: EvidenceBundleFile[],
): EvidenceBundle {
  return recomputeBundle(bundle, [...bundle.files, ...files], bundle.validationGaps, bundle.claimBoundary);
}

export function getTechniqueCoverageFromBundle(bundle: EvidenceBundle) {
  return TECHNIQUES.map((technique) => {
    const file = bundle.files.find((item) => item.technique === technique && item.status !== 'missing_required');
    return {
      technique,
      status: bundle.availableTechniques.includes(technique)
        ? 'available'
        : bundle.pendingTechniques.includes(technique)
          ? 'pending'
          : bundle.missingRequiredTechniques.includes(technique)
            ? 'missing_required'
            : 'pending',
      sourceLabel: file?.sourceLabel ?? 'Pending evidence',
      fileName: file?.fileName ?? `${technique} validation evidence pending`,
    };
  });
}

export function getValidationGapsFromBundle(bundle: EvidenceBundle) {
  return [
    ...bundle.validationGaps,
    ...bundle.missingRequiredTechniques.map<ValidationGap>((technique) => ({
      id: `${bundle.bundleId}-${technique.toLowerCase()}-missing`,
      description: `${technique} evidence is missing from the normalized bundle.`,
      severity: 'moderate',
      suggestedResolution: `Add ${technique} evidence or keep the assignment validation-limited.`,
    })),
  ];
}

export function getBundleClaimBoundary(bundle: EvidenceBundle) {
  return bundle.claimBoundary;
}

export function evidenceBundleToSnapshotInput(bundle: EvidenceBundle) {
  return {
    projectId: bundle.projectId,
    projectName: bundle.projectName,
    sampleIdentity: bundle.sampleIdentity,
    availableTechniques: bundle.availableTechniques,
    pendingTechniques: [...new Set([...bundle.pendingTechniques, ...bundle.missingRequiredTechniques])],
    validationGaps: getValidationGapsFromBundle(bundle),
    claimBoundary: bundle.claimBoundary,
    supportedAssignment: bundle.supportedAssignment,
    runtimeMode: bundle.runtimeMode,
    permissionMode: bundle.permissionMode,
    sourceLabel: bundle.sourceLabel,
  };
}

export function getEvidenceBundleBadgeLabel(bundle: EvidenceBundle): string {
  if (bundle.sourceMode === 'mixed') return 'Mixed evidence bundle';
  if (bundle.sourceMode === 'google_drive_connected') return 'Drive evidence bundle';
  if (bundle.sourceMode === 'user_uploaded') return 'Uploaded evidence bundle';
  return 'Demo evidence bundle';
}
