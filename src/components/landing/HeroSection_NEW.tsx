import React from 'react';
import { Link } from 'react-router-dom';
import {
  createSvgPath,
  generateFtirTrace,
  generateRamanTrace,
  generateXpsTrace,
  generateXrdTrace,
} from '../../data/syntheticTraces';

const signalTraces = [
  {
    label: 'XRD',
    subtitle: 'spinel diffraction',
    color: '#22d3ee',
    axis: '2θ',
    data: generateXrdTrace(180),
  },
  {
    label: 'Raman',
    subtitle: 'A1g mode response',
    color: '#10b981',
    axis: 'cm⁻¹',
    data: generateRamanTrace(180),
  },
  {
    label: 'FTIR',
    subtitle: 'metal-oxygen bands',
    color: '#ef4444',
    axis: 'cm⁻¹',
    data: generateFtirTrace(180),
  },
  {
    label: 'XPS',
    subtitle: 'surface states',
    color: '#8b5cf6',
    axis: 'eV',
    data: generateXpsTrace(180),
  },
];

function SignalTraceCard({ trace }: { trace: (typeof signalTraces)[number] }) {
  return (
    <div className="rounded border border-slate-300 bg-white p-2.5 shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: trace.color }} />
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-700">{trace.label}</span>
        </div>
        <span className="text-[8px] text-slate-500">{trace.subtitle}</span>
      </div>
      <div className="h-24 rounded border border-slate-200 bg-white p-2 relative">
        <svg viewBox="0 0 240 88" className="h-full w-full" preserveAspectRatio="none">
          {/* Grid lines - more like scientific software */}
          <line x1="8" y1="76" x2="232" y2="76" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="8" y1="55" x2="232" y2="55" stroke="#e2e8f0" strokeWidth="0.5" />
          <line x1="8" y1="34" x2="232" y2="34" stroke="#e2e8f0" strokeWidth="0.5" />
          <line x1="8" y1="13" x2="232" y2="13" stroke="#e2e8f0" strokeWidth="0.5" />
          {/* Vertical grid */}
          <line x1="60" y1="8" x2="60" y2="80" stroke="#f1f5f9" strokeWidth="0.5" />
          <line x1="120" y1="8" x2="120" y2="80" stroke="#f1f5f9" strokeWidth="0.5" />
          <line x1="180" y1="8" x2="180" y2="80" stroke="#f1f5f9" strokeWidth="0.5" />
          {/* Spectrum trace */}
          <path
            d={createSvgPath(trace.data, 240, 88, 8)}
            fill="none"
            stroke={trace.color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* Axis labels like scientific software */}
        <div className="absolute bottom-0 left-1 text-[7px] text-slate-500">0</div>
        <div className="absolute bottom-0 right-1 text-[7px] text-slate-500">{trace.axis}</div>
        <div className="absolute top-0 left-0 text-[7px] text-slate-500">Int.</div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="bg-white py-18 lg:py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[55%_45%]">
          {/* Left: Content */}
          <div className="max-w-[640px]">
            <h1 className="mb-6 text-[36px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#0B1220] sm:text-[44px] lg:text-[56px] xl:text-[64px]">
              From experimental signal to evidence-linked interpretation
            </h1>
            <p className="mb-6 max-w-[620px] text-[16px] leading-[30px] text-slate-600 lg:text-[18px]">
              DIFARYX unifies characterization data, executes structured analysis workflows, and turns experimental evidence into traceable scientific interpretation.
            </p>
            <p className="mb-8 max-w-[620px] text-[15px] leading-[28px] text-slate-500">
              Built for cross-technique comparison, controllable preprocessing, reproducible reporting, and autonomous agent execution.
            </p>

            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/demo/agent"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-[15px] font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25"
                >
                  Run Agent Demo
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-[15px] font-bold text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
                >
                  Explore Workflow
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Product Preview - Desktop Software Style */}
          <div className="relative">
            {/* Window shadow and border */}
            <div className="overflow-hidden rounded-lg border-2 border-slate-300 bg-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              {/* Title Bar - Desktop App Style */}
              <div className="flex h-8 items-center justify-between border-b border-slate-300 bg-gradient-to-b from-slate-200 to-slate-100 px-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500 border border-red-600" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500 border border-yellow-600" />
                    <div className="h-3 w-3 rounded-full bg-green-500 border border-green-600" />
                  </div>
                  <span className="ml-2 text-[11px] font-bold text-slate-700">DIFARYX - Multi-Technique Analysis</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded">
                    <span className="text-[10px]">−</span>
                  </div>
                  <div className="h-4 w-4 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded">
                    <span className="text-[10px]">□</span>
                  </div>
                  <div className="h-4 w-4 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded">
                    <span className="text-[10px]">×</span>
                  </div>
                </div>
              </div>

              {/* Menu Bar - Like Desktop Software */}
              <div className="flex h-6 items-center gap-4 border-b border-slate-300 bg-slate-50 px-3 text-[10px] text-slate-700">
                <span className="font-semibold hover:bg-slate-200 px-2 py-0.5 rounded cursor-default">File</span>
                <span className="hover:bg-slate-200 px-2 py-0.5 rounded cursor-default">Edit</span>
                <span className="hover:bg-slate-200 px-2 py-0.5 rounded cursor-default">View</span>
                <span className="hover:bg-slate-200 px-2 py-0.5 rounded cursor-default">Analysis</span>
                <span className="hover:bg-slate-200 px-2 py-0.5 rounded cursor-default">Tools</span>
                <span className="hover:bg-slate-200 px-2 py-0.5 rounded cursor-default">Help</span>
              </div>

              {/* Toolbar - Desktop App Style */}
              <div className="flex h-10 items-center gap-2 border-b border-slate-300 bg-slate-100 px-3">
                <div className="flex items-center gap-1">
                  <div className="h-7 w-7 flex items-center justify-center rounded border border-slate-300 bg-white hover:bg-slate-50 shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  </div>
                  <div className="h-7 w-7 flex items-center justify-center rounded border border-slate-300 bg-white hover:bg-slate-50 shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    </svg>
                  </div>
                  <div className="h-7 w-7 flex items-center justify-center rounded border border-slate-300 bg-white hover:bg-slate-50 shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-300" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[10px] text-slate-600">Project:</span>
                  <span className="text-[10px] font-semibold text-slate-700">CuFe2O4_Analysis</span>
                </div>
                <span className="rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                  Ready
                </span>
              </div>

              {/* Main Content Area - Desktop Software Layout */}
              <div className="bg-slate-50 p-3">
                {/* Info Bar */}
                <div className="mb-3 flex items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 shadow-sm">
                  <div>
                    <div className="text-[11px] font-bold text-slate-700">Multi-Technique Signal Analysis</div>
                    <div className="text-[9px] text-slate-500">4 datasets loaded • Cross-technique correlation active</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600">Review status:</span>
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Supported
                    </span>
                  </div>
                </div>

                {/* 4 Technique Windows Grid - Scientific Software Style */}
                <div className="grid grid-cols-2 gap-3">
                  {signalTraces.map((trace) => (
                    <SignalTraceCard key={trace.label} trace={trace} />
                  ))}
                </div>

                {/* Status Bar - Desktop App Style */}
                <div className="mt-3 flex items-center justify-between rounded border border-slate-300 bg-white px-3 py-1.5 text-[9px] text-slate-600 shadow-sm">
                  <div className="flex items-center gap-4">
                    <span>Status: Interpretation ready</span>
                    <span>•</span>
                    <span>Phase: CuFe₂O₄ inverse spinel</span>
                  </div>
                  <span>Evidence: 24 features extracted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
