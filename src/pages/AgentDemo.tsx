import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  Layers,
  Loader2,
  Microscope,
  Play,
  Target,
  Terminal,
  Zap,
} from 'lucide-react';
import { Graph } from '../components/ui/Graph';
import { runXrdPhaseIdentificationAgent } from '../agents/xrdAgent';
import { getXrdDemoDataset } from '../data/xrdDemoDatasets';
import {
  getProject,
  getWorkspaceRoute,
  saveAgentRunResult,
} from '../data/demoProjects';
import type { AgentRunResult, DemoPeak } from '../data/demoProjects';
import { generateRunId, saveRun, type AgentRun } from '../data/runModel';

type ReasoningStepStatus = 'pending' | 'running' | 'complete';
type LogType = 'system' | 'tool' | 'success' | 'info' | 'gemma';

type ExecutionLogEntry = {
  stamp: string;
  message: string;
  type: LogType;
};

const CANONICAL_PROJECT_ID = 'cu-fe2o4-spinel';
const CANONICAL_DATASET_ID = 'xrd-cufe2o4-clean';
const CANONICAL_SAMPLE_FILE = 'CuFe2O4_Experiment_01.xrd';
const CANONICAL_PEAK_COUNT = 12;
const CANONICAL_SCORE = 0.92;
const DEFAULT_MISSION =
  'Determine whether the uploaded sample is consistent with CuFe\u2082O\u2084 spinel ferrite phase from multi-technique evidence.';

const PROJECT_OPTIONS = [
  {
    value: 'cu-fe2o4-spinel',
    label: 'CuFe\u2082O\u2084 Spinel Ferrite',
    status: 'active',
  },
  {
    value: 'cufe2o4-sba15',
    label: 'CuFe\u2082O\u2084/SBA-15 Catalyst',
    status: 'coming soon',
  },
  {
    value: 'nife2o4',
    label: 'NiFe\u2082O\u2084 Ferrite',
    status: 'coming soon',
  },
  {
    value: 'cofe2o4',
    label: 'CoFe\u2082O\u2084 Ferrite',
    status: 'coming soon',
  },
];

const REASONING_TRACE_STEPS = [
  {
    label: 'load_xrd_dataset',
    detail: 'Gemma \u2192 Load CuFe\u2082O\u2084 XRD spectrum (2\u03b8 10\u201380\u00b0)',
    stamp: '[00:02]',
    duration: 520,
    type: 'gemma' as LogType,
    gemmaCmd: '{"tool":"load_xrd_dataset","args":{"dataset_id":"xrd-cufe2o4-clean","format":"2theta-intensity"}}',
    toolResult: 'Dataset loaded: 1801 pts, range 10.0\u201380.0\u00b0 2\u03b8',
    evidenceUpdate: 'Raw XRD spectrum registered as primary evidence source',
  },
  {
    label: 'detect_xrd_peaks',
    detail: 'Gemma \u2192 Detect diffraction peaks via prominence analysis',
    stamp: '[00:06]',
    duration: 640,
    type: 'tool' as LogType,
    gemmaCmd: '{"tool":"detect_xrd_peaks","args":{"method":"prominence","min_snr":3.0,"min_prominence":0.05}}',
    toolResult: '12 peaks detected (10 sharp, 2 broad); strongest at 2\u03b8 = 35.4\u00b0',
    evidenceUpdate: 'Peak list added: positions, intensities, d-spacings',
  },
  {
    label: 'match_reference_phase',
    detail: 'Gemma \u2192 Match peaks against COD reference patterns',
    stamp: '[00:11]',
    duration: 700,
    type: 'tool' as LogType,
    gemmaCmd: '{"tool":"match_reference_phase","args":{"database":"COD","tolerance_deg":0.15,"radiation":"Cu-Kalpha"}}',
    toolResult: 'Best match: CuFe\u2082O\u2084 spinel (0.92); runner-up: Fe\u2083O\u2084 (0.41)',
    evidenceUpdate: 'Phase candidate ranking with match scores added',
  },
  {
    label: 'multi_evidence_fusion',
    detail: 'Gemma \u2192 Evaluate unmatched peaks and impurity signals',
    stamp: '[00:16]',
    duration: 660,
    type: 'tool' as LogType,
    gemmaCmd: '{"tool":"multi_evidence_fusion","args":{"primary_phase":"CuFe2O4","threshold":0.02}}',
    toolResult: '2 unexplained minor peaks; possible CuO impurity trace flagged',
    evidenceUpdate: 'Conflict analysis: no major conflicts, minor impurity noted',
  },
  {
    label: 'generate_scientific_decision',
    detail: 'Gemma \u2192 Synthesize evidence into scientific decision',
    stamp: '[00:22]',
    duration: 680,
    type: 'success' as LogType,
    gemmaCmd: '{"tool":"generate_scientific_decision","args":{"mode":"phase_identification","require_caveats":true}}',
    toolResult: 'Decision: CuFe\u2082O\u2084 spinel ferrite confirmed at 92% confidence',
    evidenceUpdate: 'Final decision with confidence, evidence chain, and caveats compiled',
  },
];

