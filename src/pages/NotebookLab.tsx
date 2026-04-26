import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Save, Paperclip, FileText, Share2, Plus, FlaskConical, BarChart3, Target, ArrowRight } from 'lucide-react';
import { AIInsightPanel } from '../components/ui/AIInsightPanel';
import { useScientificEngine, DEFAULT_CONFIG } from '../scientific/useScientificEngine';

export default function NotebookLab() {
  const engine = useScientificEngine(DEFAULT_CONFIG);
  const nb = engine.notebook;

  return (
    <DashboardLayout>
      <div className="flex-1 h-full flex overflow-hidden bg-background">
        
        {/* Left Panel: Navigation */}
        <div className="w-64 border-r border-border bg-surface flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-sm font-semibold">Experiments</h2>
            <Button variant="ghost" size="sm" className="px-2 h-7"><Plus size={14} /></Button>
          </div>
          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
            <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors bg-primary/10 text-primary border border-primary/20">
              Exp-042: CuFe2O4 Synthesis
            </button>
            <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors text-text-muted hover:bg-surface-hover hover:text-text-main border border-transparent">
              Exp-041: NiFe2O4 Control
            </button>
            <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors text-text-muted hover:bg-surface-hover hover:text-text-main border border-transparent">
              Exp-040: Fe3O4 Calibration
            </button>
          </div>
        </div>

        {/* Center Panel: Content */}
        <div className="flex-1 flex flex-col overflow-y-auto relative">
          <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur border-b border-border p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                <span>Created: {nb.date}</span>
                <span>•</span>
                <span>Auto-generated from analysis pipeline</span>
              </div>
              <h1 className="text-xl font-bold">{nb.title}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2"><Share2 size={14} /> Share</Button>
              <Button variant="primary" size="sm" className="gap-2"><Save size={14} /> Save Entry</Button>
            </div>
          </div>

          <div className="p-8 max-w-3xl w-full mx-auto space-y-8">
            {/* Summary */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Summary</h3>
              <p className="text-sm text-text-main leading-relaxed">
                {nb.summary}
              </p>
            </section>

            {/* Processing Steps */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><FlaskConical size={14} /> Processing Pipeline</span>
              </h3>
              <div className="bg-surface p-4 rounded-md border border-border text-sm font-mono text-text-dim space-y-2">
                {nb.processingSteps.map((step, i) => (
                  <p key={i}>{i + 1}. {step}</p>
                ))}
              </div>
            </section>

            {/* Peak Results */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><BarChart3 size={14} /> Peak Detection Results</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-md border border-border">
                  <div className="text-xs text-text-muted mb-1">Peaks Detected</div>
                  <div className="text-2xl font-bold text-primary">{nb.peakCount}</div>
                </div>
                <div className="bg-surface p-4 rounded-md border border-border">
                  <div className="text-xs text-text-muted mb-1">Peak Positions (2θ)</div>
                  <div className="text-sm font-mono text-text-main">
                    {nb.peakPositions.map((p) => `${p.toFixed(1)}°`).join(', ')}
                  </div>
                </div>
              </div>
            </section>

            {/* Phase Identification */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><Target size={14} /> Phase Identification</span>
              </h3>
              <div className="bg-surface p-4 rounded-md border border-border flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">{nb.bestPhase}</div>
                  <div className="text-xs text-text-muted mt-1">
                    Confidence: {nb.confidence} ({nb.confidenceScore}%)
                  </div>
                </div>
                <div className={`text-2xl font-bold ${
                  nb.confidenceScore >= 85 ? 'text-primary' :
                  nb.confidenceScore >= 70 ? 'text-cyan' :
                  nb.confidenceScore >= 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {nb.confidenceScore}%
                </div>
              </div>
            </section>

            {/* Characterization Data */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2 flex justify-between items-center">
                <span>Characterization Data</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-primary gap-1"><Paperclip size={12}/> Attach</Button>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3 flex items-start gap-3 hover:border-primary/50 cursor-pointer group bg-surface-hover/50">
                  <div className="bg-primary/20 text-primary p-2 rounded">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium group-hover:text-primary transition-colors">XRD_CuFe2O4_800C.raw</h4>
                    <p className="text-xs text-text-muted">Analyzed • {nb.confidence} Confidence</p>
                  </div>
                </Card>
                <Card className="p-3 flex items-start gap-3 hover:border-primary/50 cursor-pointer group bg-surface-hover/50">
                  <div className="bg-cyan/20 text-cyan p-2 rounded">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium group-hover:text-cyan transition-colors">XPS_Survey_CuFe2O4.vms</h4>
                    <p className="text-xs text-text-muted">Pending analysis</p>
                  </div>
                </Card>
              </div>
            </section>

            {/* Suggested Next Steps */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><ArrowRight size={14} /> Suggested Next Steps</span>
              </h3>
              <div className="space-y-2">
                {nb.suggestedNextSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-cyan p-2 bg-surface rounded-md border border-border hover:border-cyan/30 cursor-pointer transition-colors">
                    <div className="w-5 h-5 rounded-full bg-cyan/20 flex items-center justify-center text-[10px] font-bold text-cyan shrink-0">{i + 1}</div>
                    {step}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right Panel: AI Summary */}
        <div className="w-[360px] border-l border-border bg-background flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6">
             <div className="mb-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Experiment Synthesis</div>
            <AIInsightPanel result={engine.insight} />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
