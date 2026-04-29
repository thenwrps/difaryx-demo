import React from 'react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-16 border-t border-slate-100 bg-white">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <h2 className="text-[28px] lg:text-[32px] font-bold leading-[1.2] text-slate-900 max-w-lg">
            Built for researchers who need traceable agent decisions from{' '}
            <span className="text-blue-600">multi-tech evidence.</span>
          </h2>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-sm md:text-right">
            Start in the workspace or run the CuFe2O4 agent demo across XRD, Raman, FTIR, and XPS.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link to="/dashboard" className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
            <div className="text-sm font-bold text-slate-900">DIFARYX</div>
            <div className="text-[12px] text-slate-500 mt-1">Open the connected scientific agent workspace demo.</div>
          </Link>
          <a href="#inanz" className="border border-slate-200 rounded-lg p-4 hover:border-cyan-300 hover:bg-cyan-50/40 transition-colors">
            <div className="text-sm font-bold text-slate-900">INANZ</div>
            <div className="text-[12px] text-slate-500 mt-1">Public ecosystem link placeholder until the live URL is configured.</div>
          </a>
          <a href="#contact" className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors">
            <div className="text-sm font-bold text-slate-900">Contact / Get Access</div>
            <div className="text-[12px] text-slate-500 mt-1">Open demo access is available now; request team access from this section.</div>
          </a>
        </div>
      </div>
    </section>
  );
}
