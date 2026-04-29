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
    color: '#2563eb',
    axis: '2theta',
    data: generateXrdTrace(180),
  },
  {
    label: 'Raman',
    subtitle: 'A1g mode response',
    color: '#10b981',
    axis: 'cm-1',
    data: generateRamanTrace(180),
  },
  {
    label: 'FTIR',
    subtitle: 'metal-oxygen bands',
    color: '#ef4444',
    axis: 'cm-1',
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
    <div className="rounded-md border border-slate-200 bg-white p-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[8px] font-bold uppercase tracking-wider text-slate-800">{trace.label}</div>
          <div className="truncate text-[7px] text-slate-400">{trace.subtitle}</div>
        </div>
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: trace.color }} />
      </div>
      <svg viewBox="0 0 240 88" className="h-[58px] w-full" preserveAspectRatio="none" aria-hidden="true">
        <line x1="8" y1="76" x2="232" y2="76" stroke="#e2e8f0" strokeWidth="0.8" />
        <line x1="8" y1="55" x2="232" y2="55" stroke="#f1f5f9" strokeWidth="0.7" />
        <line x1="8" y1="34" x2="232" y2="34" stroke="#f1f5f9" strokeWidth="0.7" />
        <line x1="8" y1="13" x2="232" y2="13" stroke="#f1f5f9" strokeWidth="0.7" />
        <path
          d={createSvgPath(trace.data, 240, 88, 8)}
          fill="none"
          stroke={trace.color}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-[7px] text-slate-400">
        <span>signal</span>
        <span>{trace.axis}</span>
      </div>
    </div>
  );
}

function MultiTechSignalPanel() {
  return (
    <div className="flex-1 rounded-md border border-slate-200 bg-slate-50/70 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <span className="text-[9px] font-bold text-slate-700">Multi-tech scientific signals</span>
          <p className="mt-0.5 text-[7px] text-slate-400">CuFe2O4 evidence stack</p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[7px] font-bold text-emerald-700">
          93.3% match
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {signalTraces.map((trace) => (
          <SignalTraceCard key={trace.label} trace={trace} />
        ))}
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="flex h-[440px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-3">
        <div className="flex items-center gap-2">
          <div className="flex h-4 w-4 items-center justify-center rounded bg-slate-200">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold tracking-wide text-slate-800">DIFARYX</span>
        </div>
        <div className="hidden text-[9px] text-slate-500 sm:block">
          Project / <span className="font-medium text-slate-700">CuFe2O4 Characterization</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          </svg>
          <div className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[7px] font-bold text-white">DR</div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex w-28 shrink-0 flex-col gap-0.5 border-r border-slate-200 bg-slate-50/50 p-1.5">
          {[
            { name: 'Overview', active: true },
            { name: 'XRD' },
            { name: 'Multi-Tech' },
            { name: 'Notebook Lab' },
            { name: 'Agent Mode' },
            { name: 'History' },
            { name: 'Settings' },
          ].map((item) => (
            <div
              key={item.name}
              className={`flex h-6 cursor-default items-center rounded px-2 text-[9px] font-medium ${
                item.active ? 'bg-blue-600 text-white' : 'text-slate-500'
              }`}
            >
              {item.name}
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5 overflow-hidden bg-white p-3">
          <div className="text-[12px] font-bold text-slate-900">Overview</div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Projects', val: '24' },
              { label: 'Datasets', val: '156' },
              { label: 'Analyses', val: '342' },
              { label: 'Reports', val: '27' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-md border border-slate-200 p-1.5">
                <div className="text-[8px] font-medium text-slate-400">{stat.label}</div>
                <div className="text-[15px] font-bold leading-tight text-slate-900">{stat.val}</div>
              </div>
            ))}
          </div>

          <MultiTechSignalPanel />

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-slate-200 p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-700">Recent Analyses</span>
                <span className="text-[8px] text-slate-400">view</span>
              </div>
              <div className="space-y-1">
                {[
                  { technique: 'XRD', name: 'CuFe2O4_spinel', meta: '2theta 10-80 deg - 1h ago', color: 'bg-blue-600' },
                  { technique: 'XPS', name: 'CuFe2O4/SBA-15', meta: 'Survey - 3h ago', color: 'bg-violet-500' },
                  { technique: 'FTIR', name: 'SBA-15 bonding', meta: '400-4000 cm-1 - 1h ago', color: 'bg-red-500' },
                ].map((analysis) => (
                  <div key={analysis.name} className="flex items-center gap-1.5">
                    <span className={`rounded px-1 py-[1px] text-[7px] font-bold leading-tight text-white ${analysis.color}`}>
                      {analysis.technique}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[8px] font-semibold text-slate-800">{analysis.name}</div>
                      <div className="truncate text-[7px] text-slate-400">{analysis.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 p-2">
              <div className="mb-1 text-[9px] font-bold text-slate-700">Notebook Lab</div>
              <div className="mb-1.5 text-[8px] text-slate-500">Continue your experiment</div>
              <div className="flex items-center justify-between rounded border border-slate-100 p-1.5">
                <div className="min-w-0">
                  <div className="truncate text-[8px] font-semibold text-slate-800">Surface analysis workflow</div>
                  <div className="text-[7px] text-slate-400">Updated 1h ago</div>
                </div>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
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
    <section className="bg-white py-12 lg:py-16">
      <div className="mx-auto max-w-[1280px] px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <div className="max-w-[480px] pt-2">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600">Scientific Workflow Platform</p>
            <h1 className="mb-5 text-[40px] font-extrabold leading-[1.1] tracking-tight text-slate-900 lg:text-[48px]">
              From scientific
              <br />
              signal to
              <br />
              <span className="text-blue-600">structured insight.</span>
            </h1>
            <div className="mb-8 max-w-[420px]">
              <p className="mb-3 text-[15px] leading-relaxed text-slate-500">
                DIFARYX is a next-generation platform for materials characterization, analysis, and lab knowledge organization.
              </p>
              <p className="text-[15px] font-medium leading-relaxed text-slate-600">
                Watch how DIFARYX agents analyze data and make decisions in real-time.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[14px] font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/25"
                >
                  Enter DIFARYX
                </Link>
                <Link
                  to="/demo/agent?project=cu-fe2o4-spinel"
                  aria-label="Run Agent Demo"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-cyan-400/70 bg-[#070B12] px-6 text-[14px] font-bold text-cyan-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-200 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <span className="text-[14px]">Run Agent Demo</span>
                </Link>
              </div>
              <div className="mt-1 flex items-center gap-2 pl-1 text-[12px] text-slate-500">
                <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live system
                </span>
                <span className="text-slate-300">|</span>
                <span>See DIFARYX agent reasoning in action</span>
              </div>
            </div>
          </div>
          <div>
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
