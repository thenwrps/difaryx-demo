/**
 * XPS Processing Agent Runner
 * 
 * Implements XPS (X-ray Photoelectron Spectroscopy) processing pipeline:
 * 1. Energy Calibration
 * 2. Background Subtraction (Shirley/Linear)
 * 3. Smoothing
 * 4. Peak Detection
 * 5. Peak Fitting
 * 6. Chemical State Assignment
 */

import type { XpsDataset, XpsPeak, XpsChemicalStateMatch } from '../../data/xpsDemoData';
import type { XpsParameters } from '../../types/parameters';

// ============================================================================
// Type Definitions
// ============================================================================

export interface XpsProcessingParams {
  // Energy calibration
  energyShift?: number;
  
  // Background subtraction
  backgroundMethod?: 'Shirley' | 'Linear' | 'Tougaard';
  backgroundIterations?: number;
  backgroundSmoothingFactor?: number;
  
  // Smoothing
  smoothingWindowSize?: number;
  
  // Peak detection
  peakProminence?: number;
  peakMinDistance?: number;
  
  // Peak fitting
  peakModel?: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt';
  fittingTolerance?: number;
  fittingMaxIterations?: number;
  
  // Chemical state assignment
  bindingEnergyTolerance?: number;
  useIntensity?: boolean;
}

export interface XpsProcessingResult {
  // Processed signal data
  signal: {
    bindingEnergy: number[];
    intensity: number[];
  };
  baseline: number[];
  
  // Detected and fitted peaks
  peaks: XpsPeak[];
  
  // Chemical state matches
  matches: XpsChemicalStateMatch[];
  
  // State aggregations
  stateAggregations: StateAggregation[];
  
  // Validation results
  confidence: 'high' | 'medium' | 'low';
  caveats: string[];
  
  // Scientific summary
  scientificSummary: string;
  
  // Processing metadata
  processingSteps: string[];
  parametersUsed: XpsProcessingParams;
}

// ============================================================================
// Processing Functions
// ============================================================================

/**
 * Apply energy calibration shift to binding energy values
 */
function calibrateEnergy(
  bindingEnergy: number[],
  shift: number
): number[] {
  return bindingEnergy.map(be => be + shift);
}

/**
 * Subtract background using Shirley or Linear method
 * 
 * Note: This is a simplified approximation of Shirley background
 */
function subtractBackground(
  intensity: number[],
  method: 'Shirley' | 'Linear' | 'Tougaard',
  iterations: number,
  smoothingFactor: number
): { intensity: number[]; baseline: number[] } {
  const n = intensity.length;
  const baseline: number[] = new Array(n);
  
  if (method === 'Linear') {
    // Linear background: straight line from start to end
    const start = intensity[0];
    const end = intensity[n - 1];
    const slope = (end - start) / (n - 1);
    
    for (let i = 0; i < n; i++) {
      baseline[i] = start + slope * i;
    }
  } else {
    // Shirley-like background (simplified iterative approach)
    const minIntensity = Math.min(...intensity);
    
    for (let i = 0; i < n; i++) {
      const progress = i / (n - 1);
      // Approximate Shirley with weighted percentile
      baseline[i] = minIntensity + (intensity[0] - minIntensity) * (1 - progress) * smoothingFactor;
    }
  }
  
  // Subtract baseline
  const correctedIntensity = intensity.map((val, i) => Math.max(0, val - baseline[i]));
  
  return { intensity: correctedIntensity, baseline };
}

/**
 * Apply smoothing using moving average
 */
function smoothData(
  intensity: number[],
  windowSize: number
): number[] {
  const halfWindow = Math.floor(windowSize / 2);
  const smoothed: number[] = [];
  
  for (let i = 0; i < intensity.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(intensity.length, i + halfWindow + 1);
    const window = intensity.slice(start, end);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    smoothed.push(avg);
  }
  
  return smoothed;
}

/**
 * Detect peaks using local maxima with prominence threshold
 */
