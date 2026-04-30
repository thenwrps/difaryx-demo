import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  FlaskConical,
  Layers3,
  Microscope,
  Search,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import { XRD_DEMO_DATASETS, getXrdDemoDataset } from '../data/xrdDemoDatasets';
import { getAgentPath, getNotebookPath, getProject } from '../data/demoProjects';
import {
  runXrdPhaseIdentificationAgent,
  xrdAgentToolSchemas,
} from '../agents/xrdAgent';
import type { XrdAgentResult, XrdDetectedPeak } from '../agents/xrdAgent';

function statusClass(status: 'complete' | 'warning' | 'error') {
  if (status === 'error') return 'border-red-500/30 bg-red-500/10 text-red-700';
  if (status === 'warning') return 'border-amber-500/30 bg-amber-500/10 text-amber-700';
  return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700';
}

function confidenceClass(level: string) {
  if (level === 'high') return 'text-emerald-600';
  if (level === 'medium') return 'text-amber-600';
  return 'text-red-600';
}

function findPrimaryAssignment(result: XrdAgentResult, peak: XrdDetectedPeak) {
  const primary = result.conflicts.primaryCandidate;
  const match = primary?.matches.find((item) => item.observedPeak.id === peak.id);
  if (!match || !primary) return peak.classification === 'broad' ? 'Broad feature' : 'Unexplained';
  return `${primary.phase.name} ${match.referencePeak.hkl}`;
}

function topCandidateRows(result: XrdAgentResult) {
  return result.candidates.slice(0, 4).map((candidate) => ({
    id: candidate.phase.id,
    phase: candidate.phase.name,
    score: `${(candidate.score * 100).toFixed(1)}%`,
    matched: `${candidate.matches.length}/${candidate.phase.peaks.length}`,
    penalty: candidate.unexplainedStrongPeakPenalty.toFixed(2),
  }));
}

