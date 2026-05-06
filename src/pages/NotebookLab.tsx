import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BarChart3, Download, FileText, FlaskConical, Plus, Save, Share2, Target } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AIInsightPanel } from '../components/ui/AIInsightPanel';
import { ExperimentModal } from '../components/workspace/ExperimentModal';
import {
  ProcessingRun,
  demoProjects,
  generateNotebookSections,
  getAgentPath,
  getDataset,
  getLocalExperiments,
  getNotebookPath,
  getProcessingRun,
  getProcessingRuns,
  getProject,
  getProjectInsight,
  getWorkspaceRoute,
  loadAgentRunResult,
} from '../data/demoProjects';
import { DemoExportFormat, exportDemoArtifact } from '../utils/demoExport';
import { getRun, type AgentRun } from '../data/runModel';
import {
  NOTEBOOK_TEMPLATES,
  createNotebookEntryFromRefinement,
  createProcessingResultFromXrdDemo,
  createReportSectionFromNotebookEntry,
  getLatestAgentDiscussionRefinement,
  getLatestNotebookEntry,
  getLatestProcessingResult,
  getNotebookEntry,
  normalizeNotebookTemplateMode,
  refineDiscussionFromProcessing,
  saveAgentDiscussionRefinement,
  saveNotebookEntry,
  saveProcessingResult,
  type NotebookTemplateMode,
} from '../data/workflowPipeline';

const NOTEBOOK_TEMPLATE_MODES: NotebookTemplateMode[] = ['research', 'rd', 'analytical'];

function formatClaimStatus(status: string): string {
  switch (status) {
    case 'strongly_supported': return 'Complete';
    case 'supported': return 'Ready';
    case 'partial': return 'In Progress';
    case 'inconclusive': return 'Review';
    case 'contradicted': return 'Review';
    default: return status;
  }
}

const NOTEBOOK_TEMPLATE_DETAILS: Record<
  NotebookTemplateMode,
  {
    description: string;
    output: string;
    status: string;
    primaryLabel: string;
    reportPreview: string;
    badges: string[];
  }
> = {
  research: {
    description:
      'For hypothesis-driven research, evidence fusion, claim boundaries, mechanism discussion, and manuscript-ready interpretation.',
    output: 'Refined discussion + claim readiness + validation notes.',
    status: 'Publication-limited',
    primaryLabel: 'Refined Discussion',
    reportPreview: 'Manuscript discussion section generated from this notebook entry.',
    badges: ['Source workflow', 'Refined discussion', 'Evidence review', 'Claim boundary', 'Validation notes'],
  },
  rd: {
    description:
      'For prototype development, technical validation, optimization, feasibility review, and go/no-go decisions.',
    output: 'Technical report + development status + next action.',
    status: 'Review-ready',
    primaryLabel: 'Go/No-Go Rationale',
    reportPreview: 'Technical report section generated from prototype metrics, risk review, and decision rationale.',
    badges: ['Source workflow', 'Risk review', 'Go/No-Go rationale', 'Development status', 'Next development plan'],
  },
  analytical: {
    description:
      'For sample analysis, method execution, calibration, QA/QC, result validity, and analytical reporting.',
    output: 'Analytical report + QA/QC status + pass/fail or validity decision.',
    status: 'Report-ready',
    primaryLabel: 'Validated Result',
    reportPreview: 'Analytical report section generated from method, QA/QC, and result validity.',
    badges: ['Source workflow', 'QA/QC review', 'Result validity', 'Analytical result', 'Pass / Fail / Retest'],
  },
};

