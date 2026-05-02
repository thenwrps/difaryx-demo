import React, { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  getWorkspaceRoute,
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
  confidence: number;
  confidenceLabel: string;
  reasoningSummary: string[];
  evidence: string[];
  alternatives: string[];
  interpretation: string;
  caveat: string;
  recommendation: string;
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
  'Investigate the selected scientific dataset and produce an evidence-linked material characterization decision.';

const MODEL_MODE_LABELS: Record<ModelMode, string> = {
  deterministic: 'Deterministic',
  'vertex-gemini': 'Vertex AI Gemini',
  gemma: 'Gemma Open Model',
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
    decisionKind: 'Phase decision',
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
        outputSummary: 'Spectrum loaded and validated',
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
        label: 'Score Candidates',
        shortLabel: 'Scoring',
        detail: 'Ranking candidates by matched peaks, strong-peak agreement, and conflicts.',
        toolName: 'score_phase_candidates',
        displayName: 'Score Phase Candidates',
        inputSummary: 'Observed peaks and candidate references',
        outputSummary: 'Candidate scores computed',
        durationMs: 620,
      },
      {
        id: 'fusion',
        label: 'Evidence Fusion',
        shortLabel: 'Fusion',
        detail: 'Evaluating missing and unexplained peak evidence before the decision.',
        toolName: 'analyze_peak_conflicts',
        displayName: 'Analyze Peak Conflicts',
        inputSummary: 'Ranked candidates and unexplained features',
        outputSummary: 'Conflict analysis prepared',
        durationMs: 580,
        canInsertLlmReasoningAfter: true,
      },
      {
        id: 'decision',
        label: 'Make Decision',
        shortLabel: 'Decision',
        detail: 'Synthesizing phase evidence into a decision-ready interpretation.',
        toolName: 'generate_xrd_interpretation',
        displayName: 'Generate XRD Interpretation',
        inputSummary: 'Scores, evidence, conflicts, and caveats',
        outputSummary: 'Scientific decision generated',
        durationMs: 620,
      },
    ],
  },
  XPS: {
    label: 'XPS Surface Chemistry',
    graphType: 'xps',
    featureName: 'Core-level components',
    decisionKind: 'Surface chemistry decision',
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
        id: 'decision',
        label: 'Make Decision',
        shortLabel: 'Decision',
        detail: 'Generating a surface-chemistry decision with caveats.',
        toolName: 'decision_logic',
        displayName: 'Generate Surface Decision',
        inputSummary: 'Evidence summary and limitations',
        outputSummary: 'Scientific decision generated',
        durationMs: 620,
      },
    ],
  },
  FTIR: {
    label: 'FTIR Bonding Analysis',
    graphType: 'ftir',
    featureName: 'Vibrational bands',
    decisionKind: 'Bonding decision',
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
        id: 'decision',
        label: 'Make Decision',
        shortLabel: 'Decision',
        detail: 'Generating a bonding interpretation with limitations.',
        toolName: 'decision_logic',
        displayName: 'Generate Bonding Decision',
        inputSummary: 'Evidence summary and caveats',
        outputSummary: 'Scientific decision generated',
        durationMs: 620,
      },
    ],
  },
  Raman: {
    label: 'Raman Structural Fingerprint',
    graphType: 'raman',
    featureName: 'Raman modes',
    decisionKind: 'Structural fingerprint decision',
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
        id: 'decision',
        label: 'Make Decision',
        shortLabel: 'Decision',
        detail: 'Generating a structural interpretation with caveats.',
        toolName: 'decision_logic',
        displayName: 'Generate Structural Decision',
        inputSummary: 'Evidence summary and limitations',
        outputSummary: 'Scientific decision generated',
        durationMs: 620,
      },
    ],
  },
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clampConfidence(value: number) {
  return Math.max(45, Math.min(98, Math.round(value)));
}

