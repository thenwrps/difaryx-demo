import React from 'react';
import { Graph } from '../../ui/Graph';
import { DemoProjectGraph } from '../../graphs/DemoProjectGraph';
import { MetricCard } from './MetricCard';
import { CompactWorkflowStepper } from './CompactWorkflowStepper';
import { EvidenceWorkspaceCard } from './EvidenceWorkspaceCard';
import type { AgentContext, EvidenceLayer } from '../../../utils/agentContext';
import type { AgentEvidenceWorkspace, TechniqueId } from '../../../utils/agentEvidenceModel';
import type { DemoFocusedEvidenceSource } from '../../../data/demoProjectRegistry';

interface ExecutionStep {
  number: number;
  title: string;
  description: string;
  tool: string;
  time: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

interface CenterColumnProps {
  agentContext: AgentContext;
  executionSteps: ExecutionStep[];
  progressPercent: number;
  evidenceWorkspace?: AgentEvidenceWorkspace;
  focusedEvidenceSource?: DemoFocusedEvidenceSource;
  onFocusedTechniqueChange?: (techniqueId: TechniqueId) => void;
}

function getSignalStatus(selectedLayer: EvidenceLayer | undefined, hasGraphData: boolean): string {
  if (hasGraphData) return 'Signal Loaded';
  if (selectedLayer?.status === 'available') return 'Evidence Context';
  if (selectedLayer?.status === 'required' || selectedLayer?.status === 'pending') return 'Pending Evidence';
  return 'No Spectrum Loaded';
}

function getStatusStyle(status: string): string {
  if (status === 'Signal Loaded' || status === 'Available' || status === 'Strong agreement') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (status === 'Evidence Context' || status === 'Partial agreement' || status === 'Limited') return 'bg-blue-50 border-blue-200 text-blue-700';
  if (status === 'Pending Evidence' || status === 'Required' || status === 'Limited agreement') return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-slate-50 border-slate-200 text-slate-600';
}

export function CenterColumn({
  agentContext,
  executionSteps,
  progressPercent,
  evidenceWorkspace,
  focusedEvidenceSource,
  onFocusedTechniqueChange,
}: CenterColumnProps) {
  const selectedLayer = agentContext.evidenceLayers.find(
    (l: EvidenceLayer) => l.technique === agentContext.selectedTechnique
  );
  const shouldShowGraph =
    selectedLayer?.hasGraphData === true &&
    Array.isArray(selectedLayer.graphData) &&
    selectedLayer.graphData.length > 0;

  const signalStatus = focusedEvidenceSource?.status || getSignalStatus(selectedLayer, shouldShowGraph);
  const statusStyle = getStatusStyle(signalStatus);
  const focusedTechniqueLabel = focusedEvidenceSource
    ? focusedEvidenceSource.techniqueId === 'multi'
      ? 'Multi-tech'
      : focusedEvidenceSource.techniqueId.toUpperCase()
    : evidenceWorkspace?.focusedTechnique.toUpperCase();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 bg-[#F7F9FC]">
      <div className="flex min-h-0 flex-col gap-3 rounded-lg border border-slate-200 bg-white shadow-sm p-4">
        {/* Title + Status */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {agentContext.workspaceTitle}
            </h2>
            <p className="mt-1 text-[11px] text-slate-600">
              {agentContext.workspaceDescription}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${statusStyle}`}>
            {signalStatus}
          </span>
        </div>

        {/* Compact workflow stepper */}
        <CompactWorkflowStepper steps={executionSteps} progressPercent={progressPercent} />

        {/* Focus line: shows which technique layer is focused */}
        {evidenceWorkspace && (
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-700">Focused evidence:</span>{' '}
              {focusedTechniqueLabel} &middot;{' '}
              {focusedEvidenceSource?.role ||
                evidenceWorkspace.techniques.find((t) => t.techniqueId === evidenceWorkspace.focusedTechnique)?.evidenceRole ||
                'primary-structural'}
            </div>
            <div className="flex gap-1">
              {evidenceWorkspace.techniques
                .filter((t) => t.selected)
                .map((tech) => (
                  <button
                    key={tech.techniqueId}
                    type="button"
                    onClick={() => onFocusedTechniqueChange?.(tech.techniqueId)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors ${
                      evidenceWorkspace.focusedTechnique === tech.techniqueId
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {tech.displayName}
                  </button>
                ))}
              {evidenceWorkspace.techniques.filter((t) => t.selected).length > 1 && (
                <button
                  type="button"
                  onClick={() => onFocusedTechniqueChange?.('multi')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors ${
                    evidenceWorkspace.focusedTechnique === 'multi'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  Multi
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main visualization: Graph or compact EvidenceWorkspaceCard */}
        {focusedEvidenceSource?.sourceType === 'graph' && focusedEvidenceSource.graphData ? (
          <div className="h-[clamp(300px,50vh,520px)] min-h-0 rounded-lg border border-slate-200 bg-white p-3">
            <DemoProjectGraph source={focusedEvidenceSource.graphData} height="100%" showLegend />
          </div>
        ) : focusedEvidenceSource?.sourceType === 'structured' && focusedEvidenceSource.structuredEvidence ? (
          <DemoProjectGraph source={focusedEvidenceSource.structuredEvidence} height="100%" />
        ) : focusedEvidenceSource?.sourceType === 'comparison' && focusedEvidenceSource.comparisonData ? (
          <div className="h-[clamp(300px,50vh,520px)] min-h-0 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Multi-tech Evidence Matrix</h3>
              <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                {focusedEvidenceSource.status}
              </span>
            </div>
            <div className="space-y-2">
              {focusedEvidenceSource.comparisonData.matrix.map((row) => (
                <div key={row.techniqueId} className="rounded border border-slate-200 bg-slate-50 p-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{row.techniqueLabel}</span>
                    <span className="font-semibold text-slate-600">{row.supportsClaim}</span>
                  </div>
                  <p className="mt-1 font-semibold text-slate-700">{row.role}</p>
                  <p className="mt-1 text-slate-600">{row.keyFinding}</p>
                  <p className="mt-1 text-amber-700">Limit: {row.limitation}</p>
                </div>
              ))}
            </div>
          </div>
        ) : shouldShowGraph ? (
          <div className="h-[clamp(300px,50vh,520px)] min-h-0 rounded-lg border border-slate-200 bg-white p-3">
            <Graph
              type={selectedLayer!.graphType}
              height="100%"
              externalData={selectedLayer!.graphData}
              peakMarkers={selectedLayer!.peakMarkers}
              baselineData={selectedLayer!.baselineData}
              showBackground={true}
            />
          </div>
        ) : (
          <EvidenceWorkspaceCard layer={selectedLayer} context={agentContext} />
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-2">
          {agentContext.metricCards.slice(0, 4).map((metric, index) => (
            <MetricCard
              key={index}
              label={metric.label}
              value={metric.value}
              sublabel={metric.sublabel}
              icon={['activity', 'chart', 'signal', 'trending'][index] as any}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
