import React from 'react';
import { Graph } from '../../ui/Graph';
import { MetricCard } from './MetricCard';
import { ExecutionStepItem } from './ExecutionStepItem';
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
  dataset,
  project,
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
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Card 1: XRD Phase Identification */}
      <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-6">
        <div className="flex items-center justify-between mb-4">
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

        {/* Graph - Always Visible */}
        <div className="h-[400px] rounded-lg border border-slate-800 bg-[#070B12] p-4 mb-4">
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
        <div className="grid grid-cols-4 gap-3">
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

      {/* Card 2: Execution Trace */}
      <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-6">
        <h2 className="text-lg font-bold text-white mb-4">Execution Trace</h2>

        {/* Vertical Step List */}
        <div className="space-y-3 mb-6">
          {executionSteps.map((step) => (
            <ExecutionStepItem key={step.number} {...step} />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Execution Progress
            </span>
            <span className="text-xs font-bold text-cyan-300">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
