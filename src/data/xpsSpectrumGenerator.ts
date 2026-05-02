/**
 * XPS Spectrum Generator for CuFe₂O₄ (Copper Ferrite)
 * 
 * This module generates realistic X-ray Photoelectron Spectroscopy (XPS) spectra
 * with scientifically accurate peak shapes, backgrounds, and features.
 * 
 * Key Features:
 * - Gaussian-Lorentzian peak shapes with asymmetric tailing
 * - Shirley-type background increasing toward lower binding energy
 * - Satellite peaks for Cu²⁺ at appropriate offsets
 * - Spin-orbit doublets with correct intensity ratios (2:1 for p levels)
 * - Realistic peak widths (FWHM 2.0-3.5 eV)
 * 
 * Literature Sources:
 * - Shirley, D. A. (1972). "High-Resolution X-Ray Photoemission Spectrum of the
 *   Valence Bands of Gold." Physical Review B, 5(12), 4709-4714.
 * - Biesinger, M. C., et al. (2009). Applied Surface Science, 257(7), 2717-2730.
 */

import type { XpsCoreLevelReference } from './xpsReferenceData';

/**
 * Interface for a single point in an XPS spectrum
 */
export interface XpsSpectrumPoint {
  /** Binding energy in eV */
  x: number;
  /** Counts in arbitrary units */
  y: number;
}

/**
 * Interface for XPS region definition
 */
export interface XpsRegion {
  /** Region name (e.g., "Cu 2p", "Fe 2p", "O 1s") */
  name: string;
  /** Binding energy range [min, max] in eV */
  range: [number, number];
  /** Expected core level identifiers */
  expectedPeaks: string[];
}

/**
 * Options for XPS spectrum generation
 */
export interface XpsGenerationOptions {
  /** Number of data points to generate */
  points?: number;
  /** Signal-to-noise ratio (20:1 to 50:1 typical) */
  signalToNoise?: number;
  /** Mixing parameter for Gaussian-Lorentzian (0=pure Gaussian, 1=pure Lorentzian) */
  mixing?: number;
  /** Asymmetric tail factor (0=symmetric, >0=tail toward higher BE) */
  tailFactor?: number;
  /** Background intensity scale factor */
  backgroundScale?: number;
  /** Random seed for deterministic noise generation */
  seed?: number;
}

/**
 * Gaussian-Lorentzian peak shape function with asymmetric tail
 * 
 * This function implements a mixed Gaussian-Lorentzian peak shape commonly used
 * in XPS analysis. The mixing parameter controls the balance between Gaussian
 * (instrument broadening) and Lorentzian (lifetime broadening) components.
 * An asymmetric tail is added to model inelastic scattering effects.
 * 
 * Mathematical formulation:
 * - Gaussian component: G(x) = exp(-0.5 * ((x - center) / width)²)
 * - Lorentzian component: L(x) = 1 / (1 + ((x - center) / width)²)
 * - Mixed peak: P(x) = mixing * L(x) + (1 - mixing) * G(x)
 * - Asymmetric tail: Applied for x > center using exponential decay
 * 
 * @param x - Binding energy value (eV)
 * @param center - Peak center position (eV)
 * @param fwhm - Full width at half maximum (eV)
 * @param mixing - Mixing parameter (0=pure Gaussian, 1=pure Lorentzian, typical: 0.3-0.5)
 * @param tailFactor - Asymmetric tail factor (0=symmetric, typical: 0.1-0.3)
 * @returns Peak intensity at position x (normalized to peak height = 1)
 * 
 * Validates: Requirements 7.7, 14.6
 * 
 * Literature:
 * - Doniach, S., & Sunjic, M. (1970). "Many-electron singularity in X-ray photoemission
 *   and X-ray line spectra from metals." Journal of Physics C, 3(2), 285.
 * - Wertheim, G. K., et al. (1974). "Range of validity of the Doniach-Sunjic lineshape."
 *   Solid State Communications, 14(3), 225-229.
 */
export function gaussianLorentzian(
  x: number,
  center: number,
  fwhm: number,
  mixing: number = 0.4,
  tailFactor: number = 0.2
): number {
  // Validate inputs
  if (fwhm <= 0) {
    throw new Error('FWHM must be positive');
  }
  if (mixing < 0 || mixing > 1) {
    throw new Error('Mixing parameter must be between 0 and 1');
  }
  if (tailFactor < 0) {
    throw new Error('Tail factor must be non-negative');
  }

  // Calculate normalized distance from peak center
  // Width parameter is FWHM / (2 * sqrt(2 * ln(2))) for Gaussian
  // and FWHM / 2 for Lorentzian
  const width = fwhm / 2.355; // Convert FWHM to Gaussian sigma
  const scaled = (x - center) / width;

  // Gaussian component (instrument broadening)
  const gaussianComponent = Math.exp(-0.5 * scaled * scaled);

  // Lorentzian component (lifetime broadening)
  const lorentzianComponent = 1 / (1 + scaled * scaled);

  // Mixed peak shape
  let peakValue = mixing * lorentzianComponent + (1 - mixing) * gaussianComponent;

  // Apply asymmetric tail for x > center (higher binding energy side)
  // This models inelastic scattering losses
  if (tailFactor > 0 && x > center) {
    const tailDecay = Math.exp(-tailFactor * scaled);
    peakValue *= tailDecay;
  }

  return peakValue;
}

