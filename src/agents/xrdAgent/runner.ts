import { XRD_PHASE_DATABASE } from '../../data/xrdPhaseDatabase';
import {
  calculateDSpacing,
  clamp,
  estimateNoise,
  movingAverage,
  rollingPercentileBaseline,
  roundTo,
} from '../../utils/xrdMath';
import {
  XrdAgentInput,
  XrdAgentResult,
  XrdConflictAnalysis,
  XrdConfidenceLevel,
  XrdDetectedPeak,
  XrdExecutionLogEntry,
  XrdInterpretation,
  XrdPeakMatch,
  XrdPhaseCandidate,
  XrdPhaseReference,
  XrdPhaseSearchResult,
  XrdPoint,
  XrdPreprocessedPoint,
  XrdReferencePeak,
  XrdValidationResult,
} from './types';

// Task 19.7: Peak position tolerance matching (±0.2° for XRD)
const MATCH_TOLERANCE = 0.2;

// Task 19.1: Strong peaks threshold (relative intensity > 30 weighted more heavily)
const STRONG_PEAK_THRESHOLD = 30;
const STRONG_OBSERVED_THRESHOLD = 28;

function confidenceLevel(score: number): XrdConfidenceLevel {
  if (score >= 0.85) return 'high';
  if (score >= 0.65) return 'medium';
  return 'low';
}

function emptyInterpretation(message: string): XrdInterpretation {
  return {
    primaryPhase: 'No assignment',
    decision: 'No defensible crystalline phase assignment.',
    confidenceScore: 0,
    confidenceLevel: 'low',
    evidence: [],
    conflicts: [message],
    caveats: ['The agent did not have enough valid XRD evidence to search the phase database.'],
    summary: message,
  };
}

function makeLog(step: string, status: XrdExecutionLogEntry['status'], summary: string): XrdExecutionLogEntry {
  return { step, status, summary };
}

function formatPeak(peak: { position: number; relativeIntensity?: number; intensity?: number; hkl?: string }) {
  const intensity = peak.relativeIntensity ?? peak.intensity ?? 0;
  return `${peak.position.toFixed(2)} 2theta${peak.hkl ? ` ${peak.hkl}` : ''} (${Math.round(intensity)})`;
}

function sortPoints(dataPoints: XrdPoint[]) {
  return [...dataPoints].sort((a, b) => a.x - b.x);
}

export function validate_xrd_input(input: XrdAgentInput): XrdValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validPoints = input.dataPoints.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (!input.datasetId) errors.push('Dataset id is required.');
  if (!input.sampleName) warnings.push('Sample name is missing; using dataset id as provenance.');
  if (validPoints.length < 80) errors.push('At least 80 numeric XRD points are required for peak detection.');
  if (validPoints.length !== input.dataPoints.length) warnings.push('Non-numeric rows were ignored during validation.');

  const sorted = sortPoints(validPoints);
  const xRange: [number, number] | null = sorted.length > 0 ? [sorted[0].x, sorted[sorted.length - 1].x] : null;

  if (xRange) {
    if (xRange[0] > 15 || xRange[1] < 70) {
      warnings.push('The 2theta range does not fully cover the 10-80 degree demo reference window.');
    }
    if (xRange[0] < 0 || xRange[1] > 130) {
      warnings.push('The 2theta range is unusual for the compact Cu K-alpha reference database.');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    pointCount: validPoints.length,
    xRange,
  };
}

export interface XrdProcessingParams {
  // Baseline correction parameters
  baselineRadius?: number;
  baselineFraction?: number;
  
  // Smoothing parameters
  smoothingRadius?: number;
  
  // Peak detection parameters
  minProminence?: number;
  minDistance?: number;
  minHeight?: number;
}

export interface XrdParameterImpact {
  // Applied parameters
  appliedParams: XrdProcessingParams | null;
  
  // Baseline impact
  baselineShift: {
    meanShift: number;
    maxShift: number;
    description: string;
  };
  
  // Peak detection impact
  peakCount: {
    detected: number;
    sharp: number;
    broad: number;
    description: string;
  };
  
  // Noise level
  noiseLevel: {
    estimated: number;
    description: string;
  };
  
  // Processing summary
  summary: string;
}