const SCIENTIFIC_INSIGHT = {
  phase: 'CuFe₂O₄ spinel ferrite',
  confidence: 92,
  evidence: [
    'Peak alignment consistency (92%)',
    'Strong match with spinel ferrite reference',
    'No major conflicting peaks',
  ],
  confidenceBasis: [
    'Strong XRD phase agreement',
    'High peak alignment consistency',
    'No conflicting peaks',
  ],
  interpretation:
    'The material shows structural features consistent with spinel ferrites, a class of catalysts studied for CO2-to-fuel and CO2 hydrogenation pathways.',
  nextStep: 'Validate surface chemistry with XPS or compare with catalytic performance data.',
  modelRole: 'Gemma reasoning layer',
  toolRole: 'Deterministic XRD analysis',
  caveat: 'Minor impurity phases (possible CuO trace) require Rietveld refinement or complementary evidence.',
};

const IMPACT_TEXT =
  'Automating interpretation of experimental data reduces iteration cycles in CO2 conversion research, accelerating the discovery of sustainable fuel catalysts.';

const TOOL_STACK = [
  'load_xrd_dataset',
  'detect_xrd_peaks',
  'match_reference_phase',
  'multi_evidence_fusion',
  'generate_scientific_decision',
];

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const SYNTHETIC_RAMAN_POINTS: { x: number; y: number }[] = (() => {
  const pts: { x: number; y: number }[] = [];
  const peaks = [
    { center: 190, width: 25, height: 0.4 },
    { center: 300, width: 20, height: 0.35 },
    { center: 320, width: 18, height: 0.3 },
    { center: 470, width: 30, height: 0.55 },
    { center: 540, width: 22, height: 0.25 },
    { center: 680, width: 35, height: 0.9 },
  ];
  for (let x = 100; x <= 800; x += 2) {
    let y = 0.05 + Math.sin(x * 0.7) * 0.01 + Math.cos(x * 1.3) * 0.008;
    for (const p of peaks) {
      y += p.height * Math.exp(-0.5 * ((x - p.center) / p.width) ** 2);
    }
    pts.push({ x, y: Math.max(0, y) });
  }
  return pts;
})();

const RAMAN_EVIDENCE_PEAKS = [
  { label: 'T₂g(1)', pos: '190 cm⁻¹' },
  { label: 'Eg', pos: '300 cm⁻¹' },
  { label: 'T₂g(2)', pos: '470 cm⁻¹' },
  { label: 'A₁g', pos: '680 cm⁻¹' },
];

const MISSION_OBJECTIVES = [
  'Load and validate XRD dataset',
  'Detect diffraction peaks',
  'Match against reference phases',
  'Evaluate unexplained signals',
  'Generate scientific decision',
];

