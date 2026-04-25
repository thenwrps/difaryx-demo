import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Save, Paperclip, FileText, Share2, Plus } from 'lucide-react';
import { AIInsightPanel } from '../components/ui/AIInsightPanel';

const MOCK_AI_SUMMARY = {
  primaryResult: "Synthesis Successful",
  confidenceScore: 95,
  confidenceLevel: "Very High",
  interpretation: "The notebook entries and attached spectral data confirm the successful synthesis of CuFe2O4 via sol-gel auto-combustion. The characterization data aligns perfectly with the intended phase.",
  keyEvidence: [
    "XRD confirms pure spinel phase without impurities",
    "FTIR shows characteristic metal-oxygen bonds at expected wavenumbers",
    "Synthesis parameters (pH 7, calcination at 800°C) produced high crystallinity"
  ],
  warnings: [
    "Note: Yield was slightly lower than theoretical (82%), consider adjusting chelating agent ratio in future runs."
  ],
  uncertainty: "Low",
  recommendedNextStep: [
    "Proceed to electrochemical testing",
    "Publish dataset to internal repository"
  ]
};

export default function NotebookLab() {
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
                <span>Created: Oct 24, 2023</span>
                <span>•</span>
                <span>Last modified: 2 hrs ago</span>
              </div>
              <h1 className="text-xl font-bold">Exp-042: CuFe2O4 Synthesis via Sol-Gel</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2"><Share2 size={14} /> Share</Button>
              <Button variant="primary" size="sm" className="gap-2"><Save size={14} /> Save Entry</Button>
            </div>
          </div>

          <div className="p-8 max-w-3xl w-full mx-auto space-y-8">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Objective</h3>
              <p className="text-sm text-text-main leading-relaxed">
                To synthesize CuFe2O4 nanoparticles using the sol-gel auto-combustion method and characterize their structural and chemical properties to verify pure spinel phase formation.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Synthesis Protocol</h3>
              <div className="bg-surface p-4 rounded-md border border-border text-sm font-mono text-text-dim space-y-2">
                <p>1. Dissolve Cu(NO3)2·3H2O and Fe(NO3)3·9H2O in DI water (molar ratio 1:2).</p>
                <p>2. Add citric acid as chelating agent (metal:citric acid ratio 1:1.5).</p>
                <p>3. Adjust pH to ~7.0 using NH4OH solution under constant stirring.</p>
                <p>4. Heat at 80°C until gel formation, then ignite at 250°C.</p>
                <p>5. Calcine resulting powder at 800°C for 4 hours in air.</p>
              </div>
            </section>

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
                    <p className="text-xs text-text-muted">Analyzed • High Confidence</p>
                  </div>
                </Card>
                <Card className="p-3 flex items-start gap-3 hover:border-primary/50 cursor-pointer group bg-surface-hover/50">
                  <div className="bg-cyan/20 text-cyan p-2 rounded">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium group-hover:text-cyan transition-colors">XPS_Survey_CuFe2O4.vms</h4>
                    <p className="text-xs text-text-muted">Analyzed • High Confidence</p>
                  </div>
                </Card>
              </div>
            </section>
          </div>
        </div>

        {/* Right Panel: AI Summary */}
        <div className="w-[360px] border-l border-border bg-background flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6">
             <div className="mb-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Experiment Synthesis</div>
            <AIInsightPanel result={MOCK_AI_SUMMARY} />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

// Needed to avoid undefined Plus icon in left panel since I forgot to import it above. Wait, I will just add the import using multi_replace but I can just rely on the build failing to tell me, or I can fix it now by replacing the content.