export function preprocess_xrd(dataPoints: XrdPoint[], params?: XrdProcessingParams): XrdPreprocessedPoint[] {
  const sorted = sortPoints(dataPoints).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  
  // Use provided smoothing radius or default to 2
  const smoothingRadius = params?.smoothingRadius ?? 2;
  const smoothed = movingAverage(sorted, smoothingRadius);
  
  // Use provided baseline parameters or defaults
  const baselineRadius = params?.baselineRadius ?? 42;
  const baselineFraction = params?.baselineFraction ?? 0.16;
  const baseline = rollingPercentileBaseline(smoothed, baselineRadius, baselineFraction);
  
  const corrected = smoothed.map((point, index) => Math.max(0, point.y - baseline[index].y));
  const maxCorrected = Math.max(...corrected, 1);

  return sorted.map((point, index) => ({
    x: roundTo(point.x, 3),
    rawIntensity: roundTo(point.y, 3),
    smoothedIntensity: roundTo(smoothed[index].y, 3),
    baselineIntensity: roundTo(baseline[index].y, 3),
    correctedIntensity: roundTo(corrected[index], 3),
    normalizedIntensity: roundTo((corrected[index] / maxCorrected) * 100, 3),
  }));
}

function interpolateHalfHeight(left: XrdPreprocessedPoint, right: XrdPreprocessedPoint, target: number) {
  const span = right.normalizedIntensity - left.normalizedIntensity;
  if (Math.abs(span) < 0.0001) return left.x;
  const fraction = (target - left.normalizedIntensity) / span;
  return left.x + (right.x - left.x) * clamp(fraction, 0, 1);
}

function findFwhm(data: XrdPreprocessedPoint[], index: number) {
  const apex = data[index].normalizedIntensity;
  const halfHeight = apex / 2;
  let leftIndex = index;
  let rightIndex = index;

  while (leftIndex > 0 && data[leftIndex].normalizedIntensity > halfHeight) {
    leftIndex -= 1;
  }

  while (rightIndex < data.length - 1 && data[rightIndex].normalizedIntensity > halfHeight) {
    rightIndex += 1;
  }

  const left = leftIndex === index
    ? data[index].x
    : interpolateHalfHeight(data[leftIndex], data[leftIndex + 1], halfHeight);
  const right = rightIndex === index
    ? data[index].x
    : interpolateHalfHeight(data[rightIndex - 1], data[rightIndex], halfHeight);

  return Math.max(0.05, right - left);
}

function localProminence(data: XrdPreprocessedPoint[], index: number, radius: number) {
  const start = Math.max(0, index - radius);
  const end = Math.min(data.length - 1, index + radius);
  let leftMin = data[index].normalizedIntensity;
  let rightMin = data[index].normalizedIntensity;

  for (let i = start; i <= index; i += 1) {
    leftMin = Math.min(leftMin, data[i].normalizedIntensity);
  }
  for (let i = index; i <= end; i += 1) {
    rightMin = Math.min(rightMin, data[i].normalizedIntensity);
  }

  return data[index].normalizedIntensity - Math.max(leftMin, rightMin);
}

function mergeNearbyPeaks(peaks: XrdDetectedPeak[], minSeparation: number) {
  const merged: XrdDetectedPeak[] = [];

  peaks.forEach((peak) => {
    const nearbyIndex = merged.findIndex((item) => Math.abs(item.position - peak.position) < minSeparation);
    if (nearbyIndex === -1) {
      merged.push(peak);
      return;
    }

    if (peak.intensity > merged[nearbyIndex].intensity) {
      merged[nearbyIndex] = peak;
    }
  });

  return merged.sort((a, b) => a.position - b.position).map((peak, index) => ({
    ...peak,
    id: `p${index + 1}`,
    label: peak.classification === 'broad' ? `broad feature ${index + 1}` : `peak ${index + 1}`,
  }));
}

