import React from 'react';
import { Database } from 'lucide-react';
import { canonicalDemoScenario } from '../../data/demo';
import type { DataAvailabilityStatus } from '../../data/demo';

const STATUS_CONFIG: Record<DataAvailabilityStatus, { label: string; dot: string; badge: string }> = {
  available: {
    label: 'Available',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  },
  context: {
    label: 'Context',
    dot: 'bg-sky-400',
    badge: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
  },
  required: {
    label: 'Required',
    dot: 'bg-amber-400',
    badge: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
};

/**
 * DataAvailabilityPanel
 *
 * Compact panel showing per-technique data availability status
 * for the current canonical demo scenario.
 * Consumes canonicalDemoScenario directly — do not pass data as props.
 */
export function DataAvailabilityPanel() {
  const entries = canonicalDemoScenario.dataAvailability;

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Database size={13} className="shrink-0 text-cyan-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Data Availability Status
        </span>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => {
          const cfg = STATUS_CONFIG[entry.status];
          return (
            <div
              key={entry.technique}
              className="flex items-center gap-3 rounded-md border border-slate-800/60 bg-[#0D1220] px-3 py-2"
            >
              {/* Technique name */}
              <span className="w-12 shrink-0 text-xs font-bold text-slate-200">
                {entry.technique}
              </span>

              {/* Status badge */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>

              {/* Use in interpretation */}
              <span className="flex-1 text-[11px] text-slate-400 truncate">
                {entry.useInInterpretation}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
