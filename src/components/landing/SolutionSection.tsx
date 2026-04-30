import React from 'react';
import { Layers, FileInput, Sliders, GitCompare, Brain } from 'lucide-react';

const solutions = [
  { title: 'Unified workspace', desc: 'One platform for XRD, XPS, FTIR, Raman, and microscopy data.', Icon: Layers },
  { title: 'Universal file reader', desc: 'Load proprietary formats without manual export or conversion.', Icon: FileInput },
  { title: 'Controlled preprocessing', desc: 'Automated baseline, normalization, and peak detection with full parameter control.', Icon: Sliders },
  { title: 'Cross-technique comparison', desc: 'Compare evidence across techniques in a single view.', Icon: GitCompare },
  { title: 'Reasoning layer', desc: 'AI-assisted interpretation as a supporting layer, not a black box.', Icon: Brain },
];

export default function SolutionSection() {
  return (
    <section className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-12 text-center text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          A unified system for scientific workflows
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {solutions.map(({ title, desc, Icon }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                <Icon size={20} className="text-blue-600" />
              </div>
              <h3 className="mb-2 text-[15px] font-bold text-slate-900">{title}</h3>
              <p className="text-[13px] leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
