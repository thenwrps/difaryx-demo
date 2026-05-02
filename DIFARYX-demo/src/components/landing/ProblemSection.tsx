import React from 'react';
import { FileText, Layers, Settings, BarChart } from 'lucide-react';

const problems = [
  { title: 'Multiple tools per dataset', desc: 'Researchers use disconnected software for each analysis step.', Icon: Layers },
  { title: 'Inconsistent preprocessing', desc: 'Manual baseline correction and normalization vary between runs.', Icon: Settings },
  { title: 'Manual interpretation', desc: 'Scientific decisions depend on individual expertise and judgment.', Icon: BarChart },
  { title: 'Low reproducibility', desc: 'Workflows are difficult to document and reproduce across labs.', Icon: FileText },
];

export default function ProblemSection() {
  return (
    <section id="product" className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            Scientific workflows are fragmented, manual, and difficult to reproduce
          </h2>
          <p className="max-w-3xl text-[16px] leading-relaxed text-slate-600">
            Experimental data processing and interpretation require multiple disconnected tools. Researchers must convert file formats, configure preprocessing steps, and manually interpret results across different environments.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map(({ title, desc, Icon }) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 border border-slate-200">
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
