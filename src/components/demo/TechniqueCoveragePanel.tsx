import React from 'react';
import { Microscope } from 'lucide-react';
import { canonicalDemoScenario } from '../../data/demo';

/**
 * TechniqueCoveragePanel
 *
 * Displays the scientific role and known limitation for each characterization
 * technique in the active demo scenario.
 *
 * Consumes canonicalDemoScenario.techniqueMetadata directly.
 * Do not duplicate technique data inside this component.
 */

const TECHNIQUE_ORDER = [
  canonicalDemoScenario.primaryTechnique,
  ...canonicalDemoScenario.supportingTechniques,
];

export function TechniqueCoveragePanel() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Microscope size={13} className="shrink-0 text-violet-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Technique Coverage
        </span>
      </div>

      {/* Technique rows — 2-col on sm+, stacked on mobile */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TECHNIQUE_ORDER.map((technique) => {
          const meta = canonicalDemoScenario.techniqueMetadata[technique];
          if (!meta) return null;
          return (
            <div
              key={technique}
              className="rounded border border-slate-800 bg-[#0D1220] px-3 py-2.5"
            >
              {/* Technique name */}
              <span className="block text-[11px] font-bold text-slate-100 mb-1">
                {technique}
              </span>
              {/* Coverage */}
              <span className="block text-[11px] text-slate-300 leading-snug mb-1">
                {meta.role}
              </span>
              {/* Limitation */}
              <span className="block text-[10px] text-slate-500 leading-snug">
                {meta.limitation}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
