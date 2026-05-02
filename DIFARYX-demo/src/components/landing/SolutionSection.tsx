import React from 'react';
import { Database, Workflow, Eye, GitBranch } from 'lucide-react';

export default function SolutionSection() {
  return (
    <section className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            A structured workflow system for scientific execution
          </h2>
          <p className="max-w-3xl text-[16px] leading-relaxed text-slate-600">
            DIFARYX provides a unified environment where scientific workflows are executed as structured processes. Each step is defined, parameterized, and traceable.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Signal ingestion', desc: 'Load experimental data from multiple sources', Icon: Database },
            { title: 'Pipeline execution', desc: 'Automated processing with defined parameters', Icon: Workflow },
            { title: 'Parameter visibility', desc: 'Every step is transparent and adjustable', Icon: Eye },
            { title: 'Reproducibility', desc: 'Traceable methods and provenance for all outputs', Icon: GitBranch },
          ].map(({ title, desc, Icon }) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
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
