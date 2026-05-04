import React, { useEffect, useMemo, useState } from 'react';
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
import { ProcessingPipeline } from '../components/workspace/ProcessingPipeline';
import { ParameterDrawer } from '../components/workspace/ParameterDrawer';
import { XRD_DEMO_DATASETS, getXrdDemoDataset } from '../data/xrdDemoDatasets';
import { demoProjects, getAgentPath, getNotebookPath, getProject } from '../data/demoProjects';
import {
  runXrdPhaseIdentificationAgent,
  xrdAgentToolSchemas,
} from '../agents/xrdAgent';
import type { XrdAgentResult, XrdDetectedPeak } from '../agents/xrdAgent';
import { useParameterPersistence } from '../hooks/useParameterPersistence';
import { XRD_DEFAULT_PARAMETERS, getStepParameterDefinitions } from '../data/parameterDefinitions';
import type { XrdParameters } from '../types/parameters';
import { getWorkspaceEntryMode, getSampleDatasetName } from '../utils/workspaceEntry';
import { DatasetInfoBar } from '../components/workspace/DatasetInfoBar';
import { EmptyWorkspaceState } from '../components/workspace/EmptyWorkspaceState';

function statusClass(status: 'complete' | 'warning' | 'error') {
  if (status === 'error') return 'border-red-500/30 bg-red-500/10 text-red-700';
  if (status === 'warning') return 'border-amber-500/30 bg-amber-500/10 text-amber-700';
  return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700';
}

function confidenceClass(level: string) {
  if (level === 'high') return 'text-emerald-600';
  if (level === 'medium') return 'text-amber-600';
  return 'text-red-600';
}

function findPrimaryAssignment(result: XrdAgentResult, peak: XrdDetectedPeak) {
  const primary = result.conflicts.primaryCandidate;
  const match = primary?.matches.find((item) => item.observedPeak.id === peak.id);
  if (!match || !primary) return peak.classification === 'broad' ? 'Broad feature' : 'Unexplained';
  return `${primary.phase.name} ${match.referencePeak.hkl}`;
}

function topCandidateRows(result: XrdAgentResult) {
  return result.candidates.slice(0, 4).map((candidate) => ({
    id: candidate.phase.id,
    phase: candidate.phase.name,
    score: `${(candidate.score * 100).toFixed(1)}%`,
    matched: `${candidate.matches.length}/${candidate.phase.peaks.length}`,
    penalty: candidate.unexplainedStrongPeakPenalty.toFixed(2),
  }));
}

