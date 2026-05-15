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
    <div className="min-h-[64px] rounded-lg border border-slate-200 bg-white p-2">
      <div className="flex items-start gap-2">
        <div className="shrink-0 rounded-md border border-blue-200 bg-blue-50 p-1.5">
          <Icon size={14} className="text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 truncate text-[9px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
          <div className="break-words text-[13px] font-bold leading-tight text-slate-900">{value}</div>
          {sublabel && (
            <div className="mt-0.5 truncate text-[9px] leading-tight text-slate-600">{sublabel}</div>
          )}
        </div>
      </div>
    </div>
  );
}
