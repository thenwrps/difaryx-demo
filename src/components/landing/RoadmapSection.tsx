import React from 'react';

const phases = [
  {
    label: 'PHASE 1',
    status: 'Current',
    active: true,
    title: 'Core Infrastructure',
    items: ['Multi-tech reasoning (XRD, XPS, FTIR, Raman)', 'Evidence packet architecture', 'Autonomous execution pipeline', 'Reproducible decision framework'],
  },
  {
    label: 'PHASE 2',
    status: 'Active',
    active: false,
    title: 'Cloud Integration',
    items: ['Modular deployment (Cloud Run, containers)', 'Provider routing (Vertex AI, Gemma)', 'API-first architecture', 'Extensible tool registry'],
  },
  {
    label: 'PHASE 3',
    status: 'Next',
    active: false,
    title: 'Scale & Collaborate',
    items: ['Multi-user workflows', 'Lab system integration', 'Instrument connectivity', 'Organization deployment'],
  },
  {
    label: 'PHASE 4',
    status: 'Vision',
    active: false,
    title: 'Reasoning Platform',
    items: ['Cross-domain reasoning', 'Knowledge graph integration', 'Predictive insights', 'Autonomous research loops'],
  },
];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-16 border-t border-slate-100 bg-white">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-3">Cloud & Deployment</p>
          <h2 className="text-[24px] font-bold text-slate-900 mb-2">Built for Integration, Modularity, and Extensibility</h2>
          <p className="text-[13px] text-slate-600 max-w-2xl">
            DIFARYX deploys as infrastructure. Integrate with existing tools, connect to lab systems, and extend with custom reasoning modules. Cloud-native architecture supports containerized deployment, API access, and provider routing.
          </p>
        </div>
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