export default function XRDWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Entry mode detection
  const entryMode = getWorkspaceEntryMode(searchParams, 'xrd');
  
  // Dataset state
  const [hasDatasetLoaded, setHasDatasetLoaded] = useState(false);
  const [datasetSource, setDatasetSource] = useState<'sample' | 'upload' | 'project' | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  
  const project = getProject(searchParams.get('project'));
  const [selectedProjectId, setSelectedProjectId] = useState(project.id);
  const datasetFromQuery = getXrdDemoDataset(searchParams.get('dataset') ?? searchParams.get('xrdDataset'));
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasetFromQuery.id);
  
  // Tab state for graph section
  const [activeTab, setActiveTab] = useState<'pattern' | 'peakList' | 'referenceOverlay' | 'residual' | 'rietveld'>('pattern');
  
  // Parameter state management
  const [autoMode, setAutoMode] = useState(true);
  const [parameters, setParameters] = useParameterPersistence('xrd', XRD_DEFAULT_PARAMETERS);
  
  // Drawer state management
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  
  // Handle Auto Mode toggle
  const handleAutoModeChange = (enabled: boolean) => {
    setAutoMode(enabled);
    if (enabled) {
      // Reset to defaults when Auto Mode is enabled
      setParameters(XRD_DEFAULT_PARAMETERS);
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
    // The agentResult useMemo will recompute automatically due to parameters dependency
  };
  
  // Handle resetting parameters to defaults
  const handleResetParameters = () => {
    if (activeStep) {
      setParameters({
        ...parameters,
        [activeStep]: XRD_DEFAULT_PARAMETERS[activeStep as keyof XrdParameters],
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
  
  // Handle project change
  const handleProjectChange = (newProjectId: string) => {
    setSelectedProjectId(newProjectId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('project', newProjectId);
    setSearchParams(newParams);
  };

  useEffect(() => {
    setSelectedDatasetId(datasetFromQuery.id);
  }, [datasetFromQuery.id]);
  
  // Entry mode initialization
  useEffect(() => {
    if (!entryMode) {
      // Project mode - use existing behavior
      setHasDatasetLoaded(true);
      setDatasetSource('project');
      setDatasetName(datasetFromQuery.fileName);
      return;
    }

    if (entryMode.mode === 'sample') {
      // Auto-load sample dataset
      const sampleName = getSampleDatasetName('xrd');
      const sampleDataset = getXrdDemoDataset('xrd-cufe2o4-clean');
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
  }, [entryMode, datasetFromQuery.fileName, datasetFromQuery.id]);

  const selectedDataset = getXrdDemoDataset(selectedDatasetId);
  
  // Handlers for empty state
  const handleLoadSample = () => {
    const sampleName = getSampleDatasetName('xrd');
    const sampleDataset = getXrdDemoDataset('xrd-cufe2o4-clean');
    setSelectedDatasetId(sampleDataset.id);
    setHasDatasetLoaded(true);
    setDatasetSource('sample');
    setDatasetName(sampleName);
  };

  const handleUploadDataset = () => {
    // Upload functionality placeholder
    // In a real implementation, this would:
    // 1. Show file picker
    // 2. Parse CSV/TXT/XY file
    // 3. Validate data format
    // 4. Load into workspace
    // For now, show coming soon message
    alert('File upload functionality coming soon. Please use "Load Sample Dataset" to try the workspace.');
  };
  
  // Agent result (recomputes when dataset or parameters change in manual mode)
  const agentResult = useMemo(
    () => {
      // Convert user parameters to processing params format
      // Only use custom parameters when Auto Mode is OFF
      const processingParams = autoMode ? undefined : {
        // Baseline correction parameters
        // Note: Implementation uses rolling percentile baseline, not ALS
        // - baselineRadius: window size for rolling percentile (in data points)
        //   Scale lambda (smoothness) to radius: higher lambda = larger window
        //   Typical range: 20-80 points for XRD data
        baselineRadius: Math.round(20 + (Math.log10(parameters.baselineCorrection.lambda) - 2) * 10),
        // - baselineFraction: percentile fraction (0-1)
        //   Maps directly to 'p' asymmetry parameter
        baselineFraction: parameters.baselineCorrection.p,
        
        // Smoothing parameters
        // Note: Implementation uses moving average, not Savitzky-Golay
        // - smoothingRadius: half-window size for moving average
        //   Directly use half of window_size
        smoothingRadius: Math.floor(parameters.smoothing.window_size / 2),
        
        // Peak detection parameters
        // - minProminence: minimum peak prominence in normalized intensity units (0-100)
        //   User prominence is 0-1 scale, convert to 0-100 scale
        minProminence: parameters.peakDetection.prominence * 100,
        // - minDistance: minimum peak separation in 2θ degrees
        //   Direct mapping (already in correct units)
        minDistance: parameters.peakDetection.min_distance,
        // - minHeight: minimum peak height in normalized intensity units (0-100)
        //   Optional parameter, convert from 0-1 to 0-100 scale
        minHeight: parameters.peakDetection.height_threshold !== null 
          ? parameters.peakDetection.height_threshold * 100 
          : undefined,
      };
      
      const result = runXrdPhaseIdentificationAgent({
        datasetId: selectedDataset.id,
        sampleName: selectedDataset.sampleName,
        sourceLabel: selectedDataset.fileName,
        dataPoints: selectedDataset.dataPoints,
      }, processingParams);
      
      // Log parameter impact for debugging (only when custom params applied)
      if (result.parameterImpact) {
        console.log('[XRD Parameter Impact]', result.parameterImpact);
      }
      
      return result;
    },
    [selectedDataset, autoMode, parameters],
  );
  
  // Processing status for XRD steps (updates based on parameters)
  const processingStatus = useMemo(() => {
    const peakCount = agentResult.detectedPeaks.length;
    const candidateCount = agentResult.candidates.length;
    
    // Build detailed method-aware labels
    const baselineLabel = autoMode 
      ? 'Auto (ALS, λ=1e6, p=0.01, iter=10)'
      : `${parameters.baselineCorrection.method} (λ=${parameters.baselineCorrection.lambda.toExponential(0)}, p=${parameters.baselineCorrection.p}, iter=${parameters.baselineCorrection.iterations})`;
    
    const smoothingLabel = autoMode
      ? 'Auto (Savitzky-Golay, window=5, order=2)'
      : `${parameters.smoothing.method} (window=${parameters.smoothing.window_size}, order=${parameters.smoothing.polynomial_order})`;
    
    const peakDetectionLabel = autoMode
      ? `${peakCount} peaks (prominence=0.1, Δ2θ=0.2°)`
      : `${peakCount} peaks (prominence=${parameters.peakDetection.prominence}, Δ2θ=${parameters.peakDetection.min_distance}°)`;
    
    const peakFittingLabel = autoMode
      ? 'Auto (Pseudo-Voigt, tol=1e-4, iter=100)'
      : `${parameters.peakFitting.model} (tol=${parameters.peakFitting.tolerance.toExponential(0)}, iter=${parameters.peakFitting.max_iterations})`;
    
    const referenceLabel = autoMode
      ? `${candidateCount} candidates (ICDD, Δ2θ=±0.1°, score≥0.7)`
      : `${candidateCount} candidates (${parameters.referenceMatching.database}, Δ2θ=±${parameters.referenceMatching.delta_tolerance}°, score≥${parameters.referenceMatching.min_match_score})`;
    
    return [
      {
        id: 'baselineCorrection',
        label: 'Baseline Correction',
        status: 'complete' as const,
        summary: baselineLabel
      },
      {
        id: 'smoothing',
        label: 'Smoothing',
        status: 'complete' as const,
        summary: smoothingLabel
      },
      {
        id: 'peakDetection',
        label: 'Peak Detection',
        status: 'complete' as const,
        summary: peakDetectionLabel
      },
      {
        id: 'peakFitting',
        label: 'Peak Fitting',
        status: 'complete' as const,
        summary: peakFittingLabel
      },
      {
        id: 'referenceMatching',
        label: 'Reference Matching',
        status: 'complete' as const,
        summary: referenceLabel
      }
    ];
  }, [autoMode, parameters, agentResult.detectedPeaks.length, agentResult.candidates.length]);
  
  const primaryCandidate = agentResult.conflicts.primaryCandidate;
  const graphPeakMarkers = agentResult.detectedPeaks.map((peak) => {
    // Find HKL assignment from primary candidate
    const match = primaryCandidate?.matches.find(m => m.observedPeak.id === peak.id);
    const hklLabel = match?.referencePeak.hkl || '';
    
    return {
      position: peak.position,
      intensity: peak.intensity,
      label: hklLabel, // Use HKL label instead of generic peak label
    };
  });
  const candidateRows = topCandidateRows(agentResult);

  return (
    <DashboardLayout>
      {/* Show empty state when no dataset is loaded */}
      {!hasDatasetLoaded && entryMode && (
        <EmptyWorkspaceState
          technique="XRD"
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
            technique="XRD"
            source={datasetSource}
            datasetName={datasetName}
            projectName={datasetSource === 'project' ? project.name : undefined}
          />
        )}
        
        <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-72 border-r border-border bg-surface flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted" htmlFor="xrd-project-select">
              XRD Project
            </label>
            <select
              id="xrd-project-select"
              value={selectedProjectId}
              onChange={(event) => handleProjectChange(event.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-text-main focus:outline-none focus:border-primary"
            >
              {demoProjects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[10px] text-text-muted">{project.material}</p>
          </div>

          <div className="p-4 border-b border-border">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted" htmlFor="xrd-dataset-select">
              Dataset
            </label>
            <select
              id="xrd-dataset-select"
              value={selectedDatasetId}
              onChange={(event) => setSelectedDatasetId(event.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-text-main focus:outline-none focus:border-primary"
            >
              {XRD_DEMO_DATASETS.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.label}
                </option>
              ))}
            </select>
            
            {/* Input file info */}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-text-muted">
              <Database size={14} className="shrink-0" />
              <span className="truncate">{selectedDataset.fileName}</span>
            </div>
          </div>

          {/* New Parameter-Enabled Processing Pipeline - Flexible Height */}
          <div className="flex-1 min-h-0 border-b border-border overflow-y-auto">
            <div className="p-3">
              <ProcessingPipeline
                technique="xrd"
                autoMode={autoMode}
                onAutoModeChange={handleAutoModeChange}
                parameters={parameters}
                onOpenDrawer={handleOpenDrawer}
                processingStatus={processingStatus}
              />
            </div>
          </div>

          <div className="p-4 border-t border-border space-y-2">
            <Link
              to={getNotebookPath(project)}
              className="flex h-9 items-center justify-between rounded-md border border-border px-3 text-sm font-medium text-text-main hover:bg-surface-hover transition-colors"
            >
              Open Notebook <ArrowRight size={14} />
            </Link>
            <Link
              to={getAgentPath(project)}
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
                {/* XRD PATTERN - GRAPH FIRST (PRIMARY) */}
                <div className="border border-border/50 bg-surface/30">
                  {/* Tabs */}
                  <div className="flex items-center gap-4 px-3 py-1.5 border-b border-border/50 bg-surface/40">
                    <button 
                      onClick={() => setActiveTab('pattern')}
                      className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                        activeTab === 'pattern' 
                          ? 'text-primary border-b-2 border-primary -mb-px' 
                          : 'text-text-muted hover:text-text-main'
                      }`}
                    >
                      Pattern
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
                        {agentResult.detectedPeaks.length}
                      </span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('referenceOverlay')}
                      className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                        activeTab === 'referenceOverlay' 
                          ? 'text-primary border-b-2 border-primary -mb-px' 
                          : 'text-text-muted hover:text-text-main'
                      }`}
                    >
                      Reference
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary/10 text-primary text-[9px] font-bold px-1">
                        {primaryCandidate?.matches.length ?? 0}/{primaryCandidate?.phase.peaks.length ?? 0}
                      </span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('residual')}
                      className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                        activeTab === 'residual' 
                          ? 'text-primary border-b-2 border-primary -mb-px' 
                          : 'text-text-muted hover:text-text-main'
                      }`}
                      disabled
                    >
                      Residual
                    </button>
                    <button 
                      onClick={() => setActiveTab('rietveld')}
                      className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                        activeTab === 'rietveld' 
                          ? 'text-primary border-b-2 border-primary -mb-px' 
                          : 'text-text-muted hover:text-text-main'
                      }`}
                      disabled
                    >
                      Rietveld
                    </button>
                  </div>
                  
                  {/* Tab Content */}
                  {activeTab === 'pattern' && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-surface/20">
                        <div>
                          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-main">XRD Diffraction Pattern</h3>
                          <p className="text-[9px] text-text-muted mt-0.5">Intensity vs. 2θ with baseline correction and peak identification</p>
                        </div>
                        <span className="text-[9px] font-mono text-text-muted tabular-nums">λ = 1.5406 Å (Cu Kα)</span>
                      </div>
                      
                      {/* Graph */}
                      <div className="h-[420px] w-full min-w-0 px-2 py-2">
                        <Graph
                          type="xrd"
                          height="100%"
                          externalData={selectedDataset.dataPoints}
                          baselineData={agentResult.baselineData}
                          peakMarkers={graphPeakMarkers}
                          showBackground
                          showCalculated={false}
                          showResidual={false}
                        />
                      </div>
                      
                      {/* Info strip under graph */}
                      <div className="mx-3 mb-2 flex items-center gap-2 text-[10px] text-text-muted bg-surface/40 rounded px-2 py-1.5 border border-border/50">
                        <CheckCircle2 size={12} className="text-primary shrink-0" />
                        <span>{agentResult.detectedPeaks.length} peaks detected and indexed to {agentResult.interpretation.primaryPhase} spinel structure.</span>
                      </div>
                    </>
                  )}
                  
                  {activeTab === 'peakList' && (
                    <div className="p-3">
                      <div className="grid grid-cols-[1fr_300px] gap-3">
                        {/* Detected Peaks Table */}
                        <div className="border border-border/40 bg-surface/50 rounded">
                          <div className="px-3 py-2 border-b border-border/30 bg-surface/20">
                            <h3 className="text-sm font-semibold text-text-main">Detected Peaks ({agentResult.detectedPeaks.length})</h3>
                            <p className="text-[10px] text-text-muted mt-0.5">Peak positions, d-spacings, intensities, and Miller indices</p>
                          </div>
                          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full">
                              <thead className="text-[10px] uppercase tracking-wide text-text-muted bg-surface/10 sticky top-0">
                                <tr>
                                  <th className="text-center px-3 py-2 font-medium">#</th>
                                  <th className="text-right px-3 py-2 font-medium">2θ <span className="text-[8px]">(°)</span></th>
                                  <th className="text-right px-3 py-2 font-medium">d <span className="text-[8px]">(Å)</span></th>
                                  <th className="text-right px-3 py-2 font-medium">Intensity</th>
                                  <th className="text-right px-3 py-2 font-medium">hkl</th>
                                </tr>
                              </thead>
                              <tbody>
                                {agentResult.detectedPeaks.map((peak, index) => (
                                  <tr key={peak.id} className="border-t border-border/20 hover:bg-surface/10">
                                    <td className="px-3 py-2 text-center text-text-muted text-sm tabular-nums">{index + 1}</td>
                                    <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{peak.position.toFixed(2)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{peak.dSpacing.toFixed(3)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{peak.intensity.toFixed(0)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-primary text-sm font-medium tabular-nums">{primaryCandidate?.matches.find(m => m.observedPeak.id === peak.id)?.referencePeak.hkl || '-'}</td>
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
                          <div className="px-3 py-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wide text-text-muted">PEAKS</span>
                              <span className="text-sm font-semibold text-text-main tabular-nums">{agentResult.detectedPeaks.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wide text-text-muted">MATCHED</span>
                              <span className="text-sm font-semibold text-text-main tabular-nums">{primaryCandidate?.matches.length ?? 0}/{primaryCandidate?.phase.peaks.length ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wide text-text-muted">SNR</span>
                              <span className="text-sm font-semibold text-emerald-600 tabular-nums">28.7 dB</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wide text-text-muted">UNEXPLAINED</span>
                              <span className={`text-sm font-semibold tabular-nums ${agentResult.conflicts.unexplainedPeaks.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{agentResult.conflicts.unexplainedPeaks.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wide text-text-muted">DATA POINTS</span>
                              <span className="text-sm font-semibold text-text-main tabular-nums">{agentResult.validation.pointCount}</span>
                            </div>
                            <div className="pt-2 border-t border-border/30">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-wide text-text-muted">CONFIDENCE</span>
                                <span className={`text-sm font-semibold tabular-nums ${confidenceClass(agentResult.interpretation.confidenceLevel)}`}>{agentResult.interpretation.confidenceScore.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'referenceOverlay' && (
                    <div className="p-3">
                      <div className="border border-border/40 bg-surface/50 rounded">
                        <div className="px-3 py-2 border-b border-border/30 bg-surface/20">
                          <h3 className="text-sm font-semibold text-text-main">Reference Matching ({primaryCandidate?.matches.length ?? 0}/{primaryCandidate?.phase.peaks.length ?? 0})</h3>
                          <p className="text-[10px] text-text-muted mt-0.5">Comparison of observed peaks with reference pattern</p>
                        </div>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                          <table className="w-full">
                            <thead className="text-[10px] uppercase tracking-wide text-text-muted bg-surface/10 sticky top-0">
                              <tr>
                                <th className="text-right px-3 py-2 font-medium">2θ obs <span className="text-[8px]">(°)</span></th>
                                <th className="text-right px-3 py-2 font-medium">2θ ref <span className="text-[8px]">(°)</span></th>
                                <th className="text-right px-3 py-2 font-medium">Δ2θ <span className="text-[8px]">(°)</span></th>
                                <th className="text-right px-3 py-2 font-medium">hkl</th>
                              </tr>
                            </thead>
                            <tbody>
                              {primaryCandidate?.matches.map((match) => (
                                <tr key={match.observedPeak.id} className="border-t border-border/20 hover:bg-surface/10">
                                  <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{match.observedPeak.position.toFixed(2)}</td>
                                  <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{match.referencePeak.position.toFixed(2)}</td>
                                  <td className="px-3 py-2 font-mono text-right text-text-main text-sm font-medium tabular-nums">{match.delta.toFixed(3)}</td>
                                  <td className="px-3 py-2 font-mono text-right text-primary text-sm font-medium tabular-nums">{match.referencePeak.hkl}</td>
                                </tr>
                              )) || (
                                <tr>
                                  <td colSpan={4} className="px-3 py-3 text-center text-text-muted text-sm">No matches</td>
                                </tr>
                              )}
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
                {/* SCIENTIFIC SUMMARY (COMPRESSED) */}
                <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-[10px] font-semibold uppercase tracking-wide">Scientific Summary</h3>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase ${statusClass(agentResult.interpretation.confidenceLevel === 'low' ? 'warning' : 'complete')}`}>
                      {agentResult.interpretation.confidenceLevel}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Phase Identification */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Phase</p>
                      <p className="text-xs font-bold text-text-main">{agentResult.interpretation.primaryPhase}</p>
                    </div>

                    {/* Key Findings */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Findings</p>
                      <div className="space-y-0.5">
                        {agentResult.interpretation.evidence.slice(0, 2).map((item) => (
                          <div key={item} className="flex gap-1 text-[10px] leading-tight text-text-main">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reliability */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Reliability</p>
                      <p className="text-[10px] text-text-main tabular-nums">
                        {primaryCandidate?.matches.length ?? 0}/{primaryCandidate?.phase.peaks.length ?? 0} matched, {agentResult.conflicts.unexplainedPeaks.length} unexplained
                      </p>
                    </div>
                  </div>
                </div>

                {/* EVIDENCE SNAPSHOT (COMPRESSED) */}
                <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wide mb-1">Evidence (Top 3)</h3>
                  <div className="space-y-1">
                    {primaryCandidate?.matches.slice(0, 3).map((match, index) => (
                      <div key={match.observedPeak.id} className="bg-background/50 p-1 rounded">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wide">#{index + 1}</span>
                          <span className="text-[10px] font-mono text-emerald-600 tabular-nums">{match.referencePeak.hkl}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-[10px]">
                          <div>
                            <span className="text-text-muted text-[8px] uppercase">2θ</span>
                            <div className="font-mono font-semibold text-text-main tabular-nums">{match.observedPeak.position.toFixed(2)}°</div>
                          </div>
                          <div>
                            <span className="text-text-muted text-[8px] uppercase">Δ</span>
                            <div className="font-mono font-semibold text-text-main tabular-nums">{match.delta.toFixed(3)}°</div>
                          </div>
                          <div>
                            <span className="text-text-muted text-[8px] uppercase">Int</span>
                            <div className="font-semibold text-text-main tabular-nums">{match.observedPeak.intensity.toFixed(0)}</div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-[10px] text-text-muted text-center py-1">
                        No matches
                      </div>
                    )}
                  </div>
                </div>

                {/* RECOMMENDED VALIDATION (COMPRESSED) */}
                <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wide mb-1">Validation</h3>
                  <div className="space-y-1">
                    <div className="space-y-0.5">
                      <div className="flex items-start gap-1 text-[10px]">
                        <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span className="text-text-main leading-tight">Raman A1g at 690 cm⁻¹</span>
                      </div>
                      <div className="flex items-start gap-1 text-[10px]">
                        <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span className="text-text-main leading-tight">XPS Cu²⁺/Fe³⁺ states</span>
                      </div>
                      <div className="flex items-start gap-1 text-[10px]">
                        <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span className="text-text-main leading-tight">Multi-tech fusion</span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-border/30">
                      <Link
                        to={getAgentPath(project)}
                        className="flex items-center justify-center gap-1.5 w-full h-6 rounded bg-primary text-white text-[9px] font-semibold uppercase tracking-wide hover:bg-primary/90 transition-colors"
                      >
                        <Sparkles size={10} />
                        Agent Mode
                      </Link>
                    </div>
                  </div>
                </div>

                {/* CAVEATS (SUBTLE) */}
                <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={11} className="text-amber-600" />
                    <h3 className="text-[10px] font-semibold uppercase tracking-wide">Caveats</h3>
                  </div>
                  <div className="space-y-0.5">
                    {agentResult.interpretation.caveats.map((item) => (
                      <div key={item} className="flex gap-1.5 text-[10px] leading-tight text-text-muted">
                        <span className="mt-0.5">•</span>
                        <span>{item}</span>
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
        parameters={activeStep ? (parameters as any)[activeStep] || {} : {}}
        parameterDefinitions={activeStep ? getStepParameterDefinitions('xrd', activeStep) : []}
        onParameterChange={handleParameterChange}
        onApply={handleApplyParameters}
        onReset={handleResetParameters}
        validationErrors={{}}
        previewImpact="Adjust parameters to fine-tune the processing step."
      />
    </DashboardLayout>
  );
}
