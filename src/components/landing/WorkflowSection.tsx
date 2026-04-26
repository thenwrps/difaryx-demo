import React from 'react';
import { Microscope, Layers, Link2, FileOutput, ArrowRight } from 'lucide-react';

const steps = [
  { title: 'Analyze', desc: 'Run advanced analysis on multiple techniques.', Icon: Microscope, bg: 'bg-blue-50', text: 'text-blue-600' },
  { title: 'Structure', desc: 'Convert raw data into structured datasets.', Icon: Layers, bg: 'bg-violet-50', text: 'text-violet-600' },
  { title: 'Connect', desc: 'Link analysis with notebook context.', Icon: Link2, bg: 'bg-indigo-50', text: 'text-indigo-600' },
  { title: 'Export', desc: 'Generate publication-ready reports and figures.', Icon: FileOutput, bg: 'bg-slate-50', text: 'text-slate-600' },
];

export default function WorkflowSection() {
  return (
    <section className="py-14 border-t border-slate-100 bg-white">
      <div className="max-w-[1280px] mx-auto px-8">
        <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-8">What You Can Do With DIFARYX</p>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {steps.map((step, i) => (
            <React.Fragment key={step.title}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-full ${step.bg} flex items-center justify-center shrink-0`}>
                  <step.Icon size={20} className={step.text} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight size={16} className="text-slate-300 shrink-0 hidden md:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
