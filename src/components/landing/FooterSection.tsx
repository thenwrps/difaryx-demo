import React from 'react';

const productLinks = [
  ['Overview', '/'],
  ['Techniques', '#techniques'],
  ['Notebook Lab', '/notebook?project=cu-fe2o4-spinel'],
  ['Use Cases', '#product'],
];

const companyLinks = [
  ['About', '#company'],
  ['Investor Briefing', '#roadmap'],
  ['Careers', '#company'],
  ['Contact', '#contact'],
];

const resourceLinks = [
  ['Documentation', '#workflow'],
  ['Help Center', '#contact'],
  ['Privacy Policy', '#company'],
  ['Terms of Service', '#company'],
];

export default function Footer() {
  return (
    <footer id="company" className="py-12 border-t border-slate-200 bg-white">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <img src="/logo/difaryx.png" alt="DIFARYX" className="h-6 object-contain mb-2.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-[180px] mb-3">
              From scientific signal to structured insight.
            </p>
            <div className="flex gap-2">
              {['in', '@', 'X'].map((icon, i) => (
                <span key={i} className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold cursor-pointer hover:bg-slate-200 transition-colors">
                  {icon}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-[12px] text-slate-500">
              {productLinks.map(([item, href]) => (
                <li key={item}><a href={href} className="hover:text-slate-900 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2 text-[12px] text-slate-500">
              {companyLinks.map(([item, href]) => (
                <li key={item}><a href={href} className="hover:text-slate-900 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2 text-[12px] text-slate-500">
              {resourceLinks.map(([item, href]) => (
                <li key={item}><a href={href} className="hover:text-slate-900 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-3">Stay Updated</h4>
            <p className="text-[11px] text-slate-500 mb-2.5">Follow DIFARYX updates and demo availability.</p>
            <div className="flex">
              <input type="email" placeholder="Enter your email" className="flex-1 h-8 px-2.5 text-[11px] border border-slate-200 rounded-l-md focus:outline-none focus:border-blue-400 bg-white text-slate-700 placeholder:text-slate-400 min-w-0" />
              <button title="Subscribe" className="h-8 w-8 bg-blue-600 text-white rounded-r-md flex items-center justify-center hover:bg-blue-700 transition-colors shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
        <div className="pt-5 border-t border-slate-100 text-[10px] text-slate-400">
          (c) 2024 DIFARYX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
