import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  Layers,
  Lightbulb,
  Plus,
  Target,
  Workflow,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { ExperimentModal } from '../components/workspace/ExperimentModal';
import { CreateMenu } from '../components/dashboard/CreateMenu';
import { ProjectNotebookWizard } from '../components/dashboard/ProjectNotebookWizard';
import { QuickExperimentSetup } from '../components/dashboard/QuickExperimentSetup';
import { ImportDataFilesModal } from '../components/dashboard/ImportDataFilesModal';
import {
  DEFAULT_PROJECT_ID,
  DemoExperiment,
  Technique,
  DemoProject,
  demoProjects,
  getDefaultTechnique,
  getTechniqueLabels,
  getLocalExperiments,
  getNotebookPath,
  getProject,
  makeTechniquePattern,
  getLocalProjectNotebooks,
  getNotebookTypeBadge,
  getNotebookActionLabel,
  isNotebookSetupComplete,
  deleteProjectNotebook,
  type ProjectNotebook,
} from '../data/demoProjects';
import {
  getConditionBoundaryNotes,
  getConditionLockStatusLabel,
} from '../data/experimentConditionLock';
import { formatChemicalFormula } from '../utils';
import {
  claimStatusColorClass,
  claimStatusLabel,
  demoProjectRegistry,
  jobTypeBadgeClass,
  jobTypeLabel,
  type RegistryProject,
} from '../data/demoProjectRegistry';
import { DemoProjectGraph } from '../components/graphs/DemoProjectGraph';
import { getProjectEvidenceSnapshot } from '../utils/evidenceSnapshot';
import { getRuntimeBadgeClass, getRuntimeBadgeLabel } from '../runtime/difaryxRuntimeMode';

/* ─── workflow chain (top of dashboard) ─── */
const WORKFLOW_STEPS = [
  'Objective',
  'Context',
  'Evidence',
  'Reasoning',
  'Gap',
  'Decision',
  'Memory',
];

/* ─── severity / urgency helpers ─── */
function gapSeverityColor(severity: string) {
  if (severity === 'critical') return 'text-red-600 bg-red-50 border-red-200';
  if (severity === 'moderate') return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-text-muted bg-surface border-border';
}

function urgencyColor(urgency: string) {
  if (urgency === 'high') return 'text-red-600';
  if (urgency === 'medium') return 'text-amber-600';
  return 'text-text-muted';
}

function claimStatusColor(status: string) {
  if (status === 'strongly_supported') return 'text-emerald-600';
  if (status === 'supported') return 'text-cyan';
  if (status === 'partial') return 'text-amber-500';
  return 'text-text-muted';
}

function readinessBarColor(percent: number) {
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 50) return 'bg-amber-500';
  return 'bg-red-400';
}

function readinessLabelColor(percent: number) {
  if (percent >= 80) return 'text-emerald-600';
  if (percent >= 50) return 'text-amber-600';
  return 'text-red-500';
}

// Project type labels come from `getProjectJobTypeLabel` / `getProjectJobTypeBadgeColor`
// in `utils/projectEvidence.ts` so the Dashboard and Agent stay aligned.

