import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ClipboardList, FileText, FolderOpen, GitCompare, History, NotebookText } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { getAllHistoryEntries } from '../data/demoProjects';
import { formatChemicalFormula } from '../utils';

function formatClaimStatus(status: string): string {
  switch (status) {
    case 'strongly_supported': return 'Strongly Supported';
    case 'supported': return 'Supported';
    case 'partial': return 'Partial';
    case 'inconclusive': return 'Inconclusive';
    case 'contradicted': return 'Contradicted';
    default: return status;
  }
}

const agentRuns = [
  {
    id: 'AG-RUN-CF-042',
    projectId: 'cu-fe2o4-spinel',
    project: 'CuFe2O4 Spinel Formation',
    goal: 'Determine ferrite spinel formation and catalytic activation evidence',
    mode: 'Deep Analysis',
    claimStatus: 'supported',
    decision: 'Spinel formation supported; catalytic activation requires XPS validation',
    status: 'Report-ready',
    date: '2026-04-29',
    techniques: ['XRD', 'Raman', 'FTIR', 'XPS'],
  },
  {
    id: 'AG-RUN-SBA-044',
    projectId: 'cufe2o4-sba15',
    project: 'CuFe2O4/SBA-15 Multi-Tech Correlation',
    goal: 'Fuse XRD, Raman, FTIR, and XPS evidence for supported ferrite catalyst',
    mode: 'Autonomous Workflow',
    claimStatus: 'strongly_supported',
    decision: 'Multi-tech evidence supports dispersed CuFe2O4/SBA-15 structure',
    status: 'Evidence-linked',
    date: '2026-04-29',
    techniques: ['XRD', 'Raman', 'FTIR', 'XPS'],
  },
  {
    id: 'AG-RUN-NF-041',
    projectId: 'nife2o4',
    project: 'NiFe2O4 Control Sample',
    goal: 'Compare control ferrite phase against CuFe2O4 reference workflow',
    mode: 'Quick Insight',
    claimStatus: 'partial',
    decision: 'Phase evidence acceptable; requires replicate confirmation',
    status: 'Draft',
    date: '2026-04-28',
    techniques: ['XRD'],
  },
];

const filters = ['Project', 'Technique', 'Claim Status', 'Mode', 'Status'];

function actionLabel(action: string) {
  if (action === 'notebook') return 'Open Notebook';
  if (action === 'agent') return 'Run Agent';
  return 'View Workspace';
}

function actionPath(entry: ReturnType<typeof getAllHistoryEntries>[number]) {
  if (entry.action === 'notebook') return entry.notebookPath;
  if (entry.action === 'agent') return entry.agentPath;
  return entry.workspacePath;
}

function ActionIcon({ action }: { action: string }) {
  if (action === 'notebook') return <FileText size={15} />;
  if (action === 'agent') return <Bot size={15} />;
  return <FolderOpen size={15} />;
}

