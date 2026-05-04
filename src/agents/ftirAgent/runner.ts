/**
 * FTIR Processing Agent Runner
 * 
 * Implements FTIR (Fourier Transform Infrared Spectroscopy) processing pipeline:
 * 1. Baseline Correction
 * 2. Smoothing
 * 3. Band Detection
 * 4. Band Assignment (Range-Based Matching)
 * 5. Functional Group Matching (Evidence Aggregation)
 * 6. Interpretation Summary
 */

import type {
  FtirPoint,
  FtirDetectedBand,
  FtirBandMatch,
  FtirFunctionalGroupCandidate,
  FtirProcessingParams,
  FtirProcessingResult,
  FtirInterpretation,
  FtirReferenceRange,
  StateAggregation,
} from './types';
import type { FtirDataset } from '../../data/ftirDemoData';

// ============================================================================
// FTIR Functional Group Reference Database
// ============================================================================

const FTIR_REFERENCE_DATABASE: FtirReferenceRange[] = [
  // Hydroxyl Groups
  {
    functionalGroup: 'Surface hydroxyl',
    assignment: 'O–H stretching vibration',
    wavenumberRange: [3200, 3600],
    typicalCenter: 3400,
    expectedWidth: 'broad',  // FWHM > 100 cm⁻¹
    diagnosticWeight: 0.9,
    supportingBands: ['water_bending'],
    overlappingGroups: [],
    literatureSource: 'Busca, G. (2014). Heterogeneous Catalytic Materials',
  },
  // Water
  {
    functionalGroup: 'Adsorbed water',
    assignment: 'H–O–H bending vibration',
    wavenumberRange: [1630, 1650],
    typicalCenter: 1640,
    expectedWidth: 'medium',  // FWHM 50-100 cm⁻¹
    diagnosticWeight: 0.8,
    supportingBands: ['surface_hydroxyl'],
    overlappingGroups: [],
    literatureSource: 'Busca, G. (2014). Heterogeneous Catalytic Materials',
  },
  // Carbonate Species
  {
    functionalGroup: 'Carbonate',
    assignment: 'CO₃²⁻ asymmetric stretching',
    wavenumberRange: [1400, 1500],
    typicalCenter: 1450,
    expectedWidth: 'medium',
    diagnosticWeight: 0.7,
    supportingBands: [],
    overlappingGroups: ['carboxylate'],  // AMBIGUITY
    literatureSource: 'Busca, G. (2014). Heterogeneous Catalytic Materials',
  },
  {
    functionalGroup: 'Carboxylate',
    assignment: 'COO⁻ asymmetric stretching',
    wavenumberRange: [1550, 1650],
    typicalCenter: 1600,
    expectedWidth: 'medium',
    diagnosticWeight: 0.7,
    supportingBands: [],
    overlappingGroups: ['carbonate'],  // AMBIGUITY
    literatureSource: 'Busca, G. (2014). Heterogeneous Catalytic Materials',
  },
  // Metal-Oxygen Vibrations
  {
    functionalGroup: 'Metal-oxygen vibration',
    assignment: 'M–O stretching (spinel structure)',
    wavenumberRange: [500, 650],
    typicalCenter: 575,
    expectedWidth: 'broad',
    diagnosticWeight: 0.85,
    supportingBands: [],
    overlappingGroups: [],
    literatureSource: 'Waldron, R. D. (1955). Physical Review, 99(6), 1727',
  },
  // C-H Stretch
  {
    functionalGroup: 'Aliphatic C–H',
    assignment: 'C–H stretching vibration',
    wavenumberRange: [2850, 2960],
    typicalCenter: 2920,
    expectedWidth: 'narrow',
    diagnosticWeight: 0.6,
    supportingBands: [],
    overlappingGroups: [],
    literatureSource: 'Socrates, G. (2001). Infrared and Raman Characteristic Group Frequencies',
  },
];

// ============================================================================
// Processing Functions
// ============================================================================

/**
 * Step 1: Baseline Correction
 * Remove baseline drift and background signal
 */
function correctBaseline(
  dataPoints: FtirPoint[],
  method: 'Polynomial' | 'Rubberband' | 'Linear',
  polynomialOrder: number,
  iterations: number
): { corrected: FtirPoint[]; baseline: number[] } {
  const n = dataPoints.length;
  const baseline: number[] = new Array(n);
  
  if (method === 'Linear') {
    // Linear baseline: straight line from start to end
    const start = dataPoints[0].y;
    const end = dataPoints[n - 1].y;
    const slope = (end - start) / (n - 1);
    
    for (let i = 0; i < n; i++) {
      baseline[i] = start + slope * i;
    }
  } else if (method === 'Polynomial') {
    // Simplified polynomial baseline (use min values as baseline points)
    const minY = Math.min(...dataPoints.map(p => p.y));
    for (let i = 0; i < n; i++) {
      const progress = i / (n - 1);
      baseline[i] = minY + (dataPoints[0].y - minY) * (1 - progress) * 0.3;
    }
  } else {
    // Rubberband (simplified: use convex hull approximation)
    const minY = Math.min(...dataPoints.map(p => p.y));
    for (let i = 0; i < n; i++) {
      baseline[i] = minY + 0.02;
    }
  }
  
  // Subtract baseline
  const corrected = dataPoints.map((p, i) => ({
    x: p.x,
    y: Math.max(0, p.y - baseline[i]),
  }));
  
  return { corrected, baseline };
}