/* ─── evidence coverage bar ─── */
function EvidenceCoverageBar({ project }: { project: DemoProject }) {
  const total = project.techniqueMetadata.length;
  const ready = project.techniqueMetadata.filter((t) => t.dataAvailable).length;
  const percent = total > 0 ? Math.round((ready / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-text-muted font-medium">Evidence Coverage</span>
        <span className="text-text-main font-semibold">{ready}/{total} sources</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/* ─── project card — graph-first layout ─── */
function ProjectCard({ project }: { project: RegistryProject }) {
  const navigate = useNavigate();
  const evidenceSnapshot = getProjectEvidenceSnapshot(project.id);
  const evidenceSourceCount = evidenceSnapshot.availableTechniques.length + evidenceSnapshot.pendingTechniques.length;
  const evidenceCoverageLabel = `${evidenceSnapshot.availableTechniques.length}/${evidenceSourceCount || 0} sources`;
  const firstValidationGap = evidenceSnapshot.validationGaps[0];
  const claimBoundaryLabel =
    evidenceSnapshot.claimBoundary.requiresValidation[0] ??
    evidenceSnapshot.claimBoundary.notSupportedYet[0] ??
    'Claim boundary preserved.';
  const evidenceSummary = evidenceSnapshot.evidenceEntries[0]?.support ?? project.evidenceSummary;
  const runtimeContext = {
    sourceMode: evidenceSnapshot.sourceMode ?? 'demo_preloaded',
    runtimeMode: evidenceSnapshot.runtimeMode ?? 'demo',
    permissionMode: evidenceSnapshot.permissionMode ?? 'read_only',
    sourceLabel: evidenceSnapshot.sourceLabel ?? 'Demo evidence',
    approvalStatus: evidenceSnapshot.approvalStatus ?? 'not_required',
  } as const;

  // Canonical registry project — single source of truth shared across app
  const projectJobLabel = `${jobTypeLabel(project.jobType)} PROJECT`;
  const exportReady = project.reportReadiness >= 80;
  const readinessLabel = evidenceSnapshot.pendingTechniques.length > 0
    ? 'Validation-limited'
    : project.reportReadiness >= 80
      ? 'Report-ready'
      : project.reportReadiness >= 50
        ? 'Discussion-ready'
        : 'Requires processing';
  const readinessColor = project.reportReadiness >= 80
    ? 'text-primary'
    : project.reportReadiness >= 50
    ? 'text-cyan'
    : 'text-amber-600';

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col h-full"
      onClick={() => navigate(`/workspace/analysis?project=${project.id}`)}
    >
      {/* header */}
      <div className="p-4 border-b border-border bg-surface-hover/30 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${jobTypeBadgeClass(project.jobType)}`}>
              {projectJobLabel}
            </span>
          </div>
          <h3 className="font-bold text-sm text-text-main group-hover:text-primary transition-colors">
            {formatChemicalFormula(project.title)}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-1">
            <Clock size={11} /> {project.createdLabel}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-bold ${claimStatusColorClass(project.claimStatus)}`}>{claimStatusLabel(project.claimStatus)}</div>
          <div className="text-[9px] text-text-muted uppercase tracking-wider">Status</div>
        </div>
      </div>

      {/* graph — shared registry source so Dashboard/Workspace/Agent/History match */}
      <div className="h-[180px] px-2 py-2 border-b border-border/50">
        <DemoProjectGraph source={project.graphPreview} compact height="100%" />
      </div>

      {/* body */}
      <div className="flex-1 p-4 flex flex-col gap-2">
        <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">{formatChemicalFormula(evidenceSummary)}</p>

        {/* technique pills + readiness */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {evidenceSnapshot.availableTechniques.map((tech) => (
              <span key={tech} className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                {tech}
              </span>
            ))}
            {evidenceSnapshot.pendingTechniques.map((tech) => (
              <span key={`pending-${tech}`} className="rounded-full border border-amber-500/30 bg-amber-500/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                {tech} pending
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <FileText size={11} className={readinessColor} />
            <span className={`text-[10px] font-semibold ${readinessColor}`}>{readinessLabel}</span>
          </div>
        </div>

        {/* mode / status / validation chips */}
        <div className="flex flex-wrap gap-1">
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-medium text-text-muted">
            {jobTypeLabel(project.jobType)} Mode
          </span>
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-medium text-text-muted">
            {project.statusLabel}
          </span>
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-medium text-text-muted">
            {evidenceSnapshot.validationGaps.length} validation gap{evidenceSnapshot.validationGaps.length === 1 ? '' : 's'}
          </span>
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-medium text-text-muted">
            {evidenceCoverageLabel}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-medium ${getRuntimeBadgeClass(runtimeContext)}`}>
            {getRuntimeBadgeLabel(runtimeContext)}
          </span>
        </div>

        <div className="text-[10px] font-medium text-text-dim tracking-wide">
          <span className="text-text-muted">Assignment:</span> {formatChemicalFormula(evidenceSnapshot.supportedAssignment)}
        </div>
        <div className="text-[10px] font-medium text-text-dim tracking-wide line-clamp-1" title={firstValidationGap?.description ?? claimBoundaryLabel}>
          <span className="text-text-muted">Boundary:</span> {firstValidationGap?.description ?? claimBoundaryLabel}
        </div>

        {/* pipeline */}
        <div className="text-[10px] font-medium text-text-dim tracking-wide">
          Processing <span className="text-primary/60">→</span> Refinement <span className="text-primary/60">→</span> Notebook
        </div>
      </div>

      {/* footer actions */}
      <div className="mt-auto p-3 pt-0 border-t border-border">
        <div className="grid grid-cols-5 gap-1.5 pt-3">
          <Link
            to={`/workspace/analysis?project=${project.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-2 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
          >
            Analyze
          </Link>
          <Link
            to={`/workspace/multi?project=${project.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-[10px] font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
            title="Review cross-technique comparison"
          >
            Review
          </Link>
          <Link
            to={`/notebook?project=${project.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-[10px] font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
          >
            Notebook
          </Link>
          <Link
            to={`/history?project=${project.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-[10px] font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
          >
            History
          </Link>
          <button
            type="button"
            disabled={!exportReady}
            onClick={(e) => e.stopPropagation()}
            title={
              !exportReady
                ? 'Report readiness too low for export.'
                : 'Report export is not enabled in this demo.'
            }
            className={`inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-[10px] font-medium text-text-muted whitespace-nowrap ${
              !exportReady
                ? 'opacity-50'
                : 'opacity-70'
            }`}
          >
            Export
          </button>
        </div>
      </div>
    </Card>
  );
}

/* ─── main dashboard ─── */

export default function Dashboard() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState('');
  const [localExperiments, setLocalExperiments] = useState<DemoExperiment[]>([]);
  const [localNotebooks, setLocalNotebooks] = useState<ProjectNotebook[]>([]);
  const [experimentModalOpen, setExperimentModalOpen] = useState(false);
  const [experimentProjectId, setExperimentProjectId] = useState(DEFAULT_PROJECT_ID);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [projectNotebookWizardOpen, setProjectNotebookWizardOpen] = useState(false);
  const [quickExperimentSetupOpen, setQuickExperimentSetupOpen] = useState(false);
  const [importDataFilesModalOpen, setImportDataFilesModalOpen] = useState(false);
  const [experimentContext, setExperimentContext] = useState<{
    type: 'research' | 'rd' | 'analytical';
    attachment: 'standalone' | 'attach';
  } | null>(null);

  useEffect(() => {
    setLocalExperiments(getLocalExperiments());
    setLocalNotebooks(getLocalProjectNotebooks());
  }, []);

  /* aggregate stats */
  const totalGaps = demoProjectRegistry.reduce((sum, p) => sum + p.validationGapCount, 0);
  const criticalGaps = demoProjectRegistry.reduce((sum, p) => sum + p._raw.validationGaps.filter((g) => g.severity === 'critical').length, 0);
  const avgReadiness = Math.round(demoProjectRegistry.reduce((sum, p) => sum + p.reportReadiness, 0) / demoProjectRegistry.length);

  return (
    <>
    <DashboardLayout>
      <div className="p-4 h-full overflow-y-auto">
        {/* header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Workflow Intelligence Dashboard</h1>
            <p className="text-text-muted mt-0.5 text-xs">
              Research projects, evidence coverage, validation gaps, and scientific decisions.
            </p>
          </div>
          <div className="flex gap-3">
            {feedback && (
              <span className="hidden md:inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary">
                {feedback}
              </span>
            )}
            <Button variant="primary" className="gap-2" onClick={() => setCreateMenuOpen(true)}>
              <Plus size={16} /> New
            </Button>
          </div>
        </div>

        {/* workflow chain */}
        <div className="mb-4 rounded-md border border-border bg-surface px-3 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Workflow
            </span>
            {WORKFLOW_STEPS.map((step, index) => (
              <React.Fragment key={step}>
                <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-text-main">
                  {step}
                </span>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight size={10} className="text-primary/50" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* aggregate stats bar */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          <div className="rounded-md border border-border bg-surface px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Projects</div>
            <div className="text-lg font-bold text-text-main">{demoProjectRegistry.length}</div>
            <div className="text-[10px] text-text-dim">Active research</div>
          </div>
          <div className="rounded-md border border-border bg-surface px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Validation Gaps</div>
            <div className={`text-lg font-bold ${criticalGaps > 0 ? 'text-red-600' : 'text-amber-600'}`}>{totalGaps}</div>
            <div className="text-[10px] text-text-dim">{criticalGaps} critical</div>
          </div>
          <div className="rounded-md border border-border bg-surface px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Decisions Pending</div>
            <div className="text-lg font-bold text-cyan">
              {demoProjectRegistry.reduce((sum, p) => sum + p.decisionPendingCount, 0)}
            </div>
            <div className="text-[10px] text-text-dim">Next experiments</div>
          </div>
          <div className="rounded-md border border-border bg-surface px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Report Readiness</div>
            <div className={`text-lg font-bold ${readinessLabelColor(avgReadiness)}`}>{avgReadiness}%</div>
            <div className="text-[10px] text-text-dim">Average across projects</div>
          </div>
        </div>

        {/* section: Active Research Projects */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={14} className="text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">Active Research Projects</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {demoProjectRegistry.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {/* local experiments */}
            {localExperiments.map((experiment) => {
              const project = getProject(experiment.projectId);
              const workspaceTechnique = project.techniques.includes(experiment.technique)
                ? experiment.technique
                : getDefaultTechnique(project);
              const conditionStatus = getConditionLockStatusLabel(experiment.conditionLock);

              return (
                <Card
                  key={experiment.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col h-full"
                  onClick={() => navigate(`/workspace/${workspaceTechnique.toLowerCase()}?project=${project.id}`)}
                >
                  <div className="p-4 border-b border-border bg-primary/5 flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim px-1.5 py-0.5 rounded border border-border bg-background">
                        QUICK EXPERIMENT
                      </span>
                      <h3 className="font-semibold text-sm text-text-main group-hover:text-primary transition-colors mt-1">
                        {experiment.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-1">
                        <Clock size={11} /> {experiment.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-cyan">Demo</div>
                      <div className="text-[9px] text-text-muted uppercase tracking-wider">local</div>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col gap-2">
                    <p className="text-[11px] text-text-main leading-relaxed line-clamp-2">{experiment.notes}</p>
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-surface border border-border rounded text-[10px] font-medium text-text-dim uppercase tracking-wider">
                        {experiment.technique}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[9px]">
                      {['Research Mode', conditionStatus, 'Validation required'].map((badge) => (
                        <span key={badge} className="rounded-full border border-border bg-background px-2 py-0.5 font-medium text-text-muted">{badge}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto p-4 pt-3 border-t border-border">
                    <div className="grid grid-cols-3 gap-1.5">
                      <Link
                        to={`/workspace/${workspaceTechnique.toLowerCase()}?project=${project.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-2 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                      >
                        Analyze
                      </Link>
                      <Link
                        to={getNotebookPath(project)}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-[10px] font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
                      >
                        Notebook
                      </Link>
                      <Link
                        to={`/project/${project.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-[10px] font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
            {/* local notebooks */}
            {localNotebooks.map((notebook) => {
              const typeBadge = getNotebookTypeBadge(notebook.mode);
              const modeLabel = notebook.mode === 'research' ? 'Research' : notebook.mode === 'rd' ? 'R&D' : 'Analytical';
              const setupComplete = isNotebookSetupComplete(notebook);
              const statusLabel = notebook.workflowStatus === 'evidence_ready' ? 'Evidence ready' : notebook.workflowStatus === 'setup_ready' ? 'Setup ready' : (setupComplete ? 'Ready' : 'Setup required');
              const statusColor = notebook.workflowStatus === 'evidence_ready' ? 'text-primary' : notebook.workflowStatus === 'setup_ready' ? 'text-amber-600' : (setupComplete ? 'text-primary' : 'text-amber-600');

              return (
                <Card
                  key={notebook.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col h-full"
                  onClick={() => navigate(`/notebook?project=${notebook.id}`)}
                >
                  <div className="p-4 border-b border-border bg-surface-hover/30">
                    <div className="flex items-start justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim px-2 py-0.5 rounded border border-border bg-background">
                        {typeBadge}
                      </span>
                      <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-text-main group-hover:text-primary transition-colors mt-1">
                      {notebook.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-1">
                      <Clock size={11} /> {new Date(notebook.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <Target size={11} className="text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Objective</span>
                    </div>
                    <p className="text-[11px] text-text-main leading-relaxed line-clamp-2">{notebook.objective}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-surface border border-border rounded text-[10px] font-medium text-text-dim uppercase tracking-wider">{modeLabel}</span>
                      <span className="text-[10px] text-text-dim">{notebook.initialDataImport && !notebook.initialDataImport.skipped && notebook.initialDataImport.files.length > 0 ? 'Data attached' : 'Data pending'}</span>
                    </div>
                  </div>
                  <div className="mt-auto p-4 pt-3 border-t border-border">
                    <div className="grid grid-cols-3 gap-1.5">
                      <Link
                        to={`/notebook?project=${notebook.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-2 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-[10px] font-medium text-text-muted opacity-50 whitespace-nowrap"
                      >
                        Analyze
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${notebook.title}"?`)) {
                            deleteProjectNotebook(notebook.id);
                            setLocalNotebooks(getLocalProjectNotebooks());
                          }
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-red-300 px-2 text-[10px] font-medium text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>

    <CreateMenu
      open={createMenuOpen}
      onClose={() => setCreateMenuOpen(false)}
      onSelectOption={(option) => {
        if (option === 'experiment') {
          setQuickExperimentSetupOpen(true);
        } else if (option === 'project') {
          setProjectNotebookWizardOpen(true);
        } else if (option === 'import') {
          setImportDataFilesModalOpen(true);
        }
      }}
    />

    <ProjectNotebookWizard
      open={projectNotebookWizardOpen}
      onClose={() => setProjectNotebookWizardOpen(false)}
      onCreated={() => {
        setLocalNotebooks(getLocalProjectNotebooks());
        setFeedback('Project Notebook created');
        window.setTimeout(() => setFeedback(''), 2000);
        setProjectNotebookWizardOpen(false);
      }}
    />

    <QuickExperimentSetup
      open={quickExperimentSetupOpen}
      onClose={() => setQuickExperimentSetupOpen(false)}
      onContinue={(data) => {
        setQuickExperimentSetupOpen(false);
        setExperimentContext(data);
        setExperimentProjectId(DEFAULT_PROJECT_ID);
        setExperimentModalOpen(true);
      }}
    />

    <ImportDataFilesModal
      open={importDataFilesModalOpen}
      onClose={() => setImportDataFilesModalOpen(false)}
      onAction={(action) => {
        if (action === 'quick') {
          setFeedback('Quick Analysis: File import coming soon');
        } else if (action === 'attach') {
          setFeedback('Attach to Project: File import coming soon');
        } else if (action === 'convert') {
          setFeedback('Convert to Project Notebook: File import coming soon');
        }
        window.setTimeout(() => setFeedback(''), 2500);
      }}
    />

    <ExperimentModal
      open={experimentModalOpen}
      defaultProjectId={experimentProjectId}
      onClose={() => {
        setExperimentModalOpen(false);
        setExperimentContext(null);
      }}
      onCreated={() => {
        setLocalExperiments(getLocalExperiments());
        setFeedback('Experiment, dataset, and condition record added');
        window.setTimeout(() => setFeedback(''), 1800);
        setExperimentContext(null);
      }}
    />

    {experimentModalOpen && experimentContext && (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-md">
        <div className="rounded-md border border-primary bg-primary/10 px-4 py-2 shadow-lg">
          <p className="text-sm font-semibold text-primary text-center">
            Quick Experiment · {experimentContext.type === 'research' ? 'Research Experiment' : experimentContext.type === 'rd' ? 'R&D Trial' : 'Analytical Run'} · {experimentContext.attachment === 'standalone' ? 'Standalone entry' : 'Attach to project'}
          </p>
        </div>
      </div>
    )}
    </>
  );
}
