import React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Database, Upload, ArrowRight, Clock } from 'lucide-react';
import { getProject, demoProjects } from '../data/demoProjects';
import { formatChemicalFormula } from '../utils';

type Technique = 'xrd' | 'xps' | 'ftir' | 'raman';

interface TechniqueConfig {
  id: Technique;
  name: string;
  purpose: string;
}

const techniques: TechniqueConfig[] = [
  {
    id: 'xrd',
    name: 'XRD',
    purpose: 'Phase identification and peak analysis',
  },
  {
    id: 'xps',
    name: 'XPS',
    purpose: 'Surface-state and oxidation-state analysis',
  },
  {
    id: 'ftir',
    name: 'FTIR',
    purpose: 'Bonding and functional group analysis',
  },
  {
    id: 'raman',
    name: 'Raman',
    purpose: 'Vibrational mode and lattice analysis',
  },
];

const workspaceWorkflowSteps = [
  'Analysis Workspace',
  'Technique Processing',
  'Cross-Tech Evidence Review',
  'Agentic Interpretation Refinement',
  'Notebook Template Entry',
  'Report Export',
];

interface WorkspaceHistoryItem {
  id: string;
  dataset: string;
  technique: string;
  project: string;
  projectId: string;
  lastUpdated: string;
  status: string;
}

// Mock workspace history data
const workspaceHistory: WorkspaceHistoryItem[] = [
  {
    id: '1',
    dataset: 'cufe2o4_clean_demo.xy',
    technique: 'XRD',
    project: 'CuFe₂O₄ Spinel',
    projectId: 'cufe2o4-spinel',
    lastUpdated: '2 hours ago',
    status: 'Ready',
  },
  {
    id: '2',
    dataset: 'cufe2o4_raman_demo.txt',
    technique: 'Raman',
    project: 'CuFe₂O₄ Spinel',
    projectId: 'cufe2o4-spinel',
    lastUpdated: '5 hours ago',
    status: 'Ready',
  },
  {
    id: '3',
    dataset: 'cufe2o4_ftir_demo.csv',
    technique: 'FTIR',
    project: 'CuFe₂O₄/SBA-15',
    projectId: 'cufe2o4-sba15',
    lastUpdated: '1 day ago',
    status: 'Ready',
  },
  {
    id: '4',
    dataset: 'cufe2o4_xps_demo.csv',
    technique: 'XPS',
    project: 'CuFe₂O₄/SBA-15',
    projectId: 'cufe2o4-sba15',
    lastUpdated: '1 day ago',
    status: 'Ready',
  },
];

export default function WorkspaceLauncher() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const project = projectId ? getProject(projectId) : null;

  const handleLoadSample = (technique: Technique) => {
    const params = new URLSearchParams({ mode: 'sample' });
    if (projectId) params.set('project', projectId);
    navigate(`/workspace/${technique}?${params.toString()}`);
  };

  const handleUploadData = (technique: Technique) => {
    const params = new URLSearchParams({ mode: 'upload' });
    if (projectId) params.set('project', projectId);
    navigate(`/workspace/${technique}?${params.toString()}`);
  };

  const handleUseProjectData = (technique: Technique) => {
    if (projectId) {
      navigate(`/workspace/${technique}?project=${projectId}`);
    }
  };

  const handleHistoryItemClick = (item: WorkspaceHistoryItem) => {
    navigate(`/workspace/${item.technique.toLowerCase()}?project=${item.projectId}`);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main">
              Analysis Workspace
            </h1>
            <p className="mt-1 text-sm text-text-muted max-w-3xl">
              Choose a technique, load a sample or project dataset, then process, analyze, and export results.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="flex flex-wrap items-center gap-2">
              {workspaceWorkflowSteps.map((step, index) => (
                <React.Fragment key={step}>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                    {step}
                  </span>
                  {index < workspaceWorkflowSteps.length - 1 && (
                    <span className="text-[11px] font-semibold text-primary">/</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Technique Cards - Compact 4x1 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {techniques.map((technique) => {
              const hasProjectData = project && project.techniques.includes(technique.name as any);
              
              return (
                <Card key={technique.id} className="group transition-all hover:border-primary/50">
                  <div className="p-4">
                    {/* Technique name and purpose */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-text-main">{technique.name}</h3>
                      <p className="text-xs text-text-muted mt-0.5">{technique.purpose}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      {hasProjectData ? (
                        <>
                          <Button
                            variant="primary"
                            className="w-full gap-1.5 h-8 text-xs"
                            onClick={() => handleUseProjectData(technique.id)}
                          >
                            <Database size={14} />
                            Use Project Data
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full gap-1.5 h-8 text-xs"
                            onClick={() => handleUploadData(technique.id)}
                          >
                            <Upload size={14} />
                            Upload New Data
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            className="w-full gap-1.5 h-8 text-xs"
                            onClick={() => handleLoadSample(technique.id)}
                          >
                            <Database size={14} />
                            Load Sample
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full gap-1.5 h-8 text-xs"
                            onClick={() => handleUploadData(technique.id)}
                          >
                            <Upload size={14} />
                            Upload Data
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Recent Workspace History */}
          <div>
            <h2 className="text-lg font-bold text-text-main mb-3">Recent Workspace History</h2>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Sample / Dataset
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Technique
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Project
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Last Updated
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {workspaceHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-text-main">
                          {item.dataset}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                            {item.technique}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-main">
                          {item.project}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-muted">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {item.lastUpdated}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleHistoryItemClick(item)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                          >
                            Open {item.technique} Analysis
                            <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
