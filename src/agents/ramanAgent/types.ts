/**
 * Raman Spectroscopy Agent Types
 * 
 * Raman spectroscopy measures vibrational modes through inelastic light scattering.
 * Used for phase identification, defect analysis, and structural characterization.
 */

// ============================================================================
// Core Data Types
// ============================================================================

export interface RamanPoint {
  x: number;  // Raman shift (cm⁻¹)
  y: number;  // Intensity (a.u.)
}

export interface RamanDetectedPeak {
  id: string;
  ramanShift: number;           // Peak position (cm⁻¹)
  intensity: number;            // Peak height (normalized)
  rawIntensity: number;         // Peak height (raw intensity)
  prominence: number;           // Peak prominence
  fwhm: number;                 // Full Width at Half Maximum (cm⁻¹)
  area: number;                 // Integrated peak area
  classification: 'sharp' | 'medium' | 'broad';
  assignment?: string;          // Mode assignment
  label?: string;               // Display label
}

// ============================================================================
// Reference Database Types
// ============================================================================

export interface RamanModeReference {
  modeName: string;             // e.g., "A1g spinel ferrite"
  assignment: string;           // e.g., "Symmetric stretching of metal-oxygen bonds"
  ramanShiftRange: [number, number];  // [min, max] cm⁻¹
  typicalCenter: number;        // Typical peak position (cm⁻¹)
  expectedWidth: 'sharp' | 'medium' | 'broad';
  diagnosticWeight: number;     // 0-1, importance for phase identification
  supportingModes: string[];    // IDs of supporting modes
  overlappingModes: string[];   // IDs of potentially overlapping modes
  phaseType: 'ferrite' | 'carbon' | 'defect' | 'oxide';
  literatureSource: string;
}

// ============================================================================
// Match and Assignment Types
// ============================================================================

export interface RamanPeakMatch {
  referenceMode: RamanModeReference;
  observedPeak: RamanDetectedPeak;
  deltaFromCenter: number;      // Distance from typical center (cm⁻¹)
  positionScore: number;        // 0-1, how well positioned
  widthScore: number;           // 0-1, how well width matches
  overallScore: number;         // 0-1, combined score
}

export interface RamanModeCandidate {
  modeName: string;
  assignment: string;
  matches: RamanPeakMatch[];
  supportingModes: RamanPeakMatch[];
  score: number;                // 0-1
  confidenceLevel: 'high' | 'medium' | 'low';
  ambiguity: string | null;
  phaseType: 'ferrite' | 'carbon' | 'defect' | 'oxide';
}

// ============================================================================
// Interpretation Types
// ============================================================================

export interface RamanInterpretation {
  dominantModes: string[];      // Top 3 mode names
  phaseInterpretation: string;  // e.g., "Spinel ferrite with carbonaceous residue"
  decision: string;             // Interpretation summary
  confidenceScore: number;      // 0-100
  confidenceLevel: 'high' | 'medium' | 'low';
  evidence: string[];           // Top matched modes with supporting evidence
  ambiguities: string[];        // Ambiguous assignments
  caveats: string[];            // Interpretation caveats
  summary: string;              // One-line summary
}

// ============================================================================
// Processing Parameters
// ============================================================================

export interface RamanProcessingParams {
  // Baseline correction
  baselineMethod?: 'Polynomial' | 'Rubberband' | 'Linear';
  polynomialOrder?: number;
  baselineIterations?: number;
  
  // Smoothing
  smoothingMethod?: 'Savitzky-Golay' | 'Moving Average';
  smoothingWindowSize?: number;
  smoothingPolynomialOrder?: number;
  
  // Peak detection
  peakProminence?: number;      // 0-1, relative to max intensity
  peakMinDistance?: number;     // cm⁻¹
  peakMinHeight?: number;       // 0-1, relative to max intensity
  
  // Mode assignment
  ramanShiftTolerance?: number; // cm⁻¹
  referenceSet?: 'ferrite' | 'all';
  
  // Defect analysis
  enableDGDetection?: boolean;
  dgRatioEstimation?: boolean;
  
  // Ambiguity threshold
  ambiguityThreshold?: number;  // 0-1, score difference threshold
}

// ============================================================================
// Processing Result
// ============================================================================

export interface RamanProcessingResult {
  signal: {
    ramanShift: number[];       // cm⁻¹
    intensity: number[];        // a.u.
  };
  baseline: number[];           // Background intensity
  peaks: RamanDetectedPeak[];
  matches: RamanPeakMatch[];
  modeCandidate: RamanModeCandidate[];
  interpretation: RamanInterpretation;
  validation: {
    ok: boolean;
    errors: string[];
    warnings: string[];
    pointCount: number;
    ramanShiftRange: [number, number];
  };
  executionLog: any[];
  parametersUsed: RamanProcessingParams;
}
