import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  FlaskConical,
  Layers3,
  NotebookTabs,
  Upload,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { formatChemicalFormula } from '../utils';
import {
  claimStatusColorClass,
  claimStatusLabel,
  demoProjectRegistry,
  getRegistryProject,
  isKnownProjectId,
  jobTypeBadgeClass,
  jobTypeLabel,
  normalizeRegistryProjectId,
  type RegistryProject,
  type TechniqueId,
} from '../data/demoProjectRegistry';

const TECHNIQUE_ORDER: TechniqueId[] = ['xrd', 'xps', 'ftir', 'raman'];

const workflowSteps = [
  { label: 'Project', to: null },
  { label: 'Evidence', to: '/workspace' },
  { label: 'Technique Analysis', to: '/workspace' },
  { label: 'Agent Reasoning', to: '/demo/agent' },
  { label: 'Notebook', to: '/notebook' },
  { label: 'Report', to: '/reports' },
];

function techniqueLabel(id: TechniqueId) {
  if (id === 'xrd') return 'XRD';
  if (id === 'xps') return 'XPS';
  if (id === 'ftir') return 'FTIR';
  if (id === 'raman') return 'Raman';
  return 'Multi-tech';
}

function techniqueFullName(id: TechniqueId) {
  if (id === 'xrd') return 'X-ray diffraction';
  if (id === 'xps') return 'X-ray photoelectron spectroscopy';
  if (id === 'ftir') return 'Fourier transform infrared';
  if (id === 'raman') return 'Raman spectroscopy';
  return 'Cross-technique evidence';
}

function techniqueRoute(technique: TechniqueId, projectId: string) {
  return `/workspace/${technique}?project=${projectId}`;
}

function projectTechniqueIds(project: RegistryProject) {
  return project.selectedTechniques.filter((technique): technique is Exclude<TechniqueId, 'multi'> => (
    technique !== 'multi'
  ));
}

function HubCard({
  icon: Icon,
  title,
  purpose,
  children,
  cta,
}: {
  icon: React.ElementType;
  title: string;
  purpose: string;
  children?: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <Card className="flex min-h-[220px] flex-col rounded-lg bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-text-main">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">{purpose}</p>
        </div>
      </div>
      <div className="mt-4 flex-1">{children}</div>
      {cta && <div className="mt-4">{cta}</div>}
    </Card>
  );
}

