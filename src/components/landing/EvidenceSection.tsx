import React from 'react';

export default function EvidenceSection() {
  return (
    <section className="border-t border-slate-100 bg-slate-50 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-4 text-center text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          Derived from multi-source research across scientific workflows
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-[16px] leading-relaxed text-slate-600">
          Insights are derived from structured surveys, LinkedIn polls, research community discussions, and observed laboratory workflows.
        </p>
        
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:p-12">
          <p className="mb-6 text-[18px] font-bold text-slate-900">Across these sources:</p>
          <div className="space-y-4">
            {[
              'Tool fragmentation is universal',
              'Multiple software tools are used per dataset',
              'Automation is preferred only when controllable',
              'Reproducibility is a consistent challenge',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                <p className="text-[16px] leading-relaxed text-slate-700">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-slate-200 pt-8">
            <p className="text-[16px] font-bold leading-relaxed text-slate-900">
              This is not a niche issue. It is systemic.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
