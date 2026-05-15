import type { Technique, ValidationGap } from '../data/demoProjects';
import type { EvidenceSourceMode, PermissionMode, RuntimeMode } from './difaryxRuntimeMode';

export type GoogleDriveImportStatus =
  | 'not_configured'
  | 'shell_ready'
  | 'selected_mock_file'
  | 'imported_read_only'
  | 'error';

export interface GoogleDriveEvidenceFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  extension: string;
  sizeLabel: string;
  modifiedTimeLabel: string;
  sourceProvider: 'google_drive';
  readOnly: true;
}

export interface GoogleDriveImportEvidenceEntry {
  id: string;
  technique: Technique;
  datasetId: string;
  datasetLabel: string;
  status: 'available';
  claim: string;
  support: string;
  limitations: string;
}

export interface GoogleDriveImportPreview {
  provider: 'google_drive';
  status: GoogleDriveImportStatus;
  selectedFile: GoogleDriveEvidenceFile;
  supportedTechnique: Technique;
  detectedTechnique: Technique;
  sampleIdentity: string;
  evidenceEntries: GoogleDriveImportEvidenceEntry[];
  validationGaps: ValidationGap[];
  claimBoundary: {
    supported: string[];
    requiresValidation: string[];
    notSupportedYet: string[];
    contextual: string[];
    pending: string[];
  };
  sourceMode: EvidenceSourceMode;
  runtimeMode: RuntimeMode;
  permissionMode: PermissionMode;
  sourceLabel: string;
}

export interface GoogleDriveImportState {
  provider: 'google_drive';
  status: GoogleDriveImportStatus;
  selectedFile: GoogleDriveEvidenceFile | null;
  sourceMode: EvidenceSourceMode;
  runtimeMode: RuntimeMode;
  permissionMode: PermissionMode;
  sourceLabel: string;
  readOnly: true;
}

interface CreateMockDriveEvidencePreviewArgs {
  projectId: string;
  projectName: string;
  sampleIdentity: string;
  supportedTechnique: Technique;
  expectedTechniques: Technique[];
  driveFileId?: string | null;
}

const MOCK_DRIVE_FILES: GoogleDriveEvidenceFile[] = [
  {
    fileId: 'drive-cufe2o4-xrd',
    fileName: 'CuFe2O4_XRD_pattern_drive.xy',
    mimeType: 'text/plain',
    extension: 'xy',
    sizeLabel: '84 KB',
    modifiedTimeLabel: 'Mock preview / not from user Drive',
    sourceProvider: 'google_drive',
    readOnly: true,
  },
  {
    fileId: 'drive-raman-followup',
    fileName: 'Uploaded_Raman_followup_drive.csv',
    mimeType: 'text/csv',
    extension: 'csv',
    sizeLabel: '42 KB',
    modifiedTimeLabel: 'Mock preview / not from user Drive',
    sourceProvider: 'google_drive',
    readOnly: true,
  },
  {
    fileId: 'drive-xps-surface',
    fileName: 'XPS_surface_state_drive.txt',
    mimeType: 'text/plain',
    extension: 'txt',
    sizeLabel: '58 KB',
    modifiedTimeLabel: 'Mock preview / not from user Drive',
    sourceProvider: 'google_drive',
    readOnly: true,
  },
];

const TECHNIQUE_EXTENSION: Record<Technique, string> = {
  XRD: 'xy',
  XPS: 'txt',
  FTIR: 'csv',
  Raman: 'csv',
};

function techniqueFromFile(file: GoogleDriveEvidenceFile, fallback: Technique): Technique {
  const lowerName = file.fileName.toLowerCase();
  if (lowerName.includes('raman')) return 'Raman';
  if (lowerName.includes('xps')) return 'XPS';
  if (lowerName.includes('ftir')) return 'FTIR';
  if (lowerName.includes('xrd') || file.extension === 'xy') return 'XRD';
  return fallback;
}

function getMockFileForRequest(
  projectId: string,
  technique: Technique,
  driveFileId?: string | null,
): GoogleDriveEvidenceFile {
  const explicitFile = MOCK_DRIVE_FILES.find((file) => file.fileId === driveFileId);
  if (explicitFile) return explicitFile;

  if (projectId === 'cu-fe2o4-spinel' && technique === 'XRD') {
    return MOCK_DRIVE_FILES[0];
  }

  const matchingTechniqueFile = MOCK_DRIVE_FILES.find((file) => techniqueFromFile(file, technique) === technique);
  if (matchingTechniqueFile && technique !== 'XRD') return matchingTechniqueFile;

  const extension = TECHNIQUE_EXTENSION[technique];
  return {
    fileId: `drive-${projectId}-${technique.toLowerCase()}-preview`,
    fileName: `${projectId}_${technique}_drive_preview.${extension}`,
    mimeType: extension === 'csv' ? 'text/csv' : 'text/plain',
    extension,
    sizeLabel: 'Mock preview',
    modifiedTimeLabel: 'Mock preview / not from user Drive',
    sourceProvider: 'google_drive',
    readOnly: true,
  };
}

