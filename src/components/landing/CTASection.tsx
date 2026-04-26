import React from 'react';

export default function CTASection() {
  return (
    <section className="py-16 border-t border-slate-100 bg-white">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <h2 className="text-[28px] lg:text-[32px] font-bold leading-[1.2] text-slate-900 max-w-lg">
            Built for researchers who want less tool switching and more{' '}
            <span className="text-blue-600">scientific clarity.</span>
          </h2>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-2 h-11 px-7 rounded-xl bg-blue-600 text-white text-[14px] font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/15">
              JOIN CLOSED BETA
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <p className="text-[11px] text-slate-400">Be part of the future of scientific workflow.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
