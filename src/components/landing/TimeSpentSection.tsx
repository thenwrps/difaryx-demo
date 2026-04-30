import React from 'react';

const analysisTimeData = [
  {
    label: 'Less than 10 min',
    percent: 18,
    description: 'Fast cases with prepared data or simple workflows',
  },
  {
    label: '10–30 min',
    percent: 29,
    description: 'Common range for routine preprocessing and initial analysis',
  },
  {
    label: '30–60 min',
    percent: 29,
    description: 'Mixed manual and semi-automated workflows',
  },
  {
    label: 'More than 1 hour',
    percent: 24,
    description: 'Complex datasets, advanced fitting, or multi-step workflows',
  },
];

export default function TimeSpentSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
        {/* Left content */}
        <div>
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            Where analysis time is actually spent
          </h2>
          <p className="mb-3 text-[16px] leading-relaxed text-slate-600">
            Analysis is not instantaneous. Across collected workflow responses, most datasets require between 10 and 60 minutes to process, with a significant portion taking longer than one hour depending on workflow complexity.
          </p>
          <p className="text-[14px] text-slate-500">
            Time is spent on workflow, not just interpretation.
          </p>
          
          {/* Insight card */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="mb-2 text-[13px] font-bold uppercase tracking-wider text-slate-500">
              Key signal
            </p>
            <p className="text-[14px] leading-relaxed text-slate-700">
              Most responses cluster between 10 and 60 minutes, while complex workflows can exceed one hour. DIFARYX targets the workflow steps that create this delay: file handling, preprocessing, fitting, and figure preparation.
            </p>
          </div>
        </div>

        {/* Right chart card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="mb-6">
            <h3 className="text-[18px] font-bold text-slate-900">
              Initial analysis time per dataset
            </h3>
            <p className="text-[12px] text-slate-500">
              workflow response ranges
            </p>
          </div>

          <div className="space-y-6">
            {analysisTimeData.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                  <span className="text-sm font-bold text-blue-600">{item.percent}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <p className="text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
            Grouped from collected workflow survey responses. This is pre-product validation, not DIFARYX usage data.
          </div>
        </div>
      </div>
    </section>
  );
}
