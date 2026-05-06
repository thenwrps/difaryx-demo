import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import { Plus, Clock, FileText, Layers3, Sparkles } from 'lucide-react';
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
  getWorkspaceRoute,
} from '../data/demoProjects';
import { formatChemicalFormula } from '../utils';

const PRODUCT_WORKFLOW_STEPS = [
  'Project Dashboard',
  'Analysis Workspace',
  'Technique Processing',
  'Cross-Tech Evidence Review',
  'Agentic Interpretation Refinement',
  'Notebook Template Entry',
  'Report Export',
];

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

        <div className="mb-4 rounded-lg border border-border bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            {PRODUCT_WORKFLOW_STEPS.map((step, index) => (
              <React.Fragment key={step}>
                <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                  {step}
                </span>
                {index < PRODUCT_WORKFLOW_STEPS.length - 1 && (
                  <span className="text-[11px] font-semibold text-primary">/</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {demoProjects.map((project) => {
            const currentTechnique = selectedTechniques[project.id] || project.techniques[0];
            
            return (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col h-full"
              onClick={() => navigate(`/workspace?project=${project.id}`)}
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
                    project.claimStatus === 'strongly_supported' ? 'text-emerald-600' :
                    project.claimStatus === 'supported' ? 'text-cyan' :
                    project.claimStatus === 'partial' ? 'text-amber-500' :
                    'text-text-muted'
                  }`}>
                    {project.claimStatus === 'strongly_supported' ? 'Complete' :
                     project.claimStatus === 'supported' ? 'Ready' :
                     project.claimStatus === 'partial' ? 'In Progress' :
                     project.claimStatus === 'inconclusive' ? 'Pending' :
                     'Review'}
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Status</div>
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col">
                <div className="h-[180px] mb-3">
                  <Graph type={currentTechnique.toLowerCase() as any} height="100%" showBackground={false} showCalculated={false} showResidual={false} showLegend={false} />
                </div>
                <div className="flex-1 flex flex-col">
                  <p className="mt-3 line-clamp-2 text-xs text-text-muted leading-relaxed">{project.summary}</p>
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
                    {project.status === 'In Progress' ? (
                      <span className="text-xs text-cyan flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
                        In Progress
                      </span>
                    ) : (
                      <span className="text-xs text-primary flex items-center gap-1">
                        <FileText size={12} /> Report Ready
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border min-h-[52px]">
                  <Link
                    to={`/workspace/${currentTechnique.toLowerCase()}?project=${project.id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                  >
                    Open {currentTechnique}
                  </Link>
                  <div className="flex items-center gap-3">
                    <Link
                      to={getNotebookPath(project)}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 items-center justify-center text-xs font-medium text-text-muted hover:text-text-main transition-colors whitespace-nowrap"
                    >
                      Notebook
                    </Link>
                    <Link
                      to={getAgentPath(project)}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 items-center justify-center text-xs font-medium text-text-muted hover:text-text-main transition-colors whitespace-nowrap"
                    >
                      Refine
                    </Link>
                    {project.techniques.length > 1 && (
                      <Link
                        to={`/workspace/multi?project=${project.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center text-xs font-medium text-text-muted hover:text-text-main transition-colors whitespace-nowrap"
                      >
                        Review
                      </Link>
                    )}
                  </div>
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
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-border min-h-[52px]">
                    <Link
                      to={`/workspace/${workspaceTechnique.toLowerCase()}?project=${project.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                    >
                      Open {workspaceTechnique}
                    </Link>
                    <div className="flex items-center gap-3">
                      <Link
                        to={getNotebookPath(project)}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center text-xs font-medium text-text-muted hover:text-text-main transition-colors whitespace-nowrap"
                      >
                        Notebook
                      </Link>
                      <Link
                        to={getAgentPath(project)}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center text-xs font-medium text-text-muted hover:text-text-main transition-colors whitespace-nowrap"
                      >
                        Refine
                      </Link>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExperimentProjectId(project.id);
                          setExperimentModalOpen(true);
                        }}
                        className="inline-flex h-8 items-center justify-center text-xs font-medium text-text-muted hover:text-text-main transition-colors whitespace-nowrap"
                      >
                        Add Dataset
                      </button>
                    </div>
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
