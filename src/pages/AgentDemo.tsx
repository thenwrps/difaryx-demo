import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Database,
  Download,
  FileText,
  FlaskConical,
  Grid3X3,
  Layers,
  Loader2,
  Microscope,
  Play,
  Target,
  Terminal,
} from 'lucide-react';
import { Graph } from '../components/ui/Graph';
import { runXrdPhaseIdentificationAgent } from '../agents/xrdAgent';
import {
  demoProjects,
  getProject,
  getProjectDatasets,
  saveAgentRunResult,
} from '../data/demoProjects';
import type {
  AgentRunResult,
  DemoDataset,
  DemoPeak,
  DemoProject,
  Technique,
} from '../data/demoProjects';
import { generateRunId, saveRun, type AgentRun } from '../data/runModel';
import { buildEvidencePacket } from '../agent/mcp/evidencePacket';
import { callReasoningAPI } from '../server/api/reasoning';
import { getProviderStatus } from '../server/llm/router';
import type { ReasoningOutput, ToolResult } from '../agent/mcp/types';
import {
  createNotebookEntryFromRefinement,
  createProcessingResultFromXrdDemo,
  getLatestProcessingResult,
  getProcessingResult,
  normalizeNotebookTemplateMode,
  refineDiscussionFromProcessing,
  saveAgentDiscussionRefinement,
  saveNotebookEntry,
  saveProcessingResult,
} from '../data/workflowPipeline';
import { LeftSidebar } from '../components/agent-demo/LeftSidebar';
import { MainHeader } from '../components/agent-demo/MainHeader';
import { CenterColumn } from '../components/agent-demo/CenterColumn';
import { RightPanel } from '../components/agent-demo/RightPanel';
import { evaluate as evaluateFusionEngine, createEvidenceNodes, type EvidenceNode, type FusionResult, type PeakInput } from '../engines/fusionEngine';
import {
  getLatestExperimentConditionLock,
} from '../data/experimentConditionLock';

type AgentContext = Technique;
type ModelMode = 'deterministic' | 'vertex-gemini' | 'gemma';
type ExecutionMode = 'auto' | 'step';
type ReasoningStepStatus = 'pending' | 'running' | 'complete';
type RunStatus = 'idle' | 'running' | 'complete';
type ToolStatus = ReasoningStepStatus | 'error';
type GraphType = 'xrd' | 'xps' | 'ftir' | 'raman';
type LogType = 'system' | 'tool' | 'success' | 'info';

type ExecutionLogEntry = {
  stamp: string;
  message: string;
  type: LogType;
};

type ToolTraceEntry = {
  id: string;
  timestamp: string;
  context: AgentContext;
  toolName: string;
  displayName: string;
  provider?: ModelMode;
  status: ToolStatus;
  inputSummary: string;
  outputSummary: string;
  durationMs: number;
  canInsertLlmReasoningAfter?: boolean;
};

type StageTemplate = {
  id: string;
  label: string;
  shortLabel: string;
  detail: string;
  toolName: string;
  displayName: string;
  inputSummary: string;
  outputSummary: string;
  durationMs: number;
  canInsertLlmReasoningAfter?: boolean;
};

type DecisionResult = {
  runId: string;
  primaryResult: string;
  subtitle: string;
  reasoningTrace: FusionResult['reasoningTrace'];
  conclusion: string;
  basis: string[];
  crossTech: string;
  limitations: string[];
  decision: string;
  highlightedEvidenceIds: string[];
  metrics: Array<{ label: string; value: string; tone?: 'cyan' | 'emerald' | 'violet' | 'amber' }>;
  detailRows: Array<Record<string, string | number>>;
};

type AgentDemoState = {
  context: AgentContext;
  datasetId: string;
  modelMode: ModelMode;
  graphState: {
    showMarkers: boolean;
  };
  reasoningState: {
    status: RunStatus;
    currentStepIndex: number;
    executionMode: ExecutionMode;
    result: DecisionResult | null;
    logs: ExecutionLogEntry[];
  };
  toolTrace: ToolTraceEntry[];
  llmState: {
    output: ReasoningOutput | null;
    usedLlm: boolean;
    fallbackUsed: boolean;
  };
};

type DatasetOption = {
  dataset: DemoDataset;
  project: DemoProject;
};

const DEFAULT_MISSION =
  'Investigate the selected scientific dataset and produce an evidence-linked material characterization interpretation.';

const MODEL_MODE_LABELS: Record<ModelMode, string> = {
  deterministic: 'Deterministic Workflow',
  'vertex-gemini': 'Model Layer Pending',
  gemma: 'Open Model Pending',
};

const CONTEXT_ORDER: AgentContext[] = ['XRD', 'XPS', 'FTIR', 'Raman'];

const CONTEXT_CONFIG: Record<
  AgentContext,
  {
    label: string;
    graphType: GraphType;
    featureName: string;
    decisionKind: string;
    iconTone: string;
    stages: StageTemplate[];
    defaultFeatureCount: number;
  }
