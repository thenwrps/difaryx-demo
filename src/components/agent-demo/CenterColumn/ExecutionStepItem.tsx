import React from 'react';
import { AlertTriangle, CheckCircle2, CircleDot, Loader2 } from 'lucide-react';

interface ExecutionStepItemProps {
  number: number;
  title: string;
  description: string;
  tool: string;
  time: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

export function ExecutionStepItem({
  number,
  title,
  description,
  tool,
  time,
  status,
}: ExecutionStepItemProps) {
  const statusIcon = {
    complete: <CheckCircle2 size={16} className="text-emerald-300" />,
    running: <Loader2 size={16} className="animate-spin text-cyan-300" />,
    error: <AlertTriangle size={16} className="text-amber-300" />,
    pending: <CircleDot size={16} className="text-slate-600" />,
  }[status];

  const borderColor = {
    complete: 'border-emerald-400/20',
    running: 'border-cyan-400/30',
    error: 'border-amber-400/30',
    pending: 'border-slate-800',
  }[status];

  return (
    <div className={`flex gap-4 p-4 rounded-lg border ${borderColor} bg-[#070B12]`}>
      {/* Step Number */}
      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-sm font-bold text-slate-300">
        {number}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <div className="shrink-0">{statusIcon}</div>
        </div>
        <p className="text-xs text-slate-400 mb-2">{description}</p>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 rounded bg-slate-800/50 border border-slate-700 text-[10px] font-mono text-slate-400">
            {tool}
          </span>
          {status !== 'pending' && (
            <span className="text-[10px] text-slate-500 font-medium">{time}</span>
          )}
        </div>
      </div>
    </div>
  );
}
