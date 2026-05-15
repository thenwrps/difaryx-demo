import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Clipboard, Download, FileText, Save, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { getProject, getWorkspaceRoute } from '../data/demoProjects';
import {
  claimStatusColorClass,
  claimStatusLabel,
  getRegistryProject,
  isKnownProjectId,
  jobTypeBadgeClass,
  jobTypeLabel,
} from '../data/demoProjectRegistry';
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
  type NotebookTemplateMode,
} from '../data/workflowPipeline';
import { exportDemoArtifact, type DemoExportFormat, type DemoExportSection } from '../utils/demoExport';

function reportTypeLabel(mode: NotebookTemplateMode) {
  if (mode === 'rd') return 'Technical Evidence Report';
  if (mode === 'analytical') return 'Analytical Evidence Report';
  return 'Research Evidence Report';
}

function buildReportSections(
  projectName: string,
  registryProject: ReturnType<typeof getRegistryProject>,
  reportSection: ReturnType<typeof createReportSectionFromNotebookEntry>,
): DemoExportSection[] {
  return [
    {
      heading: 'Executive Summary',
      lines: [
        registryProject.evidenceSummary,
        `Claim status: ${claimStatusLabel(registryProject.claimStatus)}.`,
      ],
    },
    {
      heading: 'Experimental Context',
      lines: [
        `Project: ${projectName}`,
        `Objective: ${registryProject.objective}`,
        `Sample/system: ${registryProject.context.sampleDescription}`,
        `Available techniques: ${registryProject.techniques.filter((tech) => tech.available).map((tech) => tech.label).join(', ') || 'No technique evidence linked'}`,
      ],
    },
    {
      heading: 'Evidence Summary',
      lines: registryProject.evidenceResults.length
        ? registryProject.evidenceResults.map((item) => `${item.displayName}: ${item.summary}`)
        : ['No structured evidence is linked to this project yet.'],
    },
    {
      heading: 'Interpretation',
      lines: reportSection.lines.length ? reportSection.lines : [registryProject.notebook.interpretation],
    },
    {
      heading: 'Validation Boundary',
      lines: [
        registryProject.notebook.validationBoundary,
        registryProject.crossTechniqueComparison.validationGap,
        ...registryProject.crossTechniqueComparison.missingEvidence,
      ],
    },
    {
      heading: 'Recommended Next Action',
      lines: [registryProject.crossTechniqueComparison.recommendedNextAction, registryProject.notebook.decision],
    },
    {
      heading: 'Appendix / Provenance',
      lines: [
        `Notebook entry: ${reportSection.notebookEntryId}`,
        `Source: ${reportSection.sourceLabel}`,
        ...registryProject.experimentHistory.map((event) => `${event.timestampLabel}: ${event.title} - ${event.summary}`),
      ],
    },
  ];
}

