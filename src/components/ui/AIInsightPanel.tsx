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
    uncertainty?: string;
    recommendedNextStep: string[];
    claimStatus?: string;
    validationState?: string;
  };
  className?: string;
}

function getEvidenceStatusLabel(claimStatus?: string, confidenceLevel?: string): string {
  if (claimStatus === 'strongly_supported') return 'Supported assignment with validation boundaries';
  if (claimStatus === 'supported') return 'Requires validation';
  if (claimStatus === 'partial') return 'Validation-limited';
  if (claimStatus === 'inconclusive') return 'Publication-limited';
  if (claimStatus === 'contradicted') return 'Claim boundary';
  // Fallback to confidence level mapping
  if (confidenceLevel === 'high') return 'Supported assignment with validation boundaries';
  if (confidenceLevel === 'medium') return 'Requires validation';
  return 'Publication-limited';
}

function getEvidenceStatusColor(claimStatus?: string, confidenceLevel?: string): string {
  if (claimStatus === 'strongly_supported' || confidenceLevel === 'high') return 'text-emerald-600';
  if (claimStatus === 'supported' || confidenceLevel === 'medium') return 'text-cyan-600';
  return 'text-amber-600';
}

export function ScientificReasoningPanel({ result, className }: ScientificReasoningPanelProps) {
  const status = getEvidenceStatusLabel(result.claimStatus, result.confidenceLevel);
  const statusColor = getEvidenceStatusColor(result.claimStatus, result.confidenceLevel);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-4 border-b border-border bg-surface-hover/50">
        <div className="flex items-center gap-2 text-accent">
          <Microscope size={18} />
          <span className="text-xs font-semibold tracking-wider uppercase">Characterization Overview</span>
        </div>
        <CardTitle className="text-xl mt-2 flex justify-between items-start">
          <span>{result.primaryResult}</span>
          <div className="flex flex-col items-end">
            <span className={`text-sm font-bold ${statusColor}`}>{status}</span>
            <span className="text-xs text-text-muted font-normal">Evidence Status</span>
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
          <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider mb-3">Supporting Data</h4>
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
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle size={14} /> Limitations
            </h4>
            <ul className="space-y-1">
              {result.warnings.map((warn, i) => (
                <li key={i} className="text-sm text-amber-900 ml-5 list-disc">
                  {warn}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider mb-3">Limitations and Follow-up Validation</h4>
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