export default function WorkspaceLauncher() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = normalizeRegistryProjectId(searchParams.get('project'));
  const project = getRegistryProject(projectId);
  const invalidProjectRequested = Boolean(searchParams.get('project')) && !isKnownProjectId(searchParams.get('project'));
  const availableTechniques = projectTechniqueIds(project);
  const missingTechniques = TECHNIQUE_ORDER.filter((technique) => !availableTechniques.includes(technique));
  const nextAction = project.crossTechniqueComparison.recommendedNextAction || project.notebook.decision;

  const updateProject = (nextProjectId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('project', nextProjectId);
    setSearchParams(next, { replace: false });
  };

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 p-4">
          {invalidProjectRequested && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
              <span className="font-semibold">Project not found.</span> Showing {formatChemicalFormula(project.title)} demo workspace.
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-main">Workspace</h1>
              <p className="mt-1 text-sm text-text-muted">
                Continue project-linked analysis, review technique evidence, or open multi-tech reasoning.
              </p>
            </div>
            <label className="min-w-[260px] text-xs">
              <span className="mb-1 block font-bold uppercase tracking-wider text-text-muted">Active project</span>
              <select
                value={project.id}
                onChange={(event) => updateProject(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm font-semibold text-text-main shadow-sm outline-none focus:border-primary"
              >
                {demoProjectRegistry.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </label>
          </div>

          <Card className="rounded-lg bg-white px-3 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {workflowSteps.map((step, index) => {
                const path = step.to
                  ? `${step.to}?project=${project.id}`
                  : `/project/${project.id}`;
                return (
                  <React.Fragment key={step.label}>
                    <Link
                      to={path}
                      className="rounded-full border border-border bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                    >
                      {step.label}
                    </Link>
                    {index < workflowSteps.length - 1 && (
                      <span className="text-[10px] font-semibold text-primary">-&gt;</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </Card>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="grid gap-3 lg:grid-cols-3">
              <HubCard
                icon={Upload}
                title="Quick Analysis"
                purpose="Fast file drop or quick technique-specific check without full project setup."
                cta={
                  <Link
                    to="/analysis"
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-bold text-white hover:bg-primary/90"
                  >
                    Open Quick Analysis <ArrowRight size={13} />
                  </Link>
                }
              >
                <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-text-muted">
                  Start outside a project, then save, attach, export, or send the result to Notebook or Agent.
                </div>
              </HubCard>

              <HubCard
                icon={FlaskConical}
                title="Technique Workspace"
                purpose="Deep analysis of one selected technique in the current project."
              >
                <div className="grid grid-cols-2 gap-2">
                  {TECHNIQUE_ORDER.map((technique) => {
                    const available = availableTechniques.includes(technique);
                    return (
                      <Link
                        key={technique}
                        to={techniqueRoute(technique, project.id)}
                        className={`rounded-md border px-2 py-2 text-xs transition-colors ${
                          available
                            ? 'border-primary/25 bg-primary/5 text-primary hover:bg-primary/10'
                            : 'border-border bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block font-bold">{techniqueLabel(technique)}</span>
                        <span className="mt-1 block text-[10px] leading-snug">
                          {available ? 'Available' : 'Pending / required'}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </HubCard>

              <HubCard
                icon={Layers3}
                title="Multi-Tech Workspace"
                purpose="Cross-technique comparison and inference across available techniques."
                cta={
                  <Link
                    to={`/workspace/multi?project=${project.id}`}
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-primary bg-primary/10 px-3 text-xs font-bold text-primary hover:bg-primary/20"
                  >
                    Open Multi-Tech Comparison <ArrowRight size={13} />
                  </Link>
                }
              >
                <div className="space-y-2 text-xs">
                  <div className="rounded-md border border-border bg-slate-50 px-2 py-2">
                    <span className="font-bold text-text-main">{availableTechniques.length}</span>
                    <span className="ml-1 text-text-muted">available techniques for comparison</span>
                  </div>
                  <p className="leading-relaxed text-text-muted">{project.crossTechniqueComparison.agreementSummary}</p>
                </div>
              </HubCard>
            </div>

            <Card className="rounded-lg bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${jobTypeBadgeClass(project.jobType)}`}>
                    {jobTypeLabel(project.jobType)}
                  </span>
                  <h2 className="mt-2 text-base font-bold text-text-main">{formatChemicalFormula(project.title)}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">{project.materialSystem}</p>
                </div>
                <span className={`text-xs font-bold ${claimStatusColorClass(project.claimStatus)}`}>
                  {claimStatusLabel(project.claimStatus)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border border-border bg-slate-50 p-2">
                  <p className="font-semibold text-text-muted">Report readiness</p>
                  <p className="mt-1 text-lg font-bold text-text-main">{project.reportReadiness}%</p>
                </div>
                <div className="rounded-md border border-border bg-slate-50 p-2">
                  <p className="font-semibold text-text-muted">Validation gaps</p>
                  <p className="mt-1 text-lg font-bold text-text-main">{project.validationGapCount}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Available techniques</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {availableTechniques.map((technique) => (
                    <span key={technique} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      <CheckCircle2 size={10} /> {techniqueLabel(technique)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Missing required evidence</p>
                <p className="mt-1 text-xs leading-relaxed text-text-main">
                  {missingTechniques.length > 0
                    ? missingTechniques.map(techniqueLabel).join(', ')
                    : 'No required technique gap is visible in the selected demo scope.'}
                </p>
              </div>

              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Next recommended action</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-950">{nextAction}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  to={`/demo/agent?project=${project.id}`}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-white px-2 text-[11px] font-bold text-text-main hover:bg-slate-50"
                >
                  <Bot size={12} /> Agent
                </Link>
                <Link
                  to={`/notebook?project=${project.id}`}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-white px-2 text-[11px] font-bold text-text-main hover:bg-slate-50"
                >
                  <NotebookTabs size={12} /> Notebook
                </Link>
                <Link
                  to={`/reports?project=${project.id}`}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-white px-2 text-[11px] font-bold text-text-main hover:bg-slate-50"
                >
                  <FileText size={12} /> Report
                </Link>
                <Link
                  to={`/project/${project.id}`}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-white px-2 text-[11px] font-bold text-text-main hover:bg-slate-50"
                >
                  Project <ArrowRight size={12} />
                </Link>
              </div>
            </Card>
          </div>

          <p className="text-[11px] text-text-muted">
            Dashboard answers what is happening across workflows. Workspace answers what to work on now for the selected project.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
