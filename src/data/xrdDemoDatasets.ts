import { XRD_PHASE_DATABASE } from './xrdPhaseDatabase';
import type { XrdPoint } from '../agents/xrdAgent/types';
import { gaussian, pseudoVoigt, roundTo } from '../utils/xrdMath';

export interface XrdDemoDataset {
  id: string;
  label: string;
  fileName: string;
  sampleName: string;
  description: string;
  expectedSignal: string;
  dataPoints: XrdPoint[];
}

type ComponentSpec = {
  phaseId: string;
  scale: number;
  width: number;
};

type SynthesisOptions = {
  components: ComponentSpec[];
  amorphousHalo?: {
    center: number;
    width: number;
    amplitude: number;
  };
  noiseAmplitude?: number;
  count?: number;
};

function phaseById(phaseId: string) {
  const phase = XRD_PHASE_DATABASE.find((item) => item.id === phaseId);
  if (!phase) {
    throw new Error(`Missing XRD reference phase: ${phaseId}`);
  }
  return phase;
}

function deterministicNoise(index: number, x: number, amplitude: number) {
  return amplitude * (
    0.48 * Math.sin(index * 0.71) +
    0.33 * Math.sin(index * 1.17 + 0.6) +
    0.19 * Math.sin(x * 0.41)
  );
}

/**
 * Generates Cu Kα₂ satellite peak contribution for a given main peak.
 * 
 * Cu Kα radiation consists of two components:
 * - Kα₁ (λ = 1.54056 Å) - main peak
 * - Kα₂ (λ = 1.54439 Å) - satellite peak at +0.2° with 15-20% intensity
 * 
 * Literature: JCPDS 25-0283, standard XRD reference data
 * 
 * @param x - Current 2θ position
 * @param mainPeakPosition - Position of the main Kα₁ peak (degrees 2θ)
 * @param relativeIntensity - Relative intensity of the main peak
 * @param width - Peak width (FWHM)
 * @returns Intensity contribution from the Kα₂ satellite peak
 */
function addKAlphaSatellites(
  x: number,
  mainPeakPosition: number,
  relativeIntensity: number,
  width: number
): number {
  // Cu Kα₂ satellite appears at +0.2° from main peak
  const satelliteOffset = 0.2;
  
  // Satellite intensity is 15-20% of main peak (using 17.5% as midpoint)
  const satelliteIntensity = 0.175;
  
  // Satellite peak is slightly broader than main peak
  const satelliteWidth = width * 1.15;
  
  // Generate satellite peak using pseudo-Voigt profile
  return relativeIntensity * satelliteIntensity * pseudoVoigt(
    x,
    mainPeakPosition + satelliteOffset,
    satelliteWidth,
    0.35
  );
}

/**
 * Generates realistic exponentially decaying background for XRD patterns.
 * 
 * XRD patterns typically exhibit exponentially decreasing background intensity
 * from low to high 2θ angles due to:
 * - Air scattering (decreases with angle)
 * - Sample fluorescence (decreases with angle)
 * - Incoherent scattering (decreases with angle)
 * 
 * The background is monotonically decreasing from 10° to 80° 2θ, which is
 * characteristic of real experimental XRD data collected with Cu Kα radiation.
 * 
 * Literature: Standard XRD background modeling, typical of powder diffraction
 * 
 * @param twoTheta - Diffraction angle in degrees (2θ)
 * @returns Background intensity at the given angle
 */
export function exponentialBackground(twoTheta: number): number {
  // Base background level
  const baseLevel = 12;
  
  // Exponential decay component (decreases from low to high angle)
  // Decay constant chosen to give realistic background shape over 10-80° range
  const decayAmplitude = 3.6;
  const decayConstant = 38;
  const exponentialComponent = decayAmplitude * Math.exp(-(twoTheta - 10) / decayConstant);
  
  // Small sinusoidal modulation to simulate instrument artifacts
  const modulationAmplitude = 0.42;
  const modulationFrequency = 0.24;
  const modulationComponent = modulationAmplitude * Math.sin(twoTheta * modulationFrequency);
  
  return baseLevel + exponentialComponent + modulationComponent;
}

