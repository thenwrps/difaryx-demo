import React from 'react';
import { Download, Plus } from 'lucide-react';

type ModelMode = 'deterministic' | 'vertex-gemini' | 'gemma';
type RunStatus = 'idle' | 'running' | 'complete';

interface MainHeaderProps {
  agentVersion: string;
  executionStatus: RunStatus;
  modelMode: ModelMode;
  onNewAnalysis: () => void;
  onExportReport: () => void;
  isRunning: boolean;
}

export function MainHeader({
  agentVersion,
  executionStatus,
  modelMode,
  onNewAnalysis,
  onExportReport,
  isRunning,
}: MainHeaderProps) {
  const isLiveExecution = executionStatus === 'running';
  const buttonsDisabled = isRunning;

  return (
    <header className="shrink-0 border-b border-white/[0.08] bg-[#0F172A] px-6 py-2.5">
      <div className="flex items-center justify-between gap-6">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white">
              DIFARYX Agent {agentVersion}
            </h1>
            {isLiveExecution && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                Live
              </span>
            )}
            <span className="text-xs text-slate-500">|</span>
            <p className="text-xs text-slate-400">
              Autonomous Scientific Agent
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">
            Workflow: <span className="text-slate-300 font-medium">Deterministic + Interpretation</span>
          </div>
          
          <button
            type="button"
            onClick={onNewAnalysis}
            disabled={buttonsDisabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-blue-600/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Plus size={14} />
            New Analysis
          </button>

          <button
            type="button"
            onClick={onExportReport}
            disabled={buttonsDisabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 text-xs font-semibold hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>
    </header>
  );
}
