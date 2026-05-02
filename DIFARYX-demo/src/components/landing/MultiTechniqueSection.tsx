import React from 'react';

export default function MultiTechniqueSection() {
  return (
    <section className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-4 text-center text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          Unified handling of experimental data
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-[16px] leading-relaxed text-slate-600">
          DIFARYX processes multiple experimental inputs through unified logic without tool switching.
        </p>
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <div className="space-y-4">
            {[
              { label: 'Multiple inputs', desc: 'Load data from different experimental sources' },
              { label: 'Unified logic', desc: 'Process all data through consistent workflows' },
              { label: 'No tool switching', desc: 'Execute complete analysis in one environment' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex h-2 w-2 shrink-0 mt-2 rounded-full bg-blue-600" />
                <div>
                  <div className="text-[15px] font-bold text-slate-900">{item.label}</div>
                  <div className="text-[13px] text-slate-600">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