/**
 * Calculates instrument-broadened peak width (FWHM) as a function of 2θ angle.
 * 
 * In real XRD instruments, peak widths increase with increasing diffraction angle
 * due to several instrumental factors:
 * - Axial divergence (increases with tan θ)
 * - Flat specimen error (increases with cos θ / sin² θ)
 * - Wavelength dispersion (increases with tan θ)
 * 
 * This function models the angular dependence of peak broadening using a
 * simplified monotonic function that ensures peak widths increase with 2θ.
 * The implementation is based on the Caglioti function (FWHM² = U·tan²θ + V·tanθ + W)
 * but uses parameters that ensure monotonic behavior across the full 10-80° range.
 * 
 * The implementation ensures peak widths increase monotonically (or remain constant)
 * with increasing 2θ, producing realistic XRD patterns where high-angle peaks
 * are broader than low-angle peaks.
 * 
 * Literature: 
 * - Caglioti et al., Nucl. Instrum. 3, 223 (1958)
 * - Standard instrument broadening models in Rietveld refinement
 * 
 * @param twoTheta - Diffraction angle in degrees (2θ)
 * @param intrinsicWidth - Intrinsic peak width (FWHM) in degrees, representing
 *                         sample-dependent broadening (crystallite size, strain)
 * @returns Instrument-broadened peak width (FWHM) in degrees
 */
export function instrumentBroadening(twoTheta: number, intrinsicWidth: number): number {
  // Convert 2θ to θ (in radians) for trigonometric functions
  const thetaRad = (twoTheta / 2) * (Math.PI / 180);
  
  // Simplified monotonic broadening model
  // Uses tan²θ term to ensure monotonic increase with angle
  // Parameters chosen to give realistic broadening over 10-80° range
  const U = 0.0035;  // tan²θ coefficient (controls high-angle broadening)
  const W = 0.0015;  // constant term (minimum instrument broadening)
  
  // Calculate instrument broadening contribution
  const tanTheta = Math.tan(thetaRad);
  const instrumentFWHM_squared = U * tanTheta * tanTheta + W;
  const instrumentFWHM = Math.sqrt(instrumentFWHM_squared);
  
  // Combine intrinsic and instrument broadening using quadratic addition
  // (appropriate for Gaussian-like peak shapes)
  const totalFWHM_squared = intrinsicWidth * intrinsicWidth + instrumentFWHM * instrumentFWHM;
  const totalFWHM = Math.sqrt(totalFWHM_squared);
  
  // Ensure result stays within realistic range for well-crystallized samples
  // (0.15° to 0.25° for CuFe₂O₄, but can be broader at high angles)
  return Math.max(0.15, totalFWHM);
}

/**
 * Applies preferred orientation correction factor for specific Miller indices.
 * 
 * Preferred orientation (texture) occurs when crystallites in a powder sample
 * are not randomly oriented but have a tendency to align along certain
 * crystallographic directions. This is common in:
 * - Plate-like or needle-like crystal morphologies
 * - Samples prepared by pressing, sedimentation, or thin film deposition
 * - Materials with anisotropic crystal structures
 * 
 * In spinel ferrites like CuFe₂O₄, preferred orientation along <111> directions
 * is commonly observed due to the octahedral site occupancy and crystal growth
 * habits. This causes (111) and (222) reflections to have reduced intensities
 * compared to random powder patterns.
 * 
 * The March-Dollase model is commonly used to describe preferred orientation:
 * P(hkl) = (r² cos²α + sin²α/r)^(-3/2)
 * where r is the March parameter (r < 1 for reduced intensity) and α is the
 * angle between the scattering vector and the preferred orientation direction.
 * 
 * For simplicity, this implementation applies a fixed reduction factor of 0.7
 * (30% reduction) to (111) and (222) reflections, representing moderate
 * preferred orientation effects typical of pressed pellet samples.
 * 
 * Literature:
 * - Dollase, W. A. (1986). "Correction of intensities for preferred orientation
 *   in powder diffractometry." J. Appl. Cryst. 19, 267-272.
 * - March, A. (1932). "Mathematische Theorie der Regelung nach der Korngestalt
 *   bei affiner Deformation." Z. Kristallogr. 81, 285-297.
 * 
 * @param hkl - Miller indices as a string, e.g., "(111)", "(222)", "(311)"
 * @returns Intensity scaling factor (0.7 for (111) and (222), 1.0 for others)
 */
