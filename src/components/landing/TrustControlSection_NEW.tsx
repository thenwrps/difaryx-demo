import React from 'react';
import { Eye, Settings, FileCheck, GitBranch } from 'lucide-react';

const trustPrinciples = [
  {
    title: 'Reasoning Transparency',
    desc: 'See candidate comparison, conflict analysis, uncertainty assessment, and evidence synthesis. Every conclusion shows its supporting data.',
    Icon: Eye,
    color: 'blue'
  },
  {
    title: 'Parameter Control',
    desc: 'Switch between hybrid mode (manual + agent) and agent 100% mode. Edit preprocessing parameters, analysis thresholds, and database sources.',
    Icon: Settings,
    color: 'purple'
  },
  {
    title: 'Evidence Provenance',
    desc: 'Track which peaks, databases, and techniques contributed to each conclusion. Export reports with full evidence lineage.',
    Icon: FileCheck,
    color: 'emerald'
  },
  {
    title: 'Source Attribution',
    desc: 'Clear labels for deterministic analysis and agent interpretation. Researchers know which parts are rule-based and which are agent-prepared.',
    Icon: GitBranch,
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

export default function TrustControlSection() {
  return (
    <section id="trust" className="border-t border-slate-100 bg-slate-50 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            Trust through transparency and control
          </h2>
          <p className="mx-auto max-w-3xl text-[16px] leading-relaxed text-slate-600">
            DIFARYX is designed for researchers who need to understand, verify, and control every step of the analysis workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {trustPrinciples.map(({ title, desc, Icon, color }) => {
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

        <div className="mt-12 rounded-2xl border border-blue-200 bg-blue-50 p-8">
          <div className="text-center">
            <h3 className="mb-3 text-[20px] font-bold text-slate-900">No Black Boxes</h3>
            <p className="mx-auto max-w-3xl text-[15px] leading-relaxed text-slate-700">
              DIFARYX rejects the black-box approach. Every analysis step, parameter choice, evidence source, and reasoning step is visible, traceable, and verifiable. Researchers maintain full control while benefiting from autonomous execution.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