export function detect_xrd_peaks(preprocessedData: XrdPreprocessedPoint[], params?: XrdProcessingParams): XrdDetectedPeak[] {
  if (preprocessedData.length < 5) return [];

  const normalizedValues = preprocessedData.map((point) => point.normalizedIntensity);
  const noise = estimateNoise(normalizedValues);
  
  // Use provided parameters or defaults
  const minHeight = params?.minHeight ?? Math.max(5.5, noise * 4);
  const minProminence = params?.minProminence ?? Math.max(3.2, noise * 3.5);
  const minSeparation = params?.minDistance ?? 0.44;
  
  const candidates: XrdDetectedPeak[] = [];

  for (let i = 2; i < preprocessedData.length - 2; i += 1) {
    const previous = preprocessedData[i - 1].normalizedIntensity;
    const current = preprocessedData[i].normalizedIntensity;
    const next = preprocessedData[i + 1].normalizedIntensity;

    if (current < minHeight || current <= previous || current < next) continue;

    const prominence = localProminence(preprocessedData, i, 18);
    if (prominence < minProminence) continue;

    const fwhm = findFwhm(preprocessedData, i);
    const position = preprocessedData[i].x;

    candidates.push({
      id: `candidate-${i}`,
      position: roundTo(position, 3),
      intensity: roundTo(current, 1),
      rawIntensity: roundTo(preprocessedData[i].rawIntensity, 3),
      prominence: roundTo(prominence, 2),
      fwhm: roundTo(fwhm, 3),
      dSpacing: roundTo(calculateDSpacing(position), 4),
      classification: fwhm > 1.25 ? 'broad' : 'sharp',
      label: 'peak',
    });
  }

  return mergeNearbyPeaks(candidates, minSeparation);
}

function matchReferencePeaks(phase: XrdPhaseReference, observedPeaks: XrdDetectedPeak[]): XrdPhaseSearchResult {
  const sharpPeaks = observedPeaks.filter((peak) => peak.classification === 'sharp');
  const usedPeakIds = new Set<string>();
  const matches: XrdPeakMatch[] = [];
  const missingPeaks: XrdReferencePeak[] = [];

  phase.peaks.forEach((referencePeak) => {
    const possibleMatches = sharpPeaks
      .filter((peak) => !usedPeakIds.has(peak.id))
      .map((peak) => ({
        peak,
        delta: Math.abs(peak.position - referencePeak.position),
      }))
      .filter((item) => item.delta <= MATCH_TOLERANCE)
      .sort((a, b) => a.delta - b.delta);

    const best = possibleMatches[0];
    if (!best) {
      missingPeaks.push(referencePeak);
      return;
    }

    usedPeakIds.add(best.peak.id);
    matches.push({
      referencePeak,
      observedPeak: best.peak,
      delta: roundTo(best.delta, 3),
    });
  });

  return {
    phase,
    matches,
    missingPeaks,
    explainedObservedPeakIds: [...usedPeakIds],
  };
}

export function search_phase_database(
  detectedPeaks: XrdDetectedPeak[],
  phaseDatabase: XrdPhaseReference[] = XRD_PHASE_DATABASE,
): XrdPhaseSearchResult[] {
  return phaseDatabase.map((phase) => matchReferencePeaks(phase, detectedPeaks));
}

// Task 19.1: Implement weighted scoring for strong peaks
// Strong peaks (relative intensity > 30) are weighted more heavily in the confidence calculation
function calculateWeightedPeakScore(matches: XrdPeakMatch[], phase: XrdPhaseReference): number {
  if (phase.peaks.length === 0) return 0;

  let totalWeight = 0;
  let matchedWeight = 0;

  phase.peaks.forEach((referencePeak) => {
    // Strong peaks get weight of 2.0, weak peaks get weight of 1.0
    const weight = referencePeak.relativeIntensity > STRONG_PEAK_THRESHOLD ? 2.0 : 1.0;
    totalWeight += weight;

    const isMatched = matches.some((match) => match.referencePeak === referencePeak);
    if (isMatched) {
      matchedWeight += weight;
    }
  });

  return totalWeight > 0 ? matchedWeight / totalWeight : 0;
}

// Task 19.1: Calculate strong peak match ratio for threshold rules
function calculateStrongPeakMatchRatio(matches: XrdPeakMatch[], phase: XrdPhaseReference): number {
  const strongReferencePeaks = phase.peaks.filter((peak) => peak.relativeIntensity > STRONG_PEAK_THRESHOLD);
  if (strongReferencePeaks.length === 0) return 1.0; // No strong peaks to match

  const matchedStrongPeaks = strongReferencePeaks.filter((referencePeak) =>
    matches.some((match) => match.referencePeak === referencePeak),
  );

  return matchedStrongPeaks.length / strongReferencePeaks.length;
}

