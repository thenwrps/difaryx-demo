import React, { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Technique } from '../../data/demoProjects';
import type { EvidenceLayer } from '../../utils/agentContext';

interface MultiTechPopoverProps {
  evidenceLayers: EvidenceLayer[];
  includedTechniques: Technique[];
  selectedTechnique: Technique;
  onToggleIncluded: (technique: Technique) => void;
  onSelectTechnique: (technique: Technique) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  disabled?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  pending: 'Pending',
  required: 'Required',
};

const STATUS_COLORS: Record<string, string> = {
  available: 'text-emerald-600',
  pending: 'text-amber-600',
  required: 'text-rose-600',
};

export function MultiTechPopover({
  evidenceLayers,
  includedTechniques,
  selectedTechnique,
  onToggleIncluded,
  onSelectTechnique,
  isOpen,
  onToggleOpen,
  disabled,
}: MultiTechPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onToggleOpen();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggleOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={onToggleOpen}
        disabled={disabled}
        className="h-7 px-2.5 flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded text-[10px] font-semibold text-blue-700 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate max-w-[160px]">Multi-tech Evidence Review</span>
        <ChevronDown size={11} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[340px] bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
          {evidenceLayers.map((layer) => {
            const isIncluded = includedTechniques.includes(layer.technique);
            const isSelected = selectedTechnique === layer.technique;
            return (
              <div
                key={layer.technique}
                className={`flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isIncluded}
                  onChange={() => onToggleIncluded(layer.technique)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => onSelectTechnique(layer.technique)}
                  className={`flex-1 flex items-center gap-2 text-left text-[11px] ${isSelected ? 'font-bold text-blue-700' : 'text-slate-700'}`}
                >
                  <span className="font-semibold w-[38px]">{layer.technique}</span>
                  <span className="flex-1 text-slate-500 truncate">{layer.role}</span>
                  <span className={`text-[10px] font-medium ${STATUS_COLORS[layer.status] || 'text-slate-500'}`}>
                    {STATUS_LABELS[layer.status] || layer.status}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
