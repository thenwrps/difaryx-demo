import React from 'react';
import { Clock3, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  clearApprovalLedger,
  getApprovalLedgerEntries,
  type ApprovalLedgerEntry,
} from '../../runtime/approvalLedger';

interface ApprovalLedgerPanelProps {
  projectId?: string;
  bundleId?: string;
  limit?: number;
  compact?: boolean;
}

function decisionLabel(decision: ApprovalLedgerEntry['decision']) {
  return decision.replace(/_/g, ' ');
}

function formatLedgerTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString();
}

export function ApprovalLedgerPanel({
  projectId,
  bundleId,
  limit = 5,
  compact = false,
}: ApprovalLedgerPanelProps) {
  const [entries, setEntries] = React.useState<ApprovalLedgerEntry[]>(() => getApprovalLedgerEntries());

  React.useEffect(() => {
    const update = () => setEntries(getApprovalLedgerEntries());
    window.addEventListener('storage', update);
    window.addEventListener('difaryx-approval-ledger-updated', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('difaryx-approval-ledger-updated', update);
    };
  }, []);

  const visibleEntries = entries
    .filter((entry) => !projectId || entry.projectId === projectId)
    .filter((entry) => !bundleId || entry.bundleId === bundleId)
    .slice(0, limit);

  const handleClear = () => {
    clearApprovalLedger();
    setEntries([]);
  };

  return (
    <section className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-dim">
            <ShieldCheck size={13} className="text-primary" />
            Local approval preview ledger
          </div>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            Demo/local audit trail only. It records preview decisions in this browser and is not enterprise approval persistence.
          </p>
        </div>
        {!compact && entries.length > 0 ? (
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={handleClear}>
            <Trash2 size={12} /> Clear
          </Button>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {visibleEntries.map((entry) => (
          <div key={entry.ledgerId} className="rounded-md border border-border bg-background px-2.5 py-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-text-main">{entry.actionLabel}</div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-semibold text-text-muted">
                  <span className="rounded border border-border bg-surface px-1.5 py-0.5">{entry.actionType.replace(/_/g, ' ')}</span>
                  <span className="rounded border border-border bg-surface px-1.5 py-0.5">{entry.sourceMode}</span>
                  <span className="rounded border border-border bg-surface px-1.5 py-0.5">{entry.permissionMode}</span>
                  <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-primary">{decisionLabel(entry.decision)}</span>
                </div>
              </div>
              <div className="shrink-0 text-right text-[10px] text-text-dim">
                <Clock3 size={11} className="ml-auto mb-0.5" />
                {formatLedgerTime(entry.timestamp)}
              </div>
            </div>
            <div className="mt-2 text-[11px] leading-relaxed text-text-muted">
              <span className="font-semibold text-text-main">{entry.projectName}</span>
              {entry.bundleId ? <span> / {entry.bundleId}</span> : null}
              <span> / {entry.claimBoundary[0] ?? entry.supportedAssignment}</span>
            </div>
          </div>
        ))}
        {visibleEntries.length === 0 && (
          <div className="rounded-md border border-dashed border-border bg-background px-3 py-4 text-center text-xs text-text-muted">
            No approval preview history has been recorded in this browser yet.
          </div>
        )}
      </div>
    </section>
  );
}

