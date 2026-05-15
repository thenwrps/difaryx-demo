import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Database, Download, Link2, User } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { DEFAULT_PROJECT_ID } from '../data/demoProjects';
import { ConnectedAccountStatus } from '../components/runtime/ConnectedAccountStatus';
import {
  getDefaultConnectedAccountState,
  getGoogleConnectedShellState,
} from '../runtime/connectedAccounts';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
      <input
        readOnly
        value={value}
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-main focus:outline-none"
      />
    </label>
  );
}

function ToggleRow({ label, description, checked = true }: { label: string; description: string; checked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-background/50 p-3">
      <div>
        <div className="text-sm font-medium text-text-main">{label}</div>
        <div className="text-xs text-text-muted mt-1">{description}</div>
      </div>
      <div className={`h-6 w-11 rounded-full p-0.5 ${checked ? 'bg-primary' : 'bg-surface-hover'}`}>
        <div className={`h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const localAccountState = getDefaultConnectedAccountState();
  const googleAccountShell = getGoogleConnectedShellState();
  const mockDriveWorkspacePath = '/workspace/xrd?project=cu-fe2o4-spinel&source=google_drive_connected&driveFileId=drive-cufe2o4-xrd';
  const mockDriveReportPath = '/reports?project=cu-fe2o4-spinel&source=google_drive_connected&driveFileId=drive-cufe2o4-xrd';

  return (
    <DashboardLayout>
      <div className="p-8 h-full overflow-y-auto">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Workspace configuration</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-text-muted mt-1 text-sm">Demo settings for product behavior, exports, and reasoning preferences.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-5 xl:col-span-2">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Database size={16} className="text-primary" /> Demo Dataset / Deterministic Scientific Workflow</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
              This demo uses a deterministic scientific workflow for reliability. The same structured pipeline is designed to connect with model and tool-based execution layers.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2"><User size={16} className="text-primary" /> Profile</h2>
            <div className="mt-5 grid gap-4">
              <Field label="Name" value="Demo Researcher" />
              <Field label="Email" value="researcher@example.com" />
              <Field label="Organization" value="DIFARYX Demo Lab" />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Database size={16} className="text-primary" /> Data Handling</h2>
            <div className="mt-5 grid gap-4">
              <Field label="Default project" value={DEFAULT_PROJECT_ID} />
              <ToggleRow label="Local demo mode" description="Use bundled project data without a backend connection." />
              <Field label="File retention" value="Demo files reset between production sessions" />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Download size={16} className="text-primary" /> Export Preferences</h2>
            <div className="mt-5 grid gap-3">
              <ToggleRow label="PDF report" description="Include phase summary and evidence trace." />
              <ToggleRow label="CSV data" description="Include processed spectrum and peak table." />
              <ToggleRow label="PNG chart" description="Export publication-ready graph images." />
              <ToggleRow label="DOCX summary" description="Create editable notebook summaries." checked={false} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Bot size={16} className="text-primary" /> Analysis Preferences</h2>
            <div className="mt-5 grid gap-4">
              <ToggleRow label="Evidence-linked interpretations" description="Require every interpretation to cite supporting data." />
              <Field label="Review criterion" value="Structural consistency" />
              <ToggleRow label="Include limitations in reports" description="Surface uncertainty and follow-up validation notes." />
            </div>
          </Card>

          <Card className="p-5 xl:col-span-2">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Link2 size={16} className="text-primary" /> Connected Accounts</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
              Connection shell only. Google Drive and Gmail destinations are represented for approval readiness, but no OAuth scopes, backend calls, or external writes are active.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ConnectedAccountStatus state={localAccountState} capabilities={['storage_future']} />
              <ConnectedAccountStatus state={googleAccountShell} capabilities={['drive_import', 'drive_export_future', 'gmail_draft_future']} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
              <span className="text-xs font-semibold text-blue-900">Mock Drive evidence preview only; no real Drive files are accessed.</span>
              <Link to={mockDriveWorkspacePath} className="inline-flex h-7 items-center rounded-md border border-blue-200 bg-white px-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
                Preview Drive import
              </Link>
              <Link to={mockDriveReportPath} className="inline-flex h-7 items-center rounded-md border border-blue-200 bg-white px-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
                Use mock Drive evidence
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
