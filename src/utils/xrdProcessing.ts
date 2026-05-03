/**
 * XRD Processing with Parameter Support
 * 
 * Parameter-aware wrappers around existing XRD agent processing functions.
 * Falls back to default behavior when Auto Mode is ON or parameters are invalid.
 */

import type { XrdParameters } from '../types/parameters';
import type { XrdPoint, XrdPreprocessedPoint, XrdDetectedPeak } from '../agents/xrdAgent/types';
import {
  movingAverage,
  rollingPercentileBaseline,
  roundTo,
  clamp,
  estimateNoise,
  calculateDSpacing,
} from './xrdMath';

// Default values matching current agent behavior
const DEFAULTS = {
  smoothing: {
    radius: 2, // movingAverage(sorted, 2)
  },
  baseline: {
    radius: 42, // rollingPercentileBaseline(smoothed, 42, 0.16)
    fraction: 0.16,
  },
  peakDetection: {
    minHeightBase: 5.5,
    minHeightNoiseFactor: 4,
    minProminenceBase: 3.2,
    minProminenceNoiseFactor: 3.5,
    prominenceRadius: 18,
    minSeparation: 0.44,
    broadThreshold: 1.25,
  },
  referenceMatching: {
    tolerance: 0.2, // MATCH_TOLERANCE in agent
  },
};

/**
 * Sort and filter XRD points
 */
function sortPoints(dataPoints: XrdPoint[]): XrdPoint[] {
  return [...dataPoints]
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => a.x - b.x);
}

/**
 * Preprocess XRD data with parameter support
 * 
 * @param dataPoints - Raw XRD data points
 * @param parameters - XRD parameters (or null for defaults)
 * @param autoMode - Whether Auto Mode is enabled
 * @returns Preprocessed data points
 */
