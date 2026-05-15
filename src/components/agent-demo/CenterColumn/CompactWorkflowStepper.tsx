import React from 'react';
import { AlertTriangle, CheckCircle2, CircleDot, Loader2 } from 'lucide-react';

interface ExecutionStep {
  number: number;
  title: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

interface CompactWorkflowStepperProps {
  steps: ExecutionStep[];
  progressPercent: number;
}

const STEP_LABELS = [
  'Dataset',
  'Peaks',
  'Candidates',
  'Evaluation',
  'Fusion',
  'Interpretation',
  'Discussion',
] as const;

const STATUS_STYLES = {
  complete: {
    icon: CheckCircle2,
    container: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  running: {
    icon: Loader2,
    container: 'border-blue-300 bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
  },
  error: {
    icon: AlertTriangle,
    container: 'border-amber-300 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },
  pending: {
    icon: CircleDot,
    container: 'border-slate-200 bg-white text-slate-500',
    dot: 'bg-slate-400',
  },
};

export function CompactWorkflowStepper({ steps, progressPercent }: CompactWorkflowStepperProps) {
  return (
    <div className="relative rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1">
      <div className="flex flex-wrap gap-1 min-[1180px]:flex-nowrap">
        {steps.map((step, index) => {
          const style = STATUS_STYLES[step.status];
          const Icon = style.icon;
          const label = STEP_LABELS[index] ?? step.title;

          return (
            <div
              key={step.number}
              className={`flex h-6 min-w-[72px] flex-1 items-center gap-1 rounded-full border px-1.5 text-[9px] transition-colors min-[1180px]:min-w-0 ${style.container}`}
              title={step.title}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
              <span className="shrink-0 font-mono text-[8px] text-slate-500">
                {String(step.number).padStart(2, '0')}
              </span>
              <span className="min-w-0 truncate font-semibold leading-none">
                {label}
              </span>
              <Icon
                size={10}
                className={`ml-auto shrink-0 ${step.status === 'running' ? 'animate-spin' : ''}`}
              />
            </div>
          );
        })}
      </div>

      <div className="absolute inset-x-2 bottom-0 h-px overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
