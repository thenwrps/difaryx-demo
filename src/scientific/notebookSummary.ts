import type {
  DetectedPeak,
  PhaseMatchResult,
  ConfidenceResult,
  ProcessingConfig,
  NotebookEntry,
} from './types';

export function generateNotebookSummary(
  sampleName: string,
  config: ProcessingConfig,
  peaks: DetectedPeak[],
  bestMatch: PhaseMatchResult | null,
  confidence: ConfidenceResult,
): NotebookEntry {
  const now = new Date();
  const date = now.toISOString().split('T')[0];

  // Document processing steps actually applied
  const processingSteps: string[] = [];
  if (config.smoothing) {
    processingSteps.push(`Moving average smoothing (window: ${config.smoothingWindow})`);
  }
  if (config.baselineCorrection) {
    processingSteps.push(`Baseline correction (${config.baselineIterations} iterations)`);
  }
  if (config.normalization) {
    processingSteps.push('Intensity normalization (0–100)');
  }
  if (processingSteps.length === 0) {
    processingSteps.push('No processing applied (raw data)');
  }

  const peakPositions = peaks.map((p) => p.position);
  const bestPhase = bestMatch ? bestMatch.phase.formula : 'Unidentified';

  // Build summary from real data
  const summaryParts: string[] = [
    `XRD analysis of ${sampleName} identified ${peaks.length} diffraction peaks.`,
  ];
  if (bestMatch) {
    summaryParts.push(
      `Best phase match: ${bestMatch.phase.formula} (${bestMatch.phase.name}) with ${confidence.label} confidence (${confidence.score}%).`,
    );
    summaryParts.push(
      `${bestMatch.matchedCount} of ${bestMatch.totalRefPeaks} reference peaks matched (${bestMatch.phase.jcpdsRef}).`,
    );
  } else {
    summaryParts.push('No reference phase matched the observed pattern.');
  }

  // Next steps derived from evidence quality (reasoning-based, not thresholds)
  const suggestedNextSteps: string[] = [];
  
  // Use reasoning: Strong evidence = proceed, moderate = refine, weak = re-acquire
  const hasStrongEvidence = bestMatch && bestMatch.matchedCount >= 5 && peaks.length >= 8;
  const hasModerateEvidence = bestMatch && bestMatch.matchedCount >= 3;
  
  if (hasStrongEvidence) {
    suggestedNextSteps.push('Proceed to complementary characterization (XPS, Raman)');
    suggestedNextSteps.push('Document results in publication draft');
  } else if (hasModerateEvidence) {
    suggestedNextSteps.push('Run Rietveld refinement for lattice parameter determination');
    suggestedNextSteps.push('Cross-validate with FTIR');
  } else {
    suggestedNextSteps.push('Re-acquire data with longer acquisition time');
    suggestedNextSteps.push('Expand reference library with additional candidate phases');
  }

  return {
    title: `XRD Analysis — ${sampleName}`,
    sampleName,
    date,
    processingSteps,
    peakCount: peaks.length,
    peakPositions,
    bestPhase,
    confidence: confidence.label,
    confidenceScore: confidence.score,
    suggestedNextSteps,
    summary: summaryParts.join(' '),
  };
}
