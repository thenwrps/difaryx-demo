import type { ConfidenceResult, ConfidenceLabel } from './types';

/**
 * DEPRECATED: This function uses numeric thresholds which have been replaced
 * by reasoning-based claim status evaluation in the fusion engine.
 * 
 * This file is kept for backward compatibility but should not be used
 * for new code. Use the fusion engine's evidence-based reasoning instead.
 */
export function computeConfidence(matchScore: number): ConfidenceResult {
  const score = Math.max(0, Math.min(100, matchScore));
  
  // Legacy mapping - DO NOT USE for new implementations
  // Use fusion engine's reasoning-based approach instead
  let label: ConfidenceLabel;
  if (score >= 85) label = 'Very High';
  else if (score >= 70) label = 'High';
  else if (score >= 50) label = 'Medium';
  else label = 'Low';
  
  return { score: Number(score.toFixed(1)), label };
}
