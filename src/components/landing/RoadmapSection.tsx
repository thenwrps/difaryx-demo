import React from 'react';

const phases = [
  {
    label: 'PHASE 1',
    status: 'Current',
    active: true,
    title: 'Core Platform',
    items: ['XRD, XPS, FTIR, Raman', 'Notebook Lab', 'Project Workflow', 'Report Export'],
  },
  {
    label: 'PHASE 2',
    status: 'Next',
    active: false,
    title: 'Expand & Integrate',
    items: ['More techniques (SEM/TEM, XRF)', 'Advanced analysis modules', 'Template & automation', 'API & integrations'],
  },
  {
    label: 'PHASE 3',
    status: 'Future',
    active: false,
    title: 'Collaborate & Scale',
    items: ['Multi-user collaboration', 'Cloud sync & sharing', 'Lab & instrument integration', 'Organization & permissions'],
  },
  {
    label: 'PHASE 4',
    status: 'Vision',
    active: false,
    title: 'Intelligent Science Platform',
    items: ['AI-assisted analysis', 'Knowledge graph', 'Predictive insights', 'Autonomous workflows'],
  },
];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-16 border-t border-slate-100 bg-white">
      <div className="max-w-[1280px] mx-auto px-8">
        <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-8">Roadmap</p>
        <div className="hidden md:flex items-center gap-0 mb-6 px-1">
          {phases.map((phase, i) => (
            <React.Fragment key={phase.label}>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${phase.active ? 'bg-blue-600' : 'bg-slate-300'}`} />
              {i < phases.length - 1 && <div className="flex-1 h-[1px] bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {phases.map((phase) => (
            <div key={phase.label}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] font-bold text-slate-900 tracking-wide">{phase.label}</span>
                <span className={`text-[10px] font-semibold ${phase.active ? 'text-blue-600' : 'text-slate-400'}`}>({phase.status})</span>
              </div>
              <h3 className="text-[14px] font-bold text-slate-900 mb-2">{phase.title}</h3>
              <ul className="space-y-1">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                    <span className="text-slate-400 mt-px">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
