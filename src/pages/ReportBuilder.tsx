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
import { getProjectEvidenceSnapshot, type ProjectEvidenceSnapshot } from '../utils/evidenceSnapshot';
import {
  getRuntimeBadgeClass,
  getRuntimeBadgeLabel,
  requiresApproval,
} from '../runtime/difaryxRuntimeMode';
import { ApprovalActionDialog } from '../components/runtime/ApprovalActionDialog';
import { ConnectedAccountStatus } from '../components/runtime/ConnectedAccountStatus';
import {
  createApprovalActionPreview,
  type ApprovalActionPreview,
  type ApprovalActionType,
  type ApprovalRiskLevel,
} from '../runtime/actionApproval';
import { appendApprovalLedgerEntry, createApprovalLedgerEntry, summarizeApprovalLedger } from '../runtime/approvalLedger';
import { ApprovalLedgerPanel } from '../components/runtime/ApprovalLedgerPanel';
import {
  getDefaultConnectedAccountState,
  getGoogleConnectedShellState,
} from '../runtime/connectedAccounts';
import {
  createEvidenceBundleFromSnapshot,
  getEvidenceBundleBadgeLabel,
  getTechniqueCoverageFromBundle,
  getValidationGapsFromBundle,
  type EvidenceBundle,
} from '../runtime/evidenceBundle';

function reportTypeLabel(mode: NotebookTemplateMode) {
  if (mode === 'rd') return 'Technical Evidence Report';
  if (mode === 'analytical') return 'Analytical Evidence Report';
  return 'Research Evidence Report';
}

