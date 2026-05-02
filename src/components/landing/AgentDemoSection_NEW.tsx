import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Eye, FileText, Settings } from 'lucide-react';

const demoFeatures = [
  {
    title: 'Live Agent Execution',
    desc: 'Watch the agent plan steps, execute tools, and collect evidence in real-time.',
    Icon: Play
  },
  {
    title: 'Reasoning Transparency',
    desc: 'See candidate comparison, conflict analysis, uncertainty assessment, and evidence synthesis.',
    Icon: Eye
  },
  {
    title: 'Hybrid Interpretation',
    desc: 'View both deterministic analysis and Gemini-generated scientific reasoning with clear attribution.',
    Icon: FileText
  },
  {
    title: 'Parameter Control',
    desc: 'Switch between hybrid mode (manual + agent) and agent 100% mode. Edit preprocessing parameters.',
    Icon: Settings
  }
];

export default function AgentDemoSection() {
  return (
    <section id="demo" className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            Try the autonomous agent demo
          </h2>
          <p className="mx-auto max-w-3xl text-[16px] leading-relaxed text-slate-600">
            Experience DIFARYX's autonomous agent executing a complete XRD phase identification workflow from signal to scientific determination.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {demoFeatures.map(({ title, desc, Icon }) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-200">
                <Icon size={18} className="text-slate-600" />
              </div>
              <h3 className="mb-2 text-[14px] font-bold text-slate-900">{title}</h3>
              <p className="text-[12px] leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="mb-4 text-[24px] font-bold text-slate-900">
              See the agent in action
            </h3>
            <p className="mb-8 text-[15px] leading-relaxed text-slate-600">
              The demo shows a complete XRD phase identification workflow: load dataset, detect peaks, generate candidates, evaluate hypotheses, synthesize evidence, generate interpretation, and finalize scientific determination with confidence estimation.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/demo/agent"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 text-[15px] font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25"
              >
                <Play size={16} className="mr-2" />
                Run Agent Demo
              </Link>
              <Link
                to="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-8 text-[15px] font-bold text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
              >
                Explore Workflow
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
