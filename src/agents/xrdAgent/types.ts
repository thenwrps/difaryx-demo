export interface XrdPoint {
  x: number;
  y: number;
}

export type XrdConfidenceLevel = 'high' | 'medium' | 'low';

export interface XrdAgentInput {
  datasetId: string;
  sampleName: string;
  dataPoints: XrdPoint[];
  sourceLabel?: string;
}

export interface XrdValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  pointCount: number;
  xRange: [number, number] | null;
}

export interface XrdPreprocessedPoint {
  x: number;
  rawIntensity: number;
  smoothedIntensity: number;
  baselineIntensity: number;
  correctedIntensity: number;
  normalizedIntensity: number;
}

export interface XrdDetectedPeak {
  id: string;
  position: number;
  intensity: number;
  rawIntensity: number;
  prominence: number;
  fwhm: number;
  dSpacing: number;
  classification: 'sharp' | 'broad';
  label: string;
}

export interface XrdReferencePeak {
  position: number;
  relativeIntensity: number;
  hkl: string;
  dSpacing: number;
}

export interface XrdPhaseReference {
  id: string;
  name: string;
  formula: string;
  family: string;
  crystalSystem: 'cubic' | 'tetragonal' | 'hexagonal' | 'rhombohedral' | 'orthorhombic' | 'monoclinic' | 'triclinic';
  spaceGroup: string;
  latticeParameters: {
    a: number;
    b?: number;
    c?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
  };
  jcpdsCard?: string;
  icddPdf?: string;
  referenceNote: string;
  peaks: XrdReferencePeak[];
}

export interface XrdPeakMatch {
  referencePeak: XrdReferencePeak;
  observedPeak: XrdDetectedPeak;
  delta: number;
}

export interface XrdPhaseSearchResult {
  phase: XrdPhaseReference;
  matches: XrdPeakMatch[];
  missingPeaks: XrdReferencePeak[];
  explainedObservedPeakIds: string[];
}

export interface XrdPhaseCandidate extends XrdPhaseSearchResult {
  matchedReferencePeakRatio: number;
  strongestPeakAgreement: number;
  missingStrongPeakPenalty: number;
  unexplainedStrongPeakPenalty: number;
  score: number;
  confidenceLevel: XrdConfidenceLevel;
}

export interface XrdImpurityFlag {
  phase: XrdPhaseReference;
  explainedPeaks: XrdPeakMatch[];
  score: number;
  reason: string;
}

export interface XrdConflictAnalysis {
  primaryCandidate: XrdPhaseCandidate | null;
  missingStrongPeaks: XrdReferencePeak[];
  unexplainedPeaks: XrdDetectedPeak[];
  broadFeatures: XrdDetectedPeak[];
  possibleImpurities: XrdImpurityFlag[];
  ambiguousCandidates: XrdPhaseCandidate[];
  notes: string[];
}

export interface XrdInterpretation {
  primaryPhase: string;
  decision: string;
  confidenceScore: number;
  confidenceLevel: XrdConfidenceLevel;
  evidence: string[];
  conflicts: string[];
  caveats: string[];
  summary: string;
}

export interface XrdExecutionLogEntry {
  step: string;
  status: 'complete' | 'warning' | 'error';
  summary: string;
}

export interface XrdAgentResult {
  input: XrdAgentInput;
  validation: XrdValidationResult;
  preprocessedData: XrdPreprocessedPoint[];
  baselineData: XrdPoint[];
  detectedPeaks: XrdDetectedPeak[];
  candidates: XrdPhaseCandidate[];
  conflicts: XrdConflictAnalysis;
  interpretation: XrdInterpretation;
  executionLog: XrdExecutionLogEntry[];
}
