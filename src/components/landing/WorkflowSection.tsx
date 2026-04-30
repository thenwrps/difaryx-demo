import React from 'react';
import { ArrowRight } from 'lucide-react';

const steps = [
  { title: 'Signal', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { title: 'Compute', color: 'bg-violet-50 text-violet-600 border-violet-100' },
  { title: 'Evidence', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  { title: 'Reason', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  { title: 'Decision', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { title: 'Report', color: 'bg-slate-50 text-slate-600 border-slate-200' },
];

export default function WorkflowSection() {
  return (
    <section id="workflow" className="border-t border-slate-100 bg-slate-50 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-4 text-center text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          From signal to decision
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-[16px] leading-relaxed text-slate-600">
          DIFARYX structures the full workflow from raw experimental signals to traceable scientific decisions.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {steps.map((step, i) => (
            <React.Fragment key={step.title}>
              <div className={`flex h-14 items-center justify-center rounded-xl border px-6 text-[15px] font-bold ${step.color}`}>
                {step.title}
              </div>
              {i < steps.length - 1 && (
                <ArrowRight size={20} className="text-slate-400" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
