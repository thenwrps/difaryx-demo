/**
 * Raman Demo Data
 * 
 * Realistic Raman spectroscopy data for spinel ferrite catalyst
 * demonstrating characteristic vibrational modes and optional carbon/defect features.
 */

export interface RamanPoint {
  x: number;  // Raman shift (cm⁻¹)
  y: number;  // Intensity (a.u.)
}

export interface RamanDetectedPeak {
  id: string;
  ramanShift: number;
  intensity: number;
  rawIntensity: number;
  prominence: number;
  fwhm: number;
  area: number;
  classification: 'sharp' | 'medium' | 'broad';
  assignment?: string;
  label?: string;
}

export interface RamanDataset {
  id: string;
  label: string;
  sampleName: string;
  fileName: string;
  signal: {
    ramanShift: number[];       // cm⁻¹ (low to high)
    intensity: number[];        // a.u.
  };
  baseline: number[];
  peaks: RamanDetectedPeak[];
}

/**
 * Generate realistic Raman spectrum for spinel ferrite catalyst
 * Includes characteristic modes:
 * - ~690 cm⁻¹ A1g spinel ferrite mode (primary diagnostic)
 * - ~470 cm⁻¹ Eg mode (supporting)
 * - ~330 cm⁻¹ lower-frequency ferrite mode (supporting)
 * - Optional ~1350 cm⁻¹ D band (carbon/defect)
 * - Optional ~1580 cm⁻¹ G band (carbon residue)
 */
function generateRamanSpectrum(): { ramanShift: number[]; intensity: number[] } {
  const ramanShift: number[] = [];
  const intensity: number[] = [];
  
  // Raman region: 200-1800 cm⁻¹ (low to high, normal direction)
  for (let rs = 200; rs <= 1800; rs += 2) {
    ramanShift.push(rs);
    
    // Baseline (slightly sloped, typical for Raman)
    let signal = 0.08 + (rs - 200) / 20000;
    
    // Add noise (realistic Raman noise level)
    signal += (Math.random() - 0.5) * 0.012;
    
    // Peak 1: A1g spinel ferrite mode at ~690 cm⁻¹ (sharp, primary diagnostic)
    const a1g_mode = 0.85 * Math.exp(-Math.pow((rs - 690) / 18, 2));
    
    // Peak 2: Eg mode at ~470 cm⁻¹ (medium, supporting)
    const eg_mode = 0.45 * Math.exp(-Math.pow((rs - 470) / 25, 2));
    
    // Peak 3: Lower-frequency ferrite mode at ~330 cm⁻¹ (medium, supporting)
    const low_ferrite = 0.35 * Math.exp(-Math.pow((rs - 330) / 22, 2));
    
    // Peak 4: D band at ~1350 cm⁻¹ (medium, carbon/defect)
    const d_band = 0.25 * Math.exp(-Math.pow((rs - 1350) / 35, 2));
    
    // Peak 5: G band at ~1580 cm⁻¹ (sharp, carbon residue)
    const g_band = 0.30 * Math.exp(-Math.pow((rs - 1580) / 20, 2));
    
    signal += a1g_mode + eg_mode + low_ferrite + d_band + g_band;
    
    intensity.push(Number(signal.toFixed(4)));
  }
  
  return { ramanShift, intensity };
}

/**
 * Generate baseline (polynomial-like background)
 */
function generateBaseline(intensity: number[]): number[] {
  const baseline: number[] = [];
  const n = intensity.length;
  
  for (let i = 0; i < n; i++) {
    // Simple polynomial baseline approximation
    const progress = i / (n - 1);
    const baselineValue = 0.08 + progress * 0.02;
    baseline.push(Number(baselineValue.toFixed(4)));
  }
  
  return baseline;
}

// Generate Raman spectrum
const ramanSpectrum = generateRamanSpectrum();
const ramanBaseline = generateBaseline(ramanSpectrum.intensity);

/**
 * Raman Demo Dataset
 * 
 * Sample: Spinel ferrite catalyst (e.g., CoFe₂O₄)
 * Region: 200-1800 cm⁻¹
 * Features: A1g ferrite mode, Eg mode, lower-frequency modes, D/G bands
 */
export const ramanDemoData: RamanDataset = {
  id: 'raman-demo-001',
  label: 'Spinel ferrite catalyst',
  sampleName: 'CoFe₂O₄ catalyst',
  fileName: 'catalyst_raman.csv',
  
  signal: ramanSpectrum,
  baseline: ramanBaseline,
  
  // Detected peaks (after baseline correction and peak detection)
  peaks: [
    {
      id: 'peak-1',
      ramanShift: 330,
      intensity: 0.35,
      rawIntensity: 0.35,
      prominence: 0.33,
      fwhm: 44,
      area: 17.9,
      classification: 'medium',
      assignment: 'Lower ferrite mode',
      label: 'Ferrite',
    },
    {
      id: 'peak-2',
      ramanShift: 470,
      intensity: 0.45,
      rawIntensity: 0.45,
      prominence: 0.42,
      fwhm: 50,
      area: 26.3,
      classification: 'medium',
      assignment: 'Eg mode',
      label: 'Ferrite Eg',
    },
    {
      id: 'peak-3',
      ramanShift: 690,
      intensity: 0.85,
      rawIntensity: 0.85,
      prominence: 0.82,
      fwhm: 36,
      area: 35.7,
      classification: 'sharp',
      assignment: 'A1g mode',
      label: 'Ferrite A1g',
    },
    {
      id: 'peak-4',
      ramanShift: 1350,
      intensity: 0.25,
      rawIntensity: 0.25,
      prominence: 0.23,
      fwhm: 70,
      area: 20.4,
      classification: 'medium',
      assignment: 'D band',
      label: 'Carbon/defect',
    },
    {
      id: 'peak-5',
      ramanShift: 1580,
      intensity: 0.30,
      rawIntensity: 0.30,
      prominence: 0.28,
      fwhm: 40,
      area: 14.0,
      classification: 'sharp',
      assignment: 'G band',
      label: 'Carbon residue',
    },
  ],
};

/**
 * Export all demo datasets
 */
export const RAMAN_DEMO_DATASETS = [ramanDemoData];

/**
 * Helper function to get demo dataset by ID
 */
export function getRamanDemoDataset(id: string | null): RamanDataset {
  if (!id) return ramanDemoData;
  return RAMAN_DEMO_DATASETS.find(dataset => dataset.id === id) || ramanDemoData;
}
