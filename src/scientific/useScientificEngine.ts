import { useMemo } from 'react';
import type { ProcessingConfig, EngineState } from './types';
import { getCuFe2O4Dataset } from './demoDatasets';
import { processSpectrum } from './processing';
import { detectPeaks } from './peakDetection';
import { PHASE_LIBRARY } from './phaseLibrary';
import { matchPhases } from './phaseMatching';
import { computeConfidence } from './confidence';
import { generateInsight } from './insightEngine';
import { generateNotebookSummary } from './notebookSummary';

export const DEFAULT_CONFIG: ProcessingConfig = {
  smoothing: true,
  smoothingWindow: 5,
  baselineCorrection: true,
  baselineIterations: 20,
  normalization: true,
};

export function useScientificEngine(config: ProcessingConfig): EngineState {
  // Step 1: Dataset (stable — never changes)
  const dataset = useMemo(() => getCuFe2O4Dataset(), []);

  // Step 2: Processing (recomputes when config changes)
  const processed = useMemo(
    () => processSpectrum(dataset.points, config),
    [dataset, config],
  );

  // Step 3: Peak detection (recomputes when processed output changes)
  const peaks = useMemo(
    () => detectPeaks(processed.output),
    [processed.output],
  );

  // Step 4: Phase matching (recomputes when peaks change)
  const matches = useMemo(
    () => matchPhases(PHASE_LIBRARY, peaks),
    [peaks],
  );

  // Step 5: Best match
  const bestMatch = useMemo(
    () => (matches.length > 0 ? matches[0] : null),
    [matches],
  );

  // Step 6: Confidence scoring
  const confidence = useMemo(
    () => computeConfidence(bestMatch?.score ?? 0),
    [bestMatch],
  );

  // Step 7: Insight generation
  const insight = useMemo(
    () => generateInsight(bestMatch, confidence, peaks, matches),
    [bestMatch, confidence, peaks, matches],
  );

  // Step 8: Notebook summary
  const notebook = useMemo(
    () => generateNotebookSummary(dataset.sampleName, config, peaks, bestMatch, confidence),
    [dataset.sampleName, config, peaks, bestMatch, confidence],
  );

  return {
    dataset,
    config,
    processed,
    peaks,
    matches,
    bestMatch,
    confidence,
    insight,
    notebook,
  };
}
