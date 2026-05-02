import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Layers,
  Settings,
} from 'lucide-react';
import type { DemoDataset, DemoProject, Technique } from '../../../data/demoProjects';
import { getWorkspaceRoute } from '../../../data/demoProjects';

interface LeftSidebarProps {
  currentDataset: DemoDataset;
  currentProject: DemoProject;
  onNavigate?: (route: string) => void;
}

export function LeftSidebar({
  currentDataset,
  currentProject,
  onNavigate,
}: LeftSidebarProps) {
  const [dataExpanded, setDataExpanded] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  
  const workspaceRoute = getWorkspaceRoute(
    currentProject,
    currentDataset.technique,
    currentDataset.id
  );

  // Build context-aware routes based on current project
  const multiTechRoute = `/workspace/multi?project=${currentProject.id}`;
  const notebookRoute = `/notebook?project=${currentProject.id}`;

  // Build technique-specific routes
  const getTechniqueRoute = (technique: Technique) => {
    const techLower = technique.toLowerCase();
    return `/workspace/${techLower}?project=${currentProject.id}`;
  };

  return (
    <aside className={`shrink-0 border-r border-white/[0.08] bg-[#080E19] flex flex-col transition-all duration-300 ${
      collapsed ? 'w-[72px]' : 'w-[280px]'
    }`}>
      {/* Collapse Toggle Button */}
      <div className="flex items-center justify-end p-3 border-b border-white/[0.08]">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <NavItem
          icon={Activity}
          label="Agent Demo"
          active
          badge="Live Execution"
          collapsed={collapsed}
        />
        <NavItem 
          icon={Layers} 
          label="Workflows" 
          to={multiTechRoute}
          collapsed={collapsed}
        />
        
        {/* Data Section with Expandable Techniques */}
        {!collapsed && (
          <div>
            <button
              type="button"
              onClick={() => setDataExpanded(!dataExpanded)}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              <Database size={18} className="shrink-0" />
              <span className="flex-1 truncate text-left">Data</span>
              {dataExpanded ? (
                <ChevronDown size={16} className="shrink-0" />
              ) : (
                <ChevronRight size={16} className="shrink-0" />
              )}
            </button>
            
            {dataExpanded && (
              <div className="ml-6 mt-1 space-y-1 border-l border-slate-800 pl-3">
                {currentProject.techniques.map((technique) => (
                  <Link
                    key={technique}
                    to={getTechniqueRoute(technique)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      currentDataset.technique === technique
                        ? 'bg-cyan-400/10 text-cyan-300'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                    <span>{technique}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        
        {collapsed && (
          <NavItem 
            icon={Database} 
            label="Data" 
            collapsed={collapsed}
          />
        )}
        
        <NavItem 
          icon={FileText} 
          label="Results" 
          to={notebookRoute}
          collapsed={collapsed}
        />
        <NavItem 
          icon={Brain} 
          label="Knowledge" 
          to="/knowledge"
          collapsed={collapsed}
        />
        <NavItem 
          icon={Settings} 
          label="Settings" 
          to="/settings"
          collapsed={collapsed}
        />
      </nav>

      {/* Current Dataset Card */}
      {!collapsed && (
        <div className="p-4 border-t border-white/[0.08]">
          <div className="rounded-lg border border-white/[0.08] bg-[#0F172A] p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Current Dataset
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  {currentDataset.fileName}
                </div>
              </div>
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                Loaded
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Technique:</span>
                <span className="text-slate-300 font-medium">{currentDataset.technique}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">2θ Range:</span>
                <span className="text-slate-300 font-medium">
                  {currentDataset.technique === 'XRD' ? '10° - 80°' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Step Size:</span>
                <span className="text-slate-300 font-medium">
                  {currentDataset.technique === 'XRD' ? '0.02°' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Points:</span>
                <span className="text-slate-300 font-medium">
                  {currentDataset.dataPoints.length}
                </span>
              </div>
            </div>

            <Link
              to={workspaceRoute}
              className="block w-full text-center px-3 py-2 rounded-md bg-slate-800/50 border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-colors"
            >
              View Dataset
            </Link>
          </div>
        </div>
      )}
      
      {/* Collapsed Dataset Indicator */}
      {collapsed && (
        <div className="p-3 border-t border-white/[0.08]">
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400" title={currentDataset.fileName} />
          </div>
        </div>
      )}
    </aside>
  );
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: string;
  to?: string;
  collapsed?: boolean;
}

function NavItem({ icon: Icon, label, active, badge, to, collapsed }: NavItemProps) {
  const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    active
      ? 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-300'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
  } ${collapsed ? 'justify-center' : ''}`;

  const content = (
    <>
      <Icon size={18} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge && (
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 text-[9px] font-bold uppercase tracking-wider">
              {badge}
            </span>
          )}
        </>
      )}
    </>
  );

  const title = collapsed ? label : undefined;

  if (to) {
    return (
      <Link to={to} className={className} title={title}>
        {content}
      </Link>
    );
  }

  return <div className={className} title={title}>{content}</div>;
}
