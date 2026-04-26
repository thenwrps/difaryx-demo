import React from 'react';
import { Microscope, Layers, Link2, FileOutput } from 'lucide-react';

const steps = [
  { title: 'Analyze', desc: 'Run advanced analysis on multiple techniques.', Icon: Microscope, color: 'from-blue-500 to-blue-600', ring: 'ring-blue-100' },
  { title: 'Structure', desc: 'Convert raw data into structured datasets.', Icon: Layers, color: 'from-violet-500 to-violet-600', ring: 'ring-violet-100' },
  { title: 'Connect', desc: 'Link analysis with notebook context.', Icon: Link2, color: 'from-indigo-500 to-indigo-600', ring: 'ring-indigo-100' },
  { title: 'Export', desc: 'Generate publication-ready reports and figures.', Icon: FileOutput, color: 'from-slate-600 to-slate-700', ring: 'ring-slate-100' },
];

export default function WorkflowSection() {
  return (
    <section id="workflow" className="py-14 bg-gradient-to-b from-slate-50/50 to-white">
      <div className="max-w-[1280px] mx-auto px-8">
        <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-8">What You Can Do With DIFARYX</p>

        <div className="relative">
          {/* Gradient connector rail */}
          <div className="hidden md:block absolute top-6 left-8 right-8 h-[2px] bg-gradient-to-r from-blue-200 via-violet-200 to-slate-200 rounded-full" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
            {steps.map((step) => (
              <div key={step.title} className="flex flex-col items-center text-center group">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md ring-4 ${step.ring} mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <step.Icon size={20} className="text-white" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-[180px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
