import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BarChart3, Database, Download, Layers3, Sparkles } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AIInsightPanel } from '../components/ui/AIInsightPanel';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import {
  DEFAULT_PROJECT_ID,
  Technique,
  calculateDemoConfidence,
  getAgentPath,
  getDatasetsByTechnique,
  getNotebookPath,
  getProject,
  getProjectDatasets,
  getProjectInsight,
  getSavedEvidence,
  getTechniqueEvidence,
  getWorkspaceRoute,
} from '../data/demoProjects';
import { DemoExportFormat, exportDemoArtifact } from '../utils/demoExport';

const techniqueClaims: Record<Technique, string> = {
  XRD: 'Bulk ferrite phase reflections and reference peak match.',
  XPS: 'Cu 2p3/2 and Fe 2p envelopes support expected oxidation states.',
  FTIR: 'Metal-oxygen and support bands reinforce bonding assignment.',
  Raman: 'A1g/T2g vibrational modes support spinel structure.',
};

const hubControls: Record<Technique, string[]> = {
  XRD: ['Baseline Correct', 'Smooth', 'Normalize', 'Peak Detection', 'Match Phase'],
  XPS: ['Baseline', 'Background/Subtract', 'Peak Fit', 'Chemical State Assignment'],
  FTIR: ['Baseline Adjust', 'Smooth', 'Normalize', 'Peak Pick'],
  Raman: ['Baseline', 'Smooth', 'Normalize', 'Mode Assignment'],
};

type HubTechniqueState = {
  status: string;
  confidence: number;
  labels: string[];
  log: string[];
  offset: number;
  slope: number;
};

const initialHubState: Record<Technique, HubTechniqueState> = {
  XRD: { status: 'Ready', confidence: 86, labels: [], log: ['XRD trace ready.'], offset: 0, slope: 0 },
  XPS: { status: 'Ready', confidence: 82, labels: [], log: ['XPS survey ready.'], offset: 0, slope: 0 },
  FTIR: { status: 'Ready', confidence: 80, labels: [], log: ['FTIR spectrum ready.'], offset: 0, slope: 0 },
  Raman: { status: 'Ready', confidence: 84, labels: [], log: ['Raman spectrum ready.'], offset: 0, slope: 0 },
};

