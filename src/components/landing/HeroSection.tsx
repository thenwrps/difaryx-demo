import React from 'react';

function DashboardMockup() {
  return (
    <div className="relative group">
      {/* Glow behind mockup */}
      <div className="absolute -inset-6 bg-gradient-to-br from-blue-400/20 via-violet-400/15 to-transparent rounded-[2rem] blur-2xl pointer-events-none" />
      <div className="absolute -inset-3 bg-gradient-to-tr from-blue-500/10 to-violet-500/10 rounded-2xl pointer-events-none" />
      
      <div className="relative bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col transition-shadow duration-500 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)]" style={{height: 440}}>
        {/* Top bar */}
        <div className="h-10 border-b border-slate-200/80 flex items-center justify-between px-3 bg-gradient-to-r from-slate-50 to-slate-100/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-200/80 flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
            <span className="text-[10px] font-bold text-slate-800 tracking-wide">DIFARYX</span>
          </div>
          <div className="text-[9px] text-slate-500 hidden sm:block">Project / <span className="text-slate-700 font-medium">LiFePO₄ Characterization</span></div>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[7px] font-bold flex items-center justify-center ml-1">JD</div>
          </div>
        </div>
        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sidebar */}
          <div className="w-28 border-r border-slate-200/60 bg-gradient-to-b from-slate-50 to-white p-1.5 flex flex-col gap-0.5 shrink-0">
            {[{name:'Overview',active:true},{name:'Data'},{name:'Analyses'},{name:'Notebook Lab'},{name:'Reports'},{name:'Library'},{name:'Settings'}].map(item => (
              <div key={item.name} className={`h-6 rounded text-[9px] font-medium flex items-center px-2 cursor-default transition-colors ${item.active ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-500 hover:bg-slate-100'}`}>
                {item.name}
              </div>
            ))}
          </div>
          {/* Main */}
          <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden bg-white">
            <div className="text-[12px] font-bold text-slate-900">Overview</div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-1.5">
              {[{label:'Projects',val:'24'},{label:'Datasets',val:'156'},{label:'Analyses',val:'342'},{label:'Reports',val:'27'}].map(s => (
                <div key={s.label} className="border border-slate-200/80 rounded-lg p-1.5 bg-gradient-to-b from-white to-slate-50/50">
                  <div className="text-[8px] text-slate-400 font-medium">{s.label}</div>
                  <div className="text-[15px] font-bold text-slate-900 leading-tight">{s.val}</div>
                </div>
              ))}
            </div>
            {/* Chart */}
            <div className="flex-1 border border-slate-200/80 rounded-lg p-2.5 flex flex-col min-h-0 bg-gradient-to-b from-white to-slate-50/30">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-bold text-slate-700">Signal Overview</span>
                <div className="flex gap-2.5">
                  {[{c:'#2563eb',l:'XRD'},{c:'#8b5cf6',l:'XPS'},{c:'#ef4444',l:'FTIR'},{c:'#10b981',l:'Raman'}].map(i=>(
                    <span key={i.l} className="flex items-center gap-1 text-[7px] text-slate-500"><span className="w-2.5 h-[2px] rounded-sm" style={{background:i.c}}/>{i.l}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1 relative min-h-0">
                <svg viewBox="0 0 500 100" className="w-full h-full" preserveAspectRatio="none">
                  <line x1="0" y1="90" x2="500" y2="90" stroke="#e2e8f0" strokeWidth="0.5"/>
                  <line x1="0" y1="65" x2="500" y2="65" stroke="#f1f5f9" strokeWidth="0.3"/>
                  <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="0.3"/>
                  <line x1="0" y1="15" x2="500" y2="15" stroke="#f1f5f9" strokeWidth="0.3"/>
                  <path d="M0,88 L30,88 L35,82 L40,18 L45,88 L100,88 L105,60 L110,88 L170,88 L175,35 L180,88 L280,88 L285,72 L290,88 L380,88 L385,48 L390,88 L460,88 L465,78 L470,88 L500,88" fill="none" stroke="#2563eb" strokeWidth="1" strokeLinejoin="round"/>
                  <path d="M0,86 L50,86 L55,50 L60,86 L200,86 L205,68 L210,86 L350,86 L355,78 L360,86 L500,86" fill="none" stroke="#8b5cf6" strokeWidth="1" strokeLinejoin="round"/>
                  <path d="M0,84 L40,84 L50,72 L60,84 L120,84 L130,40 L140,84 L230,84 L240,58 L250,74 L260,84 L400,84 L410,68 L420,84 L500,84" fill="none" stroke="#ef4444" strokeWidth="1" strokeLinejoin="round"/>
                  <path d="M0,82 L60,82 L65,68 L70,82 L180,82 L185,28 L190,82 L300,82 L305,15 L310,82 L340,82 L345,55 L350,82 L430,82 L435,65 L440,82 L500,82" fill="none" stroke="#10b981" strokeWidth="1" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex justify-between text-[7px] text-slate-400 mt-0.5 px-0.5">
                <span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span><span>70</span><span>80</span>
              </div>
              <div className="text-[7px] text-slate-400 text-center">2θ (°)</div>
            </div>
            {/* Bottom row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-slate-200/80 rounded-lg p-2 bg-gradient-to-b from-white to-slate-50/30">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-bold text-slate-700">Recent Analyses</span>
                  <span className="text-[8px] text-slate-400 cursor-pointer">×</span>
                </div>
                <div className="space-y-1">
                  {[{t:'XRD',name:'LiFePO₄_sample',meta:'2θ 10°–80° · 1h ago',c:'#2563eb'},{t:'XPS',name:'Graphene oxide',meta:'Survey · 3h ago',c:'#8b5cf6'},{t:'FTIR',name:'Polymer film',meta:'400–4000 cm⁻¹ · 1h ago',c:'#ef4444'}].map(a=>(
                    <div key={a.name} className="flex items-center gap-1.5">
                      <span className="text-[7px] font-bold px-1 py-[1px] rounded text-white leading-tight" style={{background:a.c}}>{a.t}</span>
                      <div className="min-w-0">
                        <div className="text-[8px] font-semibold text-slate-800 truncate">{a.name}</div>
                        <div className="text-[7px] text-slate-400 truncate">{a.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-slate-200/80 rounded-lg p-2 bg-gradient-to-b from-white to-slate-50/30">
                <div className="text-[9px] font-bold text-slate-700 mb-1">Notebook Lab</div>
                <div className="text-[8px] text-slate-500 mb-1.5">Continue your experiment</div>
                <div className="border border-slate-100 rounded p-1.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <div className="text-[8px] font-semibold text-slate-800 truncate">Surface analysis workflow</div>
                    <div className="text-[7px] text-slate-400">Updated 1h ago</div>
                  </div>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative py-12 lg:py-16 overflow-hidden">
      {/* Background system */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-white pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.15] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-100/40 via-violet-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left */}
          <div className="pt-2 max-w-[480px]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/50 mb-5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
              </span>
              <span className="text-[11px] font-bold tracking-[0.1em] text-blue-600 uppercase">Scientific Workflow Platform</span>
            </div>
            <h1 className="text-[40px] lg:text-[48px] font-extrabold leading-[1.08] tracking-tight text-slate-900 mb-5">
              From scientific<br/>signal to<br/>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">structured insight.</span>
            </h1>
            <p className="text-[15px] text-slate-500 leading-relaxed mb-7 max-w-[400px]">
              DIFARYX is a next-generation platform for materials characterization, analysis, and lab knowledge organization.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 transition-all duration-200">
                JOIN CLOSED BETA
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button className="inline-flex items-center h-10 px-5 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-200">
                VIEW PLATFORM
              </button>
            </div>
          </div>
          {/* Right */}
          <div>
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
