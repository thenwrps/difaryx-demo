import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import { Plus, Clock, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const MOCK_PROJECTS = [
  { id: 1, name: 'CuFe2O4 Spinel', date: '2 hours ago', tags: ['XRD', 'Raman'], progress: 100 },
  { id: 2, name: 'CuFe2O4/SBA-15', date: '5 hours ago', tags: ['XRD', 'XPS', 'FTIR'], progress: 85 },
  { id: 3, name: 'NiFe2O4', date: '1 day ago', tags: ['XRD'], progress: 100 },
  { id: 4, name: 'CoFe2O4', date: '2 days ago', tags: ['XRD', 'XPS'], progress: 100 },
  { id: 5, name: 'Fe3O4 Nanoparticles', date: '1 week ago', tags: ['FTIR', 'Raman'], progress: 60 },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="p-8 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Dashboard</h1>
            <p className="text-text-muted mt-1 text-sm">Manage your characterization workflows and experiments.</p>
          </div>
          <Button variant="primary" className="gap-2">
            <Plus size={16} /> New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MOCK_PROJECTS.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors group flex flex-col h-64"
              onClick={() => navigate('/workspace/xrd')}
            >
              <div className="p-4 border-b border-border bg-surface-hover/30 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors">{project.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1.5">
                    <Clock size={12} /> {project.date}
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div className="flex-1 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                  <Graph type={project.tags[0].toLowerCase() as any} height={100} showBackground={false} showCalculated={false} showResidual={false} />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {project.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-surface border border-border rounded text-[10px] font-medium text-text-dim uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {project.progress < 100 ? (
                    <span className="text-xs text-cyan flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
                      In Progress
                    </span>
                  ) : (
                    <span className="text-xs text-primary flex items-center gap-1">
                      <FileText size={12} /> Report Ready
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