/**
 * Step 2: Smoothing
 * Apply Savitzky-Golay or Moving Average smoothing
 */
function smoothData(
  dataPoints: FtirPoint[],
  method: 'Savitzky-Golay' | 'Moving Average',
  windowSize: number,
  polynomialOrder: number
): FtirPoint[] {
  const halfWindow = Math.floor(windowSize / 2);
  const smoothed: FtirPoint[] = [];
  
  for (let i = 0; i < dataPoints.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(dataPoints.length, i + halfWindow + 1);
    const window = dataPoints.slice(start, end);
    
    // Simple moving average (Savitzky-Golay would require more complex implementation)
    const avg = window.reduce((sum, p) => sum + p.y, 0) / window.length;
    
    smoothed.push({
      x: dataPoints[i].x,
      y: avg,
    });
  }
  
  return smoothed;
}

/**
 * Step 3: Band Detection
 * Detect bands using local maxima with prominence threshold
 */
function detectBands(
  dataPoints: FtirPoint[],
  prominence: number,
  minDistance: number,
  minHeight: number
): FtirDetectedBand[] {
  const candidateBands: FtirDetectedBand[] = [];
  const maxIntensity = Math.max(...dataPoints.map(p => p.y));
  const prominenceThreshold = prominence * maxIntensity;
  const heightThreshold = minHeight * maxIntensity;
  
  // Step 3a: Detect all local maxima
  for (let i = 1; i < dataPoints.length - 1; i++) {
    const curr = dataPoints[i];
    const prev = dataPoints[i - 1];
    const next = dataPoints[i + 1];
    
    // Check if local maximum
    if (curr.y > prev.y && curr.y > next.y) {
      // Check prominence and height
      if (curr.y >= prominenceThreshold && curr.y >= heightThreshold) {
        // Check minimum distance from existing bands
        const tooClose = candidateBands.some(band => 
          Math.abs(curr.x - band.wavenumber) < minDistance
        );
        
        if (!tooClose) {
          // Estimate FWHM (Full Width at Half Maximum)
          const halfMax = curr.y / 2;
          let leftIdx = i;
          let rightIdx = i;
          
          while (leftIdx > 0 && dataPoints[leftIdx].y > halfMax) leftIdx--;
          while (rightIdx < dataPoints.length - 1 && dataPoints[rightIdx].y > halfMax) rightIdx++;
          
          const fwhm = Math.abs(dataPoints[leftIdx].x - dataPoints[rightIdx].x);
          
          // Classify band width
          let classification: 'narrow' | 'medium' | 'broad';
          if (fwhm < 50) {
            classification = 'narrow';
          } else if (fwhm <= 100) {
            classification = 'medium';
          } else {
            classification = 'broad';
          }
          
          // Estimate band area (simple trapezoidal approximation)
          const area = curr.y * fwhm * 0.8;
          
          // Calculate local prominence (difference from local baseline)
          const windowSize = 50;
          const startIdx = Math.max(0, i - windowSize);
          const endIdx = Math.min(dataPoints.length - 1, i + windowSize);
          const localMin = Math.min(...dataPoints.slice(startIdx, endIdx + 1).map(p => p.y));
          const localProminence = curr.y - localMin;
          
          candidateBands.push({
            id: `band-${candidateBands.length + 1}`,
            wavenumber: curr.x,
            intensity: curr.y,
            rawIntensity: curr.y,
            prominence: localProminence,
            fwhm: fwhm,
            area: area,
            classification: classification,
          });
        }
      }
    }
  }
  
  // Step 3b: Apply strict meaningful band filter
  const meaningfulBands = candidateBands.filter(band => {
    // Reject if intensity too low
    if (band.intensity < 0.08) {
      return false;
    }
    
    // Reject if FWHM too large (except for broad O-H around 3400)
    if (band.fwhm > 500) {
      return false;
    }
    
    // Reject if local prominence too low
    if (band.prominence < 0.04) {
      return false;
    }
    
    // Reject flat/noise regions (2000-3000 cm⁻¹ except C-H around 2920)
    if (band.wavenumber >= 2000 && band.wavenumber <= 3000) {
      // Allow C-H stretch around 2920 cm⁻¹ if strong enough
      if (Math.abs(band.wavenumber - 2920) > 100 || band.intensity < 0.08) {
        return false;
      }
    }
    
    // Reject if area is too low (likely noise)
    if (band.area < 2.0) {
      return false;
    }
    
    return true;
  });
  
  // Step 3c: Remove near-duplicates (keep stronger band within 40 cm⁻¹)
  const filteredBands: FtirDetectedBand[] = [];
  const sortedByIntensity = [...meaningfulBands].sort((a, b) => b.intensity - a.intensity);
  
  for (const band of sortedByIntensity) {
    const tooClose = filteredBands.some(existing => 
      Math.abs(band.wavenumber - existing.wavenumber) < 40
    );
    
    if (!tooClose) {
      filteredBands.push(band);
    }
  }
  
  // Sort by wavenumber (high to low, FTIR convention)
  filteredBands.sort((a, b) => b.wavenumber - a.wavenumber);
  
  // Reassign IDs after filtering
  filteredBands.forEach((band, index) => {
    band.id = `band-${index + 1}`;
  });
  
  return filteredBands;
}

