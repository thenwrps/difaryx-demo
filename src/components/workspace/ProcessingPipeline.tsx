/**
 * ProcessingPipeline Component
 * 
 * Container component for all processing steps with Auto Mode toggle and parameter management.
 * Renders processing steps with status indicators and Params buttons that open the parameter drawer.
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import type { ProcessingStepStatus, TechniqueParameters } from '../../types/parameters';

export interface ProcessingPipelineProps {
  /** Technique identifier */
  technique: 'xrd' | 'xps' | 'ftir' | 'raman';
  
  /** Auto Mode enabled (parameters hidden, defaults applied) */
  autoMode: boolean;
  
  /** Callback when Auto Mode changes */
  onAutoModeChange: (enabled: boolean) => void;
  
  /** Current parameter values */
  parameters: TechniqueParameters;
  
  /** Callback when Params button is clicked to open drawer */
  onOpenDrawer: (stepId: string) => void;
  
  /** Processing step status information */
  processingStatus: ProcessingStepStatus[];

  /** Compact mode: hides header, summaries, connecting lines, and status footer */
  compact?: boolean;
}

/**
 * Get status icon component for the right side
 */
function getStatusIcon(status: 'complete' | 'warning' | 'error' | 'running') {
  if (status === 'error') return XCircle;
  if (status === 'warning') return AlertTriangle;
  if (status === 'running') return Loader2;
  return CheckCircle2;
}

/**
 * Get status color classes
 */
function getStatusColor(status: 'complete' | 'warning' | 'error' | 'running') {
  if (status === 'error') return 'text-red-600';
  if (status === 'warning') return 'text-amber-600';
  if (status === 'running') return 'text-primary';
  return 'text-emerald-600';
}

/**
 * ProcessingPipeline Component
 */
export function ProcessingPipeline({
  technique,
  autoMode,
  onAutoModeChange,
  parameters,
  onOpenDrawer,
  processingStatus,
  compact = false,
}: ProcessingPipelineProps) {
  // Calculate overall status
  const hasError = processingStatus.some(s => s.status === 'error');
  const hasWarning = processingStatus.some(s => s.status === 'warning');
  const overallStatus = hasError ? 'Error' : hasWarning ? 'Review' : 'Processed';
  const overallStatusColor = hasError ? 'text-red-600' : hasWarning ? 'text-amber-600' : 'text-emerald-600';
  
  if (compact) {
    return (
      <div className="space-y-0.5">
        {/* Compact: Auto toggle inline with steps */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-text-muted">Auto</span>
          <button
            type="button"
            role="switch"
            aria-checked={autoMode}
            onClick={() => onAutoModeChange(!autoMode)}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors
              ${autoMode ? 'bg-emerald-500' : 'bg-border'}
            `}
          >
            <span
              className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-sm
                ${autoMode ? 'translate-x-4' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>

        {/* Compact steps: single row per step, no summaries, no connecting lines */}
        {processingStatus.map((step, index) => {
          const StatusIcon = getStatusIcon(step.status);
          const statusColor = getStatusColor(step.status);

          return (
            <div key={step.id} className="flex items-center gap-1.5 py-0.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-emerald-400 bg-emerald-100 text-[9px] font-bold text-emerald-700">
                {index + 1}
              </span>
              <span className="flex-1 min-w-0 text-[11px] font-semibold text-text-main truncate">{step.label}</span>
              {!autoMode && (
                <button
                  onClick={() => onOpenDrawer(step.id)}
                  className="flex h-5 items-center gap-0.5 px-1.5 rounded text-[9px] font-semibold text-primary transition-colors hover:bg-primary/5"
                >
                  Params
                  <StatusIcon size={11} className={statusColor} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Header with Auto Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {technique.toUpperCase()} Processing
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted">Auto</span>
          <button
            type="button"
            role="switch"
            aria-checked={autoMode}
            onClick={() => onAutoModeChange(!autoMode)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
              ${autoMode ? 'bg-emerald-500' : 'bg-border'}
            `}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm
                ${autoMode ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>
      </div>
      
      {/* Processing Steps with numbered circles and connecting lines */}
      <div className="relative">
        {processingStatus.map((step, index) => {
          const StatusIcon = getStatusIcon(step.status);
          const statusColor = getStatusColor(step.status);
          const isLast = index === processingStatus.length - 1;
          
          return (
            <div key={step.id} className="relative">
              {/* Connecting line (except for last item) */}
              {!isLast && (
                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-emerald-300" />
              )}
              
              <div className="flex items-start gap-2 pb-2">
                {/* Numbered circle */}
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400 bg-emerald-100 text-[11px] font-bold text-emerald-700">
                  {index + 1}
                </div>
                
                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-main">{step.label}</p>
                      <p className="mt-0.5 line-clamp-2 text-[9px] leading-tight text-text-muted">
                        {step.summary}
                      </p>
                    </div>
                    
                    {/* Params button with status icon - only show when Auto Mode is off */}
                    {!autoMode && (
                      <button
                        onClick={() => onOpenDrawer(step.id)}
                        className="flex h-6 items-center gap-1 px-2 rounded text-[10px] font-semibold text-primary transition-colors hover:bg-primary/5"
                      >
                        Params
                        <StatusIcon size={13} className={statusColor} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Pipeline Status */}
      <div className="mt-1 border-t border-border pt-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold text-text-main">Status</span>
          <span className={`text-xs font-bold ${overallStatusColor}`}>{overallStatus}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-text-muted">
          <span>Demo dataset</span>
          <span>4.21 s deterministic</span>
        </div>
      </div>
    </div>
  );
}
