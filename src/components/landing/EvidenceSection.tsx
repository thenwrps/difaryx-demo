import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const metrics = [
  { value: '30', label: 'recurring pain points identified' },
  { value: '9', label: 'workflow failure patterns' },
  { value: '80%', label: 'want automation only if controllable' },
  { value: '0%', label: 'prefer black-box automation' },
];

const rankings = [
  'Cross-technique comparison',
  'All formats in one platform',
  'Automated preprocessing with control',
  'AI interpretation as a supporting layer, not the headline',
];

export default function EvidenceSection() {
  return (
    <section className="border-t border-slate-100 bg-slate-50 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-12 text-center text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          Validated by real workflow pain
        </h2>
        
        <div className="mb-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-2 text-[48px] font-extrabold leading-none text-blue-600">{metric.value}</div>
              <div className="text-[13px] leading-relaxed text-slate-600">{metric.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h3 className="mb-6 text-[20px] font-bold text-slate-900">What researchers actually want:</h3>
          <div className="space-y-3">
            {rankings.map((item, index) => (
              <div key={item} className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[13px] font-bold text-blue-600">
                  {index + 1}
                </div>
                <p className="pt-0.5 text-[15px] leading-relaxed text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