const DATA_SOURCES = [
  { label: 'XRD', file: 'CuFe2O4_Experiment_01.xrd', status: 'loaded' as const },
  { label: 'Raman', file: 'CuFe2O4_Raman_synth.csv', status: 'supporting' as const },
];

function MiniRamanSvg() {
  const pts = SYNTHETIC_RAMAN_POINTS;
  const xMin = pts[0].x, xMax = pts[pts.length - 1].x;
  const yMax = Math.max(...pts.map(p => p.y)) * 1.1;
  const W = 400, H = 140, pad = { t: 6, r: 6, b: 16, l: 6 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const toX = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * pw;
  const toY = (y: number) => pad.t + ph - (y / yMax) * ph;
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width={W} height={H} fill="transparent" />
      <path d={d} fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.85" />
      <text x={pad.l + 2} y={H - 2} fontSize="8" fill="#475569">100</text>
      <text x={W - pad.r - 2} y={H - 2} fontSize="8" fill="#475569" textAnchor="end">800 cm⁻¹</text>
    </svg>
  );
}

function reasoningStatus(index: number, currentIndex: number): ReasoningStepStatus {
  if (currentIndex > index) return 'complete';
  if (currentIndex === index) return 'running';
  return 'pending';
}

function logClass(type: LogType) {
  if (type === 'gemma') return 'text-amber-300';
  if (type === 'tool') return 'text-cyan-300';
  if (type === 'success') return 'text-emerald-300';
  if (type === 'system') return 'text-indigo-200';
  return 'text-slate-300';
}

function statusPillClass(status: ReasoningStepStatus) {
  if (status === 'complete') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';
  if (status === 'running') return 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300';
  return 'border-slate-800 bg-[#070B12] text-slate-500';
}

function toDemoPeaks(peaks: { position: number; intensity: number; label: string }[]): DemoPeak[] {
  return peaks.slice(0, CANONICAL_PEAK_COUNT).map((peak, index) => ({
    position: Number(peak.position.toFixed(2)),
    intensity: Number(peak.intensity.toFixed(1)),
    label: peak.label || `P${index + 1}`,
  }));
}