export function preprocessXrdWithParameters(
  dataPoints: XrdPoint[],
  parameters: XrdParameters | null,
  autoMode: boolean
): XrdPreprocessedPoint[] {
  const sorted = sortPoints(dataPoints);
  
  // Smoothing: Use parameters only if Auto Mode is OFF and parameters are valid
  let smoothingRadius = DEFAULTS.smoothing.radius;
  if (!autoMode && parameters?.smoothing) {
    const windowSize = parameters.smoothing.window_size;
    if (typeof windowSize === 'number' && windowSize >= 3 && windowSize <= 21 && windowSize % 2 === 1) {
      // Convert window_size to radius (window_size = 2*radius + 1)
      smoothingRadius = Math.floor(windowSize / 2);
    }
  }
  const smoothed = movingAverage(sorted, smoothingRadius);
  
  // Baseline correction: Use parameters only if Auto Mode is OFF and parameters are valid
  let baselineRadius = DEFAULTS.baseline.radius;
  let baselineFraction = DEFAULTS.baseline.fraction;
  if (!autoMode && parameters?.baselineCorrection) {
    const method = parameters.baselineCorrection.method;
    if (method === 'ALS') {
      // For ALS, use lambda to adjust baseline aggressiveness
      // Higher lambda = smoother baseline (less aggressive removal)
      const lambda = parameters.baselineCorrection.lambda;
      if (typeof lambda === 'number' && lambda >= 1e2 && lambda <= 1e9) {
        // Map lambda to fraction: higher lambda -> higher fraction (less removal)
        // lambda range: 1e2 to 1e9, fraction range: 0.05 to 0.3
        const logLambda = Math.log10(lambda);
        baselineFraction = clamp(0.05 + (logLambda - 2) / (9 - 2) * (0.3 - 0.05), 0.05, 0.3);
      }
    }
    // Note: Polynomial method would require different implementation
    // For now, fall back to rolling percentile for both methods
  }
  const baseline = rollingPercentileBaseline(smoothed, baselineRadius, baselineFraction);
  
  // Baseline subtraction and normalization
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

/**
 * Calculate local prominence for peak detection
 */
function localProminence(data: XrdPreprocessedPoint[], index: number, radius: number): number {
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

/**
 * Interpolate half-height position for FWHM calculation
 */
function interpolateHalfHeight(left: XrdPreprocessedPoint, right: XrdPreprocessedPoint, target: number): number {
  const span = right.normalizedIntensity - left.normalizedIntensity;
  if (Math.abs(span) < 0.0001) return left.x;
  const fraction = (target - left.normalizedIntensity) / span;
  return left.x + (right.x - left.x) * clamp(fraction, 0, 1);
}

/**
 * Find FWHM for a peak
 */
function findFwhm(data: XrdPreprocessedPoint[], index: number): number {
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

/**
 * Merge nearby peaks
 */
function mergeNearbyPeaks(peaks: XrdDetectedPeak[], minSeparation: number): XrdDetectedPeak[] {
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

/**
 * Detect XRD peaks with parameter support
 * 
 * @param preprocessedData - Preprocessed XRD data
 * @param parameters - XRD parameters (or null for defaults)
 * @param autoMode - Whether Auto Mode is enabled
 * @returns Detected peaks
 */
export function detectPeaksWithParameters(
  preprocessedData: XrdPreprocessedPoint[],
  parameters: XrdParameters | null,
  autoMode: boolean
): XrdDetectedPeak[] {
  if (preprocessedData.length < 5) return [];
  
  const normalizedValues = preprocessedData.map((point) => point.normalizedIntensity);
  const noise = estimateNoise(normalizedValues);
  
  // Peak detection thresholds: Use parameters only if Auto Mode is OFF and parameters are valid
  let minProminence = Math.max(DEFAULTS.peakDetection.minProminenceBase, noise * DEFAULTS.peakDetection.minProminenceNoiseFactor);
  let minSeparation = DEFAULTS.peakDetection.minSeparation;
  
  if (!autoMode && parameters?.peakDetection) {
    const prominence = parameters.peakDetection.prominence;
    if (typeof prominence === 'number' && prominence >= 0.0 && prominence <= 1.0) {
      // Scale prominence: 0.0-1.0 -> use as multiplier on normalized intensity scale (0-100)
      minProminence = prominence * 100;
    }
    
    const minDistance = parameters.peakDetection.min_distance;
    if (typeof minDistance === 'number' && minDistance >= 0.05 && minDistance <= 2.0) {
      minSeparation = minDistance;
    }
  }
  
  const minHeight = Math.max(DEFAULTS.peakDetection.minHeightBase, noise * DEFAULTS.peakDetection.minHeightNoiseFactor);
  const candidates: XrdDetectedPeak[] = [];
  
  for (let i = 2; i < preprocessedData.length - 2; i += 1) {
    const previous = preprocessedData[i - 1].normalizedIntensity;
    const current = preprocessedData[i].normalizedIntensity;
    const next = preprocessedData[i + 1].normalizedIntensity;
    
    if (current < minHeight || current <= previous || current < next) continue;
    
    const prominence = localProminence(preprocessedData, i, DEFAULTS.peakDetection.prominenceRadius);
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
      classification: fwhm > DEFAULTS.peakDetection.broadThreshold ? 'broad' : 'sharp',
      label: 'peak',
    });
  }
  
  return mergeNearbyPeaks(candidates, minSeparation);
}

/**
 * Get reference matching tolerance with parameter support
 * 
 * @param parameters - XRD parameters (or null for defaults)
 * @param autoMode - Whether Auto Mode is enabled
 * @returns Matching tolerance in degrees 2θ
 */
export function getMatchingTolerance(
  parameters: XrdParameters | null,
  autoMode: boolean
): number {
  if (!autoMode && parameters?.referenceMatching) {
    const deltaTolerance = parameters.referenceMatching.delta_tolerance;
    if (typeof deltaTolerance === 'number' && deltaTolerance >= 0.01 && deltaTolerance <= 0.5) {
      return deltaTolerance;
    }
  }
  return DEFAULTS.referenceMatching.tolerance;
}
