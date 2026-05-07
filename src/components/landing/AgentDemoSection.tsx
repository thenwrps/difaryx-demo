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
              Autonomous Scientific Agent (Demo)
            </h2>
            <p className="mb-6 text-[16px] leading-relaxed text-slate-600">
              The DIFARYX agent demonstrates one execution of the system.
            </p>
            <p className="mb-6 text-[16px] leading-relaxed text-slate-600">
              It:
            </p>
            <ul className="mb-6 space-y-2">
              {[
                'loads experimental data',
                'extracts features',
                'evaluates candidate interpretations',
                'connects evidence',
                'produces a decision with traceable reasoning',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/demo/agent"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-[15px] font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25"
            >
              <Play size={18} />
              Open Demo
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="space-y-4">
              {[
                { step: '1', label: 'Load dataset', desc: 'XRD diffraction pattern' },
                { step: '2', label: 'Extract features', desc: '9 peaks detected' },
                { step: '3', label: 'Evaluate candidates', desc: '5 phase matches reviewed' },
                { step: '4', label: 'Link evidence', desc: 'Supporting data + uncertainty' },
                { step: '5', label: 'Produce conclusion', desc: 'Traceable interpretation output' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-[13px] font-bold text-white">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-slate-900">{item.label}</div>
                    <div className="text-[13px] text-slate-600">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
