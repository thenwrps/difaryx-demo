import React from 'react';

const techniques = [
  { name: 'XRD', desc: 'Structural phases', color: 'bg-blue-600' },
  { name: 'XPS', desc: 'Surface chemistry', color: 'bg-violet-600' },
  { name: 'Raman', desc: 'Structural fingerprint', color: 'bg-emerald-600' },
  { name: 'FTIR', desc: 'Bonding', color: 'bg-red-600' },
];

export default function MultiTechniqueSection() {
  return (
    <section className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-12 text-center text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          One system across multiple techniques
        </h2>
        <div className="mb-4 text-center">
          <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[13px] font-semibold text-blue-700">
            Available in current system
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
          {techniques.map((tech) => (
            <div key={tech.name} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl ${tech.color} text-[18px] font-bold text-white`}>
                {tech.name}
              </div>
              <div className="text-[13px] text-slate-600">{tech.desc}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-[12px] text-slate-500">
          Coming next: SEM / TEM
        </p>
      </div>
    </section>
  );
}