export function preferredOrientationFactor(hkl: string): number {
  // Apply 30% reduction (factor of 0.7) to (111) and (222) reflections
  // These reflections are most affected by preferred orientation along <111>
  if (hkl === '(111)' || hkl === '(222)') {
    return 0.7;
  }
  
  // No preferred orientation correction for other reflections
  return 1.0;
}

function synthesizeXrdPattern(options: SynthesisOptions): XrdPoint[] {
  const count = options.count ?? 701;
  const noiseAmplitude = options.noiseAmplitude ?? 0.65;

  return Array.from({ length: count }, (_, index) => {
    const x = 10 + (70 * index) / (count - 1);
    const baseline = exponentialBackground(x);
    const halo = options.amorphousHalo
      ? options.amorphousHalo.amplitude * gaussian(x, options.amorphousHalo.center, options.amorphousHalo.width)
      : 0;
    const crystallineSignal = options.components.reduce((sum, component) => {
      const phase = phaseById(component.phaseId);
      const phaseSignal = phase.peaks.reduce((phaseSum, peak) => {
        // Apply instrument broadening: peak width increases with 2θ angle
        const broadenedWidth = instrumentBroadening(peak.position, component.width);
        
        // Apply preferred orientation correction: reduces (111) and (222) intensities
        const orientationFactor = preferredOrientationFactor(peak.hkl);
        const correctedIntensity = peak.relativeIntensity * orientationFactor;
        
        const main = correctedIntensity * pseudoVoigt(x, peak.position, broadenedWidth, 0.3);
        const satellite = addKAlphaSatellites(x, peak.position, correctedIntensity, broadenedWidth);
        return phaseSum + main + satellite;
      }, 0);
      return sum + phaseSignal * component.scale;
    }, 0);

    return {
      x: roundTo(x, 2),
      y: roundTo(Math.max(0, baseline + halo + crystallineSignal + deterministicNoise(index, x, noiseAmplitude)), 3),
    };
  });
}

