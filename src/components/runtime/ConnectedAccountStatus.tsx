import { Link2, Lock } from 'lucide-react';
import {
  getCapabilityStatus,
  getConnectedAccountBadgeLabel,
  type ConnectedAccountState,
  type ConnectedCapability,
} from '../../runtime/connectedAccounts';

interface ConnectedAccountStatusProps {
  state: ConnectedAccountState;
  capabilities?: ConnectedCapability[];
  compact?: boolean;
}

function badgeClass(status: ReturnType<typeof getCapabilityStatus>) {
  if (status === 'approval_required') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'connected_read_only') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'connected_demo') return 'border-slate-200 bg-slate-50 text-slate-700';
  return 'border-slate-200 bg-white text-text-muted';
}

export function ConnectedAccountStatus({
  state,
  capabilities,
  compact = false,
}: ConnectedAccountStatusProps) {
  const shownCapabilities = capabilities
    ? state.capabilities.filter((item) => capabilities.includes(item.capability))
    : state.capabilities;

  if (compact) {
    return (
      <div
        className={`inline-flex h-7 items-center gap-1.5 rounded border px-2 text-[10px] font-semibold ${badgeClass(state.status)}`}
        title={`${state.providerLabel}; External writes disabled`}
      >
        <Link2 size={11} />
        <span>{state.providerLabel}</span>
        <span className="text-text-dim">/</span>
        <span>External writes disabled</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-background/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link2 size={15} className="text-primary" />
          <div>
            <div className="text-sm font-semibold text-text-main">{state.providerLabel}</div>
            <div className="text-xs text-text-muted">Connection shell only; no external write action is active.</div>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass(state.status)}`}>
          {getConnectedAccountBadgeLabel(state)}
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {shownCapabilities.map((item) => (
          <div key={item.capability} className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface px-2.5 py-2">
            <div>
              <div className="text-xs font-semibold text-text-main">{item.label}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-text-muted">{item.description}</div>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass(item.status)}`}>
              {getConnectedAccountBadgeLabel(item)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-800">
        <Lock size={13} />
        <span>External writes disabled</span>
      </div>
    </div>
  );
}
