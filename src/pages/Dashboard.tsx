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

export default function Dashboard() {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [localExperiments, setLocalExperiments] = useState<DemoExperiment[]>([]);
  const [experimentModalOpen, setExperimentModalOpen] = useState(false);
  const [experimentProjectId, setExperimentProjectId] = useState(DEFAULT_PROJECT_ID);
  const [selectedTechniques, setSelectedTechniques] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => setIsInitializing(false), 1400);
    setLocalExperiments(getLocalExperiments());
    return () => window.clearTimeout(timer);
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
                  <div className="text-lg font-bold text-cyan">{project.confidence}%</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">confidence</div>
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
                      Agent
                    </Link>
                    {project.techniques.length > 1 && (
                      <Link
                        to={`/workspace/multi?project=${project.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center text-xs font-medium text-text-muted hover:text-text-main transition-colors whitespace-nowrap"
                      >
                        Multi-Tech
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
                        Agent
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

    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#070B12] transition-opacity duration-500 ${
        isInitializing ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isInitializing}
    >
      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-semibold tracking-[0.18em] text-white">DIFARYX</h2>
        <p className="mt-3 text-sm text-slate-400">Initializing workspace</p>
        <div className="mt-6 flex items-center gap-2" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400/80 animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80 animate-pulse [animation-delay:160ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400/80 animate-pulse [animation-delay:320ms]" />
        </div>
      </div>
    </div>
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