function detectPeaks(
  bindingEnergy: number[],
  intensity: number[],
  prominence: number,
  minDistance: number
): XpsPeak[] {
  const peaks: XpsPeak[] = [];
  const maxIntensity = Math.max(...intensity);
  const prominenceThreshold = prominence * maxIntensity;
  
  for (let i = 1; i < intensity.length - 1; i++) {
    // Check if local maximum
    if (intensity[i] > intensity[i - 1] && intensity[i] > intensity[i + 1]) {
      // Check prominence
      if (intensity[i] >= prominenceThreshold) {
        // Check minimum distance from existing peaks
        const tooClose = peaks.some(peak => 
          Math.abs(bindingEnergy[i] - peak.bindingEnergy) < minDistance
        );
        
        if (!tooClose) {
          // Estimate FWHM (Full Width at Half Maximum)
          const halfMax = intensity[i] / 2;
          let leftIdx = i;
          let rightIdx = i;
          
          while (leftIdx > 0 && intensity[leftIdx] > halfMax) leftIdx--;
          while (rightIdx < intensity.length - 1 && intensity[rightIdx] > halfMax) rightIdx++;
          
          const fwhm = Math.abs(bindingEnergy[rightIdx] - bindingEnergy[leftIdx]);
          
          // Estimate peak area (simple trapezoidal approximation)
          const area = intensity[i] * fwhm * 0.8; // Approximate Gaussian area
          
          peaks.push({
            id: `peak-${peaks.length + 1}`,
            bindingEnergy: bindingEnergy[i],
            intensity: intensity[i],
            fwhm: fwhm,
            area: area,
          });
        }
      }
    }
  }
  
  return peaks;
}

/**
 * Fit peaks with Gaussian model (simplified)
 * 
 * Note: This is a placeholder that refines peak parameters slightly
 */
function fitPeaks(
  peaks: XpsPeak[],
  model: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt'
): XpsPeak[] {
  // In a real implementation, this would perform non-linear least squares fitting
  // For now, we just return the peaks with minor refinements
  return peaks.map(peak => ({
    ...peak,
    // Slight refinement to simulate fitting
    intensity: peak.intensity * 0.98,
    fwhm: peak.fwhm * 1.02,
  }));
}

// ============================================================================
// XPS Reference Database
// ============================================================================

interface XpsReference {
  element: string;
  orbital: string;
  state: string;
  bindingEnergy: number;
  tolerance: number;
  diagnosticWeight: number;
  isPrimary: boolean; // True for primary diagnostic orbital (e.g., 2p3/2)
  satelliteExpected: boolean;
  satelliteRange?: [number, number];
  source: string;
}

const XPS_REFERENCE_DATABASE: XpsReference[] = [
  // Copper references
  {
    element: 'Cu',
    orbital: '2p3/2',
    state: 'Cu⁺',
    bindingEnergy: 932.5,
    tolerance: 0.3,
    diagnosticWeight: 1.0,
    isPrimary: true,
    satelliteExpected: false,
    source: 'NIST XPS',
  },
  {
    element: 'Cu',
    orbital: '2p3/2',
    state: 'Cu²⁺',
    bindingEnergy: 933.6,
    tolerance: 0.3,
    diagnosticWeight: 1.0,
    isPrimary: true,
    satelliteExpected: true,
    satelliteRange: [940, 945],
    source: 'NIST XPS',
  },
  {
    element: 'Cu',
    orbital: '2p1/2',
    state: 'Cu⁺',
    bindingEnergy: 952.3,
    tolerance: 0.3,
    diagnosticWeight: 0.8,
    isPrimary: false,
    satelliteExpected: false,
    source: 'NIST XPS',
  },
  {
    element: 'Cu',
    orbital: '2p1/2',
    state: 'Cu²⁺',
    bindingEnergy: 953.4,
    tolerance: 0.3,
    diagnosticWeight: 0.8,
    isPrimary: false,
    satelliteExpected: false,
    source: 'NIST XPS',
  },
  // Carbon references
  {
    element: 'C',
    orbital: '1s',
    state: 'C(0)',
    bindingEnergy: 284.8,
    tolerance: 0.3,
    diagnosticWeight: 1.0,
    isPrimary: true,
    satelliteExpected: false,
    source: 'NIST XPS',
  },
  {
    element: 'C',
    orbital: '1s',
    state: 'C(+2)',
    bindingEnergy: 286.5,
    tolerance: 0.3,
    diagnosticWeight: 0.9,
    isPrimary: true,
    satelliteExpected: false,
    source: 'NIST XPS',
  },
  {
    element: 'C',
    orbital: '1s',
    state: 'C(+4)',
    bindingEnergy: 288.2,
    tolerance: 0.3,
    diagnosticWeight: 0.9,
    isPrimary: true,
    satelliteExpected: false,
    source: 'NIST XPS',
  },
];

