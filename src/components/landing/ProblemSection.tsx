import React from 'react';
import { FileText, Lock, RefreshCw, User } from 'lucide-react';

const problems = [
  { title: 'Fragmented tools', desc: 'XRD, XPS, Raman, and microscopy workflows use disconnected software.', Icon: FileText },
  { title: 'File format lock-in', desc: 'Proprietary formats require manual export, convert, and plot loops.', Icon: Lock },
  { title: 'Manual preprocessing', desc: 'Baseline correction, peak fitting, and normalization are repetitive.', Icon: RefreshCw },
  { title: 'Operator-dependent interpretation', desc: 'Scientific decisions depend on individual expertise and judgment.', Icon: User },
];

export default function ProblemSection() {
  return (
    <section id="product" className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            Scientific workflows are fragmented and slow
          </h2>
          <p className="max-w-3xl text-[16px] leading-relaxed text-slate-600">
            Across XRD, XPS, Raman, and microscopy workflows, researchers face disconnected tools, incompatible formats, manual export → convert → plot loops, and interpretation that depends on individual expertise.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map(({ title, desc, Icon }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                <Icon size={20} className="text-slate-600" />
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
