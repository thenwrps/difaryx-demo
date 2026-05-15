import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  Layers,
  Lightbulb,
  ListChecks,
  Play,
  Target,
  Workflow,
} from 'lucide-react';
import {
  Technique,
  DemoProject,
  EvidenceSource,
  ValidationGap,
  NextDecision,
  getProject,
  getDefaultTechnique,
  getTechniqueLabels,
  getNotebookPath,
  getAgentPath,
  getProjectInsight,
  makeTechniquePattern,
} from '../data/demoProjects';
import { formatChemicalFormula } from '../utils';
import {
  getProjectJobTypeLabel,
  getProjectJobTypeBadgeColor,
} from '../utils/projectEvidence';

/* ---------- helpers ---------- */

function formatClaimStatus(status: string): string {
  if (status === 'strongly_supported') return 'Supported assignment';
  if (status === 'supported') return 'Requires validation';
  if (status === 'partial') return 'Validation-limited';
  if (status === 'inconclusive') return 'Publication-limited';
  return 'Claim boundary';
}

function statusColor(status: string): string {
  if (status === 'strongly_supported') return 'text-emerald-600';
  if (status === 'supported') return 'text-cyan';
  if (status === 'partial') return 'text-amber-500';
  return 'text-text-muted';
}

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

/* ---------- sub-components ---------- */

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-primary" />
      <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</h3>
    </div>
  );
}

