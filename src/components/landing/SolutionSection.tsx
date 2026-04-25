import React from 'react';
import { BarChart3, BookOpen, FolderKanban, Link2, FileOutput } from 'lucide-react';

const solutions = [
  { title: 'Characterization Analysis', desc: 'Powerful tools for XRD, XPS, FTIR, Raman and more techniques.', Icon: BarChart3, gradient: 'from-blue-500 to-blue-600' },
  { title: 'Notebook Lab', desc: 'Structured experiments, templates, and scientific context in one place.', Icon: BookOpen, gradient: 'from-violet-500 to-violet-600' },
  { title: 'Project Workflow', desc: 'Organize data, analyses, and results from raw to report seamlessly.', Icon: FolderKanban, gradient: 'from-indigo-500 to-indigo-600' },
  { title: 'Scientific Context', desc: 'Metadata, conditions, references, and insights connected together.', Icon: Link2, gradient: 'from-blue-500 to-indigo-600' },
  { title: 'Exportable Insight', desc: 'Create publication-ready reports and shareable results with ease.', Icon: FileOutput, gradient: 'from-indigo-500 to-violet-600' },
];

export default function SolutionSection() {
  return (
    <section className="relative py-16 bg-gradient-to-b from-slate-50/80 to-white overflow-hidden">
      {/* Subtle connector pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.04)_0%,transparent_50%)] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          <div>
            <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-4">Our Solution</p>
            <h2 className="text-[28px] lg:text-[32px] font-bold leading-[1.2] text-slate-900">
              DIFARYX combines everything into one scientific workflow.
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {solutions.map(({ title, desc, Icon, gradient }) => (
              <div key={title} className="border border-slate-200/80 rounded-xl p-4 bg-white text-center flex flex-col items-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5 cursor-default group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow`}>
                  <Icon size={18} className="text-white" />
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