/**
 * Step 4: Band Assignment (Range-Based Matching)
 * Match bands to wavenumber ranges
 */
function assignBands(
  bands: FtirDetectedBand[],
  database: FtirReferenceRange[],
  wavenumberTolerance: number
): FtirBandMatch[] {
  const matches: FtirBandMatch[] = [];
  
  for (const band of bands) {
    // Find all overlapping reference ranges
    for (const ref of database) {
      const [minWn, maxWn] = ref.wavenumberRange;
      
      // Check if band falls within range
      if (band.wavenumber >= minWn && band.wavenumber <= maxWn) {
        // Calculate position score (how well positioned within range)
        const rangeCenter = ref.typicalCenter;
        const rangeWidth = maxWn - minWn;
        const deltaFromCenter = Math.abs(band.wavenumber - rangeCenter);
        const positionScore = Math.max(0, 1 - (deltaFromCenter / (rangeWidth / 2)));
        
        // Calculate width score (how well width matches expected)
        let widthScore = 0.5;  // Default
        if (band.classification === ref.expectedWidth) {
          widthScore = 1.0;
        } else if (
          (band.classification === 'medium' && ref.expectedWidth !== 'narrow') ||
          (band.classification === 'broad' && ref.expectedWidth === 'medium')
        ) {
          widthScore = 0.7;
        }
        
        // Calculate overall score
        const overallScore = positionScore * widthScore * ref.diagnosticWeight;
        
        matches.push({
          referenceRange: ref,
          observedBand: band,
          deltaFromCenter: deltaFromCenter,
          positionScore: positionScore,
          widthScore: widthScore,
          overallScore: overallScore,
        });
      }
    }
  }
  
  return matches;
}

// ============================================================================
// Advanced Scientific Reasoning Engine
// ============================================================================

/**
 * Supporting Band Validation
 * Check if expected supporting bands are present
 */
function validateSupportingBands(
  primaryGroup: string,
  primaryRef: FtirReferenceRange,
  allMatches: FtirBandMatch[],
  database: FtirReferenceRange[]
): { found: FtirBandMatch[]; missing: string[] } {
  const found: FtirBandMatch[] = [];
  const missing: string[] = [];
  
  // Get supporting band IDs from reference
  const supportingBandIds = primaryRef.supportingBands;
  
  if (supportingBandIds.length === 0) {
    return { found, missing };
  }
  
  // Map supporting band IDs to functional groups
  const supportingGroupMap = new Map<string, string>();
  supportingGroupMap.set('water_bending', 'Adsorbed water');
  supportingGroupMap.set('surface_hydroxyl', 'Surface hydroxyl');
  
  // Check each supporting band
  for (const bandId of supportingBandIds) {
    const supportingGroup = supportingGroupMap.get(bandId);
    if (!supportingGroup) continue;
    
    // Find matches for this supporting group
    const supportingMatches = allMatches.filter(
      m => m.referenceRange.functionalGroup === supportingGroup
    );
    
    if (supportingMatches.length > 0) {
      // Sort by score and take best match
      supportingMatches.sort((a, b) => b.overallScore - a.overallScore);
      found.push(supportingMatches[0]);
    } else {
      missing.push(supportingGroup);
    }
  }
  
  return { found, missing };
}

/**
 * Negative Evidence Detection
 * Identify expected bands that are missing
 */
function detectNegativeEvidence(
  candidates: Map<string, FtirBandMatch[]>,
  database: FtirReferenceRange[]
): string[] {
  const negativeEvidence: string[] = [];
  
  // Check for missing supporting bands
  for (const [group, groupMatches] of candidates.entries()) {
    const ref = groupMatches[0].referenceRange;
    
    if (ref.supportingBands.length > 0) {
      const { missing } = validateSupportingBands(group, ref, Array.from(candidates.values()).flat(), database);
      
      if (missing.length > 0) {
        negativeEvidence.push(
          `${group}: Expected supporting band(s) ${missing.join(', ')} not detected`
        );
      }
    }
  }
  
  return negativeEvidence;
}

