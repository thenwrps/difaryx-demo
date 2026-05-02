import React from 'react';
import { ArrowRight } from 'lucide-react';

const workflowSteps = [
  {
    number: '01',
    title: 'Load Signal',
    desc: 'Import XRD, XPS, FTIR, or Raman data from instrument files or standard formats.',
    color: 'cyan'
  },
  {
    number: '02',
    title: 'Preprocess',
    desc: 'Apply baseline correction, smoothing, normalization, and peak detection with controllable parameters.',
    color: 'blue'
  },
  {
    number: '03',
    title: 'Agent Execution',
    desc: 'Agent plans analysis steps, executes tools (peak matching, database search, hypothesis evaluation), and collects evidence.',
    color: 'purple'
  },
  {
    number: '04',
    title: 'Evidence Synthesis',
    desc: 'Aggregate scores from multiple techniques, apply penalties for anomalies, and calculate confidence with uncertainty quantification.',
    color: 'emerald'
  },
  {
    number: '05',
    title: 'Scientific Reasoning',
    desc: 'Gemini generates interpretation, compares candidates, analyzes conflicts, and explains decision logic.',
    color: 'violet'
  },
  {
    number: '06',
    title: 'Decision + Report',
    desc: 'Finalize scientific determination with confidence estimation, generate report with evidence provenance, and export results.',
    color: 'amber'
  }
];

const colorMap = {
  cyan: 'from-cyan-500 to-cyan-600',
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  emerald: 'from-emerald-500 to-emerald-600',
  violet: 'from-violet-500 to-violet-600',
  amber: 'from-amber-500 to-amber-600'
};

export default function ProductFunctionSection() {
  return (
    <section id="function" className="border-t border-slate-100 bg-slate-50 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            How DIFARYX works: From signal to decision
          </h2>
          <p className="mx-auto max-w-3xl text-[16px] leading-relaxed text-slate-600">
            A structured workflow that combines deterministic preprocessing, autonomous agent execution, and hybrid reasoning for traceable scientific decisions.
          </p>
        </div>

        <div className="space-y-6">
          {workflowSteps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="flex items-start gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[step.color as keyof typeof colorMap]} text-white font-bold text-lg shadow-lg`}>
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-[17px] font-bold text-slate-900">{step.title}</h3>
                  <p className="text-[14px] leading-relaxed text-slate-600">{step.desc}</p>
                </div>
              </div>
              
              {index < workflowSteps.length - 1 && (
                <div className="flex justify-center py-3">
                  <ArrowRight size={20} className="text-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="text-center">
            <h3 className="mb-3 text-[20px] font-bold text-slate-900">Hybrid Reasoning: Deterministic + Gemini</h3>
            <p className="mx-auto max-w-3xl text-[15px] leading-relaxed text-slate-700">
              DIFARYX combines deterministic analysis (peak matching, database search, scoring) with Gemini-powered interpretation (conflict resolution, uncertainty assessment, scientific reasoning). Researchers see both sources and can verify each step.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
