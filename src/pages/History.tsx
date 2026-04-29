import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ClipboardList, FileText, FolderOpen } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { getAllHistoryEntries } from '../data/demoProjects';

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

  return (
    <DashboardLayout>
      <div className="p-8 h-full overflow-y-auto">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">DIFARYX records</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-text-muted mt-1 text-sm">
            Traceable demo runs across workspace analysis, notebook generation, agent decisions, and report export.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-4 px-5 py-3 bg-surface-hover/40 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <div>Analysis run</div>
            <div>Project</div>
            <div>Technique</div>
            <div>Confidence</div>
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
              <div className="font-semibold text-cyan">{entry.confidence}</div>
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
