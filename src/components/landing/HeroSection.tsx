import React from 'react';
import { Link } from 'react-router-dom';
import {
  createSvgPath,
  generateFtirTrace,
  generateRamanTrace,
  generateXpsTrace,
  generateXrdTrace,
} from '../../data/syntheticTraces';
import { formatChemicalFormula } from '../../utils';

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
          <p className="mt-0.5 text-[7px] text-slate-400">{formatChemicalFormula('CuFe2O4')} evidence stack</p>
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
    <div className="flex h-[440px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#070B12] shadow-[0_20px_60px_rgba(15,23,42,0.3)]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-800 bg-[#0F172A] px-3">
        <div className="flex items-center gap-2">
          <div className="flex h-4 w-4 items-center justify-center rounded bg-slate-700">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold tracking-wide text-slate-200">DIFARYX</span>
        </div>
        <div className="hidden text-[9px] text-slate-400 sm:block">
          <span className="font-medium text-slate-300">Evidence Workspace</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          </svg>
          <div className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[7px] font-bold text-white">DR</div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex w-28 shrink-0 flex-col gap-0.5 border-r border-slate-800 bg-[#0A0F1A] p-1.5">
          {[
            { name: 'Signal Input', active: true },
            { name: 'Evidence' },
            { name: 'Reasoning' },
            { name: 'Decision' },
            { name: 'Notebook' },
            { name: 'History' },
            { name: 'Settings' },
          ].map((item) => (
            <div
              key={item.name}
              className={`flex h-6 cursor-default items-center rounded px-2 text-[9px] font-medium ${
                item.active ? 'bg-indigo-600 text-white' : 'text-slate-500'
              }`}
            >
              {item.name}
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5 overflow-hidden bg-[#070B12] p-3">
          <div className="text-[12px] font-bold text-slate-200">Signal Input</div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Techniques', val: '4' },
              { label: 'Datasets', val: '12' },
              { label: 'Features', val: '89' },
              { label: 'Evidence', val: '24' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-md border border-slate-800 bg-[#0F172A] p-1.5">
                <div className="text-[8px] font-medium text-slate-500">{stat.label}</div>
                <div className="text-[15px] font-bold leading-tight text-slate-200">{stat.val}</div>
              </div>
            ))}
          </div>

          <MultiTechSignalPanel />

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-slate-800 bg-[#0F172A] p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-300">Evidence Extraction</span>
                <span className="text-[8px] text-slate-500">active</span>
              </div>
              <div className="space-y-1">
                {[
                  { technique: 'XRD', name: 'Phase candidates', meta: '9 peaks detected', color: 'bg-blue-600' },
                  { technique: 'XPS', name: 'Surface states', meta: '5 components', color: 'bg-violet-500' },
                  { technique: 'FTIR', name: 'Bonding modes', meta: '6 bands', color: 'bg-red-500' },
                ].map((analysis) => (
                  <div key={analysis.name} className="flex items-center gap-1.5">
                    <span className={`rounded px-1 py-[1px] text-[7px] font-bold leading-tight text-white ${analysis.color}`}>
                      {analysis.technique}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[8px] font-semibold text-slate-300">{analysis.name}</div>
                      <div className="truncate text-[7px] text-slate-500">{analysis.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-slate-800 bg-[#0F172A] p-2">
              <div className="mb-1 text-[9px] font-bold text-slate-300">Reasoning Trace</div>
              <div className="mb-1.5 text-[8px] text-slate-500">Decision workflow</div>
              <div className="flex items-center justify-between rounded border border-slate-700 bg-[#070B12] p-1.5">
                <div className="min-w-0">
                  <div className="truncate text-[8px] font-semibold text-slate-300">Evidence → Decision</div>
                  <div className="text-[7px] text-slate-500">Traceable reasoning</div>
                </div>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" aria-hidden="true">
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
    <section className="bg-white py-18 lg:py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[52%_48%]">
          <div className="max-w-[620px]">
            <h1 className="mb-6 text-[36px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#0B1220] sm:text-[44px] lg:text-[56px] xl:text-[64px]">
              From Fragmented Workflows to Unified Scientific Decisions
            </h1>
            <p className="mb-8 max-w-[620px] text-[16px] leading-[30px] text-slate-600 lg:text-[18px]">
              DIFARYX integrates multi-technique data, eliminates manual workflows, and enables controllable, reproducible scientific analysis.
            </p>

            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-[15px] font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25"
                >
                  Explore Workflow
                </Link>
                <Link
                  to="/demo/agent"
                  aria-label="Run Agent Demo"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-[15px] font-bold text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
                >
                  Run Agent Demo
                </Link>
              </div>
              <p className="mt-3.5 text-[13px] leading-[20px] text-slate-500">
                Derived from multi-source research across scientific workflows
              </p>
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