export default function AgentDemo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get project from URL or default
  const projectIdFromUrl = searchParams.get('project') ?? CANONICAL_PROJECT_ID;
  const project = useMemo(() => getProject(projectIdFromUrl), [projectIdFromUrl]);
  
  const dataset = useMemo(() => getXrdDemoDataset(CANONICAL_DATASET_ID), []);
  const xrdAgentResult = useMemo(
    () =>
      runXrdPhaseIdentificationAgent({
        datasetId: dataset.id,
        sampleName: dataset.sampleName,
        sourceLabel: dataset.fileName,
        dataPoints: dataset.dataPoints,
      }),
    [dataset],
  );
  const detectedPeaks = useMemo(
    () =>
      xrdAgentResult.detectedPeaks.map((peak) => ({
        position: peak.position,
        intensity: peak.intensity,
        label: peak.label,
      })),
    [xrdAgentResult],
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [showScientificInsight, setShowScientificInsight] = useState(false);
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([]);
  const [feedback, setFeedback] = useState('');
  const [missionText, setMissionText] = useState(DEFAULT_MISSION);
  const [selectedProject, setSelectedProject] = useState(projectIdFromUrl);
  const runningGuardRef = useRef(false);

  // Update URL when project changes
  const handleProjectChange = (newProjectId: string) => {
    setSelectedProject(newProjectId);
    setSearchParams({ project: newProjectId });
  };

  const workspacePath = getWorkspaceRoute(project, 'XRD', dataset.id);
  const selectedProjectOption = PROJECT_OPTIONS.find((item) => item.value === selectedProject) ?? PROJECT_OPTIONS[0];
  const selectedProjectIsPreview = selectedProject !== CANONICAL_PROJECT_ID;
  const activeStep = currentStepIndex >= 0 && currentStepIndex < REASONING_TRACE_STEPS.length
    ? REASONING_TRACE_STEPS[currentStepIndex]
    : null;
  const showPeakMarkers = currentStepIndex > 1 || showScientificInsight;
  const runComplete = showScientificInsight && !!result;
  const progressPercent =
    currentStepIndex < 0
      ? 0
      : Math.min(100, (Math.min(currentStepIndex + 1, REASONING_TRACE_STEPS.length) / REASONING_TRACE_STEPS.length) * 100);

  const canonicalRunResult = (): AgentRunResult => ({
    projectId: project.id,
    projectName: project.name,
    material: 'CuFe₂O₄ spinel ferrite',
    selectedDatasets: ['XRD'],
    decision: 'CuFe₂O₄ spinel ferrite is supported by autonomous XRD evidence.',
    confidence: 92,
    confidenceLabel: 'High confidence',
    evidence: [
      ...SCIENTIFIC_INSIGHT.evidence,
      'COD reference matching ranked CuFe2O4 above competing ferrite phases.',
      'Structure inference assigned a spinel ferrite lattice family.',
    ],
    warnings: ['Surface chemistry remains unvalidated until XPS or catalytic performance data are reviewed.'],
    recommendations: [SCIENTIFIC_INSIGHT.nextStep],
    detectedPeaks: toDemoPeaks(detectedPeaks),
    pipeline: TOOL_STACK,
    generatedAt: '2026-04-30T00:00:00.000Z',
    summary: `${SCIENTIFIC_INSIGHT.phase} assigned at ${SCIENTIFIC_INSIGHT.confidence}% confidence from ${CANONICAL_SAMPLE_FILE}.`,
  });

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2600);
  };

  const appendLog = (entry: ExecutionLogEntry) => {
    setLogs((current) => [...current, entry]);
  };

  const runAgent = async () => {
    if (runningGuardRef.current || isRunning) return;
    runningGuardRef.current = true;

    setIsRunning(true);
    setShowScientificInsight(false);
    setResult(null);
    setCurrentStepIndex(-1);
    setFeedback('');
    setLogs([]);

    try {
      appendLog({
        stamp: '[00:00]',
        message: `Gemma agent initialized \u2014 ${missionText.trim() || DEFAULT_MISSION}`,
        type: 'system',
      });
      if (selectedProjectIsPreview) {
        appendLog({
          stamp: '[00:00]',
          message: `${selectedProjectOption.label} selected as preview; demo data remains locked to CuFe\u2082O\u2084 Spinel Ferrite.`,
          type: 'info',
        });
      }

      for (let index = 0; index < REASONING_TRACE_STEPS.length; index += 1) {
        const step = REASONING_TRACE_STEPS[index];
        setCurrentStepIndex(index);
        appendLog({
          stamp: step.stamp,
          message: `${step.label}: ${step.detail}`,
          type: step.type,
        });
        await wait(step.duration);
      }

      setCurrentStepIndex(REASONING_TRACE_STEPS.length);
      appendLog({
        stamp: '[00:30]',
        message: 'Gemma decision locked: CuFe₂O₄ spinel ferrite, confidence 92%.',
        type: 'success',
      });

      await wait(300);

      const nextResult = canonicalRunResult();
      setResult(nextResult);
      saveAgentRunResult(nextResult);
      
      // Create and save run
      const runId = generateRunId();
      const agentRun: AgentRun = {
        id: runId,
        projectId: project.id,
        createdAt: new Date().toISOString(),
        mission: missionText.trim() || DEFAULT_MISSION,
        outputs: {
          phase: nextResult.decision,
          confidence: nextResult.confidence,
          confidenceLabel: nextResult.confidenceLabel,
          evidence: nextResult.evidence,
          interpretation: SCIENTIFIC_INSIGHT.interpretation,
          caveats: [
            SCIENTIFIC_INSIGHT.caveat,
            ...nextResult.warnings,
          ],
          recommendations: nextResult.recommendations,
          detectedPeaks: nextResult.detectedPeaks,
          selectedDatasets: nextResult.selectedDatasets,
        },
      };
      saveRun(agentRun);
      
      setShowScientificInsight(true);
      
      // Navigate to workspace with run context
      await wait(800);
      navigate(`/workspace/xrd?project=${project.id}&run=${runId}`);
    } finally {
      setIsRunning(false);
      runningGuardRef.current = false;
    }
  };

  const handleExportReport = () => {
    if (!result) return;
    appendLog({
      stamp: '[report]',
      message: 'Export report package prepared with evidence, tool trace, confidence basis, and recommendation.',
      type: 'success',
    });
    showFeedback('Export report preview prepared.');
  };

  const handleSaveToNotebook = () => {
    if (!result) return;
    saveAgentRunResult(result);
    appendLog({
      stamp: '[notebook]',
      message: 'Agent decision saved to Notebook Lab handoff.',
      type: 'success',
    });
    showFeedback('Saved to Notebook Lab.');
  };

  const handleGenerateReproducibleReport = () => {
    if (!result) return;
    appendLog({
      stamp: '[repro]',
      message: `Reproducible report generated with tool sequence: ${TOOL_STACK.join(' -> ')}.`,
      type: 'tool',
    });
    showFeedback('Reproducible report generated with deterministic tool provenance.');
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#070B12] text-slate-300 font-sans">
      <style>{`
        @keyframes agentInsightIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .agent-insight-in { animation: agentInsightIn 400ms ease-out both; }
        .cockpit-scroll::-webkit-scrollbar{width:4px} .cockpit-scroll::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
      `}</style>

      {/* HEADER */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-slate-800 bg-[#08101D]/95 px-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold text-white hover:text-cyan-300">
            <Brain size={16} className="text-cyan-300" />DIFARYX
          </Link>
          <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-600 sm:inline">Agent Mode</span>
          <span className="text-[10px] text-slate-600">→</span>
          <span className="text-[10px] font-semibold text-slate-400">Project: {project.name}</span>
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">Gemma v0.1</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${isRunning ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : runComplete ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-slate-700 bg-[#070B12] text-slate-500'}`}>
            {isRunning ? 'Running' : runComplete ? 'Complete' : 'Ready'}
          </span>
          <button type="button" onClick={runAgent} disabled={isRunning} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
            {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
            {runComplete ? 'Re-run' : 'Run Agent'}
          </button>
          <Link to="/" className="text-[10px] font-semibold text-slate-500 hover:text-white">Landing</Link>
        </div>
      </header>

      {/* 3-COLUMN COCKPIT */}
      <div className="flex min-h-0 flex-1">

        {/* LEFT SIDEBAR — Mission Control */}
        <aside className="cockpit-scroll w-[280px] shrink-0 overflow-y-auto border-r border-slate-800/50 bg-[#080E19] p-3 space-y-3">
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
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-600" htmlFor="agent-mission-prompt">
              Editable mission prompt
            </label>
            <textarea
              id="agent-mission-prompt"
              value={missionText}
              onChange={(event) => setMissionText(event.target.value)}
              className="mt-1.5 h-24 w-full resize-none rounded-md border border-slate-800 bg-[#050812] px-2.5 py-2 text-xs leading-5 text-slate-200 outline-none transition-colors placeholder:text-slate-700 focus:border-cyan-400/50"
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-emerald-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project</span>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                  selectedProjectIsPreview
                    ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                    : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                }`}
              >
                {selectedProjectIsPreview ? 'preview' : 'active'}
              </span>
            </div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-600" htmlFor="agent-project-selector">
              Demo project
            </label>
            <select
              id="agent-project-selector"
              value={selectedProject}
              onChange={(event) => handleProjectChange(event.target.value)}
              className="mt-1.5 w-full rounded-md border border-slate-800 bg-[#050812] px-2.5 py-2 text-xs font-semibold text-slate-200 outline-none transition-colors focus:border-cyan-400/50"
            >
              {PROJECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.status}
                </option>
              ))}
            </select>
            {selectedProjectIsPreview && (
              <p className="mt-2 rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1.5 text-[10px] leading-4 text-amber-100/90">
                Preview only — demo data locked to CuFe₂O₄ Spinel Ferrite
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2"><ClipboardList size={14} className="text-indigo-300" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Objectives</span></div>
            <div className="space-y-1.5">
              {MISSION_OBJECTIVES.map((obj, i) => {
                const done = currentStepIndex > i;
                const active = currentStepIndex === i;
                return (
                  <div key={obj} className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-[11px] ${done ? 'text-emerald-300' : active ? 'text-cyan-300 bg-cyan-400/5' : 'text-slate-600'}`}>
                    {done ? <CheckCircle2 size={12} className="mt-0.5 shrink-0" /> : active ? <Loader2 size={12} className="mt-0.5 shrink-0 animate-spin" /> : <CircleDot size={12} className="mt-0.5 shrink-0" />}
                    <span>{obj}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2"><Layers size={14} className="text-amber-300" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tool Stack</span></div>
            <div className="space-y-1">
              {TOOL_STACK.map((t, i) => (
                <div key={t} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-slate-600">{i + 1}.</span>
                  <span className={currentStepIndex > i ? 'text-emerald-300' : currentStepIndex === i ? 'text-cyan-300' : 'text-slate-500'}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2"><Database size={14} className="text-emerald-300" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data Sources</span></div>
            <div className="space-y-2">
              {DATA_SOURCES.map(ds => (
                <div key={ds.label} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white">{ds.label}</p>
                    <p className="truncate text-[10px] text-slate-500">{ds.file}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase ${ds.status === 'loaded' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-violet-400/30 bg-violet-400/10 text-violet-300'}`}>{ds.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2"><Activity size={14} className="text-slate-400" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Agent Info</span></div>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-slate-500">Project</span><span className="text-white font-semibold text-right">{project.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Model</span><span className="text-amber-300 font-semibold">Gemma</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Mode</span><span className="text-slate-300">Phase identification</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Orchestration</span><span className="text-slate-300">Deterministic</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Material</span><span className="text-white font-semibold text-right">{project.material}</span></div>
            </div>
          </div>
        </aside>

        {/* CENTER — Agent Flow + Evidence + Trace */}
        <main className="cockpit-scroll flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-4">

          {/* Horizontal Step Flow */}
          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] px-4 py-3">
            <div className="flex items-center gap-0">
              {REASONING_TRACE_STEPS.map((step, i) => {
                const st = reasoningStatus(i, currentStepIndex);
                return (
                  <React.Fragment key={step.label}>
                    {i > 0 && <div className={`h-0.5 flex-1 transition-colors duration-300 ${st !== 'pending' ? 'bg-gradient-to-r from-cyan-400/40 to-emerald-400/40' : 'bg-slate-800'}`} />}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-300 ${st === 'complete' ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : st === 'running' ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300 animate-pulse' : 'border-slate-700 bg-[#070B12] text-slate-600'}`}>
                        {st === 'complete' ? <CheckCircle2 size={13} /> : i + 1}
                      </div>
                      <span className={`w-16 text-center text-[8px] font-bold uppercase tracking-wider leading-tight ${st === 'complete' ? 'text-emerald-300/70' : st === 'running' ? 'text-cyan-300/70' : 'text-slate-600'}`}>
                        {step.label.replace('_', '\n').split('_').pop()}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-all duration-300" style={{ width: `${progressPercent}%` }} /></div>
          </div>

          {/* Evidence Viewer — XRD + Raman side by side */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2"><Microscope size={13} className="text-cyan-300" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">XRD Evidence</span></div>
                {showPeakMarkers && <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold text-cyan-300">12 peaks</span>}
              </div>
              <div className="h-[180px] rounded border border-slate-800 bg-[#050812] p-1">
                <Graph type="xrd" height="100%" externalData={dataset.dataPoints} baselineData={xrdAgentResult.baselineData} peakMarkers={showPeakMarkers ? detectedPeaks.slice(0, CANONICAL_PEAK_COUNT) : undefined} showBackground showCalculated={false} showResidual={false} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {[{ l: 'Peaks', v: '12' }, { l: 'Match', v: '0.92' }, { l: 'Phase', v: 'CuFe₂O₄' }].map(s => (
                  <div key={s.l} className="rounded border border-slate-800 bg-[#070B12] px-2 py-1.5 text-center">
                    <p className="text-[8px] font-bold uppercase text-slate-600">{s.l}</p>
                    <p className="text-xs font-bold text-white">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2"><Zap size={13} className="text-violet-300" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Raman Evidence</span></div>
                <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[8px] font-bold text-violet-300">supporting demo evidence</span>
              </div>
              <div className="h-[180px] rounded border border-slate-800 bg-[#050812] p-1">
                <MiniRamanSvg />
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {RAMAN_EVIDENCE_PEAKS.map(p => (
                  <div key={p.label} className="rounded border border-slate-800 bg-[#070B12] px-1.5 py-1.5 text-center">
                    <p className="text-[8px] font-bold text-violet-300">{p.label}</p>
                    <p className="text-[9px] text-slate-400">{p.pos}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Execution Log + Reasoning Trace */}
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
              <div className="mb-2 flex items-center gap-2"><Terminal size={13} className="text-slate-400" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Execution Log</span></div>
              <div className="h-[140px] overflow-y-auto rounded border border-slate-800 bg-[#050812] p-2 font-mono text-[10px]">
                {logs.length === 0 ? <p className="text-slate-600">Awaiting Run Agent...</p> : (
                  <div className="space-y-1">
                    {logs.map((e, i) => (
                      <div key={`${e.stamp}-${i}`} className="flex gap-2"><span className="shrink-0 text-slate-600">{e.stamp}</span><span className={logClass(e.type)}>{e.message}</span></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2"><Brain size={13} className="text-amber-300" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gemma Reasoning Trace</span></div>
                <span className="text-[9px] font-bold uppercase text-slate-600">{isRunning ? 'running' : runComplete ? 'done' : 'idle'}</span>
              </div>
              <div className="h-[140px] space-y-1.5 overflow-y-auto pr-1">
                {REASONING_TRACE_STEPS.map((step, index) => {
                  const status = reasoningStatus(index, currentStepIndex);
                  return (
                    <div key={step.label} className={`rounded border p-2 transition-all duration-300 ${statusPillClass(status)} ${status === 'running' ? 'animate-pulse' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${statusPillClass(status)}`}>
                          {status === 'complete' ? <CheckCircle2 size={11} /> : status === 'running' ? <Loader2 size={11} className="animate-spin" /> : index + 1}
                        </span>
                        <span className="text-[10px] font-bold font-mono text-amber-300">{step.label}</span>
                      </div>
                      {status === 'complete' && (
                        <div className="mt-1.5 space-y-1 pl-7">
                          <pre className="whitespace-pre-wrap break-all rounded bg-black/40 px-1.5 py-1 font-mono text-[9px] leading-relaxed text-amber-200/70">{step.gemmaCmd}</pre>
                          <p className="text-[10px] text-cyan-300/80">{step.toolResult}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL — Insight & Action */}
        <aside className="cockpit-scroll w-[360px] shrink-0 overflow-y-auto border-l border-slate-800/50 bg-[#080E19] p-3 space-y-3">
          <div className={`rounded-lg border p-4 text-center transition-all duration-500 ${runComplete ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-slate-800 bg-[#0A0F1A]'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Confidence</p>
            <p className={`mt-1 text-4xl font-black ${runComplete ? 'text-emerald-300' : 'text-slate-700'}`}>{runComplete ? `${SCIENTIFIC_INSIGHT.confidence}%` : '—'}</p>
            <p className="mt-1 text-[10px] text-slate-500">{runComplete ? 'High confidence — phase confirmed' : 'Pending agent execution'}</p>
          </div>

          <div className={`rounded-lg border p-3 ${runComplete ? 'border-cyan-400/20 bg-[#07111F]' : 'border-slate-800 bg-[#0A0F1A]'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Identified Phase</p>
            <p className={`mt-1 text-lg font-bold ${runComplete ? 'text-white' : 'text-slate-700'}`}>{runComplete ? SCIENTIFIC_INSIGHT.phase : 'Pending'}</p>
            {runComplete && <p className="mt-1 text-[11px] text-slate-400">Spinel ferrite · Fd-3m</p>}
          </div>

          {showScientificInsight && result ? (
            <div className="agent-insight-in space-y-3">
              <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Evidence</p>
                <div className="space-y-1">
                  {SCIENTIFIC_INSIGHT.evidence.map(e => (
                    <div key={e} className="flex items-start gap-2 rounded-md border border-slate-800 bg-[#070B12] px-2 py-1.5 text-[11px] text-slate-300">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-300" /><span>{e}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Confidence Basis</p>
                <div className="space-y-1">
                  {SCIENTIFIC_INSIGHT.confidenceBasis.map(c => (
                    <div key={c} className="flex items-center gap-2 rounded-md border border-indigo-400/20 bg-indigo-500/10 px-2 py-1.5 text-[11px] text-indigo-100">
                      <CircleDot size={11} className="shrink-0 text-indigo-200" /><span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Interpretation</p>
                <p className="mt-1.5 text-[11px] leading-5 text-slate-300">{SCIENTIFIC_INSIGHT.interpretation}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-2.5">
                  <p className="text-[9px] font-bold uppercase text-amber-300">Model</p>
                  <p className="mt-1 text-[11px] text-slate-200">{SCIENTIFIC_INSIGHT.modelRole}</p>
                </div>
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-2.5">
                  <p className="text-[9px] font-bold uppercase text-cyan-300">Tools</p>
                  <p className="mt-1 text-[11px] text-slate-200">{SCIENTIFIC_INSIGHT.toolRole}</p>
                </div>
              </div>
              <div className="rounded-lg border border-orange-400/20 bg-orange-400/5 p-3">
                <div className="flex items-center gap-1.5 mb-1"><AlertTriangle size={12} className="text-orange-300" /><p className="text-[9px] font-bold uppercase text-orange-300">Caveat</p></div>
                <p className="text-[11px] leading-5 text-slate-300">{SCIENTIFIC_INSIGHT.caveat}</p>
              </div>
              <div className="rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-3">
                <p className="text-[9px] font-bold uppercase text-indigo-200">Recommended Next</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-200">{SCIENTIFIC_INSIGHT.nextStep}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleExportReport} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-cyan-400/40 bg-[#0A0F1A] text-[11px] font-semibold text-cyan-300 hover:bg-cyan-400/10"><Download size={12} />Export</button>
                <Link to={workspacePath} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-[#0A0F1A] text-[11px] font-semibold text-slate-200 hover:border-slate-500"><Microscope size={12} />Workspace</Link>
                <button type="button" onClick={handleSaveToNotebook} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-indigo-400/40 bg-[#0A0F1A] text-[11px] font-semibold text-indigo-200 hover:bg-indigo-500/10"><FileText size={12} />Notebook</button>
                <button type="button" onClick={handleGenerateReproducibleReport} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-emerald-400/40 bg-[#0A0F1A] text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10"><ClipboardList size={12} />Repro Report</button>
              </div>
              {feedback && <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] font-semibold text-primary">{feedback}</div>}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-4 text-center">
              <Brain size={28} className="mx-auto mb-2 text-slate-700" />
              <p className="text-xs font-semibold text-white">Decision Pending</p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">Run the agent to execute tools, collect evidence, and generate the scientific insight.</p>
            </div>
          )}

          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1">Why This Matters</p>
            <p className="text-[11px] leading-5 text-slate-300">{IMPACT_TEXT}</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-2.5 text-center">
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-300">Demo build: structured Gemma orchestration</span>
          </div>
        </aside>

      </div>
    </div>
  );
}
