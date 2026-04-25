import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import { AIInsightPanel } from '../components/ui/AIInsightPanel';
import { Settings2, Download, Table2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

const MOCK_AI_RESULT = {
  primaryResult: "CuFe2O4 (spinel phase)",
  confidenceScore: 92,
  confidenceLevel: "Very High",
  interpretation: "The XRD pattern shows strong agreement with CuFe2O4 spinel structure. Peak positions and relative intensities align well with the reference data (JCPDS 25-0283).",
  keyEvidence: [
    "Peak at 35.4° matches (311) plane",
    "Consistent intensity ratios across major peaks",
    "No extra peaks indicating secondary phases"
  ],
  warnings: [
    "Minor peak shift at (400) may indicate slight strain or cationic redistribution"
  ],
  uncertainty: "Low",
  recommendedNextStep: [
    "Perform XPS to confirm surface oxidation states",
    "Measure VSM for magnetic properties"
  ]
};

const MOCK_PEAKS = [
  { hkl: '(220)', pos: '29.9', intensity: '35', d: '2.98' },
  { hkl: '(311)', pos: '35.4', intensity: '100', d: '2.53' },
  { hkl: '(400)', pos: '43.1', intensity: '22', d: '2.09' },
  { hkl: '(511)', pos: '57.0', intensity: '31', d: '1.61' },
  { hkl: '(440)', pos: '62.6', intensity: '42', d: '1.48' },
];

export default function XrdWorkspace() {
  const [activeTab, setActiveTab] = useState<'graph' | 'table'>('graph');

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
            <div className="space-y-3">
              <label className="text-xs font-medium text-text-muted">Background Correction</label>
              <select className="w-full bg-background border border-border rounded text-sm px-3 py-2 text-text-main focus:outline-none focus:border-primary">
                <option>SNIP Algorithm</option>
                <option>Polynomial (Degree 3)</option>
                <option>Linear</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-medium text-text-muted">Smoothing</label>
              <select className="w-full bg-background border border-border rounded text-sm px-3 py-2 text-text-main focus:outline-none focus:border-primary">
                <option>Savitzky-Golay (Window 11)</option>
                <option>Moving Average</option>
                <option>None</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-text-main">
                <input type="checkbox" defaultChecked className="rounded border-border bg-background text-primary focus:ring-primary accent-primary" />
                Kα2 Stripping (Rachinger)
              </label>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-text-main">
                <input type="checkbox" defaultChecked className="rounded border-border bg-background text-primary focus:ring-primary accent-primary" />
                Intensity Normalization
              </label>
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
                  <div className="absolute top-6 right-8 flex gap-4 text-xs">
                    <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#06B6D4]"></div> Observed</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#1D4ED8]"></div> Calculated</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-gray-500 border-t border-dashed border-gray-500"></div> Background</span>
                  </div>
                  <Graph type="xrd" height="100%" showBackground showCalculated showResidual={false} />
                </div>
                <div className="h-48 border border-border rounded-xl bg-surface/20 p-4 shrink-0">
                  <h4 className="text-xs text-text-muted font-medium mb-2 pl-4">Residual Plot</h4>
                  <Graph type="xrd" height="100%" showBackground={false} showCalculated={false} showResidual={true} />
                </div>
              </>
            ) : (
              <Card className="flex-1 bg-surface-hover/30">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-text-muted uppercase bg-surface border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-medium">hkl</th>
                      <th className="px-6 py-3 font-medium">2θ Position (°)</th>
                      <th className="px-6 py-3 font-medium">Rel. Intensity (%)</th>
                      <th className="px-6 py-3 font-medium">d-spacing (Å)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PEAKS.map((peak, i) => (
                      <tr key={i} className="border-b border-border hover:bg-surface-hover/50">
                        <td className="px-6 py-4 font-mono text-cyan">{peak.hkl}</td>
                        <td className="px-6 py-4 font-mono">{peak.pos}</td>
                        <td className="px-6 py-4 font-mono">{peak.intensity}</td>
                        <td className="px-6 py-4 font-mono">{peak.d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>

        {/* Right Panel: AI Insight */}
        <div className="w-[360px] border-l border-border bg-background flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6">
            <AIInsightPanel result={MOCK_AI_RESULT} />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
