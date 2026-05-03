/**
 * Parameter Persistence Hook
 * 
 * Custom React hook for persisting parameter state to localStorage.
 * Automatically loads parameters on mount and saves on change.
 */

import { useState, useEffect } from 'react';
import type { TechniqueParameters } from '../types/parameters';

/**
 * Storage key format for parameter persistence
 */
function getStorageKey(technique: 'xrd' | 'xps' | 'ftir' | 'raman'): string {
  return `difaryx_params_${technique}`;
}

/**
 * Deep merge two objects, preferring values from source
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        // Recursively merge nested objects
        result[key] = deepMerge(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        // Use source value if defined
        result[key] = sourceValue;
      }
    }
  }
  
  return result;
}

/**
 * Load parameters from localStorage
 */
function loadParameters<T extends TechniqueParameters>(
  technique: 'xrd' | 'xps' | 'ftir' | 'raman',
  defaults: T
): T {
  try {
    const key = getStorageKey(technique);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return defaults;
    }
    
    const parsed = JSON.parse(stored);
    
    // Merge stored values with defaults to handle missing keys
    return deepMerge(defaults, parsed);
  } catch (error) {
    console.warn(`Failed to load parameters for ${technique}:`, error);
    return defaults;
  }
}

/**
 * Save parameters to localStorage
 */
function saveParameters<T extends TechniqueParameters>(
  technique: 'xrd' | 'xps' | 'ftir' | 'raman',
  parameters: T
): void {
  try {
    const key = getStorageKey(technique);
    const serialized = JSON.stringify(parameters);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.warn(`Failed to save parameters for ${technique}:`, error);
  }
}

/**
 * Custom hook for parameter persistence
 * 
 * @param technique - Technique identifier ('xrd', 'xps', 'ftir', 'raman')
 * @param initialParameters - Default parameter values
 * @returns Tuple of [parameters, setParameters]
 * 
 * @example
 * ```tsx
 * const [parameters, setParameters] = useParameterPersistence('xrd', XRD_DEFAULT_PARAMETERS);
 * ```
 */
export function useParameterPersistence<T extends TechniqueParameters>(
  technique: 'xrd' | 'xps' | 'ftir' | 'raman',
  initialParameters: T
): [T, (params: T) => void] {
  // Load parameters from localStorage on mount
  const [parameters, setParametersState] = useState<T>(() =>
    loadParameters(technique, initialParameters)
  );
  
  // Save parameters to localStorage whenever they change
  useEffect(() => {
    saveParameters(technique, parameters);
  }, [technique, parameters]);
  
  // Wrapper function to update parameters
  const setParameters = (newParameters: T) => {
    setParametersState(newParameters);
  };
  
  return [parameters, setParameters];
}

/**
 * Clear stored parameters for a technique
 * 
 * @param technique - Technique identifier
 */
export function clearStoredParameters(technique: 'xrd' | 'xps' | 'ftir' | 'raman'): void {
  try {
    const key = getStorageKey(technique);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to clear parameters for ${technique}:`, error);
  }
}

/**
 * Check if stored parameters exist for a technique
 * 
 * @param technique - Technique identifier
 * @returns True if stored parameters exist
 */
export function hasStoredParameters(technique: 'xrd' | 'xps' | 'ftir' | 'raman'): boolean {
  try {
    const key = getStorageKey(technique);
    return localStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
}
