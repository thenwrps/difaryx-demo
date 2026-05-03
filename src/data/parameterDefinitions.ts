/**
 * Parameter Definitions Registry
 * 
 * Defines parameter definitions and default values for all technique workspaces.
 * These definitions drive the UI rendering and validation logic.
 */

import type { ParameterDefinition, XrdParameters } from '../types/parameters';

// ============================================================================
// XRD Parameter Definitions
// ============================================================================

/**
 * Baseline Correction parameter definitions
 * 
 * Note: Implementation uses rolling percentile baseline (not true ALS).
 * Parameters approximate ALS behavior:
 * - lambda controls window size (smoothness)
 * - p controls percentile fraction (asymmetry)
 */
const XRD_BASELINE_CORRECTION_DEFINITIONS: ParameterDefinition[] = [
  {
    id: 'method',
    label: 'Method',
    type: 'select',
    defaultValue: 'ALS',
    options: [
      { value: 'ALS', label: 'Asymmetric Least Squares (ALS)' },
      { value: 'Polynomial', label: 'Polynomial Fit' }
    ]
  },
  {
    id: 'lambda',
    label: 'Lambda',
    type: 'number',
    unit: 'dimensionless',
    min: 1e2,
    max: 1e9,
    step: 1e5,
    defaultValue: 1e6,
    visibleWhen: (params) => params.method === 'ALS',
    validate: (value) => {
      if (typeof value === 'number' && (value < 1e2 || value > 1e9)) {
        return 'Lambda must be between 1e2 and 1e9';
      }
      return null;
    }
  },
  {
    id: 'p',
    label: 'Asymmetry (p)',
    type: 'number',
    unit: 'dimensionless',
    min: 0.001,
    max: 0.1,
    step: 0.001,
    defaultValue: 0.01,
    visibleWhen: (params) => params.method === 'ALS',
    validate: (value) => {
      if (typeof value === 'number' && (value < 0.001 || value > 0.1)) {
        return 'Asymmetry must be between 0.001 and 0.1';
      }
      return null;
    }
  },
  {
    id: 'iterations',
    label: 'Iterations',
    type: 'number',
    unit: '',
    min: 1,
    max: 100,
    step: 1,
    defaultValue: 10,
    visibleWhen: (params) => params.method === 'ALS',
    validate: (value) => {
      if (typeof value === 'number' && (value < 1 || value > 100)) {
        return 'Iterations must be between 1 and 100';
      }
      return null;
    }
  }
];

/**
 * Smoothing parameter definitions
 * 
 * Note: Implementation uses moving average (not true Savitzky-Golay).
 * Parameters approximate Savitzky-Golay behavior:
 * - window_size controls smoothing window
 * - polynomial_order is not used (moving average is order-0)
 */
const XRD_SMOOTHING_DEFINITIONS: ParameterDefinition[] = [
  {
    id: 'method',
    label: 'Method',
    type: 'select',
    defaultValue: 'Savitzky-Golay',
    options: [
      { value: 'Savitzky-Golay', label: 'Savitzky-Golay Filter' }
    ]
  },
  {
    id: 'window_size',
    label: 'Window Size',
    type: 'number',
    unit: '',
    min: 3,
    max: 21,
    step: 2,
    defaultValue: 5,
    validate: (value) => {
      if (typeof value === 'number') {
        if (value < 3 || value > 21) {
          return 'Window size must be between 3 and 21';
        }
        if (value % 2 === 0) {
          return 'Window size must be odd';
        }
      }
      return null;
    }
  },
  {
    id: 'polynomial_order',
    label: 'Polynomial Order',
    type: 'number',
    unit: '',
    min: 1,
    max: 5,
    step: 1,
    defaultValue: 2,
    validate: (value, allParams) => {
      if (typeof value === 'number' && typeof allParams.window_size === 'number') {
        if (value < 1 || value > 5) {
          return 'Polynomial order must be between 1 and 5';
        }
        if (value >= allParams.window_size) {
          return 'Polynomial order must be less than window size';
        }
      }
      return null;
    }
  }
];

/**
 * Peak Detection parameter definitions
 */
const XRD_PEAK_DETECTION_DEFINITIONS: ParameterDefinition[] = [
  {
    id: 'prominence',
    label: 'Prominence',
    type: 'number',
    unit: 'dimensionless',
    min: 0.0,
    max: 1.0,
    step: 0.01,
    defaultValue: 0.1,
    validate: (value) => {
      if (typeof value === 'number' && (value < 0.0 || value > 1.0)) {
        return 'Prominence must be between 0.0 and 1.0';
      }
      return null;
    }
  },
  {
    id: 'min_distance',
    label: 'Min Distance',
    type: 'number',
    unit: '°2θ',
    min: 0.05,
    max: 2.0,
    step: 0.05,
    defaultValue: 0.2,
    validate: (value) => {
      if (typeof value === 'number' && (value < 0.05 || value > 2.0)) {
        return 'Min distance must be between 0.05 and 2.0 °2θ';
      }
      return null;
    }
  },
  {
    id: 'height_threshold',
    label: 'Height Threshold (optional)',
    type: 'number',
    unit: 'dimensionless',
    min: 0.0,
    max: 1.0,
    step: 0.01,
    defaultValue: null,
    validate: (value) => {
      if (value !== null && typeof value === 'number' && (value < 0.0 || value > 1.0)) {
        return 'Height threshold must be between 0.0 and 1.0';
      }
      return null;
    }
  }
];

