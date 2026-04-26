import React from 'react';

export default function Footer() {
  return (
    <footer id="stay-updated" className="py-12 bg-slate-900 text-slate-400">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <img src="/logo/difaryx.png" alt="DIFARYX" className="h-6 object-contain mb-2.5 brightness-0 invert opacity-80" />
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-[180px] mb-3">
              From scientific signal to structured insight.
            </p>
            <div className="flex gap-2">
              {['in','✉','𝕏'].map((icon,i) => (
                <span key={i} className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold cursor-pointer hover:bg-slate-700 hover:text-slate-300 transition-colors">{icon}</span>
              ))}
            </div>
          </div>
          {/* Product */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-[12px] text-slate-500">
              {['Overview','Techniques','Notebook Lab','Use Cases'].map(item => (
                <li key={item}><a href="#" className="hover:text-slate-300 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          {/* Company */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2 text-[12px] text-slate-500">
              {['About','Investor Briefing','Careers','Contact'].map(item => (
                <li key={item}><a href="#" className="hover:text-slate-300 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          {/* Resources */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2 text-[12px] text-slate-500">
              {['Documentation','Help Center','Privacy Policy','Terms of Service'].map(item => (
                <li key={item}><a href="#" className="hover:text-slate-300 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          {/* Stay Updated */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-3">Stay Updated</h4>
            <p className="text-[11px] text-slate-500 mb-2.5">Join our waitlist for updates and early access.</p>
            <div className="flex">
              <input type="email" placeholder="Enter your email" className="flex-1 h-8 px-2.5 text-[11px] border border-slate-700 rounded-l-md focus:outline-none focus:border-blue-500 bg-slate-800 text-slate-300 placeholder:text-slate-600 min-w-0"/>
              <button className="h-8 w-8 bg-blue-600 text-white rounded-r-md flex items-center justify-center hover:bg-blue-500 transition-colors shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div className="pt-5 border-t border-slate-800 text-[10px] text-slate-600">
          © 2024 DIFARYX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
