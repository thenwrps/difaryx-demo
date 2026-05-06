import React from 'react';
import { ClipboardList } from 'lucide-react';
import { canonicalDemoScenario } from '../../data/demo';
import type { EvidenceRequirementStatus } from '../../data/demo';

const STATUS_CONFIG: Record<EvidenceRequirementStatus, { dot: string; badge: string }> = {
  Complete: {
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  },
  Ready: {
    dot: 'bg-sky-400',
    badge: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
  },
  'In Progress': {
    dot: 'bg-amber-400',
    badge: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  },
  Pending: {
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
  Review: {
    dot: 'bg-violet-400',
    badge: 'bg-violet-400/10 text-violet-300 border-violet-400/30',
  },
};

interface EvidenceRequirementsTableProps {
  compact?: boolean;
}

/**
 * EvidenceRequirementsTable
 *
 * Compact table showing per-assignment evidence requirements,
 * availability, status, and follow-up validation.
 * Consumes canonicalDemoScenario directly — do not pass data as props.
 */
export function EvidenceRequirementsTable({ compact = false }: EvidenceRequirementsTableProps) {
  const entries = canonicalDemoScenario.evidenceRequirements;

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-4">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList size={13} className="shrink-0 text-cyan-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Evidence Requirements
        </span>
      </div>

      {/* Desktop table — header pinned, body scrolls */}
      <div className={compact ? 'hidden' : 'hidden md:block'}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80">
                <th className="pb-2 pr-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Assignment</th>
                <th className="pb-2 pr-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Required Evidence</th>
                <th className="pb-2 pr-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Available Evidence</th>
                <th className="pb-2 pr-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Status</th>
                <th className="pb-2 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Follow-up Validation</th>
              </tr>
            </thead>
          </table>
        </div>
        <div className="max-h-[320px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs">
            <tbody>
              {entries.map((entry, i) => {
                const cfg = STATUS_CONFIG[entry.status];
                return (
                  <tr
                    key={i}
                    className="border-b border-slate-800/40 last:border-b-0"
                  >
                    <td className="py-1.5 pr-3 font-medium text-slate-200 align-top">
                      {entry.assignment}
                    </td>
                    <td className="py-1.5 pr-3 text-slate-400 align-top">
                      {entry.requiredEvidence}
                    </td>
                    <td className="py-1.5 pr-3 text-slate-400 align-top">
                      {entry.availableEvidence}
                    </td>
                    <td className="py-1.5 pr-3 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${cfg.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-1.5 text-slate-500 align-top">
                      {entry.followUpValidation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile stacked cards — scrollable */}
      <div className={`${compact ? '' : 'md:hidden'} max-h-[320px] overflow-y-auto space-y-2`}>
        {entries.map((entry, i) => {
          const cfg = STATUS_CONFIG[entry.status];
          return (
            <div
              key={i}
              className="rounded-md border border-slate-800/60 bg-[#0D1220] px-3 py-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-200">
                  {entry.assignment}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${cfg.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  {entry.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                <span className="font-medium text-slate-500">Required: </span>
                {entry.requiredEvidence}
              </div>
              <div className="text-[11px] text-slate-400">
                <span className="font-medium text-slate-500">Available: </span>
                {entry.availableEvidence}
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-medium text-slate-500">Follow-up: </span>
                {entry.followUpValidation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