export default function HistoryPage() {
  const entries = getAllHistoryEntries();
  const [feedback, setFeedback] = React.useState('');

  const compareRun = (runId: string) => {
    setFeedback(`${runId} queued for comparison`);
    window.setTimeout(() => setFeedback(''), 1800);
  };

  return (
    <DashboardLayout>
      <div className="p-8 h-full overflow-y-auto">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">DIFARYX records</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Agent Run History</h1>
          <p className="text-text-muted mt-1 text-sm">
            Trace previous scientific goals, evidence, confidence, decisions, and report provenance.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Agent memory', 'Evidence trace', 'Reproducibility log'].map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        <Card className="mb-6 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Filters</span>
            {filters.map((filter) => (
              <label key={filter} className="text-xs text-text-muted">
                <span className="sr-only">{filter}</span>
                <select
                  aria-label={filter}
                  defaultValue=""
                  className="h-9 rounded-md border border-border bg-background px-3 text-xs font-semibold text-text-main"
                >
                  <option value="">{filter}: All</option>
                </select>
              </label>
            ))}
            {feedback && (
              <span className="ml-auto rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
                {feedback}
              </span>
            )}
          </div>
        </Card>

        <div className="mb-8 grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Agent memory</p>
              <h2 className="mt-1 text-lg font-semibold">Deterministic agent runs</h2>
            </div>
            {agentRuns.map((run) => (
              <Card key={run.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        <History size={13} />
                        {run.id}
                      </span>
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-text-muted">
                        {run.mode}
                      </span>
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-text-muted">
                        {run.status}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-text-main">{formatChemicalFormula(run.project)}</h3>
                    <p className="mt-2 text-sm text-text-muted">{run.goal}</p>
                    <p className="mt-3 text-sm text-text-main">
                      <span className="font-semibold">Decision:</span> {run.decision}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {run.techniques.map((technique) => (
                        <span
                          key={technique}
                          className="rounded-md border border-cyan/20 bg-cyan/10 px-2 py-1 text-[11px] font-semibold text-cyan"
                        >
                          {technique}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-full shrink-0 space-y-3 lg:w-52">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-border bg-background p-3">
                        <p className="text-text-muted">Claim Status</p>
                        <p className={`mt-1 font-semibold ${
                          run.claimStatus === 'strongly_supported' ? 'text-emerald-600' :
                          run.claimStatus === 'supported' ? 'text-cyan' :
                          run.claimStatus === 'partial' ? 'text-amber-500' :
                          'text-text-muted'
                        }`}>{formatClaimStatus(run.claimStatus)}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-background p-3">
                        <p className="text-text-muted">Date</p>
                        <p className="mt-1 font-semibold text-text-main">{run.date}</p>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Link
                        to={`/demo/agent?project=${run.projectId}&run=${run.id}`}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                      >
                        <Bot size={14} />
                        View Run
                      </Link>
                      <Link
                        to={`/notebook?project=${run.projectId}`}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold text-text-main hover:bg-surface-hover transition-colors"
                      >
                        <NotebookText size={14} />
                        Open Notebook
                      </Link>
                      <button
                        type="button"
                        onClick={() => compareRun(run.id)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-cyan/30 px-3 text-xs font-semibold text-cyan hover:bg-cyan/10 transition-colors"
                      >
                        <GitCompare size={14} />
                        Compare Runs
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="h-fit p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Memory / provenance</p>
            <h2 className="mt-1 text-lg font-semibold">Agent memory summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ['Total agent runs', '3'],
                ['Report-ready runs', '1'],
                ['Evidence-linked runs', '2'],
                ['Techniques covered', 'XRD, Raman, FTIR, XPS'],
                ['Most recent decision', 'Spinel formation supported by evidence'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="mt-1 font-semibold text-text-main">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs leading-relaxed text-text-muted">
              Every agent conclusion is linked back to datasets, methods, evidence, caveats, and next actions.
            </p>
          </Card>
        </div>

        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Workspace provenance entries
          </p>
        </div>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-4 px-5 py-3 bg-surface-hover/40 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <div>Analysis run</div>
            <div>Project</div>
            <div>Technique</div>
            <div>Claim Status</div>
            <div>Status</div>
            <div>Date</div>
            <div>Action</div>
          </div>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[1.3fr_1fr_0.8fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-4 px-5 py-4 border-t border-border text-sm items-center"
            >
              <div className="font-medium text-text-main flex items-center gap-2">
                <ClipboardList size={15} className="text-primary" />
                {entry.run}
              </div>
              <div className="text-text-muted">{entry.projectName}</div>
              <div className="text-text-muted">{entry.technique}</div>
              <div className={`font-semibold ${
                entry.claimStatus === 'strongly_supported' ? 'text-emerald-600' :
                entry.claimStatus === 'supported' ? 'text-cyan' :
                entry.claimStatus === 'partial' ? 'text-amber-500' :
                'text-text-muted'
              }`}>{formatClaimStatus(entry.claimStatus)}</div>
              <div>
                <span className="rounded-full border border-border bg-background px-2 py-1 text-xs text-text-muted">
                  {entry.status}
                </span>
              </div>
              <div className="text-text-muted">{entry.date}</div>
              <Link
                to={actionPath(entry)}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border px-2 text-xs font-semibold text-text-main hover:bg-surface-hover transition-colors"
              >
                <ActionIcon action={entry.action} />
                {actionLabel(entry.action)}
              </Link>
            </div>
          ))}
        </Card>
      </div>
    </DashboardLayout>
  );
}
