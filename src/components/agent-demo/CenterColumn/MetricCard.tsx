import React from 'react';
import { Activity, BarChart3, Signal, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: 'activity' | 'chart' | 'signal' | 'trending';
}

const ICONS = {
  activity: Activity,
  chart: BarChart3,
  signal: Signal,
  trending: TrendingUp,
};

export function MetricCard({ label, value, sublabel, icon = 'activity' }: MetricCardProps) {
  const Icon = ICONS[icon];

  return (
    <div className="rounded-lg border border-slate-800 bg-[#070B12] p-3">
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30">
          <Icon size={16} className="text-cyan-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">{label}</div>
          <div className="text-sm font-bold text-white leading-tight break-words">{value}</div>
          {sublabel && (
            <div className="text-[10px] text-slate-400 mt-1 leading-tight">{sublabel}</div>
          )}
        </div>
      </div>
    </div>
  );
}
