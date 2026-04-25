import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Graph } from '../components/ui/Graph';
import { AIInsightPanel } from '../components/ui/AIInsightPanel';

const MOCK_AI_RESULT = {
  primaryResult: "Consistent with CuFe2O4",
  confidenceScore: 88,
  confidenceLevel: "High",
  interpretation: "Multi-technique analysis confirms the spinel structure (XRD) with expected surface oxidation states (XPS) and metal-oxygen bonds (FTIR/Raman).",
  keyEvidence: [
    "XPS: Cu 2p3/2 peak at 933.2 eV confirms Cu2+ state",
    "FTIR: Fe-O stretching vibrations observed at 580 cm⁻¹",
    "Raman: A1g mode present at 685 cm⁻¹ characteristic of spinel spinels"
  ],
  warnings: [
    "Surface adventitious carbon detected in XPS (C 1s at 284.8 eV) - standard calibration applied"
  ],
  uncertainty: "Low",
  recommendedNextStep: [
    "Quantify Cu/Fe ratio from XPS survey scan"
  ]
};

export default function MultiTechWorkspace() {
  const [activeTech, setActiveTech] = useState<'xps' | 'ftir' | 'raman'>('xps');

  return (
    <DashboardLayout>
      <div className="flex-1 h-full flex overflow-hidden">
        
        {/* Left Panel: Technique Selector & Controls */}
        <div className="w-64 border-r border-border bg-surface flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold">Techniques</h2>
          </div>
          <div className="p-2 space-y-1 flex-1">
            {['xps', 'ftir', 'raman'].map((tech) => (
              <button
                key={tech}
                onClick={() => setActiveTech(tech as any)}
                className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors uppercase ${
                  activeTech === tech 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-text-muted hover:bg-surface-hover hover:text-text-main border border-transparent'
                }`}
              >
                {tech} Analysis
              </button>
            ))}
          </div>
          
          <div className="p-4 border-t border-border bg-surface-hover/30">
             <div className="space-y-3">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Calibration</label>
              {activeTech === 'xps' && (
                <div className="text-sm text-text-main p-2 bg-background border border-border rounded">
                  C 1s Ref: 284.8 eV
                </div>
              )}
              {activeTech === 'ftir' && (
                <div className="text-sm text-text-main p-2 bg-background border border-border rounded">
                  Baseline: KBr Pellet
                </div>
              )}
              {activeTech === 'raman' && (
                <div className="text-sm text-text-main p-2 bg-background border border-border rounded">
                  Laser: 532 nm
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Panel: Main Graph */}
        <div className="flex-1 flex flex-col bg-background p-6 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-xl font-bold uppercase tracking-wide">{activeTech} Spectrum</h2>
            <p className="text-sm text-text-muted mt-1">Sample: CuFe2O4</p>
          </div>
          <div className="flex-1 border border-border rounded-xl bg-surface/20 p-6 min-h-[500px]">
            <Graph type={activeTech} height="100%" showBackground showCalculated showResidual />
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
