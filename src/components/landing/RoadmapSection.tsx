import React from 'react';

const phases = [
  { label: 'PHASE 1', status: 'Current', active: true, title: 'Core Platform',
    items: ['XRD, XPS, FTIR, Raman', 'Notebook Lab', 'Project Workflow', 'Report Export'] },
  { label: 'PHASE 2', status: 'Next', active: false, title: 'Expand & Integrate',
    items: ['More techniques (SEM/TEM, XRF)', 'Advanced analysis modules', 'Template & automation', 'API & integrations'] },
  { label: 'PHASE 3', status: 'Future', active: false, title: 'Collaborate & Scale',
    items: ['Multi-user collaboration', 'Cloud sync & sharing', 'Lab & instrument integration', 'Organization & permissions'] },
  { label: 'PHASE 4', status: 'Vision', active: false, title: 'Intelligent Science Platform',
    items: ['AI-assisted analysis', 'Knowledge graph', 'Predictive insights', 'Autonomous workflows'] },
];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-16 bg-gradient-to-b from-white to-slate-50/80">
      <div className="max-w-[1280px] mx-auto px-8">
        <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-8">Roadmap</p>

        {/* Timeline dots with connecting line */}
        <div className="hidden md:flex items-center gap-0 mb-6 px-2">
          {phases.map((phase, i) => (
            <React.Fragment key={phase.label}>
              <div className={`w-3 h-3 rounded-full shrink-0 transition-all ${phase.active ? 'bg-blue-600 ring-4 ring-blue-100 shadow-md shadow-blue-400/30' : 'bg-slate-300'}`} />
              {i < phases.length - 1 && <div className="flex-1 h-[2px] bg-gradient-to-r from-slate-300 to-slate-200" />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {phases.map(phase => (
            <div key={phase.label} className={`rounded-xl p-5 border transition-all duration-200 ${phase.active ? 'bg-white border-blue-200 shadow-md shadow-blue-500/5 ring-1 ring-blue-100' : 'bg-white border-slate-200/80 hover:shadow-sm'}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] font-bold text-slate-900 tracking-wide">{phase.label}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${phase.active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>{phase.status}</span>
              </div>
              <h3 className="text-[14px] font-bold text-slate-900 mb-3">{phase.title}</h3>
              <ul className="space-y-1.5">
                {phase.items.map(item => (
                  <li key={item} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                    <span className={`mt-px ${phase.active ? 'text-blue-500' : 'text-slate-400'}`}>✓</span>
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
