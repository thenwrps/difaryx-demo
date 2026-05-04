import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Graph } from '../components/ui/Graph';
import { ParameterDrawer } from '../components/workspace/ParameterDrawer';
import { ftirDemoData, FTIR_DEMO_DATASETS, getFtirDemoDataset } from '../data/ftirDemoData';
import { runFtirProcessing } from '../agents/ftirAgent/runner';

export default function FTIRWorkspace() {
  const [activeTab, setActiveTab] = useState<'spectrum' | 'bandList' | 'functionalGroups'>('spectrum');
  const [selectedDatasetId, setSelectedDatasetId] = useState(ftirDemoData.id);
  
  // Parameter state management
  const [autoMode, setAutoMode] = useState(true);
  
  // Drawer state management
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  
  // Get selected dataset
  const selectedDataset = getFtirDemoDataset(selectedDatasetId);
  
  // Run FTIR processing with current parameters
  const processingResult = useMemo(() => {
    return runFtirProcessing(selectedDataset);
  }, [selectedDataset, autoMode]);
  
  // Convert processed FTIR data to graph format (x, y points)
  const graphData = processingResult.signal.wavenumber.map((wn, i) => ({
    x: wn,
    y: processingResult.signal.absorbance[i],
  }));
  
  // Convert baseline to graph format
  const baselineData = processingResult.signal.wavenumber.map((wn, i) => ({
    x: wn,
    y: processingResult.baseline[i],
  }));
  
  // Convert bands to graph markers
  const bandMarkers = processingResult.bands.map(band => ({
    position: band.wavenumber,
    intensity: band.intensity,
    label: band.assignment || '',
  }));
  
  // Calculate summary statistics from processed results
  const totalBands = processingResult.bands.length;
  const matchedBands = processingResult.matches.length;
  const confidencePercent = processingResult.interpretation.confidenceScore.toFixed(1);
  const confidenceBadge = processingResult.interpretation.confidenceLevel;
  
  // Handle Auto Mode toggle
  const handleAutoModeChange = (enabled: boolean) => {
    setAutoMode(enabled);
    if (enabled) {
      setDrawerOpen(false);
    }
  };
  
  // Handle opening drawer for a specific step
  const handleOpenDrawer = (stepId: string) => {
    setActiveStep(stepId);
    setDrawerOpen(true);
  };
  
  // Handle closing drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };
  
  // Handle applying parameter changes
  const handleApplyParameters = () => {
    setDrawerOpen(false);
  };
  
  // Handle resetting parameters to defaults
  const handleResetParameters = () => {
    // TODO: Reset parameters
  };
  
  // Handle parameter changes
  const handleParameterChange = (paramId: string, value: any) => {
    // TODO: Handle parameter changes
  };
  
  // Processing status for FTIR steps
  const processingStatus = [
    {
      id: 'baselineCorrection',
      label: 'Baseline Correction',
      status: 'complete' as const,
      summary: autoMode ? 'Polynomial (order=3)' : 'Polynomial (order=3)'
    },
    {
      id: 'smoothing',
      label: 'Smoothing',
      status: 'complete' as const,
      summary: autoMode ? 'Savitzky-Golay (window=9)' : 'Savitzky-Golay (window=9)'
    },
    {
      id: 'bandDetection',
      label: 'Band Detection',
      status: 'complete' as const,
      summary: autoMode ? `${totalBands} bands detected` : `${totalBands} bands detected`
    },
    {
      id: 'bandAssignment',
      label: 'Band Assignment',
      status: 'complete' as const,
      summary: autoMode ? `${matchedBands}/${totalBands} matched` : `${matchedBands}/${totalBands} matched`
    },
    {
      id: 'functionalGroupMatching',
      label: 'Functional Group Matching',
      status: 'complete' as const,
      summary: autoMode ? 'Evidence aggregation' : 'Evidence aggregation'
    },
    {
      id: 'interpretationSummary',
      label: 'Interpretation Summary',
      status: 'complete' as const,
      summary: autoMode ? 'Scientific summary' : 'Scientific summary'
    }
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 h-full flex overflow-hidden bg-background">
        {/* LEFT SIDEBAR */}
        <aside className="w-72 border-r border-border bg-surface flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              FTIR Project
            </label>
            <select
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-text-main focus:outline-none focus:border-primary"
            >
              <option>Demo Project</option>
            </select>
            <p className="mt-2 text-[10px] text-text-muted">Metal oxide catalyst</p>
          </div>

          <div className="p-4 border-b border-border">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Dataset
            </label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-text-main focus:outline-none focus:border-primary"
            >
              {FTIR_DEMO_DATASETS.map(dataset => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.label}
                </option>
              ))}
            </select>
            
            <div className="mt-3 flex items-center gap-2 text-[10px] text-text-muted">
              <Database size={14} className="shrink-0" />
              <span className="truncate">{selectedDataset.fileName}</span>
            </div>
          </div>

          {/* Processing Pipeline */}
          <div className="flex-1 min-h-0 border-b border-border overflow-y-auto">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Processing</h3>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-3 h-3" 
                    checked={autoMode}
                    onChange={(e) => handleAutoModeChange(e.target.checked)}
                  />
                  <span className="text-[9px] text-text-muted">Auto</span>
                </label>
              </div>
              <div className="space-y-1.5">
                {processingStatus.map((step, index) => (
                  <div key={step.id} className="border border-emerald-500/30 bg-emerald-500/10 rounded px-2 py-1.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[8px] font-bold shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-[10px] font-medium text-emerald-700 flex-1">{step.label}</span>
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                    </div>
                    <div className="flex items-center justify-between ml-6">
                      <p className="text-[9px] text-emerald-700/70">{step.summary}</p>
                      {!autoMode && (
                        <button 
                          onClick={() => handleOpenDrawer(step.id)}
                          className="text-[9px] font-semibold text-emerald-700 hover:text-emerald-800 px-1.5 py-0.5 rounded hover:bg-emerald-500/20 transition-colors"
                        >
                          Params
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border space-y-2">
            <Link
              to="/notebook"
              className="flex h-9 items-center justify-between rounded-md border border-border px-3 text-sm font-medium text-text-main hover:bg-surface-hover transition-colors"
            >
              Open Notebook <ArrowRight size={14} />
            </Link>
            <Link
              to="/demo/agent"
              className="flex h-9 items-center justify-between rounded-md bg-primary text-white px-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Run Agent <ArrowRight size={14} />
            </Link>
          </div>
        </aside>

        {/* CENTER COLUMN */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-border">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {/* FTIR SPECTRUM - GRAPH FIRST */}
              <div className="border border-border/50 bg-surface/30">
                {/* Tabs */}
                <div className="flex items-center gap-4 px-3 py-1.5 border-b border-border/50 bg-surface/40">
                  <button 
                    onClick={() => setActiveTab('spectrum')}
                    className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                      activeTab === 'spectrum' 
                        ? 'text-primary border-b-2 border-primary -mb-px' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    Spectrum
                  </button>
                  <button 
                    onClick={() => setActiveTab('bandList')}
                    className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                      activeTab === 'bandList' 
                        ? 'text-primary border-b-2 border-primary -mb-px' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    Band List
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary/10 text-primary text-[9px] font-bold px-1">
                      {totalBands}
                    </span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('functionalGroups')}
                    className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                      activeTab === 'functionalGroups' 
                        ? 'text-primary border-b-2 border-primary -mb-px' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    Functional Groups
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary/10 text-primary text-[9px] font-bold px-1">
                      {matchedBands}/{totalBands}
                    </span>
                  </button>
                </div>
                
                {/* Tab Content */}
                {activeTab === 'spectrum' && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-surface/20">
                      <div>
                        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-main">FTIR Spectrum</h3>
                        <p className="text-[9px] text-text-muted mt-0.5">Absorbance vs. Wavenumber with baseline correction</p>
                      </div>
                      <span className="text-[9px] font-mono text-text-muted tabular-nums">Mid-IR (400-4000 cm⁻¹)</span>
                    </div>
                    
                    {/* Graph */}
                    <div className="h-[420px] w-full min-w-0 px-2 py-2">
                      <Graph
                        type="ftir"
                        height="100%"
                        externalData={graphData}
                        baselineData={baselineData}
                        peakMarkers={bandMarkers}
                        showBackground
                        showCalculated={false}
                        showResidual={false}
                      />
                    </div>
                    
                    <div className="mx-3 mb-2 flex items-center gap-2 text-[10px] text-text-muted bg-surface/40 rounded px-2 py-1.5 border border-border/50">
                      <CheckCircle2 size={12} className="text-primary shrink-0" />
                      <span>{totalBands} bands detected and assigned to functional groups.</span>
                    </div>
                  </>
                )}
                
                {activeTab === 'bandList' && (
                  <div className="p-3 space-y-3">
                    {/* Detected Bands Table */}
                    <div className="border border-border/40 bg-surface/50 rounded">
                      <div className="px-3 py-2 border-b border-border/30 bg-surface/20">
                        <h3 className="text-sm font-semibold text-text-main">Detected Bands ({totalBands})</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Band positions, FWHM, and functional group assignments</p>
                      </div>
                      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="text-[10px] uppercase tracking-wide text-text-muted bg-surface/10 sticky top-0">
                            <tr>
                              <th className="text-center px-3 py-2 font-medium">#</th>
                              <th className="text-right px-3 py-2 font-medium">Wavenumber <span className="text-[8px]">(cm⁻¹)</span></th>
                              <th className="text-right px-3 py-2 font-medium">Intensity</th>
                              <th className="text-right px-3 py-2 font-medium">FWHM <span className="text-[8px]">(cm⁻¹)</span></th>
                              <th className="text-right px-3 py-2 font-medium">Area</th>
                              <th className="text-left px-3 py-2 font-medium">Assignment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processingResult.bands.map((band, index) => (
                              <tr key={band.id} className="border-t border-border/20 hover:bg-surface/10">
                                <td className="px-3 py-2 text-center text-text-muted text-sm tabular-nums">{index + 1}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{band.wavenumber.toFixed(0)}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{band.intensity.toFixed(2)}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{band.fwhm.toFixed(0)}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{band.area.toFixed(1)}</td>
                                <td className="px-3 py-2 font-mono text-left text-primary text-sm font-medium">{band.assignment || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Quality Metrics */}
                    <div className="border border-border/40 bg-surface/50 rounded">
                      <div className="px-3 py-2 border-b border-border/30 bg-surface/20">
                        <h3 className="text-sm font-semibold text-text-main">Quality Metrics</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Data quality and processing statistics</p>
                      </div>
                      <div className="px-3 py-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">BANDS</span>
                            <span className="text-lg font-semibold text-text-main tabular-nums block">{totalBands}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">MATCHED</span>
                            <span className="text-lg font-semibold text-text-main tabular-nums block">{matchedBands}/{totalBands}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">UNASSIGNED</span>
                            <span className={`text-lg font-semibold tabular-nums block ${totalBands - matchedBands > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{totalBands - matchedBands}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">SNR</span>
                            <span className="text-lg font-semibold text-emerald-600 tabular-nums block">28.5 dB</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">DATA POINTS</span>
                            <span className="text-lg font-semibold text-text-main tabular-nums block">{processingResult.signal.wavenumber.length}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">CONFIDENCE</span>
                            <span className="text-lg font-semibold text-emerald-600 tabular-nums block">{confidencePercent}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'functionalGroups' && (
                  <div className="p-3">
                    <div className="border border-border/40 bg-surface/50 rounded">
                      <div className="px-3 py-2 border-b border-border/30 bg-surface/20">
                        <h3 className="text-sm font-semibold text-text-main">Functional Group Matching ({processingResult.functionalGroupCandidates.length})</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Comparison with reference wavenumber ranges</p>
                      </div>
                      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="text-[10px] uppercase tracking-wide text-text-muted bg-surface/10 sticky top-0">
                            <tr>
                              <th className="text-left px-3 py-2 font-medium">Functional Group</th>
                              <th className="text-left px-3 py-2 font-medium">Assignment</th>
                              <th className="text-right px-3 py-2 font-medium">Wavenumber <span className="text-[8px]">(cm⁻¹)</span></th>
                              <th className="text-right px-3 py-2 font-medium">Conf.</th>
                              <th className="text-left px-3 py-2 font-medium">Ambiguity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processingResult.functionalGroupCandidates.map((candidate, index) => (
                              <tr key={index} className="border-t border-border/20 hover:bg-surface/10">
                                <td className="px-3 py-2 font-mono text-left text-primary text-sm font-medium">{candidate.functionalGroup}</td>
                                <td className="px-3 py-2 text-left text-text-main text-sm">{candidate.assignment}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">
                                  {candidate.matches[0]?.observedBand.wavenumber.toFixed(0) || '-'}
                                </td>
                                <td className="px-3 py-2 font-mono text-right text-emerald-600 text-sm font-medium tabular-nums">
                                  {(candidate.score * 100).toFixed(0)}%
                                </td>
                                <td className="px-3 py-2 text-left text-amber-600 text-sm">
                                  {candidate.ambiguity || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[380px] bg-surface border-r border-border flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 space-y-2">
            {/* SCIENTIFIC SUMMARY */}
            <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-[10px] font-semibold uppercase tracking-wide">Scientific Summary</h3>
                <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase ${
                  confidenceBadge === 'high' 
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                    : confidenceBadge === 'medium'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-700'
                    : 'border-red-500/30 bg-red-500/10 text-red-700'
                }`}>
                  {confidenceBadge}
                </span>
              </div>

              <div className="space-y-1.5">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Dominant Functional Groups</p>
                  <p className="text-xs font-bold text-text-main">{processingResult.interpretation.dominantFunctionalGroups.slice(0, 2).join(', ')}</p>
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Chemical Interpretation</p>
                  <p className="text-[10px] text-text-main">{processingResult.interpretation.chemicalInterpretation}</p>
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Reliability</p>
                  <p className="text-[10px] text-text-main tabular-nums">{matchedBands}/{totalBands} matched, {totalBands - matchedBands} unassigned</p>
                </div>
              </div>
            </div>

            {/* EVIDENCE SNAPSHOT */}
            <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wide mb-1">Evidence (Top 3)</h3>
              <div className="space-y-1">
                {processingResult.functionalGroupCandidates.slice(0, 3).map((candidate, index) => {
                  const band = candidate.matches[0]?.observedBand;
                  if (!band) return null;
                  return (
                    <div key={index} className="bg-background/50 p-1 rounded">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wide">#{index + 1}</span>
                        <span className="text-[10px] font-mono text-emerald-600 tabular-nums">{candidate.functionalGroup}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        <div>
                          <span className="text-text-muted text-[8px] uppercase">Wavenumber</span>
                          <div className="font-mono font-semibold text-text-main tabular-nums">{band.wavenumber.toFixed(0)} cm⁻¹</div>
                        </div>
                        <div>
                          <span className="text-text-muted text-[8px] uppercase">Δcm⁻¹</span>
                          <div className="font-mono font-semibold text-text-main tabular-nums">{candidate.matches[0]?.deltaFromCenter.toFixed(0) || '0'} cm⁻¹</div>
                        </div>
                        <div>
                          <span className="text-text-muted text-[8px] uppercase">Int</span>
                          <div className="font-semibold text-text-main tabular-nums">{band.intensity.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VALIDATION */}
            <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wide mb-1">Validation</h3>
              <div className="space-y-1">
                <div className="space-y-0.5">
                  <div className="flex items-start gap-1 text-[10px]">
                    <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="text-text-main leading-tight">Raman for vibrational modes</span>
                  </div>
                  <div className="flex items-start gap-1 text-[10px]">
                    <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="text-text-main leading-tight">XPS for oxidation states</span>
                  </div>
                  <div className="flex items-start gap-1 text-[10px]">
                    <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="text-text-main leading-tight">Multi-tech fusion</span>
                  </div>
                </div>
                <div className="pt-1 border-t border-border/30">
                  <Link
                    to="/demo/agent"
                    className="flex items-center justify-center gap-1.5 w-full h-6 rounded bg-primary text-white text-[9px] font-semibold uppercase tracking-wide hover:bg-primary/90 transition-colors"
                  >
                    <Sparkles size={10} />
                    Agent Mode
                  </Link>
                </div>
              </div>
            </div>

            {/* CAVEATS */}
            <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={11} className="text-amber-600" />
                <h3 className="text-[10px] font-semibold uppercase tracking-wide">Caveats</h3>
              </div>
              <div className="space-y-0.5">
                {processingResult.interpretation.caveats.map((caveat, index) => (
                  <div key={index} className="flex gap-1.5 text-[10px] leading-tight text-text-muted">
                    <span className="mt-0.5">•</span>
                    <span>{caveat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
      
      {/* Parameter Drawer */}
      <ParameterDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        stepId={activeStep}
        stepLabel={activeStep ? processingStatus.find(s => s.id === activeStep)?.label || '' : ''}
        methodName={activeStep ? processingStatus.find(s => s.id === activeStep)?.summary || '' : ''}
        isAutoMode={autoMode}
        parameters={{}}
        parameterDefinitions={[]}
        onParameterChange={handleParameterChange}
        onApply={handleApplyParameters}
        onReset={handleResetParameters}
        validationErrors={{}}
        previewImpact="Adjust parameters to fine-tune the FTIR processing step."
      />
    </DashboardLayout>
  );
}