export default function NotebookLab() {
  const [searchParams] = useSearchParams();
  const project = getProject(searchParams.get('project'));
  const runId = searchParams.get('run');
  const entryId = searchParams.get('entry');
  const agentRun = runId ? getRun(runId) : null;
  const [templateMode, setTemplateMode] = useState<NotebookTemplateMode>(
    () => normalizeNotebookTemplateMode(searchParams.get('template')),
  );
  const [feedback, setFeedback] = useState('');
  const [experimentModalOpen, setExperimentModalOpen] = useState(false);
  const [localExperiments, setLocalExperiments] = useState(() => getLocalExperiments());
  const [observations, setObservations] = useState<string[]>([]);
  const [attachedRun, setAttachedRun] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [observationOpen, setObservationOpen] = useState(false);
  const [observationDraft, setObservationDraft] = useState('');
  const [attachRunOpen, setAttachRunOpen] = useState(false);
  const runResult = useMemo(() => loadAgentRunResult(project.id), [project.id]);
  const workspaceRun = useMemo(() => getProcessingRun(runId), [runId]);
  const workspaceDataset = useMemo(
    () => (workspaceRun ? getDataset(workspaceRun.datasetId) : null),
    [workspaceRun],
  );
  const availableRuns = useMemo(
    () => getProcessingRuns().filter((run) => run.projectId === project.id),
    [project.id, feedback],
  );
  const attachedRunRecord = useMemo(() => getProcessingRun(attachedRun), [attachedRun]);
  const notebookTemplate = NOTEBOOK_TEMPLATES[templateMode];
  const workflowProcessingResult = useMemo(
    () => getLatestProcessingResult(project.id) ?? createProcessingResultFromXrdDemo(project.id),
    [project.id, feedback],
  );
  const workflowRefinement = useMemo(
    () =>
      getLatestAgentDiscussionRefinement(project.id, templateMode) ??
      refineDiscussionFromProcessing(workflowProcessingResult, templateMode),
    [project.id, templateMode, workflowProcessingResult, feedback],
  );
  const workflowNotebookEntry = useMemo(() => {
    const entryFromRoute = getNotebookEntry(entryId);
    if (entryFromRoute?.templateMode === templateMode) return entryFromRoute;
    return (
      getLatestNotebookEntry(project.id, templateMode) ??
      createNotebookEntryFromRefinement(workflowRefinement, templateMode)
    );
  }, [entryId, project.id, templateMode, workflowRefinement, feedback]);
  const workflowReportSection = useMemo(
    () => createReportSectionFromNotebookEntry(workflowNotebookEntry),
    [workflowNotebookEntry],
  );
  const notebookTemplateDetails = NOTEBOOK_TEMPLATE_DETAILS[templateMode];
  const primaryNotebookSection = workflowNotebookEntry.sections[0];
  const supportingNotebookSections = workflowNotebookEntry.sections.slice(1);
  const notebook = useMemo(() => {
    // If we have an agent run, use that data
    if (agentRun) {
      return {
        title: `Characterization Run: ${project.name}`,
        summary: agentRun.outputs.interpretation,
        decision: agentRun.outputs.phase,
        claimStatus: agentRun.outputs.claimStatus || 'supported',
        validationState: agentRun.outputs.validationState || 'complete',
        evidence: agentRun.outputs.evidence,
        warnings: agentRun.outputs.caveats,
        recommendations: agentRun.outputs.recommendations,
        processingPipeline: [
          `Mission: ${agentRun.mission}`,
          `Selected datasets: ${agentRun.outputs.selectedDatasets.join(', ')}`,
          `Detected ${agentRun.outputs.detectedPeaks?.length ?? 0} peaks`,
          'Prepared evidence-linked interpretation with traceable decision context',
        ],
        peakDetection: `${agentRun.outputs.detectedPeaks?.length ?? 0} peaks detected in evidence review`,
        phaseInterpretation: `${agentRun.outputs.phase} - ${formatClaimStatus(agentRun.outputs.claimStatus || 'supported')}`,
      };
    }
    
    const base = generateNotebookSections(project, runResult);
    if (!workspaceRun) return base;

    const claimStatus = workspaceRun.matchResult?.claimStatus ?? project.claimStatus;

    return {
      ...base,
      summary: `${workspaceRun.technique} workspace run generated from ${workspaceDataset?.fileName ?? 'selected dataset'} with ${workspaceRun.detectedFeatures.length} detected features and traceable processing parameters.`,
      decision: workspaceRun.matchResult?.phase ?? `${workspaceRun.technique} evidence saved for ${project.name}`,
      claimStatus,
      validationState: project.validationState,
      evidence: workspaceRun.evidence.map((item) => item.claim),
      warnings: workspaceRun.matchResult?.missingPeaks.length
        ? [`Missing or weak references: ${workspaceRun.matchResult.missingPeaks.join(', ')}.`]
        : [],
      recommendations: project.recommendations,
      processingPipeline: [
        `Dataset: ${workspaceDataset?.fileName ?? workspaceRun.datasetId}.`,
        `Technique: ${workspaceRun.technique}.`,
        ...Object.entries(workspaceRun.parameters).map(([key, value]) => `${key}: ${String(value)}`),
        `Detected features: ${workspaceRun.detectedFeatures.length}.`,
        'Saved evidence and generated notebook section.',
      ],
      peakDetection: `${workspaceRun.detectedFeatures.length} ${workspaceRun.technique === 'XRD' ? 'peaks' : 'features'} detected in the workspace run.`,
      phaseInterpretation: workspaceRun.matchResult
        ? `${workspaceRun.matchResult.phase}. ${workspaceRun.matchResult.caveat}`
        : base.phaseInterpretation,
    };
  }, [project, runResult, workspaceDataset, workspaceRun]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 1800);
  };

  const exportFeedbackMessage = (format: DemoExportFormat) => {
    if (format === 'pdf') {
      return 'Report prepared: Conclusion, supporting data, limitations, and source provenance included.';
    }
    if (format === 'docx') {
      return 'DOCX report prepared with analysis summary, evidence table, and next actions.';
    }
    if (format === 'csv') {
      return 'CSV evidence table prepared for export.';
    }
    if (format === 'txt') {
      return 'TXT report prepared with notebook summary and provenance.';
    }
    return 'PNG report snapshot prepared for export.';
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/notebook?project=${project.id}&template=${templateMode}&entry=${workflowNotebookEntry.id}${workspaceRun ? `&run=${workspaceRun.id}` : ''}`;
    try {
      await navigator.clipboard.writeText(url);
      showFeedback('Share link copied');
    } catch {
      showFeedback(`Share link ready: ${url}`);
    }
  };

  const exportNotebook = (format: DemoExportFormat) => {
    exportDemoArtifact(format, {
      filenameBase: `${project.id}-notebook-report`,
      title: `${notebook.title} Report`,
      sections: [
        { heading: 'Summary', lines: [notebook.summary] },
        { heading: workflowReportSection.heading, lines: workflowReportSection.lines },
        { heading: 'Conclusion', lines: [notebook.decision, formatClaimStatus(notebook.claimStatus)] },
        { heading: 'Pipeline', lines: notebook.processingPipeline },
        { heading: 'Evidence', lines: notebook.evidence },
        ...workflowNotebookEntry.sections.filter((section) => section.heading !== workflowReportSection.heading),
        { heading: 'Added Observations', lines: observations.length > 0 ? observations : ['No added observations.'] },
        {
          heading: 'Attached data',
          lines: attachedRunRecord
            ? [`${attachedRunRecord.technique} run`, new Date(attachedRunRecord.timestamp).toLocaleString(), `${attachedRunRecord.detectedFeatures.length} features`]
            : ['No attached data.'],
        },
      ],
      csvRows: notebook.evidence.map((item, index) => ({
        project: project.name,
        row: index + 1,
        evidence: item,
        status: formatClaimStatus(notebook.claimStatus),
      })),
    });
    setExportMenuOpen(false);
    showFeedback(exportFeedbackMessage(format));
  };

  const printReport = () => {
    window.print();
    showFeedback('Print dialog opened');
  };

  const addObservation = () => {
    const text = observationDraft.trim() || `${project.name} evidence reviewed in notebook.`;
    const nextObservation = `Added observation ${observations.length + 1}: ${text}`;
    setObservations((current) => [nextObservation, ...current]);
    setObservationDraft('');
    setObservationOpen(false);
    showFeedback('Added observation saved');
  };

  const attachRunToNotebook = (run: ProcessingRun) => {
    setAttachedRun(run.id);
    setAttachRunOpen(false);
    showFeedback(`${run.technique} data attached`);
  };

  const saveWorkflowNotebookEntry = () => {
    saveProcessingResult(workflowProcessingResult);
    const refinement = refineDiscussionFromProcessing(workflowProcessingResult, templateMode);
    saveAgentDiscussionRefinement(refinement);
    const entry = createNotebookEntryFromRefinement(refinement, templateMode);
    saveNotebookEntry(entry);
    showFeedback(`${NOTEBOOK_TEMPLATES[templateMode].label} entry saved`);
  };

  const copyAgentSummary = async () => {
    const summary =
      'The analysis used XRD and Raman evidence to evaluate whether the sample is consistent with a CuFe\u2082O\u2084 spinel ferrite assignment. The available diffraction and vibrational evidence support the phase assignment, while XPS oxidation-state validation remains required before stronger surface-chemistry or catalytic-activation claims.';
    try {
      await navigator.clipboard.writeText(summary);
      showFeedback('Summary copied');
    } catch {
      showFeedback('Summary ready to copy');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 h-full flex overflow-hidden bg-background">
        <div className="w-60 border-r border-border bg-surface flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-sm font-semibold">Experiments</h2>
            <Button variant="ghost" size="sm" className="px-2 h-7" onClick={() => setExperimentModalOpen(true)}><Plus size={14} /></Button>
          </div>
          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
            {demoProjects.map((item) => (
              <Link
                key={item.id}
                to={getNotebookPath(item)}
                className={`block w-full text-left px-3 py-2 rounded-md text-xs font-medium leading-snug transition-colors border ${
                  item.id === project.id
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text-main border-transparent'
                }`}
              >
                {item.notebook.title}
              </Link>
            ))}
            {localExperiments.map((experiment) => (
              <Link
                key={experiment.id}
                to={`/notebook?project=${experiment.projectId}`}
                className={`block w-full text-left px-3 py-2 rounded-md text-xs font-medium leading-snug transition-colors border ${
                  experiment.projectId === project.id
                    ? 'bg-primary/5 text-primary border-primary/20'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text-main border-transparent'
                }`}
              >
                <span>{experiment.title}</span>
                <span className="mt-1 block text-xs text-text-muted">{experiment.technique} - {experiment.fileName}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto relative">
          <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur border-b border-border p-3 flex flex-wrap justify-between items-center gap-3">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-text-muted mb-1">
                <span>Created: {project.createdDate}</span>
                <span>|</span>
                <span>Source: XRD processing + interpretation refinement</span>
              </div>
              <h1 className="text-lg font-bold">{notebook.title}</h1>
              <div className="mt-2 flex max-w-4xl flex-wrap gap-1.5">
                {[
                  ['Mode', notebookTemplate.label],
                  ['Pipeline', 'Processed Result -> Evidence Review -> Notebook Entry'],
                  ['Status', notebookTemplateDetails.status],
                ].map(([label, value]) => (
                  <span
                    key={label}
                    className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text-muted"
                  >
                    <span className="text-text-dim">{label}: </span>
                    <span className="text-text-main">{value}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {feedback && (
                <span className="hidden sm:inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary">
                  {feedback}
                </span>
              )}
              <Button variant="outline" size="sm" className="gap-2" onClick={copyShareLink}><Share2 size={14} /> Share</Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={printReport}><FileText size={14} /> Print Report</Button>
              <div className="relative">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setExportMenuOpen((open) => !open)}><Download size={14} /> Export</Button>
                {exportMenuOpen && (
                  <div className="absolute right-0 top-10 z-20 w-44 rounded-lg border border-border bg-white p-2 shadow-xl">
                    {(['pdf', 'docx', 'txt', 'csv', 'png'] as DemoExportFormat[]).map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => exportNotebook(format)}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-surface-hover"
                      >
                        Export {format.toUpperCase()}
                        <Download size={13} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setObservationOpen(true)}><Plus size={14} /> Add Observation</Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setAttachRunOpen(true)}><FileText size={14} /> Attach Data</Button>
              <Button variant="primary" size="sm" className="gap-2" onClick={saveWorkflowNotebookEntry}><Save size={14} /> Save Entry</Button>
            </div>
          </div>

          {observationOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4">
              <div className="w-full max-w-lg rounded-xl border border-border bg-white p-5 shadow-2xl">
                <h2 className="text-base font-bold text-text-main">Add Observation</h2>
                <p className="mt-1 text-sm text-text-muted">Add a demo notebook note tied to the current project context.</p>
                <textarea
                  value={observationDraft}
                  onChange={(event) => setObservationDraft(event.target.value)}
                  placeholder="Example: Raman A1g mode remains consistent with the XRD phase assignment."
                  className="mt-4 h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-main outline-none focus:border-primary"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setObservationOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={addObservation}>Add Observation</Button>
                </div>
              </div>
            </div>
          )}

          {attachRunOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4">
              <div className="w-full max-w-2xl rounded-xl border border-border bg-white p-5 shadow-2xl">
                <h2 className="text-base font-bold text-text-main">Attach Data</h2>
                <p className="mt-1 text-sm text-text-muted">Select saved processing data to link into this notebook.</p>
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                  {availableRuns.length === 0 && (
                    <p className="rounded-md border border-border bg-background p-3 text-sm text-text-muted">
                      No saved data yet. Save processing output in a workspace, then attach it here.
                    </p>
                  )}
                  {availableRuns.slice().reverse().map((run) => {
                    const dataset = getDataset(run.datasetId);
                    return (
                      <button
                        key={run.id}
                        type="button"
                        onClick={() => attachRunToNotebook(run)}
                        className="block w-full rounded-md border border-border bg-background p-3 text-left text-sm hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="font-semibold text-text-main">{run.technique} run - {dataset?.fileName ?? run.datasetId}</span>
                        <span className="mt-1 block text-xs text-text-muted">
                          {new Date(run.timestamp).toLocaleString()} / {run.detectedFeatures.length} features / {formatClaimStatus(run.matchResult?.claimStatus || 'supported')}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setAttachRunOpen(false)}>Back to notebook</Button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 max-w-5xl w-full mx-auto space-y-8">
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:hidden">
              <AIInsightPanel result={getProjectInsight(project)} />
            </section>

            <section className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-main">Notebook Template Selector</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      Choose the experiment mode before creating the notebook entry.
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-right">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Report template</div>
                    <div className="mt-1 text-sm font-bold capitalize text-text-main">
                      {notebookTemplate.reportTemplate.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                  {NOTEBOOK_TEMPLATE_MODES.map((mode) => {
                    const template = NOTEBOOK_TEMPLATES[mode];
                    const details = NOTEBOOK_TEMPLATE_DETAILS[mode];
                    const isSelected = templateMode === mode;

                    return (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setTemplateMode(mode)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background text-text-muted hover:border-primary/30 hover:text-text-main'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-bold text-text-main">{template.label}</div>
                          {isSelected && (
                            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-text-muted">{details.description}</p>
                        <div className="mt-3 rounded-md border border-border bg-surface px-2 py-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Output</div>
                          <div className="mt-0.5 text-xs font-semibold text-text-main">{details.output}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-lg border border-border bg-background p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Template micro-flow</div>
                      <div className="mt-1 text-sm font-semibold text-text-main">{notebookTemplateDetails.primaryLabel}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted">
                      {workflowRefinement.microFlow.map((step, index) => (
                        <React.Fragment key={step}>
                          <span className="rounded-full border border-border bg-surface px-2.5 py-1">{step}</span>
                          {index < workflowRefinement.microFlow.length - 1 && <ArrowRight size={13} className="text-primary" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {notebookTemplate.stepperLabels.map((step) => (
                    <span key={step} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                      {step}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Tabs</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {notebookTemplate.tabs.map((tab) => (
                        <span key={tab} className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text-main">
                          {tab}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Statuses</div>
                    <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {workflowNotebookEntry.statusSummary.map((status) => (
                        <div key={status.label} className="rounded-md border border-border bg-surface px-2 py-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{status.label}</div>
                          <div className="text-xs font-bold text-text-main">{status.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-surface p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {notebookTemplateDetails.primaryLabel}
                    </div>
                    <p className="mt-1 text-sm font-medium text-text-muted">
                      Source workflow converted into a template-based scientific record
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted">
                    {workflowRefinement.microFlow.map((step, index) => (
                      <React.Fragment key={step}>
                        <span className="rounded-full border border-border bg-background px-2.5 py-1">{step}</span>
                        {index < workflowRefinement.microFlow.length - 1 && <ArrowRight size={13} className="text-primary" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-border bg-background p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    {primaryNotebookSection?.heading ?? notebookTemplateDetails.primaryLabel}
                  </div>
                  <div className="mt-2 space-y-2">
                    {(primaryNotebookSection?.lines ?? [workflowRefinement.discussionDraft]).map((line) => (
                      <p key={line} className="text-sm leading-relaxed text-text-main">{line}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {supportingNotebookSections.map((section) => (
                    <div key={section.heading} className="rounded-lg border border-border bg-background p-3">
                      <div className="text-xs font-bold text-text-main">{section.heading}</div>
                      <div className="mt-2 space-y-2">
                        {section.lines.map((line) => (
                          <p key={line} className="text-xs leading-relaxed text-text-muted">{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Report Section Preview</div>
                    <h3 className="mt-1 text-base font-bold text-text-main">{workflowReportSection.heading}</h3>
                    <p className="mt-1 text-sm text-text-muted">{notebookTemplateDetails.reportPreview}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="Report route is not enabled in this demo. Export-ready sections are generated from notebook entries."
                    className="gap-2"
                  >
                    <Download size={14} /> Export Report Section
                  </Button>
                </div>
                <div className="mt-4 rounded-lg border border-border bg-background p-4">
                  <p className="text-sm leading-relaxed text-text-main">
                    {workflowReportSection.lines[0] ?? 'Export-ready section prepared from the selected notebook template.'}
                  </p>
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  Report route is not enabled in this demo. Export-ready sections are generated from notebook entries.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-surface p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-main">Source Workflow</h3>
                    <p className="mt-2 text-sm text-text-muted">Project: {project.name}</p>
                    <p className="mt-1 text-sm text-text-main">
                      Workspace processing is refined through evidence review, then saved as a template-based notebook entry.
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-right">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Discussion readiness</div>
                    <div className="mt-1 text-sm font-bold text-text-main">{notebookTemplateDetails.status}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ['Mode', notebookTemplate.label],
                    ['Source workflow', 'XRD processing + interpretation refinement'],
                    ['Pipeline', 'Processed Result -> Evidence Review -> Notebook Entry'],
                    ['Discussion readiness', notebookTemplateDetails.status],
                    ['ReportSection', workflowReportSection.heading],
                    ['Evidence status', 'Requires validation'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-border bg-background p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
                      <div className="mt-1 text-sm font-semibold text-text-main">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {notebookTemplateDetails.badges.map((badge) => (
                    <span key={badge} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Supporting Data</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    technique: 'XRD',
                    evidence: 'Spinel diffraction peaks matched',
                    strength: 'Ready',
                    dataset: 'cu-fe2o4-spinel_xrd.xy',
                    caveat: 'Compare against reference CuFe2O4 pattern before final citation.',
                  },
                  {
                    technique: 'Raman',
                    evidence: 'A1g/T2g vibrational modes support spinel structure',
                    strength: 'Ready',
                    dataset: 'cu-fe2o4-spinel_raman.txt',
                    caveat: 'Mode assignment supports phase but does not replace XRD.',
                  },
                  {
                    technique: 'FTIR',
                    evidence: 'Metal-oxygen/support bonding signatures present',
                    strength: 'In Progress',
                    dataset: 'cu-fe2o4-support_ftir.csv',
                    caveat: 'Bonding signatures are supportive, not standalone proof.',
                  },
                  {
                    technique: 'XPS',
                    evidence: 'Oxidation-state validation still required',
                    strength: 'Review',
                    dataset: 'cu-fe2o4_surface_xps.spe',
                    caveat: 'Run Fe 2p / Cu 2p deconvolution for activation claims.',
                  },
                ].map((item) => (
                  <div key={item.technique} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-text-main">{item.technique}</span>
                      <span className={`text-xs font-semibold ${item.strength === 'Review' ? 'text-amber-600' : item.strength === 'Ready' ? 'text-primary' : 'text-cyan'}`}>
                        {item.strength}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-main">{item.evidence}</p>
                    <p className="mt-2 text-xs font-medium text-text-muted">Linked dataset: {item.dataset}</p>
                    <p className="mt-1 text-xs text-text-muted">{item.caveat}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">{notebookTemplateDetails.primaryLabel}</h3>
              <div className="rounded-lg border border-border bg-surface p-4">
                {(primaryNotebookSection?.lines ?? [notebook.summary]).map((line) => (
                  <p key={line} className="text-sm leading-relaxed text-text-main">{line}</p>
                ))}
                <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Discussion readiness</div>
                  <p className="mt-1 text-sm font-semibold text-text-main">
                    {notebookTemplateDetails.status}: {notebookTemplateDetails.output}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Notebook Run Log</h3>
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ['Processing run', 'xrd-run-042'],
                    ['Refinement', 'refine-042'],
                    ['Dataset', 'xrd-cufe2o4-clean'],
                    ['Workflow version', 'difaryx-analysis-v0.1'],
                    ['Template mode', notebookTemplate.label],
                    ['Discussion readiness', notebookTemplateDetails.status],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-border bg-background p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
                      <div className="mt-1 text-sm font-semibold text-text-main">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-center text-xs font-semibold uppercase tracking-wider text-primary">
                  {'ProcessingResult -> AgentDiscussionRefinement -> NotebookEntry -> ReportSection'}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Limitations and Follow-up Validation</h3>
              <div className="space-y-2">
                {[
                  'Run XPS Fe 2p / Cu 2p deconvolution',
                  'Compare with reference CuFe2O4 spinel pattern',
                  'Verify reproducibility with replicate dataset',
                  'Attach final evidence packet to export report',
                ].map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {index + 1}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Report Exports</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(['pdf', 'docx', 'csv'] as DemoExportFormat[]).map((format) => (
                  <Button key={format} variant="outline" className="gap-2" onClick={() => exportNotebook(format)}>
                    <Download size={14} /> Export {format.toUpperCase()}
                  </Button>
                ))}
                <Button variant="outline" className="gap-2" onClick={copyAgentSummary}>
                  <Share2 size={14} /> Copy Summary
                </Button>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Summary</h3>
              <p className="text-sm text-text-main leading-relaxed">{notebook.summary}</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Conclusion</h3>
              <div className="bg-surface p-4 rounded-md border border-border flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-bold">{notebook.decision}</div>
                  <div className="text-xs text-text-muted mt-1">{formatClaimStatus(notebook.claimStatus)}</div>
                </div>
                <div className={`text-sm font-bold ${
                  notebook.claimStatus === 'strongly_supported' ? 'text-emerald-600' :
                  notebook.claimStatus === 'supported' ? 'text-cyan' :
                  notebook.claimStatus === 'partial' ? 'text-amber-500' :
                  'text-text-muted'
                }`}>{formatClaimStatus(notebook.claimStatus)}</div>
              </div>
              {notebook.warnings.length > 0 && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900">
                  {notebook.warnings.join(' ')}
                </div>
              )}
            </section>

            {workspaceRun && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Workspace Data</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-surface p-4 rounded-md border border-border">
                    <div className="text-xs text-text-muted mb-1">Dataset</div>
                    <div className="text-sm font-semibold text-text-main">{workspaceDataset?.fileName ?? workspaceRun.datasetId}</div>
                    <div className="text-xs text-text-muted mt-1">{workspaceDataset?.metadata.sampleName}</div>
                  </div>
                  <div className="bg-surface p-4 rounded-md border border-border">
                    <div className="text-xs text-text-muted mb-1">Technique</div>
                    <div className="text-sm font-semibold text-text-main">{workspaceRun.technique}</div>
                    <div className="text-xs text-text-muted mt-1">{new Date(workspaceRun.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="bg-surface p-4 rounded-md border border-border sm:col-span-2">
                    <div className="text-xs text-text-muted mb-2">Processing Parameters</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(workspaceRun.parameters).map(([key, value]) => (
                        <span key={key} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-text-muted">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {(observations.length > 0 || attachedRun) && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Notebook Additions</h3>
                {attachedRun && (
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-text-muted">
                    <div className="font-semibold text-text-main">
                      Linked data: {attachedRunRecord?.technique ?? 'Workspace'} analysis
                    </div>
                    <div className="mt-1">
                      {attachedRunRecord
                        ? `${new Date(attachedRunRecord.timestamp).toLocaleString()} - ${attachedRunRecord.detectedFeatures.length} features - ${formatClaimStatus(attachedRunRecord.matchResult?.claimStatus || 'supported')}`
                        : attachedRun}
                    </div>
                  </div>
                )}
                {observations.map((observation) => (
                  <div key={observation} className="rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
                    {observation}
                  </div>
                ))}
              </section>
            )}

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><FlaskConical size={14} /> Processing Pipeline</span>
              </h3>
              <div className="bg-surface p-4 rounded-md border border-border text-sm font-mono text-text-dim space-y-2">
                {notebook.processingPipeline.map((step, i) => (
                  <p key={step}>{i + 1}. {step}</p>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><BarChart3 size={14} /> Peak Detection Results</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-md border border-border">
                  <div className="text-xs text-text-muted mb-1">Peaks Detected</div>
                  <div className="text-2xl font-bold text-primary">{workspaceRun?.detectedFeatures.length ?? project.xrdPeaks.length}</div>
                </div>
                <div className="bg-surface p-4 rounded-md border border-border">
                  <div className="text-xs text-text-muted mb-1">Peak Positions</div>
                  <div className="text-sm font-mono text-text-main">
                    {(workspaceRun?.detectedFeatures ?? project.xrdPeaks).map((peak) => `${peak.position.toFixed(1)} ${workspaceRun && workspaceRun.technique !== 'XRD' ? '' : 'deg'}`).join(', ')}
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-muted">{notebook.peakDetection}</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><Target size={14} /> Phase Identification</span>
              </h3>
              <div className="bg-surface p-4 rounded-md border border-border flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">{project.phase}</div>
                  <div className="text-xs text-text-muted mt-1">{notebook.phaseInterpretation}</div>
                </div>
                <div className={`text-lg font-bold ${
                  notebook.claimStatus === 'strongly_supported' ? 'text-emerald-600' :
                  notebook.claimStatus === 'supported' ? 'text-cyan' :
                  notebook.claimStatus === 'partial' ? 'text-amber-500' :
                  'text-text-muted'
                }`}>{formatClaimStatus(notebook.claimStatus)}</div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Key Evidence</h3>
              <div className="space-y-2">
                {notebook.evidence.map((item, i) => (
                  <div key={item} className="flex items-start gap-3 rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to={workspaceRun ? getWorkspaceRoute(project, workspaceRun.technique, workspaceRun.datasetId) : getWorkspaceRoute(project)} className="rounded-md border border-border bg-surface p-3 text-sm font-semibold text-text-main hover:border-primary/40 transition-colors">
                {workspaceRun ? `Open ${workspaceRun.technique} Analysis` : 'Open Workspace'} <ArrowRight size={14} className="inline ml-1" />
              </Link>
              <Link to={getAgentPath(project)} className="rounded-md border border-cyan/40 bg-surface p-3 text-sm font-semibold text-cyan hover:bg-cyan/10 transition-colors">
                Open Refinement <ArrowRight size={14} className="inline ml-1" />
              </Link>
              <button
                onClick={() => exportNotebook('pdf')}
                className="rounded-md border border-border bg-surface p-3 text-left text-sm font-semibold text-text-main hover:bg-surface-hover transition-colors"
              >
                <FileText size={14} className="inline mr-1" /> Export summary
              </button>
            </section>
          </div>
        </div>

        <div className="hidden w-[340px] border-l border-border bg-background 2xl:flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6">
            <div className="mb-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Characterization Overview</div>
            <AIInsightPanel result={getProjectInsight(project)} />
          </div>
        </div>
      </div>
      <ExperimentModal
        open={experimentModalOpen}
        defaultProjectId={project.id}
        onClose={() => setExperimentModalOpen(false)}
        onCreated={() => {
          setLocalExperiments(getLocalExperiments());
          showFeedback('Experiment and dataset added');
        }}
      />
    </DashboardLayout>
  );
}
