import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { ramanDemoData, RAMAN_DEMO_DATASETS, getRamanDemoDataset } from '../data/ramanDemoData';
import { runRamanProcessing } from '../agents/ramanAgent/runner';
import { getWorkspaceEntryMode, getSampleDatasetName } from '../utils/workspaceEntry';
import { DatasetInfoBar } from '../components/workspace/DatasetInfoBar';
import { EmptyWorkspaceState } from '../components/workspace/EmptyWorkspaceState';

export default function RamanWorkspace() {
  const [searchParams] = useSearchParams();
  
  // Entry mode detection
  const entryMode = getWorkspaceEntryMode(searchParams, 'raman');
  
  // Dataset state
  const [hasDatasetLoaded, setHasDatasetLoaded] = useState(false);
  const [datasetSource, setDatasetSource] = useState<'sample' | 'upload' | 'project' | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'spectrum' | 'peakList' | 'modeAssignments'>('spectrum');
  const [selectedDatasetId, setSelectedDatasetId] = useState(ramanDemoData.id);
  
  // Parameter state management
  const [autoMode, setAutoMode] = useState(true);
  
  // Drawer state management
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  
  // Get selected dataset
  const selectedDataset = getRamanDemoDataset(selectedDatasetId);
  
  // Entry mode initialization
  useEffect(() => {
    if (!entryMode) {
      // Project mode - use existing behavior
      setHasDatasetLoaded(true);
      setDatasetSource('project');
      setDatasetName(selectedDataset.fileName);
      return;
    }

    if (entryMode.mode === 'sample') {
      // Auto-load sample dataset
      const sampleName = getSampleDatasetName('raman');
      const sampleDataset = getRamanDemoDataset('raman-demo-001');
      setSelectedDatasetId(sampleDataset.id);
      setHasDatasetLoaded(true);
      setDatasetSource('sample');
      setDatasetName(sampleName);
    } else if (entryMode.mode === 'upload') {
      // Upload mode - do NOT auto-load anything
      setHasDatasetLoaded(false);
      setDatasetSource(null);
    } else {
      // Empty mode
      setHasDatasetLoaded(false);
      setDatasetSource(null);
    }
  }, [entryMode, selectedDataset.fileName]);
  
  // Handlers for empty state
  const handleLoadSample = () => {
    const sampleName = getSampleDatasetName('raman');
    const sampleDataset = getRamanDemoDataset('raman-demo-001');
    setSelectedDatasetId(sampleDataset.id);
    setHasDatasetLoaded(true);
    setDatasetSource('sample');
    setDatasetName(sampleName);
  };

  const handleUploadDataset = () => {
    // Upload functionality placeholder
    alert('File upload functionality coming soon. Please use "Load Sample Dataset" to try the workspace.');
  };
  
  // Run Raman processing with current parameters
  const processingResult = useMemo(() => {
    return runRamanProcessing(selectedDataset);
  }, [selectedDataset, autoMode]);
  
  // Convert processed Raman data to graph format (x, y points)
  const graphData = processingResult.signal.ramanShift.map((rs, i) => ({
    x: rs,
    y: processingResult.signal.intensity[i],
  }));
  
  // Convert baseline to graph format
  const baselineData = processingResult.signal.ramanShift.map((rs, i) => ({
    x: rs,
    y: processingResult.baseline[i],
  }));
  
  // Convert peaks to graph markers
  const peakMarkers = processingResult.peaks.map(peak => ({
    position: peak.ramanShift,
    intensity: peak.intensity,
    label: peak.assignment || '',
  }));
  
  // Calculate summary statistics from processed results
  const totalPeaks = processingResult.peaks.length;
  
  // Count unique matched peaks (not total matches, since one peak can match multiple references)
  const uniqueMatchedPeakIds = new Set(
    processingResult.matches.map(match => match.observedPeak.id)
  );
  const matchedPeaks = uniqueMatchedPeakIds.size;
  
  const confidenceBadge = processingResult.interpretation.confidenceLevel;
  const reviewStatus = confidenceBadge === 'high' ? 'Complete' : confidenceBadge === 'medium' ? 'Ready' : 'Review';
  
  // Create ranked evidence list with strict hierarchy:
  // 1. A1g first
  // 2. Eg/T2g/Lower ferrite modes
  // 3. Others (D/G carbon bands)
  const rankedEvidence = [...processingResult.modeCandidate].sort((a, b) => {
    const aIsA1g = a.modeName.includes('A1g');
    const bIsA1g = b.modeName.includes('A1g');
    const aIsSupporting = a.modeName.includes('Eg') || a.modeName.includes('T2g') || a.modeName.includes('Lower ferrite');
    const bIsSupporting = b.modeName.includes('Eg') || b.modeName.includes('T2g') || b.modeName.includes('Lower ferrite');
    
    // A1g always first
    if (aIsA1g && !bIsA1g) return -1;
    if (!aIsA1g && bIsA1g) return 1;
    
    // Then supporting ferrite modes
    if (aIsSupporting && !bIsSupporting) return -1;
    if (!aIsSupporting && bIsSupporting) return 1;
    
    // Then by internal match strength
    return b.score - a.score;
  });
  
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
  
  // Processing status for Raman steps
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
      summary: autoMode ? 'Moving Average (window=9)' : 'Moving Average (window=9)'
    },
    {
      id: 'peakDetection',
      label: 'Peak Detection',
      status: 'complete' as const,
      summary: autoMode ? `${totalPeaks} peaks detected` : `${totalPeaks} peaks detected`
    },
    {
      id: 'modeAssignment',
      label: 'Mode Assignment',
      status: 'complete' as const,
      summary: autoMode ? `${matchedPeaks}/${totalPeaks} matched` : `${matchedPeaks}/${totalPeaks} matched`
    },
    {
      id: 'phaseInterpretation',
      label: 'Phase / Defect Interpretation',
      status: 'complete' as const,
      summary: autoMode ? 'Evidence aggregation' : 'Evidence aggregation'
    },
    {
      id: 'scientificSummary',
      label: 'Characterization Overview',
      status: 'complete' as const,
      summary: autoMode ? 'Phase interpretation' : 'Phase interpretation'
    }
  ];

  return (
    <DashboardLayout>
      {/* Show empty state when no dataset is loaded */}
      {!hasDatasetLoaded && entryMode && (
        <EmptyWorkspaceState
          technique="RAMAN"
          onLoadSample={handleLoadSample}
          onUploadDataset={handleUploadDataset}
        />
      )}
      
      {/* Show workspace when dataset is loaded or in project mode */}
      {(hasDatasetLoaded || !entryMode) && (
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-background">
        {/* Dataset Info Bar */}
        {datasetSource && (
          <DatasetInfoBar
            technique="RAMAN"
            source={datasetSource}
            datasetName={datasetName}
            projectName={undefined}
          />
        )}
        
        <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-72 border-r border-border bg-surface flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Raman Project
            </label>
            <select
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-text-main focus:outline-none focus:border-primary"
            >
              <option>Demo Project</option>
            </select>
            <p className="mt-2 text-[10px] text-text-muted">Spinel ferrite catalyst</p>
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
              {RAMAN_DEMO_DATASETS.map(dataset => (
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
                    onClick={() => setActiveTab('peakList')}
                    className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                      activeTab === 'peakList' 
                        ? 'text-primary border-b-2 border-primary -mb-px' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    Peak List
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary/10 text-primary text-[9px] font-bold px-1">
                      {totalPeaks}
                    </span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('modeAssignments')}
                    className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                      activeTab === 'modeAssignments' 
                        ? 'text-primary border-b-2 border-primary -mb-px' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    Mode Assignments
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary/10 text-primary text-[9px] font-bold px-1">
                      {matchedPeaks}/{totalPeaks}
                    </span>
                  </button>
                </div>
                
                {/* Tab Content */}
                {activeTab === 'spectrum' && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-surface/20">
                      <div>
                        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-main">Raman Spectrum</h3>
                        <p className="text-[9px] text-text-muted mt-0.5">Intensity vs. Raman Shift with baseline correction</p>
                      </div>
                      <span className="text-[9px] font-mono text-text-muted tabular-nums">100-2000 cm⁻¹</span>
                    </div>
                    
                    {/* Graph */}
                    <div className="h-[420px] w-full min-w-0 px-2 py-2">
                      <Graph
                        type="raman"
                        height="100%"
                        externalData={graphData}
                        baselineData={baselineData}
                        peakMarkers={peakMarkers}
                        showBackground
                        showCalculated={false}
                        showResidual={false}
                      />
                    </div>
                    
                    <div className="mx-3 mb-2 flex items-center gap-2 text-[10px] text-text-muted bg-surface/40 rounded px-2 py-1.5 border border-border/50">
                      <CheckCircle2 size={12} className="text-primary shrink-0" />
                      <span>{totalPeaks} peaks detected and assigned to vibrational modes.</span>
                    </div>
                  </>
                )}
                
                {activeTab === 'peakList' && (
                  <div className="p-3 space-y-3">
                    {/* Detected Peaks Table */}
                    <div className="border border-border/40 bg-surface/50 rounded">
                      <div className="px-3 py-2 border-b border-border/30 bg-surface/20">
                        <h3 className="text-sm font-semibold text-text-main">Detected Peaks ({totalPeaks})</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Peak positions, FWHM, and mode assignments</p>
                      </div>
                      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="text-[10px] uppercase tracking-wide text-text-muted bg-surface/10 sticky top-0">
                            <tr>
                              <th className="text-center px-3 py-2 font-medium">#</th>
                              <th className="text-right px-3 py-2 font-medium">Raman Shift <span className="text-[8px]">(cm⁻¹)</span></th>
                              <th className="text-right px-3 py-2 font-medium">Intensity</th>
                              <th className="text-right px-3 py-2 font-medium">FWHM <span className="text-[8px]">(cm⁻¹)</span></th>
                              <th className="text-right px-3 py-2 font-medium">Area</th>
                              <th className="text-left px-3 py-2 font-medium">Assignment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processingResult.peaks.map((peak, index) => (
                              <tr key={peak.id} className="border-t border-border/20 hover:bg-surface/10">
                                <td className="px-3 py-2 text-center text-text-muted text-sm tabular-nums">{index + 1}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{peak.ramanShift.toFixed(0)}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{peak.intensity.toFixed(2)}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{peak.fwhm.toFixed(0)}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{peak.area.toFixed(1)}</td>
                                <td className="px-3 py-2 font-mono text-left text-primary text-sm font-medium">{peak.assignment || '-'}</td>
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
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">PEAKS</span>
                            <span className="text-lg font-semibold text-text-main tabular-nums block">{totalPeaks}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">MATCHED</span>
                            <span className="text-lg font-semibold text-text-main tabular-nums block">{matchedPeaks}/{totalPeaks}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">UNASSIGNED</span>
                            <span className={`text-lg font-semibold tabular-nums block ${totalPeaks - matchedPeaks > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{totalPeaks - matchedPeaks}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">SNR</span>
                            <span className="text-lg font-semibold text-emerald-600 tabular-nums block">32.0 dB</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">DATA POINTS</span>
                            <span className="text-lg font-semibold text-text-main tabular-nums block">{processingResult.signal.ramanShift.length}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">STATUS</span>
                            <span className="text-lg font-semibold text-emerald-600 tabular-nums block">{reviewStatus}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'modeAssignments' && (
                  <div className="p-3">
                    <div className="border border-border/40 bg-surface/50 rounded">
                      <div className="px-3 py-2 border-b border-border/30 bg-surface/20">
                        <h3 className="text-sm font-semibold text-text-main">Mode Assignments ({processingResult.modeCandidate.length})</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Vibrational mode identification and phase matching</p>
                      </div>
                      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="text-[10px] uppercase tracking-wide text-text-muted bg-surface/10 sticky top-0">
                            <tr>
                              <th className="text-left px-3 py-2 font-medium">Mode</th>
                              <th className="text-left px-3 py-2 font-medium">Assignment</th>
                              <th className="text-right px-3 py-2 font-medium">Raman Shift <span className="text-[8px]">(cm⁻¹)</span></th>
                              <th className="text-right px-3 py-2 font-medium">Review</th>
                              <th className="text-left px-3 py-2 font-medium">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processingResult.modeCandidate.map((candidate, index) => (
                              <tr key={index} className="border-t border-border/20 hover:bg-surface/10">
                                <td className="px-3 py-2 font-mono text-left text-primary text-sm font-medium">{candidate.modeName}</td>
                                <td className="px-3 py-2 text-left text-text-main text-sm">{candidate.assignment}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">
                                  {candidate.matches[0]?.observedPeak.ramanShift.toFixed(0) || '-'}
                                </td>
                                <td className="px-3 py-2 font-mono text-right text-emerald-600 text-sm font-medium tabular-nums">
                                  {candidate.score >= 0.75 ? 'Ready' : candidate.score >= 0.5 ? 'In Progress' : 'Review'}
                                </td>
                                <td className="px-3 py-2 text-left text-text-muted text-sm">
                                  {candidate.phaseType}
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
            {/* CHARACTERIZATION OVERVIEW */}
            <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-[10px] font-semibold uppercase tracking-wide">Characterization Overview</h3>
                <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase ${
                  confidenceBadge === 'high' 
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                    : confidenceBadge === 'medium'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-700'
                    : 'border-red-500/30 bg-red-500/10 text-red-700'
                }`}>
                  {reviewStatus}
                </span>
              </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Dominant Modes</p>
                  <p className="text-xs font-bold text-text-main">{processingResult.interpretation.dominantModes.slice(0, 2).join(', ')}</p>
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Phase Interpretation</p>
                  <p className="text-[10px] text-text-main">{processingResult.interpretation.phaseInterpretation}</p>
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Reliability</p>
                  <p className="text-[10px] text-text-main tabular-nums">{matchedPeaks}/{totalPeaks} matched, {totalPeaks - matchedPeaks} unassigned</p>
                </div>
            </div>

            {/* EVIDENCE SNAPSHOT */}
            <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wide mb-1">Evidence (Top 3)</h3>
              <div className="space-y-1">
                {rankedEvidence.slice(0, 3).map((candidate, index) => {
                  const peak = candidate.matches[0]?.observedPeak;
                  if (!peak) return null;
                  return (
                    <div key={index} className="bg-background/50 p-1 rounded">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wide">#{index + 1}</span>
                        <span className="text-[10px] font-mono text-emerald-600 tabular-nums">{candidate.modeName}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        <div>
                          <span className="text-text-muted text-[8px] uppercase">Raman Shift</span>
                          <div className="font-mono font-semibold text-text-main tabular-nums">{peak.ramanShift.toFixed(0)} cm⁻¹</div>
                        </div>
                        <div>
                          <span className="text-text-muted text-[8px] uppercase">Δcm⁻¹</span>
                          <div className="font-mono font-semibold text-text-main tabular-nums">{candidate.matches[0]?.deltaFromCenter.toFixed(0) || '0'} cm⁻¹</div>
                        </div>
                        <div>
                          <span className="text-text-muted text-[8px] uppercase">Int</span>
                          <div className="font-semibold text-text-main tabular-nums">{peak.intensity.toFixed(2)}</div>
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
                    <span className="text-text-main leading-tight">FTIR for functional groups</span>
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
      </div>
      )}
      
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
        previewImpact="Adjust parameters to fine-tune the Raman processing step."
      />
    </DashboardLayout>
  );
}
