import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { AlertCircle, CheckCircle2, ChevronRight, Microscope } from 'lucide-react';

interface ScientificReasoningPanelProps {
  result: {
    primaryResult: string;
    confidenceScore: number;
    confidenceLevel: string;
    interpretation: string;
    keyEvidence: string[];
    warnings: string[];
    uncertainty: string;
    recommendedNextStep: string[];
  };
  className?: string;
}

export function ScientificReasoningPanel({ result, className }: ScientificReasoningPanelProps) {
  // Map confidence level to research-grade status
  const getDecisionStatus = (level: string) => {
    if (level === 'high') return 'Supported';
    if (level === 'medium') return 'Working hypothesis';
    return 'Requires validation';
  };
  
  const status = getDecisionStatus(result.confidenceLevel);
  const statusColor = result.confidenceLevel === 'high' ? 'text-emerald-600' : 
                      result.confidenceLevel === 'medium' ? 'text-cyan-600' : 'text-amber-600';
  
  return (
    <Card className={className}>
      <CardHeader className="pb-4 border-b border-border bg-surface-hover/50">
        <div className="flex items-center gap-2 text-accent">
          <Microscope size={18} />
          <span className="text-xs font-semibold tracking-wider uppercase">Scientific Reasoning Summary</span>
        </div>
        <CardTitle className="text-xl mt-2 flex justify-between items-start">
          <span>{result.primaryResult}</span>
          <div className="flex flex-col items-end">
            <span className={`text-sm font-bold ${statusColor}`}>{status}</span>
            <span className="text-xs text-text-muted font-normal">Decision status</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div>
          <p className="text-sm text-text-muted leading-relaxed">
            {result.interpretation}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider mb-3">Evidence Basis</h4>
          <ul className="space-y-2">
            {result.keyEvidence.map((evidence, i) => (
              <li key={i} className="text-sm text-text-muted flex items-start gap-2">
                <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                <span>{evidence}</span>
              </li>
            ))}
          </ul>
        </div>

        {result.warnings.length > 0 && (
          <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-lg">
            <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle size={14} /> Limitations
            </h4>
            <ul className="space-y-1">
              {result.warnings.map((warn, i) => (
                <li key={i} className="text-sm text-red-200/70 ml-5 list-disc">
                  {warn}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider mb-3">Recommended Next Steps</h4>
          <div className="space-y-2">
            {result.recommendedNextStep.map((step, i) => (
              <button key={i} className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-surface-hover border border-transparent hover:border-border transition-colors flex items-center justify-between text-cyan">
                <span>{step}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Keep old export for backward compatibility
export { ScientificReasoningPanel as AIInsightPanel };
