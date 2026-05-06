import React from 'react';
import { FlaskConical } from 'lucide-react';
import { canonicalDemoScenario } from '../../data/demo';

/**
 * SampleContextCard
 *
 * Displays structured sample metadata for the active demo scenario.
 * Consumes canonicalDemoScenario directly — do not pass these values as props.
 */
export function SampleContextCard() {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Project', value: canonicalDemoScenario.projectName },
    { label: 'Sample ID', value: canonicalDemoScenario.sampleId },
    { label: 'Material System', value: canonicalDemoScenario.materialSystem },
    { label: 'Material Class', value: canonicalDemoScenario.materialClass },
    { label: 'Primary Technique', value: canonicalDemoScenario.primaryTechnique },
    {
      label: 'Supporting',
      value: canonicalDemoScenario.supportingTechniques.join(', '),
    },
  ];

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-4">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical size={13} className="shrink-0 text-indigo-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Sample Context
        </span>
      </div>

      <dl className="space-y-1.5">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-[11px] text-slate-500">{label}</dt>
            <dd className="min-w-0 truncate text-right text-[11px] font-medium text-slate-200">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