function confidenceLabel(confidence: number) {
  if (confidence >= 90) return 'High confidence';
  if (confidence >= 80) return 'Moderate confidence';
  return 'Evidence-limited';
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

const FORMULA_TOKENS = new Set([
  'CuFe2O4',
  'NiFe2O4',
  'CoFe2O4',
  'Fe3O4',
  'Fe2O3',
  'CuFeO2',
  'CuO',
]);

const FORMULA_SPLIT_PATTERN = /(CuFe2O4|NiFe2O4|CoFe2O4|Fe3O4|Fe2O3|CuFeO2|CuO)/g;

function renderFormula(formula: string) {
  return formula.split(/(\d+)/).map((part, index) =>
    /^\d+$/.test(part) ? <sub key={index}>{part}</sub> : part,
  );
}

function renderFormulaText(text: string | number) {
  const value = String(text);
  return value.split(FORMULA_SPLIT_PATTERN).map((part, index) =>
    FORMULA_TOKENS.has(part) ? (
      <React.Fragment key={`${part}-${index}`}>{renderFormula(part)}</React.Fragment>
    ) : (
      part
    ),
  );
}

function FormulaText({
  children,
  className = '',
}: {
  children: string | number;
  className?: string;
}) {
  return <span className={`agent-formula ${className}`}>{renderFormulaText(children)}</span>;
}

function asDemoPeaks(peaks: Array<{ position: number; intensity: number; label?: string }>): DemoPeak[] {
  return peaks.map((peak, index) => ({
    position: Number(peak.position.toFixed(2)),
    intensity: Number(peak.intensity.toFixed(1)),
    label: peak.label ?? `F${index + 1}`,
  }));
}

/**
 * Call LLM reasoning if enabled, otherwise return null.
 * This function builds an evidence packet from deterministic tools and calls the LLM API.
 */
async function callLlmReasoning(
  modelMode: ModelMode,
  context: AgentContext,
  dataset: DemoDataset,
  project: DemoProject,
  xrdAnalysis: ReturnType<typeof runXrdPhaseIdentificationAgent> | null,
  toolTrace: ToolTraceEntry[],
): Promise<{ output: ReasoningOutput | null; fallbackUsed: boolean }> {
  // Only call LLM if not in deterministic mode
  if (modelMode === 'deterministic') {
    return { output: null, fallbackUsed: false };
  }

  try {
    // Build evidence packet from deterministic tool outputs
    const featureCount = getFeatureCount(context, dataset, xrdAnalysis);
    const baseConfidence = getBaseConfidence(context, project);
    
    // Convert tool trace to MCP ToolResult format
    const mcpToolTrace: ToolResult[] = toolTrace.map((entry) => ({
      id: entry.id,
      toolCallId: entry.id,
      name: entry.toolName as any,
      status: entry.status === 'error' ? 'error' : entry.status,
      output: {
        summary: entry.outputSummary,
        durationMs: entry.durationMs,
      },
      durationMs: entry.durationMs,
      timestamp: entry.timestamp,
    }));

    const packet = buildEvidencePacket(
      context,
      dataset,
      project,
      xrdAnalysis,
      featureCount,
      baseConfidence,
      mcpToolTrace,
    );

    // Call reasoning API
    const response = await callReasoningAPI({
      packet,
      provider: modelMode,
    });

    if (!response.success) {
      console.error('LLM reasoning failed:', response.error);
      return { output: null, fallbackUsed: true };
    }

    return {
      output: response.output ?? null,
      fallbackUsed: response.fallbackUsed ?? false,
    };
  } catch (error) {
    console.error('LLM reasoning error:', error);
    return { output: null, fallbackUsed: true };
  }
}

function getFeatureCount(
  context: AgentContext,
  dataset: DemoDataset,
  xrdAnalysis: ReturnType<typeof runXrdPhaseIdentificationAgent> | null,
) {
  if (context === 'XRD') {
    return xrdAnalysis?.detectedPeaks.length || dataset.detectedFeatures.length || CONTEXT_CONFIG.XRD.defaultFeatureCount;
  }
  return CONTEXT_CONFIG[context].defaultFeatureCount;
}

function getBaseConfidence(context: AgentContext, project: DemoProject) {
  if (context === 'XRD') return project.confidence;
  if (context === 'XPS') return project.techniques.includes('XPS') ? project.confidence - 3 : 78;
  if (context === 'FTIR') return project.techniques.includes('FTIR') ? project.confidence - 5 : 76;
  return project.techniques.includes('Raman') ? project.confidence - 4 : 77;
}

function createDecisionResult(
  context: AgentContext,
  option: DatasetOption,
  xrdAnalysis: ReturnType<typeof runXrdPhaseIdentificationAgent> | null,
  llmOutput: ReasoningOutput | null = null,
): DecisionResult {
  const { project, dataset } = option;
  const featureCount = getFeatureCount(context, dataset, xrdAnalysis);
  const config = CONTEXT_CONFIG[context];

  // If LLM output is available, use it to enhance the decision
  if (llmOutput) {
    const confidence = clampConfidence(llmOutput.confidence * 100);
    
    return {
      runId: generateRunId(),
      primaryResult: llmOutput.primaryResult,
      subtitle: `${config.label} - AI-Assisted Reasoning`,
      confidence,
      confidenceLabel: confidenceLabel(confidence),
      reasoningSummary: llmOutput.evidenceSummary.slice(0, 3),
      evidence: llmOutput.evidenceSummary,
      alternatives: llmOutput.rejectedAlternatives,
      interpretation: llmOutput.decisionLogic,
      caveat: llmOutput.uncertainty.join('; '),
      recommendation: llmOutput.recommendedNextStep,
      metrics: [
        { label: config.featureName, value: String(featureCount), tone: 'cyan' },
        { label: 'AI Confidence', value: `${confidence}%`, tone: 'emerald' },
        { label: 'Provider', value: llmOutput.metadata.provider === 'vertex-gemini' ? 'Vertex AI' : llmOutput.metadata.provider === 'gemma' ? 'Gemma' : 'Deterministic', tone: 'violet' },
      ],
      detailRows: context === 'XRD' && xrdAnalysis
        ? xrdAnalysis.candidates.slice(0, 5).map((candidate, index) => ({
            Rank: index + 1,
            Candidate: candidate.phase.name,
            Score: `${Math.round(candidate.score * 100)}%`,
            Evidence: `${candidate.matches.length}/${candidate.phase.peaks.length} peaks`,
          }))
        : [
            { Metric: 'Features', Value: featureCount, Status: 'Analyzed' },
            { Metric: 'Provider', Value: llmOutput.metadata.provider, Status: 'Active' },
            { Metric: 'Duration', Value: `${llmOutput.metadata.durationMs}ms`, Status: 'Complete' },
          ],
    };
  }

  // Fallback to deterministic decision
  if (context === 'XRD') {
    const bestCandidate = xrdAnalysis?.candidates[0];
    const primaryResult = bestCandidate?.phase.name ?? project.phase;
    const confidence = clampConfidence(bestCandidate ? bestCandidate.score * 100 : project.confidence);
    const candidateRows =
      xrdAnalysis?.candidates.slice(0, 5).map((candidate, index) => ({
        Rank: index + 1,
        Candidate: candidate.phase.name,
        Score: `${Math.round(candidate.score * 100)}%`,
        Evidence: `${candidate.matches.length}/${candidate.phase.peaks.length} peaks`,
      })) ?? [];

    return {
      runId: generateRunId(),
      primaryResult,
      subtitle: 'Reference-backed crystalline phase assignment',
      confidence,
      confidenceLabel: confidenceLabel(confidence),
      reasoningSummary: [
        `${featureCount} diffraction features evaluated`,
        `${candidateRows[0]?.Evidence ?? 'Reference peaks'} matched against phase candidates`,
        'Strong peaks and unexplained features checked before final assignment',
      ],
      evidence: xrdAnalysis?.interpretation.evidence.slice(0, 4) ?? project.evidence.slice(0, 4),
      alternatives:
        xrdAnalysis?.candidates.slice(1, 4).map((candidate) => (
          `${candidate.phase.name} rejected or deprioritized (${Math.round(candidate.score * 100)}%)`
        )) ?? ['Alternative phase candidates scored below the primary assignment'],
      interpretation:
        xrdAnalysis?.interpretation.decision ??
        `${project.phase} is supported by the selected XRD evidence.`,
      caveat:
        xrdAnalysis?.interpretation.caveats[0] ??
        'XRD alone does not validate surface chemistry or catalytic behavior.',
      recommendation: 'Open the technique workspace to inspect peak assignments and export the evidence chain.',
      metrics: [
        { label: config.featureName, value: String(featureCount), tone: 'cyan' },
        { label: 'Best score', value: `${confidence}%`, tone: 'emerald' },
        { label: 'Decision', value: 'Phase', tone: 'violet' },
      ],
      detailRows: candidateRows.length > 0 ? candidateRows : [
        { Rank: 1, Candidate: project.phase, Score: `${confidence}%`, Evidence: `${featureCount} features` },
      ],
    };
  }

  const confidence = clampConfidence(getBaseConfidence(context, project));
  const techniqueEvidence = project.evidence.find((item) =>
    item.toLowerCase().includes(context.toLowerCase()),
  );
  const materialFamily = project.material;

  const templates: Record<Exclude<AgentContext, 'XRD'>, Omit<DecisionResult, 'runId' | 'confidence' | 'confidenceLabel'>> = {
    XPS: {
      primaryResult: `Surface chemistry consistent with ${materialFamily}`,
      subtitle: 'Core-level evidence review',
      reasoningSummary: [
        `${featureCount} diagnostic core-level regions evaluated`,
        'Oxidation-state envelope checked against material context',
        'Surface evidence treated as supportive, not a standalone bulk phase claim',
      ],
      evidence: [
        techniqueEvidence ?? 'XPS envelope is consistent with the selected material system.',
        'Metal and oxygen component windows were evaluated deterministically.',
        'No live LLM or backend chemistry claim was invoked.',
      ],
      alternatives: [
        'Surface contamination remains a possible contribution',
        'Bulk phase assignment requires XRD or complementary structural evidence',
      ],
      interpretation:
        'The selected XPS context supports a surface-chemistry interpretation linked to the material system, while preserving uncertainty around bulk structure.',
      caveat: 'This deterministic demo does not perform quantitative peak fitting or charge correction.',
      recommendation: 'Use the XPS workspace to review component windows before reporting surface-state claims.',
      metrics: [
        { label: 'Components', value: String(featureCount), tone: 'violet' },
        { label: 'Agreement', value: `${confidence}%`, tone: 'emerald' },
        { label: 'Decision', value: 'Surface', tone: 'cyan' },
      ],
      detailRows: [
        { Window: 'O 1s', Assignment: 'Lattice / surface oxygen', Status: 'Supported' },
        { Window: 'Fe 2p', Assignment: 'Ferrite-compatible envelope', Status: 'Supported' },
        { Window: 'Cu/Ni/Co 2p', Assignment: 'Project-dependent metal state', Status: 'Contextual' },
      ],
    },
    FTIR: {
      primaryResult: `Bonding signatures consistent with ${materialFamily}`,
      subtitle: 'Vibrational band evidence review',
      reasoningSummary: [
        `${featureCount} diagnostic vibrational bands evaluated`,
        'Metal-oxygen and surface/support bands separated conceptually',
        'Bonding evidence fused with selected project context',
      ],
      evidence: [
        techniqueEvidence ?? 'FTIR metal-oxygen band supports the material bonding environment.',
        'Baseline and diagnostic band windows were evaluated deterministically.',
        'No standalone structural phase claim is made from FTIR alone.',
      ],
      alternatives: [
        'Surface hydroxyl and adsorbed water bands may overlap',
        'Support bands can obscure weak lattice vibrations',
      ],
      interpretation:
        'The selected FTIR context supports a bonding-level interpretation and identifies where complementary structural evidence would reduce ambiguity.',
      caveat: 'This deterministic demo does not perform full deconvolution or quantitative band-area analysis.',
      recommendation: 'Use the FTIR workspace to inspect band windows and compare with structural evidence.',
      metrics: [
        { label: 'Bands', value: String(featureCount), tone: 'amber' },
        { label: 'Agreement', value: `${confidence}%`, tone: 'emerald' },
        { label: 'Decision', value: 'Bonding', tone: 'cyan' },
      ],
      detailRows: [
        { Band: 'Metal-O', Region: '500-700 cm-1', Status: 'Supported' },
        { Band: 'OH / H2O', Region: '1600-3500 cm-1', Status: 'Contextual' },
        { Band: 'Support', Region: '900-1200 cm-1', Status: 'Checked' },
      ],
    },
    Raman: {
      primaryResult: `Structural fingerprint consistent with ${materialFamily}`,
      subtitle: 'Raman mode evidence review',
      reasoningSummary: [
        `${featureCount} Raman modes or bands evaluated`,
        'Fingerprint match checked against structural families',
        'Broad bands treated as uncertainty rather than invented phases',
      ],
      evidence: [
        techniqueEvidence ?? 'Raman fingerprint supports the assigned material family.',
        'Mode positions were evaluated as structural evidence, not a standalone database claim.',
        'The decision keeps uncertainty visible for overlapping fingerprints.',
      ],
      alternatives: [
        'Carbon/support bands may contribute to broad features',
        'Closely related ferrite fingerprints can overlap without XRD confirmation',
      ],
      interpretation:
        'The selected Raman context supports a structural fingerprint interpretation while keeping phase-level ambiguity explicit.',
      caveat: 'This deterministic demo does not perform full Raman peak fitting or laser-heating correction.',
      recommendation: 'Use the Raman workspace to inspect mode assignments or combine with XRD evidence.',
      metrics: [
        { label: 'Modes', value: String(featureCount), tone: 'emerald' },
        { label: 'Agreement', value: `${confidence}%`, tone: 'cyan' },
        { label: 'Decision', value: 'Fingerprint', tone: 'violet' },
      ],
      detailRows: [
        { Mode: 'Low shift', Region: '200-400 cm-1', Status: 'Checked' },
        { Mode: 'Lattice', Region: '500-750 cm-1', Status: 'Supported' },
        { Mode: 'Broad band', Region: '1200-1650 cm-1', Status: 'Contextual' },
      ],
    },
  };

  return {
    runId: generateRunId(),
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    ...templates[context],
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
    confidence: result.confidence,
    confidenceLabel: result.confidenceLabel,
    evidence: result.evidence,
    warnings: [result.caveat],
    recommendations: [result.recommendation],
    detectedPeaks,
    pipeline,
    generatedAt: '2026-04-30T00:00:00.000Z',
    summary: `${CONTEXT_CONFIG[context].label}: ${result.primaryResult} at ${result.confidence}% confidence.`,
  };
}

export default function AgentDemo() {
  const [searchParams] = useSearchParams();
  const [missionText, setMissionText] = useState(DEFAULT_MISSION);
  const [feedback, setFeedback] = useState('');
  const [agentState, setAgentState] = useState<AgentDemoState>(() =>
    makeInitialState(searchParams.get('project')),
  );
  const runningGuardRef = useRef(false);
  const runTokenRef = useRef(0);

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
  const featureCount = getFeatureCount(agentState.context, selectedDataset, xrdAnalysis);
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
  const workspacePath = getWorkspaceRoute(selectedProject, agentState.context, selectedDataset.id);

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
    llmOutput: ReasoningOutput | null = null,
    fallbackUsed = false,
  ) => {
    const decision = createDecisionResult(context, option, xrdResult, llmOutput);
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
        confidence: decision.confidence,
        confidenceLabel: decision.confidenceLabel,
        evidence: decision.evidence,
        interpretation: decision.interpretation,
        caveats: [decision.caveat],
        recommendations: [decision.recommendation],
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
        output: llmOutput,
        usedLlm: !!llmOutput,
        fallbackUsed,
      },
    }));
    appendLog({
      stamp: '[decision]',
      message: `${CONTEXT_CONFIG[context].decisionKind} complete: ${decision.primaryResult} (${decision.confidence}%).${llmOutput ? ` [AI-Assisted: ${llmOutput.metadata.provider}]` : ''}`,
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
            message: `Deterministic agent initialized for ${config.label}: ${missionText.trim() || DEFAULT_MISSION}`,
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
      
      // Call LLM reasoning if enabled (after evidence fusion step)
      let llmOutput: ReasoningOutput | null = null;
      let fallbackUsed = false;
      
      if (agentState.modelMode !== 'deterministic') {
        appendLog({
          stamp: `[${formatStamp(config.stages.length)}]`,
          message: `LLM Reasoning (${MODEL_MODE_LABELS[agentState.modelMode]}): Analyzing evidence packet...`,
          type: 'tool',
        });
        
        const llmResult = await callLlmReasoning(
          agentState.modelMode,
          context,
          option.dataset,
          option.project,
          xrdResult,
          agentState.toolTrace,
        );
        
        llmOutput = llmResult.output;
        fallbackUsed = llmResult.fallbackUsed;
        
        if (llmOutput) {
          appendLog({
            stamp: `[${formatStamp(config.stages.length)}]`,
            message: `LLM reasoning complete: ${llmOutput.primaryResult} (confidence: ${(llmOutput.confidence * 100).toFixed(1)}%)`,
            type: 'success',
          });
        } else if (fallbackUsed) {
          appendLog({
            stamp: `[${formatStamp(config.stages.length)}]`,
            message: 'LLM provider unavailable, using deterministic fallback',
            type: 'info',
          });
        }
      }
      
      finalizeRun(context, option, xrdResult, llmOutput, fallbackUsed);
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
              message: `Step-by-step deterministic run started for ${contextConfig.label}.`,
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
      message: 'Report package prepared with graph evidence, tool trace, decision, and caveats.',
      type: 'success',
    });
    showFeedback('Export report preview prepared.');
  };

  const handleSaveToNotebook = () => {
    if (!currentResult) return;
    const runResult = toAgentRunResult(
      currentResult,
      agentState.context,
      selectedOption,
      stages.map((stage) => stage.toolName),
      peakMarkers ?? [],
    );
    saveAgentRunResult(runResult);
    appendLog({
      stamp: '[notebook]',
      message: 'Decision saved to the Notebook handoff surface.',
      type: 'success',
    });
    showFeedback('Saved to Notebook handoff.');
  };

  const handleGenerateReproducibleReport = () => {
    if (!currentResult) return;
    appendLog({
      stamp: '[repro]',
      message: `Reproducible report generated from deterministic tool trace: ${stages.map((stage) => stage.toolName).join(' -> ')}.`,
      type: 'tool',
    });
    showFeedback('Reproducible report generated.');
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#070B12] text-slate-300 font-sans">
      <style>{`
        @keyframes agentInsightIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .agent-insight-in { animation: agentInsightIn 380ms ease-out both; }
        .agent-formula sub { font-size: 0.72em; line-height: 0; position: relative; bottom: -0.25em; }
        .cockpit-scroll::-webkit-scrollbar{width:4px} .cockpit-scroll::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
      `}</style>

      <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-[#08101D]/95 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold text-white hover:text-cyan-300">
            <Brain size={17} className="text-cyan-300" />
            DIFARYX
          </Link>
          <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-600 md:inline">Agent Demo</span>
          <span className="hidden h-4 w-px bg-slate-800 md:inline" />
          <span className="hidden text-[11px] font-semibold text-slate-300 lg:inline">Context: Scientific Reasoning</span>
          <span className="hidden rounded-full border border-slate-700 bg-[#070B12] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 lg:inline">
            Mode: Autonomous Agent
          </span>
          <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-200">
            Reasoning Mode: {MODEL_MODE_LABELS[agentState.modelMode]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${agentState.reasoningState.status === 'running' ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : runComplete ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-slate-700 bg-[#070B12] text-slate-500'}`}>
            {agentState.reasoningState.status === 'running' ? 'Running' : runComplete ? 'Complete' : 'Ready'}
          </span>
        </div>
      </header>

      <div className="shrink-0 px-3 pt-2.5">
        <div className="flex min-h-[52px] flex-wrap items-center gap-2.5 rounded-[14px] border border-slate-800 bg-[#0A0F1A] px-3 py-2 min-[1180px]:flex-nowrap">
          <label className="relative flex h-[38px] w-full min-w-0 items-center overflow-hidden rounded-[10px] border border-slate-800 bg-[#070B12] px-3 transition-colors focus-within:border-cyan-400/50 min-[760px]:w-[calc(50%_-_5px)] min-[1180px]:w-[230px] min-[1440px]:w-[260px]">
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
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">Context:</span>
              <span className="truncate text-[13px] font-semibold text-slate-100">{contextConfig.label}</span>
            </span>
          </label>

          <label className="relative flex h-[38px] w-full min-w-0 flex-1 items-center overflow-hidden rounded-[10px] border border-slate-800 bg-[#070B12] px-3 transition-colors focus-within:border-cyan-400/50 min-[760px]:min-w-[260px] min-[1440px]:min-w-[320px]">
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
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">Dataset:</span>
              <FormulaText className="block min-w-0 truncate text-[13px] font-semibold text-slate-100">
                {`${selectedProject.name} - ${selectedDataset.sampleName}`}
              </FormulaText>
            </span>
          </label>

          <label className="relative flex h-[38px] w-full min-w-0 items-center overflow-hidden rounded-[10px] border border-slate-800 bg-[#070B12] px-3 transition-colors focus-within:border-cyan-400/50 min-[760px]:w-[180px] min-[1440px]:w-[210px]">
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
              <option value="deterministic">Deterministic</option>
              <option value="vertex-gemini">Vertex AI Gemini</option>
              <option value="gemma">Gemma Open Model</option>
            </select>
            <span className="pointer-events-none flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">Mode:</span>
              <span className="truncate text-[13px] font-semibold text-slate-100">
                {agentState.modelMode === 'deterministic' ? 'Deterministic' : MODEL_MODE_LABELS[agentState.modelMode]}
              </span>
            </span>
          </label>

          <div className="flex h-[38px] w-full min-w-0 items-center gap-2 rounded-[10px] border border-slate-800 bg-[#070B12] px-2 min-[760px]:w-[210px] min-[1440px]:w-[240px]">
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">Run:</span>
            <div className="grid h-9 min-w-0 flex-1 grid-cols-2 rounded-[10px] bg-[#050812] p-1">
              {(['auto', 'step'] as ExecutionMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={agentState.reasoningState.status === 'running'}
                  onClick={() => handleExecutionModeChange(mode)}
                  className={`rounded-md text-[11px] font-bold transition-colors disabled:opacity-60 ${agentState.reasoningState.executionMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-200'}`}
                >
                  {mode === 'auto' ? 'Auto Run' : 'Step-by-Step'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrimaryRun}
            disabled={runningGuardRef.current}
            className="inline-flex h-[38px] w-full shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 px-3 text-[12px] font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 min-[760px]:w-[145px] min-[1440px]:w-[160px]"
          >
            {agentState.reasoningState.status === 'running' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Play size={13} fill="currentColor" />
            )}
            New Execution
          </button>

          <button
            type="button"
            onClick={resetExecution}
            disabled={runningGuardRef.current}
            className="inline-flex h-[38px] w-full shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-slate-700 px-3 text-[12px] font-semibold text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50 min-[760px]:w-[84px] min-[1440px]:w-[92px]"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="cockpit-scroll w-[282px] shrink-0 overflow-y-auto border-r border-slate-800/50 bg-[#080E19] p-3 space-y-3">
          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-cyan-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mission</span>
              </div>
              <button
                type="button"
                onClick={() => setMissionText(DEFAULT_MISSION)}
                className="rounded border border-slate-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
              >
                Reset
              </button>
            </div>
            <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-slate-600">
              Editable mission prompt
            </label>
            <textarea
              value={missionText}
              onChange={(event) => setMissionText(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-md border border-slate-800 bg-[#070B12] px-2.5 py-2 text-[12px] leading-5 text-slate-100 outline-none transition-colors focus:border-cyan-400/50"
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="mb-2 flex items-center gap-2">
              <Grid3X3 size={14} className={contextConfig.iconTone} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reasoning Context</span>
            </div>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Active context</span>
                <span className="text-right font-semibold text-white">{contextConfig.label}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Dataset</span>
                <span className="truncate text-right font-semibold text-slate-200">{selectedDataset.fileName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Material</span>
                <FormulaText className="block min-w-0 truncate text-right font-semibold text-slate-200">
                  {selectedDataset.metadata.materialSystem}
                </FormulaText>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Model mode</span>
                <span className="font-semibold text-cyan-200">{MODEL_MODE_LABELS[agentState.modelMode]}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Provider calls</span>
                <span className="font-semibold text-slate-300">None</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={14} className="text-indigo-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dynamic Step Flow</span>
            </div>
            <div className="space-y-1.5">
              {stages.map((stage, index) => {
                const status = reasoningStatus(index, agentState);
                return (
                  <div
                    key={stage.id}
                    className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-[11px] ${status === 'complete' ? 'text-emerald-300' : status === 'running' ? 'text-cyan-300 bg-cyan-400/5' : 'text-slate-600'}`}
                  >
                    {status === 'complete' ? (
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                    ) : status === 'running' ? (
                      <Loader2 size={12} className="mt-0.5 shrink-0 animate-spin" />
                    ) : (
                      <CircleDot size={12} className="mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold">{stage.label}</p>
                      {status !== 'pending' && (
                        <FormulaText className="block text-[10px] text-slate-500">{stage.outputSummary}</FormulaText>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={14} className="text-amber-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tool Stack</span>
            </div>
            <div className="space-y-1">
              {stages.map((stage, index) => {
                const status = reasoningStatus(index, agentState);
                return (
                  <div key={stage.toolName} className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-slate-600">{index + 1}.</span>
                    <span className={status === 'complete' ? 'text-emerald-300' : status === 'running' ? 'text-cyan-300' : 'text-slate-500'}>
                      {stage.toolName}
                    </span>
                  </div>
                );
              })}
              <div className="mt-2 rounded border border-slate-800 bg-[#070B12] px-2 py-1.5 text-[9px] leading-4 text-slate-500">
                Future insertion point: <span className="font-mono text-slate-300">llm_reasoning(provider)</span> after evidence fusion.
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} className="text-emerald-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data Source</span>
            </div>
            <div className="rounded-md border border-slate-800 bg-[#070B12] px-2 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-white">{selectedDataset.technique}</p>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[8px] font-bold uppercase text-emerald-300">
                  Loaded
                </span>
              </div>
              <p className="mt-1 truncate text-[10px] text-slate-500">{selectedDataset.fileName}</p>
              <FormulaText className="mt-1 block text-[10px] leading-4 text-slate-400">
                {selectedDataset.metadata.materialSystem}
              </FormulaText>
            </div>
          </div>
        </aside>

        <main className="cockpit-scroll flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] px-4 py-3">
            <div className="flex items-center gap-0">
              {stages.map((stage, index) => {
                const status = reasoningStatus(index, agentState);
                return (
                  <React.Fragment key={stage.id}>
                    {index > 0 && (
                      <div className={`h-0.5 flex-1 transition-colors duration-300 ${status !== 'pending' ? 'bg-gradient-to-r from-cyan-400/40 to-emerald-400/40' : 'bg-slate-800'}`} />
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-300 ${status === 'complete' ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : status === 'running' ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300 animate-pulse' : 'border-slate-700 bg-[#070B12] text-slate-600'}`}>
                        {status === 'complete' ? <CheckCircle2 size={13} /> : index + 1}
                      </div>
                      <span className={`w-20 text-center text-[8px] font-bold uppercase tracking-wider leading-tight ${status === 'complete' ? 'text-emerald-300/70' : status === 'running' ? 'text-cyan-300/70' : 'text-slate-600'}`}>
                        {stage.shortLabel}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Microscope size={14} className={contextConfig.iconTone} />
                  <h2 className="text-sm font-bold text-white">{contextConfig.label}</h2>
                </div>
                <FormulaText className="mt-1 block text-[11px] text-slate-500">
                  {`${selectedDataset.sampleName} - ${selectedProject.material}`}
                </FormulaText>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700 bg-[#070B12] px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                  {featureCount} {contextConfig.featureName.toLowerCase()}
                </span>
                {agentState.context === 'XRD' && peakMarkers && (
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300">
                    Peak markers visible
                  </span>
                )}
              </div>
            </div>
            <div className="h-[320px] rounded border border-slate-800 bg-[#050812] p-2">
              <Graph
                type={contextToGraphType(agentState.context)}
                height="100%"
                externalData={selectedDataset.dataPoints}
                baselineData={baselineData}
                peakMarkers={peakMarkers}
                showBackground={agentState.context === 'XRD'}
                showCalculated={false}
                showResidual={false}
              />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {(currentResult?.metrics ?? [
                { label: contextConfig.featureName, value: String(featureCount), tone: 'cyan' as const },
                { label: 'Context', value: agentState.context, tone: 'violet' as const },
                { label: 'Status', value: runComplete ? 'Complete' : 'Ready', tone: 'emerald' as const },
              ]).map((metric) => (
                <div key={metric.label} className="rounded-lg border border-slate-800 bg-[#070B12] px-3 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{metric.label}</p>
                  <p className={`mt-1 text-sm font-bold ${metric.tone === 'emerald' ? 'text-emerald-300' : metric.tone === 'violet' ? 'text-violet-300' : metric.tone === 'amber' ? 'text-amber-300' : 'text-cyan-300'}`}>
                    <FormulaText>{metric.value}</FormulaText>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
              <div className="mb-2 flex items-center gap-2">
                <Terminal size={13} className="text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Execution Log</span>
              </div>
              <div className="h-[168px] overflow-y-auto rounded border border-slate-800 bg-[#050812] p-2 font-mono text-[10px]">
                {agentState.reasoningState.logs.length === 0 ? (
                  <p className="text-slate-600">Awaiting deterministic agent execution...</p>
                ) : (
                  <div className="space-y-1">
                    {agentState.reasoningState.logs.map((entry, index) => (
                      <div key={`${entry.stamp}-${index}`} className="flex gap-2">
                        <span className="shrink-0 text-slate-600">{entry.stamp}</span>
                        <FormulaText className={logClass(entry.type)}>{entry.message}</FormulaText>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain size={13} className="text-cyan-300" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Agent Reasoning Trace</span>
                </div>
                <span className="text-[9px] font-bold uppercase text-slate-600">{agentState.reasoningState.status}</span>
              </div>
              <div className="h-[168px] space-y-1.5 overflow-y-auto pr-1">
                {stages.map((stage, index) => {
                  const status = reasoningStatus(index, agentState);
                  return (
                    <div key={stage.id} className={`rounded border p-2 transition-all duration-300 ${statusClass(status)} ${status === 'running' ? 'animate-pulse' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${statusClass(status)}`}>
                          {status === 'complete' ? <CheckCircle2 size={11} /> : status === 'running' ? <Loader2 size={11} className="animate-spin" /> : index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-100">{stage.label}</p>
                          {status === 'running' && (
                            <FormulaText className="block text-[9px] text-cyan-200">{stage.detail}</FormulaText>
                          )}
                        </div>
                      </div>
                      {status === 'complete' && (
                        <div className="mt-1.5 space-y-1 pl-7">
                          <p className="font-mono text-[9px] text-slate-400">{stage.toolName}()</p>
                          <FormulaText className="block text-[10px] text-cyan-300/80">{stage.outputSummary}</FormulaText>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={13} className="text-emerald-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Evidence Table</span>
              </div>
              <span className="text-[9px] font-bold uppercase text-slate-600">{contextConfig.decisionKind}</span>
            </div>
            <div className="overflow-hidden rounded border border-slate-800">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#070B12] text-[9px] uppercase tracking-wider text-slate-600">
                  <tr>
                    {Object.keys((currentResult?.detailRows[0] ?? { Item: 'Pending', Status: 'Awaiting execution' })).map((key) => (
                      <th key={key} className="px-3 py-2 font-bold">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(currentResult?.detailRows ?? [{ Item: contextConfig.featureName, Status: 'Run agent to populate evidence table' }]).map((row, index) => (
                    <tr key={index} className="border-t border-slate-800 text-slate-300">
                      {Object.values(row).map((value, valueIndex) => (
                        <td key={`${index}-${valueIndex}`} className="px-3 py-2">
                          <FormulaText>{value}</FormulaText>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <aside className="cockpit-scroll w-[366px] shrink-0 overflow-y-auto border-l border-slate-800/50 bg-[#080E19] p-3 space-y-3">
          <div className={`rounded-lg border p-4 transition-all duration-500 ${runComplete ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-slate-800 bg-[#0A0F1A]'}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Primary Result</p>
              <div className="flex items-center gap-1.5">
                {agentState.llmState.usedLlm && runComplete && (
                  <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[8px] font-bold uppercase text-violet-300">
                    AI-Assisted
                  </span>
                )}
                <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase ${runComplete ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-slate-700 bg-[#070B12] text-slate-500'}`}>
                  {runComplete ? currentResult?.confidenceLabel : 'Pending'}
                </span>
              </div>
            </div>
            <p className={`mt-3 text-xl font-black leading-tight ${runComplete ? 'text-emerald-300' : 'text-slate-700'}`}>
              {runComplete && currentResult ? (
                <FormulaText>{currentResult.primaryResult}</FormulaText>
              ) : (
                'Decision Pending'
              )}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">{runComplete ? currentResult?.subtitle : 'Run the agent to execute tools and produce a decision.'}</p>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-bold uppercase tracking-wider text-slate-500">Confidence Score</span>
                <span className={runComplete ? 'font-bold text-white' : 'font-bold text-slate-700'}>{runComplete ? `${currentResult?.confidence}%` : '--'}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500" style={{ width: `${runComplete ? currentResult?.confidence ?? 0 : 0}%` }} />
              </div>
            </div>
          </div>

          {currentResult ? (
            <div className="agent-insight-in space-y-3">
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-200">Agent Decision</p>
                <FormulaText className="mt-1 block text-[11px] leading-5 text-slate-300">
                  {currentResult.interpretation}
                </FormulaText>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Reasoning Summary</p>
                <div className="space-y-1">
                  {currentResult.reasoningSummary.map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-md border border-slate-800 bg-[#070B12] px-2 py-1.5 text-[11px] text-slate-300">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-300" />
                      <FormulaText>{item}</FormulaText>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Evidence</p>
                <div className="space-y-1">
                  {currentResult.evidence.map((item) => (
                    <div key={item} className="rounded-md border border-slate-800 bg-[#070B12] px-2 py-1.5 text-[11px] leading-5 text-slate-300">
                      <FormulaText>{item}</FormulaText>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Alternatives And Limits</p>
                <div className="space-y-1">
                  {currentResult.alternatives.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-[11px] leading-5 text-slate-400">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-300" />
                      <FormulaText>{item}</FormulaText>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-orange-400/20 bg-orange-400/5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle size={12} className="text-orange-300" />
                  <p className="text-[9px] font-bold uppercase text-orange-300">Caveat</p>
                </div>
                <FormulaText className="block text-[11px] leading-5 text-slate-300">{currentResult.caveat}</FormulaText>
              </div>

              <div className="rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-3">
                <p className="text-[9px] font-bold uppercase text-indigo-200">Recommended Next</p>
                <FormulaText className="mt-1 block text-[11px] leading-5 text-slate-200">
                  {currentResult.recommendation}
                </FormulaText>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleExportReport} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-cyan-400/40 bg-[#0A0F1A] text-[11px] font-semibold text-cyan-300 hover:bg-cyan-400/10">
                  <Download size={12} />
                  Export Report
                </button>
                <Link to={workspacePath} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-[#0A0F1A] text-[11px] font-semibold text-slate-200 hover:border-slate-500">
                  <Microscope size={12} />
                  Open Workspace
                </Link>
                <button type="button" onClick={handleSaveToNotebook} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-indigo-400/40 bg-[#0A0F1A] text-[11px] font-semibold text-indigo-200 hover:bg-indigo-500/10">
                  <FileText size={12} />
                  Save to Notebook
                </button>
                <button type="button" onClick={handleGenerateReproducibleReport} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-emerald-400/40 bg-[#0A0F1A] text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10">
                  <ClipboardList size={12} />
                  Repro Report
                </button>
              </div>
              {feedback && <div className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[11px] font-semibold text-cyan-200">{feedback}</div>}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-4 text-center">
              <Brain size={28} className="mx-auto mb-2 text-slate-700" />
              <p className="text-xs font-semibold text-white">Decision Pending</p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">Run the agent to execute deterministic tools, collect evidence, and generate a scientific decision.</p>
            </div>
          )}

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-cyan-300" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tool Trace</p>
              </div>
              <span className="text-[9px] font-bold uppercase text-slate-600">{MODEL_MODE_LABELS[agentState.modelMode]}</span>
            </div>
            <div className="space-y-1.5">
              {agentState.toolTrace.map((entry) => (
                <React.Fragment key={entry.id}>
                  <div className="rounded-md border border-slate-800 bg-[#070B12] px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {toolStatusIcon(entry.status)}
                        <span className="truncate font-mono text-[10px] text-slate-200">{entry.toolName}()</span>
                      </div>
                      <span className="shrink-0 text-[9px] text-slate-600">{entry.timestamp}</span>
                    </div>
                    <FormulaText className="mt-1 block text-[9px] text-slate-500">
                      {`${entry.displayName} - ${entry.outputSummary}`}
                    </FormulaText>
                  </div>
                  {entry.canInsertLlmReasoningAfter && (
                    <div className="rounded-md border border-dashed border-slate-700 bg-[#050812] px-2 py-1.5 text-[9px] leading-4 text-slate-500">
                      Reserved future step: <span className="font-mono text-slate-300">llm_reasoning(provider)</span>. Not executed in deterministic mode.
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical size={13} className="text-emerald-300" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Session Info</p>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between gap-2"><span className="text-slate-500">Context</span><span className="text-right font-semibold text-white">{contextConfig.label}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500">Dataset</span><span className="truncate text-right font-semibold text-slate-300">{selectedDataset.id}</span></div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Material</span>
                <FormulaText className="block min-w-0 truncate text-right font-semibold text-slate-300">
                  {selectedProject.material}
                </FormulaText>
              </div>
              <div className="flex justify-between gap-2"><span className="text-slate-500">Execution</span><span className="font-semibold text-slate-300">{agentState.reasoningState.executionMode === 'auto' ? 'Auto Run' : 'Step-by-Step'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500">Status</span><span className="font-semibold text-slate-300">{agentState.reasoningState.status}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
