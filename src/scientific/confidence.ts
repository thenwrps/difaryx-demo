import type { ConfidenceResult, ConfidenceLabel } from './types';

export function computeConfidence(matchScore: number): ConfidenceResult {
  const score = Math.max(0, Math.min(100, matchScore));
  let label: ConfidenceLabel;
  if (score >= 85) label = 'Very High';
  else if (score >= 70) label = 'High';
  else if (score >= 50) label = 'Medium';
  else label = 'Low';
  return { score: Number(score.toFixed(1)), label };
}
