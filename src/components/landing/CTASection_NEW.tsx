import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Workflow } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="border-t border-slate-100 bg-gradient-to-br from-slate-900 to-slate-800 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="text-center">
          <h2 className="mb-6 text-[36px] font-bold leading-[1.1] text-white lg:text-[44px]">
            Experience autonomous scientific workflow execution
          </h2>
          <p className="mx-auto mb-10 max-w-3xl text-[17px] leading-relaxed text-slate-300">
            Try DIFARYX's agent demo to see how autonomous execution, interpretation, and supporting data work together for traceable characterization conclusions.
          </p>
          
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/demo/agent"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-blue-600 px-10 text-[16px] font-bold text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40"
            >
              <Play size={18} className="mr-2" />
              Run Agent Demo
            </Link>
            <Link
              to="/login"
              className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 px-10 text-[16px] font-bold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15"
            >
              <Workflow size={18} className="mr-2" />
              Explore Workflow
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-2 text-[28px] font-bold text-white">4</div>
              <div className="text-[13px] font-semibold text-slate-300">Characterization Techniques</div>
              <div className="mt-1 text-[12px] text-slate-400">XRD, XPS, FTIR, Raman</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-2 text-[28px] font-bold text-white">7</div>
              <div className="text-[13px] font-semibold text-slate-300">Autonomous Execution Steps</div>
              <div className="mt-1 text-[12px] text-slate-400">From signal to decision</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-2 text-[28px] font-bold text-white">100%</div>
              <div className="text-[13px] font-semibold text-slate-300">Supporting Data</div>
              <div className="mt-1 text-[12px] text-slate-400">Every step is traceable</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