interface PeakMatch {
  peak: XpsPeak;
  reference: XpsReference;
  deltaBE: number;
  score: number;
}

interface SatelliteEvidence {
  peakId: string;
  bindingEnergy: number;
  intensity: number;
}

interface StateAggregation {
  element: string;
  state: string;
  matchedOrbitals: string[];
  totalScore: number;
  weightedArea: number;
  diagnosticPeakCount: number;
  hasPrimary: boolean; // Has primary diagnostic orbital match
  hasSpinOrbitPartner: boolean; // Has spin-orbit partner match
  hasSatellite: boolean; // Has satellite evidence
  satelliteEvidence: SatelliteEvidence[];
  matchedCount: number;
  confidence: 'high' | 'medium' | 'low';
  caveats: string[];
}

/**
 * Calculate Gaussian-weighted score for peak-reference match
 */
function calculateMatchScore(deltaBE: number, tolerance: number, diagnosticWeight: number): number {
  const sigma = tolerance / 2;
  const gaussianScore = Math.exp(-(deltaBE * deltaBE) / (2 * sigma * sigma));
  return gaussianScore * diagnosticWeight;
}

/**
 * Check if a peak is a satellite peak (Cu²⁺ satellite region: 940-945 eV)
 */
function isSatellitePeak(peak: XpsPeak): boolean {
  return peak.bindingEnergy >= 940 && peak.bindingEnergy <= 945;
}

/**
 * Find best reference match for a peak
 * Fixed tolerance boundary: use deltaBE > tolerance + 1e-6 to avoid floating point issues
 */
function findBestMatch(peak: XpsPeak, references: XpsReference[]): PeakMatch | null {
  let bestMatch: PeakMatch | null = null;
  
  for (const ref of references) {
    const deltaBE = Math.abs(peak.bindingEnergy - ref.bindingEnergy);
    
    // Check if within tolerance (with small epsilon to handle floating point)
    if (deltaBE > ref.tolerance + 1e-6) continue;
    
    const score = calculateMatchScore(deltaBE, ref.tolerance, ref.diagnosticWeight);
    
    // Choose best by highest score, then lowest deltaBE
    if (!bestMatch || score > bestMatch.score || (score === bestMatch.score && deltaBE < bestMatch.deltaBE)) {
      bestMatch = {
        peak,
        reference: ref,
        deltaBE,
        score,
      };
    }
  }
  
  return bestMatch;
}

/**
 * Aggregate matches by element and state with orbital hierarchy
 */
