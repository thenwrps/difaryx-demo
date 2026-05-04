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
import { xpsDemoData, XPS_DEMO_DATASETS, getXpsDemoDataset } from '../data/xpsDemoData';
import { XPS_DEFAULT_PARAMETERS, getStepParameterDefinitions } from '../data/parameterDefinitions';
import { useParameterPersistence } from '../hooks/useParameterPersistence';
import { runXpsProcessing, convertXpsParametersToProcessingParams } from '../agents/xpsAgent/runner';
import type { XpsParameters } from '../types/parameters';
import { getWorkspaceEntryMode, getSampleDatasetName } from '../utils/workspaceEntry';
import { DatasetInfoBar } from '../components/workspace/DatasetInfoBar';
import { EmptyWorkspaceState } from '../components/workspace/EmptyWorkspaceState';

export default function XPSWorkspace() {
  const [searchParams] = useSearchParams();
  
  // Entry mode detection
  const entryMode = getWorkspaceEntryMode(searchParams, 'xps');
  
  // Dataset state
  const [hasDatasetLoaded, setHasDatasetLoaded] = useState(false);
  const [datasetSource, setDatasetSource] = useState<'sample' | 'upload' | 'project' | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'spectrum' | 'peakList' | 'chemicalStates'>('spectrum');
  const [selectedDatasetId, setSelectedDatasetId] = useState(xpsDemoData.id);
  
  // Parameter state management
  const [autoMode, setAutoMode] = useState(true);
  const [parameters, setParameters] = useParameterPersistence('xps', XPS_DEFAULT_PARAMETERS);
  
  // Drawer state management
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  
  // Get selected dataset
  const selectedDataset = getXpsDemoDataset(selectedDatasetId);
  
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
      const sampleName = getSampleDatasetName('xps');
      const sampleDataset = getXpsDemoDataset('cu2p-demo-001');
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
    const sampleName = getSampleDatasetName('xps');
    const sampleDataset = getXpsDemoDataset('cu2p-demo-001');
    setSelectedDatasetId(sampleDataset.id);
    setHasDatasetLoaded(true);
    setDatasetSource('sample');
    setDatasetName(sampleName);
  };

  const handleUploadDataset = () => {
    // Upload functionality placeholder
    alert('File upload functionality coming soon. Please use "Load Sample Dataset" to try the workspace.');
  };
  
  // Run XPS processing with current parameters
  const processingResult = useMemo(() => {
    if (autoMode) {
      // In Auto Mode, use default parameters
      return runXpsProcessing(selectedDataset);
    } else {
      // In Manual Mode, use user-selected parameters
      const processingParams = convertXpsParametersToProcessingParams(parameters);
      return runXpsProcessing(selectedDataset, processingParams);
    }
  }, [selectedDataset, autoMode, parameters]);
  
  // Convert processed XPS data to graph format (x, y points)
  const graphData = processingResult.signal.bindingEnergy.map((be, i) => ({
    x: be,
    y: processingResult.signal.intensity[i],
  }));
  
  // Convert baseline to graph format
  const baselineData = processingResult.signal.bindingEnergy.map((be, i) => ({
    x: be,
    y: processingResult.baseline[i],
  }));
  
  // Convert peaks to graph markers
  const peakMarkers = processingResult.peaks.map(peak => ({
    position: peak.bindingEnergy,
    intensity: peak.intensity + processingResult.baseline[0], // Add baseline offset for visual positioning
    label: peak.assignment || '',
  }));
  
  // Calculate summary statistics from processed results
  const totalPeaks = processingResult.peaks.length;
  const matchedPeaks = processingResult.matches.length;
  const avgConfidence = matchedPeaks > 0 
    ? processingResult.matches.reduce((sum, m) => sum + m.confidence, 0) / matchedPeaks 
    : 0;
  const confidencePercent = (avgConfidence * 100).toFixed(1);
  
  // Determine primary chemical state (most intense matched peak)
  const primaryMatch = processingResult.matches
    .map(match => ({
      ...match,
      peak: processingResult.peaks.find(p => p.id === match.peakId),
    }))
    .sort((a, b) => (b.peak?.intensity || 0) - (a.peak?.intensity || 0))[0];
  
  const primaryElement = primaryMatch?.element || 'Cu';
  
  // Use scientific summary from processing result
  const chemicalStateInterpretation = processingResult.scientificSummary;
  
  // Determine confidence badge
  const confidenceBadge = processingResult.confidence === 'high' ? 'high' 
    : processingResult.confidence === 'medium' ? 'medium' 
    : 'low';
  
  // Handle Auto Mode toggle
  const handleAutoModeChange = (enabled: boolean) => {
    setAutoMode(enabled);
    if (enabled) {
      // Reset to defaults when Auto Mode is enabled
      setParameters(XPS_DEFAULT_PARAMETERS);
      // Close drawer when Auto Mode is enabled
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
    // Close the drawer after applying
    setDrawerOpen(false);
    // Parameters are already updated in state via handleParameterChange
    // TODO: Connect to XPS processing logic in future step
  };
  
  // Handle resetting parameters to defaults
  const handleResetParameters = () => {
    if (activeStep) {
      setParameters({
        ...parameters,
        [activeStep]: XPS_DEFAULT_PARAMETERS[activeStep as keyof XpsParameters],
      });
    }
  };
  
  // Handle parameter changes
  const handleParameterChange = (paramId: string, value: any) => {
    if (activeStep) {
      setParameters({
        ...parameters,
        [activeStep]: {
          ...(parameters as any)[activeStep],
          [paramId]: value,
        },
      });
    }
  };
  
  // Processing status for XPS steps
  const processingStatus = [
    {
      id: 'energyCalibration',
      label: 'Energy Calibration',
      status: 'complete' as const,
      summary: autoMode 
        ? 'C 1s ref (284.8 eV)' 
        : `${parameters.energyCalibration.reference_peak} ref (shift=${parameters.energyCalibration.shift_value} eV)`
    },
    {
      id: 'backgroundSubtraction',
      label: 'Background Subtraction',
      status: 'complete' as const,
      summary: autoMode
        ? 'Shirley method'
        : `${parameters.backgroundSubtraction.method} (iter=${parameters.backgroundSubtraction.iterations})`
    },
    {
      id: 'smoothing',
      label: 'Smoothing',
      status: 'complete' as const,
      summary: autoMode
        ? 'Moving average (window=5)'
        : `${parameters.smoothing.method} (window=${parameters.smoothing.window_size})`
    },
    {
      id: 'peakDetection',
      label: 'Peak Detection',
      status: 'complete' as const,
      summary: autoMode
        ? `${totalPeaks} peaks detected`
        : `${totalPeaks} peaks (prominence=${parameters.peakDetection.prominence})`
    },
    {
      id: 'peakFitting',
      label: 'Peak Fitting',
      status: 'complete' as const,
      summary: autoMode
        ? 'Gaussian model'
        : `${parameters.peakFitting.model} (tol=${parameters.peakFitting.tolerance.toExponential(0)})`
    },
    {
      id: 'chemicalStateAssignment',
      label: 'Chemical State Assignment',
      status: 'complete' as const,
      summary: autoMode
        ? `${matchedPeaks}/${totalPeaks} matched`
        : `${matchedPeaks}/${totalPeaks} matched (${parameters.chemicalStateAssignment.database})`
    }
  ];

  return (
    <DashboardLayout>
      {/* Show empty state when no dataset is loaded */}
      {!hasDatasetLoaded && entryMode && (
        <EmptyWorkspaceState
          technique="XPS"
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
            technique="XPS"
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
              XPS Project
            </label>
            <select
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-text-main focus:outline-none focus:border-primary"
            >
              <option>Demo Project</option>
            </select>
            <p className="mt-2 text-[10px] text-text-muted">Cu-Fe oxide sample</p>
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
              {XPS_DEMO_DATASETS.map(dataset => (
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
              {/* XPS SPECTRUM - GRAPH FIRST */}
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
                    onClick={() => setActiveTab('chemicalStates')}
                    className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                      activeTab === 'chemicalStates' 
                        ? 'text-primary border-b-2 border-primary -mb-px' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    Chemical States
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
                        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-main">XPS Spectrum</h3>
                        <p className="text-[9px] text-text-muted mt-0.5">Intensity vs. Binding Energy with background subtraction</p>
                      </div>
                      <span className="text-[9px] font-mono text-text-muted tabular-nums">{selectedDataset.region}</span>
                    </div>
                    
                    {/* Graph */}
                    <div className="h-[420px] w-full min-w-0 px-2 py-2">
                      <Graph
                        type="xps"
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
                      <span>{totalPeaks} peaks detected and assigned to {primaryElement} oxidation states.</span>
                    </div>
                  </>
                )}
                
                {activeTab === 'peakList' && (
                  <div className="p-3 space-y-3">
                    {/* Detected Peaks Table */}
                    <div className="border border-border/40 bg-surface/50 rounded">
                      <div className="px-3 py-2 border-b border-border/30 bg-surface/20">
                        <h3 className="text-sm font-semibold text-text-main">Detected Peaks ({totalPeaks})</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Peak positions, FWHM, and chemical state assignments</p>
                      </div>
                      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="text-[10px] uppercase tracking-wide text-text-muted bg-surface/10 sticky top-0">
                            <tr>
                              <th className="text-center px-3 py-2 font-medium">#</th>
                              <th className="text-right px-3 py-2 font-medium">BE <span className="text-[8px]">(eV)</span></th>
                              <th className="text-right px-3 py-2 font-medium">Intensity</th>
                              <th className="text-right px-3 py-2 font-medium">FWHM <span className="text-[8px]">(eV)</span></th>
                              <th className="text-right px-3 py-2 font-medium">Area</th>
                              <th className="text-left px-3 py-2 font-medium">Assignment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processingResult.peaks.map((peak, index) => (
                              <tr key={peak.id} className="border-t border-border/20 hover:bg-surface/10">
                                <td className="px-3 py-2 text-center text-text-muted text-sm tabular-nums">{index + 1}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{peak.bindingEnergy.toFixed(1)}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{peak.intensity.toFixed(0)}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{peak.fwhm.toFixed(1)}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{peak.area.toFixed(0)}</td>
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
                            <span className="text-lg font-semibold text-emerald-600 tabular-nums block">32.4 dB</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wide text-text-muted block">DATA POINTS</span>
                            <span className="text-lg font-semibold text-text-main tabular-nums block">{selectedDataset.signal.bindingEnergy.length}</span>
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
                
                {activeTab === 'chemicalStates' && (
                  <div className="p-3">
                    <div className="border border-border/40 bg-surface/50 rounded">
                      <div className="px-3 py-2 border-b border-border/30 bg-surface/20">
                        <h3 className="text-sm font-semibold text-text-main">Chemical State Matching ({matchedPeaks}/{totalPeaks})</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Comparison with reference binding energies</p>
                      </div>
                      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="text-[10px] uppercase tracking-wide text-text-muted bg-surface/10 sticky top-0">
                            <tr>
                              <th className="text-right px-3 py-2 font-medium">BE obs <span className="text-[8px]">(eV)</span></th>
                              <th className="text-right px-3 py-2 font-medium">BE ref <span className="text-[8px]">(eV)</span></th>
                              <th className="text-right px-3 py-2 font-medium">ΔBE <span className="text-[8px]">(eV)</span></th>
                              <th className="text-right px-3 py-2 font-medium">Assignment</th>
                              <th className="text-right px-3 py-2 font-medium">Conf.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processingResult.matches.map((match) => (
                              <tr key={match.peakId} className="border-t border-border/20 hover:bg-surface/10">
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{match.observedBE.toFixed(1)}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{match.referenceBE.toFixed(1)}</td>
                                <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{match.deltaBE.toFixed(2)}</td>
                                <td className="px-3 py-2 font-mono text-right text-primary text-sm font-medium">{match.assignment}</td>
                                <td className="px-3 py-2 font-mono text-right text-emerald-600 text-sm font-medium tabular-nums">{(match.confidence * 100).toFixed(0)}%</td>
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
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Primary Element</p>
                  <p className="text-xs font-bold text-text-main">{primaryElement}</p>
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Chemical States</p>
                  <p className="text-[10px] text-text-main">{chemicalStateInterpretation}</p>
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Reliability</p>
                  <p className="text-[10px] text-text-main tabular-nums">{matchedPeaks}/{totalPeaks} matched, {totalPeaks - matchedPeaks} unassigned</p>
                </div>
              </div>
            </div>

            {/* EVIDENCE SNAPSHOT */}
            <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wide mb-1">Evidence (Top 3)</h3>
              <div className="space-y-1">
                {processingResult.matches.slice(0, 3).map((match, index) => {
                  const peak = processingResult.peaks.find(p => p.id === match.peakId);
                  return (
                    <div key={match.peakId} className="bg-background/50 p-1 rounded">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wide">#{index + 1}</span>
                        <span className="text-[10px] font-mono text-emerald-600 tabular-nums">{match.oxidationState}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        <div>
                          <span className="text-text-muted text-[8px] uppercase">BE</span>
                          <div className="font-mono font-semibold text-text-main tabular-nums">{match.observedBE.toFixed(1)} eV</div>
                        </div>
                        <div>
                          <span className="text-text-muted text-[8px] uppercase">ΔBE</span>
                          <div className="font-mono font-semibold text-text-main tabular-nums">{Math.abs(match.deltaBE).toFixed(2)} eV</div>
                        </div>
                        <div>
                          <span className="text-text-muted text-[8px] uppercase">Int</span>
                          <div className="font-semibold text-text-main tabular-nums">{peak?.intensity.toFixed(0) || '-'}</div>
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
                    <span className="text-text-main leading-tight">XRD for phase confirmation</span>
                  </div>
                  <div className="flex items-start gap-1 text-[10px]">
                    <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="text-text-main leading-tight">Raman for oxidation states</span>
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
                <div className="flex gap-1.5 text-[10px] leading-tight text-text-muted">
                  <span className="mt-0.5">•</span>
                  <span>Surface sensitivity (5-10 nm depth)</span>
                </div>
                <div className="flex gap-1.5 text-[10px] leading-tight text-text-muted">
                  <span className="mt-0.5">•</span>
                  <span>Charging effects may shift binding energies</span>
                </div>
                <div className="flex gap-1.5 text-[10px] leading-tight text-text-muted">
                  <span className="mt-0.5">•</span>
                  <span>Peak overlap requires careful deconvolution</span>
                </div>
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
        parameters={activeStep ? (parameters as any)[activeStep] || {} : {}}
        parameterDefinitions={activeStep ? getStepParameterDefinitions('xps', activeStep) : []}
        onParameterChange={handleParameterChange}
        onApply={handleApplyParameters}
        onReset={handleResetParameters}
        validationErrors={{}}
        previewImpact="Adjust parameters to fine-tune the XPS processing step."
      />
    </DashboardLayout>
  );
}