function WorkflowChainBar() {
  const steps = ['Objective', 'Context', 'Evidence', 'Reasoning', 'Gap', 'Decision', 'Memory'];
  return (
    <div className="mb-4 rounded-md border border-border bg-surface px-3 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">Workflow</span>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-text-main">
              {step}
            </span>
            {index < steps.length - 1 && (
              <ArrowRight size={10} className="text-primary/50" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ========== main page ========== */

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = getProject(projectId);

  /* project not found fallback */
  if (!project) {
    return (
      <DashboardLayout>
        <div className="p-6 h-full overflow-y-auto flex flex-col items-center justify-center">
          <AlertTriangle size={32} className="mb-3 text-amber-500" />
          <h2 className="text-lg font-bold text-text-main mb-1">Project Not Found</h2>
          <p className="text-sm text-text-muted mb-4">
            No project matches "{projectId}". Check the project ID or return to the dashboard.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  /* selected technique for the mini graph */
  const [selectedTechnique, setSelectedTechnique] = useState<Technique>(
    getDefaultTechnique(project),
  );

  /* evidence sources from the project — no cross-project data leakage */
  const currentEvidenceSources: EvidenceSource[] = project.evidenceSources ?? [];
  const activeSource = currentEvidenceSources.find((src) => src.technique === selectedTechnique) ?? currentEvidenceSources[0];

  /* graph helpers — always use current project data */
  const graphData = makeTechniquePattern(project, selectedTechnique);
  const graphLabels = getTechniqueLabels(selectedTechnique);

  const insight = getProjectInsight(project);

  /* derived values */
  const hasCriticalGaps = project.validationGaps.some((g) => g.severity === 'critical');
  const totalEvidence = project.techniqueMetadata.length;
  const readyEvidence = project.techniqueMetadata.filter((t) => t.dataAvailable).length;
  const evidencePercent = totalEvidence > 0 ? Math.round((readyEvidence / totalEvidence) * 100) : 0;
  const topDecision = project.nextDecisions.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.urgency as keyof typeof order] ?? 2) - (order[b.urgency as keyof typeof order] ?? 2);
  })[0];

  return (
    <DashboardLayout>
      <div className="p-6 h-full overflow-y-auto">
        {/* Back button */}
        <div className="mb-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        {/* =============== HEADER =============== */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getProjectJobTypeBadgeColor(project)}`}>
                {getProjectJobTypeLabel(project)}
              </span>
              <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${gapSeverityColor(project.claimStatus === 'strongly_supported' ? 'low' : project.claimStatus === 'partial' ? 'moderate' : 'low')}`}>
                {formatClaimStatus(project.claimStatus)}
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main">
              {formatChemicalFormula(project.name)}
            </h1>
            <p className="text-sm text-text-muted mt-1">{project.material}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Clock size={12} /> Updated {project.lastUpdated}
              </span>
              <span className="flex items-center gap-1">
                <Target size={12} /> Created {project.createdDate}
              </span>
            </div>
          </div>

          {/* Report readiness summary in header */}
          <div className="text-right min-w-[180px]">
            <div className={`text-lg font-bold ${readinessLabelColor(project.reportReadiness.readinessPercent)}`}>
              {project.reportReadiness.readinessPercent}%
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
              Report Readiness
            </div>
            <div className="h-1.5 rounded-full bg-surface overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${readinessBarColor(project.reportReadiness.readinessPercent)}`}
                style={{ width: `${project.reportReadiness.readinessPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-text-dim mt-1">{project.reportReadiness.label}</div>
          </div>
        </div>

        {/* Workflow chain */}
        <WorkflowChainBar />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* =============== LEFT COLUMN — Scientific Workflow Chain =============== */}
          <div className="xl:col-span-2 space-y-6">

            {/* ── 1. RESEARCH OBJECTIVE ── */}
            <Card className="p-5">
              <SectionHeader icon={Target} label="Research Objective" />
              <p className="text-sm text-text-main leading-relaxed">{project.objective}</p>
              <div className="mt-3 flex items-center gap-2 text-[11px]">
                <span className="text-text-muted">Phase:</span>
                <span className="font-medium text-text-main">{project.phase}</span>
                <span className="text-text-muted ml-2">Status:</span>
                <span className={`font-medium ${statusColor(project.claimStatus)}`}>{project.status}</span>
              </div>
            </Card>

            {/* ── 2. EVIDENCE SOURCES — Technique Preview Graph ── */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 pt-4 pb-2 border-b border-border bg-surface-hover/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Evidence Sources
                  </h3>
                </div>
                <div className="flex gap-1.5">
                  {project.techniques.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTechnique(tag)}
                      className={`px-2 py-0.5 border rounded text-[10px] font-medium uppercase tracking-wider transition-colors ${
                        selectedTechnique === tag
                          ? 'bg-primary/10 border-primary/40 text-primary'
                          : 'bg-surface border-border text-text-dim hover:border-primary/40 hover:text-primary'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div className="h-[260px]">
                  {graphData ? (
                    <Graph
                      type={selectedTechnique.toLowerCase() as any}
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
                      <AlertTriangle size={20} className="mb-2 text-amber-600" />
                      <p className="text-sm font-semibold text-text-main">Dataset required</p>
                      <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-text-muted">
                        Load compatible data to generate evidence.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* ── 3. EVIDENCE COVERAGE — Per-project evidence sources ── */}
            <Card className="p-5">
              <SectionHeader icon={CheckCircle2} label="Supporting Evidence" />
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-text-muted font-medium">Evidence Coverage</span>
                  <span className="text-text-main font-semibold">{readyEvidence}/{totalEvidence} sources</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${evidencePercent >= 80 ? 'bg-emerald-500' : evidencePercent >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                    style={{ width: `${evidencePercent}%` }}
                  />
                </div>
              </div>
              <ul className="space-y-2">
                {currentEvidenceSources.map((src) => (
                  <li key={`${src.technique}-${src.datasetId}`} className="flex items-start gap-2 text-xs text-text-main leading-relaxed">
                    {src.available ? (
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primary" />
                    ) : (
                      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                    )}
                    <div>
                      <span className="font-semibold text-primary">{src.technique}</span>
                      <span className="text-text-muted ml-1">— {src.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            {/* ── 4. AGENT REASONING ── */}
            <Card className="p-5">
              <SectionHeader icon={Bot} label="Agent Reasoning" />
              <p className="text-sm text-text-main leading-relaxed mb-4">
                {project.summary}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Primary Result</div>
                  <div className="text-xs text-text-main font-medium">{insight.primaryResult}</div>
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Confidence</div>
                  <div className={`text-xs font-bold ${statusColor(insight.claimStatus)}`}>
                    {(insight.confidenceScore * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Claim Status</div>
                  <div className={`text-xs font-bold ${statusColor(insight.claimStatus)}`}>
                    {formatClaimStatus(insight.claimStatus)}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Validation</div>
                  <div className="text-xs text-text-main font-medium capitalize">{insight.validationState.replace('_', ' ')}</div>
                </div>
              </div>
            </Card>

            {/* ── 5. VALIDATION GAPS ── */}
            {project.validationGaps.length > 0 && (
              <Card className="p-5">
                <SectionHeader icon={AlertTriangle} label="Validation Gaps" />
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm font-bold ${hasCriticalGaps ? 'text-red-600' : 'text-amber-600'}`}>
                    {project.validationGaps.length} gap{project.validationGaps.length !== 1 ? 's' : ''}
                  </span>
                  {hasCriticalGaps && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                      Critical
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {project.validationGaps.map((gap) => (
                    <div key={gap.id} className="rounded-md border border-border bg-surface p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs text-text-main font-medium leading-relaxed">{gap.description}</p>
                        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${gapSeverityColor(gap.severity)}`}>
                          {gap.severity}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5 mt-2">
                        <Lightbulb size={11} className="shrink-0 text-amber-500 mt-0.5" />
                        <p className="text-[11px] text-text-muted leading-relaxed">{gap.suggestedResolution}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ── 6. NEXT DECISIONS ── */}
            {project.nextDecisions.length > 0 && (
              <Card className="p-5">
                <SectionHeader icon={Lightbulb} label="Next Scientific Decisions" />
                <div className="space-y-3">
                  {project.nextDecisions.sort((a, b) => {
                    const order = { high: 0, medium: 1, low: 2 };
                    return (order[a.urgency as keyof typeof order] ?? 2) - (order[b.urgency as keyof typeof order] ?? 2);
                  }).map((decision) => (
                    <div key={decision.id} className="rounded-md border border-border bg-surface p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-xs font-semibold ${urgencyColor(decision.urgency)}`}>{decision.label}</p>
                        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          decision.urgency === 'high' ? 'text-red-600 bg-red-50 border-red-200' :
                          decision.urgency === 'medium' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                          'text-text-muted bg-surface border-border'
                        }`}>
                          {decision.urgency}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted leading-relaxed">{decision.description}</p>
                      {decision.linkedTechnique && (
                        <span className="inline-flex items-center gap-1 mt-2 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                          <FlaskConical size={9} /> {decision.linkedTechnique}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ── 7. LIMITATIONS & RECOMMENDATIONS ── */}
            {project.recommendations.length > 0 && (
              <Card className="p-5">
                <SectionHeader icon={FileText} label="Limitations & Recommendations" />
                <ul className="space-y-2">
                  {project.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-main leading-relaxed">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* ── 8. RUN HISTORY ── */}
            {project.history.length > 0 && (
              <Card className="p-5">
                <SectionHeader icon={Workflow} label="Run History" />
                <div className="space-y-2">
                  {project.history.map((entry) => {
                    const actionIcon =
                      entry.action === 'agent' ? (
                        <Bot size={12} />
                      ) : entry.action === 'notebook' ? (
                        <BookOpen size={12} />
                      ) : (
                        <FlaskConical size={12} />
                      );
                    return (
                      <div key={entry.id} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-primary">{actionIcon}</span>
                          <span className="font-medium text-text-main">{entry.run}</span>
                          <span className="text-text-muted">·</span>
                          <span className="text-text-muted">{entry.technique}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${statusColor(entry.claimStatus)}`}>
                            {formatClaimStatus(entry.claimStatus)}
                          </span>
                          <span className="text-text-muted">{entry.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* =============== RIGHT SIDEBAR =============== */}
          <div className="space-y-6">

            {/* ── Quick Actions ── */}
            <Card className="p-5">
              <SectionHeader icon={Play} label="Quick Actions" />
              <div className="space-y-2">
                <Link
                  to={`/workspace/${selectedTechnique.toLowerCase()}?project=${project.id}`}
                  className="flex items-center gap-2 w-full rounded-md border border-primary bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <FlaskConical size={14} /> Analyze Evidence
                </Link>
                <Link
                  to={getAgentPath(project)}
                  className="flex items-center gap-2 w-full rounded-md border border-border px-3 py-2 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
                >
                  <Bot size={14} /> Run Agent
                </Link>
                <Link
                  to={getNotebookPath(project)}
                  className="flex items-center gap-2 w-full rounded-md border border-border px-3 py-2 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
                >
                  <BookOpen size={14} /> Open Notebook
                </Link>
              </div>
            </Card>

            {/* ── Evidence Sources (Technique Status) ── */}
            <Card className="p-5">
              <SectionHeader icon={FlaskConical} label="Evidence Sources" />
              <div className="space-y-2">
                {project.techniqueMetadata.map((tm) => (
                  <div
                    key={tm.key}
                    className="rounded-md border border-border bg-surface px-3 py-2 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        tm.dataAvailable
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border bg-background text-text-muted'
                      }`}>
                        {tm.dataAvailable && <CheckCircle2 size={9} />}
                        {tm.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted">{tm.role}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* ── Report Readiness ── */}
            <Card className="p-5">
              <SectionHeader icon={BookOpen} label="Report Readiness" />
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-text-muted font-medium">Overall</span>
                    <span className={`font-bold ${readinessLabelColor(project.reportReadiness.readinessPercent)}`}>
                      {project.reportReadiness.readinessPercent}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${readinessBarColor(project.reportReadiness.readinessPercent)}`}
                      style={{ width: `${project.reportReadiness.readinessPercent}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Notebook</span>
                    <span className={project.reportReadiness.notebookReady ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-medium'}>
                      {project.reportReadiness.notebookReady ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Export</span>
                    <span className={project.reportReadiness.exportReady ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-medium'}>
                      {project.reportReadiness.exportReady ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-text-dim">{project.reportReadiness.label}</p>
              </div>
            </Card>

            {/* ── Detected Peaks ── */}
            {project.xrdPeaks.length > 0 && (
              <Card className="p-5">
                <SectionHeader icon={ListChecks} label="Detected Peaks" />
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-left text-text-muted border-b border-border">
                        <th className="pb-1 font-medium">Position (2θ)</th>
                        <th className="pb-1 font-medium">Intensity</th>
                        <th className="pb-1 font-medium">Label</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.xrdPeaks.map((peak, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="py-1 text-text-main font-mono">{peak.position}</td>
                          <td className="py-1 text-text-main font-mono">{peak.intensity}</td>
                          <td className="py-1 text-text-muted">{peak.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── Notebook Preview ── */}
            <Card className="p-5">
              <SectionHeader icon={FileText} label="Notebook Preview" />
              <h4 className="text-sm font-semibold text-text-main mb-1">{project.notebook.title}</h4>
              <p className="text-[11px] text-text-muted leading-relaxed mb-3">
                {project.notebook.peakDetection}
              </p>
              <div className="space-y-1.5">
                {project.notebook.pipeline.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-text-main">
                    <span className="text-primary font-mono">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <Link
                to={getNotebookPath(project)}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                Open full notebook <ArrowRight size={10} />
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
