import { AlertTriangle, CheckCircle2, Database, ShieldCheck, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { getRuntimeBadgeLabel } from '../../runtime/difaryxRuntimeMode';
import type { ApprovalActionPreview } from '../../runtime/actionApproval';
import { appendApprovalLedgerEntry, createApprovalLedgerEntry } from '../../runtime/approvalLedger';

interface ApprovalActionDialogProps {
  action: ApprovalActionPreview | null;
  onClose: () => void;
  onContinueLocal?: (action: ApprovalActionPreview) => void;
}

function joinLines(lines: string[], fallback: string) {
  return lines.length ? lines.slice(0, 3).join(' ') : fallback;
}

export function ApprovalActionDialog({
  action,
  onClose,
  onContinueLocal,
}: ApprovalActionDialogProps) {
  if (!action) return null;

  const localPreviewLabel = action.runtimeMode === 'demo' ? 'Demo preview' : 'Continue local preview';
  const disabledLabel = action.requiresApproval ? 'Approval required' : 'No approval needed';
  const handleCancel = () => {
    appendApprovalLedgerEntry(createApprovalLedgerEntry(action, 'cancelled'));
    onClose();
  };
  const handleContinueLocal = () => {
    appendApprovalLedgerEntry(createApprovalLedgerEntry(action, 'local_preview_continued'));
    onContinueLocal?.(action);
  };
  const handleBlockedConnectedWrite = () => {
    appendApprovalLedgerEntry(createApprovalLedgerEntry(action, 'blocked_connected_write'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-slate-700 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 bg-[#07111f] px-4 py-3 text-white">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
              <ShieldCheck size={13} />
              <span>Approval Preview</span>
              <span className="rounded border border-white/20 px-1.5 py-0.5 text-white/80">{action.riskLevel} risk</span>
            </div>
            <h2 className="mt-1 truncate text-base font-bold">{action.actionLabel}</h2>
            <p className="mt-1 text-xs text-slate-300">{action.destinationLabel}</p>
          </div>
          <button type="button" onClick={handleCancel} className="rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Close approval preview">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 px-4 py-4 text-sm text-text-main md:grid-cols-[1fr_1fr]">
          <div className="rounded-md border border-border bg-surface px-3 py-2">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-dim">
              <Database size={12} /> Source Evidence
            </div>
            <div className="space-y-1 text-xs">
              <p><span className="font-semibold">Project:</span> {action.projectName}</p>
              <p><span className="font-semibold">Sample:</span> {action.sampleIdentity}</p>
              <p><span className="font-semibold">Dataset:</span> {action.activeDataset}</p>
              <p><span className="font-semibold">Source:</span> {getRuntimeBadgeLabel(action, 'source')}</p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface px-3 py-2">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-dim">
              <AlertTriangle size={12} /> Gate Status
            </div>
            <div className="space-y-1 text-xs">
              <p><span className="font-semibold">Runtime:</span> {getRuntimeBadgeLabel(action, 'runtime')}</p>
              <p><span className="font-semibold">Permission:</span> {getRuntimeBadgeLabel(action, 'permission')}</p>
              <p><span className="font-semibold">Approval:</span> {getRuntimeBadgeLabel(action, 'approval')}</p>
              <p><span className="font-semibold">Reason:</span> {action.blockedReason}</p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-background px-3 py-2">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-dim">Evidence Summary</div>
            <p className="text-xs leading-relaxed text-text-muted">
              {joinLines(action.evidenceSummary, 'No linked evidence is available for this action.')}
            </p>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">Validation Gap / Claim Boundary</div>
            <p className="text-xs leading-relaxed text-amber-900">
              {joinLines(action.validationGaps, 'No open validation gaps are listed.')}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900">
              {joinLines(action.claimBoundary, 'Claim boundary remains conservative and evidence-linked.')}
            </p>
          </div>

          <div className="md:col-span-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
            <div className="mb-1 flex items-center gap-2 font-bold uppercase tracking-wider">
              <CheckCircle2 size={12} /> Local Alternative
            </div>
            <p>Continue with the deterministic local preview only. No backend, Google Drive, Gmail, or external write action will execute.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface px-4 py-3">
          <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
          {onContinueLocal ? (
            <Button variant="outline" size="sm" onClick={handleContinueLocal}>{localPreviewLabel}</Button>
          ) : null}
          {action.requiresApproval ? (
            <Button variant="outline" size="sm" onClick={handleBlockedConnectedWrite}>{disabledLabel}</Button>
          ) : (
            <Button variant="outline" size="sm" disabled>{disabledLabel}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
