/**
 * @deprecated This module is deprecated. Use fusionEngine instead.
 */

import type {
  PhaseMatchResult,
  ConfidenceResult,
  DetectedPeak,
  ScientificInsight,
} from './types';

export function generateInsight(
  bestMatch: PhaseMatchResult | null,
  confidence: ConfidenceResult,
  peaks: DetectedPeak[],
  allMatches: PhaseMatchResult[],
): ScientificInsight {
  if (!bestMatch) {
    return {
      primaryResult: 'No Phase Match',
      confidenceScore: 0,
      confidenceLevel: 'Low',
      interpretation: 'No reference phases could be matched to the detected peaks. The sample may contain an unindexed or amorphous phase.',
      keyEvidence: [`${peaks.length} peaks detected but none matched reference library`],
      warnings: ['No match found in the current reference library'],
      uncertainty: 'Very High',
      recommendedNextStep: ['Expand reference database', 'Check sample preparation'],
    };
  }

  const phase = bestMatch.phase;
  const matched = bestMatch.details.filter((d) => d.matchedPeak !== null);
  const missing = bestMatch.details.filter((d) => d.matchedPeak === null);

  // Build interpretation paragraph from computed values with enhanced crystallographic metadata
  const matchRatio = `${bestMatch.matchedCount}/${bestMatch.totalRefPeaks}`;
  const interpretation = [
    `The XRD pattern shows ${confidence.label.toLowerCase()} agreement with ${phase.formula} (${phase.name}, ${phase.crystalSystem} crystal system, space group ${phase.spaceGroup}).`,
    `${matchRatio} reference peaks were matched within ±0.2° tolerance.`,
    `The strongest diffraction line at the ${phase.peaks.find((p) => p.relativeIntensity === 100)?.hkl || '(311)'} plane is ${matched.some((d) => d.referencePeak.relativeIntensity === 100) ? 'confirmed' : 'not confirmed'}.`,
    `Lattice parameter: a = ${phase.latticeParameters.a.toFixed(3)} Å.`,
    `Reference: ${phase.jcpdsCard ? `JCPDS card ${phase.jcpdsCard}` : phase.referenceNote}.`,
  ].join(' ');

  // Build evidence from actual matched peaks
  const keyEvidence = matched.map((d) => {
    const dir = d.delta !== null && d.delta > 0 ? '+' : '';
    return `Peak at ${d.matchedPeak!.position}° matches ${d.referencePeak.hkl} plane (ref: ${d.referencePeak.position}°, Δ2θ = ${dir}${d.delta?.toFixed(3)}°)`;
  });

  // Warnings from computation with enhanced scientific context
  const warnings: string[] = [];
  if (missing.length > 0) {
    const missingStrong = missing.filter((d) => d.referencePeak.relativeIntensity >= 30);
    if (missingStrong.length > 0) {
      warnings.push(
        `${missingStrong.length} strong reference peak(s) not detected: ${missingStrong.map((d) => `${d.referencePeak.hkl} at ${d.referencePeak.position}°`).join(', ')}`,
      );
    }
  }

  const extraPeaks = peaks.filter((p) => {
    return !matched.some((d) => d.matchedPeak && Math.abs(d.matchedPeak.position - p.position) < 0.3);
  });
  if (extraPeaks.length > 0) {
    warnings.push(
      `${extraPeaks.length} unindexed peak(s) detected at ${extraPeaks.slice(0, 3).map((p) => `${p.position}°`).join(', ')}${extraPeaks.length > 3 ? '…' : ''} — possible secondary phase or impurity`,
    );
  }

  if (allMatches.length >= 2) {
    const second = allMatches[1];
    if (second.score > bestMatch.score * 0.8) {
      warnings.push(
        `${second.phase.formula} also shows significant overlap (score: ${second.score.toFixed(1)}) — consider complementary techniques to differentiate`,
      );
    }
  }
  
  // Add general XRD limitations and caveats
  warnings.push('XRD provides bulk crystallographic information; surface composition may differ (use XPS for surface analysis).');
  if (confidence.label === 'Medium' || confidence.label === 'Low') {
    warnings.push('Low confidence suggests additional data needed; consider higher-resolution scan or complementary techniques.');
  }

  // Recommendations based on confidence
  const recommendedNextStep: string[] = [];
  if (confidence.label === 'Very High') {
    recommendedNextStep.push('Perform XPS to confirm oxidation states');
    recommendedNextStep.push('Measure magnetic properties via VSM');
  } else if (confidence.label === 'High') {
    recommendedNextStep.push('Run Rietveld refinement for quantitative phase analysis');
    recommendedNextStep.push('Collect XPS survey scan for elemental confirmation');
  } else if (confidence.label === 'Medium') {
    recommendedNextStep.push('Acquire higher-resolution XRD scan');
    recommendedNextStep.push('Verify with Raman spectroscopy');
  } else {
    recommendedNextStep.push('Rescan sample with extended 2θ range');
    recommendedNextStep.push('Check sample crystallinity via TEM');
  }

  // Uncertainty
  const uncertaintyMap: Record<string, string> = {
    'Very High': 'Low',
    'High': 'Moderate',
    'Medium': 'Significant',
    'Low': 'Very High',
  };

  return {
    primaryResult: `${phase.formula} (${phase.name.toLowerCase()} phase)`,
    confidenceScore: confidence.score,
    confidenceLevel: `${confidence.label}`,
    interpretation,
    keyEvidence,
    warnings,
    uncertainty: uncertaintyMap[confidence.label] || 'Unknown',
    recommendedNextStep,
  };
}