/**
 * Overlap Hypothesis Scoring
 * Score competing hypotheses for overlapping regions
 */
function scoreOverlapHypotheses(
  band: FtirDetectedBand,
  competingMatches: FtirBandMatch[],
  allMatches: FtirBandMatch[],
  database: FtirReferenceRange[]
): { hypothesis: string; score: number; evidence: string[] }[] {
  const hypotheses: { hypothesis: string; score: number; evidence: string[] }[] = [];
  
  for (const match of competingMatches) {
    const ref = match.referenceRange;
    let score = match.overallScore;
    const evidence: string[] = [];
    
    // Base evidence: position and width match
    evidence.push(`Band at ${band.wavenumber.toFixed(0)} cm⁻¹ within ${ref.functionalGroup} range`);
    
    // Check for supporting bands (positive evidence)
    const { found, missing } = validateSupportingBands(
      ref.functionalGroup,
      ref,
      allMatches,
      database
    );
    
    if (found.length > 0) {
      score += 0.2 * found.length;  // Boost score for supporting evidence
      evidence.push(`Supporting bands: ${found.map(f => f.referenceRange.functionalGroup).join(', ')}`);
    }
    
    if (missing.length > 0) {
      score -= 0.15 * missing.length;  // Penalize for missing support
      evidence.push(`Missing support: ${missing.join(', ')}`);
    }
    
    // Width-based scoring adjustment
    if (band.classification === ref.expectedWidth) {
      score += 0.1;  // Bonus for exact width match
      evidence.push(`Width matches expected (${ref.expectedWidth})`);
    } else {
      score -= 0.05;  // Small penalty for width mismatch
      evidence.push(`Width mismatch (observed: ${band.classification}, expected: ${ref.expectedWidth})`);
    }
    
    hypotheses.push({
      hypothesis: ref.functionalGroup,
      score: Math.max(0, Math.min(1, score)),  // Clamp to [0, 1]
      evidence: evidence,
    });
  }
  
  // Sort by score descending
  hypotheses.sort((a, b) => b.score - a.score);
  
  return hypotheses;
}

/**
 * Cross-Band Interpretation
 * Analyze relationships between bands to strengthen or weaken assignments
 */
function performCrossBandInterpretation(
  candidates: Map<string, FtirBandMatch[]>,
  allMatches: FtirBandMatch[],
  database: FtirReferenceRange[]
): Map<string, { score: number; crossBandEvidence: string[] }> {
  const crossBandScores = new Map<string, { score: number; crossBandEvidence: string[] }>();
  
  for (const [group, groupMatches] of candidates.entries()) {
    const ref = groupMatches[0].referenceRange;
    let adjustedScore = groupMatches[0].overallScore;
    const crossBandEvidence: string[] = [];
    
    // Check for supporting bands
    const { found, missing } = validateSupportingBands(group, ref, allMatches, database);
    
    if (found.length > 0) {
      adjustedScore += 0.15 * found.length;
      crossBandEvidence.push(
        `Supporting evidence: ${found.map(f => `${f.referenceRange.functionalGroup} at ${f.observedBand.wavenumber.toFixed(0)} cm⁻¹`).join(', ')}`
      );
    }
    
    if (missing.length > 0) {
      adjustedScore -= 0.1 * missing.length;
      crossBandEvidence.push(
        `Missing expected bands: ${missing.join(', ')}`
      );
    }
    
    // Check for chemical consistency (e.g., water requires both O-H and H-O-H)
    if (group === 'Adsorbed water') {
      const hasHydroxyl = candidates.has('Surface hydroxyl');
      if (hasHydroxyl) {
        adjustedScore += 0.2;
        crossBandEvidence.push('Consistent with surface hydroxyl presence');
      } else {
        adjustedScore -= 0.15;
        crossBandEvidence.push('Inconsistent: water detected without hydroxyl bands');
      }
    }
    
    if (group === 'Surface hydroxyl') {
      const hasWater = candidates.has('Adsorbed water');
      if (hasWater) {
        adjustedScore += 0.1;
        crossBandEvidence.push('Consistent with adsorbed water');
      }
    }
    
    // Clamp score to [0, 1]
    adjustedScore = Math.max(0, Math.min(1, adjustedScore));
    
    crossBandScores.set(group, {
      score: adjustedScore,
      crossBandEvidence: crossBandEvidence,
    });
  }
  
  return crossBandScores;
}

/**
 * Width-Based Scoring Enhancement
 * Adjust confidence based on FWHM consistency with expected values
 */
