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

export default function Dashboard() {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [localExperiments, setLocalExperiments] = useState<DemoExperiment[]>([]);
  const [experimentModalOpen, setExperimentModalOpen] = useState(false);
  const [experimentProjectId, setExperimentProjectId] = useState(DEFAULT_PROJECT_ID);
  const [agentGoal, setAgentGoal] = useState(
    'Determine whether the ferrite spinel phase formed and whether the evidence supports catalytic activation.',
  );
  const [agentMode, setAgentMode] = useState('Deep Analysis');

  useEffect(() => {
    const timer = window.setTimeout(() => setIsInitializing(false), 1400);
    setLocalExperiments(getLocalExperiments());
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
    <DashboardLayout>
      <div className="p-8 h-full overflow-y-auto">
        <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.7fr_0.9fr]">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-text-main">DIFARYX Scientific Agent</h2>
                    <p className="mt-1 text-sm text-text-muted">Plan, execute, and validate multi-technique characterization workflows</p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-primary/15 bg-background/60 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Project</div>
                  <div className="mt-1 text-sm font-semibold text-text-main">CuFe2O4 Spinel Formation</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/demo/agent?project=cu-fe2o4-spinel')}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-indigo-600/25"
              >
                <Sparkles size={16} /> Run Autonomous Agent
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Goal input</span>
                <textarea
                  value={agentGoal}
                  onChange={(event) => setAgentGoal(event.target.value)}
                  className="mt-2 h-24 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-main outline-none transition-colors focus:border-primary"
                />
              </label>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Mode selector</div>
                <div className="mt-2 grid gap-2">
                  {['Quick Insight', 'Deep Analysis', 'Autonomous Workflow'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAgentMode(mode)}
                      className={`rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                        agentMode === mode
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border bg-background text-text-muted hover:border-primary/30 hover:text-text-main'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Dataset Readiness Panel</div>
            <div className="mt-4 space-y-3">
              {[
                ['XRD', 'Ready'],
                ['Raman', 'Ready'],
                ['FTIR', 'Ready'],
                ['XPS', 'Partial'],
              ].map(([technique, status]) => (
                <div key={technique} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <span className="text-sm font-semibold text-text-main">{technique}</span>
                  <span className={`text-xs font-semibold ${status === 'Partial' ? 'text-amber-500' : 'text-primary'}`}>{status}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Recent Agent Runs</div>
            <div className="mt-4 space-y-3">
              {[
                {
                  goal: 'Confirm spinel phase formation',
                  confidence: 'High',
                  conclusion: 'XRD and Raman support ferrite formation.',
                },
                {
                  goal: 'Assess catalytic activation evidence',
                  confidence: 'Medium',
                  conclusion: 'Surface evidence requires XPS review.',
                },
                {
                  goal: 'Prepare report-ready trace',
                  confidence: 'High',
                  conclusion: 'Notebook evidence is ready for export.',
                },
              ].map((run) => (
                <div key={run.goal} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-text-main">{run.goal}</span>
                    <span className={`shrink-0 text-xs font-semibold ${run.confidence === 'High' ? 'text-primary' : 'text-cyan'}`}>
                      {run.confidence}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">{run.conclusion}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Dashboard</h1>
            <p className="text-text-muted mt-1 text-sm">Manage your characterization workflows and experiments.</p>
          </div>
          <div className="flex gap-3">
            {feedback && (
              <span className="hidden md:inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary">
                {feedback}
              </span>
            )}
            <Button variant="secondary" className="gap-2 border-primary/30 text-primary hover:bg-primary/10" onClick={() => navigate(`/demo/agent?project=${DEFAULT_PROJECT_ID}`)}>
              <Sparkles size={16} /> Run Autonomous Agent
            </Button>
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
          {demoProjects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col min-h-[300px]"
              onClick={() => navigate(project.techniques.length > 1 ? `/workspace/multi?project=${project.id}` : getWorkspaceRoute(project))}
            >
              <div className="p-4 border-b border-border bg-surface-hover/30 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors">{project.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1.5">
                    <Clock size={12} /> {project.lastUpdated}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-cyan">{project.confidence}%</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">confidence</div>
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div className="flex-1 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                  <Graph type={project.techniques[0].toLowerCase() as any} height={100} showBackground={false} showCalculated={false} showResidual={false} />
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-text-muted leading-relaxed">{project.summary}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {project.techniques.map(tag => (
                      <Link
                        key={tag}
                        to={getWorkspaceRoute(project, tag)}
                        onClick={(event) => event.stopPropagation()}
                        className="px-2 py-0.5 bg-surface border border-border rounded text-[10px] font-medium text-text-dim uppercase tracking-wider hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {tag}
                      </Link>
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
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
                  <Link
                    to={getWorkspaceRoute(project)}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex h-8 items-center justify-center rounded-md bg-primary/10 px-2 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    Open Workspace
                  </Link>
                  <Link
                    to={getNotebookPath(project)}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-[11px] font-semibold text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
                  >
                    Open Notebook
                  </Link>
                  <Link
                    to={getAgentPath(project)}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-cyan/40 px-2 text-[11px] font-semibold text-cyan hover:bg-cyan/10 transition-colors"
                  >
                    Run Agent
                  </Link>
                  {project.techniques.length > 1 && (
                    <Link
                      to={`/workspace/multi?project=${project.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="col-span-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Layers3 size={12} /> Open Multi-Tech Hub
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {localExperiments.map((experiment) => {
            const project = getProject(experiment.projectId);
            const workspaceTechnique = project.techniques.includes(experiment.technique)
              ? experiment.technique
              : getDefaultTechnique(project);

            return (
              <Card
                key={experiment.id}
                className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col min-h-[300px]"
                onClick={() => navigate(getWorkspaceRoute(project, workspaceTechnique, experiment.datasetIds[0]))}
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
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div className="flex-1 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                    <Graph type={workspaceTechnique.toLowerCase() as any} height={100} showBackground={false} showCalculated={false} showResidual={false} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs text-text-muted leading-relaxed">{experiment.notes}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-surface border border-border rounded text-[10px] font-medium text-text-dim uppercase tracking-wider">
                      {experiment.technique}
                    </span>
                    <span className="text-xs text-primary flex items-center gap-1">
                      <FileText size={12} /> Added dataset
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
                    <Link
                      to={getWorkspaceRoute(project, workspaceTechnique, experiment.datasetIds[0])}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 items-center justify-center rounded-md bg-primary/10 px-2 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                      Open Workspace
                    </Link>
                    <Link
                      to={getNotebookPath(project)}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-[11px] font-semibold text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
                    >
                      Open Notebook
                    </Link>
                    <Link
                      to={getAgentPath(project)}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-cyan/40 px-2 text-[11px] font-semibold text-cyan hover:bg-cyan/10 transition-colors"
                    >
                      Run Agent
                    </Link>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setExperimentProjectId(project.id);
                        setExperimentModalOpen(true);
                      }}
                      className="col-span-3 inline-flex h-8 items-center justify-center rounded-md border border-primary/30 bg-primary/5 px-2 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      Add related dataset
                    </button>
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
