/**
 * FTIR Agent Type Definitions
 * 
 * Type definitions for FTIR (Fourier Transform Infrared Spectroscopy) processing agent
 */

// ============================================================================
// FTIR Data Types
// ============================================================================

export interface FtirPoint {
  x: number;  // Wavenumber (cm⁻¹)
  y: number;  // Absorbance or Transmittance
}

export interface FtirPreprocessedPoint {
  x: number;                    // Wavenumber (cm⁻¹)
  rawIntensity: number;         // Original absorbance/transmittance
  smoothedIntensity: number;    // After smoothing
  baselineIntensity: number;    // Calculated baseline
  correctedIntensity: number;   // After baseline subtraction
  normalizedIntensity: number;  // Normalized to 0-100 scale
}

export interface FtirDetectedBand {
  id: string;                   // Unique identifier (e.g., "b1", "b2")
  wavenumber: number;           // Band position (cm⁻¹)
  intensity: number;            // Band height (normalized)
  rawIntensity: number;         // Band height (raw absorbance)
  prominence: number;           // Band prominence
  fwhm: number;                 // Full Width at Half Maximum (cm⁻¹)
  area: number;                 // Integrated band area
  classification: 'narrow' | 'medium' | 'broad';  // Based on FWHM
  assignment?: string;          // Functional group assignment (e.g., "O–H stretch")
  label?: string;               // Display label
}

// ============================================================================
// FTIR Reference Database Types
// ============================================================================

export interface FtirReferenceRange {
  functionalGroup: string;
  assignment: string;
  wavenumberRange: [number, number];  // [min, max] in cm⁻¹
  typicalCenter: number;        // Typical center position (cm⁻¹)
  expectedWidth: 'narrow' | 'medium' | 'broad';  // Expected FWHM category
  diagnosticWeight: number;     // Importance for identification (0-1)
  supportingBands: string[];    // IDs of supporting bands that increase confidence
  overlappingGroups: string[];  // Other groups with overlapping ranges
  literatureSource: string;     // Reference citation
}

// ============================================================================
// FTIR Matching Types
// ============================================================================

export interface FtirBandMatch {
  referenceRange: FtirReferenceRange;
  observedBand: FtirDetectedBand;
  deltaFromCenter: number;      // Distance from range center (cm⁻¹)
  positionScore: number;        // How well positioned within range (0-1)
  widthScore: number;           // How well width matches expected (0-1)
  overallScore: number;         // Combined match score (0-1)
}

export interface FtirFunctionalGroupCandidate {
  functionalGroup: string;      // Functional group name (e.g., "Surface hydroxyl")
  assignment: string;           // Detailed assignment (e.g., "O–H stretching vibration")
  matches: FtirBandMatch[];     // Matched observed bands
  supportingBands: FtirBandMatch[];  // Supporting evidence bands
  score: number;                // Confidence score (0-1)
  confidenceLevel: 'high' | 'medium' | 'low';
  ambiguity: string | null;     // Ambiguity description if multiple candidates
}

// ============================================================================
// FTIR Processing Parameters
// ============================================================================

export interface FtirProcessingParams {
  // Baseline correction
  baselineMethod?: 'Polynomial' | 'Rubberband' | 'Linear';
  polynomialOrder?: number;     // 2-5 (for Polynomial method)
  baselineIterations?: number;  // 10-50 (for Rubberband method)
  
  // Smoothing
  smoothingMethod?: 'Savitzky-Golay' | 'Moving Average';
  smoothingWindowSize?: number; // 5-21 (odd)
  smoothingPolynomialOrder?: number;  // 2-4 (for Savitzky-Golay only)
  
  // Band detection
  bandProminence?: number;      // 0.01-0.5 (fraction of max intensity)
  bandMinDistance?: number;     // 10-50 cm⁻¹
  bandMinHeight?: number;       // 0.01-0.2
  
  // Band assignment
  wavenumberTolerance?: number; // 10-50 cm⁻¹
  useIntensity?: boolean;       // Use intensity in matching
  database?: 'Standard FTIR' | 'Custom';
  
  // Functional group matching
  requireSupportingBands?: boolean;  // Require supporting evidence
  ambiguityThreshold?: number;  // Score difference for ambiguity (0.1-0.3)
  
  // Display mode
  signalMode?: 'Absorbance' | 'Transmittance';
}

// ============================================================================
// FTIR Processing Result
// ============================================================================

export interface FtirInterpretation {
  dominantFunctionalGroups: string[];  // e.g., ["Surface hydroxyl", "Adsorbed water"]
  chemicalInterpretation: string;      // e.g., "Metal oxide catalyst with surface hydroxyl groups"
  decision: string;                    // Interpretation summary
  confidenceScore: number;             // 0-100
  confidenceLevel: 'high' | 'medium' | 'low';
  evidence: string[];                  // Top matched bands with supporting evidence
  ambiguities: string[];               // Overlapping regions, multiple candidates
  caveats: string[];                   // Limitations, uncertainties, artifacts
  summary: string;                     // One-line summary
}

export interface FtirExecutionLogEntry {
  step: string;
  timestamp: number;
  message: string;
  details?: any;
}

export interface FtirValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  pointCount: number;
  wavenumberRange: [number, number];
}

export interface FtirProcessingResult {
  // Processed signal data
  signal: {
    wavenumber: number[];
    absorbance: number[];
  };
  baseline: number[];
  
  // Detected and assigned bands
  bands: FtirDetectedBand[];
  
  // Band matches to reference ranges
  matches: FtirBandMatch[];
  
  // Functional group candidates
  functionalGroupCandidates: FtirFunctionalGroupCandidate[];
  
  // Interpretation
  interpretation: FtirInterpretation;
  
  // Validation results
  validation: FtirValidationResult;
  
  // Processing metadata
  executionLog: FtirExecutionLogEntry[];
  parametersUsed: FtirProcessingParams;
}

// ============================================================================
// FTIR Agent Input
// ============================================================================

export interface FtirAgentInput {
  datasetId: string;
  sampleName: string;
  sourceLabel: string;
  dataPoints: FtirPoint[];
}

// ============================================================================
// Scientific Reasoning Types
// ============================================================================

export interface FunctionalGroupEvidence {
  functionalGroup: string;
  primaryBands: FtirBandMatch[];
  supportingBands: FtirBandMatch[];
  evidenceStrength: number;  // 0-1
}

export interface AmbiguityReport {
  observedBand: FtirDetectedBand;
  candidates: FtirFunctionalGroupCandidate[];
  scoreDifference: number;
  description: string;  // e.g., "Overlapping carbonate/carboxylate region"
}

export interface StateAggregation {
  functionalGroup: string;
  matchedBands: string[];
  totalScore: number;
  weightedArea: number;
  diagnosticBandCount: number;
  hasPrimary: boolean;
  hasSupportingBands: boolean;
  hasAmbiguity: boolean;
  ambiguityEvidence: string[];
  matchedCount: number;
  confidence: 'high' | 'medium' | 'low';
  caveats: string[];
}
