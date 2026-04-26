import React from 'react';
import { PLATFORM_URL } from '../../constants/platform';

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
          <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
              <a
                href={PLATFORM_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 h-11 px-7 rounded-xl bg-white text-slate-900 text-[14px] font-semibold shadow-[0_22px_45px_-22px_rgba(96,165,250,0.55)] ring-1 ring-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-[0_24px_48px_-20px_rgba(96,165,250,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                View Platform
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a
                href="#stay-updated"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border border-white/20 bg-white/5 text-white text-[14px] font-semibold transition-all duration-200 hover:border-white/35 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Join Closed Beta
              </a>
            </div>
            <p className="text-[11px] text-blue-200/80">Explore the live DIFARYX demo or join the early-access list.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
