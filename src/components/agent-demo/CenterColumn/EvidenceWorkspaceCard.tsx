import React from 'react';
import { AlertTriangle, Layers } from 'lucide-react';
import type { AgentContext, EvidenceLayer } from '../../../utils/agentContext';

interface EvidenceWorkspaceCardProps {
  layer?: EvidenceLayer;
  context: AgentContext;
}

export function EvidenceWorkspaceCard({ layer, context }: EvidenceWorkspaceCardProps) {
  const technique = layer?.technique || context.selectedTechnique;
  const role = layer?.role || 'Evidence review';
  const status = layer?.status || 'pending';
  const summary = layer?.summary || context.evidenceSummary;
  const limitation = layer?.limitation || '';
  const claimContribution = layer?.claimContribution || '';

  const statusColor = status === 'available' ? 'text-emerald-600' : status === 'required' ? 'text-rose-600' : 'text-amber-600';

  return (
    <div className="h-[clamp(200px,35vh,360px)] min-h-0 rounded-lg border border-slate-200 bg-slate-50 p-4 overflow-y-auto">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers size={16} className="text-blue-600" />
            {technique} Evidence Context
          </h3>
          <span className={`text-[10px] font-semibold uppercase ${statusColor}`}>{status}</span>
        </div>

        <p className="text-[11px] text-slate-500">{role}</p>

        <div className="rounded border border-slate-200 bg-white p-2.5">
          <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>
        </div>

        {limitation && (
          <div className="flex items-start gap-1.5 text-[11px] text-amber-700">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <span>{limitation}</span>
          </div>
        )}

        {claimContribution && (
          <div className="text-[11px] text-slate-600">
            <span className="font-semibold">Claim contribution:</span> {claimContribution}
          </div>
        )}

        {context.recommendedActions.length > 0 && (
          <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-600">
            <span className="font-semibold">Next required:</span> {context.recommendedActions[0].label}
          </div>
        )}
      </div>
    </div>
  );
}
