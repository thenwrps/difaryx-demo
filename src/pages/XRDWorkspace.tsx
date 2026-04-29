import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Activity, ArrowRight, Database, FileText, SlidersHorizontal, Target } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AIInsightPanel } from '../components/ui/AIInsightPanel';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import {
  getAgentPath,
  getNotebookPath,
  getProject,
  getProjectInsight,
  makeBaselinePattern,
  makeXrdPattern,
} from '../data/demoProjects';

export default function XRDWorkspace() {
  const [searchParams] = useSearchParams();
  const project = getProject(searchParams.get('project'));
  const xrdData = makeXrdPattern(project);
  const baselineData = makeBaselinePattern(project);

  return (
    <DashboardLayout>
      <div className="flex-1 h-full flex overflow-hidden bg-background">
        <aside className="w-72 border-r border-border bg-surface flex flex-col shrink-0">
          <div className="p-5 border-b border-border">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Selected project</p>
            <h1 className="mt-2 text-lg font-bold text-text-main">{project.name}</h1>
            <p className="mt-1 text-xs text-text-muted">{project.material}</p>
          </div>

          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
            {[
              { label: 'Dataset', value: `${project.id}.xrd`, icon: Database },
              { label: 'Processing', value: 'Baseline corrected', icon: SlidersHorizontal },
              { label: 'Peak Analysis', value: `${project.xrdPeaks.length} peaks detected`, icon: Activity },
              { label: 'Match', value: `${project.confidence}% confidence`, icon: Target },
            ].map((item) => (
              <Card key={item.label} className="p-3 bg-background/60">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-main">{item.label}</div>
                    <div className="text-xs text-text-muted mt-1">{item.value}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="p-4 border-t border-border space-y-2">
            <Link
              to={getNotebookPath(project)}
              className="flex h-9 items-center justify-between rounded-md border border-border px-3 text-sm font-medium text-text-main hover:bg-surface-hover transition-colors"
            >
              Open Notebook <ArrowRight size={14} />
            </Link>
            <Link
              to={getAgentPath(project)}
              className="flex h-9 items-center justify-between rounded-md bg-primary text-white px-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Run Agent <ArrowRight size={14} />
            </Link>
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-6 border-b border-border bg-surface/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">XRD Workspace</p>
                <h2 className="mt-1 text-2xl font-bold text-text-main">{project.phase}</h2>
                <p className="mt-2 max-w-3xl text-sm text-text-muted">{project.summary}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface px-4 py-3 text-right">
                <div className="text-2xl font-bold text-cyan">{project.confidence}%</div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted">phase match</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
              <Card className="p-5 min-h-[430px]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-text-main">XRD Pattern</h3>
                    <p className="text-xs text-text-muted mt-1">Observed scan with detected peak markers</p>
                  </div>
                  <span className="text-xs text-text-muted">2theta window: 10-80 degrees</span>
                </div>
                <Graph
                  type="xrd"
                  height={360}
                  externalData={xrdData}
                  baselineData={baselineData}
                  peakMarkers={project.xrdPeaks.map((peak) => ({
                    position: peak.position,
                    intensity: peak.intensity,
                    label: peak.label,
                  }))}
                  showBackground
                  showCalculated={false}
                  showResidual={false}
                />
              </Card>

              <AIInsightPanel result={getProjectInsight(project)} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold">Peak Table</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase tracking-wider text-text-muted bg-surface-hover/40">
                      <tr>
                        <th className="text-left px-4 py-3">Peak</th>
                        <th className="text-left px-4 py-3">Position</th>
                        <th className="text-left px-4 py-3">Relative intensity</th>
                        <th className="text-left px-4 py-3">Assignment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.xrdPeaks.map((peak, index) => (
                        <tr key={`${peak.position}-${peak.label}`} className="border-t border-border">
                          <td className="px-4 py-3 text-text-muted">{index + 1}</td>
                          <td className="px-4 py-3 font-mono">{peak.position.toFixed(1)} degrees</td>
                          <td className="px-4 py-3">{peak.intensity}</td>
                          <td className="px-4 py-3 text-primary">{peak.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold">Processing Log</h3>
                <div className="mt-4 space-y-3">
                  {project.notebook.pipeline.map((step, index) => (
                    <div key={step} className="flex gap-3 text-sm">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-text-muted">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-md border border-primary/20 bg-primary/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">Recommended next step</div>
                  <p className="mt-2 text-sm text-text-main">{project.recommendations[0]}</p>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