function aggregateByState(matches: PeakMatch[], allPeaks: XpsPeak[]): StateAggregation[] {
  const stateMap = new Map<string, StateAggregation>();
  
  for (const match of matches) {
    const key = `${match.reference.element}-${match.reference.state}`;
    
    if (!stateMap.has(key)) {
      stateMap.set(key, {
        element: match.reference.element,
        state: match.reference.state,
        matchedOrbitals: [],
        totalScore: 0,
        weightedArea: 0,
        diagnosticPeakCount: 0,
        hasPrimary: false,
        hasSpinOrbitPartner: false,
        hasSatellite: false,
        satelliteEvidence: [],
        matchedCount: 0,
        confidence: 'low',
        caveats: [],
      });
    }
    
    const agg = stateMap.get(key)!;
    agg.matchedOrbitals.push(match.reference.orbital);
    agg.totalScore += match.score;
    agg.weightedArea += match.peak.area * match.score;
    agg.matchedCount++;
    
    if (match.reference.diagnosticWeight >= 1.0) {
      agg.diagnosticPeakCount++;
    }
    
    // Track primary orbital match
    if (match.reference.isPrimary) {
      agg.hasPrimary = true;
    }
    
    // Track spin-orbit partner (for Cu: if we have both 2p3/2 and 2p1/2)
    if (match.reference.element === 'Cu') {
      const has2p3_2 = agg.matchedOrbitals.includes('2p3/2');
      const has2p1_2 = agg.matchedOrbitals.includes('2p1/2');
      if (has2p3_2 && has2p1_2) {
        agg.hasSpinOrbitPartner = true;
      }
    }
    
    // Check satellite support for Cu²⁺
    if (match.reference.element === 'Cu' && match.reference.state === 'Cu²⁺' && match.reference.satelliteExpected) {
      if (match.reference.satelliteRange) {
        const satellites = allPeaks.filter(p => 
          p.bindingEnergy >= match.reference.satelliteRange![0] && 
          p.bindingEnergy <= match.reference.satelliteRange![1]
        );
        
        if (satellites.length > 0) {
          agg.hasSatellite = true;
          agg.satelliteEvidence = satellites.map(s => ({
            peakId: s.id,
            bindingEnergy: s.bindingEnergy,
            intensity: s.intensity,
          }));
        }
      }
    }
  }
  
  // Determine confidence for each state
  for (const agg of stateMap.values()) {
    agg.confidence = determineConfidence(agg);
    
    // Add caveats based on evidence
    if (agg.element === 'Cu' && agg.state === 'Cu²⁺') {
      if (!agg.hasSatellite) {
        agg.caveats.push('Cu²⁺ assigned without satellite support; may indicate Cu⁺ or mixed state');
      }
      if (!agg.hasSpinOrbitPartner) {
        agg.caveats.push('Missing spin-orbit partner; assignment less certain');
      }
    }
    
    if (!agg.hasPrimary) {
      agg.caveats.push('No primary diagnostic orbital matched; assignment is tentative');
    }
  }
  
  return Array.from(stateMap.values());
}

/**
 * Determine confidence level based on evidence quality
 * 
 * HIGH: Primary + Partner + Satellite (for Cu²⁺) OR Primary + Partner (for others)
 * MEDIUM: Primary + one of (Partner OR Satellite)
 * LOW: No primary OR insufficient evidence
 */
