import React from 'react';
import { Graph } from '../ui/Graph';
import type {
  DemoGraphData,
  DemoGraphSource,
  DemoStructuredEvidence,
  TechniqueId,
} from '../../data/demoProjectRegistry';

/**
 * DemoProjectGraph — shared graph/evidence renderer.
 *
 * The same project must always show the same graph across Dashboard,
 * Analysis Workspace, Agent, and History. This component is the single
 * shared renderer for project graph/evidence sources.
 *
 * - If given a graph source with real data, renders `<Graph />` with
 *   external data and peak markers.
 * - If given a structured evidence source (no real graph data), renders
 *   a compact evidence card.
 */

interface DemoProjectGraphProps {
  source: DemoGraphSource;
  compact?: boolean;
  focusedTechnique?: TechniqueId;
  height?: string | number;
  showLegend?: boolean;
}

function isGraph(source: DemoGraphSource): source is DemoGraphData {
  return source.kind === 'graph';
}

function isStructured(source: DemoGraphSource): source is DemoStructuredEvidence {
  return source.kind === 'structured';
}

function techniqueLabel(id: TechniqueId): string {
  switch (id) {
    case 'xrd':
      return 'XRD';
    case 'xps':
      return 'XPS';
    case 'ftir':
      return 'FTIR';
    case 'raman':
      return 'Raman';
    case 'multi':
      return 'Multi-tech';
    default:
      return id;
  }
}

export function DemoProjectGraph({
  source,
  compact = false,
  height,
  showLegend = false,
}: DemoProjectGraphProps) {
  if (isGraph(source)) {
    const graphType = source.type === 'multi' ? 'xrd' : source.type;
    const peakMarkers = source.peaks?.map((p) => ({
      position: p.position,
      intensity: p.intensity,
      label: p.label,
    }));

    return (
      <Graph
        type={graphType as 'xrd' | 'xps' | 'ftir' | 'raman'}
        height={height ?? (compact ? '100%' : 400)}
        externalData={source.data}
        peakMarkers={peakMarkers}
        xAxisLabel={source.xLabel}
        yAxisLabel={source.yLabel}
        showBackground={!compact}
        showCalculated={!compact}
        showResidual={false}
        showLegend={showLegend}
      />
    );
  }

  if (isStructured(source)) {
    return (
      <div className="flex h-full min-h-[160px] flex-col rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {techniqueLabel(source.type)} · Structured evidence
          </div>
          <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700">
            No graph data
          </span>
        </div>
        <div className="text-sm font-semibold text-slate-900">{source.title}</div>
        <ul className="mt-2 flex-1 space-y-1 text-xs text-slate-700">
          {source.bulletEvidence.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-blue-500">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-800">Limitation:</span>{' '}
          {source.limitation}
        </div>
      </div>
    );
  }

  return null;
}

export default DemoProjectGraph;
