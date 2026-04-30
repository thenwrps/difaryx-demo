import React from 'react';

export default function WorkflowRealitySection() {
  return (
    <section className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-8 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          What researchers actually do
        </h2>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <p className="text-[16px] leading-relaxed text-slate-600">
              Across materials characterization workflows, researchers rely on multiple tools per dataset.
            </p>
            <div>
              <p className="mb-3 text-[15px] font-bold text-slate-900">A typical workflow includes:</p>
              <ul className="space-y-2">
                {[
                  'Exporting data from instrument software',
                  'Converting file formats manually',
                  'Performing preprocessing and peak fitting in separate tools',
                  'Re-plotting results for publication',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[15px] leading-relaxed text-slate-600">
              This process is repeated for each experiment.
            </p>
            <p className="text-[15px] leading-relaxed text-slate-600">
              Common tools include Origin, Python/MATLAB, CasaXPS, and vendor software.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="mb-4 text-[13px] font-bold uppercase tracking-wider text-slate-500">Typical Tool Stack</p>
            <div className="space-y-3">
              {[
                { name: 'Origin', use: 'Plotting' },
                { name: 'Python/MATLAB', use: 'Processing' },
                { name: 'CasaXPS', use: 'XPS fitting' },
                { name: 'Vendor software', use: 'Data export' },
                { name: 'Excel', use: 'Data organization' },
              ].map((tool) => (
                <div key={tool.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <span className="text-[14px] font-semibold text-slate-900">{tool.name}</span>
                  <span className="text-[12px] text-slate-500">{tool.use}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
