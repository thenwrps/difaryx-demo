import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Waves, Beaker, Fingerprint,
  ArrowRight, CheckCircle2, FileText, Database,
  Network, Cpu, ShieldCheck, Microscope,
  LineChart, Workflow, Layers, Search, BarChart3,
  Share2
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <img src="/logo/difaryx.png" alt="DIFARYX" className="h-8 object-contain" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#platform" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Platform</a>
              <a href="#intelligence" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Intelligence</a>
              <a href="#techniques" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Techniques</a>
              <a href="#roadmap" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Roadmap</a>
              <a href="#company" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Company</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden md:inline-flex items-center justify-center h-9 px-5 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              Join Closed Beta
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column: Messaging */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-blue-600 mb-8 uppercase tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                Scientific Workflow Platform
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
                From scientific signal to <span className="text-blue-600">structured insight.</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-10">
                DIFARYX is a next-generation platform for materials characterization, analysis, and lab knowledge organization.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                  Join Closed Beta
                </button>
                <button className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-white border border-slate-200 text-slate-700 text-base font-semibold hover:bg-slate-50 transition-colors">
                  View Platform <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Platform UI Mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-50 rounded-[2rem] transform -rotate-3 -z-10" />
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[520px]">
                {/* App Header */}
                <div className="h-14 border-b border-slate-200 flex items-center px-4 justify-between bg-slate-50">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project: Solid State Synthesis</span>
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">JD</div>
                  </div>
                </div>
                {/* App Body */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Sidebar */}
                  <div className="w-48 border-r border-slate-200 bg-slate-50 p-4 flex flex-col gap-2 shrink-0">
                    <div className="h-8 bg-blue-100 rounded text-blue-700 text-xs font-semibold flex items-center px-3">Overview</div>
                    <div className="h-8 hover:bg-slate-200 rounded text-slate-600 text-xs font-medium flex items-center px-3 cursor-pointer">Analyses</div>
                    <div className="h-8 hover:bg-slate-200 rounded text-slate-600 text-xs font-medium flex items-center px-3 cursor-pointer">Notebook</div>
                    <div className="h-8 hover:bg-slate-200 rounded text-slate-600 text-xs font-medium flex items-center px-3 cursor-pointer">Reports</div>
                  </div>
                  {/* Main Canvas */}
                  <div className="flex-1 p-6 flex flex-col gap-6 bg-white overflow-hidden">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">CuFe2O4 Characterization</h3>
                        <p className="text-xs text-slate-500">Last updated 2 hours ago</p>
                      </div>
                      <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold border border-emerald-100">
                        Phase Verified
                      </div>
                    </div>
                    {/* Data Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 rounded border border-slate-200 bg-slate-50">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Crystallinity</div>
                        <div className="text-xl font-bold text-slate-900">84.2%</div>
                      </div>
                      <div className="p-3 rounded border border-slate-200 bg-slate-50">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Phase Match</div>
                        <div className="text-xl font-bold text-slate-900">99.1%</div>
                      </div>
                      <div className="p-3 rounded border border-slate-200 bg-slate-50">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Data Quality</div>
                        <div className="text-xl font-bold text-blue-600">Optimal</div>
                      </div>
                    </div>
                    {/* Chart Area */}
                    <div className="flex-1 border border-slate-200 rounded-lg p-4 flex flex-col relative">
                      <div className="text-xs font-semibold text-slate-700 mb-2">XRD Diffraction Pattern (Cu Kα)</div>
                      <div className="flex-1 relative mt-2">
                        <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
                          <line x1="0" y1="110" x2="400" y2="110" stroke="#e2e8f0" strokeWidth="1"/>
                          <path d="M0,110 L20,110 L25,100 L30,20 L35,110 L80,110 L85,80 L90,110 L120,110 L125,40 L130,110 L200,110 L205,90 L210,110 L280,110 L285,50 L290,110 L360,110 L365,85 L370,110 L400,110" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round"/>
                          {/* Simulated Peak Labels */}
                          <text x="30" y="15" fontSize="8" fill="#64748b" textAnchor="middle">111</text>
                          <text x="125" y="35" fontSize="8" fill="#64748b" textAnchor="middle">200</text>
                          <text x="285" y="45" fontSize="8" fill="#64748b" textAnchor="middle">220</text>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Layer Section (NEW) */}
      <section id="intelligence" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-3xl">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">How DIFARYX Interprets Scientific Data</h2>
            <p className="text-lg text-slate-600">
              DIFARYX is not a visualization playground. It is a reasoning system designed to transform raw experimental inputs into validated scientific knowledge through an intelligent pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">1</div>
              <Database className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Input</h3>
              <p className="text-sm text-slate-600">
                Direct ingestion of raw instrument formats (BRML, VGD, RAW). Automated baseline correction and signal-to-noise optimization.
              </p>
            </div>
            {/* Step 2 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">2</div>
              <Search className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Interpretation</h3>
              <p className="text-sm text-slate-600">
                Intelligent peak detection, curve fitting, and high-confidence matching against integrated crystallographic and spectroscopic libraries.
              </p>
            </div>
            {/* Step 3 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">3</div>
              <ShieldCheck className="w-8 h-8 text-emerald-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Validation</h3>
              <p className="text-sm text-slate-600">
                Automated inconsistency detection. The system flags missing expected peaks, anomalous peak shifts, or improbable phase combinations.
              </p>
            </div>
            {/* Step 4 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">4</div>
              <Activity className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Recommendation</h3>
              <p className="text-sm text-slate-600">
                Synthesis of findings into structured reports, accompanied by actionable suggestions for subsequent characterization steps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Scientific data is everywhere.<br/>The workflow is still fragmented.</h2>
            <p className="text-lg text-slate-600">
              Modern research operates on cutting-edge instruments, but relies on disconnected software and manual copy-pasting to extract meaning.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl border border-slate-200 bg-slate-50">
              <FileText className="w-8 h-8 text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Siloed Formats</h3>
              <p className="text-slate-600">Instrument software locks raw experimental signals in proprietary files, requiring tedious manual conversions before cross-analysis is possible.</p>
            </div>
            <div className="p-8 rounded-xl border border-slate-200 bg-slate-50">
              <Layers className="w-8 h-8 text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Disconnected Tools</h3>
              <p className="text-slate-600">Comparing XPS surface chemistry to XRD bulk structure requires juggling multiple desktop applications and manually aligning disparate plots.</p>
            </div>
            <div className="p-8 rounded-xl border border-slate-200 bg-slate-50">
              <Network className="w-8 h-8 text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Lost Context</h3>
              <p className="text-slate-600">Crucial context remains in handwritten lab notebooks while data files sit forgotten on generic cloud drives, making reproducibility nearly impossible.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="platform" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">DIFARYX combines everything into one scientific workflow platform.</h2>
              <p className="text-lg text-slate-300 mb-8">
                We bridge the gap between rigorous analysis and contextual documentation, ensuring that every experimental signal is structurally linked to a scientific conclusion.
              </p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shrink-0"><LineChart size={20}/></div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Characterization Analysis</h4>
                    <p className="text-sm text-slate-400">Native processing for major instrument formats.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shrink-0"><FileText size={20}/></div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Notebook Lab</h4>
                    <p className="text-sm text-slate-400">Electronic notebook tied directly to underlying raw data.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shrink-0"><Workflow size={20}/></div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Project Workflow</h4>
                    <p className="text-sm text-slate-400">Organized experimental campaigns and synthesis tracking.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shrink-0"><Share2 size={20}/></div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Exportable Insight</h4>
                    <p className="text-sm text-slate-400">Publication-ready charts and reproducible compliance reports.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              {/* Abstract Platform Representation */}
              <div className="aspect-square w-full max-w-md mx-auto relative">
                <div className="absolute inset-0 border border-slate-700 rounded-full animate-[spin_60s_linear_infinite]" />
                <div className="absolute inset-4 border border-slate-700 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 shadow-2xl relative z-10">
                    <img src="/logo/difaryx.png" alt="DIFARYX Core" className="h-12 object-contain brightness-0 invert opacity-90" />
                  </div>
                </div>
                {/* Orbital nodes */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 w-4 h-4 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <div className="absolute bottom-4 right-8 bg-indigo-500 w-3 h-3 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Techniques Section */}
      <section id="techniques" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">A Unified Multi-Modal System</h2>
            <p className="text-lg text-slate-600 max-w-2xl">
              DIFARYX does not treat techniques as isolated tools. It treats them as complementary modalities integrated into a single characterization platform.
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Core Techniques Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* XRD */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">XRD</h3>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">Core Modality</span>
                </div>
                <div className="h-16 mb-4 opacity-70">
                  <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="45" x2="200" y2="45" stroke="#cbd5e1" strokeWidth="1"/>
                    <path d="M0,45 L20,45 L25,40 L30,5 L35,45 L80,45 L85,30 L90,45 L140,45 L145,20 L150,45 L200,45" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-600">Crystal structure, phase identification, and crystallinity.</p>
              </div>
              {/* XPS */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">XPS</h3>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">Core Modality</span>
                </div>
                <div className="h-16 mb-4 opacity-70">
                  <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="45" x2="200" y2="45" stroke="#cbd5e1" strokeWidth="1"/>
                    <path d="M0,45 L40,45 L45,10 L50,45 L120,45 L125,25 L130,45 L200,45" fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-600">Surface chemistry and elemental composition.</p>
              </div>
              {/* FTIR */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">FTIR</h3>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">Core Modality</span>
                </div>
                <div className="h-16 mb-4 opacity-70">
                  <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="5" x2="200" y2="5" stroke="#cbd5e1" strokeWidth="1"/>
                    <path d="M0,5 L30,5 L40,20 L50,5 L100,5 L110,40 L120,5 L200,5" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-600">Molecular bonds and functional group analysis.</p>
              </div>
              {/* Raman */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Raman</h3>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">Core Modality</span>
                </div>
                <div className="h-16 mb-4 opacity-70">
                  <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="45" x2="200" y2="45" stroke="#cbd5e1" strokeWidth="1"/>
                    <path d="M0,45 L30,45 L35,30 L40,45 L150,45 L155,15 L160,45 L200,45" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-600">Vibrational modes and structural fingerprinting.</p>
              </div>
            </div>

            {/* Coming Soon List */}
            <div className="w-full lg:w-72 bg-white rounded-xl border border-slate-200 p-6 flex flex-col">
              <h3 className="font-bold text-slate-900 text-lg mb-6">Coming Soon</h3>
              <ul className="space-y-4 flex-1">
                <li className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="font-semibold text-slate-700">SEM / TEM</span>
                  <span className="text-xs text-slate-400">Imaging</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="font-semibold text-slate-700">XRF / XAS</span>
                  <span className="text-xs text-slate-400">Elemental</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="font-semibold text-slate-700">MS / GC</span>
                  <span className="text-xs text-slate-400">Mass Spec</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">ICP-OES</span>
                  <span className="text-xs text-slate-400">Optical</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The Scientific Reasoning Cycle</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              DIFARYX maps directly to the real scientific method, replacing tedious data manipulation with a high-velocity reasoning loop.
            </p>
          </div>
          
          <div className="relative flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="hidden md:block absolute top-6 left-12 right-12 h-0.5 bg-slate-200 -z-10" />
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-12 h-12 bg-slate-100 border-2 border-slate-200 rounded-full flex items-center justify-center mb-4 z-10 text-slate-500 font-bold">1</div>
              <h4 className="font-bold text-slate-900 mb-2">Observe</h4>
              <p className="text-sm text-slate-600">Ingest raw instrument signals and view standardized data instantly.</p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-12 h-12 bg-slate-100 border-2 border-slate-200 rounded-full flex items-center justify-center mb-4 z-10 text-slate-500 font-bold">2</div>
              <h4 className="font-bold text-slate-900 mb-2">Interpret</h4>
              <p className="text-sm text-slate-600">Apply algorithms to extract peaks, phases, and core metrics.</p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-12 h-12 bg-blue-600 border-2 border-blue-600 rounded-full flex items-center justify-center mb-4 z-10 text-white font-bold shadow-lg shadow-blue-600/30">3</div>
              <h4 className="font-bold text-slate-900 mb-2">Validate</h4>
              <p className="text-sm text-slate-600">Cross-reference with databases and detect inconsistencies.</p>
            </div>
            {/* Step 4 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-12 h-12 bg-slate-100 border-2 border-slate-200 rounded-full flex items-center justify-center mb-4 z-10 text-slate-500 font-bold">4</div>
              <h4 className="font-bold text-slate-900 mb-2">Decide</h4>
              <p className="text-sm text-slate-600">Document conclusions in the Notebook Lab tied to the data.</p>
            </div>
            {/* Step 5 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-12 h-12 bg-slate-100 border-2 border-slate-200 rounded-full flex items-center justify-center mb-4 z-10 text-slate-500 font-bold">5</div>
              <h4 className="font-bold text-slate-900 mb-2">Iterate</h4>
              <p className="text-sm text-slate-600">Plan the next experiment based on structured historical context.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Roadmap */}
      <section id="roadmap" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Strategic Roadmap</h2>
            <p className="text-lg text-slate-600 max-w-2xl">
              We are building the foundation for autonomous scientific discovery.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Phase 1 */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-blue-600" />
              <div className="text-sm font-bold tracking-wide text-blue-600 uppercase mb-2">Phase 1 (Current)</div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Core Platform</h3>
              <p className="text-slate-600 text-sm">
                Establishing the base infrastructure. Multi-modal characterization workspaces, proprietary file format parsing, and integrated electronic notebook documentation.
              </p>
            </div>
            {/* Phase 2 */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-sm font-bold tracking-wide text-slate-400 uppercase mb-2">Phase 2</div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Expand & Integrate</h3>
              <p className="text-slate-600 text-sm">
                Scaling to support imaging modalities (SEM/TEM). Rolling out secure APIs for direct integration with enterprise LIMS and institutional data lakes.
              </p>
            </div>
            {/* Phase 3 */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-sm font-bold tracking-wide text-slate-400 uppercase mb-2">Phase 3</div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Collaborate & Scale</h3>
              <p className="text-slate-600 text-sm">
                Enterprise deployment capabilities. Real-time multi-user collaboration environments and institutional knowledge graphing across entire R&D departments.
              </p>
            </div>
            {/* Phase 4 */}
            <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-lg text-white">
              <div className="text-sm font-bold tracking-wide text-blue-400 uppercase mb-2">Phase 4</div>
              <h3 className="text-xl font-bold text-white mb-4">Intelligent Science Platform</h3>
              <p className="text-slate-300 text-sm">
                Deployment of autonomous scientific agents capable of executing routine analytical tasks, suggesting novel synthetic routes, and proactively identifying anomalies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-blue-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">Built for researchers who want less tool switching and more scientific clarity.</h2>
          <button className="inline-flex items-center justify-center h-14 px-10 rounded-md bg-white text-blue-900 text-lg font-bold hover:bg-slate-50 transition-colors shadow-lg mt-8">
            Join Closed Beta
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-50 border-t border-slate-200 text-slate-600">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 border-b border-slate-200 pb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="bg-white inline-flex px-3 py-1.5 rounded-lg border border-slate-200 mb-6">
              <img src="/logo/difaryx.png" alt="DIFARYX" className="h-8 object-contain" />
            </div>
            <p className="text-sm max-w-sm">
              Scientific workflow platform transforming raw experimental signals into structured, reproducible scientific insight.
            </p>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Characterization</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Notebook Lab</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><a href="#" className="hover:text-blue-600 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Investor Relations</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs font-medium">
          <p>© 2026 DIFARYX Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