// Task 19.2: Implement penalty for missing strong peaks
// Reduces confidence when strong reference peaks (relative intensity > 30) are not matched
function calculateMissingStrongPeaksPenalty(matches: XrdPeakMatch[], phase: XrdPhaseReference): number {
  const strongReferencePeaks = phase.peaks.filter((peak) => peak.relativeIntensity > STRONG_PEAK_THRESHOLD);
  if (strongReferencePeaks.length === 0) return 0;

  const missingStrongPeaks = strongReferencePeaks.filter(
    (referencePeak) => !matches.some((match) => match.referencePeak === referencePeak),
  );

  // Penalty is proportional to the number of missing strong peaks
  return missingStrongPeaks.length / strongReferencePeaks.length;
}

// Task 19.3: Implement penalty for unexplained peaks
// Reduces confidence when observed peaks cannot be matched to reference
function calculateUnexplainedPeaksPenalty(explainedPeakIds: string[], detectedPeaks: XrdDetectedPeak[]): number {
  const sharpPeaks = detectedPeaks.filter((peak) => peak.classification === 'sharp');
  if (sharpPeaks.length === 0) return 0;

  const explained = new Set(explainedPeakIds);
  const unexplainedPeaks = sharpPeaks.filter((peak) => !explained.has(peak.id));

  // Penalty is proportional to the number of unexplained peaks
  return unexplainedPeaks.length / sharpPeaks.length;
}

