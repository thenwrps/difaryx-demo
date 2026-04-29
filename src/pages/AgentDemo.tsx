import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronLeft,
  CircleDot,
  ClipboardList,
  Database,
  Download,
  FileText,
  Loader2,
  Microscope,
  Play,
  Terminal,
} from 'lucide-react';
import { Graph } from '../components/ui/Graph';
import {
  AgentRunResult,
  DemoDataset,
  Technique,
  buildAgentRun,
  getProjectDatasets,
  getProcessingRuns,
  getSavedEvidence,
  getNotebookPath,
  getProject,
  getTechniqueEvidence,
  getWorkspaceRoute,
  saveAgentRunResult,
} from '../data/demoProjects';

type AgentState = 'idle' | 'input' | 'context' | 'execution' | 'fusion' | 'reasoning' | 'decision' | 'complete';

type AgentRunHistoryItem = {
  id: string;
  prompt: string;
  result: AgentRunResult;
  datasets: string[];
  createdAt: string;
};

const PIPELINE_STEPS: { id: AgentState; label: string }[] = [
  { id: 'input', label: 'Input' },
  { id: 'context', label: 'Context' },
  { id: 'execution', label: 'Execution' },
  { id: 'fusion', label: 'Fusion' },
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'decision', label: 'Decision' },
  { id: 'complete', label: 'Complete' },
];

const EXECUTION_STEPS = [
  {
    label: 'Parse scientific goal',
    summary: 'Extract target phase, catalytic activation question, and required evidence.',
  },
  {
    label: 'Build analysis plan',
    summary: 'Map selected datasets to XRD, Raman, FTIR, and XPS reasoning modules.',
  },
  {
    label: 'Validate dataset context',
    summary: 'Confirm project identity, file coverage, and technique readiness.',
  },
  {
    label: 'Run XRD phase screening',
    summary: 'Compare diffraction peaks against ferrite spinel reference positions.',
  },
  {
    label: 'Run Raman validation',
    summary: 'Check vibrational modes for spinel fingerprint support.',
  },
  {
    label: 'Run FTIR bonding check',
    summary: 'Review metal-oxygen and surface bonding bands.',
  },
  {
    label: 'Review XPS evidence',
    summary: 'Assess oxidation-state support and note incomplete surface evidence.',
  },
  {
    label: 'Fuse multi-tech evidence',
    summary: 'Combine phase, vibrational, bonding, and surface evidence.',
  },
  {
    label: 'Generate conclusion',
    summary: 'Produce confidence, caveats, and the next recommended step.',
  },
];

const EVIDENCE_SUMMARY = [
  {
    technique: 'XRD',
    feature: 'spinel peaks matched',
    contribution: 'High',
    caveat: 'Compact reference library in demo mode.',
  },
  {
    technique: 'Raman',
    feature: 'A1g mode supports spinel',
    contribution: 'High',
    caveat: 'Mode assignment is deterministic demo evidence.',
  },
  {
    technique: 'FTIR',
    feature: 'metal-oxygen band present',
    contribution: 'Medium',
    caveat: 'Bonding evidence supports but does not prove phase alone.',
  },
  {
    technique: 'XPS',
    feature: 'surface oxidation evidence partial',
    contribution: 'Medium',
    caveat: 'Catalytic activation remains pending full XPS validation.',
  },
];

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function evidenceCountForState(state: AgentState) {
  if (state === 'fusion' || state === 'reasoning') return 2;
  if (state === 'decision' || state === 'complete') return 99;
  if (state === 'execution') return 1;
  return 0;
}

function uniqueTechniques(datasets: DemoDataset[]): Technique[] {
  return Array.from(new Set(datasets.map((dataset) => dataset.technique)));
}

function activeGraphIndexForState(state: AgentState, count: number) {
  if (count === 0 || !['execution', 'fusion', 'reasoning', 'decision'].includes(state)) return -1;
  if (state === 'execution') return 0;
  if (state === 'fusion') return Math.min(1, count - 1);
  if (state === 'reasoning') return Math.min(2, count - 1);
  return count - 1;
}

