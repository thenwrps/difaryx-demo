import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import { AlertTriangle, Plus, Clock, FileText } from 'lucide-react';
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
  demoProjects,
  getAgentPath,
  getDefaultTechnique,
  getTechniqueLabels,
  getLocalExperiments,
  getNotebookPath,
  getProject,
  makeTechniquePattern,
  getLocalProjectNotebooks,
  saveProjectNotebook,
  getNotebookTypeBadge,
  getNotebookActionLabel,
  isNotebookSetupComplete,
  type ProjectNotebook,
} from '../data/demoProjects';
import {
  XRD_DEMO_DATASETS,
  getXrdProjectCompatibility,
  isDatasetCompatibleWithProject,
} from '../data/xrdDemoDatasets';
import {
  getConditionBoundaryNotes,
  getConditionLockStatusLabel,
} from '../data/experimentConditionLock';
import { formatChemicalFormula } from '../utils';

const PRODUCT_WORKFLOW_STEPS = [
  'Objective',
  'Context',
  'Evidence',
  'Reasoning',
  'Gap',
  'Decision',
  'Memory',
];

function formatDashboardClaimStatus(status: string): string {
  if (status === 'strongly_supported') return 'Supported assignment';
  if (status === 'supported') return 'Requires validation';
  if (status === 'partial') return 'Validation-limited';
  if (status === 'inconclusive') return 'Publication-limited';
  return 'Claim boundary';
}

function hasMatchedXrdDemoData(projectId: string): boolean {
  const compatibility = getXrdProjectCompatibility(projectId);
  if (!compatibility) return false;

  return compatibility.datasetIds.some((datasetId) => (
    isDatasetCompatibleWithProject(datasetId, projectId) &&
    XRD_DEMO_DATASETS.some((dataset) => dataset.id === datasetId)
  ));
}

const DASHBOARD_SPECTRA_PREVIEWS: Partial<Record<string, Technique[]>> = {
  nife2o4: ['XRD'],
  cofe2o4: ['XRD', 'XPS'],
  'fe3o4-nanoparticles': ['FTIR', 'Raman'],
};

function getDashboardSpectraPreviews(projectId: string): Technique[] {
  return DASHBOARD_SPECTRA_PREVIEWS[projectId] ?? [];
}

