/**
 * Parameter System Type Definitions
 * 
 * Defines types and interfaces for the scientific parameter control system
 * used across XRD, XPS, FTIR, and Raman technique workspaces.
 */

// ============================================================================
// Core Parameter Types
// ============================================================================

/**
 * Valid parameter value types
 */
export type ParameterValue = number | string | boolean | null;

/**
 * Parameter input control types
 */
export type ParameterType = 'number' | 'select' | 'boolean';

/**
 * Parameter definition for rendering controls and validation
 */
export interface ParameterDefinition {
  /** Unique identifier for the parameter */
  id: string;
  
  /** Display label for the parameter */
  label: string;
  
  /** Input control type */
  type: ParameterType;
  
  /** Scientific unit (e.g., "°2θ", "eV", "cm⁻¹") */
  unit?: string;
  
  /** Default value for the parameter */
  defaultValue: ParameterValue;
  
  // Number-specific properties
  /** Minimum value (for number type) */
  min?: number;
  
  /** Maximum value (for number type) */
  max?: number;
  
  /** Step increment (for number type) */
  step?: number;
  
  // Select-specific properties
  /** Available options (for select type) */
  options?: Array<{ value: string; label: string }>;
  
  // Conditional visibility
  /** Function to determine if parameter should be visible based on other parameters */
  visibleWhen?: (params: Record<string, ParameterValue>) => boolean;
  
  // Validation
  /** Function to validate parameter value, returns error message or null */
  validate?: (value: ParameterValue, allParams: Record<string, ParameterValue>) => string | null;
}

// ============================================================================
// XRD Parameter Interfaces
// ============================================================================

/**
 * Baseline correction parameters for XRD
 */
export interface XrdBaselineCorrectionParams {
  /** Baseline correction method */
  method: 'ALS' | 'Polynomial';
  
  /** Lambda smoothness parameter (for ALS method) */
  lambda: number;
  
  /** Asymmetry parameter (for ALS method) */
  p: number;
  
  /** Number of iterations (for ALS method) */
  iterations: number;
}

/**
 * Smoothing parameters for XRD
 */
export interface XrdSmoothingParams {
  /** Smoothing method */
  method: 'Savitzky-Golay';
  
  /** Window size (must be odd) */
  window_size: number;
  
  /** Polynomial order */
  polynomial_order: number;
}

/**
 * Peak detection parameters for XRD
 */
export interface XrdPeakDetectionParams {
  /** Peak prominence threshold (0.0 to 1.0) */
  prominence: number;
  
  /** Minimum distance between peaks (°2θ) */
  min_distance: number;
  
  /** Optional height threshold (0.0 to 1.0) */
  height_threshold: number | null;
}

/**
 * Peak fitting parameters for XRD
 */
export interface XrdPeakFittingParams {
  /** Peak model type */
  model: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt';
  
  /** Convergence tolerance */
  tolerance: number;
  
  /** Maximum iterations */
  max_iterations: number;
}

/**
 * Reference matching parameters for XRD
 */
export interface XrdReferenceMatchingParams {
  /** Reference database */
  database: 'ICDD' | 'COD';
  
  /** Position tolerance (°2θ) */
  delta_tolerance: number;
  
  /** Minimum match score (0.0 to 1.0) */
  min_match_score: number;
  
  /** Use intensity in matching */
  use_intensity: boolean;
}

/**
 * Complete XRD parameter set
 */
export interface XrdParameters {
  baselineCorrection: XrdBaselineCorrectionParams;
  smoothing: XrdSmoothingParams;
  peakDetection: XrdPeakDetectionParams;
  peakFitting: XrdPeakFittingParams;
  referenceMatching: XrdReferenceMatchingParams;
}

// ============================================================================
// XPS Parameter Interfaces (for future use)
// ============================================================================

/**
 * XPS parameters (placeholder for Phase 4)
 */
export interface XpsParameters {
  backgroundSubtraction: {
    method: 'Shirley' | 'Tougaard';
    iterations: number;
  };
  peakDeconvolution: {
    model: 'Gaussian-Lorentzian';
    num_components: number;
    constrain_fwhm: boolean;
  };
  energyCalibration: {
    reference_peak: 'C1s' | 'Au4f7' | 'Ag3d5';
    reference_energy: number;
  };
  assignment: {
    binding_energy_tolerance: number;
    satellite_check: boolean;
  };
}

// ============================================================================
// Raman Parameter Interfaces (for future use)
// ============================================================================

/**
 * Raman parameters (placeholder for Phase 4)
 */
export interface RamanParameters {
  baseline: {
    method: 'ALS' | 'Polynomial';
    lambda: number;
    p: number;
  };
  peakDetection: {
    prominence: number;
    min_distance: number;
  };
  modeAssignment: {
    reference_library: string;
    tolerance: number;
  };
}

// ============================================================================
// FTIR Parameter Interfaces (for future use)
// ============================================================================

/**
 * FTIR parameters (placeholder for Phase 4)
 */
export interface FtirParameters {
  baseline: {
    method: 'Rubberband' | 'Polynomial';
  };
  peakDetection: {
    prominence: number;
    min_distance: number;
  };
  bandAssignment: {
    library: 'Fe-O' | 'Organic' | 'Other';
    tolerance: number;
  };
}

// ============================================================================
// Technique Parameter Union
// ============================================================================

/**
 * Union type for all technique parameters
 */
export type TechniqueParameters = XrdParameters | XpsParameters | RamanParameters | FtirParameters;

// ============================================================================
// Workspace State Interface
// ============================================================================

/**
 * Workspace-level parameter state
 */
export interface WorkspaceParameterState {
  /** Auto Mode enabled (parameters hidden, defaults applied) */
  autoMode: boolean;
  
  /** Current parameter values */
  parameters: TechniqueParameters;
  
  /** Set of expanded processing step IDs */
  expandedSteps: Set<string>;
}

// ============================================================================
// Processing Step Status
// ============================================================================

/**
 * Processing step status for display in Processing Pipeline
 */
export interface ProcessingStepStatus {
  /** Unique step identifier */
  id: string;
  
  /** Display label */
  label: string;
  
  /** Current status */
  status: 'complete' | 'warning' | 'error';
  
  /** Summary text */
  summary: string;
}
