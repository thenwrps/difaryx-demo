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
    purpose: 'Phase and peak analysis',
  },
  {
    id: 'xps',
    name: 'XPS',
    purpose: 'Surface-state analysis',
  },
  {
    id: 'ftir',
    name: 'FTIR',
    purpose: 'Bonding and functional groups',
  },
  {
    id: 'raman',
    name: 'Raman',
    purpose: 'Vibrational and lattice modes',
  },
];

const workspaceWorkflowSteps = [
  'Signal',
  'Process',
  'Cross-Techniques Comparison',
  'Agent',
  'Notebook',
  'Report',
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
    projectId: 'cu-fe2o4-spinel',
    lastUpdated: '2 hours ago',
    status: 'Ready',
  },
  {
    id: '2',
    dataset: 'cufe2o4_raman_demo.txt',
    technique: 'Raman',
    project: 'CuFe₂O₄ Spinel',
    projectId: 'cu-fe2o4-spinel',
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
  {
    id: '5',
    dataset: 'nife2o4_xrd_demo.xy',
    technique: 'XRD',
    project: 'NiFe₂O₄',
    projectId: 'ni-fe2o4',
    lastUpdated: '2 days ago',
    status: 'Ready',
  },
  {
    id: '6',
    dataset: 'cofe2o4_xrd_demo.xy',
    technique: 'XRD',
    project: 'CoFe₂O₄',
    projectId: 'co-fe2o4',
    lastUpdated: '3 days ago',
    status: 'Ready',
  },
  {
    id: '7',
    dataset: 'cofe2o4_xps_demo.csv',
    technique: 'XPS',
    project: 'CoFe₂O₄',
    projectId: 'co-fe2o4',
    lastUpdated: '3 days ago',
    status: 'Ready',
  },
  {
    id: '8',
    dataset: 'fe3o4_ftir_demo.csv',
    technique: 'FTIR',
    project: 'Fe₃O₄ Nanoparticles',
    projectId: 'fe3o4-nanoparticles',
    lastUpdated: '1 week ago',
    status: 'Ready',
  },
  {
    id: '9',
    dataset: 'fe3o4_raman_demo.txt',
    technique: 'Raman',
    project: 'Fe₃O₄ Nanoparticles',
    projectId: 'fe3o4-nanoparticles',
    lastUpdated: '1 week ago',
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
        <div className="max-w-7xl mx-auto p-4 space-y-3">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-main">
              Analysis Workspace
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">
              Process, compare, refine, report.
            </p>
          </div>

          {/* Compact workflow strip */}
          <div className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {workspaceWorkflowSteps.map((step, index) => (
                <React.Fragment key={step}>
                  <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                    {step}
                  </span>
                  {index < workspaceWorkflowSteps.length - 1 && (
                    <span className="text-[10px] font-semibold text-primary">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Technique Cards - Compact 4x1 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {techniques.map((technique) => {
              const hasProjectData = project && project.techniques.includes(technique.name as any);
              
              return (
                <Card key={technique.id} className="group transition-all hover:border-primary/50">
                  <div className="p-3">
                    {/* Technique name and purpose */}
                    <div className="mb-2">
                      <h3 className="text-base font-bold text-text-main">{technique.name}</h3>
                      <p className="text-[10px] text-text-muted mt-0.5">{technique.purpose}</p>
                    </div>

                    {/* Action buttons - side by side */}
                    <div className="flex gap-1.5">
                      {hasProjectData ? (
                        <>
                          <Button
                            variant="primary"
                            className="flex-1 gap-1 h-7 text-[10px] px-2"
                            onClick={() => handleUseProjectData(technique.id)}
                          >
                            <Database size={12} />
                            Load
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 gap-1 h-7 text-[10px] px-2"
                            onClick={() => handleUploadData(technique.id)}
                          >
                            <Upload size={12} />
                            Upload
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            className="flex-1 gap-1 h-7 text-[10px] px-2"
                            onClick={() => handleLoadSample(technique.id)}
                          >
                            <Database size={12} />
                            Load
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 gap-1 h-7 text-[10px] px-2"
                            onClick={() => handleUploadData(technique.id)}
                          >
                            <Upload size={12} />
                            Upload
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Recent Workspace History - Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-text-main">Recent Workspace History</h2>
              <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                View all
              </button>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Sample / Dataset
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Technique
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Project
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Last Updated
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Status
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {workspaceHistory.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-3 py-2 text-xs font-medium text-text-main">
                          {item.dataset}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                            {item.technique}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-text-main">
                          {item.project}
                        </td>
                        <td className="px-3 py-2 text-xs text-text-muted">
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            {item.lastUpdated}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleHistoryItemClick(item)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
                          >
                            Open {item.technique}
                            <ArrowRight size={10} />
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