function getProjectTypeBadge(projectId: string): string {
  if (projectId === 'cu-fe2o4-spinel') return 'PROJECT · RESEARCH';
  if (projectId === 'cufe2o4-sba15') return 'PROJECT · R&D';
  if (projectId === 'nife2o4') return 'ANALYTICAL JOB';
  if (projectId === 'cofe2o4') return 'PROJECT · RESEARCH';
  if (projectId === 'fe3o4-nanoparticles') return 'PROJECT · R&D';
  return 'PROJECT · RESEARCH';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState('');
  const [localExperiments, setLocalExperiments] = useState<DemoExperiment[]>([]);
  const [localNotebooks, setLocalNotebooks] = useState<ProjectNotebook[]>([]);
  const [experimentModalOpen, setExperimentModalOpen] = useState(false);
  const [experimentProjectId, setExperimentProjectId] = useState(DEFAULT_PROJECT_ID);
  const [selectedTechniques, setSelectedTechniques] = useState<Record<string, Technique>>({});
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

  return (
    <>
    <DashboardLayout>
      <div className="p-4 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Workflow Intelligence Dashboard</h1>
            <p className="text-text-muted mt-0.5 text-xs">Manage research objectives, experimental context, evidence reasoning, validation gaps, and notebook memory.</p>
          </div>
          <div className="flex gap-3">
            {feedback && (
              <span className="hidden md:inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary">
                {feedback}
              </span>
            )}
            <Button
              variant="primary"
              className="gap-2"
              onClick={() => setCreateMenuOpen(true)}
            >
              <Plus size={16} /> New
            </Button>
          </div>
        </div>

        <div className="mb-4 rounded-md border border-border bg-surface px-3 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Demo flow
            </span>
            {PRODUCT_WORKFLOW_STEPS.map((step, index) => (
              <React.Fragment key={step}>
                <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-text-main">
                  {step}
                </span>
                {index < PRODUCT_WORKFLOW_STEPS.length - 1 && (
                  <span className="text-[10px] font-semibold text-primary/70">-&gt;</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {demoProjects.map((project) => {
            const currentTechnique = selectedTechniques[project.id] || project.techniques[0];
            const hasXrdDemoData = hasMatchedXrdDemoData(project.id);
            const spectraPreviews = getDashboardSpectraPreviews(project.id);
            const hasSpectraPreview = !hasXrdDemoData && spectraPreviews.length > 0;
            const hasDashboardEvidence = hasXrdDemoData || hasSpectraPreview;
            const bundledDatasetSummary = project.id === 'fe3o4-nanoparticles'
              ? 'FTIR/Raman demo signals are available for bonding-context and vibrational-evidence review.'
              : `${spectraPreviews.join('/')} demo signals are available. Processing evidence is still required before review or export.`;
            const cardRoute = hasXrdDemoData
              ? `/workspace?project=${project.id}`
              : hasSpectraPreview
                ? `/workspace/${currentTechnique.toLowerCase()}?project=${project.id}`
                : `/workspace/xrd?project=${project.id}`;
            const graphData = hasSpectraPreview
              ? makeTechniquePattern(project, currentTechnique)
              : undefined;
            const graphLabels = getTechniqueLabels(currentTechnique);
            const dashboardStatus = hasXrdDemoData
              ? formatDashboardClaimStatus(project.claimStatus)
              : hasSpectraPreview
                ? 'Demo dataset ready'
                : 'Dataset required';
            const dashboardSummary = hasXrdDemoData
              ? project.summary
              : hasSpectraPreview
                ? bundledDatasetSummary
                : 'Processing evidence is not linked to this project yet.';
            const dashboardBadges = hasXrdDemoData
              ? ['Research Mode', 'Publication-limited', 'Validation required']
              : hasSpectraPreview
                ? ['Research Mode', 'Ready for processing', 'Validation pending']
                : ['Research Mode', 'Requires dataset', 'Validation pending'];
            
            return (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col h-full"
              onClick={() => navigate(cardRoute)}
            >
              <div className="p-4 border-b border-border bg-surface-hover/30 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim px-1.5 py-0.5 rounded border border-border bg-background">
                      {getProjectTypeBadge(project.id)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors">{formatChemicalFormula(project.name)}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1.5">
                    <Clock size={12} /> {project.lastUpdated}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${
                    hasSpectraPreview || !hasDashboardEvidence ? 'text-amber-600' :
                    project.claimStatus === 'strongly_supported' ? 'text-emerald-600' :
                    project.claimStatus === 'supported' ? 'text-cyan' :
                    project.claimStatus === 'partial' ? 'text-amber-500' :
                    'text-text-muted'
                  }`}>
                    {dashboardStatus}
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Status</div>
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col">
                <div className="h-[180px] mb-3">
                  {hasXrdDemoData ? (
                    <Graph type={currentTechnique.toLowerCase() as any} height="100%" showBackground={false} showCalculated={false} showResidual={false} showLegend={false} />
                  ) : hasSpectraPreview ? (
                    <Graph
                      type={currentTechnique.toLowerCase() as any}
                      height="100%"
                      showBackground={false}
                      showCalculated={false}
                      showResidual={false}
                      showLegend={false}
                      externalData={graphData}
                      xAxisLabel={graphLabels.xLabel}
                      yAxisLabel={graphLabels.yLabel}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-amber-500/30 bg-amber-500/5 px-4 text-center">
                      <AlertTriangle size={18} className="mb-2 text-amber-600" />
                      <p className="text-xs font-semibold text-text-main">Dataset required</p>
                      <p className="mt-1 max-w-[180px] text-[11px] leading-relaxed text-text-muted">
                        Load compatible data to generate evidence.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <p className="mt-3 line-clamp-2 text-xs text-text-muted leading-relaxed">{dashboardSummary}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {project.techniques.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedTechniques(prev => ({ ...prev, [project.id]: tag }));
                          }}
                          className={`px-2 py-0.5 border rounded text-[10px] font-medium uppercase tracking-wider transition-colors ${
                            currentTechnique === tag
                              ? 'bg-primary/10 border-primary/40 text-primary'
                              : 'bg-surface border-border text-text-dim hover:border-primary/40 hover:text-primary'
                          }`}
                          title={`Preview ${tag}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    {hasSpectraPreview ? (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle size={12} /> Requires processing
                      </span>
                    ) : !hasDashboardEvidence ? (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle size={12} /> Requires dataset
                      </span>
                    ) : project.status === 'In Progress' ? (
                      <span className="text-xs text-cyan flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
                        In Progress
                      </span>
                    ) : (
                      <span className="text-xs text-primary flex items-center gap-1">
                        <FileText size={12} /> {project.id === 'nife2o4' ? 'Discussion-ready' : 'Report-ready'}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {dashboardBadges.map((badge) => (
                        <span key={badge} className="rounded-full border border-border bg-background px-2 py-0.5 font-medium text-text-muted">{badge}</span>
                      ))}
                    </div>
                    <div className="text-[10px] font-medium text-text-dim tracking-wide">
                      {hasXrdDemoData ? (
                        <>
                          Processing <span className="text-primary/60">-&gt;</span> Refinement <span className="text-primary/60">-&gt;</span> Notebook
                        </>
                      ) : hasSpectraPreview ? (
                        <>
                          Demo dataset ready <span className="text-primary/60">/</span> Processing evidence required
                        </>
                      ) : (
                        <>
                          Evidence not generated <span className="text-primary/60">/</span> Load compatible dataset
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-4 grid grid-cols-4 gap-1.5 border-t border-border min-h-[52px]">
                  {hasXrdDemoData ? (
                    <>
                      <Link
                        to={`/workspace/${currentTechnique.toLowerCase()}?project=${project.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                      >
                        Analyze
                      </Link>
                      <Link
                        to={getAgentPath(project)}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
                      >
                        Review
                      </Link>
                      <Link
                        to={getNotebookPath(project)}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
                      >
                        Notebook
                      </Link>
                      <button
                        type="button"
                        disabled
                        onClick={(event) => event.stopPropagation()}
                        title="Report route is not enabled in this demo. Export-ready sections are generated from notebook entries."
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted opacity-50 whitespace-nowrap"
                      >
                        Export
                      </button>
                    </>
                  ) : hasSpectraPreview ? (
                    <>
                      <Link
                        to={`/workspace/${currentTechnique.toLowerCase()}?project=${project.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                      >
                        Analyze
                      </Link>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExperimentProjectId(project.id);
                          setExperimentModalOpen(true);
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
                      >
                        Add Data
                      </button>
                      <button
                        type="button"
                        disabled
                        onClick={(event) => event.stopPropagation()}
                        title="Requires processed evidence before review."
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted opacity-50 whitespace-nowrap"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        disabled
                        onClick={(event) => event.stopPropagation()}
                        title="Requires processed evidence before export."
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted opacity-50 whitespace-nowrap"
                      >
                        Export
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/workspace/xrd?project=${project.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExperimentProjectId(project.id);
                          setExperimentModalOpen(true);
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
                      >
                        Add Data
                      </button>
                      <button
                        type="button"
                        disabled
                        onClick={(event) => event.stopPropagation()}
                        title="Requires processed evidence before review."
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted opacity-50 whitespace-nowrap"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        disabled
                        onClick={(event) => event.stopPropagation()}
                        title="Requires processed evidence before export."
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted opacity-50 whitespace-nowrap"
                      >
                        Export
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
            );
          })}
          {localExperiments.map((experiment) => {
            const project = getProject(experiment.projectId);
            const workspaceTechnique = project.techniques.includes(experiment.technique)
              ? experiment.technique
              : getDefaultTechnique(project);
            const conditionStatus = getConditionLockStatusLabel(experiment.conditionLock);
            const conditionBoundary = getConditionBoundaryNotes(experiment.conditionLock, project.techniques)[0];

            return (
              <Card
                key={experiment.id}
                className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col h-full"
                onClick={() => navigate(`/workspace/${workspaceTechnique.toLowerCase()}?project=${project.id}`)}
              >
                <div className="p-4 border-b border-border bg-primary/5 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim px-1.5 py-0.5 rounded border border-border bg-background">
                        QUICK EXPERIMENT
                      </span>
                    </div>
                    <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors">{experiment.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1.5">
                      <Clock size={12} /> {experiment.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-cyan">Demo</div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">local</div>
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-col">
                  <div className="h-[180px] mb-3">
                    <Graph type={workspaceTechnique.toLowerCase() as any} height="100%" showBackground={false} showCalculated={false} showResidual={false} showLegend={false} />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <p className="mt-3 line-clamp-2 text-xs text-text-muted leading-relaxed">{experiment.notes}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-surface border border-border rounded text-[10px] font-medium text-text-dim uppercase tracking-wider">
                        {experiment.technique}
                      </span>
                    <span className="text-xs text-primary flex items-center gap-1">
                      <FileText size={12} /> Added dataset
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {['Research Mode', conditionStatus, 'Validation required'].map((badge) => (
                        <span key={badge} className="rounded-full border border-border bg-background px-2 py-0.5 font-medium text-text-muted">{badge}</span>
                      ))}
                    </div>
                    <div className="line-clamp-2 text-[10px] text-text-dim">
                      {conditionBoundary}
                    </div>
                    <div className="text-[10px] font-medium text-text-dim tracking-wide">
                      Processing <span className="text-primary/60">-&gt;</span> Refinement <span className="text-primary/60">-&gt;</span> Notebook
                    </div>
                  </div>
                </div>
                  <div className="mt-auto pt-4 grid grid-cols-4 gap-1.5 border-t border-border min-h-[52px]">
                    <Link
                      to={`/workspace/${workspaceTechnique.toLowerCase()}?project=${project.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                    >
                      Analyze
                    </Link>
                    <Link
                      to={getAgentPath(project)}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
                    >
                      Review
                    </Link>
                    <Link
                      to={`${getNotebookPath(project)}&experiment=${experiment.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
                    >
                      Notebook
                    </Link>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setExperimentProjectId(project.id);
                        setExperimentModalOpen(true);
                      }}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
                    >
                      Add Dataset
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
          {localNotebooks.map((notebook) => {
            const typeBadge = getNotebookTypeBadge(notebook.mode);
            const modeLabel = notebook.mode === 'research' ? 'Research' : notebook.mode === 'rd' ? 'R&D' : 'Analytical Job';
            const modeColor = notebook.mode === 'research' ? 'emerald' : notebook.mode === 'rd' ? 'cyan' : 'amber';
            const setupComplete = isNotebookSetupComplete(notebook);
            const statusLabel = notebook.workflowStatus === 'evidence_ready' ? 'Evidence ready' : notebook.workflowStatus === 'setup_ready' ? 'Setup ready' : (setupComplete ? 'Ready for experiments' : 'Setup required');
            const statusColor = notebook.workflowStatus === 'evidence_ready' ? 'text-primary' : notebook.workflowStatus === 'setup_ready' ? 'text-amber-600' : (setupComplete ? 'text-primary' : 'text-amber-600');
            const actionLabel = getNotebookActionLabel(notebook.mode);
            
            // Data status
            const hasDataImport = notebook.initialDataImport && !notebook.initialDataImport.skipped && notebook.initialDataImport.files.length > 0;
            const dataStatusLabel = hasDataImport ? 'Data attached' : 'Data pending';
            const dataStatusColor = hasDataImport ? 'text-primary' : 'text-text-muted';

            return (
              <Card
                key={notebook.id}
                className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col h-full"
                onClick={() => {
                  navigate(`/notebook?project=${notebook.id}`);
                }}
              >
                <div className="p-4 border-b border-border bg-surface-hover/30 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim px-1.5 py-0.5 rounded border border-border bg-background">
                        {typeBadge}
                      </span>
                    </div>
                    <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors">{notebook.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1.5">
                      <Clock size={12} /> {new Date(notebook.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold text-${modeColor}-600`}>
                      {modeLabel}
                    </div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Mode</div>
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-col">
                  <div className="h-[180px] mb-3">
                    <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-primary/30 bg-primary/5 px-4 text-center">
                      <FileText size={24} className="mb-2 text-primary" />
                      <p className="text-xs font-semibold text-text-main">Project Notebook</p>
                      <p className="mt-1 max-w-[180px] text-[11px] leading-relaxed text-text-muted line-clamp-3">
                        {notebook.objective}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <p className="mt-3 line-clamp-2 text-xs text-text-muted leading-relaxed">
                      {notebook.objective}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-surface border border-border rounded text-[10px] font-medium text-text-dim uppercase tracking-wider">
                          {modeLabel}
                        </span>
                        <span className={`text-[10px] ${dataStatusColor} font-medium`}>
                          {dataStatusLabel}
                        </span>
                      </div>
                      <span className={`text-xs ${statusColor} flex items-center gap-1 font-semibold`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {['Multi-experiment', 'Workflow mode', 'Local draft'].map((badge) => (
                          <span key={badge} className="rounded-full border border-border bg-background px-2 py-0.5 font-medium text-text-muted">{badge}</span>
                        ))}
                      </div>
                      <div className="text-[10px] font-medium text-text-dim tracking-wide">
                        Setup <span className="text-primary/60">-&gt;</span> Experiments <span className="text-primary/60">-&gt;</span> Analysis <span className="text-primary/60">-&gt;</span> Report
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 grid grid-cols-4 gap-1.5 border-t border-border min-h-[52px]">
                    <Link
                      to={`/notebook?project=${notebook.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                    >
                      Open Notebook
                    </Link>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setFeedback(`${actionLabel} coming soon`);
                        window.setTimeout(() => setFeedback(''), 2000);
                      }}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors whitespace-nowrap"
                    >
                      {actionLabel}
                    </button>
                    <button
                      type="button"
                      disabled
                      onClick={(event) => event.stopPropagation()}
                      title="Requires experiments before analysis."
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted opacity-50 whitespace-nowrap"
                    >
                      Analyze
                    </button>
                    <button
                      type="button"
                      disabled
                      onClick={(event) => event.stopPropagation()}
                      title="Requires analysis before export."
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-text-muted opacity-50 whitespace-nowrap"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
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

    {/* Experiment Context Banner */}
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
