import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export default function AgentDemoSection() {
  return (
    <section className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
              Autonomous scientific workflow execution
            </h2>
            <p className="mb-6 text-[16px] leading-relaxed text-slate-600">
              Every step is executed automatically while remaining visible and reviewable.
            </p>
            <div className="mb-6 space-y-3">
              {[
                { step: '1', label: 'Load experimental signal' },
                { step: '2', label: 'Detect features' },
                { step: '3', label: 'Execute analysis pipeline' },
                { step: '4', label: 'Evaluate candidate interpretations' },
                { step: '5', label: 'Score evidence' },
                { step: '6', label: 'Generate decision' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-[13px] font-bold text-white">
                    {item.step}
                  </div>
                  <div className="text-[15px] text-slate-700">{item.label}</div>
                </div>
              ))}
            </div>
            <Link
              to="/demo/agent"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-[15px] font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25"
            >
              <Play size={18} />
              Run Agent Demo
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <div className="mb-4 text-[13px] font-bold uppercase tracking-wider text-slate-500">Workflow Steps</div>
            <div className="space-y-3">
              {[
                { label: 'Signal input', desc: 'Experimental data loaded' },
                { label: 'Feature detection', desc: 'Peaks and patterns identified' },
                { label: 'Pipeline execution', desc: 'Analysis steps performed' },
                { label: 'Evidence scoring', desc: 'Confidence metrics calculated' },
                { label: 'Decision output', desc: 'Traceable result generated' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="text-[14px] font-semibold text-slate-900">{item.label}</div>
                  <div className="text-[12px] text-slate-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
