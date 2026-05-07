import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import { AlertTriangle, Plus, Clock, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { ExperimentModal } from '../components/workspace/ExperimentModal';
import {
  DEFAULT_PROJECT_ID,
  DemoExperiment,
  demoProjects,
  getAgentPath,
  getDefaultTechnique,
  getLocalExperiments,
  getNotebookPath,
  getProject,
} from '../data/demoProjects';
import {
  XRD_DEMO_DATASETS,
  getXrdProjectCompatibility,
  isDatasetCompatibleWithProject,
} from '../data/xrdDemoDatasets';
import { formatChemicalFormula } from '../utils';

const PRODUCT_WORKFLOW_STEPS = [
  'Signal',
  'Compute',
  'Reason',
  'Report',
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState('');
  const [localExperiments, setLocalExperiments] = useState<DemoExperiment[]>([]);
  const [experimentModalOpen, setExperimentModalOpen] = useState(false);
  const [experimentProjectId, setExperimentProjectId] = useState(DEFAULT_PROJECT_ID);
  const [selectedTechniques, setSelectedTechniques] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalExperiments(getLocalExperiments());
  }, []);

  return (
    <>
    <DashboardLayout>
      <div className="p-4 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Project Dashboard</h1>
            <p className="text-text-muted mt-0.5 text-xs">Manage your characterization workflows and experiments.</p>
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
              onClick={() => {
                setExperimentProjectId(DEFAULT_PROJECT_ID);
                setExperimentModalOpen(true);
              }}
            >
              <Plus size={16} /> New Experiment
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
            const dashboardStatus = hasXrdDemoData
              ? formatDashboardClaimStatus(project.claimStatus)
              : 'No matched dataset';
            const dashboardSummary = hasXrdDemoData
              ? project.summary
              : 'No processed XRD result linked to this project.';
            const dashboardBadges = hasXrdDemoData
              ? ['Research Mode', 'Publication-limited', 'Validation required']
              : ['Research Mode', 'Requires dataset', 'Validation pending'];
            
            return (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col h-full"
              onClick={() => navigate(hasXrdDemoData ? `/workspace?project=${project.id}` : `/workspace/xrd?project=${project.id}`)}
            >
              <div className="p-4 border-b border-border bg-surface-hover/30 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors">{formatChemicalFormula(project.name)}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1.5">
                    <Clock size={12} /> {project.lastUpdated}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${
                    !hasXrdDemoData ? 'text-amber-600' :
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
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-amber-500/30 bg-amber-500/5 px-4 text-center">
                      <AlertTriangle size={18} className="mb-2 text-amber-600" />
                      <p className="text-xs font-semibold text-text-main">No matched XRD dataset</p>
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
                    {!hasXrdDemoData ? (
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
                        <FileText size={12} /> Report-ready
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

            return (
              <Card
                key={experiment.id}
                className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col h-full"
                onClick={() => navigate(`/workspace/${workspaceTechnique.toLowerCase()}?project=${project.id}`)}
              >
                <div className="p-4 border-b border-border bg-primary/5 flex justify-between items-start">
                  <div>
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
                      {['Research Mode', 'Publication-limited', 'Validation required'].map((badge) => (
                        <span key={badge} className="rounded-full border border-border bg-background px-2 py-0.5 font-medium text-text-muted">{badge}</span>
                      ))}
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
                      to={getNotebookPath(project)}
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
        </div>
      </div>
    </DashboardLayout>

    <ExperimentModal
      open={experimentModalOpen}
      defaultProjectId={experimentProjectId}
      onClose={() => setExperimentModalOpen(false)}
      onCreated={() => {
        setLocalExperiments(getLocalExperiments());
        setFeedback('Experiment and dataset added');
        window.setTimeout(() => setFeedback(''), 1800);
      }}
    />
    </>
  );
}
