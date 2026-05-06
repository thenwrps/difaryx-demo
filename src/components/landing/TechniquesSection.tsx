import React from 'react';
import {
  createSvgPath,
  generateFtirTrace,
  generateRamanTrace,
  generateUvVisTrace,
  generateVsmTrace,
  generateXpsTrace,
  generateXrdTrace,
} from '../../data/syntheticTraces';

type SpectrumCardProps = {
  title: string;
  desc: string;
  axisLabel: string;
  axisValues: string[];
  color: string;
  pathD: string;
  baseline?: number;
};

function SpectrumCard({ title, desc, axisLabel, axisValues, color, pathD, baseline }: SpectrumCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-[15px] font-bold text-slate-900">{title}</h3>
      <div className="mb-2 rounded-md border border-slate-100 bg-slate-50/50 p-2">
        <svg viewBox="0 0 200 58" className="h-14 w-full" preserveAspectRatio="none" aria-hidden="true">
          <line x1="8" y1="50" x2="194" y2="50" stroke="#e2e8f0" strokeWidth="0.7" />
          <line x1="8" y1="8" x2="8" y2="50" stroke="#e2e8f0" strokeWidth="0.7" />
          {baseline !== undefined && <line x1="8" y1={baseline} x2="194" y2={baseline} stroke="#cbd5e1" strokeWidth="0.6" strokeDasharray="3 3" />}
          <path d={pathD} fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="mb-0.5 flex justify-between px-0.5 text-[7px] text-slate-400">
        {axisValues.map((value) => <span key={value}>{value}</span>)}
      </div>
      <div className="mb-2 text-center text-[8px] text-slate-400">{axisLabel}</div>
      <p className="mt-auto text-[11px] leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}

const techniqueCards = [
  {
    title: 'XRD',
    desc: 'Sharp ferrite diffraction peaks for phase identification and crystal structure analysis.',
    axisLabel: '2theta 10-80 deg',
    axisValues: ['10', '20', '30', '40', '50', '60', '70', '80'],
    color: '#2563eb',
    baseline: 50,
    pathD: createSvgPath(generateXrdTrace(170), 200, 58, 8),
  },
  {
    title: 'XPS',
    desc: 'Broad binding-energy envelopes for oxidation-state and surface composition review.',
    axisLabel: 'Binding energy (eV, high to low)',
    axisValues: ['970', '900', '800', '700', '600', '500'],
    color: '#8b5cf6',
    baseline: 50,
    pathD: createSvgPath(generateXpsTrace(170).slice().reverse(), 200, 58, 8),
  },
  {
    title: 'FTIR',
    desc: 'Transmittance bands showing metal-oxygen, support, hydroxyl, and water features.',
    axisLabel: 'Wavenumber 4000-400 cm-1',
    axisValues: ['4000', '3200', '2400', '1600', '1000', '400'],
    color: '#ef4444',
    baseline: 12,
    pathD: createSvgPath(generateFtirTrace(170).slice().reverse(), 200, 58, 8),
  },
  {
    title: 'Raman',
    desc: 'Sharp vibrational modes around ferrite spinel Raman fingerprints.',
    axisLabel: 'Raman shift (cm-1)',
    axisValues: ['150', '300', '480', '690', '850'],
    color: '#10b981',
    baseline: 50,
    pathD: createSvgPath(generateRamanTrace(170), 200, 58, 8),
  },
  {
    title: 'UV-Vis',
    desc: 'Smooth absorbance edge and broad band for optical response screening.',
    axisLabel: 'Wavelength (nm)',
    axisValues: ['300', '400', '500', '600', '700', '850'],
    color: '#0ea5e9',
    pathD: createSvgPath(generateUvVisTrace(170), 200, 58, 8),
  },
  {
    title: 'VSM',
    desc: 'Magnetic hysteresis loop for coercivity and saturation behavior.',
    axisLabel: 'Applied field (kOe)',
    axisValues: ['-12', '-6', '0', '6', '12'],
    color: '#f97316',
    baseline: 29,
    pathD: createSvgPath(generateVsmTrace(180), 200, 58, 8),
  },
];

const comingSoon = ['SEM / TEM', 'XRF / XAS', 'MS / GC', 'ICP-OES'];

export default function TechniquesSection() {
  return (
    <section id="techniques" className="border-t border-slate-100 bg-white py-16">
      <div className="mx-auto max-w-[1280px] px-8">
        <div className="mb-8">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Product</p>
          <h2 className="text-[28px] lg:text-[32px] font-bold leading-[1.2] text-slate-900 mb-3">
            Cross-Technique Insights
          </h2>
          <p className="text-[14px] text-slate-600 max-w-2xl">
            DIFARYX supports XRD, XPS, FTIR, Raman, and other characterization techniques. The agent demo demonstrates one execution of the system using XRD phase identification for catalyst materials.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {techniqueCards.map((card) => (
            <SpectrumCard key={card.title} {...card} />
          ))}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-orange-500">Extensible Architecture</p>
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
              {comingSoon.map((item) => (
                <div key={item} className="flex items-center justify-between border-b border-slate-200 pb-2 text-[13px] font-semibold text-slate-700 last:border-0">
                  {item}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">Additional modalities integrate into the same reasoning infrastructure.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