export default function ReportBuilder() {
  const [searchParams] = useSearchParams();
  const requestedProjectId = searchParams.get('project');
  const project = (getProject(requestedProjectId) ?? getProject(null))!;
  const registryProject = getRegistryProject(project.id);
  const templateMode = normalizeNotebookTemplateMode(searchParams.get('template'));
  const [feedback, setFeedback] = useState('');

  const workflowProcessingResult = useMemo(
    () => getLatestProcessingResult(project.id) ?? createProcessingResultFromXrdDemo(project.id),
    [project.id],
  );
  const workflowRefinement = useMemo(
    () => getLatestAgentDiscussionRefinement(project.id, templateMode) ?? refineDiscussionFromProcessing(workflowProcessingResult, templateMode),
    [project.id, templateMode, workflowProcessingResult],
  );
  const workflowNotebookEntry = useMemo(() => {
    const fromRoute = getNotebookEntry(searchParams.get('entry'));
    if (fromRoute?.projectId === project.id) return fromRoute;
    return getLatestNotebookEntry(project.id, templateMode) ?? createNotebookEntryFromRefinement(workflowRefinement, templateMode);
  }, [project.id, searchParams, templateMode, workflowRefinement]);
  const workflowReportSection = useMemo(
    () => createReportSectionFromNotebookEntry(workflowNotebookEntry),
    [workflowNotebookEntry],
  );
  const reportSections = useMemo(
    () => buildReportSections(project.name, registryProject, workflowReportSection),
    [project.name, registryProject, workflowReportSection],
  );
  const reportTemplate = NOTEBOOK_TEMPLATES[templateMode];
  const reportStatus = registryProject.reportReadiness >= 80 ? 'Ready for internal review' : 'Draft - validation-limited';
  const reportVersion = `v${Math.max(1, Math.round(registryProject.reportReadiness / 20))}.0`;
  const preparedAt = new Date().toLocaleDateString();
  const filenameBase = `difaryx_${project.id}_${reportTemplate.reportTemplate}_report`;

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 1800);
  };

  const exportReport = (format: DemoExportFormat) => {
    exportDemoArtifact(format, {
      filenameBase,
      title: `${project.name} ${reportTypeLabel(templateMode)}`,
      sections: reportSections,
    });
    showFeedback(`${format.toUpperCase()} report export started.`);
  };

  const copyReport = async () => {
    const text = reportSections
      .map((section) => [`## ${section.heading}`, ...section.lines.map((line) => String(line))].join('\n'))
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      showFeedback('Report copied.');
    } catch {
      showFeedback('Report text is ready to copy.');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
        <div className="shrink-0 border-b border-border bg-surface px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <span>Evidence-to-Report Builder</span>
                <span className={jobTypeBadgeClass(registryProject.jobType)}>{jobTypeLabel(registryProject.jobType)}</span>
                <span className={claimStatusColorClass(registryProject.claimStatus)}>{claimStatusLabel(registryProject.claimStatus)}</span>
              </div>
              <h1 className="mt-1 truncate text-xl font-bold text-text-main">{project.name} Evidence Report</h1>
              <p className="mt-1 text-sm text-text-muted">
                Formal report preview prepared from notebook entry {workflowNotebookEntry.id}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {feedback && <span className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">{feedback}</span>}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportReport('md')}><Download size={13} /> Export Markdown</Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportReport('pdf')}><Download size={13} /> Export PDF</Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportReport('docx')}><Download size={13} /> Export DOCX</Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={copyReport}><Clipboard size={13} /> Copy report</Button>
              <Button size="sm" className="gap-1.5" onClick={() => showFeedback(`Saved ${reportVersion}.`)}><Save size={13} /> Save version</Button>
            </div>
          </div>
          {requestedProjectId && !isKnownProjectId(requestedProjectId) && (
            <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <span className="font-semibold">Project not found.</span> Showing the default project context: {registryProject.title}.
            </div>
          )}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto rounded-lg border border-border bg-surface p-3">
            <div className="space-y-2">
              {[
                ['Project', project.name],
                ['Report type', reportTypeLabel(templateMode)],
                ['Prepared from', workflowNotebookEntry.title],
                ['Date', preparedAt],
                ['Version', reportVersion],
                ['Status', reportStatus],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border bg-background px-2.5 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">{label}</div>
                  <div className="mt-0.5 text-sm font-semibold text-text-main">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-50 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                <ShieldCheck size={14} /> Claim Boundary Review
              </div>
              <p className="mt-2 text-xs leading-relaxed text-amber-900">{registryProject.notebook.validationBoundary}</p>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Link to={`/notebook?project=${project.id}&template=${templateMode}&entry=${workflowNotebookEntry.id}`} className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-bold text-text-main hover:border-primary/40 hover:text-primary">
                Open source notebook <ArrowRight size={13} className="ml-1" />
              </Link>
              <Link to={getWorkspaceRoute(project)} className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-bold text-text-main hover:border-primary/40 hover:text-primary">
                Open Workspace <ArrowRight size={13} className="ml-1" />
              </Link>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto rounded-lg border border-border bg-slate-100 p-4">
            <article className="mx-auto max-w-4xl rounded-md border border-border bg-white px-8 py-7 shadow-sm">
              <div className="border-b border-border pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">DIFARYX Evidence Report</div>
                    <h2 className="mt-2 text-2xl font-bold text-text-main">{project.name}</h2>
                    <p className="mt-1 text-sm text-text-muted">{registryProject.objective}</p>
                  </div>
                  <div className="shrink-0 rounded-md border border-border bg-background px-3 py-2 text-right text-xs text-text-muted">
                    <div className="font-semibold text-text-main">{reportVersion}</div>
                    <div>{preparedAt}</div>
                    <div>{reportStatus}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {reportSections.map((section) => (
                  <section key={section.heading}>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-text-main">{section.heading}</h3>
                    <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-text-muted">
                      {section.lines.map((line, index) => (
                        <p key={`${section.heading}-${index}`}>{line}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </article>

            <Card className="mx-auto mt-3 max-w-4xl p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
                  <FileText size={15} className="text-primary" /> Export workflow
                </div>
                <p className="text-xs text-text-muted">
                  Raw signal CSV remains in Notebook Lab; this builder exports formal report artifacts.
                </p>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
