// ── Spectrum primitives ──────────────────────────────────────────────

export interface SpectrumPoint {
  x: number; // 2θ in degrees (XRD)
  y: number; // intensity (a.u.)
}

export interface RawDataset {
  id: string;
  label: string;
  technique: 'XRD' | 'XPS' | 'FTIR' | 'Raman';
  sampleName: string;
  xUnit: string;
  yUnit: string;
  points: SpectrumPoint[];
}

// ── Processing ───────────────────────────────────────────────────────

export interface ProcessingConfig {
  smoothing: boolean;
  smoothingWindow: number;       // odd integer, default 5
  baselineCorrection: boolean;
  baselineIterations: number;    // default 20
  normalization: boolean;
}

export interface ProcessedResult {
  raw: SpectrumPoint[];
  smoothed: SpectrumPoint[];
  baseline: SpectrumPoint[];
  corrected: SpectrumPoint[];   // after baseline subtraction
  normalized: SpectrumPoint[];  // final output
  output: SpectrumPoint[];      // whichever stage is "final" given config
}

// ── Peak detection ───────────────────────────────────────────────────

export interface DetectedPeak {
  position: number;   // 2θ
  intensity: number;  // height after processing
  fwhm: number;       // full width at half maximum
  area: number;       // estimated integral
}

// ── Phase library ────────────────────────────────────────────────────

export interface ReferencePeak {
  hkl: string;
  position: number;       // 2θ
  relativeIntensity: number; // 0–100
}

export interface PhaseEntry {
  id: string;
  name: string;
  formula: string;
  crystalSystem: string;
  jcpdsRef: string;
  peaks: ReferencePeak[];
}

// ── Phase matching ───────────────────────────────────────────────────

export interface PeakMatchDetail {
  referencePeak: ReferencePeak;
  matchedPeak: DetectedPeak | null;
  delta: number | null;          // 2θ deviation
}

export interface PhaseMatchResult {
  phase: PhaseEntry;
  score: number;                 // 0–100
  matchedCount: number;
  totalRefPeaks: number;
  details: PeakMatchDetail[];
}

// ── Confidence ───────────────────────────────────────────────────────

export type ConfidenceLabel = 'Low' | 'Medium' | 'High' | 'Very High';

export interface ConfidenceResult {
  score: number;        // 0–100
  label: ConfidenceLabel;
}

// ── Insight ──────────────────────────────────────────────────────────

/**
 * @deprecated This type is deprecated. Use FusionResult from fusionEngine instead.
 */
export interface ScientificInsight {
  primaryResult: string;
  confidenceScore: number;
  confidenceLevel: string;
  interpretation: string;
  keyEvidence: string[];
  warnings: string[];
  uncertainty: string;
  recommendedNextStep: string[];
}

// ── Notebook ─────────────────────────────────────────────────────────

export interface NotebookEntry {
  title: string;
  sampleName: string;
  date: string;
  processingSteps: string[];
  peakCount: number;
  peakPositions: number[];
  bestPhase: string;
  confidence: string;
  confidenceScore: number;
  suggestedNextSteps: string[];
  summary: string;
}

// ── Engine aggregate ─────────────────────────────────────────────────

export interface EngineState {
  dataset: RawDataset;
  config: ProcessingConfig;
  processed: ProcessedResult;
  peaks: DetectedPeak[];
  matches: PhaseMatchResult[];
  bestMatch: PhaseMatchResult | null;
  confidence: ConfidenceResult;
  insight: ScientificInsight;
  notebook: NotebookEntry;
}
