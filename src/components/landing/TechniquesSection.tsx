import React from 'react';

function SpectrumCard({ title, desc, axisLabel, axisValues, color, glowColor, pathD, baseline }: {
  title: string; desc: string; axisLabel: string; axisValues: string[]; color: string; glowColor: string; pathD: string; baseline?: string;
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-default group relative overflow-hidden">
      {/* Subtle technique glow */}
      <div className={`absolute -bottom-8 -right-8 w-24 h-24 ${glowColor} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

      <h3 className="text-[16px] font-bold text-slate-900 mb-1 relative z-10">{title}</h3>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-3 relative z-10">{desc}</p>

      <div className="mb-2 border border-slate-100 rounded-lg p-3 bg-gradient-to-b from-slate-50/50 to-white relative z-10">
        <svg viewBox="0 0 200 55" className="w-full h-16" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="13" x2="200" y2="13" stroke="#f1f5f9" strokeWidth="0.5"/>
          <line x1="0" y1="27" x2="200" y2="27" stroke="#f1f5f9" strokeWidth="0.5"/>
          <line x1="0" y1="41" x2="200" y2="41" stroke="#f1f5f9" strokeWidth="0.5"/>
          {baseline && <line x1="0" y1={baseline} x2="200" y2={baseline} stroke="#e2e8f0" strokeWidth="0.7"/>}
          <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="flex justify-between text-[7px] text-slate-400 mb-0.5 px-1 relative z-10">
        {axisValues.map((v,i) => <span key={i}>{v}</span>)}
      </div>
      <div className="text-[8px] text-slate-400 text-center relative z-10">{axisLabel}</div>
    </div>
  );
}

const comingSoon = ['SEM / TEM', 'XRF / XAS', 'MS / GC', 'ICP-OES'];

export default function TechniquesSection() {
  return (
    <section id="techniques" className="py-16 bg-gradient-to-b from-white via-white to-slate-50/50">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-3">Scientific Analysis Suite</p>
          <h2 className="text-[28px] lg:text-[32px] font-bold leading-[1.2] text-slate-900 mb-2">Techniques We Support</h2>
          <p className="text-[14px] text-slate-500 max-w-lg">Every modality in one unified workflow — from data ingestion to structured insight.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <SpectrumCard title="XRD" desc="Phase identification and crystal structure analysis."
            axisLabel="2θ (°)" axisValues={['10','20','30','40','50','60','70','80']} color="#2563eb" glowColor="bg-blue-200" baseline="48"
            pathD="M0,48 L15,48 L18,44 L20,8 L22,48 L55,48 L58,32 L60,48 L90,48 L93,18 L95,48 L140,48 L143,38 L145,48 L180,48 L183,42 L185,48 L200,48" />
          <SpectrumCard title="XPS" desc="Surface composition and chemical state analysis."
            axisLabel="Binding Energy (eV)" axisValues={['1200','1000','600','400','200','0']} color="#8b5cf6" glowColor="bg-violet-200" baseline="48"
            pathD="M0,48 L30,48 L33,8 L36,48 L90,48 L93,28 L96,48 L140,48 L143,38 L146,48 L200,48" />
          <SpectrumCard title="FTIR" desc="Functional group identification and molecular analysis."
            axisLabel="Wavenumber (cm⁻¹)" axisValues={['4000','3000','2000','1500','1000','500']} color="#ef4444" glowColor="bg-red-200" baseline="5"
            pathD="M0,5 L25,5 L30,18 L35,5 L80,5 L85,38 L90,5 L130,5 L135,45 L140,30 L145,40 L150,5 L180,5 L185,22 L190,5 L200,5" />
          <SpectrumCard title="Raman" desc="Molecular vibrations and structural information."
            axisLabel="Raman shift (cm⁻¹)" axisValues={['500','1000','1500','2000','2500','3000']} color="#10b981" glowColor="bg-emerald-200" baseline="48"
            pathD="M0,48 L20,48 L23,38 L26,48 L80,48 L83,12 L86,48 L140,48 L143,6 L146,48 L165,48 L168,30 L171,48 L200,48" />
          {/* Coming Soon */}
          <div className="bg-slate-50 border border-slate-200/80 border-dashed rounded-xl p-5 flex flex-col">
            <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase mb-4">Coming Soon</p>
            <div className="space-y-2.5 flex-1">
              {comingSoon.map(item => (
                <div key={item} className="flex justify-between items-center text-[13px] font-semibold text-slate-500 border-b border-slate-200/60 pb-2.5 last:border-0">
                  {item}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
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
