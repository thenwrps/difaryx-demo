import React from 'react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section id="contact" className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12 text-center shadow-sm lg:p-16">
          <h2 className="mb-6 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[48px]">
            Execute a scientific workflow
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/demo/agent"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-blue-600 px-8 text-[16px] font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25"
            >
              Run Agent Demo
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-14 items-center justify-center rounded-xl border border-slate-300 bg-white px-8 text-[16px] font-bold text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
            >
              Explore Workflow
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