export const XRD_DEMO_DATASETS: XrdDemoDataset[] = [
  {
    id: 'xrd-cufe2o4-clean',
    label: 'CuFe2O4 clean',
    fileName: 'cufe2o4_clean_demo.xy',
    sampleName: 'CuFe2O4 clean reference',
    description: 'Crystalline copper ferrite pattern with the expected spinel reflection series.',
    expectedSignal: 'CuFe2O4 should score as the primary phase with limited unexplained intensity.',
    dataPoints: synthesizeXrdPattern({
      components: [{ phaseId: 'cufe2o4', scale: 0.86, width: 0.16 }],
      noiseAmplitude: 0.58,
    }),
  },
  {
    id: 'xrd-cufe2o4-fe2o3-impurity',
    label: 'CuFe2O4 + Fe2O3 impurity',
    fileName: 'cufe2o4_fe2o3_impurity_demo.xy',
    sampleName: 'CuFe2O4 with hematite impurity',
    description: 'Copper ferrite pattern with additional hematite reflections at diagnostic positions.',
    expectedSignal: 'CuFe2O4 remains plausible, while alpha-Fe2O3 should be flagged as a possible impurity.',
    dataPoints: synthesizeXrdPattern({
      components: [
        { phaseId: 'cufe2o4', scale: 0.72, width: 0.17 },
        { phaseId: 'alpha-fe2o3', scale: 0.32, width: 0.15 },
      ],
      noiseAmplitude: 0.62,
    }),
  },
  {
    id: 'xrd-amorphous-dominant',
    label: 'Amorphous-dominant sample',
    fileName: 'amorphous_dominant_demo.xy',
    sampleName: 'Amorphous-dominant ferrite precursor',
    description: 'Broad diffuse scattering with weak crystalline ferrite remnants.',
    expectedSignal: 'The agent should avoid a confident phase claim and report low confidence.',
    dataPoints: synthesizeXrdPattern({
      components: [{ phaseId: 'cufe2o4', scale: 0.13, width: 0.31 }],
      amorphousHalo: { center: 28.2, width: 5.6, amplitude: 62 },
      noiseAmplitude: 0.52,
    }),
  },
  {
    id: 'xrd-nife2o4-control',
    label: 'NiFe2O4 control',
    fileName: 'nife2o4_control_demo.xy',
    sampleName: 'NiFe2O4 control sample',
    description: 'Nickel ferrite control pattern with the expected spinel reflection series.',
    expectedSignal: 'NiFe2O4 should appear as the working spinel-ferrite assignment with validation boundaries.',
    dataPoints: synthesizeXrdPattern({
      components: [{ phaseId: 'nife2o4', scale: 0.82, width: 0.16 }],
      noiseAmplitude: 0.56,
    }),
  },
  {
    id: 'xrd-cofe2o4-control',
    label: 'CoFe2O4 control',
    fileName: 'cofe2o4_control_demo.xy',
    sampleName: 'CoFe2O4 control sample',
    description: 'Cobalt ferrite control pattern with the expected spinel reflection series.',
    expectedSignal: 'CoFe2O4 should appear as the working spinel-ferrite assignment with validation boundaries.',
    dataPoints: synthesizeXrdPattern({
      components: [{ phaseId: 'cofe2o4', scale: 0.84, width: 0.16 }],
      noiseAmplitude: 0.56,
    }),
  },
];

export function getXrdDemoDataset(datasetId?: string | null) {
  return XRD_DEMO_DATASETS.find((dataset) => dataset.id === datasetId) ?? XRD_DEMO_DATASETS[0];
}

/**
 * Project-dataset compatibility mapping.
 * Only projects listed here have valid XRD demo data.
 * Projects without an entry must not render CuFe2O4 evidence as their own.
 */
export const XRD_PROJECT_COMPATIBILITY: Record<string, {
  /** Dataset IDs that belong to this project */
  datasetIds: string[];
  /** Short label for the working assignment */
  assignment: string;
  /** Material label for display */
  materialLabel: string;
}> = {
  'cu-fe2o4-spinel': {
    datasetIds: ['xrd-cufe2o4-clean', 'xrd-cufe2o4-fe2o3-impurity', 'xrd-amorphous-dominant'],
    assignment: 'CuFe2O4',
    materialLabel: 'copper ferrite spinel',
  },
  'cufe2o4-sba15': {
    datasetIds: ['xrd-cufe2o4-clean'],
    assignment: 'CuFe2O4/SBA-15',
    materialLabel: 'copper ferrite on mesoporous silica',
  },
  nife2o4: {
    datasetIds: ['xrd-nife2o4-control'],
    assignment: 'NiFe2O4',
    materialLabel: 'nickel ferrite spinel',
  },
  cofe2o4: {
    datasetIds: ['xrd-cofe2o4-control'],
    assignment: 'CoFe2O4',
    materialLabel: 'cobalt ferrite spinel',
  },
};

/**
 * Check if a project has valid XRD demo data.
 * Returns the compatibility entry if valid, or null if the project has no matching XRD dataset.
 */
export function getXrdProjectCompatibility(projectId: string) {
  return XRD_PROJECT_COMPATIBILITY[projectId] ?? null;
}

/**
 * Check if a dataset belongs to a project.
 */
export function isDatasetCompatibleWithProject(datasetId: string, projectId: string): boolean {
  const compat = XRD_PROJECT_COMPATIBILITY[projectId];
  if (!compat) return false;
  return compat.datasetIds.includes(datasetId);
}
