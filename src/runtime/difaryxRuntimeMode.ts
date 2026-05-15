export type EvidenceSourceMode = 'demo_preloaded' | 'user_uploaded' | 'google_drive_connected';

export type RuntimeMode = 'demo' | 'connected';

export type PermissionMode = 'read_only' | 'approval_required' | 'write_enabled';

export type RuntimeApprovalStatus = 'not_required' | 'required' | 'pending' | 'approved' | 'blocked';

export interface DifaryxRuntimeContext {
  sourceMode: EvidenceSourceMode;
  runtimeMode: RuntimeMode;
  permissionMode: PermissionMode;
  sourceLabel: string;
  approvalStatus: RuntimeApprovalStatus;
}

export type RuntimeBadgeKind = 'source' | 'runtime' | 'permission' | 'approval' | 'summary';

export function getDefaultRuntimeContext(): DifaryxRuntimeContext {
  return {
    sourceMode: 'demo_preloaded',
    runtimeMode: 'demo',
    permissionMode: 'read_only',
    sourceLabel: 'Demo evidence',
    approvalStatus: 'not_required',
  };
}

export function getRuntimeContextForEvidenceSource(
  sourceMode: EvidenceSourceMode = 'demo_preloaded',
  runtimeMode?: RuntimeMode,
): DifaryxRuntimeContext {
  if (sourceMode === 'google_drive_connected' || runtimeMode === 'connected') {
    return {
      sourceMode: sourceMode === 'demo_preloaded' ? 'google_drive_connected' : sourceMode,
      runtimeMode: 'connected',
      permissionMode: 'approval_required',
      sourceLabel: sourceMode === 'user_uploaded' ? 'User-uploaded evidence' : 'Google Drive connected evidence',
      approvalStatus: 'required',
    };
  }

  if (sourceMode === 'user_uploaded') {
    return {
      sourceMode,
      runtimeMode: 'demo',
      permissionMode: 'read_only',
      sourceLabel: 'User-uploaded evidence',
      approvalStatus: 'not_required',
    };
  }

  return getDefaultRuntimeContext();
}

export function requiresApproval(context: Pick<DifaryxRuntimeContext, 'runtimeMode' | 'permissionMode'>): boolean {
  return context.runtimeMode === 'connected' || context.permissionMode === 'approval_required';
}

export function isExternalActionAllowed(context: Pick<DifaryxRuntimeContext, 'permissionMode'>): boolean {
  return context.permissionMode === 'write_enabled';
}

export function getRuntimeBadgeLabel(
  context: DifaryxRuntimeContext | null | undefined,
  kind: RuntimeBadgeKind = 'summary',
): string {
  const resolved = context ?? getDefaultRuntimeContext();

  if (kind === 'source') {
    if (resolved.sourceMode === 'user_uploaded') return 'User-uploaded evidence';
    if (resolved.sourceMode === 'google_drive_connected') return 'Google Drive connected evidence';
    return 'Demo evidence';
  }

  if (kind === 'runtime') {
    return resolved.runtimeMode === 'connected' ? 'Connected mode' : 'Demo mode';
  }

  if (kind === 'permission') {
    if (resolved.permissionMode === 'approval_required') return 'Approval required';
    if (resolved.permissionMode === 'write_enabled') return 'Write enabled';
    return 'Read-only demo';
  }

  if (kind === 'approval') {
    if (resolved.approvalStatus === 'required') return 'Approval required';
    if (resolved.approvalStatus === 'pending') return 'Approval pending';
    if (resolved.approvalStatus === 'approved') return 'Approved';
    if (resolved.approvalStatus === 'blocked') return 'Blocked';
    return 'No approval needed';
  }

  return `${getRuntimeBadgeLabel(resolved, 'source')} / ${getRuntimeBadgeLabel(resolved, 'permission')}`;
}

export function getRuntimeBadgeClass(context: DifaryxRuntimeContext | null | undefined): string {
  const resolved = context ?? getDefaultRuntimeContext();
  if (resolved.permissionMode === 'approval_required') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (resolved.sourceMode === 'user_uploaded') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (resolved.permissionMode === 'write_enabled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}
