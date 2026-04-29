import React from 'react';
import { BarChart3, BookOpen, FolderKanban, Link2, FileOutput } from 'lucide-react';

const solutions = [
  { title: 'Agent Plan', desc: 'Turn a research goal into an executable analysis plan.', Icon: FolderKanban },
  { title: 'Tool Execution', desc: 'Run XRD, XPS, FTIR, Raman, and related characterization steps.', Icon: BarChart3 },
  { title: 'Evidence Layer', desc: 'Link spectra, features, methods, confidence, caveats, and provenance.', Icon: Link2 },
  { title: 'Notebook Memory', desc: 'Save agent runs, observations, and scientific context in one place.', Icon: BookOpen },
  { title: 'Report Output', desc: 'Prepare traceable decisions for review, export, and presentation.', Icon: FileOutput },
];

export default function SolutionSection() {
  return (
    <section className="py-16 border-t border-slate-100 bg-white">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          <div>
            <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-4">Our Solution</p>
            <h2 className="text-[28px] lg:text-[32px] font-bold leading-[1.2] text-slate-900">
              DIFARYX turns a research goal into an executable analysis plan.
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {solutions.map(({ title, desc, Icon }) => (
              <div key={title} className="border border-slate-200 rounded-xl p-4 bg-white text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-blue-600" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
