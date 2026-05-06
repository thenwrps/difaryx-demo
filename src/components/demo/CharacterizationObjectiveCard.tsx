import React from 'react';
import { Target } from 'lucide-react';
import { canonicalDemoScenario } from '../../data/demo';

/**
 * CharacterizationObjectiveCard
 *
 * Displays the characterization goal and purpose for the active demo scenario.
 * Consumes canonicalDemoScenario directly — do not pass these values as props.
 */
export function CharacterizationObjectiveCard() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target size={13} className="shrink-0 text-cyan-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Characterization Objective
        </span>
      </div>

      <p className="text-sm font-medium text-slate-100 leading-snug mb-2">
        {canonicalDemoScenario.objective}
      </p>

      <p className="text-xs text-slate-400 leading-relaxed">
        {canonicalDemoScenario.characterizationPurpose}
      </p>
    </div>
  );
}
