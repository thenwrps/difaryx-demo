import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Database,
  FileText,
  History,
  Layers,
  Settings,
} from 'lucide-react';
import type { DemoDataset, DemoProject } from '../../../data/demoProjects';
import { getWorkspaceRoute } from '../../../data/demoProjects';

interface LeftSidebarProps {
  currentDataset: DemoDataset;
  currentProject: DemoProject;
  onNavigate?: (route: string) => void;
}

export function LeftSidebar({
  currentDataset,
  currentProject,
}: LeftSidebarProps) {
  const workspaceRoute = getWorkspaceRoute(
    currentProject,
    currentDataset.technique,
    currentDataset.id
  );

  const multiTechRoute = `/workspace/multi?project=${currentProject.id}`;
  const notebookRoute = `/notebook?project=${currentProject.id}`;

  return (
    <aside className="flex w-[72px] shrink-0 flex-col border-r border-white/[0.08] bg-[#080E19]">
      <nav className="flex-1 space-y-1 p-4">
        <NavItem
          icon={Activity}
          label="Agent Demo"
          to="/demo/agent"
          active
        />
        <NavItem
          icon={Layers}
          label="Workflows"
          to={multiTechRoute}
        />
        <NavItem
          icon={Database}
          label="Data"
          to={workspaceRoute}
        />
        <NavItem
          icon={FileText}
          label="Results"
          to={notebookRoute}
        />
        <NavItem
          icon={History}
          label="History"
          to="/history"
        />
        <NavItem
          icon={Settings}
          label="Settings"
          to="/settings"
        />
      </nav>

      <div className="border-t border-white/[0.08] p-3">
        <div className="flex items-center justify-center">
          <div
            className="h-2 w-2 rounded-full bg-emerald-400"
            title={currentDataset.fileName}
          />
        </div>
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  to: string;
}

function NavItem({ icon: Icon, label, active, to }: NavItemProps) {
  const className = `flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? 'border border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
  }`;

  return (
    <Link to={to} className={className} title={label} aria-label={label}>
      <Icon size={18} className="shrink-0" />
    </Link>
  );
}