export function score_phase_candidates(
  searchResults: XrdPhaseSearchResult[],
  detectedPeaks: XrdDetectedPeak[],
): XrdPhaseCandidate[] {
  return searchResults
    .map((result) => {
      // Task 19.1: Calculate weighted peak score (strong peaks weighted more heavily)
      const weightedPeakScore = calculateWeightedPeakScore(result.matches, result.phase);

      // Calculate basic match ratio
      const matchedReferencePeakRatio = result.phase.peaks.length > 0
        ? result.matches.length / result.phase.peaks.length
        : 0;

      // Task 19.1: Calculate strong peak match ratio for threshold rules
      const strongPeakMatchRatio = calculateStrongPeakMatchRatio(result.matches, result.phase);

      // Task 19.2: Calculate penalty for missing strong peaks
      const missingStrongPeakPenalty = calculateMissingStrongPeaksPenalty(result.matches, result.phase);

      // Task 19.3: Calculate penalty for unexplained peaks
      const unexplainedPeakPenalty = calculateUnexplainedPeaksPenalty(result.explainedObservedPeakIds, detectedPeaks);

      // Calculate raw score using weighted components
      let rawScore = clamp(
        weightedPeakScore * 0.50 +
          matchedReferencePeakRatio * 0.30 -
          missingStrongPeakPenalty * 0.15 -
          unexplainedPeakPenalty * 0.15,
        0,
        1,
      );

      // Task 19.5: Implement confidence threshold rules
      // Confidence > 85% only when ≥80% of strong peaks matched
      if (rawScore > 0.85 && strongPeakMatchRatio < 0.80) {
        rawScore = Math.min(rawScore, 0.85);
      }

      // Confidence < 50% when <50% of reference peaks matched
      if (matchedReferencePeakRatio < 0.50) {
        rawScore = Math.min(rawScore, 0.49);
      }

      const score = roundTo(rawScore, 3);

      // Store strong peaks for conflict analysis
      const strongReferencePeaks = result.phase.peaks.filter((peak) => peak.relativeIntensity > STRONG_PEAK_THRESHOLD);
      const missingStrongPeaks = result.missingPeaks.filter((peak) => peak.relativeIntensity > STRONG_PEAK_THRESHOLD);

      return {
        ...result,
        matchedReferencePeakRatio: roundTo(matchedReferencePeakRatio, 3),
        strongestPeakAgreement: roundTo(weightedPeakScore, 3), // Reusing field for weighted score
        missingStrongPeakPenalty: roundTo(missingStrongPeakPenalty, 3),
        unexplainedStrongPeakPenalty: roundTo(unexplainedPeakPenalty, 3),
        score,
        confidenceLevel: confidenceLevel(score),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function findImpurityFlags(candidates: XrdPhaseCandidate[], primary: XrdPhaseCandidate | null, unexplainedPeaks: XrdDetectedPeak[]) {
  if (!primary || unexplainedPeaks.length === 0) return [];

  const unexplainedIds = new Set(unexplainedPeaks.map((peak) => peak.id));

  return candidates
    .filter((candidate) => candidate.phase.id !== primary.phase.id)
    .map((candidate) => {
      const explainedPeaks = candidate.matches.filter((match) => unexplainedIds.has(match.observedPeak.id));
      const strongExplained = explainedPeaks.filter((match) => match.observedPeak.intensity >= STRONG_OBSERVED_THRESHOLD);
      return {
        phase: candidate.phase,
        explainedPeaks,
        score: candidate.score,
        reason: `${candidate.phase.name} explains ${explainedPeaks.length} unexplained peak(s), including ${strongExplained.length} strong feature(s).`,
      };
    })
    .filter((flag) => flag.explainedPeaks.length >= 2 || flag.explainedPeaks.some((match) => match.observedPeak.intensity >= 45))
    .sort((a, b) => b.explainedPeaks.length - a.explainedPeaks.length)
    .slice(0, 3);
}

export function analyze_peak_conflicts(candidates: XrdPhaseCandidate[], detectedPeaks: XrdDetectedPeak[]): XrdConflictAnalysis {
  const primaryCandidate = candidates[0] ?? null;
  const explained = new Set(primaryCandidate?.explainedObservedPeakIds ?? []);
  const unexplainedPeaks = detectedPeaks.filter((peak) => !explained.has(peak.id) && peak.intensity >= 12);
  const broadFeatures = detectedPeaks.filter((peak) => peak.classification === 'broad');
  const missingStrongPeaks = primaryCandidate
    ? primaryCandidate.missingPeaks.filter((peak) => peak.relativeIntensity > STRONG_PEAK_THRESHOLD)
    : [];

  // Task 19.6: Enhanced ambiguity detection
  // Flag cases where multiple phases have similar confidence scores (within 5%)
  const ambiguousCandidates = primaryCandidate
    ? candidates.filter((candidate) => 
        candidate.phase.id !== primaryCandidate.phase.id && 
        primaryCandidate.score - candidate.score <= 0.05
      )
    : [];

  const possibleImpurities = findImpurityFlags(candidates, primaryCandidate, unexplainedPeaks);
  const notes: string[] = [];

  if (broadFeatures.length > 0) {
    notes.push('Broad scattering is present and is treated as uncertainty rather than a crystalline phase peak.');
  }
  if (missingStrongPeaks.length > 0) {
    notes.push('One or more strong reference peaks are missing from the observed trace.');
  }
  if (unexplainedPeaks.length > 0) {
    notes.push('Observed peaks remain unexplained by the primary phase assignment.');
  }

  // Task 19.6: Add recommendation for complementary techniques when ambiguity is detected
  if (ambiguousCandidates.length > 0) {
    notes.push(
      `Multiple phases have similar confidence scores (within 5%). ` +
      `Recommend complementary techniques (XPS for oxidation states, FTIR/Raman for vibrational modes) ` +
      `to resolve ambiguity between ${primaryCandidate?.phase.name} and ${ambiguousCandidates.map(c => c.phase.name).join(', ')}.`
    );
  }

  return {
    primaryCandidate,
    missingStrongPeaks,
    unexplainedPeaks,
    broadFeatures,
    possibleImpurities,
    ambiguousCandidates,
    notes,
  };
}

export function generate_xrd_interpretation(conflicts: XrdConflictAnalysis, candidates: XrdPhaseCandidate[]): XrdInterpretation {
  const primary = conflicts.primaryCandidate;
  if (!primary) return emptyInterpretation('No phase candidates were generated.');

  const confidenceScore = roundTo(primary.score * 100, 1);
  const phaseClaim = primary.score >= 0.65
    ? primary.phase.name
    : `Best low-confidence candidate: ${primary.phase.name}`;
  
  // Enhanced evidence with crystallographic metadata
  const matchedEvidence = primary.matches
    .sort((a, b) => b.referencePeak.relativeIntensity - a.referencePeak.relativeIntensity)
    .slice(0, 5)
    .map((match) =>
      `${match.observedPeak.position.toFixed(2)}° 2θ matches ${primary.phase.name} ${match.referencePeak.hkl} reflection at ${match.referencePeak.position.toFixed(2)}° (Δ2θ = ${match.delta.toFixed(2)}°, d = ${match.referencePeak.dSpacing.toFixed(3)} Å).`,
    );
  
  const conflictsText = [
    ...conflicts.missingStrongPeaks.map((peak) => `Missing strong ${primary.phase.name} reference peak ${formatPeak(peak)}.`),
    ...conflicts.unexplainedPeaks.slice(0, 6).map((peak) => `Unexplained observed ${peak.classification} feature at ${peak.position.toFixed(2)}° 2θ with relative intensity ${peak.intensity.toFixed(1)}.`),
    ...conflicts.possibleImpurities.map((flag) => `Possible impurity: ${flag.phase.name}; ${flag.reason}`),
    ...conflicts.ambiguousCandidates.slice(0, 3).map((candidate) => `Ambiguous close candidate: ${candidate.phase.name} scored ${(candidate.score * 100).toFixed(1)}%.`),
  ];
  
  // Enhanced caveats with crystallographic metadata and limitations
  const caveats = [
    ...conflicts.notes,
    `Crystallographic data: ${primary.phase.crystalSystem} crystal system, space group ${primary.phase.spaceGroup}, lattice parameter a = ${primary.phase.latticeParameters.a.toFixed(3)} Å.`,
    `Reference: JCPDS card ${primary.phase.jcpdsCard || 'not specified'}.`,
    'XRD provides bulk crystallographic information; peak positions matched using ±0.2° tolerance.',
    'Reference matching is position-based and deterministic; intensity differences are used only through the configured score.',
  ];
  
  // Enhanced decision with crystallographic context
  const decision = primary.score >= 0.85
    ? `${primary.phase.name} (${primary.phase.crystalSystem}, space group ${primary.phase.spaceGroup}) is strongly supported by the detected XRD peaks.`
    : primary.score >= 0.65
      ? `${primary.phase.name} (${primary.phase.crystalSystem}, space group ${primary.phase.spaceGroup}) is supported, but conflicts or ambiguity reduce confidence.`
      : `No confident phase claim: ${primary.phase.name} is only a low-confidence best match.`;

  return {
    primaryPhase: phaseClaim,
    decision,
    confidenceScore,
    confidenceLevel: primary.confidenceLevel,
    evidence: matchedEvidence.length > 0 ? matchedEvidence : ['No reference peaks matched within tolerance.'],
    conflicts: conflictsText.length > 0 ? conflictsText : ['No strong missing or unexplained peaks were detected for the primary phase.'],
    caveats,
    summary: `${decision} Score ${confidenceScore.toFixed(1)}% from ${primary.matches.length}/${primary.phase.peaks.length} matched reference peaks.`,
  };
}

export function runXrdPhaseIdentificationAgent(input: XrdAgentInput, params?: XrdProcessingParams): XrdAgentResult {
  const executionLog: XrdExecutionLogEntry[] = [];
  const validation = validate_xrd_input(input);
  executionLog.push(makeLog(
    'validate_xrd_input',
    validation.ok ? (validation.warnings.length > 0 ? 'warning' : 'complete') : 'error',
    validation.ok
      ? `Validated ${validation.pointCount} numeric points over ${validation.xRange?.[0].toFixed(1)}-${validation.xRange?.[1].toFixed(1)} 2theta.`
      : validation.errors.join(' '),
  ));

  if (!validation.ok) {
    const interpretation = emptyInterpretation(validation.errors.join(' '));
    return {
      input,
      validation,
      preprocessedData: [],
      baselineData: [],
      detectedPeaks: [],
      candidates: [],
      conflicts: {
        primaryCandidate: null,
        missingStrongPeaks: [],
        unexplainedPeaks: [],
        broadFeatures: [],
        possibleImpurities: [],
        ambiguousCandidates: [],
        notes: validation.errors,
      },
      interpretation,
      executionLog,
    };
  }

  // Preprocess with custom or default parameters
  const preprocessedData = preprocess_xrd(input.dataPoints, params);
  const baselineData = preprocessedData.map((point) => ({ x: point.x, y: point.baselineIntensity }));
  
  // Calculate baseline shift for parameter impact tracking
  const baselineShifts = preprocessedData.map(p => p.rawIntensity - p.baselineIntensity);
  const meanBaselineShift = baselineShifts.reduce((sum, val) => sum + val, 0) / baselineShifts.length;
  const maxBaselineShift = Math.max(...baselineShifts);
  
  executionLog.push(makeLog(
    'preprocess_xrd',
    'complete',
    'Applied moving-average smoothing, rolling-percentile baseline correction, and max-intensity normalization.',
  ));

  // Detect peaks with custom or default parameters
  const detectedPeaks = detect_xrd_peaks(preprocessedData, params);
  const sharpCount = detectedPeaks.filter((peak) => peak.classification === 'sharp').length;
  const broadCount = detectedPeaks.length - sharpCount;
  
  // Estimate noise level for parameter impact tracking
  const normalizedValues = preprocessedData.map((point) => point.normalizedIntensity);
  const noiseLevel = estimateNoise(normalizedValues);
  
  executionLog.push(makeLog(
    'detect_xrd_peaks',
    detectedPeaks.length > 0 ? 'complete' : 'warning',
    `Detected ${sharpCount} sharp peak(s) and ${broadCount} broad feature(s) from the processed trace.`,
  ));

  const searchResults = search_phase_database(detectedPeaks);
  executionLog.push(makeLog(
    'search_phase_database',
    'complete',
    `Searched ${XRD_PHASE_DATABASE.length} reference phases without adding inferred peaks.`,
  ));

  const candidates = score_phase_candidates(searchResults, detectedPeaks);
  executionLog.push(makeLog(
    'score_phase_candidates',
    candidates[0]?.score ? 'complete' : 'warning',
    candidates[0]
      ? `Top score: ${candidates[0].phase.name} at ${(candidates[0].score * 100).toFixed(1)}%.`
      : 'No candidate produced a non-zero score.',
  ));

  const conflicts = analyze_peak_conflicts(candidates, detectedPeaks);
  executionLog.push(makeLog(
    'analyze_peak_conflicts',
    conflicts.notes.length > 0 ? 'warning' : 'complete',
    conflicts.notes.length > 0
      ? conflicts.notes.join(' ')
      : 'No missing strong peaks or unexplained strong observed peaks found for the primary candidate.',
  ));

  const interpretation = generate_xrd_interpretation(conflicts, candidates);
  executionLog.push(makeLog(
    'generate_xrd_interpretation',
    interpretation.confidenceLevel === 'low' ? 'warning' : 'complete',
    interpretation.summary,
  ));

  // Build parameter impact tracking (only when custom params provided)
  const parameterImpact = params ? {
    appliedParams: params,
    baselineShift: {
      meanShift: roundTo(meanBaselineShift, 2),
      maxShift: roundTo(maxBaselineShift, 2),
      description: `Baseline removed ${meanBaselineShift.toFixed(1)} counts on average (max: ${maxBaselineShift.toFixed(1)})`,
    },
    peakCount: {
      detected: detectedPeaks.length,
      sharp: sharpCount,
      broad: broadCount,
      description: `Detected ${detectedPeaks.length} total peaks (${sharpCount} sharp, ${broadCount} broad)`,
    },
    noiseLevel: {
      estimated: roundTo(noiseLevel, 3),
      description: `Estimated noise level: ${noiseLevel.toFixed(2)} (normalized intensity units)`,
    },
    summary: `Parameters: baseline radius=${params.baselineRadius ?? 42}, smoothing radius=${params.smoothingRadius ?? 2}, min prominence=${params.minProminence?.toFixed(1) ?? 'auto'}, min distance=${params.minDistance ?? 0.44}°`,
  } : undefined;

  return {
    input,
    validation,
    preprocessedData,
    baselineData,
    detectedPeaks,
    candidates,
    conflicts,
    interpretation,
    executionLog,
    parameterImpact,
  };
}