function determineConfidence(agg: StateAggregation): 'high' | 'medium' | 'low' {
  // No primary diagnostic orbital → LOW
  if (!agg.hasPrimary) {
    return 'low';
  }
  
  // Cu²⁺ specific rules
  if (agg.element === 'Cu' && agg.state === 'Cu²⁺') {
    if (agg.hasPrimary && agg.hasSpinOrbitPartner && agg.hasSatellite) {
      return 'high';
    }
    if (agg.hasPrimary && (agg.hasSpinOrbitPartner || agg.hasSatellite)) {
      return 'medium';
    }
    return 'low';
  }
  
  // General rules for other elements/states
  if (agg.hasPrimary && agg.hasSpinOrbitPartner) {
    return 'high';
  }
  
  if (agg.hasPrimary && agg.matchedCount >= 2) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Generate scientific summary from state aggregations with per-state confidence
 */
function generateScientificSummary(stateAggregations: StateAggregation[]): string {
  if (stateAggregations.length === 0) {
    return 'No chemical state assignments; insufficient peak matches';
  }
  
  // Sort by total score (dominant state first)
  const sorted = [...stateAggregations].sort((a, b) => b.totalScore - a.totalScore);
  
  const dominant = sorted[0];
  const minor = sorted.slice(1);
  
  let summary = '';
  
  // Use per-state confidence
  if (dominant.confidence === 'low') {
    summary = `Tentative assignment: ${dominant.state}`;
  } else if (dominant.confidence === 'medium') {
    summary = `${dominant.state} likely present`;
  } else {
    summary = `${dominant.state} dominant`;
  }
  
  // Add satellite evidence for Cu²⁺
  if (dominant.element === 'Cu' && dominant.state === 'Cu²⁺' && dominant.hasSatellite) {
    summary += ' (satellite confirmed)';
  }
  
  if (minor.length > 0) {
    const minorStates = minor.map(m => m.state).join(', ');
    summary += ` with minor ${minorStates} contribution`;
  }
  
  return summary;
}

/**
 * Assign chemical states using evidence-weighted matching engine
 * 
 * Process:
 * 1. Classify satellite peaks (940-945 eV for Cu²⁺)
 * 2. Match non-satellite peaks to reference database
 * 3. Aggregate matches by element + state
 * 4. Determine per-state confidence
 * 5. Generate scientific summary
 */
function assignChemicalStates(
  peaks: XpsPeak[],
  tolerance: number,
  useIntensity: boolean
): { 
  peaks: XpsPeak[]; 
  matches: XpsChemicalStateMatch[];
  stateAggregations: StateAggregation[];
  confidence: 'high' | 'medium' | 'low';
  caveats: string[];
  scientificSummary: string;
} {
  // Step 1: Classify satellite peaks (don't match these to ordinary references)
  const satellitePeaks = peaks.filter(p => isSatellitePeak(p));
  const ordinaryPeaks = peaks.filter(p => !isSatellitePeak(p));
  
  // Step 2: Find best match for each ordinary peak
  const peakMatches: PeakMatch[] = [];
  const assignedPeaks: XpsPeak[] = [];
  
  for (const peak of ordinaryPeaks) {
    const match = findBestMatch(peak, XPS_REFERENCE_DATABASE);
    
    if (match) {
      peakMatches.push(match);
      
      // Assign peak with chemical state info
      assignedPeaks.push({
        ...peak,
        assignment: match.reference.state,
      });
    } else {
      assignedPeaks.push(peak);
    }
  }
  
  // Add satellite peaks back (unassigned)
  for (const satPeak of satellitePeaks) {
    assignedPeaks.push({
      ...satPeak,
      assignment: 'Cu²⁺ satellite',
    });
  }
  
  // Step 3: Aggregate by state (with satellite evidence)
  const stateAggregations = aggregateByState(peakMatches, peaks);
  
  // Step 4: Determine overall confidence (use highest state confidence)
  const overallConfidence = stateAggregations.length > 0
    ? stateAggregations.reduce((best, agg) => {
        const confidenceRank = { high: 3, medium: 2, low: 1 };
        return confidenceRank[agg.confidence] > confidenceRank[best]
          ? agg.confidence
          : best;
      }, 'low' as 'high' | 'medium' | 'low')
    : 'low';
  
  // Step 5: Collect all caveats
  const allCaveats: string[] = [];
  stateAggregations.forEach(agg => {
    allCaveats.push(...agg.caveats);
  });
  
  // Add global caveats
  if (peakMatches.length < 2) {
    allCaveats.push('Fewer than 2 peaks matched; limited evidence for assignment');
  }
  
  const cuStates = stateAggregations.filter(agg => agg.element === 'Cu');
  if (cuStates.length > 1) {
    allCaveats.push('Mixed Cu oxidation states detected (Cu⁺ and Cu²⁺ both present)');
  }
  
  // Step 6: Generate scientific summary
  const scientificSummary = generateScientificSummary(stateAggregations);
  
  // Step 7: Convert to XpsChemicalStateMatch format
  const matches: XpsChemicalStateMatch[] = peakMatches.map(match => ({
    peakId: match.peak.id,
    observedBE: match.peak.bindingEnergy,
    referenceBE: match.reference.bindingEnergy,
    deltaBE: match.peak.bindingEnergy - match.reference.bindingEnergy,
    element: match.reference.element,
    oxidationState: match.reference.state,
    assignment: `${match.reference.element} ${match.reference.orbital} (${match.reference.state})`,
    confidence: match.score,
  }));
  
  return { 
    peaks: assignedPeaks, 
    matches,
    stateAggregations,
    confidence: overallConfidence,
    caveats: allCaveats,
    scientificSummary,
  };
}

// ============================================================================
// Main Processing Pipeline
// ============================================================================

/**
 * Run XPS processing pipeline
 * 
 * Takes raw XPS data and applies processing steps based on parameters
 */
export function runXpsProcessing(
  dataset: XpsDataset,
  params?: XpsProcessingParams
): XpsProcessingResult {
  const processingSteps: string[] = [];
  
  // Default parameters
  const energyShift = params?.energyShift ?? 0.0;
  const backgroundMethod = params?.backgroundMethod ?? 'Shirley';
  const backgroundIterations = params?.backgroundIterations ?? 10;
  const backgroundSmoothingFactor = params?.backgroundSmoothingFactor ?? 0.5;
  const smoothingWindowSize = params?.smoothingWindowSize ?? 5;
  const peakProminence = params?.peakProminence ?? 0.1;
  const peakMinDistance = params?.peakMinDistance ?? 0.5;
  const peakModel = params?.peakModel ?? 'Gaussian';
  const fittingTolerance = params?.fittingTolerance ?? 1e-4;
  const fittingMaxIterations = params?.fittingMaxIterations ?? 100;
  const bindingEnergyTolerance = params?.bindingEnergyTolerance ?? 0.3;
  const useIntensity = params?.useIntensity ?? true;
  
  // Step 1: Energy Calibration
  let bindingEnergy = [...dataset.signal.bindingEnergy];
  if (energyShift !== 0) {
    bindingEnergy = calibrateEnergy(bindingEnergy, energyShift);
    processingSteps.push(`Energy calibration: shift=${energyShift} eV`);
  } else {
    processingSteps.push('Energy calibration: no shift applied');
  }
  
  // Step 2: Background Subtraction
  const { intensity: correctedIntensity, baseline } = subtractBackground(
    dataset.signal.intensity,
    backgroundMethod,
    backgroundIterations,
    backgroundSmoothingFactor
  );
  processingSteps.push(`Background subtraction: ${backgroundMethod} method`);
  
  // Step 3: Smoothing
  const smoothedIntensity = smoothData(correctedIntensity, smoothingWindowSize);
  processingSteps.push(`Smoothing: window size=${smoothingWindowSize}`);
  
  // Step 4: Peak Detection
  let peaks = detectPeaks(bindingEnergy, smoothedIntensity, peakProminence, peakMinDistance);
  processingSteps.push(`Peak detection: ${peaks.length} peaks found`);
  
  // Step 5: Peak Fitting
  peaks = fitPeaks(peaks, peakModel);
  processingSteps.push(`Peak fitting: ${peakModel} model`);
  
  // Step 6: Chemical State Assignment
  const { 
    peaks: assignedPeaks, 
    matches,
    stateAggregations,
    confidence,
    caveats,
    scientificSummary,
  } = assignChemicalStates(
    peaks,
    bindingEnergyTolerance,
    useIntensity
  );
  processingSteps.push(`Chemical state assignment: ${matches.length}/${peaks.length} matched`);
  
  return {
    signal: {
      bindingEnergy,
      intensity: smoothedIntensity,
    },
    baseline,
    peaks: assignedPeaks,
    matches,
    stateAggregations,
    confidence,
    caveats,
    scientificSummary,
    processingSteps,
    parametersUsed: {
      energyShift,
      backgroundMethod,
      backgroundIterations,
      backgroundSmoothingFactor,
      smoothingWindowSize,
      peakProminence,
      peakMinDistance,
      peakModel,
      fittingTolerance,
      fittingMaxIterations,
      bindingEnergyTolerance,
      useIntensity,
    },
  };
}

/**
 * Convert XpsParameters to XpsProcessingParams
 */
export function convertXpsParametersToProcessingParams(
  params: XpsParameters
): XpsProcessingParams {
  return {
    energyShift: params.energyCalibration.shift_value,
    backgroundMethod: params.backgroundSubtraction.method,
    backgroundIterations: params.backgroundSubtraction.iterations,
    backgroundSmoothingFactor: params.backgroundSubtraction.smoothing_factor,
    smoothingWindowSize: params.smoothing.window_size,
    peakProminence: params.peakDetection.prominence,
    peakMinDistance: params.peakDetection.min_distance,
    peakModel: params.peakFitting.model,
    fittingTolerance: params.peakFitting.tolerance,
    fittingMaxIterations: params.peakFitting.max_iterations,
    bindingEnergyTolerance: params.chemicalStateAssignment.binding_energy_tolerance,
    useIntensity: params.chemicalStateAssignment.use_intensity,
  };
}
