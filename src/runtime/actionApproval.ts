import type { ProjectEvidenceSnapshot } from '../utils/evidenceSnapshot';
import {
  getRuntimeBadgeLabel,
  requiresApproval as runtimeRequiresApproval,
  type DifaryxRuntimeContext,
  type EvidenceSourceMode,
  type PermissionMode,
  type RuntimeApprovalStatus,
  type RuntimeMode,
} from './difaryxRuntimeMode';

export type ApprovalActionType =
  | 'notebook_commit'
  | 'report_export'
  | 'report_generation'
  | 'interpretation_refinement'
  | 'external_share'
  | 'google_drive_export_future'
  | 'gmail_draft_future';

export type ApprovalRiskLevel = 'low' | 'medium' | 'high';

export interface ApprovalActionPreview {
  actionId: string;
  actionType: ApprovalActionType;
  actionLabel: string;
  sourceMode: EvidenceSourceMode;
  runtimeMode: RuntimeMode;
  permissionMode: PermissionMode;
  sourceLabel: string;
  approvalStatus: RuntimeApprovalStatus;
  projectId: string;
  projectName: string;
  sampleIdentity: string;
  activeDataset: string;
  evidenceSummary: string[];
  validationGaps: string[];
  claimBoundary: string[];
  destinationLabel: string;
  riskLevel: ApprovalRiskLevel;
  requiresApproval: boolean;
  blockedReason: string;
}

interface CreateApprovalActionPreviewArgs {
  actionId: string;
  actionType: ApprovalActionType;
  actionLabel: string;
  destinationLabel: string;
  evidenceSnapshot: ProjectEvidenceSnapshot;
  runtimeContext: DifaryxRuntimeContext;
  riskLevel?: ApprovalRiskLevel;
  blockedReason?: string;
}

const FUTURE_EXTERNAL_ACTIONS: ApprovalActionType[] = [
  'external_share',
  'google_drive_export_future',
  'gmail_draft_future',
];

function defaultRiskLevel(actionType: ApprovalActionType): ApprovalRiskLevel {
  if (FUTURE_EXTERNAL_ACTIONS.includes(actionType)) return 'high';
  if (actionType === 'notebook_commit') return 'low';
  return 'medium';
}

function collectClaimBoundary(snapshot: ProjectEvidenceSnapshot): string[] {
  return [
    ...snapshot.claimBoundary.supported.map((line) => `Supported: ${line}`),
    ...snapshot.claimBoundary.requiresValidation.map((line) => `Requires validation: ${line}`),
    ...snapshot.claimBoundary.notSupportedYet.map((line) => `Not supported yet: ${line}`),
    ...(snapshot.claimBoundary.contextual ?? []).map((line) => `Contextual: ${line}`),
    ...(snapshot.claimBoundary.pending ?? []).map((line) => `Pending: ${line}`),
  ];
}

function collectValidationGaps(snapshot: ProjectEvidenceSnapshot): string[] {
  return [
    ...snapshot.validationGaps.map((gap) => `${gap.description} Resolution: ${gap.suggestedResolution}`),
    ...snapshot.pendingTechniques.map((technique) => `${technique} validation evidence remains pending.`),
  ];
}

function collectEvidenceSummary(snapshot: ProjectEvidenceSnapshot): string[] {
  const entries = snapshot.evidenceEntries.map((entry) =>
    `${entry.technique}: ${entry.support}${entry.limitations ? ` (${entry.limitations})` : ''}`,
  );
  return entries.length ? entries : ['No completed evidence entries are linked yet.'];
}

function defaultBlockedReason(
  actionType: ApprovalActionType,
  runtimeContext: DifaryxRuntimeContext,
): string {
  if (FUTURE_EXTERNAL_ACTIONS.includes(actionType)) {
    return 'Future connected write path is disabled in this frontend demo.';
  }
  if (runtimeRequiresApproval(runtimeContext)) {
    return `${getRuntimeBadgeLabel(runtimeContext, 'permission')} for ${getRuntimeBadgeLabel(runtimeContext, 'runtime')}; no external write is available in this demo.`;
  }
  return 'Local deterministic preview can continue without external write access.';
}

export function createApprovalActionPreview({
  actionId,
  actionType,
  actionLabel,
  destinationLabel,
  evidenceSnapshot,
  runtimeContext,
  riskLevel,
  blockedReason,
}: CreateApprovalActionPreviewArgs): ApprovalActionPreview {
  const requiresApproval = runtimeRequiresApproval(runtimeContext) || FUTURE_EXTERNAL_ACTIONS.includes(actionType);

  return {
    actionId,
    actionType,
    actionLabel,
    sourceMode: runtimeContext.sourceMode,
    runtimeMode: runtimeContext.runtimeMode,
    permissionMode: runtimeContext.permissionMode,
    sourceLabel: runtimeContext.sourceLabel,
    approvalStatus: requiresApproval ? 'required' : runtimeContext.approvalStatus,
    projectId: evidenceSnapshot.projectId,
    projectName: evidenceSnapshot.projectName,
    sampleIdentity: evidenceSnapshot.sampleIdentity,
    activeDataset: evidenceSnapshot.activeDataset?.fileName ??
      evidenceSnapshot.evidenceEntries[0]?.datasetLabel ??
      'Pending evidence source',
    evidenceSummary: collectEvidenceSummary(evidenceSnapshot),
    validationGaps: collectValidationGaps(evidenceSnapshot),
    claimBoundary: collectClaimBoundary(evidenceSnapshot),
    destinationLabel,
    riskLevel: riskLevel ?? defaultRiskLevel(actionType),
    requiresApproval,
    blockedReason: blockedReason ?? defaultBlockedReason(actionType, runtimeContext),
  };
}