/**
 * Peak Fitting parameter definitions
 */
const XRD_PEAK_FITTING_DEFINITIONS: ParameterDefinition[] = [
  {
    id: 'model',
    label: 'Peak Model',
    type: 'select',
    defaultValue: 'Pseudo-Voigt',
    options: [
      { value: 'Gaussian', label: 'Gaussian' },
      { value: 'Lorentzian', label: 'Lorentzian' },
      { value: 'Pseudo-Voigt', label: 'Pseudo-Voigt' }
    ]
  },
  {
    id: 'tolerance',
    label: 'Tolerance',
    type: 'number',
    unit: 'dimensionless',
    min: 1e-6,
    max: 1e-2,
    step: 1e-6,
    defaultValue: 1e-4,
    validate: (value) => {
      if (typeof value === 'number' && (value < 1e-6 || value > 1e-2)) {
        return 'Tolerance must be between 1e-6 and 1e-2';
      }
      return null;
    }
  },
  {
    id: 'max_iterations',
    label: 'Max Iterations',
    type: 'number',
    unit: '',
    min: 10,
    max: 1000,
    step: 10,
    defaultValue: 100,
    validate: (value) => {
      if (typeof value === 'number' && (value < 10 || value > 1000)) {
        return 'Max iterations must be between 10 and 1000';
      }
      return null;
    }
  }
];

/**
 * Reference Matching parameter definitions
 */
const XRD_REFERENCE_MATCHING_DEFINITIONS: ParameterDefinition[] = [
  {
    id: 'database',
    label: 'Database',
    type: 'select',
    defaultValue: 'ICDD',
    options: [
      { value: 'ICDD', label: 'ICDD (International Centre for Diffraction Data)' },
      { value: 'COD', label: 'COD (Crystallography Open Database)' }
    ]
  },
  {
    id: 'delta_tolerance',
    label: 'Position Tolerance',
    type: 'number',
    unit: '°2θ',
    min: 0.01,
    max: 0.5,
    step: 0.01,
    defaultValue: 0.1,
    validate: (value) => {
      if (typeof value === 'number' && (value < 0.01 || value > 0.5)) {
        return 'Position tolerance must be between 0.01 and 0.5 °2θ';
      }
      return null;
    }
  },
  {
    id: 'min_match_score',
    label: 'Min Match Score',
    type: 'number',
    unit: 'dimensionless',
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: 0.7,
    validate: (value) => {
      if (typeof value === 'number' && (value < 0.0 || value > 1.0)) {
        return 'Min match score must be between 0.0 and 1.0';
      }
      return null;
    }
  },
  {
    id: 'use_intensity',
    label: 'Use Intensity in Matching',
    type: 'boolean',
    defaultValue: true
  }
];

/**
 * Complete XRD parameter definitions registry
 */
export const XRD_PARAMETER_DEFINITIONS: Record<string, ParameterDefinition[]> = {
  baselineCorrection: XRD_BASELINE_CORRECTION_DEFINITIONS,
  smoothing: XRD_SMOOTHING_DEFINITIONS,
  peakDetection: XRD_PEAK_DETECTION_DEFINITIONS,
  peakFitting: XRD_PEAK_FITTING_DEFINITIONS,
  referenceMatching: XRD_REFERENCE_MATCHING_DEFINITIONS
};

// ============================================================================
// XRD Default Parameters
// ============================================================================

/**
 * Default parameter values for XRD workspace
 */
export const XRD_DEFAULT_PARAMETERS: XrdParameters = {
  baselineCorrection: {
    method: 'ALS',
    lambda: 1e6,
    p: 0.01,
    iterations: 10
  },
  smoothing: {
    method: 'Savitzky-Golay',
    window_size: 5,
    polynomial_order: 2
  },
  peakDetection: {
    prominence: 0.1,
    min_distance: 0.2,
    height_threshold: null
  },
  peakFitting: {
    model: 'Pseudo-Voigt',
    tolerance: 1e-4,
    max_iterations: 100
  },
  referenceMatching: {
    database: 'ICDD',
    delta_tolerance: 0.1,
    min_match_score: 0.7,
    use_intensity: true
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get parameter definitions for a specific processing step
 */
export function getStepParameterDefinitions(
  technique: 'xrd' | 'xps' | 'ftir' | 'raman',
  stepId: string
): ParameterDefinition[] {
  if (technique === 'xrd') {
    return XRD_PARAMETER_DEFINITIONS[stepId] || [];
  }
  // Future: Add XPS, FTIR, Raman
  return [];
}

/**
 * Get default parameters for a technique
 */
export function getDefaultParameters(
  technique: 'xrd' | 'xps' | 'ftir' | 'raman'
): XrdParameters {
  if (technique === 'xrd') {
    return XRD_DEFAULT_PARAMETERS;
  }
  // Future: Add XPS, FTIR, Raman
  return XRD_DEFAULT_PARAMETERS; // Fallback
}
