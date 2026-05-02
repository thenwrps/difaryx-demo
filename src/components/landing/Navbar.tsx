import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-8 lg:gap-10">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <img src="/logo/difaryx.png" alt="DIFARYX" className="h-6 object-contain" />
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {[
              ['Product', '#product'],
              ['Techniques', '#techniques'],
              ['Notebook Lab', '/notebook?project=cu-fe2o4-spinel'],
              ['Agent Demo', '/demo/agent'],
              ['Roadmap', '#roadmap'],
              ['Company', '#company'],
              ['Investor Briefing', '#roadmap'],
            ].map(([item, href]) => (
              <a
                key={item}
                href={href}
                className="text-[13px] font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