function promptFocus(prompt: string) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('surface') || normalized.includes('xps')) return 'surface-state focus';
  if (normalized.includes('caveat') || normalized.includes('risk')) return 'caveat-focused reasoning';
  if (normalized.includes('report') || normalized.includes('notebook')) return 'report-ready interpretation';
  if (normalized.includes('raman')) return 'vibrational evidence focus';
  return 'phase decision focus';
}

export default function AgentDemo() {
  const [searchParams] = useSearchParams();
  const project = getProject(searchParams.get('project'));
  const [goal, setGoal] = useState('Determine whether the ferrite spinel phase formed and whether the evidence supports catalytic activation.');
  const [agentMode, setAgentMode] = useState('Deep Analysis');
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [timelineIndex, setTimelineIndex] = useState(-1);
  const [logs, setLogs] = useState<{ time: string; msg: string; type?: string }[]>([]);
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showReasoningTrace, setShowReasoningTrace] = useState(false);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
  const [runHistory, setRunHistory] = useState<AgentRunHistoryItem[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const isRunning = !['idle', 'complete'].includes(agentState) && !isComplete;
  const availableDatasets = useMemo(() => getProjectDatasets(project.id), [project.id]);
  const selectedDatasetRows = useMemo(
    () => availableDatasets.filter((dataset) => selectedDatasetIds.includes(dataset.id)),
    [availableDatasets, selectedDatasetIds],
  );
  const selectedTechniques = useMemo(() => uniqueTechniques(selectedDatasetRows), [selectedDatasetRows]);
  const previewRun = useMemo(() => buildAgentRun(project, selectedTechniques), [project, selectedTechniques]);
  const stagedEvidence = getTechniqueEvidence(project, selectedTechniques).slice(0, evidenceCountForState(agentState));
  const activeGraphIndex = activeGraphIndexForState(agentState, selectedDatasetRows.length);
  const statusLabel = isComplete ? 'Complete' : agentState === 'input' || agentState === 'context' ? 'Planning' : isRunning ? 'Running' : 'Idle';

  useEffect(() => {
    const nextDatasets = getProjectDatasets(project.id);
    setGoal('Determine whether the ferrite spinel phase formed and whether the evidence supports catalytic activation.');
    setAgentMode('Deep Analysis');
    setSelectedDatasetIds(nextDatasets.filter((dataset) => project.techniques.includes(dataset.technique)).map((dataset) => dataset.id));
    setAgentState('idle');
    setTimelineIndex(-1);
    setLogs([]);
    setResult(null);
    setIsComplete(false);
    setShowReasoningTrace(false);
    setRunHistory([]);
  }, [project.id, project.name, project.techniques]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string, type: string = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString([], { hour12: false }),
        msg,
        type,
      },
    ]);
  };

  const toggleDataset = (datasetId: string) => {
    if (isRunning) return;
    setSelectedDatasetIds((current) =>
      current.includes(datasetId)
        ? current.filter((item) => item !== datasetId)
        : [...current, datasetId],
    );
  };

  const runAgent = async () => {
    if (!goal.trim() || isRunning) return;

    const baseRun = buildAgentRun(project, selectedTechniques);
    const graphEvidence = selectedDatasetRows.map(
      (dataset) => `${dataset.technique} graph ${dataset.fileName} was included in the reasoning view.`,
    );
    const run: AgentRunResult = {
      ...baseRun,
      decision: `${baseRun.decision} with ${promptFocus(goal)}`,
      evidence: [...baseRun.evidence, ...graphEvidence],
      summary: `${baseRun.summary} Prompt focus: ${promptFocus(goal)}. Graphs reviewed: ${selectedDatasetRows.map((dataset) => dataset.fileName).join(', ') || 'none'}.`,
    };
    setLogs((prev) => (
      prev.length > 0
        ? [
            ...prev,
            {
              time: new Date().toLocaleTimeString([], { hour12: false }),
              msg: '--- New agent run started ---',
              type: 'system',
            },
          ]
        : []
    ));
    setResult(null);
    setIsComplete(false);
    setShowReasoningTrace(false);
    setTimelineIndex(0);

    setAgentState('input');
    addLog(`Goal received: "${goal}"`, 'info');
    addLog(`Datasets selected: ${selectedDatasetRows.map((dataset) => dataset.fileName).join(', ') || 'none'}`, 'info');
    await wait(450);

    setAgentState('context');
    setTimelineIndex(1);
    addLog(`Analysis plan created in ${agentMode} mode`, 'info');
    await wait(450);

    setTimelineIndex(2);
    addLog(`Loaded project context: ${project.name}`, 'info');
    addLog(`Material system: ${project.material}`, 'info');
    await wait(450);

    setAgentState('execution');
    setTimelineIndex(3);
    addLog(`Executing ${selectedTechniques.join(' + ') || 'no'} evidence modules`, 'system');
    addLog(selectedTechniques.includes('XRD') ? `Detected ${project.xrdPeaks.length} XRD peaks` : 'XRD peak matching skipped', 'system');
    selectedDatasetRows.forEach((dataset) => addLog(`Graph queued: ${dataset.technique} / ${dataset.fileName}`, 'system'));
    await wait(420);

    setTimelineIndex(4);
    addLog(selectedTechniques.includes('Raman') ? 'Raman validation module complete' : 'Raman validation skipped', 'system');
    await wait(420);

    setTimelineIndex(5);
    addLog(selectedTechniques.includes('FTIR') ? 'FTIR bonding check complete' : 'FTIR bonding check skipped', 'system');
    await wait(420);

    setTimelineIndex(6);
    addLog(selectedTechniques.includes('XPS') ? 'XPS surface evidence reviewed' : 'XPS evidence marked partial', 'system');
    await wait(420);

    setAgentState('fusion');
    setTimelineIndex(7);
    addLog('Fusing selected technique evidence', 'info');
    run.evidence.forEach((item) => addLog(`Evidence: ${item}`, 'success'));
    await wait(600);

    setAgentState('reasoning');
    addLog('Reasoning over confidence, missing evidence, and recommendations', 'system');
    run.warnings.forEach((warning) => addLog(`Warning: ${warning}`, 'error'));
    await wait(550);

    setAgentState('decision');
    setTimelineIndex(8);
    setResult(run);
    setRunHistory((current) => [
      {
        id: `${run.projectId}-${Date.now()}`,
        prompt: goal,
        result: run,
        datasets: selectedDatasetRows.map((dataset) => `${dataset.technique}: ${dataset.fileName}`),
        createdAt: new Date().toLocaleString(),
      },
      ...current,
    ].slice(0, 6));
    addLog(`Decision generated: ${run.decision}`, 'success');
    addLog(`Confidence assigned: ${run.confidence}%`, 'success');
    saveAgentRunResult(run);
    await wait(650);

    setAgentState('complete');
    setTimelineIndex(EXECUTION_STEPS.length);
    addLog('Run complete; notebook result prepared', 'success');
    await wait(400);
    setIsComplete(true);
  };

  const startNewRun = () => {
    setIsComplete(false);
    setResult(null);
    setAgentState('idle');
    setTimelineIndex(-1);
    setShowReasoningTrace(false);
    setGoal('Determine whether the ferrite spinel phase formed and whether the evidence supports catalytic activation.');
    setLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString([], { hour12: false }),
        msg: 'Ready for another prompt.',
        type: 'info',
      },
    ]);
  };

  if (false && isComplete && result) {
    const matrixTechniques = (['XRD', 'Raman', 'XPS', 'FTIR'] as Technique[]).filter(
      (technique) => project.techniques.includes(technique) || result.selectedDatasets.includes(technique),
    );
    const selectedTechniqueSet = new Set(result.selectedDatasets);
    const baseWeights: Record<Technique, number> = { XRD: 42, Raman: 28, XPS: 18, FTIR: 12 };
    const selectedWeightTotal =
      matrixTechniques.reduce((sum, technique) => sum + (selectedTechniqueSet.has(technique) ? baseWeights[technique] : 0), 0) || 1;
    const evidenceMatrix = matrixTechniques.map((technique) => {
      const dataset = selectedDatasetRows.find((item) => item.technique === technique);
      const savedEvidence = getSavedEvidence(project.id, technique);
      const evidenceText =
        result.evidence.find((item) => item.toLowerCase().includes(technique.toLowerCase())) ??
        savedEvidence[0]?.claim ??
        `${technique} evidence was available but not selected for this run.`;
      const weight = selectedTechniqueSet.has(technique) ? Math.round((baseWeights[technique] / selectedWeightTotal) * 100) : 0;

      return {
        technique,
        datasetName: dataset?.fileName ?? 'Not selected',
        evidenceText,
        weight,
        status: selectedTechniqueSet.has(technique) ? 'Included' : 'Available',
      };
    });
    const workspacePath = selectedDatasetRows[0]
      ? getWorkspaceRoute(project, selectedDatasetRows[0].technique, selectedDatasetRows[0].id)
      : getWorkspaceRoute(project);
    const notebookPath = getNotebookPath(project);
    const fullReportPath = `${notebookPath}&report=full`;
    const reasoningTrace = [
      {
        title: 'Input datasets selected',
        detail: selectedDatasetRows.map((dataset) => `${dataset.technique}: ${dataset.fileName}`).join(', ') || 'No datasets selected.',
      },
      { title: 'Project context loaded', detail: `${project.name} / ${project.material}` },
      {
        title: 'XRD peaks extracted',
        detail: selectedTechniqueSet.has('XRD') ? `${result.detectedPeaks.length} diffraction peaks extracted.` : 'XRD was not selected.',
      },
      {
        title: 'Raman modes extracted',
        detail: selectedTechniqueSet.has('Raman') ? 'Raman mode evidence reviewed for spinel structure.' : 'Raman was not selected.',
      },
      { title: 'Evidence fused', detail: `${evidenceMatrix.filter((row) => row.status === 'Included').length} technique rows contributed.` },
      { title: 'Decision generated', detail: result.decision },
    ];

    return (
      <div className="min-h-screen bg-[#070B12] text-slate-300 font-sans flex flex-col">
        <header className="h-16 border-b border-slate-800 bg-[#0A0F1A] flex items-center justify-between px-6 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
              <Brain size={14} className="text-primary" />
            </div>
            <span className="font-semibold text-white tracking-wide">DIFARYX Agent</span>
          </Link>
          <span className="hidden lg:inline text-xs text-slate-500">{project.name}</span>
        </header>

        <main className="flex-1 overflow-y-auto flex items-start justify-center px-4 md:px-6 py-6 md:py-10">
          <div className="w-full max-w-5xl">
            <div className="text-center">
              <CheckCircle2 size={42} className="text-emerald-400 mx-auto mb-5" />
              <h1 className="text-3xl font-bold text-white tracking-tight">Agent run complete</h1>
              <p className="mt-3 text-sm text-slate-400">
                DIFARYX generated a traceable decision from experimental evidence.
              </p>
              <button
                type="button"
                onClick={startNewRun}
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/25"
              >
                <Play size={15} fill="currentColor" />
                Run another prompt
              </button>
            </div>

            <div className="mt-8 rounded-xl border border-slate-800 bg-[#0A0F1A] p-5 shadow-xl shadow-black/20">
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Final Decision</p>
                  <p className="mt-1 text-base font-semibold text-white">{result.decision}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Confidence score</p>
                  <p className="mt-1 text-base font-semibold text-emerald-300">{result.confidenceLabel} ({result.confidence}%)</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Recommended next action</p>
                  <p className="mt-1 text-sm text-slate-300">{result.recommendations[0]}</p>
                </div>

                <div className="lg:col-span-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Evidence Matrix</p>
                    <span className="text-[11px] text-slate-500">{project.name}</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-800">
                    {evidenceMatrix.map((row) => (
                      <div key={row.technique} className="grid gap-3 border-b border-slate-800 bg-[#070B12] p-3 last:border-b-0 md:grid-cols-[120px_1fr_120px]">
                        <div>
                          <p className="text-xs font-semibold text-white">{row.technique} evidence</p>
                          <p className="mt-1 text-[11px] text-slate-500">{row.datasetName}</p>
                        </div>
                        <p className="text-sm leading-6 text-slate-300">{row.evidenceText}</p>
                        <div className="text-left md:text-right">
                          <p className={`text-xs font-semibold ${row.status === 'Included' ? 'text-emerald-300' : 'text-amber-300'}`}>{row.status}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{row.weight}% contribution</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Technique contribution weights</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {evidenceMatrix.map((row) => (
                      <div key={`${row.technique}-weight`} className="rounded-lg border border-slate-800 bg-[#070B12] p-3">
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">{row.technique}</span>
                          <span className="text-slate-400">{row.weight}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: `${row.weight}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-3 rounded-lg border border-slate-800 bg-[#070B12] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Reasoning Trace timeline</p>
                    <span className="text-[11px] text-slate-500">6 steps</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    {reasoningTrace.map((step, index) => (
                      <div key={step.title} className="rounded-md border border-slate-800 bg-[#0A0F1A] p-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {index + 1}
                          </span>
                          <p className="text-xs font-semibold text-white">{step.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {showReasoningTrace && (
                    <div className="mt-4 space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      {reasoningTrace.map((step, index) => (
                        <div key={`${step.title}-detail`} className="flex gap-3 text-sm">
                          <span className="mt-0.5 text-xs font-semibold text-cyan">{index + 1}.</span>
                          <div>
                            <p className="font-semibold text-white">{step.title}</p>
                            <p className="text-slate-400">{step.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Caveats / warnings</p>
                  <p className="mt-1 text-sm text-amber-100/80">
                    {result.warnings.length > 0 ? result.warnings.join(' ') : 'No major caveats were generated for the selected evidence set.'}
                  </p>
                </div>

                <div className="lg:col-span-3 rounded-lg border border-slate-800 bg-[#070B12] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Run history</p>
                    <span className="text-[11px] text-slate-500">{runHistory.length} run{runHistory.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {runHistory.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setResult(item.result);
                          setGoal(item.prompt);
                          setShowReasoningTrace(true);
                        }}
                        className="rounded-md border border-slate-800 bg-[#0A0F1A] p-3 text-left hover:border-cyan/40"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-white">{item.result.confidence}% confidence</span>
                          <span className="text-[10px] text-slate-500">{item.createdAt}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-400">{item.prompt}</p>
                        <p className="mt-2 text-[10px] text-cyan">{item.datasets.join(', ') || 'No datasets'}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 lg:flex-row">
              <button
                type="button"
                onClick={() => setShowReasoningTrace((current) => !current)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#0A0F1A] px-5 text-sm font-bold text-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/60 hover:text-cyan-200 lg:w-auto"
              >
                <ClipboardList size={16} />
                View Reasoning Trace
              </button>
              <button
                type="button"
                onClick={startNewRun}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/60 bg-[#070B12] px-5 text-sm font-bold text-cyan-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-200 lg:w-auto"
              >
                <Play size={16} fill="currentColor" />
                New agent run
              </button>
              <Link
                to={fullReportPath}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#0A0F1A] px-5 text-sm font-bold text-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:text-white lg:w-auto"
              >
                <Download size={16} />
                Open Full Report
              </Link>
              <Link
                to={workspacePath}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/25 lg:w-auto"
              >
                Back to Workspace
              </Link>
              <Link
                to={notebookPath}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-700 bg-[#0A0F1A] px-6 text-sm font-bold text-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:text-white lg:w-auto"
              >
                Open Notebook
              </Link>
              <Link
                to="/"
                className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-cyan-400/70 bg-[#070B12] px-6 text-sm font-bold text-cyan-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-200 hover:shadow-lg hover:shadow-cyan-500/10 lg:w-auto"
              >
                Return Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-300 font-sans flex flex-col h-screen overflow-hidden">
      <header className="h-16 border-b border-slate-800 bg-[#0A0F1A] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to={selectedDatasetRows[0] ? getWorkspaceRoute(project, selectedDatasetRows[0].technique, selectedDatasetRows[0].id) : getWorkspaceRoute(project)}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Back to workspace"
          >
            <ChevronLeft size={20} />
          </Link>
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
              <Brain size={14} className="text-primary" />
            </div>
            <span className="font-semibold text-white tracking-wide">DIFARYX Agent</span>
          </Link>
          <span className="hidden lg:inline text-xs text-slate-500 border-l border-slate-800 pl-4">{project.name}</span>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {PIPELINE_STEPS.map((step, idx) => {
            const activeIndex = PIPELINE_STEPS.findIndex((item) => item.id === agentState);
            const isActive = agentState === step.id;
            const isPast = activeIndex > idx;
            let color = 'text-slate-600 border-slate-700';
            if (isActive) color = 'text-cyan border-cyan bg-cyan/10 animate-pulse';
            else if (isPast) color = 'text-primary border-primary bg-primary/10';

            return (
              <React.Fragment key={step.id}>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${color}`}>
                  {isPast ? <CheckCircle2 size={12} /> : isActive && isRunning ? <Loader2 size={12} className="animate-spin" /> : <CircleDot size={12} />}
                  {step.label}
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <ArrowRight size={14} className={isPast ? 'text-primary/50' : 'text-slate-700'} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className={`flex items-center gap-2 text-xs font-medium ${isRunning ? 'text-emerald-400' : 'text-slate-500'}`}>
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          {isRunning ? 'Agent Active' : 'Agent Idle'}
        </div>
      </header>

      <section className="shrink-0 border-b border-slate-800 bg-[#0A0F1A] px-6 py-4">
        <div className="grid gap-4 xl:grid-cols-[220px_1fr_300px_auto] xl:items-end">
          <div className="rounded-lg border border-slate-800 bg-[#070B12] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Project</p>
            <p className="mt-1 text-sm font-semibold text-white">CuFe2O4 Spinel Formation</p>
          </div>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Goal</span>
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              disabled={isRunning}
              className="mt-1 h-16 w-full resize-none rounded-lg border border-slate-800 bg-[#070B12] px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-primary disabled:opacity-70"
            />
          </label>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Mode selector</p>
            <div className="mt-1 grid grid-cols-3 gap-1">
              {['Quick Insight', 'Deep Analysis', 'Autonomous Workflow'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAgentMode(mode)}
                  disabled={isRunning}
                  className={`min-h-10 rounded-md border px-2 text-center text-[10px] font-semibold transition-colors ${
                    agentMode === mode
                      ? 'border-cyan/50 bg-cyan/10 text-cyan'
                      : 'border-slate-800 bg-[#070B12] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span
              className={`inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-semibold ${
                statusLabel === 'Complete'
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                  : statusLabel === 'Running' || statusLabel === 'Planning'
                    ? 'border-cyan/40 bg-cyan/10 text-cyan'
                    : 'border-slate-700 bg-[#070B12] text-slate-400'
              }`}
            >
              {statusLabel}
            </span>
            <button
              type="button"
              onClick={runAgent}
              disabled={isRunning || !goal.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
              Run Agent
            </button>
          </div>
        </div>
      </section>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-slate-800 bg-[#0A0F1A]/50 p-5 flex flex-col gap-6 shrink-0 overflow-y-auto">
          <div className="rounded-lg border border-slate-800 bg-[#070B12] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Project context</p>
            <h1 className="mt-1 text-sm font-semibold text-white">{project.name}</h1>
            <p className="mt-1 text-xs text-slate-500">{project.summary}</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Activity size={16} className="text-primary" /> Define Goal
            </h2>
            <textarea
              className="w-full bg-[#070B12] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary resize-none h-32"
              placeholder="What do you want the agent to analyze?"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              disabled={isRunning}
            />
            <button
              onClick={runAgent}
              disabled={isRunning || !goal.trim()}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
              {isRunning ? 'Agent Running...' : 'Execute Agent'}
            </button>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Database size={16} className="text-primary" /> Available Datasets
            </h2>
            <div className="space-y-2">
              {availableDatasets.map((dataset) => {
                const checked = selectedDatasetIds.includes(dataset.id);
                const savedEvidenceCount = getSavedEvidence(project.id, dataset.technique).length;
                const savedRunCount = getProcessingRuns(dataset.id).length;
                return (
                  <div
                    key={dataset.id}
                    className={`rounded border p-2.5 transition-colors ${
                      checked ? 'bg-primary/10 border-primary/30' : 'bg-[#070B12] border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className={`flex min-w-0 flex-1 items-center gap-2 ${isRunning ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDataset(dataset.id)}
                          disabled={isRunning}
                          className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary focus:ring-offset-[#070B12]"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium text-slate-300">{dataset.fileName}</span>
                          <span className="block text-[10px] text-slate-500">
                            {savedRunCount > 0
                              ? `${savedRunCount} saved run${savedRunCount === 1 ? '' : 's'}`
                              : savedEvidenceCount > 0
                                ? `${savedEvidenceCount} saved evidence item${savedEvidenceCount === 1 ? '' : 's'}`
                                : dataset.sampleName}
                          </span>
                        </span>
                      </label>
                      <div className="ml-2 flex shrink-0 items-center gap-2">
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{dataset.technique}</span>
                        <Link
                          to={getWorkspaceRoute(project, dataset.technique, dataset.id)}
                          className="text-[10px] font-semibold text-cyan hover:text-blue-200"
                        >
                          Open Spectrum
                        </Link>
                      </div>
                    </div>
                    <div className="mt-2 h-16 rounded border border-slate-800 bg-[#050812] p-1">
                      <Graph
                        type={dataset.technique.toLowerCase() as 'xrd' | 'xps' | 'ftir' | 'raman'}
                        height="100%"
                        externalData={dataset.dataPoints}
                        showCalculated={false}
                        showResidual={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Project datasets start selected. Toggle evidence to see confidence and warnings change.
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-6 flex flex-col min-h-0 relative">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Microscope size={16} className="text-primary" /> Execution View: Evidence Pattern
            </h2>
            <div className="flex-1 bg-[#0A0F1A] border border-slate-800 rounded-xl p-4 relative min-h-0 overflow-y-auto">
              {selectedDatasetRows.length === 0 ? (
                <div className="flex h-full min-h-[260px] items-center justify-center text-center text-sm text-slate-500">
                  Select at least one dataset to render technique evidence graphs.
                </div>
              ) : (
                <div className={`grid gap-4 ${selectedDatasetRows.length === 1 ? 'grid-cols-1' : 'grid-cols-1 2xl:grid-cols-2'}`}>
                  {selectedDatasetRows.map((dataset, index) => {
                    const isActiveGraph = isRunning && index === activeGraphIndex;
                    const savedRunCount = getProcessingRuns(dataset.id).length;
                    return (
                      <div
                        key={dataset.id}
                        className={`rounded-lg border bg-[#070B12] p-3 transition-colors ${
                          isActiveGraph ? 'border-cyan/70 shadow-lg shadow-cyan/10' : 'border-slate-800'
                        }`}
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-cyan">{dataset.technique} graph</div>
                            <div className="text-xs text-slate-400">{dataset.fileName}</div>
                          </div>
                          <div className="flex flex-wrap justify-end gap-1">
                            {isActiveGraph && (
                              <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-cyan">
                                processing
                              </span>
                            )}
                            {savedRunCount > 0 && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                saved run
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-56 rounded-md border border-slate-800 bg-[#050812] p-2">
                          <Graph
                            type={dataset.technique.toLowerCase() as 'xrd' | 'xps' | 'ftir' | 'raman'}
                            height="100%"
                            externalData={dataset.dataPoints}
                            showCalculated={false}
                            showResidual={false}
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-slate-400">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5">{dataset.xLabel}</span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.5">{dataset.yLabel}</span>
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                            {getSavedEvidence(project.id, dataset.technique).length > 0 ? 'saved evidence' : 'project evidence'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isRunning && (
                <div className="pointer-events-none absolute right-6 top-6 rounded-lg border border-cyan/30 bg-[#070B12]/90 px-3 py-2 shadow-lg shadow-cyan/10">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="text-cyan animate-spin" />
                    <div>
                      <h3 className="text-xs font-semibold text-white">Agent is analyzing</h3>
                      <p className="text-[11px] text-cyan animate-pulse">
                      {agentState === 'execution'
                        ? 'Extracting selected evidence...'
                        : agentState === 'fusion'
                          ? 'Fusing evidence across modules...'
                          : agentState === 'reasoning'
                            ? 'Evaluating confidence and caveats...'
                            : 'Preparing run state...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-64 border-t border-slate-800 bg-[#0A0F1A]/80 p-4 flex flex-col shrink-0">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Terminal size={14} /> Execution Log
            </h2>
            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1.5 pr-2 custom-scrollbar">
              {logs.length === 0 && <span className="text-slate-600">Waiting for agent execution...</span>}
              {logs.map((log, i) => (
                <div key={`${log.time}-${i}`} className="flex gap-3">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span
                    className={`
                      ${log.type === 'system' ? 'text-cyan' : ''}
                      ${log.type === 'error' ? 'text-amber-300' : ''}
                      ${log.type === 'success' ? 'text-emerald-400' : ''}
                      ${log.type === 'info' ? 'text-slate-300' : ''}
                    `}
                  >
                    {log.type === 'system' && '> '}
                    {log.msg}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        <div className="w-[340px] border-l border-slate-800 bg-[#0A0F1A]/50 p-5 flex flex-col gap-6 shrink-0 overflow-y-auto">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText size={16} className="text-primary" /> Final Decision
          </h2>

          <div className="rounded-xl border border-slate-800 bg-[#070B12] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Agent Timeline</h3>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                Goal → Plan → Execute → Evidence → Decision
              </span>
            </div>
            <div className="space-y-2">
              {EXECUTION_STEPS.map((step, index) => {
                const running = isRunning && index === timelineIndex;
                const complete = isComplete || index < timelineIndex;
                const status = running ? 'running' : complete ? 'complete' : 'pending';

                return (
                  <div key={step.label} className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                          status === 'complete'
                            ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
                            : status === 'running'
                              ? 'border-cyan/60 bg-cyan/10 text-cyan'
                              : 'border-slate-700 bg-slate-900 text-slate-500'
                        }`}
                      >
                        {status === 'complete' ? '✓' : index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold text-white">{step.label}</p>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                              status === 'complete'
                                ? 'bg-emerald-400/10 text-emerald-300'
                                : status === 'running'
                                  ? 'bg-cyan/10 text-cyan'
                                  : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-slate-500">{step.summary}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#070B12] p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Evidence Summary</h3>
            <div className="space-y-2">
              {EVIDENCE_SUMMARY.map((item) => (
                <div key={item.technique} className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-cyan">{item.technique}</span>
                    <span className="text-[10px] font-semibold text-emerald-300">{item.contribution}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-white">{item.feature}</p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">{item.caveat}</p>
                </div>
              ))}
            </div>
          </div>

          {agentState === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <Brain size={48} className="text-slate-700 mb-4" />
              <p className="text-sm text-slate-400">Run the agent to see the final decision and evidence.</p>
            </div>
          )}

          {agentState !== 'idle' && !result && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="rounded-xl border border-slate-800 bg-[#070B12] p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Current state</p>
                <p className="mt-2 text-lg font-semibold text-white capitalize">{agentState}</p>
                <p className="mt-2 text-sm text-slate-400">Confidence preview: {previewRun.confidence}%</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Evidence collected</h4>
                <div className="space-y-2">
                  {stagedEvidence.length === 0 && <p className="text-sm text-slate-500">Collecting selected project evidence...</p>}
                  {stagedEvidence.map((item, idx) => (
                    <div key={item} className="bg-[#070B12] border border-slate-800 rounded-lg p-3 flex gap-3 items-start">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-primary font-bold">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-6">
              <div className="bg-[#070B12] border border-emerald-500/30 rounded-xl p-5 text-center shadow-lg shadow-emerald-500/5">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">{result.decision}</h3>
              </div>

              <div className="bg-[#070B12] border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Confidence Score</span>
                <span className="text-2xl font-bold text-emerald-400">{result.confidence}%</span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Key Evidence</h4>
                <div className="space-y-2">
                  {result.evidence.map((item, idx) => (
                    <div key={item} className="bg-[#070B12] border border-slate-800 rounded-lg p-3 flex gap-3 items-start">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-primary font-bold">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-800 bg-[#070B12] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Final Result</h3>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Conclusion</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-200">
                  {result
                    ? 'Ferrite spinel formation is strongly supported by XRD and Raman evidence, while catalytic activation remains medium-confidence pending XPS validation.'
                    : 'Run the agent to generate a traceable scientific conclusion.'}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0A0F1A] px-3 py-2">
                <span className="text-xs text-slate-500">Confidence</span>
                <span className="text-xs font-semibold text-emerald-300">{result ? result.confidenceLabel : 'Pending'}</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Caveats</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
                  {result?.warnings.length
                    ? result.warnings.join(' ')
                    : 'Catalytic activation requires complete XPS validation before final reporting.'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Next recommended step</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {result ? result.recommendations[0] : 'Start the run, then review workspace evidence and notebook report output.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