function buildReportSections(
  snapshot: ProjectEvidenceSnapshot,
  bundle: EvidenceBundle,
  registryProject: ReturnType<typeof getRegistryProject>,
  reportSection: ReturnType<typeof createReportSectionFromNotebookEntry>,
): DemoExportSection[] {
  const availableTechniques = snapshot.availableTechniques.join(', ') || 'No technique evidence linked';
  const pendingTechniques = snapshot.pendingTechniques.join(', ') || 'None';
  const bundleCoverage = getTechniqueCoverageFromBundle(bundle);
  const bundleValidationLines = getValidationGapsFromBundle(bundle).map((gap) => `${gap.description} Resolution: ${gap.suggestedResolution}`);
  const validationLines = [
    ...snapshot.validationGaps.map((gap) => `${gap.description} Resolution: ${gap.suggestedResolution}`),
    ...snapshot.pendingTechniques.map((technique) => `${technique} validation evidence remains pending.`),
  ];
  const claimBoundaryLines = [
    ...snapshot.claimBoundary.supported.map((line) => `Supported: ${line}`),
    ...snapshot.claimBoundary.requiresValidation.map((line) => `Requires validation: ${line}`),
    ...snapshot.claimBoundary.notSupportedYet.map((line) => `Not supported yet: ${line}`),
    ...(snapshot.claimBoundary.contextual ?? []).map((line) => `Contextual: ${line}`),
    ...(snapshot.claimBoundary.pending ?? []).map((line) => `Pending: ${line}`),
  ];
  const ledgerSummary = summarizeApprovalLedger({
    projectId: snapshot.projectId,
    bundleId: bundle.bundleId,
    limit: 4,
  });

  return [
    {
      heading: 'Executive Summary',
      lines: [
        snapshot.evidenceEntries[0]?.support ?? registryProject.evidenceSummary,
        `Supported assignment: ${snapshot.supportedAssignment}.`,
        `Claim status: ${claimStatusLabel(registryProject.claimStatus)}.`,
      ],
    },
    {
      heading: 'Experimental Context',
      lines: [
        `Project: ${snapshot.projectName}`,
        `Objective: ${registryProject.objective}`,
        `Sample/system: ${snapshot.sampleIdentity}`,
        `Source mode: ${snapshot.sourceMode ?? 'demo_preloaded'}`,
        `Source label: ${snapshot.sourceLabel ?? 'Demo evidence'}`,
        `Active dataset: ${snapshot.activeDataset?.fileName ?? snapshot.evidenceEntries[0]?.datasetLabel ?? 'Pending evidence source'}`,
        `Available techniques: ${availableTechniques}`,
        `Pending validation techniques: ${pendingTechniques}`,
      ],
    },
    {
      heading: 'Evidence Bundle',
      lines: snapshot.evidenceEntries.length
        ? [
            `Bundle: ${bundle.bundleId}`,
            `Bundle source: ${getEvidenceBundleBadgeLabel(bundle)} / ${bundle.permissionMode}`,
            `Files: ${bundle.files.map((file) => `${file.technique}:${file.fileName}`).join('; ')}`,
            `Technique coverage: ${bundleCoverage.map((item) => `${item.technique}:${item.status}`).join(', ')}`,
            `Completeness: ${bundle.evidenceCompletenessScore}%`,
            ...snapshot.evidenceEntries.map((item) => `${item.technique}: ${item.support}`),
            ...snapshot.pendingTechniques.map((technique) => `${technique}: pending validation evidence`),
          ]
        : ['No structured evidence is linked to this project yet.'],
    },
    {
      heading: 'Interpretation',
      lines: snapshot.sourceMode === 'user_uploaded'
        ? [
            snapshot.evidenceEntries[0]?.support ?? 'Uploaded evidence is available, but bounded interpretation remains pending.',
            `Supported assignment: ${snapshot.supportedAssignment}.`,
            'Interpretation remains validation-limited until project-specific references and complementary evidence are reviewed.',
          ]
        : reportSection.lines.length ? reportSection.lines : [registryProject.notebook.interpretation],
    },
    {
      heading: 'Validation Boundary',
      lines: claimBoundaryLines.length ? claimBoundaryLines : [registryProject.notebook.validationBoundary],
    },
    {
      heading: 'Validation Gap',
      lines: [...validationLines, ...bundleValidationLines].length
        ? [...new Set([...validationLines, ...bundleValidationLines])]
        : ['No open validation gaps are registered for this project.'],
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
        `Runtime source: ${snapshot.sourceLabel ?? 'Demo evidence'}`,
        `Runtime mode: ${snapshot.runtimeMode ?? 'demo'} / ${snapshot.permissionMode ?? 'read_only'}`,
        `Evidence snapshot: ${snapshot.projectId} / ${availableTechniques} / pending ${pendingTechniques}`,
        `Evidence bundle: ${bundle.bundleId} / ${bundle.sourceMode} / ${bundle.sourceLabel}`,
        `Local approval preview ledger: ${ledgerSummary.total} browser-local entries for this project/bundle.`,
        ...(ledgerSummary.recentLines.length ? ledgerSummary.recentLines : ['No approval preview history recorded in this browser.']),
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
  const [approvalAction, setApprovalAction] = useState<ApprovalActionPreview | null>(null);
  const evidenceSnapshot = useMemo(() => getProjectEvidenceSnapshot(project.id, {
    source: searchParams.get('source'),
    analysisSessionId: searchParams.get('sessionId') ?? searchParams.get('analysisId'),
    uploadedRunId: searchParams.get('upload') ?? searchParams.get('uploadedRunId'),
    driveFileId: searchParams.get('driveFileId') ?? searchParams.get('driveImportId'),
  }), [project.id, feedback, searchParams]);
  const evidenceBundle = useMemo(
    () => createEvidenceBundleFromSnapshot(evidenceSnapshot, {
      includeDemoContext: searchParams.get('bundle') === 'mixed' || searchParams.get('source') === 'mixed',
    }),
    [evidenceSnapshot, searchParams],
  );

  const workflowProcessingResult = useMemo(
    () => evidenceSnapshot.reportContext ?? getLatestProcessingResult(project.id) ?? createProcessingResultFromXrdDemo(project.id),
    [project.id, evidenceSnapshot.reportContext],
  );
  const workflowRefinement = useMemo(
    () => getLatestAgentDiscussionRefinement(project.id, templateMode) ?? refineDiscussionFromProcessing(workflowProcessingResult, templateMode),
    [project.id, templateMode, workflowProcessingResult],
  );
  const workflowNotebookEntry = useMemo(() => {
    const fromRoute = getNotebookEntry(searchParams.get('entry'));
    if (fromRoute?.projectId === project.id) return fromRoute;
    return (
      (evidenceSnapshot.notebookContext?.templateMode === templateMode ? evidenceSnapshot.notebookContext : null) ??
      getLatestNotebookEntry(project.id, templateMode) ??
      createNotebookEntryFromRefinement(workflowRefinement, templateMode)
    );
  }, [project.id, searchParams, templateMode, workflowRefinement, evidenceSnapshot.notebookContext]);
  const workflowReportSection = useMemo(
    () => createReportSectionFromNotebookEntry(workflowNotebookEntry),
    [workflowNotebookEntry],
  );
  const reportSections = useMemo(
    () => buildReportSections(evidenceSnapshot, evidenceBundle, registryProject, workflowReportSection),
    [evidenceSnapshot, evidenceBundle, registryProject, workflowReportSection],
  );
  const reportTemplate = NOTEBOOK_TEMPLATES[templateMode];
  const reportStatus =
    evidenceBundle.missingRequiredTechniques.length > 0 || evidenceBundle.validationGaps.length > 0 || registryProject.reportReadiness < 80
      ? 'Draft - validation-limited'
      : 'Ready for internal review';
  const runtimeContext = {
    sourceMode: evidenceSnapshot.sourceMode ?? 'demo_preloaded',
    runtimeMode: evidenceSnapshot.runtimeMode ?? 'demo',
    permissionMode: evidenceSnapshot.permissionMode ?? 'read_only',
    sourceLabel: evidenceSnapshot.sourceLabel ?? 'Demo evidence',
    approvalStatus: evidenceSnapshot.approvalStatus ?? 'not_required',
  } as const;
  const connectedAccountState = runtimeContext.sourceMode === 'google_drive_connected'
    ? getGoogleConnectedShellState()
    : getDefaultConnectedAccountState();
  const reportVersion = `v${Math.max(1, Math.round(registryProject.reportReadiness / 20))}.0`;
  const preparedAt = new Date().toLocaleDateString();
  const filenameBase = `difaryx_${project.id}_${reportTemplate.reportTemplate}_report`;
  const uploadedRouteParams = new URLSearchParams();
  ['source', 'bundle', 'sessionId', 'analysisId', 'upload', 'uploadedRunId', 'driveFileId', 'driveImportId'].forEach((key) => {
    const value = searchParams.get(key);
    if (value) uploadedRouteParams.set(key, value);
  });
  const uploadedRouteSuffix = uploadedRouteParams.toString() ? `&${uploadedRouteParams.toString()}` : '';

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 1800);
  };

  const openApprovalPreview = (
    actionType: ApprovalActionType,
    actionLabel: string,
    destinationLabel: string,
    riskLevel?: ApprovalRiskLevel,
  ) => {
    const action = createApprovalActionPreview({
      actionId: `report-${actionType}-${Date.now()}`,
      actionType,
      actionLabel,
      destinationLabel,
      evidenceSnapshot,
      runtimeContext,
      evidenceBundle,
      riskLevel,
    });
    appendApprovalLedgerEntry(createApprovalLedgerEntry(action, 'preview_opened'));
    setApprovalAction(action);
  };

  const logLocalReportAction = (
    actionType: ApprovalActionType,
    actionLabel: string,
    destinationLabel: string,
    riskLevel?: ApprovalRiskLevel,
  ) => {
    const action = createApprovalActionPreview({
      actionId: `report-${actionType}-${Date.now()}`,
      actionType,
      actionLabel,
      destinationLabel,
      evidenceSnapshot,
      runtimeContext,
      evidenceBundle,
      riskLevel,
    });
    appendApprovalLedgerEntry(createApprovalLedgerEntry(action, 'local_preview_continued', {
      notes: 'Report local/demo action completed in this browser. No external write executed.',
    }));
  };

  const exportReport = (format: DemoExportFormat) => {
    if (requiresApproval(runtimeContext)) {
      openApprovalPreview(
        'report_export',
        `${format.toUpperCase()} report export`,
        'Formal report artifact local preview',
        'medium',
      );
      return;
    }

    exportDemoArtifact(format, {
      filenameBase,
      title: `${evidenceSnapshot.projectName} ${reportTypeLabel(templateMode)}`,
      sections: reportSections,
    });
    logLocalReportAction('report_export', `${format.toUpperCase()} report export`, 'Formal report artifact local preview', 'medium');
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

  const saveReportVersion = () => {
    if (requiresApproval(runtimeContext)) {
      openApprovalPreview(
        'report_generation',
        'Reproducible report generation',
        'Versioned report memory local preview',
        'medium',
      );
      return;
    }

    logLocalReportAction('report_generation', 'Reproducible report generation', 'Versioned report memory local preview', 'medium');
    showFeedback(`Saved ${reportVersion}.`);
  };

  const openFutureExportPreview = (actionType: 'google_drive_export_future' | 'gmail_draft_future') => {
    openApprovalPreview(
      actionType,
      actionType === 'google_drive_export_future' ? 'Google Drive export' : 'Gmail draft',
      actionType === 'google_drive_export_future'
        ? 'Future Google Drive export placeholder'
        : 'Future Gmail draft placeholder',
      'high',
    );
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
                <span className={`rounded-full border px-2 py-0.5 ${getRuntimeBadgeClass(runtimeContext)}`}>
                  {getRuntimeBadgeLabel(runtimeContext)}
                </span>
              </div>
              <h1 className="mt-1 truncate text-xl font-bold text-text-main">{evidenceSnapshot.projectName} Evidence Report</h1>
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
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openFutureExportPreview('google_drive_export_future')}><Download size={13} /> Drive export</Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openFutureExportPreview('gmail_draft_future')}><FileText size={13} /> Gmail draft</Button>
              <Button size="sm" className="gap-1.5" onClick={saveReportVersion}><Save size={13} /> Save version</Button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ConnectedAccountStatus
              state={connectedAccountState}
              capabilities={['drive_import', 'drive_export_future', 'gmail_draft_future']}
              compact
            />
            <span className="text-[11px] font-semibold text-text-muted">Drive/Gmail destinations are connection-shell previews only.</span>
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
                ['Project', evidenceSnapshot.projectName],
                ['Sample', evidenceSnapshot.sampleIdentity],
                ['Evidence bundle', evidenceSnapshot.availableTechniques.join(', ') || 'Pending'],
                ['Bundle source', getEvidenceBundleBadgeLabel(evidenceBundle)],
                ['Bundle files', String(evidenceBundle.files.length)],
                ['Completeness', `${evidenceBundle.evidenceCompletenessScore}%`],
                ['Pending validation', evidenceSnapshot.pendingTechniques.join(', ') || 'None'],
                ['Report type', reportTypeLabel(templateMode)],
                ['Prepared from', workflowNotebookEntry.title],
                ['Runtime source', getRuntimeBadgeLabel(runtimeContext, 'source')],
                ['Permission', getRuntimeBadgeLabel(runtimeContext, 'permission')],
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
              <p className="mt-2 text-xs leading-relaxed text-amber-900">
                {reportSections.find((section) => section.heading === 'Validation Boundary')?.lines[0] ?? registryProject.notebook.validationBoundary}
              </p>
            </div>
            <div className="mt-3">
              <ApprovalLedgerPanel projectId={project.id} bundleId={evidenceBundle.bundleId} limit={4} compact />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Link to={`/notebook?project=${project.id}&template=${templateMode}&entry=${workflowNotebookEntry.id}${uploadedRouteSuffix}`} className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-bold text-text-main hover:border-primary/40 hover:text-primary">
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
                    <h2 className="mt-2 text-2xl font-bold text-text-main">{evidenceSnapshot.projectName}</h2>
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
      <ApprovalActionDialog
        action={approvalAction}
        onClose={() => setApprovalAction(null)}
        onContinueLocal={() => {
          setApprovalAction(null);
          showFeedback('Local report preview retained. No external action executed.');
        }}
      />
    </DashboardLayout>
  );
}
