import React from 'react';
import { Graph } from '../../ui/Graph';
import { MetricCard } from './MetricCard';
import { CompactWorkflowStepper } from './CompactWorkflowStepper';
import type { DemoDataset, DemoPeak, DemoProject } from '../../../data/demoProjects';

type AgentContext = 'XRD' | 'XPS' | 'FTIR' | 'Raman';
type GraphType = 'xrd' | 'xps' | 'ftir' | 'raman';

interface DataPoint {
  x: number;
  y: number;
}

interface ExecutionStep {
  number: number;
  title: string;
  description: string;
  tool: string;
  time: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

interface MetricData {
  label: string;
  value: string;
  sublabel?: string;
}

interface CenterColumnProps {
  context: AgentContext;
  dataset: DemoDataset;
  project: DemoProject;
  graphData: DataPoint[];
  peakMarkers?: DemoPeak[];
  baselineData?: DataPoint[];
  executionSteps: ExecutionStep[];
  progressPercent: number;
  metrics: MetricData[];
}

export function CenterColumn({
  context,
  graphData,
  peakMarkers,
  baselineData,
  executionSteps,
  progressPercent,
  metrics,
}: CenterColumnProps) {
  const graphType: GraphType = context.toLowerCase() as GraphType;

  // Default metrics if none provided
  const displayMetrics = metrics.length > 0 ? metrics : [
    { label: 'Detected Peaks', value: '24 significant' },
    { label: '2θ Range', value: '10° - 80°' },
    { label: 'Dominant Peaks (2θ)', value: '35.5°, 43.2°', sublabel: 'highest intensity' },
    { label: 'Signal Quality', value: 'High, SNR 28.7 dB' },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
      {/* Card 1: XRD Phase Identification */}
      <div className="flex min-h-0 flex-col gap-3 rounded-lg border border-slate-800 bg-[#0F172A] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">
            {context === 'XRD' && 'XRD Phase Identification'}
            {context === 'XPS' && 'XPS Surface Chemistry'}
            {context === 'FTIR' && 'FTIR Bonding Analysis'}
            {context === 'Raman' && 'Raman Structural Fingerprint'}
          </h2>
          <span className="px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            Signal Loaded
          </span>
        </div>

        <CompactWorkflowStepper steps={executionSteps} progressPercent={progressPercent} />

        {/* Graph - Always Visible */}
        <div className="h-[clamp(300px,50vh,520px)] min-h-0 rounded-lg border border-slate-800 bg-[#070B12] p-3">
          <Graph
            type={graphType}
            height="100%"
            externalData={graphData}
            peakMarkers={peakMarkers}
            baselineData={baselineData}
            showBackground={true}
          />
        </div>

        {/* Four Metric Cards */}
        <div className="grid grid-cols-4 gap-2">
          {displayMetrics.slice(0, 4).map((metric, index) => (
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
