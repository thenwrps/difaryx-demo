/**
 * ParameterControl Component
 * 
 * Individual parameter input control with label and inline control.
 * Uses strict 2-column grid layout: [Label (90px)] [Control (flexible)]
 * Styled to match scientific software (Origin/MATLAB) density.
 * Optimized for 320px drawer width.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ParameterDefinition, ParameterValue } from '../../types/parameters';

export interface ParameterControlProps {
  /** Parameter definition (type, range, options, etc.) */
  definition: ParameterDefinition;
  
  /** Current parameter value */
  value: ParameterValue;
  
  /** Callback when value changes */
  onChange: (value: ParameterValue) => void;
  
  /** Optional validation error message */
  validationError?: string;
}

/**
 * Format number for display (handle scientific notation)
 */
function formatNumber(value: number): string {
  if (value >= 1e6 || value <= 1e-4) {
    return value.toExponential(1);
  }
  if (value < 1) {
    return value.toFixed(3);
  }
  return value.toString();
}

/**
 * Parse number from input (handle scientific notation)
 */
function parseNumber(input: string): number {
  const parsed = parseFloat(input);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * ParameterControl Component
 */
export function ParameterControl({
  definition,
  value,
  onChange,
  validationError,
}: ParameterControlProps) {
  const hasError = Boolean(validationError);
  
  // Render number input (slider + text input inline)
  if (definition.type === 'number') {
    // Handle null/undefined values
    const hasValue = typeof value === 'number';
    const numValue = hasValue ? value : (typeof definition.defaultValue === 'number' ? definition.defaultValue : definition.min ?? 0);
    
    const min = definition.min ?? 0;
    const max = definition.max ?? 100;
    const step = definition.step ?? 1;
    
    // For optional parameters (defaultValue is null), show empty input when no value
    const displayValue = hasValue || typeof definition.defaultValue === 'number' 
      ? formatNumber(numValue) 
      : '';
    
    return (
      <div>
        <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
          {/* Label - scientific style */}
          <label
            htmlFor={`param-${definition.id}`}
            className="text-[10px] uppercase tracking-wide text-slate-500"
          >
            {definition.label}
          </label>
          
          {/* Control: Input + Slider inline */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Numeric input - right-aligned, monospace */}
            <input
              type="text"
              value={displayValue}
              onChange={(e) => {
                const parsed = parseNumber(e.target.value);
                onChange(e.target.value === '' ? null : parsed);
              }}
              placeholder={definition.defaultValue === null ? 'Optional' : undefined}
              className={`w-20 px-2 h-8 text-sm font-mono text-right rounded-md border bg-white text-slate-900 shrink-0
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                ${hasError ? 'border-amber-500' : 'border-slate-200'}
              `}
            />
            
            {/* Range slider - thin, low contrast */}
            <input
              type="range"
              id={`param-${definition.id}`}
              min={min}
              max={max}
              step={step}
              value={numValue}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className={`flex-1 min-w-0 h-[2px] rounded-full appearance-none cursor-pointer
                ${hasError ? 'bg-amber-200' : 'bg-slate-200'}
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-blue-600
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-0
                [&::-webkit-slider-thumb]:shadow-sm
                [&::-moz-range-thumb]:w-3
                [&::-moz-range-thumb]:h-3
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-blue-600
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-sm
              `}
            />
          </div>
        </div>
        
        {/* Validation error */}
        {hasError && (
          <div className="mt-1 ml-[98px] flex items-start gap-1 text-[10px] text-amber-700">
            <AlertTriangle size={10} className="mt-0.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    );
  }
  
  // Render select input (dropdown)
  if (definition.type === 'select') {
    const strValue = typeof value === 'string' ? value : definition.defaultValue as string;
    
    return (
      <div>
        <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
          {/* Label - scientific style */}
          <label
            htmlFor={`param-${definition.id}`}
            className="text-[10px] uppercase tracking-wide text-slate-500"
          >
            {definition.label}
          </label>
          
          {/* Control: Dropdown */}
          <select
            id={`param-${definition.id}`}
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            className={`px-2 h-8 text-sm rounded-md border bg-white text-slate-900 min-w-0
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
              ${hasError ? 'border-amber-500' : 'border-slate-200'}
            `}
          >
            {definition.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Validation error */}
        {hasError && (
          <div className="mt-1 ml-[98px] flex items-start gap-1 text-[10px] text-amber-700">
            <AlertTriangle size={10} className="mt-0.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    );
  }
  
  // Render boolean input (toggle switch)
  if (definition.type === 'boolean') {
    const boolValue = typeof value === 'boolean' ? value : definition.defaultValue as boolean;
    
    return (
      <div>
        <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
          {/* Label - scientific style */}
          <label
            className="text-[10px] uppercase tracking-wide text-slate-500"
          >
            {definition.label}
          </label>
          
          {/* Control: Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={boolValue}
            onClick={() => onChange(!boolValue)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors justify-self-start
              ${boolValue ? 'bg-blue-600' : 'bg-slate-200'}
              ${hasError ? 'ring-1 ring-amber-500' : ''}
            `}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm
                ${boolValue ? 'translate-x-4.5' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>
        
        {/* Validation error */}
        {hasError && (
          <div className="mt-1 ml-[98px] flex items-start gap-1 text-[10px] text-amber-700">
            <AlertTriangle size={10} className="mt-0.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    );
  }
  
  return null;
}
