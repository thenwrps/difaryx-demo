import type {
  DetectedPeak,
  PhaseEntry,
  PhaseMatchResult,
  PeakMatchDetail,
} from './types';

interface MatchConfig {
  /** Maximum 2θ deviation to consider a match. Default 0.5° */
  tolerance: number;
  /** Penalty weight for missing peaks with relativeIntensity > this threshold. Default 30 */
  strongPeakThreshold: number;
}

const DEFAULT_CONFIG: MatchConfig = {
  tolerance: 0.5,
  strongPeakThreshold: 30,
};

function matchPhase(
  phase: PhaseEntry,
  detected: DetectedPeak[],
  config: MatchConfig,
): PhaseMatchResult {
  const details: PeakMatchDetail[] = [];
  let weightedMatchSum = 0;
  let totalWeight = 0;
  let missingStrongPenalty = 0;

  for (const refPeak of phase.peaks) {
    totalWeight += refPeak.relativeIntensity;

    // Find closest detected peak within tolerance
    let bestMatch: DetectedPeak | null = null;
    let bestDelta = Infinity;

    for (const dp of detected) {
      const delta = Math.abs(dp.position - refPeak.position);
      if (delta < bestDelta && delta <= config.tolerance) {
        bestDelta = delta;
        bestMatch = dp;
      }
    }

    if (bestMatch) {
      // Score: weighted by reference intensity, penalized by position deviation
      const positionQuality = 1 - bestDelta / config.tolerance;
      weightedMatchSum += refPeak.relativeIntensity * positionQuality;
      details.push({
        referencePeak: refPeak,
        matchedPeak: bestMatch,
        delta: Number(bestDelta.toFixed(3)),
      });
    } else {
      // Missing peak
      if (refPeak.relativeIntensity >= config.strongPeakThreshold) {
        missingStrongPenalty += refPeak.relativeIntensity * 0.5;
      }
      details.push({
        referencePeak: refPeak,
        matchedPeak: null,
        delta: null,
      });
    }
  }

  const rawScore = totalWeight > 0 ? (weightedMatchSum / totalWeight) * 100 : 0;
  const score = Math.max(0, Math.min(100, rawScore - missingStrongPenalty));
  const matchedCount = details.filter((d) => d.matchedPeak !== null).length;

  return {
    phase,
    score: Number(score.toFixed(1)),
    matchedCount,
    totalRefPeaks: phase.peaks.length,
    details,
  };
}

// ── Public API ────────────────────────────────────────────────────────

export function matchPhases(
  phases: PhaseEntry[],
  detected: DetectedPeak[],
  userConfig?: Partial<MatchConfig>,
): PhaseMatchResult[] {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const results = phases.map((phase) => matchPhase(phase, detected, config));
  results.sort((a, b) => b.score - a.score);
  return results;
}
