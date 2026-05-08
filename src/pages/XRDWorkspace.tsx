import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import {
  XRD_DEMO_DATASETS,
  getXrdDemoDataset,
  getXrdProjectCompatibility,
  type XrdDemoDataset,
} from '../data/xrdDemoDatasets';
import { demoProjects, getNotebookPath, getProject } from '../data/demoProjects';
import { LockedScientificContext } from '../components/locked-context/LockedScientificContext';
import { getLockedContext } from '../data/lockedContext';
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
import {
  createProcessingResultFromXrdDemo,
  saveProcessingResult,
} from '../data/workflowPipeline';

function statusClass(status: 'complete' | 'warning' | 'error') {
  if (status === 'error') return 'border-red-500/30 bg-red-500/10 text-red-700';
  if (status === 'warning') return 'border-amber-500/30 bg-amber-500/10 text-amber-700';
  return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700';
}

function claimStatusClass(status: string) {
  if (status === 'strongly_supported') return 'text-emerald-600';
  if (status === 'supported') return 'text-amber-600';
  if (status === 'partial') return 'text-orange-600';
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

function getCompatibleXrdDatasets(projectId: string): XrdDemoDataset[] {
  const compatibility = getXrdProjectCompatibility(projectId);
  if (!compatibility) return [];

  return compatibility.datasetIds
    .map((datasetId) => XRD_DEMO_DATASETS.find((dataset) => dataset.id === datasetId))
    .filter((dataset): dataset is XrdDemoDataset => Boolean(dataset));
}

function normalizeXrdProjectId(projectId?: string | null) {
  if (projectId === 'fe3o4') return 'fe3o4-nanoparticles';
  return projectId;
}

export default function XRDWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Entry mode detection
  const entryMode = getWorkspaceEntryMode(searchParams, 'xrd');

  // Dataset state
  const [hasDatasetLoaded, setHasDatasetLoaded] = useState(false);
  const [datasetSource, setDatasetSource] = useState<'sample' | 'upload' | 'project' | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');

  const project = getProject(normalizeXrdProjectId(searchParams.get('project')));
  const [selectedProjectId, setSelectedProjectId] = useState(project.id);
  const requestedDatasetId = searchParams.get('dataset') ?? searchParams.get('xrdDataset');
  const datasetFromQuery = getXrdDemoDataset(requestedDatasetId);
  const [selectedDatasetId, setSelectedDatasetId] = useState(requestedDatasetId ?? datasetFromQuery.id);

  // Project-dataset compatibility guard
  const projectCompatibility = getXrdProjectCompatibility(selectedProjectId);
  const compatibleDatasets = useMemo(
    () => getCompatibleXrdDatasets(selectedProjectId),
    [selectedProjectId],
  );
  const selectedDataset = useMemo(
    () => compatibleDatasets.find((dataset) => dataset.id === selectedDatasetId) ?? compatibleDatasets[0] ?? null,
    [compatibleDatasets, selectedDatasetId],
  );
  const hasValidData = Boolean(projectCompatibility && compatibleDatasets.length > 0 && selectedDataset);

  // Tab state for graph section
  const [activeTab, setActiveTab] = useState<'pattern' | 'peakList' | 'referenceOverlay' | 'residual' | 'rietveld'>('pattern');

  // Parameter state management
  const [autoMode, setAutoMode] = useState(true);
  const [parameters, setParameters] = useParameterPersistence('xrd', XRD_DEFAULT_PARAMETERS);

  // Drawer state management
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [workflowFeedback, setWorkflowFeedback] = useState('');

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
    const nextDatasets = getCompatibleXrdDatasets(newProjectId);
    const nextDataset = nextDatasets[0] ?? null;

    if (nextDataset) {
      newParams.set('dataset', nextDataset.id);
      setSelectedDatasetId(nextDataset.id);
      setDatasetName(nextDataset.fileName);
    } else {
      newParams.delete('dataset');
      newParams.delete('xrdDataset');
      setSelectedDatasetId('');
      setDatasetName('No matched dataset');
      setDrawerOpen(false);
      setActiveStep(null);
    }
    setHasDatasetLoaded(true);
    setDatasetSource('project');
    setSearchParams(newParams);
  };

  useEffect(() => {
    setSelectedProjectId(project.id);
  }, [project.id]);

  useEffect(() => {
    if (entryMode?.mode === 'sample') return;

    if (compatibleDatasets.length === 0) {
      setSelectedDatasetId('');
      return;
    }

    const requestedCompatibleDataset = requestedDatasetId
      ? compatibleDatasets.find((dataset) => dataset.id === requestedDatasetId)
      : null;
    setSelectedDatasetId((requestedCompatibleDataset ?? compatibleDatasets[0]).id);
  }, [compatibleDatasets, entryMode?.mode, requestedDatasetId]);

  // Entry mode initialization
  useEffect(() => {
    if (!entryMode) {
      // Project mode - use existing behavior
      setHasDatasetLoaded(true);
      setDatasetSource('project');
      setDatasetName(selectedDataset?.fileName ?? 'No matched dataset');
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
  }, [entryMode, selectedDataset?.fileName]);

  useEffect(() => {
    if (!hasValidData) {
      setDrawerOpen(false);
      setActiveStep(null);
    }
  }, [hasValidData]);

  // Handlers for empty state
  const handleLoadSample = () => {
    const sampleName = getSampleDatasetName('xrd');
    const sampleDataset = getXrdDemoDataset('xrd-cufe2o4-clean');
    setSelectedDatasetId(sampleDataset.id);
    setHasDatasetLoaded(true);
    setDatasetSource('sample');
    setDatasetName(sampleName);
  };

  const handleOpenCuFeDemo = () => {
    const sampleDataset = getXrdDemoDataset('xrd-cufe2o4-clean');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('mode');
    nextParams.delete('xrdDataset');
    nextParams.set('project', 'cu-fe2o4-spinel');
    nextParams.set('dataset', sampleDataset.id);
    setSelectedProjectId('cu-fe2o4-spinel');
    setSelectedDatasetId(sampleDataset.id);
    setHasDatasetLoaded(true);
    setDatasetSource('project');
    setDatasetName(sampleDataset.fileName);
    setSearchParams(nextParams);
  };

  const handleUploadDataset = () => {
    // Upload functionality placeholder
    // In a real implementation, this would:
    // 1. Show file picker
    // 2. Parse CSV/TXT/XY file
    // 3. Validate data format
    // 4. Load into workspace
    alert('Available in the connected beta workflow. Load the demo dataset to try the workspace.');
  };

  // Agent result (recomputes when dataset or parameters change in manual mode)
  const agentResult = useMemo(
    () => {
      if (!hasValidData || !selectedDataset) return null;

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
        // - minDistance: minimum peak separation in 2theta degrees
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
    [hasValidData, selectedDataset, autoMode, parameters],
  );

  // Processing status for XRD steps (updates based on parameters)
  const processingStatus = useMemo(() => {
    const peakCount = agentResult?.detectedPeaks.length ?? 0;
    const candidateCount = agentResult?.candidates.length ?? 0;

    // Build detailed method-aware labels
    const baselineLabel = autoMode
      ? 'Auto ALS baseline, lambda=1e6'
      : `${parameters.baselineCorrection.method}, lambda=${parameters.baselineCorrection.lambda.toExponential(0)}, p=${parameters.baselineCorrection.p}`;

    const smoothingLabel = autoMode
      ? 'Savitzky-Golay window=5'
      : `${parameters.smoothing.method}, window=${parameters.smoothing.window_size}, order=${parameters.smoothing.polynomial_order}`;

    const peakDetectionLabel = autoMode
      ? `${peakCount} peaks, prominence=0.1`
      : `${peakCount} peaks, prominence=${parameters.peakDetection.prominence}, min gap=${parameters.peakDetection.min_distance} deg`;

    const peakFittingLabel = autoMode
      ? 'Pseudo-Voigt fit, tol=1e-4'
      : `${parameters.peakFitting.model}, tol=${parameters.peakFitting.tolerance.toExponential(0)}`;

    const referenceLabel = autoMode
      ? `${candidateCount} candidates, ICDD match`
      : `${candidateCount} candidates, ${parameters.referenceMatching.database}, tolerance=${parameters.referenceMatching.delta_tolerance} deg`;

    return [
      {
        id: 'baselineCorrection',
        label: 'Baseline',
        status: 'complete' as const,
        summary: baselineLabel
      },
      {
        id: 'smoothing',
        label: 'Smooth',
        status: 'complete' as const,
        summary: smoothingLabel
      },
      {
        id: 'peakDetection',
        label: 'Peaks',
        status: 'complete' as const,
        summary: peakDetectionLabel
      },
      {
        id: 'peakFitting',
        label: 'Fit',
        status: 'complete' as const,
        summary: peakFittingLabel
      },
      {
        id: 'referenceMatching',
        label: 'Match',
        status: 'complete' as const,
        summary: referenceLabel
      }
    ];
  }, [autoMode, parameters, agentResult?.detectedPeaks.length, agentResult?.candidates.length]);

  const primaryCandidate = agentResult?.conflicts.primaryCandidate ?? null;

  // Use FusionResult if available, otherwise fall back to interpretation
  const useFusionResult = agentResult?.fusionResult !== undefined;
  const decisionStatus = agentResult
    ? useFusionResult
      ? agentResult.fusionResult?.decision ?? 'No assignment'
      : agentResult.interpretation.primaryPhase
    : 'No assignment';
  const evidenceBasis = agentResult
    ? useFusionResult
      ? agentResult.fusionResult?.basis ?? []
      : agentResult.interpretation.evidence
    : [];
  const limitations = agentResult
    ? useFusionResult
      ? agentResult.fusionResult?.limitations ?? []
      : agentResult.interpretation.caveats
    : [];
  const evidenceStatus =
    agentResult?.interpretation.confidenceLevel === 'high'
      ? 'Supported assignment with validation boundaries'
      : agentResult?.interpretation.confidenceLevel === 'medium'
        ? 'Requires validation'
        : 'Validation-limited';
  const evidenceStatusBadge =
    agentResult?.interpretation.confidenceLevel === 'high'
      ? 'Validation boundaries'
      : evidenceStatus;
  const claimBoundaryText =
    'The observed XRD pattern supports CuFe2O4 spinel phase assignment, with validation still required before publication-level phase-purity claims.';

  const graphPeakMarkers = (agentResult?.detectedPeaks ?? []).map((peak) => {
    // Find HKL assignment from primary candidate
    const match = primaryCandidate?.matches.find(m => m.observedPeak.id === peak.id);
    const hklLabel = match?.referencePeak.hkl || '';

    return {
      position: peak.position,
      intensity: peak.intensity,
      label: hklLabel, // Use HKL label instead of generic peak label
    };
  });
  const canRenderXrdData = Boolean(hasValidData && selectedDataset && agentResult);
  const handleSaveProcessingResult = () => {
    if (!hasValidData || !selectedDataset) {
      setWorkflowFeedback('Requires matched dataset');
      window.setTimeout(() => setWorkflowFeedback(''), 1800);
      return;
    }

    const processingResult = createProcessingResultFromXrdDemo(project.id);
    saveProcessingResult(processingResult);
    setWorkflowFeedback('Processing result saved');
    window.setTimeout(() => setWorkflowFeedback(''), 1800);
  };

  const handleRefineInterpretation = () => {
    if (!hasValidData || !selectedDataset) {
      setWorkflowFeedback('Requires matched dataset');
      window.setTimeout(() => setWorkflowFeedback(''), 1800);
      return;
    }

    const processingResult = createProcessingResultFromXrdDemo(project.id);
    saveProcessingResult(processingResult);
    navigate(`/demo/agent?project=${project.id}&processing=${processingResult.id}&template=research`);
  };

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
        <aside className="w-[280px] shrink-0 border-r border-border bg-surface flex flex-col overflow-y-auto">
          {/* Setup: Title + Project + Dataset */}
          <div className="border-b border-border px-3 py-2">
            <h1 className="text-xs font-bold text-text-main leading-tight">XRD Workspace</h1>
            <p className="text-[9px] text-text-muted leading-tight">Graph-first phase review</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-wider text-text-muted" htmlFor="xrd-project-select">
                  Project
                </label>
                <select
                  id="xrd-project-select"
                  value={selectedProjectId}
                  onChange={(event) => handleProjectChange(event.target.value)}
                  className="mt-0.5 h-6 w-full rounded border border-border bg-background px-1.5 text-[10px] font-medium text-text-main focus:outline-none focus:border-primary"
                >
                  {demoProjects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-wider text-text-muted" htmlFor="xrd-dataset-select">
                  Dataset
                </label>
                <select
                  id="xrd-dataset-select"
                  value={selectedDataset?.id ?? ''}
                  onChange={(event) => setSelectedDatasetId(event.target.value)}
                  disabled={!canRenderXrdData}
                  className="mt-0.5 h-6 w-full rounded border border-border bg-background px-1.5 text-[10px] font-medium text-text-main focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {compatibleDatasets.length > 0 ? (
                    compatibleDatasets.map((dataset) => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.label}
                      </option>
                    ))
                  ) : (
                    <option value="">No matched dataset</option>
                  )}
                </select>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[9px] text-text-muted">
              <Database size={10} className="shrink-0" />
              {canRenderXrdData ? (
                <>
                  <span className="truncate">{selectedDataset?.fileName}</span>
                  <span className="text-text-muted/60">/</span>
                  <span className="truncate">{project.material}</span>
                </>
              ) : (
                <span className="text-amber-600">No matched XRD dataset for this project</span>
              )}
            </div>
          </div>

          {canRenderXrdData ? (
            <>
              {/* Processing Status: single-line inline chips */}
              <div className="border-b border-border px-3 py-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-primary">Status:</span>
                  {processingStatus.map((step) => (
                    <span key={step.id} className="inline-flex items-center gap-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-1 py-px text-[8px] font-medium text-emerald-700">
                      <CheckCircle2 size={8} className="shrink-0" />
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Manual Processing: compact variant */}
              <div className="border-b border-border px-2.5 py-1.5">
                <ProcessingPipeline
                  technique="xrd"
                  autoMode={autoMode}
                  onAutoModeChange={handleAutoModeChange}
                  parameters={parameters}
                  onOpenDrawer={handleOpenDrawer}
                  processingStatus={processingStatus}
                  compact
                />
              </div>

              {/* Evidence: compact summary */}
              <div className="border-b border-border px-3 py-1.5">
                <div className="text-[10px] font-bold text-emerald-700">Evidence Ready</div>
                <div className="mt-0.5 text-[9px] text-text-muted leading-snug">
                  <span>Peaks: {agentResult?.detectedPeaks.length ?? 0}</span>
                  <span className="mx-1">/</span>
                  <span>{decisionStatus}</span>
                </div>
                <div className="text-[9px] text-text-muted">{evidenceStatus}</div>
                <div className="text-[9px] font-semibold text-text-main">Next: Refine</div>
                {workflowFeedback && (
                  <div className="mt-0.5 text-[10px] font-semibold text-primary">{workflowFeedback}</div>
                )}
              </div>

              {/* Locked Scientific Context */}
              {(() => {
                const lockedContext = getLockedContext(project.id);
                return lockedContext ? (
                  <div className="border-b border-border px-3 py-1.5">
                    <LockedScientificContext
                      sampleIdentity={lockedContext.sampleIdentity}
                      technique={lockedContext.technique}
                      sourceDataset={lockedContext.sourceDataset}
                      sourceProcessingPath={lockedContext.sourceProcessingPath}
                      referenceScope={lockedContext.referenceScope}
                      claimBoundary={lockedContext.claimBoundary}
                      variant="compact"
                    />
                  </div>
                ) : null;
              })()}

              {/* Actions: compact row */}
              <div className="px-2.5 py-1.5 space-y-1 shrink-0">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={handleSaveProcessingResult}
                    className="flex h-6 items-center justify-center rounded border border-border px-1.5 text-[10px] font-medium text-text-main transition-colors hover:bg-surface-hover"
                  >
                    Save
                  </button>
                  <Link
                    to={getNotebookPath(project)}
                    className="flex h-6 items-center justify-center rounded border border-border px-1.5 text-[10px] font-medium text-text-main transition-colors hover:bg-surface-hover"
                  >
                    Notebook
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={handleRefineInterpretation}
                  className="flex h-6 w-full items-center justify-center rounded bg-primary px-2 text-[10px] font-medium text-white transition-colors hover:bg-primary/90"
                >
                  Refine Interpretation <ArrowRight size={11} className="ml-1" />
                </button>
              </div>
            </>
          ) : (
            /* No valid data: disabled left rail */
            <div className="flex-1 flex flex-col items-center justify-center px-3 py-4 text-center">
              <AlertTriangle size={18} className="text-amber-500 mb-2" />
              <p className="text-[10px] font-semibold text-text-main leading-tight">Status: Requires dataset</p>
              <p className="mt-1 text-[9px] text-text-muted leading-snug">
                Evidence: No evidence generated. Manual processing requires a matched XRD dataset.
              </p>
              <div className="mt-2 grid w-full grid-cols-2 gap-1">
                <button
                  type="button"
                  disabled
                  title="Requires matched dataset before saving."
                  className="flex h-6 items-center justify-center rounded border border-border px-1.5 text-[9px] font-medium text-text-muted opacity-50"
                >
                  Save disabled
                </button>
                <button
                  type="button"
                  disabled
                  title="Requires matched dataset before refinement."
                  className="flex h-6 items-center justify-center rounded border border-border px-1.5 text-[9px] font-medium text-text-muted opacity-50"
                >
                  Refine disabled
                </button>
              </div>
              <button
                type="button"
                onClick={handleOpenCuFeDemo}
                className="mt-2 flex h-6 items-center justify-center rounded bg-primary px-2.5 text-[10px] font-medium text-white transition-colors hover:bg-primary/90"
              >
                Open CuFe2O4 demo
              </button>
            </div>
          )}
        </aside>

        {/* CENTER COLUMN */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-border">
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-3">
              {canRenderXrdData ? (
                <>
                {/* XRD PATTERN - GRAPH FIRST (PRIMARY) */}
                <div className="border border-border/50 bg-surface/30">
                  {/* Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-surface/40 px-3 py-1.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
                        className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                          activeTab === 'peakList'
                            ? 'text-primary border-b-2 border-primary -mb-px'
                            : 'text-text-muted hover:text-text-main'
                        }`}
                      >
                        Peaks
                        <span className="inline-flex h-[17px] min-w-[18px] items-center justify-center rounded-full bg-primary/10 px-1 text-[9px] font-bold text-primary">
                          {agentResult?.detectedPeaks.length ?? 0}
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveTab('referenceOverlay')}
                        className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                          activeTab === 'referenceOverlay'
                            ? 'text-primary border-b-2 border-primary -mb-px'
                            : 'text-text-muted hover:text-text-main'
                        }`}
                      >
                        Match
                        <span className="inline-flex h-[17px] min-w-[18px] items-center justify-center rounded-full bg-primary/10 px-1 text-[9px] font-bold text-primary">
                          {primaryCandidate?.matches.length ?? 0}/{primaryCandidate?.phase.peaks.length ?? 0}
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveTab('residual')}
                        className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          activeTab === 'residual'
                            ? 'text-primary border-b-2 border-primary -mb-px'
                            : 'text-text-muted hover:text-text-main'
                        }`}
                        disabled
                        title="Requires processed residual evidence before export."
                      >
                        Residual
                      </button>
                      <button
                        onClick={() => setActiveTab('rietveld')}
                        className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          activeTab === 'rietveld'
                            ? 'text-primary border-b-2 border-primary -mb-px'
                            : 'text-text-muted hover:text-text-main'
                        }`}
                        disabled
                        title="Rietveld refinement is available in the connected beta workflow."
                      >
                        Rietveld
                      </button>
                    </div>
                    <span className="inline-flex max-w-full items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
                      {evidenceStatusBadge}
                    </span>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'pattern' && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface/20 px-3 py-2">
                        <div>
                          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-main">XRD Diffraction Pattern</h3>
                          <p className="mt-0.5 text-[9px] text-text-muted">Intensity vs. 2theta with baseline and peak markers</p>
                        </div>
                        <span className="text-[9px] font-mono text-text-muted tabular-nums">lambda = 1.5406 A (Cu K-alpha)</span>
                      </div>

                      {/* Graph */}
                      <div className="h-[clamp(340px,50vh,460px)] w-full min-w-0 px-2 py-2">
                        <Graph
                          type="xrd"
                          height="100%"
                          externalData={selectedDataset?.dataPoints ?? []}
                          baselineData={agentResult?.baselineData ?? []}
                          peakMarkers={graphPeakMarkers}
                          showBackground
                          showCalculated={false}
                          showResidual={false}
                        />
                      </div>

                      {/* Info strip under graph */}
                      <div className="mx-3 mb-2 flex items-start gap-2 rounded border border-border/50 bg-surface/40 px-2 py-1.5 text-[10px] text-text-muted">
                        <CheckCircle2 size={12} className="text-primary shrink-0" />
                        <span>{claimBoundaryText}</span>
                      </div>
                    </>
                  )}

                  {activeTab === 'peakList' && (
                    <div className="p-3">
                      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_260px]">
                        {/* Detected Peaks Table */}
                        <div className="border border-border/40 bg-surface/50 rounded">
                          <div className="px-3 py-2 border-b border-border/30 bg-surface/20">
                            <h3 className="text-sm font-semibold text-text-main">Detected Peaks ({agentResult?.detectedPeaks.length ?? 0})</h3>
                            <p className="text-[10px] text-text-muted mt-0.5">Peak positions, d-spacings, intensities, and Miller indices</p>
                          </div>
                          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full">
                              <thead className="text-[10px] uppercase tracking-wide text-text-muted bg-surface/10 sticky top-0">
                                <tr>
                                  <th className="text-center px-3 py-2 font-medium">#</th>
                                  <th className="text-right px-3 py-2 font-medium">2theta <span className="text-[8px]">(deg)</span></th>
                                  <th className="text-right px-3 py-2 font-medium">d <span className="text-[8px]">(A)</span></th>
                                  <th className="text-right px-3 py-2 font-medium">Intensity</th>
                                  <th className="text-right px-3 py-2 font-medium">hkl</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(agentResult?.detectedPeaks ?? []).map((peak, index) => (
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
                              <span className="text-sm font-semibold text-text-main tabular-nums">{agentResult?.detectedPeaks.length ?? 0}</span>
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
                              <span className={`text-sm font-semibold tabular-nums ${(agentResult?.conflicts.unexplainedPeaks.length ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{agentResult?.conflicts.unexplainedPeaks.length ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wide text-text-muted">DATA POINTS</span>
                              <span className="text-sm font-semibold text-text-main tabular-nums">{agentResult?.validation.pointCount ?? 0}</span>
                            </div>
                            <div className="pt-2 border-t border-border/30">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-wide text-text-muted">EVIDENCE STATUS</span>
                                <span className={`text-sm font-semibold tabular-nums ${
                                  agentResult?.interpretation.confidenceLevel === 'high' ? 'text-emerald-600' :
                                  agentResult?.interpretation.confidenceLevel === 'medium' ? 'text-amber-600' :
                                  'text-red-600'
                                }`}>
                                  {agentResult?.interpretation.confidenceLevel === 'high' ? 'Supported' :
                                   agentResult?.interpretation.confidenceLevel === 'medium' ? 'Requires validation' :
                                   'Validation-limited'}
                                </span>
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
                                <th className="text-right px-3 py-2 font-medium">2theta obs <span className="text-[8px]">(deg)</span></th>
                                <th className="text-right px-3 py-2 font-medium">2theta ref <span className="text-[8px]">(deg)</span></th>
                                <th className="text-right px-3 py-2 font-medium">delta 2theta <span className="text-[8px]">(deg)</span></th>
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
                </>
              ) : (
                /* No valid data: empty center state */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertTriangle size={28} className="text-amber-500 mb-3" />
                  <h2 className="text-sm font-semibold text-text-main">No processed XRD dataset for this project</h2>
                  <p className="mt-1 max-w-sm text-[11px] text-text-muted leading-relaxed">
                    This project does not yet have a matched XRD processing result. Load a compatible dataset or open the CuFe2O4 demo sample to review the full workflow.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenCuFeDemo}
                      className="flex h-7 items-center justify-center rounded bg-primary px-3 text-[11px] font-medium text-white transition-colors hover:bg-primary/90"
                    >
                      Open CuFe2O4 demo
                    </button>
                    <Link
                      to="/dashboard"
                      className="flex h-7 items-center justify-center rounded border border-border px-3 text-[11px] font-medium text-text-main transition-colors hover:bg-surface-hover"
                    >
                      Back to Dashboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[320px] shrink-0 overflow-y-auto border-r border-border bg-surface flex flex-col">
          <div className="space-y-2 p-3">
            {canRenderXrdData ? (
              <>
                {/* CHARACTERIZATION OVERVIEW (COMPRESSED) */}
                <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-[10px] font-semibold uppercase tracking-wide">Interpretation</h3>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase ${statusClass(agentResult?.interpretation.confidenceLevel === 'low' ? 'warning' : 'complete')}`}>
                      {evidenceStatusBadge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Phase Identification */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Working assignment</p>
                      <p className="text-xs font-bold text-text-main">{decisionStatus}</p>
                    </div>

                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Claim boundary</p>
                      <p className="text-[10px] leading-tight text-text-main">{claimBoundaryText}</p>
                    </div>

                    {/* Key Findings */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Findings</p>
                      <div className="space-y-0.5">
                        {evidenceBasis.slice(0, 2).map((item) => (
                          <div key={item} className="flex gap-1 text-[10px] leading-tight text-text-main">
                            <span className="text-primary mt-0.5">-</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reliability */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">Reliability</p>
                      <p className="text-[10px] text-text-main tabular-nums">
                        {primaryCandidate?.matches.length ?? 0}/{primaryCandidate?.phase.peaks.length ?? 0} matched, {agentResult?.conflicts.unexplainedPeaks.length ?? 0} unexplained
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
                            <span className="text-text-muted text-[8px] uppercase">2theta</span>
                            <div className="font-mono font-semibold text-text-main tabular-nums">{match.observedPeak.position.toFixed(2)} deg</div>
                          </div>
                          <div>
                            <span className="text-text-muted text-[8px] uppercase">Delta</span>
                            <div className="font-mono font-semibold text-text-main tabular-nums">{match.delta.toFixed(3)} deg</div>
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
                  <h3 className="text-[10px] font-semibold uppercase tracking-wide mb-1">Validation Required</h3>
                  <div className="space-y-1">
                    <div className="space-y-0.5">
                      <div className="flex items-start gap-1 text-[10px]">
                        <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span className="text-text-main leading-tight">Raman A1g at 690 cm-1</span>
                      </div>
                      <div className="flex items-start gap-1 text-[10px]">
                        <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span className="text-text-main leading-tight">XPS Cu2+/Fe3+ states</span>
                      </div>
                      <div className="flex items-start gap-1 text-[10px]">
                        <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span className="text-text-main leading-tight">Multi-tech fusion</span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-border/30">
                      <button
                        type="button"
                        onClick={handleRefineInterpretation}
                        className="flex items-center justify-center gap-1.5 w-full h-6 rounded bg-primary text-white text-[9px] font-semibold uppercase tracking-wide hover:bg-primary/90 transition-colors"
                      >
                        <Sparkles size={10} />
                        Refine Interpretation
                      </button>
                    </div>
                  </div>
                </div>

                {/* LIMITATIONS (SUBTLE) */}
                <div className="border border-border/40 bg-surface/50 px-2 py-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={11} className="text-amber-600" />
                    <h3 className="text-[10px] font-semibold uppercase tracking-wide">Validation Limits</h3>
                  </div>
                  <div className="space-y-0.5">
                    {limitations.map((item) => (
                      <div key={item} className="flex gap-1.5 text-[10px] leading-tight text-text-muted">
                        <span className="mt-0.5">-</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* No valid data: empty right sidebar */
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle size={18} className="text-amber-500 mb-2" />
                <p className="text-[10px] font-semibold text-text-main leading-tight">No interpretation available</p>
                <p className="mt-1 text-[9px] text-text-muted leading-snug">
                  No matched processing result for this project.
                </p>
              </div>
            )}
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
