/**
 * ParameterAccordion Component
 * 
 * Expandable inline parameter control panel for a single processing step.
 * Shows/hides parameters based on Auto Mode and expansion state.
 */

import React, { useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ParameterControl } from './ParameterControl';
import type { ParameterDefinition, ParameterValue } from '../../types/parameters';

export interface ParameterAccordionProps {
  /** Processing step identifier */
  stepId: string;
  
  /** Processing step display label */
  stepLabel: string;
  
  /** Whether accordion is expanded */
  isExpanded: boolean;
  
  /** Callback to toggle expansion */
  onToggle: () => void;
  
  /** Whether Auto Mode is enabled (hides parameters) */
  isAutoMode: boolean;
  
  /** Current parameter values for this step */
  parameters: Record<string, ParameterValue>;
  
  /** Parameter definitions for this step */
  parameterDefinitions: ParameterDefinition[];
  
  /** Callback when a parameter value changes */
  onParameterChange: (paramId: string, value: ParameterValue) => void;
  
  /** Validation errors for parameters */
  validationErrors?: Record<string, string>;
}

/**
 * ParameterAccordion Component
 */
export function ParameterAccordion({
  stepId,
  stepLabel,
  isExpanded,
  onToggle,
  isAutoMode,
  parameters,
  parameterDefinitions,
  onParameterChange,
  validationErrors = {},
}: ParameterAccordionProps) {
  // Filter visible parameters based on conditional visibility
  const visibleParameters = useMemo(() => {
    return parameterDefinitions.filter((def) => {
      if (!def.visibleWhen) return true;
      return def.visibleWhen(parameters);
    });
  }, [parameterDefinitions, parameters]);
  
  // Validate parameters and collect errors
  const computedErrors = useMemo(() => {
    const errors: Record<string, string> = { ...validationErrors };
    
    visibleParameters.forEach((def) => {
      if (def.validate) {
        const value = parameters[def.id];
        const error = def.validate(value, parameters);
        if (error) {
          errors[def.id] = error;
        }
      }
    });
    
    return errors;
  }, [visibleParameters, parameters, validationErrors]);
  
  // Don't show parameters button if Auto Mode is enabled
  if (isAutoMode) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      {/* Params button */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown size={14} className="shrink-0" />
        ) : (
          <ChevronRight size={14} className="shrink-0" />
        )}
        <span>Params</span>
      </button>
      
      {/* Parameter controls (expanded) */}
      {isExpanded && (
        <div
          className="space-y-3 pl-5 pr-2 py-2 border-l-2 border-primary/20 animate-in slide-in-from-top-2 duration-200"
        >
          {visibleParameters.map((def) => (
            <ParameterControl
              key={def.id}
              definition={def}
              value={parameters[def.id] ?? def.defaultValue}
              onChange={(value) => onParameterChange(def.id, value)}
              validationError={computedErrors[def.id]}
            />
          ))}
          
          {visibleParameters.length === 0 && (
            <p className="text-xs text-text-muted italic">No parameters available</p>
          )}
        </div>
      )}
    </div>
  );
}
