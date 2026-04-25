import React from 'react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-8 h-[56px] flex items-center justify-between">
        <div className="flex items-center gap-10">
          <a href="#" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo/difaryx.png" alt="DIFARYX" className="h-6 object-contain" />
          </a>
          <nav className="hidden lg:flex items-center gap-6">
            {['PRODUCT','TECHNIQUES','NOTEBOOK LAB','ROADMAP','COMPANY','INVESTOR BRIEFING'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g,'-')}`}
                className="text-[12px] font-semibold tracking-[0.04em] text-slate-500 hover:text-slate-900 transition-colors">
                {item}
              </a>
            ))}
          </nav>
        </div>
        <button className="hidden md:inline-flex items-center gap-2 h-8 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-colors">
          JOIN CLOSED BETA
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </header>
  );
}