> = {
  XRD: {
    label: 'XRD Phase Identification',
    graphType: 'xrd',
    featureName: 'Diffraction peaks',
    decisionKind: 'Phase interpretation',
    iconTone: 'text-cyan-300',
    defaultFeatureCount: 9,
    stages: [
      {
        id: 'dataset',
        label: 'Load Dataset',
        shortLabel: 'Dataset',
        detail: 'Loading diffraction spectrum and scan metadata.',
        toolName: 'load_xrd_dataset',
        displayName: 'Load XRD Dataset',
        inputSummary: '2theta-intensity spectrum',
        outputSummary: 'Spectrum loaded and checked',
        durationMs: 560,
      },
      {
        id: 'features',
        label: 'Peak Detection',
        shortLabel: 'Features',
        detail: 'Calling deterministic peak detector on the active spectrum.',
        toolName: 'detect_xrd_peaks',
        displayName: 'Detect XRD Peaks',
        inputSummary: 'Baseline-corrected XRD trace',
        outputSummary: 'Diffraction peaks detected',
        durationMs: 640,
      },
      {
        id: 'search',
        label: 'Candidate Search',
        shortLabel: 'Search',
        detail: 'Searching compact reference patterns for compatible phases.',
        toolName: 'search_phase_database',
        displayName: 'Search Phase Database',
        inputSummary: 'Observed peak positions',
        outputSummary: 'Candidate phase references retrieved',
        durationMs: 680,
      },
      {
        id: 'score',
        label: 'Evaluate Candidates',
        shortLabel: 'Evaluating',
        detail: 'Evaluating candidates by structural consistency and evidence relations.',
        toolName: 'evaluate_phase_candidates',
        displayName: 'Evaluate Phase Candidates',
        inputSummary: 'Observed peaks and candidate references',
        outputSummary: 'Candidate evaluation prepared',
        durationMs: 620,
      },
      {
        id: 'fusion',
        label: 'Evidence Fusion',
        shortLabel: 'Fusion',
        detail: 'Evaluating missing and unexplained peak evidence before claim boundary review.',
        toolName: 'analyze_peak_conflicts',
        displayName: 'Analyze Peak Conflicts',
        inputSummary: 'Ranked candidates and unexplained features',
        outputSummary: 'Conflict analysis prepared',
        durationMs: 580,
        canInsertLlmReasoningAfter: true,
      },
      {
        id: 'ai_interpretation',
        label: 'Interpretation',
        shortLabel: 'Interpret',
        detail: 'Preparing interpretation for multi-source evidence.',
        toolName: 'interpretation_refinement',
        displayName: 'Agent Interpreter',
        inputSummary: 'Aggregated evidence from deterministic analysis',
        outputSummary: 'Interpretation generated',
        durationMs: 720,
      },
      {
        id: 'decision',
        label: 'Claim Boundary Review',
        shortLabel: 'Boundary',
        detail: 'Synthesizing phase evidence into a bounded interpretation.',
        toolName: 'generate_xrd_interpretation',
        displayName: 'Generate XRD Interpretation',
        inputSummary: 'Evaluation results, evidence, conflicts, and caveats',
        outputSummary: 'Report-ready discussion prepared',
        durationMs: 620,
      },
    ],
  },
  XPS: {
    label: 'XPS Surface Chemistry',
    graphType: 'xps',
    featureName: 'Core-level components',
    decisionKind: 'Surface chemistry interpretation',
    iconTone: 'text-violet-300',
    defaultFeatureCount: 5,
    stages: [
      {
        id: 'dataset',
        label: 'Load Dataset',
        shortLabel: 'Dataset',
        detail: 'Loading binding-energy spectrum and acquisition metadata.',
        toolName: 'load_xps_spectrum',
        displayName: 'Load XPS Spectrum',
        inputSummary: 'Binding-energy intensity spectrum',
        outputSummary: 'XPS spectrum loaded',
        durationMs: 560,
      },
      {
        id: 'background',
        label: 'Background Model',
        shortLabel: 'Process',
        detail: 'Applying deterministic background and envelope checks.',
        toolName: 'subtract_xps_background',
        displayName: 'Subtract XPS Background',
        inputSummary: 'Raw survey and core-level envelope',
        outputSummary: 'Background-adjusted signal prepared',
        durationMs: 620,
      },
      {
        id: 'components',
        label: 'Component Detection',
        shortLabel: 'Features',
        detail: 'Detecting diagnostic Cu, Fe, O, or Co/Ni component regions.',
        toolName: 'detect_core_level_components',
        displayName: 'Detect Core-Level Components',
        inputSummary: 'Processed XPS spectrum',
        outputSummary: 'Core-level components detected',
        durationMs: 650,
      },
      {
        id: 'assignment',
        label: 'Chemistry Assignment',
        shortLabel: 'Assign',
        detail: 'Mapping components to oxidation-state and surface chemistry evidence.',
        toolName: 'assign_oxidation_states',
        displayName: 'Assign Oxidation States',
        inputSummary: 'Detected component windows',
        outputSummary: 'Surface chemistry candidates ranked',
        durationMs: 600,
      },
      {
        id: 'fusion',
        label: 'Evidence Fusion',
        shortLabel: 'Fusion',
        detail: 'Checking whether surface evidence supports the active material system.',
        toolName: 'evaluate_surface_evidence',
        displayName: 'Evaluate Surface Evidence',
        inputSummary: 'Assignments, project context, and known limitations',
        outputSummary: 'Surface evidence fused',
        durationMs: 580,
        canInsertLlmReasoningAfter: true,
      },
      {
        id: 'ai_interpretation',
        label: 'Interpretation',
        shortLabel: 'Interpret',
        detail: 'Preparing interpretation for multi-source evidence.',
        toolName: 'interpretation_refinement',
        displayName: 'Agent Interpreter',
        inputSummary: 'Aggregated evidence from deterministic analysis',
        outputSummary: 'Interpretation generated',
        durationMs: 720,
      },
      {
        id: 'decision',
        label: 'Claim Boundary Review',
        shortLabel: 'Boundary',
        detail: 'Generating a surface-chemistry interpretation with validation boundaries.',
        toolName: 'decision_logic',
        displayName: 'Generate Surface Interpretation',
        inputSummary: 'Evidence summary and limitations',
        outputSummary: 'Report-ready discussion prepared',
        durationMs: 620,
      },
    ],
  },
  FTIR: {
    label: 'FTIR Bonding Analysis',
    graphType: 'ftir',
    featureName: 'Vibrational bands',
    decisionKind: 'Bonding interpretation',
    iconTone: 'text-rose-300',
    defaultFeatureCount: 4,
    stages: [
      {
        id: 'dataset',
        label: 'Load Dataset',
        shortLabel: 'Dataset',
        detail: 'Loading transmittance spectrum and sample metadata.',
        toolName: 'load_ftir_spectrum',
        displayName: 'Load FTIR Spectrum',
        inputSummary: 'Wavenumber-transmittance spectrum',
        outputSummary: 'FTIR spectrum loaded',
        durationMs: 540,
      },
      {
        id: 'baseline',
        label: 'Baseline Check',
        shortLabel: 'Process',
        detail: 'Checking deterministic baseline and band windows.',
        toolName: 'correct_ftir_baseline',
        displayName: 'Correct FTIR Baseline',
        inputSummary: 'Raw FTIR trace',
        outputSummary: 'Baseline-adjusted trace prepared',
        durationMs: 600,
      },
      {
        id: 'bands',
        label: 'Band Detection',
        shortLabel: 'Features',
        detail: 'Detecting diagnostic metal-oxygen and surface bands.',
        toolName: 'detect_ftir_bands',
        displayName: 'Detect FTIR Bands',
        inputSummary: 'Processed FTIR spectrum',
        outputSummary: 'Vibrational bands detected',
        durationMs: 640,
      },
      {
        id: 'assignment',
        label: 'Mode Assignment',
        shortLabel: 'Assign',
        detail: 'Assigning bands to lattice, support, and surface contributions.',
        toolName: 'assign_vibrational_modes',
        displayName: 'Assign Vibrational Modes',
        inputSummary: 'Detected band positions',
        outputSummary: 'Band assignments generated',
        durationMs: 620,
      },
      {
        id: 'fusion',
        label: 'Evidence Fusion',
        shortLabel: 'Fusion',
        detail: 'Evaluating whether bonding evidence supports the material system.',
        toolName: 'evaluate_bonding_evidence',
        displayName: 'Evaluate Bonding Evidence',
        inputSummary: 'Band assignments and material context',
        outputSummary: 'Bonding evidence fused',
        durationMs: 580,
        canInsertLlmReasoningAfter: true,
      },
      {
        id: 'ai_interpretation',
        label: 'Interpretation',
        shortLabel: 'Interpret',
        detail: 'Preparing interpretation for multi-source evidence.',
        toolName: 'interpretation_refinement',
        displayName: 'Agent Interpreter',
        inputSummary: 'Aggregated evidence from deterministic analysis',
        outputSummary: 'Interpretation generated',
        durationMs: 720,
      },
      {
        id: 'decision',
        label: 'Claim Boundary Review',
        shortLabel: 'Boundary',
        detail: 'Generating a bonding interpretation with validation boundaries.',
        toolName: 'decision_logic',
        displayName: 'Generate Bonding Interpretation',
        inputSummary: 'Evidence summary and caveats',
        outputSummary: 'Report-ready discussion prepared',
        durationMs: 620,
      },
    ],
  },
  Raman: {
    label: 'Raman Structural Fingerprint',
    graphType: 'raman',
    featureName: 'Raman modes',
    decisionKind: 'Structural fingerprint interpretation',
    iconTone: 'text-emerald-300',
    defaultFeatureCount: 6,
    stages: [
      {
        id: 'dataset',
        label: 'Load Dataset',
        shortLabel: 'Dataset',
        detail: 'Loading Raman shift spectrum and sample metadata.',
        toolName: 'load_raman_spectrum',
        displayName: 'Load Raman Spectrum',
        inputSummary: 'Raman shift-intensity spectrum',
        outputSummary: 'Raman spectrum loaded',
        durationMs: 540,
      },
      {
        id: 'preprocess',
        label: 'Signal Check',
        shortLabel: 'Process',
        detail: 'Applying deterministic smoothing and fluorescence-background checks.',
        toolName: 'preprocess_raman_signal',
        displayName: 'Preprocess Raman Signal',
        inputSummary: 'Raw Raman trace',
        outputSummary: 'Processed Raman trace prepared',
        durationMs: 600,
      },
      {
        id: 'modes',
        label: 'Mode Detection',
        shortLabel: 'Features',
        detail: 'Detecting structural modes and broad carbon/support bands.',
        toolName: 'detect_raman_modes',
        displayName: 'Detect Raman Modes',
        inputSummary: 'Processed Raman spectrum',
        outputSummary: 'Raman modes detected',
        durationMs: 650,
      },
      {
        id: 'fingerprint',
        label: 'Fingerprint Match',
        shortLabel: 'Match',
        detail: 'Matching mode pattern against structural fingerprints.',
        toolName: 'match_structural_fingerprint',
        displayName: 'Match Structural Fingerprint',
        inputSummary: 'Detected mode positions',
        outputSummary: 'Structural fingerprints ranked',
        durationMs: 620,
      },
      {
        id: 'fusion',
        label: 'Evidence Fusion',
        shortLabel: 'Fusion',
        detail: 'Checking whether fingerprint evidence supports the material family.',
        toolName: 'evaluate_structural_evidence',
        displayName: 'Evaluate Structural Evidence',
        inputSummary: 'Mode assignments and material context',
        outputSummary: 'Structural evidence fused',
        durationMs: 580,
        canInsertLlmReasoningAfter: true,
      },
      {
        id: 'ai_interpretation',
        label: 'Interpretation',
        shortLabel: 'Interpret',
        detail: 'Preparing interpretation for multi-source evidence.',
        toolName: 'interpretation_refinement',
        displayName: 'Agent Interpreter',
        inputSummary: 'Aggregated evidence from deterministic analysis',
        outputSummary: 'Interpretation generated',
        durationMs: 720,
      },
      {
        id: 'decision',
        label: 'Claim Boundary Review',
        shortLabel: 'Boundary',
        detail: 'Generating a structural interpretation with validation boundaries.',
        toolName: 'decision_logic',
        displayName: 'Generate Structural Interpretation',
        inputSummary: 'Evidence summary and limitations',
        outputSummary: 'Report-ready discussion prepared',
        durationMs: 620,
      },
    ],
  },
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Convert detected XRD peaks to PeakInput format for fusionEngine
 */
function convertXrdPeaksToPeakInput(
  detectedPeaks: DemoPeak[],
): PeakInput[] {
  return detectedPeaks.map((peak, index) => ({
    id: `xrd-peak-${index}`,
    position: peak.position,
    intensity: peak.intensity,
    label: peak.label,
    hkl: peak.hkl,
  }));
}

/**
 * Convert demo dataset features to PeakInput format for fusionEngine
 */
function convertDatasetFeaturesToPeakInput(
  dataset: DemoDataset,
): PeakInput[] {
  return dataset.detectedFeatures.map((feature, index) => ({
    id: `${dataset.id}-feature-${index}`,
    position: feature.position,
    intensity: feature.intensity,
    label: feature.label || `Feature at ${feature.position.toFixed(1)}`,
  }));
}

function getUnitForTechnique(technique: Technique): string {
  switch (technique) {
    case 'XRD': return '2θ';
    case 'Raman': return 'cm⁻¹';
    case 'FTIR': return 'cm⁻¹';
    case 'XPS': return 'eV';
    default: return '';
  }
}

function contextToGraphType(context: AgentContext): GraphType {
  return CONTEXT_CONFIG[context].graphType;
}

function getDatasetOptions(context: AgentContext): DatasetOption[] {
  return demoProjects.flatMap((project) =>
    getProjectDatasets(project.id)
      .filter((dataset) => dataset.technique === context)
      .map((dataset) => ({ project, dataset })),
  );
}

function getDefaultContext(projectId?: string | null): AgentContext {
  const project = getProject(projectId);
  return project.techniques.find((technique) => CONTEXT_ORDER.includes(technique)) ?? 'XRD';
}

function getDefaultDatasetId(context: AgentContext, projectId?: string | null) {
  const options = getDatasetOptions(context);
  const projectMatch = options.find((option) => option.project.id === projectId);
  return projectMatch?.dataset.id ?? options[0]?.dataset.id ?? '';
}

function getDatasetOption(context: AgentContext, datasetId: string): DatasetOption {
  const options = getDatasetOptions(context);
  return options.find((option) => option.dataset.id === datasetId) ?? options[0];
}

function makeInitialState(projectId?: string | null): AgentDemoState {
  const context = getDefaultContext(projectId);
  const datasetId = getDefaultDatasetId(context, projectId);

  return {
    context,
    datasetId,
    modelMode: 'deterministic',
    graphState: {
      showMarkers: false,
    },
    reasoningState: {
      status: 'idle',
      currentStepIndex: -1,
      executionMode: 'auto',
      result: null,
      logs: [],
    },
    toolTrace: createToolTrace(context),
    llmState: {
      output: null,
      usedLlm: false,
      fallbackUsed: false,
    },
  };
}

function formatStamp(index: number) {
  return `00:${String(2 + index * 4).padStart(2, '0')}`;
}

function mapToolTraceToExecutionSteps(
  toolTrace: ToolTraceEntry[],
  stages: StageTemplate[],
): Array<{
  number: number;
  title: string;
  description: string;
  tool: string;
  time: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}> {
  return toolTrace.map((entry, index) => ({
    number: index + 1,
    title: stages[index]?.label || entry.displayName,
    description: stages[index]?.detail || entry.inputSummary,
    tool: entry.displayName,
    time: `${(entry.durationMs / 1000).toFixed(1)}s`,
    status: entry.status,
  }));
}


function createToolTrace(context: AgentContext): ToolTraceEntry[] {
  return CONTEXT_CONFIG[context].stages.map((stage, index) => ({
    id: `${context.toLowerCase()}-${stage.id}`,
    timestamp: formatStamp(index),
    context,
    toolName: stage.toolName,
    displayName: stage.displayName,
    provider: 'deterministic',
    status: 'pending',
    inputSummary: stage.inputSummary,
    outputSummary: stage.outputSummary,
    durationMs: stage.durationMs,
    canInsertLlmReasoningAfter: stage.canInsertLlmReasoningAfter,
  }));
}

function resetRunState(
  previous: AgentDemoState,
  context = previous.context,
  datasetId = previous.datasetId,
): AgentDemoState {
  return {
    ...previous,
    context,
    datasetId,
    graphState: {
      showMarkers: false,
    },
    reasoningState: {
      ...previous.reasoningState,
      status: 'idle',
      currentStepIndex: -1,
      result: null,
      logs: [],
    },
    toolTrace: createToolTrace(context),
    llmState: {
      output: null,
      usedLlm: false,
      fallbackUsed: false,
    },
  };
}

function reasoningStatus(index: number, state: AgentDemoState): ReasoningStepStatus {
  const { currentStepIndex, status } = state.reasoningState;
  if (status === 'running' && index === currentStepIndex) return 'running';
  if (index <= currentStepIndex) return 'complete';
  return 'pending';
}

function updateTraceStatus(
  trace: ToolTraceEntry[],
  index: number,
  status: ToolStatus,
): ToolTraceEntry[] {
  return trace.map((entry, itemIndex) =>
    itemIndex === index ? { ...entry, status } : entry,
  );
}

function logClass(type: LogType) {
  if (type === 'tool') return 'text-cyan-300';
  if (type === 'success') return 'text-emerald-300';
  if (type === 'system') return 'text-indigo-200';
  return 'text-slate-300';
}

function statusClass(status: ReasoningStepStatus) {
  if (status === 'complete') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';
  if (status === 'running') return 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300';
  return 'border-slate-800 bg-[#070B12] text-slate-500';
}

function toolStatusIcon(status: ToolStatus) {
  if (status === 'complete') return <CheckCircle2 size={12} className="text-emerald-300" />;
  if (status === 'running') return <Loader2 size={12} className="animate-spin text-cyan-300" />;
  if (status === 'error') return <AlertTriangle size={12} className="text-amber-300" />;
  return <CircleDot size={12} className="text-slate-600" />;
}

function formatReviewStatus(status: string) {
  switch (status) {
    case 'strongly_supported':
    case 'complete':
      return 'Supported';
    case 'supported':
      return 'Requires validation';
    case 'partial':
      return 'Validation-limited';
    case 'pending':
      return 'Pending';
    default:
      return 'Claim boundary';
  }
}

import { formatChemicalFormula } from '../utils';

function FormulaText({
  children,
  className = '',
}: {
  children: string | number;
  className?: string;
}) {
  return <span className={`agent-formula ${className}`}>{formatChemicalFormula(String(children))}</span>;
}

function asDemoPeaks(peaks: Array<{ position: number; intensity: number; label?: string }>): DemoPeak[] {
  return peaks.map((peak, index) => ({
    position: Number(peak.position.toFixed(2)),
    intensity: Number(peak.intensity.toFixed(1)),
    label: peak.label ?? `F${index + 1}`,
  }));
}

/**
 * Create decision result using fusionEngine as the single reasoning authority
 * No local numeric review math - fusionEngine controls interpretation output
 */
function createDecisionResult(
  context: AgentContext,
  option: DatasetOption,
  xrdAnalysis: ReturnType<typeof runXrdPhaseIdentificationAgent> | null,
): DecisionResult {
  const { project, dataset } = option;
  const config = CONTEXT_CONFIG[context];

  // Convert detected features to PeakInput format and create EvidenceNodes using central function
  let peakInputs: PeakInput[];
  
  if (context === 'XRD' && xrdAnalysis) {
    // Use XRD analysis peaks
    const demoPeaks = asDemoPeaks(xrdAnalysis.detectedPeaks);
    peakInputs = convertXrdPeaksToPeakInput(demoPeaks);
  } else {
    // Use dataset features
    peakInputs = convertDatasetFeaturesToPeakInput(dataset);
  }
  
  // Create evidence nodes using central fusionEngine function
  const evidenceNodes = peakInputs.length > 0
    ? createEvidenceNodes({ technique: context, peaks: peakInputs })
    : [{
        id: 'fallback-evidence',
        technique: context,
        x: 0,
        unit: getUnitForTechnique(context),
        label: 'Preliminary observation',
      }];
  
  // Call fusionEngine as the single reasoning authority
  const fusionResult: FusionResult = evaluateFusionEngine({ evidence: evidenceNodes });
  
  // Extract feature count for metrics
  const featureCount = context === 'XRD' && xrdAnalysis 
    ? xrdAnalysis.detectedPeaks.length 
    : dataset.detectedFeatures.length;
  
  // Build metrics from reasoning trace
  const dominantClaim = fusionResult.reasoningTrace.find(t => t.isDominant);
  const metrics: Array<{ label: string; value: string; tone?: 'cyan' | 'emerald' | 'violet' | 'amber' }> = [
    { label: config.featureName, value: String(featureCount), tone: 'cyan' },
    { label: 'Evidence nodes', value: String(evidenceNodes.length), tone: 'emerald' },
    { label: 'Evidence Status', value: formatReviewStatus(dominantClaim?.status ?? 'unsupported'), tone: 'violet' },
  ];
  
  // Build detail rows from reasoning trace
  const detailRows = fusionResult.reasoningTrace.map((trace, index) => ({
    Claim: trace.claimId,
    Review: formatReviewStatus(trace.status),
    Evidence: `${trace.evidenceIds.length} nodes`,
    Conflicts: trace.contradictingEvidenceIds.length > 0 ? 'Yes' : 'No',
  }));
  
  return {
    runId: generateRunId(),
    primaryResult: fusionResult.conclusion,
    subtitle: `${config.label} - Fusion Engine Interpretation`,
    reasoningTrace: fusionResult.reasoningTrace,
    conclusion: fusionResult.conclusion,
    basis: fusionResult.basis,
    crossTech: fusionResult.crossTech,
    limitations: fusionResult.limitations,
    decision: fusionResult.decision,
    highlightedEvidenceIds: fusionResult.highlightedEvidenceIds,
    metrics,
    detailRows,
  };
}

function toAgentRunResult(
  result: DecisionResult,
  context: AgentContext,
  option: DatasetOption,
  pipeline: string[],
  detectedPeaks: DemoPeak[],
): AgentRunResult {
  return {
    projectId: option.project.id,
    projectName: option.project.name,
    material: option.project.material,
    selectedDatasets: [context],
    decision: result.primaryResult,
    confidence: 85, // Placeholder - fusionEngine doesn't use numeric confidence
    confidenceLabel: 'Status',
    evidence: result.basis,
    warnings: result.limitations,
    recommendations: [result.decision],
    detectedPeaks,
    pipeline,
    generatedAt: '2026-04-30T00:00:00.000Z',
    summary: `${CONTEXT_CONFIG[context].label}: ${result.conclusion}`,
  };
}

export default function AgentDemo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [missionText, setMissionText] = useState(DEFAULT_MISSION);
  const [feedback, setFeedback] = useState('');
  const [agentState, setAgentState] = useState<AgentDemoState>(() =>
    makeInitialState(searchParams.get('project')),
  );
  const runningGuardRef = useRef(false);
  const runTokenRef = useRef(0);

  // Add error boundary
  const [hasError, setHasError] = useState(false);
  
  React.useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('AgentDemo Error:', error);
      setHasError(true);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070B12] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Agent Demo</h1>
          <p className="text-slate-400">Please check the console for details</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const datasetOptions = useMemo(
    () => getDatasetOptions(agentState.context),
    [agentState.context],
  );
  const selectedOption = useMemo(
    () => getDatasetOption(agentState.context, agentState.datasetId),
    [agentState.context, agentState.datasetId],
  );
  const selectedDataset = selectedOption.dataset;
  const selectedProject = selectedOption.project;
  const experimentConditionLock = getLatestExperimentConditionLock(selectedProject.id);
  const experimentConditionTopBarLabel = experimentConditionLock?.userConfirmed ? 'Locked' : 'Not locked';
  const contextConfig = CONTEXT_CONFIG[agentState.context];
  const stages = contextConfig.stages;
  const xrdAnalysis = useMemo(
    () =>
      agentState.context === 'XRD'
        ? runXrdPhaseIdentificationAgent({
            datasetId: selectedDataset.id,
            sampleName: selectedDataset.sampleName,
            sourceLabel: selectedDataset.fileName,
            dataPoints: selectedDataset.dataPoints,
          })
        : null,
    [agentState.context, selectedDataset],
  );
  const peakMarkers = useMemo(
    () =>
      agentState.context === 'XRD' && (agentState.graphState.showMarkers || agentState.reasoningState.result)
        ? asDemoPeaks(
            xrdAnalysis?.detectedPeaks.length
              ? xrdAnalysis.detectedPeaks
              : selectedDataset.detectedFeatures,
          )
        : undefined,
    [
      agentState.context,
      agentState.graphState.showMarkers,
      agentState.reasoningState.result,
      selectedDataset.detectedFeatures,
      xrdAnalysis,
    ],
  );
  const baselineData = agentState.context === 'XRD' ? xrdAnalysis?.baselineData : undefined;
  const currentResult = agentState.reasoningState.result;
  const runComplete = agentState.reasoningState.status === 'complete' && !!currentResult;
  const progressPercent =
    agentState.reasoningState.currentStepIndex < 0
      ? 0
      : Math.min(100, ((agentState.reasoningState.currentStepIndex + 1) / stages.length) * 100);
  const templateMode = normalizeNotebookTemplateMode(searchParams.get('template'));
  const workflowProcessingResult = useMemo(
    () => {
      const requestedProcessingResult = getProcessingResult(searchParams.get('processing'));
      const routeProcessingResult =
        requestedProcessingResult?.projectId === selectedProject.id ? requestedProcessingResult : null;

      return routeProcessingResult ??
        getLatestProcessingResult(selectedProject.id) ??
        createProcessingResultFromXrdDemo(selectedProject.id);
    },
    [searchParams, selectedProject.id],
  );

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2600);
  };

  const appendLog = (entry: ExecutionLogEntry) => {
    setAgentState((current) => ({
      ...current,
      reasoningState: {
        ...current.reasoningState,
        logs: [...current.reasoningState.logs, entry],
      },
    }));
  };

  const markTool = (index: number, status: ToolStatus) => {
    setAgentState((current) => ({
      ...current,
      toolTrace: updateTraceStatus(current.toolTrace, index, status),
    }));
  };

  const finalizeRun = (
    context: AgentContext,
    option: DatasetOption,
    xrdResult: ReturnType<typeof runXrdPhaseIdentificationAgent> | null,
  ) => {
    const decision = createDecisionResult(context, option, xrdResult);
    const detectedPeaks =
      context === 'XRD'
        ? asDemoPeaks(xrdResult?.detectedPeaks.length ? xrdResult.detectedPeaks : option.dataset.detectedFeatures)
        : [];
    const pipeline = CONTEXT_CONFIG[context].stages.map((stage) => stage.toolName);
    const runResult = toAgentRunResult(decision, context, option, pipeline, detectedPeaks);

    saveAgentRunResult(runResult);
    
    const agentRun: AgentRun = {
      id: decision.runId,
      projectId: option.project.id,
      createdAt: new Date().toISOString(),
      mission: missionText.trim() || DEFAULT_MISSION,
      outputs: {
        phase: decision.primaryResult,
        confidence: 85, // Placeholder - fusionEngine doesn't use numeric confidence
    confidenceLabel: 'Status',
        evidence: decision.basis,
        interpretation: decision.crossTech,
        caveats: decision.limitations,
        recommendations: [decision.decision],
        detectedPeaks,
        selectedDatasets: [context],
      },
    };
    saveRun(agentRun);

    setAgentState((current) => ({
      ...current,
      reasoningState: {
        ...current.reasoningState,
        status: 'complete',
        currentStepIndex: CONTEXT_CONFIG[context].stages.length - 1,
        result: decision,
      },
      llmState: {
        output: null,
        usedLlm: false,
        fallbackUsed: false,
      },
    }));
    appendLog({
      stamp: '[decision]',
      message: `${CONTEXT_CONFIG[context].decisionKind} prepared: ${decision.conclusion}`,
      type: 'success',
    });
  };

  const runAuto = async (
    context = agentState.context,
    datasetId = agentState.datasetId,
  ) => {
    if (runningGuardRef.current) return;
    runningGuardRef.current = true;
    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    const option = getDatasetOption(context, datasetId);
    const config = CONTEXT_CONFIG[context];
    const xrdResult =
      context === 'XRD'
        ? runXrdPhaseIdentificationAgent({
            datasetId: option.dataset.id,
            sampleName: option.dataset.sampleName,
            sourceLabel: option.dataset.fileName,
            dataPoints: option.dataset.dataPoints,
          })
        : null;

    setFeedback('');
    setAgentState((current) => ({
      ...resetRunState(current, context, datasetId),
      reasoningState: {
        ...current.reasoningState,
        status: 'running',
        currentStepIndex: -1,
        result: null,
        logs: [
          {
            stamp: '[00:00]',
            message: `Fusion Engine initialized for ${config.label}: ${missionText.trim() || DEFAULT_MISSION}`,
            type: 'system',
          },
        ],
      },
    }));

    try {
      for (let index = 0; index < config.stages.length; index += 1) {
        if (runTokenRef.current !== token) return;
        const stage = config.stages[index];
        setAgentState((current) => ({
          ...current,
          graphState: {
            showMarkers: context === 'XRD' && index >= 1,
          },
          reasoningState: {
            ...current.reasoningState,
            status: 'running',
            currentStepIndex: index,
          },
          toolTrace: updateTraceStatus(current.toolTrace, index, 'running'),
        }));
        appendLog({
          stamp: `[${formatStamp(index)}]`,
          message: `${stage.displayName}: ${stage.detail}`,
          type: 'tool',
        });
        await wait(stage.durationMs);
        if (runTokenRef.current !== token) return;
        markTool(index, 'complete');
        appendLog({
          stamp: `[${formatStamp(index)}]`,
          message: stage.outputSummary,
          type: index === config.stages.length - 1 ? 'success' : 'info',
        });
      }

      await wait(300);
      if (runTokenRef.current !== token) return;
      
      finalizeRun(context, option, xrdResult);
    } finally {
      if (runTokenRef.current === token) {
        runningGuardRef.current = false;
      }
    }
  };

  const runStep = async () => {
    if (runningGuardRef.current) return;

    const nextIndex =
      agentState.reasoningState.status === 'complete'
        ? 0
        : agentState.reasoningState.currentStepIndex + 1;

    if (nextIndex >= stages.length) return;

    runningGuardRef.current = true;
    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    const option = selectedOption;
    const stage = stages[nextIndex];
    const xrdResult = xrdAnalysis;

    if (nextIndex === 0 || agentState.reasoningState.status === 'complete') {
      setAgentState((current) => ({
        ...resetRunState(current),
        reasoningState: {
          ...current.reasoningState,
          status: 'running',
          currentStepIndex: 0,
          result: null,
          logs: [
            {
              stamp: '[00:00]',
              message: `Step-by-step fusion engine run started for ${contextConfig.label}.`,
              type: 'system',
            },
          ],
        },
        toolTrace: updateTraceStatus(createToolTrace(agentState.context), 0, 'running'),
      }));
    } else {
      setAgentState((current) => ({
        ...current,
        graphState: {
          showMarkers: agentState.context === 'XRD' && nextIndex >= 1,
        },
        reasoningState: {
          ...current.reasoningState,
          status: 'running',
          currentStepIndex: nextIndex,
        },
        toolTrace: updateTraceStatus(current.toolTrace, nextIndex, 'running'),
      }));
    }

    appendLog({
      stamp: `[${formatStamp(nextIndex)}]`,
      message: `${stage.displayName}: ${stage.detail}`,
      type: 'tool',
    });

    try {
      await wait(stage.durationMs);
      if (runTokenRef.current !== token) return;
      setAgentState((current) => ({
        ...current,
        reasoningState: {
          ...current.reasoningState,
          status: nextIndex === stages.length - 1 ? 'running' : 'idle',
          currentStepIndex: nextIndex,
        },
        toolTrace: updateTraceStatus(current.toolTrace, nextIndex, 'complete'),
      }));
      appendLog({
        stamp: `[${formatStamp(nextIndex)}]`,
        message: stage.outputSummary,
        type: nextIndex === stages.length - 1 ? 'success' : 'info',
      });

      if (nextIndex === stages.length - 1) {
        await wait(300);
        if (runTokenRef.current !== token) return;
        finalizeRun(agentState.context, option, xrdResult);
      }
    } finally {
      if (runTokenRef.current === token) {
        runningGuardRef.current = false;
      }
    }
  };

  const resetExecution = () => {
    if (runningGuardRef.current) return;
    runTokenRef.current += 1;
    setFeedback('');
    setAgentState((current) => resetRunState(current));
  };

  const handleContextChange = (nextContext: AgentContext) => {
    if (runningGuardRef.current) return;
    const datasetId = getDefaultDatasetId(nextContext);
    runTokenRef.current += 1;
    setFeedback('');
    setAgentState((current) => resetRunState(current, nextContext, datasetId));
  };

  const handleDatasetChange = (nextDatasetId: string) => {
    if (runningGuardRef.current) return;
    const shouldAutoRun = agentState.reasoningState.executionMode === 'auto';
    runTokenRef.current += 1;
    setFeedback('');
    setAgentState((current) => resetRunState(current, current.context, nextDatasetId));
    if (shouldAutoRun) {
      window.setTimeout(() => {
        void runAuto(agentState.context, nextDatasetId);
      }, 0);
    }
  };

  const handleExecutionModeChange = (executionMode: ExecutionMode) => {
    if (runningGuardRef.current) return;
    setAgentState((current) => ({
      ...current,
      reasoningState: {
        ...current.reasoningState,
        executionMode,
      },
    }));
  };

  const handlePrimaryRun = () => {
    if (agentState.reasoningState.executionMode === 'auto') {
      void runAuto();
      return;
    }
    void runStep();
  };

  const handleExportReport = () => {
    if (!currentResult) return;
    appendLog({
      stamp: '[report]',
      message: 'Report package prepared with graph evidence, reasoning trace, claim boundary, and caveats.',
      type: 'success',
    });
    showFeedback('Export report preview prepared.');
  };

  const handleRefineInterpretation = () => {
    saveProcessingResult(workflowProcessingResult);
    const refinement = refineDiscussionFromProcessing(workflowProcessingResult, templateMode);
    saveAgentDiscussionRefinement(refinement);
    appendLog({
      stamp: '[refine]',
      message: `Refined discussion prepared from ${workflowProcessingResult.technique} processing output using ${templateMode} notebook template.`,
      type: 'success',
    });
    showFeedback('Refined discussion prepared.');
  };

  const handleSaveToNotebook = () => {
    if (currentResult) {
      const runResult = toAgentRunResult(
        currentResult,
        agentState.context,
        selectedOption,
        stages.map((stage) => stage.toolName),
        peakMarkers ?? [],
      );
      saveAgentRunResult(runResult);
    }

    saveProcessingResult(workflowProcessingResult);
    const refinement = refineDiscussionFromProcessing(workflowProcessingResult, templateMode);
    saveAgentDiscussionRefinement(refinement);
    const notebookEntry = createNotebookEntryFromRefinement(refinement, templateMode);
    saveNotebookEntry(notebookEntry);
    appendLog({
      stamp: '[notebook]',
      message: `Saved deterministic demo notebook entry from the current interpretation context as ${notebookEntry.templateLabel}.`,
      type: 'success',
    });
    navigate(`/notebook?project=${selectedProject.id}&entry=${notebookEntry.id}&template=${templateMode}`);
  };

  const handleOpenSourceProcessing = () => {
    navigate(workflowProcessingResult.sourceRoute);
  };

  const handleViewClaimBoundary = () => {
    const refinement = refineDiscussionFromProcessing(workflowProcessingResult, templateMode);
    appendLog({
      stamp: '[boundary]',
      message: `Claim boundary reviewed: ${refinement.claimBoundary.supported.length} supported, ${refinement.claimBoundary.requiresValidation.length} requiring validation.`,
      type: 'info',
    });
    showFeedback('Claim boundary ready in the review log.');
  };

  const handleGenerateReproducibleReport = () => {
    if (!currentResult) return;
    appendLog({
      stamp: '[repro]',
      message: `Reproducible report generated from deterministic reasoning trace: ${stages.map((stage) => stage.displayName).join(' -> ')}.`,
      type: 'tool',
    });
    showFeedback('Reproducible report generated.');
  };

  // Prepare execution steps for CenterColumn
  const executionSteps = useMemo(
    () => mapToolTraceToExecutionSteps(agentState.toolTrace, stages),
    [agentState.toolTrace, stages],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#070B12] text-slate-300 font-sans">
      <style>{`
        @keyframes agentInsightIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .agent-insight-in { animation: agentInsightIn 380ms ease-out both; }
        .agent-formula sub { font-size: 0.72em; line-height: 0; position: relative; bottom: -0.25em; }
        .cockpit-scroll::-webkit-scrollbar{width:4px} .cockpit-scroll::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
      `}</style>

      {/* First Row: Main Header */}
      <MainHeader
        agentVersion="v0.1"
        executionStatus={agentState.reasoningState.status}
        modelMode={agentState.modelMode}
        onNewAnalysis={handlePrimaryRun}
        onExportReport={handleExportReport}
        isRunning={runningGuardRef.current}
        showActions={false}
      />

      {/* Second Row: Control Bar */}
      <div className="shrink-0 border-b border-white/[0.08] bg-[#0A0F1A] px-4 py-2">
        <div className="grid gap-2 min-[780px]:grid-cols-2 min-[1180px]:grid-cols-[170px_minmax(250px,1fr)_160px_220px_185px_170px]">
          <label className="relative flex h-[32px] w-full min-w-0 items-center overflow-hidden rounded-lg border border-slate-800 bg-[#070B12] px-2.5 transition-colors focus-within:border-cyan-400/50">
            <select
              value={agentState.context}
              disabled={agentState.reasoningState.status === 'running'}
              onChange={(event) => handleContextChange(event.target.value as AgentContext)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              aria-label="Context"
            >
              {CONTEXT_ORDER.map((context) => (
                <option key={context} value={context}>
                  {CONTEXT_CONFIG[context].label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Context:</span>
              <span className="truncate text-xs font-semibold text-slate-100">{contextConfig.label}</span>
            </span>
          </label>

          <label className="relative flex h-[32px] w-full min-w-0 items-center overflow-hidden rounded-lg border border-slate-800 bg-[#070B12] px-2.5 transition-colors focus-within:border-cyan-400/50">
            <select
              value={selectedDataset.id}
              disabled={agentState.reasoningState.status === 'running'}
              onChange={(event) => handleDatasetChange(event.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              aria-label="Dataset"
            >
              {datasetOptions.map((option) => (
                <option key={option.dataset.id} value={option.dataset.id}>
                  {option.project.name} - {option.dataset.fileName}
                </option>
              ))}
            </select>
            <span className="pointer-events-none flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Dataset:</span>
              <FormulaText className="block min-w-0 truncate text-xs font-semibold text-slate-100">
                {`${selectedProject.name} - ${selectedDataset.sampleName}`}
              </FormulaText>
            </span>
          </label>

          <label className="relative flex h-[32px] w-full min-w-0 items-center overflow-hidden rounded-lg border border-slate-800 bg-[#070B12] px-2.5 transition-colors focus-within:border-cyan-400/50">
            <select
              value={agentState.modelMode}
              disabled={agentState.reasoningState.status === 'running'}
              onChange={(event) => {
                const newMode = event.target.value as ModelMode;
                setAgentState((current) => ({
                  ...resetRunState(current, current.context, current.datasetId),
                  modelMode: newMode,
                }));
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              aria-label="Reasoning mode"
            >
              <option value="deterministic">Deterministic Workflow</option>
              <option value="vertex-gemini">Model Layer Pending</option>
              <option value="gemma">Open Model Pending</option>
            </select>
            <span className="pointer-events-none flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Mode:</span>
              <span className="truncate text-xs font-semibold text-slate-100">
                {MODEL_MODE_LABELS[agentState.modelMode]}
              </span>
            </span>
          </label>

          <div className="flex h-[32px] w-full min-w-0 items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
            <span className="shrink-0 text-amber-300">Conditions:</span>
            <span className="truncate text-amber-100">{experimentConditionTopBarLabel}</span>
          </div>

          <div className="flex h-[32px] w-full min-w-0 items-center gap-2 rounded-lg border border-slate-800 bg-[#070B12] px-2">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Run:</span>
            <div className="grid h-6 min-w-0 flex-1 grid-cols-2 rounded-lg bg-[#050812] p-0.5">
              {(['auto', 'step'] as ExecutionMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={agentState.reasoningState.status === 'running'}
                  title={agentState.reasoningState.status === 'running' ? 'Controls are locked while the deterministic run is active.' : undefined}
                  onClick={() => handleExecutionModeChange(mode)}
                  className={`rounded-md text-[10px] font-bold transition-colors disabled:opacity-60 ${agentState.reasoningState.executionMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-200'}`}
                >
                  {mode === 'auto' ? 'Auto' : 'Step'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex h-[32px] w-full min-w-0 items-center gap-2 rounded-lg border border-slate-800 bg-[#070B12] px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 min-[780px]:col-span-2 min-[1180px]:col-span-1">
            <span className="shrink-0">Status:</span>
            <span className="truncate text-slate-300">
              {agentState.reasoningState.status === 'running'
                ? 'Reasoning trace active'
                : currentResult
                  ? 'Discussion ready with validation requirements'
                  : 'Ready with validation requirements'}
            </span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrimaryRun}
            disabled={runningGuardRef.current}
            title={runningGuardRef.current ? 'Controls are locked while the deterministic run is active.' : undefined}
            className="inline-flex h-[31px] w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 text-[10px] font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 min-[560px]:w-auto"
          >
            {agentState.reasoningState.status === 'running' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Play size={12} fill="currentColor" />
            )}
            Run
          </button>

          <button
            type="button"
            onClick={resetExecution}
            disabled={runningGuardRef.current}
            title={runningGuardRef.current ? 'Controls are locked while the deterministic run is active.' : undefined}
            className="inline-flex h-[31px] w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-2.5 text-[10px] font-semibold text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50 min-[560px]:w-auto"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={handleRefineInterpretation}
            disabled={runningGuardRef.current}
            title={runningGuardRef.current ? 'Controls are locked while the deterministic run is active.' : undefined}
            className="inline-flex h-[31px] w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 text-[10px] font-semibold text-cyan-100 transition-colors hover:border-cyan-300/50 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50 min-[560px]:w-auto"
          >
            <Brain size={12} />
            Refine
          </button>

          <button
            type="button"
            onClick={handleSaveToNotebook}
            disabled={runningGuardRef.current}
            title={runningGuardRef.current ? 'Controls are locked while the deterministic run is active.' : undefined}
            className="inline-flex h-[31px] w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 text-[10px] font-semibold text-emerald-100 transition-colors hover:border-emerald-300/50 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50 min-[560px]:w-auto"
          >
            <FileText size={12} />
            Save to Notebook
          </button>

          <button
            type="button"
            onClick={handleOpenSourceProcessing}
            disabled={runningGuardRef.current}
            title={runningGuardRef.current ? 'Controls are locked while the deterministic run is active.' : 'Open source processing'}
            className="inline-flex h-[31px] w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-2.5 text-[10px] font-semibold text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50 min-[560px]:w-auto"
          >
            <Database size={12} />
            Source
          </button>

          <button
            type="button"
            onClick={handleViewClaimBoundary}
            disabled={runningGuardRef.current}
            title={runningGuardRef.current ? 'Controls are locked while the deterministic run is active.' : undefined}
            className="inline-flex h-[31px] w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-2.5 text-[10px] font-semibold text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50 min-[560px]:w-auto"
          >
            <ClipboardList size={12} />
            Claim Boundary
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            disabled={runningGuardRef.current}
            title={runningGuardRef.current ? 'Controls are locked while the deterministic run is active.' : undefined}
            className="inline-flex h-[31px] w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 text-[10px] font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 min-[560px]:w-auto"
          >
            <Download size={12} />
            Export
          </button>
        </div>
      </div>

      <div className="shrink-0 border-b border-white/[0.08] bg-[#070B12] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Demo dataset · Deterministic scientific workflow
      </div>

      {/* Three-Column Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <LeftSidebar
          currentDataset={selectedDataset}
          currentProject={selectedProject}
          context={agentState.context}
          isRunning={runningGuardRef.current}
        />

        {/* Center Column */}
        <CenterColumn
          context={agentState.context}
          dataset={selectedDataset}
          project={selectedProject}
          graphData={selectedDataset.dataPoints}
          peakMarkers={peakMarkers}
          baselineData={baselineData}
          executionSteps={executionSteps}
          progressPercent={progressPercent}
          metrics={currentResult?.metrics ?? []}
        />

        {/* Right Panel */}
        <RightPanel
          technique={agentState.context}
          projectName={selectedProject.name}
          projectId={selectedProject.id}
          currentStep={agentState.reasoningState.currentStepIndex}
          totalSteps={stages.length}
          executionSteps={executionSteps}
          progressPercent={progressPercent}
          processingResultId={workflowProcessingResult.id}
          candidates={
            xrdAnalysis?.candidates.slice(0, 3).map((candidate, index) => ({
              phase: candidate.phase.name,
              peakAlignment: index === 0 ? '0.12° ≤ 0.20°' : index === 1 ? '0.28° > 0.20°' : '0.31° > 0.20°',
              structuralFit: index === 0 ? 'supported' : 'partial',
              completeness: (candidate.matches.length / candidate.phase.peaks.length).toFixed(2),
              evaluation: index === 0 ? 'Requires validation' : 'In Progress',
              result: index === 0 ? 'Match' : 'Rejected',
              reason: index === 1 ? 'missing peak 35.7°' : index === 2 ? 'intensity mismatch' : undefined,
            }))
          }
        />
      </div>
    </div>
  );
}

