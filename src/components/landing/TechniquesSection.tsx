import React from 'react';

function SpectrumCard({ title, desc, axisLabel, axisValues, color, pathD, baseline }: {
  title: string; desc: string; axisLabel: string; axisValues: string[]; color: string; pathD: string; baseline?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
      <h3 className="text-[15px] font-bold text-slate-900 mb-2">{title}</h3>
      <div className="mb-2 border border-slate-100 rounded-md p-2 bg-slate-50/50">
        <svg viewBox="0 0 200 50" className="w-full h-12" preserveAspectRatio="none">
          {baseline && <line x1="0" y1={baseline} x2="200" y2={baseline} stroke="#e2e8f0" strokeWidth="0.5"/>}
          <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="flex justify-between text-[7px] text-slate-400 mb-0.5 px-0.5">
        {axisValues.map((v,i) => <span key={i}>{v}</span>)}
      </div>
      <div className="text-[8px] text-slate-400 text-center mb-2">{axisLabel}</div>
      <p className="text-[11px] text-slate-500 leading-relaxed mt-auto">{desc}</p>
    </div>
  );
}

const comingSoon = ['SEM / TEM', 'XRF / XAS', 'MS / GC', 'ICP-OES'];

export default function TechniquesSection() {
  return (
    <section id="techniques" className="py-16 border-t border-slate-100 bg-white">
      <div className="max-w-[1280px] mx-auto px-8">
        <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-6">Techniques We Support</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <SpectrumCard title="XRD" desc="Phase identification and crystal structure analysis."
            axisLabel="2θ (°)" axisValues={['10','20','30','40','50','60','70','80']} color="#2563eb" baseline="45"
            pathD="M0,45 L15,45 L18,42 L20,8 L22,45 L55,45 L58,30 L60,45 L90,45 L93,18 L95,45 L140,45 L143,35 L145,45 L180,45 L183,40 L185,45 L200,45" />
          <SpectrumCard title="XPS" desc="Surface composition and chemical state analysis."
            axisLabel="Binding Energy (eV)" axisValues={['1200','1000','600','400','200','0']} color="#8b5cf6" baseline="45"
            pathD="M0,45 L30,45 L33,8 L36,45 L90,45 L93,25 L96,45 L140,45 L143,35 L146,45 L200,45" />
          <SpectrumCard title="FTIR" desc="Functional group identification and molecular analysis."
            axisLabel="Wavenumber (cm⁻¹)" axisValues={['4000','3000','2000','1500','1000','500']} color="#ef4444" baseline="5"
            pathD="M0,5 L25,5 L30,18 L35,5 L80,5 L85,35 L90,5 L130,5 L135,42 L140,28 L145,38 L150,5 L180,5 L185,22 L190,5 L200,5" />
          <SpectrumCard title="Raman" desc="Molecular vibrations and structural information."
            axisLabel="Raman shift (cm⁻¹)" axisValues={['500','1000','1500','2000','2500','3000']} color="#10b981" baseline="45"
            pathD="M0,45 L20,45 L23,35 L26,45 L80,45 L83,12 L86,45 L140,45 L143,6 L146,45 L165,45 L168,28 L171,45 L200,45" />
          {/* Coming Soon */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col">
            <p className="text-[10px] font-bold text-orange-500 tracking-wide uppercase mb-3">Coming Soon</p>
            <div className="space-y-2 flex-1">
              {comingSoon.map(item => (
                <div key={item} className="flex justify-between items-center text-[13px] font-semibold text-slate-700 border-b border-slate-200 pb-2 last:border-0">
                  {item}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">and more...</p>
          </div>
        </div>
      </div>
    </section>
  );
}
