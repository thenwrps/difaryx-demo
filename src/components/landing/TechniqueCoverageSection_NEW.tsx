import React from 'react';
import { Atom, Layers, Waves, Sparkle } from 'lucide-react';

const techniques = [
  {
    name: 'XRD',
    fullName: 'X-Ray Diffraction',
    desc: 'Measures diffraction from crystallographic planes following Bragg\'s law. Provides bulk crystallographic information for phase identification and structural characterization.',
    capabilities: ['Peak detection', 'Phase matching (ICDD/COD/AMCSD)', 'Lattice refinement', 'Crystallite size'],
    Icon: Atom,
    color: 'cyan'
  },
  {
    name: 'XPS',
    fullName: 'X-Ray Photoelectron Spectroscopy',
    desc: 'Measures binding energies of core-level electrons to determine oxidation states and chemical bonding. Surface-sensitive technique with 5-10 nm sampling depth.',
    capabilities: ['Peak fitting', 'Background subtraction (Shirley/Tougaard)', 'Quantification (Scofield RSF)', 'Oxidation state assignment'],
    Icon: Layers,
    color: 'blue'
  },
  {
    name: 'FTIR',
    fullName: 'Fourier-Transform Infrared Spectroscopy',
    desc: 'Measures vibrational modes from infrared absorption by molecular bonds. Identifies functional groups and chemical composition.',
    capabilities: ['Baseline correction', 'Band assignment', 'Functional group detection', 'ATR mode support'],
    Icon: Waves,
    color: 'purple'
  },
  {
    name: 'Raman',
    fullName: 'Raman Spectroscopy',
    desc: 'Measures inelastic scattering from vibrational modes. Provides molecular symmetry information and structural fingerprints.',
    capabilities: ['Mode assignment', 'Factor group analysis', 'Peak deconvolution', 'Calibration (Si standard)'],
    Icon: Sparkle,
    color: 'emerald'
  }
];

const colorMap = {
  cyan: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    icon: 'text-cyan-600',
    badge: 'bg-cyan-100 text-cyan-700'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700'
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700'
  }
};

export default function TechniqueCoverageSection() {
  return (
    <section id="techniques" className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            Four characterization techniques in one platform
          </h2>
          <p className="mx-auto max-w-3xl text-[16px] leading-relaxed text-slate-600">
            DIFARYX supports XRD, XPS, FTIR, and Raman spectroscopy with technique-specific preprocessing, analysis tools, and cross-technique evidence fusion.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {techniques.map(({ name, fullName, desc, capabilities, Icon, color }) => {
            const colors = colorMap[color as keyof typeof colorMap];
            return (
              <div key={name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="mb-4 flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.bg} border ${colors.border}`}>
                    <Icon size={20} className={colors.icon} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="text-[18px] font-bold text-slate-900">{name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.badge}`}>
                        {name}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-slate-600">{fullName}</p>
                  </div>
                </div>
                <p className="mb-4 text-[14px] leading-relaxed text-slate-700">{desc}</p>
                <div className="space-y-2">
                  <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Capabilities</div>
                  <ul className="space-y-1.5">
                    {capabilities.map((capability, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${colors.badge}`} />
                        <span className="text-[13px] text-slate-600">{capability}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <div className="text-center">
            <h3 className="mb-3 text-[20px] font-bold text-slate-900">Cross-Technique Evidence Fusion</h3>
            <p className="mx-auto max-w-3xl text-[15px] leading-relaxed text-slate-700">
              Compare XRD phase assignments with XPS oxidation states, FTIR functional groups, and Raman vibrational modes in a unified multi-technique workspace. The agent synthesizes evidence across techniques to increase confidence and resolve conflicts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
