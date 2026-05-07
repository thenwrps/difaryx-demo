import React from 'react';
import { Workflow, Brain, FileCheck, Layers } from 'lucide-react';

const solutionPillars = [
  {
    title: 'Unified Workflow System',
    desc: 'Single platform for XRD, XPS, FTIR, and Raman data. Load signals, preprocess, compare, and report without switching tools.',
    Icon: Workflow,
    color: 'blue'
  },
  {
    title: 'Scientific Reasoning Layer',
    desc: 'The workflow plans analysis steps, executes tools, collects evidence, reasons over uncertainty, and prepares traceable interpretations.',
    Icon: Brain,
    color: 'purple'
  },
  {
    title: 'Controllable Preprocessing',
    desc: 'Researchers set parameters for baseline correction, smoothing, normalization, and peak detection. Hybrid mode combines manual control with agent optimization.',
    Icon: FileCheck,
    color: 'emerald'
  },
  {
    title: 'Cross-Technique Evidence Fusion',
    desc: 'Compare XRD phase assignments with XPS oxidation states, FTIR functional groups, and Raman vibrational modes in one view.',
    Icon: Layers,
    color: 'amber'
  }
];

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'text-purple-600'
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-600'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-600'
  }
};

export default function SolutionSection() {
  return (
    <section id="solution" className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            DIFARYX unifies characterization workflows with scientific reasoning
          </h2>
          <p className="mx-auto max-w-3xl text-[16px] leading-relaxed text-slate-600">
            A single platform that combines structured scientific workflows with planning, execution, evidence collection, reasoning, and report-ready discussion.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {solutionPillars.map(({ title, desc, Icon, color }) => {
            const colors = colorMap[color as keyof typeof colorMap];
            return (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} border ${colors.border}`}>
                  <Icon size={20} className={colors.icon} />
                </div>
                <h3 className="mb-2 text-[17px] font-bold text-slate-900">{title}</h3>
                <p className="text-[14px] leading-relaxed text-slate-600">{desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[15px] font-semibold text-slate-700">
            DIFARYX executes structured scientific workflows directly from experimental signals.
          </p>
        </div>
      </div>
    </section>
  );
}
