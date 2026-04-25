import React from 'react';

export default function CTASection() {
  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      {/* Spectrum wave accent */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none opacity-20">
        <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,100 Q25,60 50,100 T100,100 T150,100 T200,100" fill="none" stroke="#60a5fa" strokeWidth="1"/>
          <path d="M0,120 Q25,80 50,120 T100,120 T150,120 T200,120" fill="none" stroke="#818cf8" strokeWidth="0.8"/>
          <path d="M0,140 Q25,100 50,140 T100,140 T150,140 T200,140" fill="none" stroke="#a78bfa" strokeWidth="0.6"/>
        </svg>
      </div>

      <div className="max-w-[1280px] mx-auto px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <h2 className="text-[28px] lg:text-[32px] font-bold leading-[1.2] text-white max-w-lg">
            Built for researchers who want less tool switching and more{' '}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">scientific clarity.</span>
          </h2>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-2 h-11 px-7 rounded-xl bg-white text-slate-900 text-[14px] font-semibold hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-200">
              JOIN CLOSED BETA
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <p className="text-[11px] text-blue-200/80">Be part of the future of scientific workflow.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
