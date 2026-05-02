import React from 'react';
import { Link2, Eye, GitBranch } from 'lucide-react';

const features = [
  { title: 'Evidence linked outputs', desc: 'Every decision connects to supporting data', Icon: Link2 },
  { title: 'Intermediate step visibility', desc: 'Full transparency from signal to decision', Icon: Eye },
  { title: 'Parameter traceability', desc: 'All processing steps are documented', Icon: GitBranch },
];

export default function ResearcherControlSection() {
  return (
    <section className="border-t border-slate-100 bg-slate-50 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-4 text-center text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          Transparent reasoning and evidence linkage
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-[16px] leading-relaxed text-slate-600">
          Every decision is connected to its supporting evidence. Every processing step is visible and traceable.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map(({ title, desc, Icon }) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                <Icon size={28} className="text-blue-600" />
              </div>
              <h3 className="mb-2 text-[17px] font-bold text-slate-900">{title}</h3>
              <p className="text-[14px] leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-[14px] text-slate-600">Deterministic execution ensures consistent results</p>
        </div>
      </div>
    </section>
  );
}
