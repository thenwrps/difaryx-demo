import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ParameterControl } from './ParameterControl';
import type { ParameterDefinition, ParameterValue } from '../../types/parameters';

interface ParameterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stepId: string | null;
  stepLabel: string;
  methodName: string;
  isAutoMode: boolean;
  parameters: Record<string, ParameterValue>;
  parameterDefinitions: ParameterDefinition[];
  onParameterChange: (paramId: string, value: ParameterValue) => void;
  onApply: () => void;
  onReset: () => void;
  validationErrors: Record<string, string>;
  previewImpact: string;
}

export function ParameterDrawer({
  isOpen,
  onClose,
  stepId,
  stepLabel,
  methodName,
  isAutoMode,
  parameters,
  parameterDefinitions,
  onParameterChange,
  onApply,
  onReset,
  validationErrors,
  previewImpact,
}: ParameterDrawerProps) {
  if (!isOpen || !stepId) return null;

  // Filter visible parameters based on visibleWhen conditions
  const visibleParameters = parameterDefinitions.filter((def) => {
    if (!def.visibleWhen) return true;
    return def.visibleWhen(parameters);
  });

  // Render drawer content using Portal to mount directly to document.body
  const drawerContent = (
    <div
      className={`fixed right-0 top-0 bottom-0 z-[9999] w-[320px] max-w-[320px] bg-white border-l border-slate-200 shadow-xl transform transition-transform duration-200 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col bg-white">
        {/* Header - Scientific style */}
        <div className="px-3 py-2 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">
                {stepLabel}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">{methodName}</p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-0.5 rounded hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X size={14} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-3 bg-white">
          {/* Parameters Section - Strict 2-column grid */}
          <div className="space-y-2">
            {visibleParameters.length === 0 ? (
              <div className="text-[10px] text-slate-500 text-center py-4">
                No parameters available for this step
              </div>
            ) : (
              visibleParameters.map((def) => (
                <ParameterControl
                  key={def.id}
                  definition={def}
                  value={parameters[def.id]}
                  onChange={(value) => onParameterChange(def.id, value)}
                  validationError={validationErrors[def.id]}
                />
              ))
            )}
          </div>

          {/* Preview Impact - Minimal, single line */}
          {previewImpact && (
            <div className="mt-3 pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500 leading-tight truncate">{previewImpact}</p>
            </div>
          )}
        </div>

        {/* Actions - Right-aligned, small */}
        <div className="px-3 py-2 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 h-8 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onReset}
              className="px-3 h-8 rounded-md border border-slate-300 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={onApply}
              className="px-4 h-8 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use Portal to render drawer directly to document.body
  return createPortal(drawerContent, document.body);
}
