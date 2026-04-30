import React from 'react';
import { Eye, Sliders, RotateCcw } from 'lucide-react';

const features = [
  { title: 'Every step is visible', desc: 'Full transparency from signal to decision.', Icon: Eye },
  { title: 'Every parameter is controllable', desc: 'Adjust preprocessing, thresholds, and algorithms.', Icon: Sliders },
  { title: 'Every result is reproducible', desc: 'Traceable methods and provenance for all outputs.', Icon: RotateCcw },
];

export default function ResearcherControlSection() {
  return (
    <section className="border-t border-slate-100 bg-slate-50 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-4 text-center text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          Built for researchers, not black-box automation
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-[16px] leading-relaxed text-slate-600">
          Every step is visible. Every parameter is controllable. Every result is reproducible. Automation assists scientific judgment; it does not replace it.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map(({ title, desc, Icon }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
                <Icon size={28} className="text-blue-600" />
              </div>
              <h3 className="mb-2 text-[17px] font-bold text-slate-900">{title}</h3>
              <p className="text-[14px] leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
