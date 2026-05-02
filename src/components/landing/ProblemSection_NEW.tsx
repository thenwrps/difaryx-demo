import React from 'react';
import { FileText, Layers, RefreshCw, GitBranch, FileQuestion, Lock } from 'lucide-react';

const problems = [
  { 
    title: 'Too many tools', 
    desc: 'Researchers move between instrument software, Origin, CasaXPS, Python, spreadsheets, and manual notes.',
    Icon: Layers 
  },
  { 
    title: 'Format conversion friction', 
    desc: 'Every dataset requires export, conversion, and manual plotting before analysis can begin.',
    Icon: FileText 
  },
  { 
    title: 'Manual preprocessing', 
    desc: 'Baseline correction, smoothing, normalization, and peak detection are repetitive and time-consuming.',
    Icon: RefreshCw 
  },
  { 
    title: 'Cross-technique interpretation gaps', 
    desc: 'Comparing XRD, XPS, FTIR, and Raman evidence requires switching between disconnected tools.',
    Icon: GitBranch 
  },
  { 
    title: 'Weak reproducibility', 
    desc: 'Parameters, assumptions, and decision logic are buried in notebooks or lost entirely.',
    Icon: FileQuestion 
  },
  { 
    title: 'Black-box automation distrust', 
    desc: 'Researchers reject automation that hides parameters, evidence, or reasoning steps.',
    Icon: Lock 
  },
];

export default function ProblemSection() {
  return (
    <section id="problem" className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            Scientific workflows are fragmented, manual, and difficult to reproduce
          </h2>
          <p className="mx-auto max-w-3xl text-[16px] leading-relaxed text-slate-600">
            Researchers move between instrument software, Origin, CasaXPS, Python, spreadsheets, and manual notes. Every dataset requires export, conversion, preprocessing, interpretation, and report preparation.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] font-semibold text-slate-700">
            The problem is not data generation. The bottleneck is interpretation and workflow execution.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