export default function XRDWorkspace() {
  const [searchParams] = useSearchParams();
  const project = getProject(searchParams.get('project'));
  const datasetFromQuery = getXrdDemoDataset(searchParams.get('dataset') ?? searchParams.get('xrdDataset'));
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasetFromQuery.id);

  useEffect(() => {
    setSelectedDatasetId(datasetFromQuery.id);
  }, [datasetFromQuery.id]);

  const selectedDataset = getXrdDemoDataset(selectedDatasetId);
  const agentResult = useMemo(
    () =>
      runXrdPhaseIdentificationAgent({
        datasetId: selectedDataset.id,
        sampleName: selectedDataset.sampleName,
        sourceLabel: selectedDataset.fileName,
        dataPoints: selectedDataset.dataPoints,
      }),
    [selectedDataset],
  );
  const primaryCandidate = agentResult.conflicts.primaryCandidate;
  const graphPeakMarkers = agentResult.detectedPeaks.map((peak) => ({
    position: peak.position,
    intensity: peak.intensity,
    label: peak.label,
  }));
  const candidateRows = topCandidateRows(agentResult);

  return (
    <DashboardLayout>
      <div className="flex-1 h-full flex overflow-hidden bg-background">
        <aside className="w-72 border-r border-border bg-surface flex flex-col shrink-0">
          <div className="p-5 border-b border-border">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">XRD project</p>
            <h1 className="mt-2 text-lg font-bold text-text-main">{project.name}</h1>
            <p className="mt-1 text-xs text-text-muted">{project.material}</p>
          </div>

          <div className="p-4 border-b border-border">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted" htmlFor="xrd-dataset-select">
              Dataset
            </label>
            <select
              id="xrd-dataset-select"
              value={selectedDatasetId}
              onChange={(event) => setSelectedDatasetId(event.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-text-main focus:outline-none focus:border-primary"
            >
              {XRD_DEMO_DATASETS.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.label}
                </option>
              ))}
            </select>
            <p className="mt-3 text-xs leading-5 text-text-muted">{selectedDataset.description}</p>
          </div>

          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
            {[
              { label: 'Input file', value: selectedDataset.fileName, icon: Database },
              { label: 'Observed points', value: agentResult.validation.pointCount.toString(), icon: Activity },
              { label: 'Detected peaks', value: `${agentResult.detectedPeaks.length} features`, icon: Search },
              {
                label: 'Workflow tools',
                value: `${xrdAgentToolSchemas.length} executed`,
                icon: FlaskConical,
              },
            ].map((item) => (
              <Card key={item.label} className="p-3 bg-background/60">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <item.icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-text-main">{item.label}</div>
                    <div className="text-xs text-text-muted mt-1 break-words">{item.value}</div>
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
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">XRD phase identification</p>
                <h2 className="mt-1 text-2xl font-bold text-text-main">{agentResult.interpretation.primaryPhase}</h2>
                <p className="mt-2 max-w-3xl text-sm text-text-muted">{agentResult.interpretation.summary}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface px-4 py-3 text-right">
                <div className={`text-2xl font-bold ${confidenceClass(agentResult.interpretation.confidenceLevel)}`}>
                  {agentResult.interpretation.confidenceScore.toFixed(1)}%
                </div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted">
                  {agentResult.interpretation.confidenceLevel} confidence
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
              <Card className="p-5 min-h-[470px] min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-text-main">XRD Pattern</h3>
                    <p className="text-xs text-text-muted mt-1">Observed scan with agent-detected peak markers</p>
                  </div>
                  <span className="text-xs text-text-muted">2theta window: 10-80</span>
                </div>
                <div className="h-[400px] min-h-[400px] w-full min-w-0">
                  <Graph
                    type="xrd"
                    height="100%"
                    externalData={selectedDataset.dataPoints}
                    baselineData={agentResult.baselineData}
                    peakMarkers={graphPeakMarkers}
                    showBackground
                    showCalculated={false}
                    showResidual={false}
                  />
                </div>
              </Card>

              <aside className="space-y-6">
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" />
                      <h3 className="text-sm font-semibold">Agent Decision</h3>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusClass(agentResult.interpretation.confidenceLevel === 'low' ? 'warning' : 'complete')}`}>
                      {agentResult.interpretation.confidenceLevel}
                    </span>
                  </div>

                  <div className="mt-4 rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Primary phase</p>
                    <p className="mt-1 text-lg font-bold text-text-main">{agentResult.interpretation.primaryPhase}</p>
                    <p className="mt-2 text-sm text-text-muted">{agentResult.interpretation.decision}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-md border border-border bg-background p-2">
                      <div className="font-bold text-text-main">{primaryCandidate?.matches.length ?? 0}</div>
                      <div className="text-text-muted">matched</div>
                    </div>
                    <div className="rounded-md border border-border bg-background p-2">
                      <div className="font-bold text-text-main">{agentResult.conflicts.missingStrongPeaks.length}</div>
                      <div className="text-text-muted">missing</div>
                    </div>
                    <div className="rounded-md border border-border bg-background p-2">
                      <div className="font-bold text-text-main">{agentResult.conflicts.unexplainedPeaks.length}</div>
                      <div className="text-text-muted">unexplained</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Evidence</p>
                    {agentResult.interpretation.evidence.slice(0, 4).map((item) => (
                      <div key={item} className="rounded-md border border-border bg-background px-3 py-2 text-xs leading-5 text-text-main">
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Conflicts</p>
                    {agentResult.interpretation.conflicts.slice(0, 5).map((item) => (
                      <div key={item} className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center gap-2">
                    <Layers3 size={16} className="text-primary" />
                    <h3 className="text-sm font-semibold">Candidate Scores</h3>
                  </div>
                  <div className="mt-4 space-y-2">
                    {candidateRows.map((candidate) => (
                      <div key={candidate.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-border bg-background px-3 py-2 text-xs">
                        <div>
                          <div className="font-semibold text-text-main">{candidate.phase}</div>
                          <div className="mt-1 text-text-muted">matched {candidate.matched} | unexplained penalty {candidate.penalty}</div>
                        </div>
                        <div className="font-bold text-text-main">{candidate.score}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </aside>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold">Detected Peak Table</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase tracking-wider text-text-muted bg-surface-hover/40">
                      <tr>
                        <th className="text-left px-4 py-3">Peak</th>
                        <th className="text-left px-4 py-3">Position</th>
                        <th className="text-left px-4 py-3">Intensity</th>
                        <th className="text-left px-4 py-3">FWHM</th>
                        <th className="text-left px-4 py-3">d-spacing</th>
                        <th className="text-left px-4 py-3">Assignment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentResult.detectedPeaks.map((peak, index) => (
                        <tr key={peak.id} className="border-t border-border">
                          <td className="px-4 py-3 text-text-muted">{index + 1}</td>
                          <td className="px-4 py-3 font-mono">{peak.position.toFixed(2)}</td>
                          <td className="px-4 py-3">{peak.intensity.toFixed(1)}</td>
                          <td className="px-4 py-3 font-mono">{peak.fwhm.toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono">{peak.dSpacing.toFixed(3)} A</td>
                          <td className="px-4 py-3 text-primary">{findPrimaryAssignment(agentResult, peak)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <Microscope size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold">Scientific Caveats</h3>
                </div>
                <div className="mt-4 space-y-2">
                  {agentResult.interpretation.caveats.map((item) => (
                    <div key={item} className="flex gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs leading-5 text-text-muted">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                  {agentResult.conflicts.possibleImpurities.length > 0 && (
                    <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-5 text-text-main">
                      Possible impurity phases are flagged only when they explain observed peaks not already explained by the primary candidate.
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={16} className="text-primary" />
                <h3 className="text-sm font-semibold">Agent Execution Log</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {agentResult.executionLog.map((entry, index) => (
                  <div key={entry.step} className="rounded-md border border-border bg-background px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="truncate text-sm font-semibold text-text-main">{entry.step}</span>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusClass(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-text-muted">{entry.summary}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
