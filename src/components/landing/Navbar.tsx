import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-8 h-[56px] flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo/difaryx.png" alt="DIFARYX" className="h-6 object-contain" />
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            {['PRODUCT','TECHNIQUES','NOTEBOOK LAB','ROADMAP','COMPANY','INVESTOR BRIEFING'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g,'-')}`}
                className="text-[12px] font-semibold tracking-[0.04em] text-slate-500 hover:text-slate-900 transition-colors">
                {item}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
