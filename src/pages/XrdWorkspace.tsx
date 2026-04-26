import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import { AIInsightPanel } from '../components/ui/AIInsightPanel';
import { Settings2, Download, Table2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useScientificEngine, DEFAULT_CONFIG } from '../scientific/useScientificEngine';
import type { ProcessingConfig } from '../scientific/types';

export default function XrdWorkspace() {
  const [activeTab, setActiveTab] = useState<'graph' | 'table'>('graph');
  const [config, setConfig] = useState<ProcessingConfig>({ ...DEFAULT_CONFIG });

  // ── Scientific engine — all computation is derived from config ──
  const engine = useScientificEngine(config);

  // ── Config handlers ────────────────────────────────────────────────
  const updateConfig = (patch: Partial<ProcessingConfig>) =>
    setConfig((prev) => ({ ...prev, ...patch }));

  return (
    <DashboardLayout>
      <div className="flex-1 h-full flex overflow-hidden">
        
        {/* Left Panel: Controls */}
        <div className="w-64 border-r border-border bg-surface flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Settings2 size={16} /> Pre-processing
            </h2>
          </div>
          <div className="p-4 space-y-6 flex-1">
            {/* Baseline correction */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-text-muted">Background Correction</label>
              <select
                value={config.baselineCorrection ? 'snip' : 'none'}
                onChange={(e) =>
                  updateConfig({
                    baselineCorrection: e.target.value !== 'none',
                    baselineIterations: e.target.value === 'poly' ? 10 : 20,
                  })
                }
                className="w-full bg-background border border-border rounded text-sm px-3 py-2 text-text-main focus:outline-none focus:border-primary"
              >
                <option value="snip">SNIP Algorithm</option>
                <option value="poly">Polynomial (Degree 3)</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Smoothing */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-text-muted">Smoothing</label>
              <select
                value={config.smoothing ? `ma-${config.smoothingWindow}` : 'none'}
                onChange={(e) => {
                  if (e.target.value === 'none') {
                    updateConfig({ smoothing: false });
                  } else {
                    const window = parseInt(e.target.value.split('-')[1], 10);
                    updateConfig({ smoothing: true, smoothingWindow: window });
                  }
                }}
                className="w-full bg-background border border-border rounded text-sm px-3 py-2 text-text-main focus:outline-none focus:border-primary"
              >
                <option value="ma-5">Moving Average (Window 5)</option>
                <option value="ma-11">Moving Average (Window 11)</option>
                <option value="ma-21">Moving Average (Window 21)</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Normalization */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-text-main">
                <input
                  type="checkbox"
                  checked={config.normalization}
                  onChange={(e) => updateConfig({ normalization: e.target.checked })}
                  className="rounded border-border bg-background text-primary focus:ring-primary accent-primary"
                />
                Intensity Normalization
              </label>
            </div>

            {/* Pipeline status */}
            <div className="pt-4 border-t border-border space-y-2">
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Pipeline Status</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {engine.peaks.length} peaks detected
                </div>
                <div className="flex items-center gap-2 text-cyan">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan" />
                  {engine.bestMatch ? `${engine.bestMatch.matchedCount}/${engine.bestMatch.totalRefPeaks} ref peaks matched` : 'No match'}
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                  Confidence: {engine.confidence.label} ({engine.confidence.score}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel: Main Graph */}
        <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
          <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-surface/30">
            <div className="flex bg-surface rounded-md p-1 border border-border">
              <button 
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${activeTab === 'graph' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
                onClick={() => setActiveTab('graph')}
              >
                Spectrum View
              </button>
              <button 
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors flex items-center gap-1 ${activeTab === 'table' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
                onClick={() => setActiveTab('table')}
              >
                <Table2 size={14} /> Peak Table
              </button>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              <Download size={14} /> Export Data
            </Button>
          </div>

          <div className="flex-1 p-6 flex flex-col overflow-y-auto">
            {activeTab === 'graph' ? (
              <>
                <div className="flex-1 min-h-[400px] border border-border rounded-xl bg-surface/20 p-4 mb-4 relative">
                  {/* Legend */}
                  <div className="absolute top-6 right-8 flex gap-4 text-xs z-10">
                    <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#2563eb]"></div> Processed</span>
                    {config.baselineCorrection && (
                      <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-gray-500 border-t border-dashed border-gray-500"></div> Baseline</span>
                    )}
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> Peaks</span>
                  </div>
                  <Graph
                    type="xrd"
                    height="100%"
                    showBackground={config.baselineCorrection}
                    showCalculated={false}
                    showResidual={false}
                    externalData={engine.processed.output}
                    baselineData={config.baselineCorrection ? engine.processed.baseline : undefined}
                    peakMarkers={engine.peaks.map((p) => ({
                      position: p.position,
                      intensity: p.intensity,
                    }))}
                  />
                </div>
              </>
            ) : (
              <Card className="flex-1 bg-surface-hover/30">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-text-muted uppercase bg-surface border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-medium">#</th>
                      <th className="px-6 py-3 font-medium">2θ Position (°)</th>
                      <th className="px-6 py-3 font-medium">Intensity</th>
                      <th className="px-6 py-3 font-medium">FWHM (°)</th>
                      <th className="px-6 py-3 font-medium">Area</th>
                      <th className="px-6 py-3 font-medium">Matched Phase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engine.peaks.map((peak, i) => {
                      // Find if this peak matched any reference
                      const matchInfo = engine.bestMatch?.details.find(
                        (d) => d.matchedPeak && Math.abs(d.matchedPeak.position - peak.position) < 0.3
                      );
                      return (
                        <tr key={i} className="border-b border-border hover:bg-surface-hover/50">
                          <td className="px-6 py-4 font-mono text-text-muted">{i + 1}</td>
                          <td className="px-6 py-4 font-mono text-cyan">{peak.position.toFixed(2)}</td>
                          <td className="px-6 py-4 font-mono">{peak.intensity.toFixed(1)}</td>
                          <td className="px-6 py-4 font-mono">{peak.fwhm.toFixed(3)}</td>
                          <td className="px-6 py-4 font-mono">{peak.area.toFixed(1)}</td>
                          <td className="px-6 py-4 font-mono text-primary">
                            {matchInfo ? `${matchInfo.referencePeak.hkl} (Δ=${matchInfo.delta?.toFixed(3)}°)` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>

        {/* Right Panel: AI Insight */}
        <div className="w-[360px] border-l border-border bg-background flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6">
            <AIInsightPanel result={engine.insight} />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