export default function MultiTechWorkspace() {
  const [searchParams] = useSearchParams();
  const project = getProject(searchParams.get('project') ?? DEFAULT_PROJECT_ID);
  const [feedback, setFeedback] = useState('');
  const [hubState, setHubState] = useState<Record<Technique, HubTechniqueState>>(initialHubState);
  const datasets = useMemo(() => getProjectDatasets(project.id), [project.id]);
  const savedEvidence = getSavedEvidence(project.id);
  const combinedConfidence = calculateDemoConfidence(project, project.techniques);
  const fusionEvidence = getTechniqueEvidence(project, project.techniques);
  const insight = {
    ...getProjectInsight(project),
    primaryResult: `${project.name} multi-tech fusion`,
    confidenceScore: combinedConfidence,
    confidenceLevel: combinedConfidence >= 90 ? 'High' : 'Moderate',
    interpretation: `${project.name} is connected through a multi-tech hub. Open each technique workspace for processing, then return here to review fused evidence and saved datasets.`,
    keyEvidence: [...fusionEvidence, ...savedEvidence.map((item) => item.claim)].slice(0, 6),
    warnings: project.status === 'In Progress' ? ['Fusion confidence can improve after saving evidence from each technique workspace.'] : [],
    recommendedNextStep: ['Open a technique workspace and save evidence.', 'Run Agent with all selected datasets.'],
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 1800);
  };

  const applyHubControl = (technique: Technique, control: string) => {
    setHubState((current) => {
      const previous = current[technique];
      const alreadyApplied = previous.labels.includes(control);
      const labels = alreadyApplied ? previous.labels : [...previous.labels, control];
      const confidenceBump = control.includes('Assignment') || control.includes('Match') ? 4 : control.includes('Peak') ? 3 : 2;

      return {
        ...current,
        [technique]: {
          ...previous,
          labels,
          status: control,
          confidence: Math.min(98, previous.confidence + (alreadyApplied ? 0 : confidenceBump)),
          log: [`${control} applied to ${technique}.`, ...previous.log].slice(0, 5),
        },
      };
    });
    showFeedback(`${technique}: ${control} applied`);
  };

  const updateFtirAdjustment = (field: 'offset' | 'slope', value: number) => {
    setHubState((current) => ({
      ...current,
      FTIR: {
        ...current.FTIR,
        [field]: value,
        status: 'Baseline Adjust',
        labels: current.FTIR.labels.includes('Baseline Adjust') ? current.FTIR.labels : [...current.FTIR.labels, 'Baseline Adjust'],
        confidence: Math.min(98, current.FTIR.confidence + 1),
        log: [`Baseline ${field} set to ${value}.`, ...current.FTIR.log].slice(0, 5),
      },
    }));
  };

  const exportFusion = (format: DemoExportFormat) => {
    exportDemoArtifact(format, {
      filenameBase: `${project.id}-multi-tech-fusion`,
      title: `${project.name} Multi-Tech Fusion`,
      sections: [
        { heading: 'Project', lines: [project.summary, `Combined confidence: ${combinedConfidence}%`] },
        { heading: 'Evidence', lines: fusionEvidence },
        {
          heading: 'Technique processing state',
          lines: project.techniques.map((technique) => {
            const state = hubState[technique];
            return `${technique}: ${state.status}, ${state.confidence}% confidence, ${state.labels.join(', ') || 'raw preview'}`;
          }),
        },
      ],
      csvRows: project.techniques.map((technique) => ({
        project: project.name,
        technique,
        status: hubState[technique].status,
        confidence: hubState[technique].confidence,
        labels: hubState[technique].labels.join('; '),
      })),
    });
    showFeedback(`${format.toUpperCase()} export downloaded`);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Multi-Tech Hub</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">{project.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.techniques.map((technique) => (
                <span key={technique} className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-semibold text-text-muted">
                  {technique}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {feedback && (
              <span className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                {feedback}
              </span>
            )}
            <Link
              to={getAgentPath(project)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <Sparkles size={16} /> Run Agent
            </Link>
            <Link
              to={getNotebookPath(project)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-text-main hover:bg-surface-hover transition-colors"
            >
              Open Notebook <ArrowRight size={16} />
            </Link>
            <div className="flex flex-wrap gap-1">
              {(['pdf', 'docx', 'csv', 'txt', 'png'] as DemoExportFormat[]).map((format) => (
                <Button key={format} variant="outline" size="sm" className="gap-1" onClick={() => exportFusion(format)}>
                  <Download size={13} /> {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {project.techniques.map((technique) => {
                const techniqueDatasets = getDatasetsByTechnique(project.id, technique);
                const dataset = techniqueDatasets[0];
                const evidenceCount = getSavedEvidence(project.id, technique).length;
                const state = hubState[technique];

                return (
                  <Card key={technique} className="overflow-hidden">
                    <div className="border-b border-border bg-surface-hover/40 p-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold">{technique}</h2>
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {state.status}
                        </span>
                      </div>
                      <p className="mt-2 min-h-[42px] text-xs text-text-muted">{techniqueClaims[technique]}</p>
                    </div>
                    <div className="p-4">
                      <div className="h-36 rounded-md border border-border bg-background p-2">
                        <Graph
                          type={technique.toLowerCase() as 'xrd' | 'xps' | 'ftir' | 'raman'}
                          height="100%"
                          externalData={dataset?.dataPoints}
                          showCalculated={false}
                          showResidual={false}
                        />
                      </div>
                      <div className="mt-3 text-xs text-text-muted">
                        <div className="font-semibold text-text-main">{dataset?.fileName ?? `${technique} demo spectrum`}</div>
                        <div>{techniqueDatasets.length} dataset{techniqueDatasets.length === 1 ? '' : 's'} available · {state.confidence}% confidence</div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {state.labels.length === 0 ? (
                          <span className="rounded bg-background px-2 py-1 text-[10px] font-medium text-text-muted">raw preview</span>
                        ) : (
                          state.labels.map((label) => (
                            <span key={label} className="rounded bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                              {label}
                            </span>
                          ))
                        )}
                      </div>
                      <div className="mt-4 rounded-md border border-border bg-background p-2">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Demo processing controls</p>
                        <div className="flex flex-wrap gap-1.5">
                          {hubControls[technique].map((control) => (
                            <Button
                              key={control}
                              variant={state.labels.includes(control) ? 'primary' : 'outline'}
                              size="sm"
                              className="h-7 px-2 text-[10px]"
                              onClick={() => applyHubControl(technique, control)}
                            >
                              {control}
                            </Button>
                          ))}
                        </div>
                        {technique === 'FTIR' && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <label className="text-[10px] font-medium text-text-muted">
                              Offset
                              <input
                                type="range"
                                min="-12"
                                max="12"
                                value={state.offset}
                                onChange={(event) => updateFtirAdjustment('offset', Number(event.target.value))}
                                className="mt-1 w-full"
                              />
                            </label>
                            <label className="text-[10px] font-medium text-text-muted">
                              Slope
                              <input
                                type="range"
                                min="-8"
                                max="8"
                                value={state.slope}
                                onChange={(event) => updateFtirAdjustment('slope', Number(event.target.value))}
                                className="mt-1 w-full"
                              />
                            </label>
                          </div>
                        )}
                        <div className="mt-3 space-y-1">
                          {state.log.slice(0, 2).map((entry) => (
                            <div key={entry} className="truncate rounded border border-border bg-surface px-2 py-1 text-[10px] text-text-muted">
                              {entry}
                            </div>
                          ))}
                        </div>
                      </div>
                      {evidenceCount > 0 && (
                        <p className="mt-2 text-[10px] font-semibold text-primary">{evidenceCount} saved evidence item{evidenceCount === 1 ? '' : 's'}</p>
                      )}
                      <Link
                        to={getWorkspaceRoute(project, technique, dataset?.id)}
                        className="mt-4 inline-flex h-9 w-full items-center justify-between rounded-md border border-border px-3 text-sm font-semibold text-text-main hover:border-primary/40 hover:bg-surface-hover transition-colors"
                      >
                        Open {technique} Workspace <ArrowRight size={14} />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <Layers3 size={16} className="text-primary" />
                  <h2 className="text-sm font-semibold">Evidence fusion summary</h2>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {fusionEvidence.map((item) => (
                    <div key={item} className="rounded-md border border-border bg-background p-3 text-sm text-text-muted">
                      {item}
                    </div>
                  ))}
                  {savedEvidence.map((item) => (
                    <div key={item.id} className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-text-muted">
                      {item.claim}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary" />
                  <h2 className="text-sm font-semibold">Combined confidence</h2>
                </div>
                <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-5 text-center">
                  <div className="text-4xl font-bold text-cyan">{combinedConfidence}%</div>
                  <p className="mt-2 text-sm text-text-muted">Fused from {project.techniques.join(' + ')}</p>
                </div>
                <p className="mt-4 text-sm text-text-muted">{project.recommendations[0]}</p>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-primary" />
                  <h2 className="text-sm font-semibold">Selected datasets</h2>
                </div>
              </div>
              <div className="divide-y divide-border">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="grid grid-cols-1 gap-3 p-4 text-sm md:grid-cols-[0.8fr_1fr_0.8fr_auto] md:items-center">
                    <span className="font-semibold text-text-main">{dataset.technique}</span>
                    <span className="text-text-muted">{dataset.fileName}</span>
                    <span className="text-text-muted">{dataset.sampleName}</span>
                    <Link
                      to={getWorkspaceRoute(project, dataset.technique, dataset.id)}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-semibold text-text-main hover:bg-surface-hover transition-colors"
                    >
                      Open Spectrum
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <AIInsightPanel result={insight} />
        </div>
      </div>
    </DashboardLayout>
  );
}