export function getDefaultDriveImportState(): GoogleDriveImportState {
  return {
    provider: 'google_drive',
    status: 'shell_ready',
    selectedFile: null,
    sourceMode: 'google_drive_connected',
    runtimeMode: 'connected',
    permissionMode: 'approval_required',
    sourceLabel: 'Google Drive connected evidence',
    readOnly: true,
  };
}

export function isDriveFileSupportedForTechnique(
  file: GoogleDriveEvidenceFile,
  technique: Technique,
): boolean {
  return techniqueFromFile(file, technique) === technique;
}

export function getDriveImportBadgeLabel(status: GoogleDriveImportStatus): string {
  if (status === 'shell_ready') return 'Drive import shell';
  if (status === 'selected_mock_file') return 'Mock Drive evidence preview';
  if (status === 'imported_read_only') return 'Read-only connected evidence';
  if (status === 'error') return 'Drive import shell error';
  return 'Drive import not configured';
}

export function createMockDriveEvidencePreview({
  projectId,
  projectName,
  sampleIdentity,
  supportedTechnique,
  expectedTechniques,
  driveFileId,
}: CreateMockDriveEvidencePreviewArgs): GoogleDriveImportPreview {
  const selectedFile = getMockFileForRequest(projectId, supportedTechnique, driveFileId);
  const detectedTechnique = techniqueFromFile(selectedFile, supportedTechnique);
  const pendingTechniques = expectedTechniques.filter((technique) => technique !== detectedTechnique);
  const support = `Mock Drive evidence preview "${selectedFile.fileName}" is represented as read-only connected ${detectedTechnique} evidence for ${sampleIdentity}; interpretation remains validation-limited.`;
  const validationGaps: ValidationGap[] = [
    {
      id: `${projectId}-drive-read-only-boundary`,
      description: 'Drive import shell uses mock read-only metadata; no real Drive file access or write action has occurred.',
      severity: 'moderate',
      suggestedResolution: 'Use the preview for local workflow readiness only until a real read adapter and approval ledger are implemented.',
    },
    ...pendingTechniques.map<ValidationGap>((technique) => ({
      id: `${projectId}-drive-pending-${technique.toLowerCase()}`,
      description: `${technique} validation evidence remains pending for the Drive-connected preview.`,
      severity: 'moderate',
      suggestedResolution: `Add ${technique} evidence or keep the claim validation-limited.`,
    })),
  ];

  return {
    provider: 'google_drive',
    status: 'selected_mock_file',
    selectedFile,
    supportedTechnique,
    detectedTechnique,
    sampleIdentity,
    evidenceEntries: [{
      id: `drive-preview-${selectedFile.fileId}`,
      technique: detectedTechnique,
      datasetId: selectedFile.fileId,
      datasetLabel: selectedFile.fileName,
      status: 'available',
      claim: `Read-only Google Drive ${detectedTechnique} evidence preview`,
      support,
      limitations: 'Mock Drive evidence preview; no real Drive file was accessed and no external write is enabled.',
    }],
    validationGaps,
    claimBoundary: {
      supported: [support],
      requiresValidation: validationGaps.map((gap) => gap.description),
      notSupportedYet: [`Drive preview does not by itself confirm the assignment for ${projectName}.`],
      contextual: [
        'Source: Google Drive connected evidence',
        'Mode: Drive import shell',
        `File: ${selectedFile.fileName}`,
        'External writes disabled',
      ],
      pending: pendingTechniques.map((technique) => `${technique} validation evidence pending`),
    },
    sourceMode: 'google_drive_connected',
    runtimeMode: 'connected',
    permissionMode: 'approval_required',
    sourceLabel: 'Google Drive connected evidence',
  };
}

export function driveFileToEvidenceSnapshotInput(preview: GoogleDriveImportPreview) {
  return {
    activeDatasetId: preview.selectedFile.fileId,
    evidenceEntries: preview.evidenceEntries,
    validationGaps: preview.validationGaps,
    claimBoundary: preview.claimBoundary,
    sourceMode: preview.sourceMode,
    runtimeMode: preview.runtimeMode,
    permissionMode: preview.permissionMode,
    sourceLabel: preview.sourceLabel,
  };
}