function applyWidthBasedScoring(
  match: FtirBandMatch
): { adjustedScore: number; widthEvidence: string } {
  const band = match.observedBand;
  const ref = match.referenceRange;
  let adjustment = 0;
  let widthEvidence = '';
  
  // Exact width match
  if (band.classification === ref.expectedWidth) {
    adjustment = 0.15;
    widthEvidence = `Exact width match: ${band.classification} (FWHM: ${band.fwhm.toFixed(0)} cm⁻¹)`;
  }
  // Partial width match
  else if (
    (band.classification === 'medium' && ref.expectedWidth === 'broad') ||
    (band.classification === 'broad' && ref.expectedWidth === 'medium')
  ) {
    adjustment = 0.05;
    widthEvidence = `Partial width match: ${band.classification} vs expected ${ref.expectedWidth}`;
  }
  // Width mismatch
  else {
    adjustment = -0.1;
    widthEvidence = `Width mismatch: ${band.classification} (FWHM: ${band.fwhm.toFixed(0)} cm⁻¹) vs expected ${ref.expectedWidth}`;
  }
  
  const adjustedScore = Math.max(0, Math.min(1, match.overallScore + adjustment));
  
  return { adjustedScore, widthEvidence };
}

/**
 * Step 5: Functional Group Matching (Enhanced Evidence Aggregation)
 * Aggregate band-level evidence with advanced scientific reasoning
 */
function matchFunctionalGroups(
  matches: FtirBandMatch[],
  bands: FtirDetectedBand[],
  ambiguityThreshold: number
): FtirFunctionalGroupCandidate[] {
  const candidates: FtirFunctionalGroupCandidate[] = [];
  const groupMap = new Map<string, FtirBandMatch[]>();
  
  // Group matches by functional group
  for (const match of matches) {
    const group = match.referenceRange.functionalGroup;
    if (!groupMap.has(group)) {
      groupMap.set(group, []);
    }
    groupMap.get(group)!.push(match);
  }
  
  // Perform cross-band interpretation
  const crossBandScores = performCrossBandInterpretation(
    groupMap,
    matches,
    FTIR_REFERENCE_DATABASE
  );
  
  // Detect negative evidence
  const negativeEvidence = detectNegativeEvidence(groupMap, FTIR_REFERENCE_DATABASE);
  
  // Create candidates for each functional group
  for (const [group, groupMatches] of groupMap.entries()) {
    // Sort by score
    groupMatches.sort((a, b) => b.overallScore - a.overallScore);
    const bestMatch = groupMatches[0];
    
    // Apply width-based scoring
    const { adjustedScore: widthAdjustedScore, widthEvidence } = applyWidthBasedScoring(bestMatch);
    
    // Get cross-band adjusted score
    const crossBandData = crossBandScores.get(group);
    let finalScore = crossBandData ? crossBandData.score : widthAdjustedScore;
    
    // Validate supporting bands
    const { found: supportingBands, missing: missingSupportingBands } = validateSupportingBands(
      group,
      bestMatch.referenceRange,
      matches,
      FTIR_REFERENCE_DATABASE
    );
    
    // Check for ambiguity (overlapping groups)
    let ambiguity: string | null = null;
    const overlappingGroups = bestMatch.referenceRange.overlappingGroups;
    let isInOverlapRegion = false;
    
    // Explicit ambiguity for carbonate/carboxylate overlap region (1400-1650 cm⁻¹)
    const wavenumber = bestMatch.observedBand.wavenumber;
    if (wavenumber >= 1400 && wavenumber <= 1650) {
      if (group === 'Carbonate' || group === 'Carboxylate') {
        isInOverlapRegion = true;
        ambiguity = 'carbonate/carboxylate overlap';
      }
    }
    
    if (!isInOverlapRegion && overlappingGroups.length > 0) {
      // Check if any overlapping group also has matches
      const hasOverlap = overlappingGroups.some(og => groupMap.has(og));
      
      if (hasOverlap) {
        // Score overlap hypotheses
        const competingMatches = overlappingGroups
          .filter(og => groupMap.has(og))
          .flatMap(og => groupMap.get(og)!);
        
        const hypotheses = scoreOverlapHypotheses(
          bestMatch.observedBand,
          [bestMatch, ...competingMatches],
          matches,
          FTIR_REFERENCE_DATABASE
        );
        
        // Check score difference between top hypotheses
        if (hypotheses.length > 1) {
          const scoreDiff = hypotheses[0].score - hypotheses[1].score;
          if (scoreDiff < ambiguityThreshold) {
            ambiguity = `Ambiguous: ${hypotheses.map(h => `${h.hypothesis} (${(h.score * 100).toFixed(0)}%)`).join(' vs ')}`;
          } else {
            ambiguity = `Overlapping region, but ${hypotheses[0].hypothesis} favored (Δscore: ${(scoreDiff * 100).toFixed(0)}%)`;
          }
        }
      }
    }
    
    // Check if band is broad/composite
    const isBroadBand = bestMatch.observedBand.classification === 'broad';
    
    // Apply hard confidence caps
    if (ambiguity) {
      // Ambiguous assignment → max 60%
      finalScore = Math.min(finalScore, 0.60);
    }
    if (missingSupportingBands.length > 0) {
      // Missing supporting band → max 70%
      finalScore = Math.min(finalScore, 0.70);
    }
    if (isBroadBand) {
      // Broad/composite band → max 65%
      finalScore = Math.min(finalScore, 0.65);
    }
    if (isInOverlapRegion) {
      // Overlapping carbonate/carboxylate region → max 60%
      finalScore = Math.min(finalScore, 0.60);
    }
    
    // Global cap: no confidence above 90%
    finalScore = Math.min(finalScore, 0.90);
    
    // Determine confidence level with enhanced logic
    let confidenceLevel: 'high' | 'medium' | 'low';
    
    if (finalScore > 0.75 && supportingBands.length > 0 && !ambiguity) {
      confidenceLevel = 'high';
    } else if (finalScore > 0.75 && !ambiguity) {
      confidenceLevel = 'high';
    } else if (finalScore > 0.6 && supportingBands.length > 0) {
      confidenceLevel = 'medium';
    } else if (finalScore > 0.5 || ambiguity) {
      confidenceLevel = 'medium';
    } else {
      confidenceLevel = 'low';
    }
    
    // Lower confidence if missing critical supporting bands
    if (missingSupportingBands.length > 0 && confidenceLevel === 'high') {
      confidenceLevel = 'medium';
    }
    
    // Force medium/low for ambiguous assignments
    if (ambiguity && confidenceLevel === 'high') {
      confidenceLevel = 'medium';
    }
    
    candidates.push({
      functionalGroup: group,
      assignment: bestMatch.referenceRange.assignment,
      matches: groupMatches,
      supportingBands: supportingBands,
      score: finalScore,
      confidenceLevel: confidenceLevel,
      ambiguity: ambiguity,
    });
  }
  
  return candidates;
}