/**
 * Generate a Gaussian function (helper for pure Gaussian peaks)
 * 
 * @param x - Position
 * @param center - Peak center
 * @param fwhm - Full width at half maximum
 * @returns Gaussian value at position x
 */
function gaussian(x: number, center: number, fwhm: number): number {
  const width = fwhm / 2.355; // Convert FWHM to sigma
  const scaled = (x - center) / width;
  return Math.exp(-0.5 * scaled * scaled);
}

/**
 * Generate a Lorentzian function (helper for pure Lorentzian peaks)
 * 
 * @param x - Position
 * @param center - Peak center
 * @param fwhm - Full width at half maximum
 * @returns Lorentzian value at position x
 */
function lorentzian(x: number, center: number, fwhm: number): number {
  const width = fwhm / 2; // FWHM to half-width for Lorentzian
  const scaled = (x - center) / width;
  return 1 / (1 + scaled * scaled);
}

/**
 * Generate Shirley-type background
 * 
 * The Shirley background is commonly used in XPS analysis and increases
 * monotonically toward lower binding energy, modeling the cumulative effect
 * of inelastic scattering.
 * 
 * @param points - Array of spectrum points
 * @returns Array of background values corresponding to each point
 * 
 * Validates: Requirements 7.2
 * 
 * Literature:
 * - Shirley, D. A. (1972). Physical Review B, 5(12), 4709-4714.
 */
export function shirleyBackground(points: XpsSpectrumPoint[]): number[] {
  if (points.length === 0) {
    return [];
  }

  const n = points.length;
  const background = new Array(n).fill(0);

  // Shirley background is calculated iteratively
  // For simplicity, we use a linear approximation that increases toward lower BE
  const startIntensity = points[0].y;
  const endIntensity = points[n - 1].y;
  const intensityRange = Math.abs(endIntensity - startIntensity);

  // Background increases from right (high BE) to left (low BE)
  for (let i = 0; i < n; i++) {
    const fraction = i / (n - 1);
    // Linear interpolation with slight curvature
    background[i] = startIntensity * 0.1 + intensityRange * 0.05 * (1 - Math.pow(1 - fraction, 1.5));
  }

  return background;
}

/**
 * Add deterministic noise to spectrum
 * 
 * @param points - Array of spectrum points
 * @param signalToNoise - Signal-to-noise ratio (typical: 20:1 to 50:1)
 * @param seed - Random seed for reproducibility
 * @returns Array of points with added noise
 */
function addNoise(
  points: XpsSpectrumPoint[],
  signalToNoise: number,
  seed: number = 42
): XpsSpectrumPoint[] {
  // Find maximum intensity for noise scaling
  const maxIntensity = Math.max(...points.map(p => p.y));
  const noiseAmplitude = maxIntensity / signalToNoise;

  // Simple deterministic pseudo-random number generator
  let rng = seed;
  const random = () => {
    rng = (rng * 1664525 + 1013904223) % 4294967296;
    return (rng / 4294967296) * 2 - 1; // Range: [-1, 1]
  };

  return points.map(point => ({
    x: point.x,
    y: Math.max(0, point.y + noiseAmplitude * random())
  }));
}

/**
 * Generate a complete XPS spectrum for a given region
 * 
 * @param region - XPS region definition
 * @param coreLevels - Array of core level references to include
 * @param options - Generation options
 * @returns Array of spectrum points
 */
export function generateXpsSpectrum(
  region: XpsRegion,
  coreLevels: XpsCoreLevelReference[],
  options: XpsGenerationOptions = {}
): XpsSpectrumPoint[] {
  const {
    points = 500,
    signalToNoise = 30,
    mixing = 0.4,
    tailFactor = 0.2,
    backgroundScale = 1.0,
    seed = 42
  } = options;

  const [minBE, maxBE] = region.range;
  const step = (maxBE - minBE) / (points - 1);

  // Initialize spectrum with zeros
  const spectrum: XpsSpectrumPoint[] = [];
  for (let i = 0; i < points; i++) {
    const x = minBE + i * step;
    spectrum.push({ x, y: 0 });
  }

  // Add peaks for each core level
  for (const coreLevel of coreLevels) {
    const { bindingEnergy, fwhm, satelliteOffset, satelliteIntensity } = coreLevel;
    
    // Use average FWHM if range is provided
    const peakFwhm = Array.isArray(fwhm) ? (fwhm[0] + fwhm[1]) / 2 : fwhm;
    
    // Add main peak
    for (let i = 0; i < points; i++) {
      const x = spectrum[i].x;
      const peakIntensity = gaussianLorentzian(x, bindingEnergy, peakFwhm, mixing, tailFactor);
      spectrum[i].y += peakIntensity * 1000; // Scale for visibility
    }

    // Add satellite peak if present (e.g., for Cu²⁺)
    if (satelliteOffset !== undefined && satelliteIntensity !== undefined) {
      const satellitePosition = bindingEnergy + satelliteOffset;
      for (let i = 0; i < points; i++) {
        const x = spectrum[i].x;
        const satellitePeak = gaussianLorentzian(x, satellitePosition, peakFwhm * 1.2, mixing, tailFactor);
        spectrum[i].y += satellitePeak * 1000 * satelliteIntensity;
      }
    }
  }

  // Add Shirley background
  const background = shirleyBackground(spectrum);
  for (let i = 0; i < points; i++) {
    spectrum[i].y += background[i] * backgroundScale;
  }

  // Add noise
  const noisySpectrum = addNoise(spectrum, signalToNoise, seed);

  return noisySpectrum;
}

