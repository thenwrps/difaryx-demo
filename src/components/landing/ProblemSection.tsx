import React from 'react';
import { FileText, StickyNote, RefreshCw, Unplug, HelpCircle } from 'lucide-react';

const problems = [
  { title: 'Raw files', desc: 'Instrument signals arrive across formats, folders, and naming conventions.', Icon: FileText },
  { title: 'Scattered notes', desc: 'Interpretation depends on context spread across notebooks and messages.', Icon: StickyNote },
  { title: 'Repeated steps', desc: 'Manual processing makes evidence review slow and inconsistent.', Icon: RefreshCw },
  { title: 'Disconnected tools', desc: 'XRD, Raman, FTIR, and XPS work rarely share one reasoning path.', Icon: Unplug },
  { title: 'Hard to reproduce', desc: 'Decisions need linked methods, caveats, confidence, and provenance.', Icon: HelpCircle },
];

export default function ProblemSection() {
  return (
    <section id="product" className="py-16 border-t border-slate-100 bg-white">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          <div>
            <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-4">The Problem</p>
            <h2 className="text-[28px] lg:text-[32px] font-bold leading-[1.2] text-slate-900">
              Scientific interpretation is fragmented across tools, files, and expertise.
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {problems.map(({ title, desc, Icon }) => (
              <div key={title} className="border border-slate-200 rounded-xl p-4 bg-white text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-slate-500" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