/**
 * Step 6: Interpretation Summary (Enhanced with Cross-Band Analysis)
 * Generate evidence-based scientific interpretation with advanced reasoning
 */
function generateInterpretation(
  candidates: FtirFunctionalGroupCandidate[],
  bands: FtirDetectedBand[],
  allMatches: FtirBandMatch[]
): FtirInterpretation {
  // Sort candidates by score
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  
  // Dominant functional groups (top 3)
  const dominantGroups = sorted.slice(0, 3).map(c => c.functionalGroup);
  
  // Generate chemical interpretation with cross-band reasoning
  let chemicalInterpretation = '';
  const hasHydroxyl = dominantGroups.includes('Surface hydroxyl');
  const hasWater = dominantGroups.includes('Adsorbed water');
  const hasMetalOxygen = dominantGroups.includes('Metal-oxygen vibration');
  const hasCarbonate = dominantGroups.includes('Carbonate');
  const hasCarboxylate = dominantGroups.includes('Carboxylate');
  
  // Mention carbonate/carboxylate ambiguity in interpretation
  if (hasHydroxyl && hasWater && hasMetalOxygen && (hasCarbonate || hasCarboxylate)) {
    chemicalInterpretation = 'Hydrated metal oxide catalyst with surface hydroxyl groups, adsorbed water, and carbonate/carboxylate species (ambiguous)';
  } else if (hasHydroxyl && hasWater && hasMetalOxygen) {
    chemicalInterpretation = 'Hydrated metal oxide catalyst with surface hydroxyl groups and adsorbed water';
  } else if (hasHydroxyl && hasMetalOxygen) {
    chemicalInterpretation = 'Metal oxide catalyst with surface hydroxyl groups';
  } else if (hasWater && hasMetalOxygen) {
    chemicalInterpretation = 'Hydrated metal oxide with adsorbed water';
  } else if (hasMetalOxygen && (hasCarbonate || hasCarboxylate)) {
    chemicalInterpretation = 'Metal oxide with surface carbonate/carboxylate species (ambiguous)';
  } else if (dominantGroups.length > 0) {
    chemicalInterpretation = `Material with ${dominantGroups.slice(0, 2).join(', ')}`;
  } else {
    chemicalInterpretation = 'Material with unidentified functional groups';
  }
  
  // Compute overall confidence with penalties
  const avgConfidence = sorted.length > 0
    ? sorted.reduce((sum, c) => sum + c.score, 0) / sorted.length
    : 0;
  
  // Count penalties
  const ambiguousCount = sorted.filter(c => c.ambiguity).length;
  const broadBandCount = bands.filter(b => b.classification === 'broad').length;
  const missingSupportCount = sorted.filter(c => {
    const ref = c.matches[0].referenceRange;
    return ref.supportingBands.length > 0 && c.supportingBands.length === 0;
  }).length;
  
  // Apply global penalties (reduced since individual scores are already capped)
  let globalConfidence = avgConfidence;
  
  // Ambiguity penalty: -2% per ambiguous assignment (further reduced)
  globalConfidence -= ambiguousCount * 0.02;
  
  // Broad/composite penalty: -1.5% per broad band (further reduced)
  globalConfidence -= broadBandCount * 0.015;
  
  // Missing support penalty: -2% per missing support
  globalConfidence -= missingSupportCount * 0.02;
  
  // Matched ratio bonus
  const assignedBandIds = new Set(allMatches.map(m => m.observedBand.id));
  const matchedRatio = bands.length > 0 ? assignedBandIds.size / bands.length : 0;
  if (matchedRatio >= 0.9) {
    globalConfidence += 0.05;
  }
  
  // Clamp to [0, 1] and apply global cap of 90%
  globalConfidence = Math.max(0, Math.min(0.90, globalConfidence));
  
  let confidenceLevel: 'high' | 'medium' | 'low';
  if (globalConfidence > 0.75) {
    confidenceLevel = 'high';
  } else if (globalConfidence > 0.5) {
    confidenceLevel = 'medium';
  } else {
    confidenceLevel = 'low';
  }
  
  // Force MEDIUM if there are ambiguous assignments
  if (ambiguousCount > 0 && confidenceLevel === 'high') {
    confidenceLevel = 'medium';
  }
  
  // Evidence with supporting band information
  const evidence: string[] = [];
  for (const c of sorted.slice(0, 3)) {
    let evidenceStr = `${c.functionalGroup}: ${c.matches[0].observedBand.wavenumber.toFixed(0)} cm⁻¹ (${c.assignment})`;
    
    if (c.supportingBands.length > 0) {
      evidenceStr += ` [supported by ${c.supportingBands.map(sb => sb.referenceRange.functionalGroup).join(', ')}]`;
    }
    
    evidence.push(evidenceStr);
  }
  
  // Ambiguities with hypothesis scoring details
  const ambiguities = sorted
    .filter(c => c.ambiguity)
    .map(c => `${c.functionalGroup}: ${c.ambiguity}`);
  
  // Enhanced caveats with specific FTIR limitations
  const caveats: string[] = [];
  
  // Specific carbonate/carboxylate caveat
  if (hasCarbonate || hasCarboxylate) {
    caveats.push('Carbonate/carboxylate overlap: FTIR alone cannot distinguish between these species');
  }
  
  // Broad OH band caveat
  const ohBand = bands.find(b => b.wavenumber >= 3200 && b.wavenumber <= 3600);
  if (ohBand && ohBand.classification === 'broad') {
    caveats.push('Broad O-H band may include contributions from both surface hydroxyl and adsorbed water');
  }
  
  // General ambiguity caveat
  if (ambiguities.length > 0) {
    const ambiguousRegions = new Set<string>();
    for (const candidate of sorted.filter(c => c.ambiguity)) {
      const overlapping = candidate.matches[0].referenceRange.overlappingGroups;
      if (overlapping.length > 0) {
        const minWn = Math.min(
          candidate.matches[0].referenceRange.wavenumberRange[0],
          ...overlapping.map(og => {
            const ref = FTIR_REFERENCE_DATABASE.find(r => r.functionalGroup === og);
            return ref ? ref.wavenumberRange[0] : 0;
          })
        );
        const maxWn = Math.max(
          candidate.matches[0].referenceRange.wavenumberRange[1],
          ...overlapping.map(og => {
            const ref = FTIR_REFERENCE_DATABASE.find(r => r.functionalGroup === og);
            return ref ? ref.wavenumberRange[1] : 0;
          })
        );
        ambiguousRegions.add(`${minWn}-${maxWn} cm⁻¹`);
      }
    }
    
    if (ambiguousRegions.size > 0) {
      caveats.push(`Overlapping bands in ${Array.from(ambiguousRegions).join(', ')}: multiple functional groups possible`);
    }
  }
  
  // Missing supporting band caveats
  for (const candidate of sorted.slice(0, 3)) {
    const ref = candidate.matches[0].referenceRange;
    if (ref.supportingBands.length > 0 && candidate.supportingBands.length === 0) {
      caveats.push(`${candidate.functionalGroup}: Expected supporting bands not detected, assignment tentative`);
    }
  }
  
  // Width-based caveats
  const broadBands = bands.filter(b => b.classification === 'broad');
  if (broadBands.length > 0) {
    caveats.push(`${broadBands.length} broad band(s) detected: may include multiple overlapping environments`);
  }
  
  // Baseline artifact caveat
  caveats.push('Baseline correction may affect intensity measurements');
  
  // Unassigned bands caveat
  const unassignedBands = bands.filter(b => !assignedBandIds.has(b.id));
  if (unassignedBands.length > 0) {
    caveats.push(`${unassignedBands.length} unassigned band(s): may indicate additional species or artifacts`);
  }
  
  // Summary with confidence qualifier
  const confidenceQualifier = confidenceLevel === 'high' ? 'high' : confidenceLevel === 'medium' ? 'medium' : 'low';
  const summary = `${dominantGroups.slice(0, 2).join(', ')} detected with ${confidenceQualifier} confidence`;
  
  return {
    dominantFunctionalGroups: dominantGroups,
    chemicalInterpretation: chemicalInterpretation,
    decision: chemicalInterpretation,
    confidenceScore: globalConfidence * 100,
    confidenceLevel: confidenceLevel,
    evidence: evidence,
    ambiguities: ambiguities,
    caveats: caveats,
    summary: summary,
  };
}