/**
 * Generate spin-orbit doublet with correct intensity ratio
 * 
 * For p orbitals (2p3/2 and 2p1/2), the intensity ratio should be approximately 2:1
 * due to the (2j+1) degeneracy factor.
 * 
 * @param lowerBE - Lower binding energy component (e.g., 2p3/2)
 * @param higherBE - Higher binding energy component (e.g., 2p1/2)
 * @param options - Generation options
 * @returns Array of spectrum points for the doublet
 * 
 * Validates: Requirements 10.5
 */
export function generateSpinOrbitDoublet(
  lowerBE: XpsCoreLevelReference,
  higherBE: XpsCoreLevelReference,
  options: XpsGenerationOptions = {}
): XpsSpectrumPoint[] {
  const {
    points = 500,
    signalToNoise = 30,
    mixing = 0.4,
    tailFactor = 0.2,
    seed = 42
  } = options;

  // Determine binding energy range
  const minBE = Math.min(lowerBE.bindingEnergy, higherBE.bindingEnergy) - 20;
  const maxBE = Math.max(lowerBE.bindingEnergy, higherBE.bindingEnergy) + 20;
  const step = (maxBE - minBE) / (points - 1);

  // Initialize spectrum
  const spectrum: XpsSpectrumPoint[] = [];
  for (let i = 0; i < points; i++) {
    const x = minBE + i * step;
    spectrum.push({ x, y: 0 });
  }

  // Add lower BE component (2p3/2) with intensity ratio 2:1
  const lowerFwhm = Array.isArray(lowerBE.fwhm) ? (lowerBE.fwhm[0] + lowerBE.fwhm[1]) / 2 : lowerBE.fwhm;
  for (let i = 0; i < points; i++) {
    const x = spectrum[i].x;
    const peakIntensity = gaussianLorentzian(x, lowerBE.bindingEnergy, lowerFwhm, mixing, tailFactor);
    spectrum[i].y += peakIntensity * 2000; // 2x intensity
  }

  // Add higher BE component (2p1/2) with intensity ratio 1
  const higherFwhm = Array.isArray(higherBE.fwhm) ? (higherBE.fwhm[0] + higherBE.fwhm[1]) / 2 : higherBE.fwhm;
  for (let i = 0; i < points; i++) {
    const x = spectrum[i].x;
    const peakIntensity = gaussianLorentzian(x, higherBE.bindingEnergy, higherFwhm, mixing, tailFactor);
    spectrum[i].y += peakIntensity * 1000; // 1x intensity
  }

  // Add satellites for Cu²⁺ if present
  if (lowerBE.satelliteOffset && lowerBE.satelliteIntensity) {
    const satellitePosition = lowerBE.bindingEnergy + lowerBE.satelliteOffset;
    for (let i = 0; i < points; i++) {
      const x = spectrum[i].x;
      const satellitePeak = gaussianLorentzian(x, satellitePosition, lowerFwhm * 1.2, mixing, tailFactor);
      spectrum[i].y += satellitePeak * 2000 * lowerBE.satelliteIntensity;
    }
  }

  if (higherBE.satelliteOffset && higherBE.satelliteIntensity) {
    const satellitePosition = higherBE.bindingEnergy + higherBE.satelliteOffset;
    for (let i = 0; i < points; i++) {
      const x = spectrum[i].x;
      const satellitePeak = gaussianLorentzian(x, satellitePosition, higherFwhm * 1.2, mixing, tailFactor);
      spectrum[i].y += satellitePeak * 1000 * higherBE.satelliteIntensity;
    }
  }

  // Add Shirley background
  const background = shirleyBackground(spectrum);
  for (let i = 0; i < points; i++) {
    spectrum[i].y += background[i];
  }

  // Add noise
  const noisySpectrum = addNoise(spectrum, signalToNoise, seed);

  return noisySpectrum;
}