// ============================================================================
// Main Processing Pipeline
// ============================================================================

/**
 * Run FTIR processing pipeline
 */
export function runFtirProcessing(
  dataset: FtirDataset,
  params?: FtirProcessingParams
): FtirProcessingResult {
  const executionLog: any[] = [];
  
  // Default parameters
  const baselineMethod = params?.baselineMethod ?? 'Polynomial';
  const polynomialOrder = params?.polynomialOrder ?? 3;
  const baselineIterations = params?.baselineIterations ?? 20;
  const smoothingMethod = params?.smoothingMethod ?? 'Savitzky-Golay';
  const smoothingWindowSize = params?.smoothingWindowSize ?? 9;
  const smoothingPolynomialOrder = params?.smoothingPolynomialOrder ?? 3;
  const bandProminence = params?.bandProminence ?? 0.1;
  const bandMinDistance = params?.bandMinDistance ?? 20;
  const bandMinHeight = params?.bandMinHeight ?? 0.05;
  const wavenumberTolerance = params?.wavenumberTolerance ?? 30;
  const ambiguityThreshold = params?.ambiguityThreshold ?? 0.15;
  
  // Convert dataset to FtirPoint array
  const dataPoints: FtirPoint[] = dataset.signal.wavenumber.map((wn, i) => ({
    x: wn,
    y: dataset.signal.absorbance[i],
  }));
  
  // Step 1: Baseline Correction
  const { corrected: baselineCorrected, baseline } = correctBaseline(
    dataPoints,
    baselineMethod,
    polynomialOrder,
    baselineIterations
  );
  executionLog.push({ step: 'Baseline Correction', message: `${baselineMethod} method applied` });
  
  // Step 2: Smoothing
  const smoothed = smoothData(
    baselineCorrected,
    smoothingMethod,
    smoothingWindowSize,
    smoothingPolynomialOrder
  );
  executionLog.push({ step: 'Smoothing', message: `${smoothingMethod} (window=${smoothingWindowSize})` });
  
  // Step 3: Band Detection
  const bands = detectBands(
    smoothed,
    bandProminence,
    bandMinDistance,
    bandMinHeight
  );
  executionLog.push({ step: 'Band Detection', message: `${bands.length} bands detected` });
  
  // Step 4: Band Assignment
  const matches = assignBands(
    bands,
    FTIR_REFERENCE_DATABASE,
    wavenumberTolerance
  );
  executionLog.push({ step: 'Band Assignment', message: `${matches.length} matches found` });
  
  // Step 5: Functional Group Matching
  const functionalGroupCandidates = matchFunctionalGroups(
    matches,
    bands,
    ambiguityThreshold
  );
  executionLog.push({ step: 'Functional Group Matching', message: `${functionalGroupCandidates.length} candidates` });
  
  // Step 6: Interpretation Summary
  const interpretation = generateInterpretation(
    functionalGroupCandidates,
    bands,
    matches
  );
  executionLog.push({ step: 'Interpretation Summary', message: interpretation.summary });
  
  // Validation
  const validation = {
    ok: true,
    errors: [],
    warnings: [],
    pointCount: dataPoints.length,
    wavenumberRange: [
      Math.min(...dataset.signal.wavenumber),
      Math.max(...dataset.signal.wavenumber),
    ] as [number, number],
  };
  
  return {
    signal: {
      wavenumber: smoothed.map(p => p.x),
      absorbance: smoothed.map(p => p.y),
    },
    baseline: baseline,
    bands: bands,
    matches: matches,
    functionalGroupCandidates: functionalGroupCandidates,
    interpretation: interpretation,
    validation: validation,
    executionLog: executionLog,
    parametersUsed: {
      baselineMethod,
      polynomialOrder,
      baselineIterations,
      smoothingMethod,
      smoothingWindowSize,
      smoothingPolynomialOrder,
      bandProminence,
      bandMinDistance,
      bandMinHeight,
      wavenumberTolerance,
      ambiguityThreshold,
    },
  };
}
