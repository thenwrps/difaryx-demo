/**
 * FTIR Demo Data
 * 
 * Realistic Fourier Transform Infrared Spectroscopy data for metal oxide catalyst
 * demonstrating surface hydroxyl groups, adsorbed water, carbonate/carboxylate species,
 * and metal-oxygen vibrations.
 */

export interface FtirPoint {
  x: number;  // Wavenumber (cm⁻¹)
  y: number;  // Absorbance
}

export interface FtirDetectedBand {
  id: string;
  wavenumber: number;           // Band position (cm⁻¹)
  intensity: number;            // Band height (normalized)
  rawIntensity: number;         // Band height (raw absorbance)
  prominence: number;           // Band prominence
  fwhm: number;                 // Full Width at Half Maximum (cm⁻¹)
  area: number;                 // Integrated band area
  classification: 'narrow' | 'medium' | 'broad';
  assignment?: string;          // Functional group assignment
  label?: string;               // Display label
}

export interface FtirFunctionalGroupMatch {
  bandId: string;
  observedWavenumber: number;   // cm⁻¹
  referenceRange: [number, number];  // [min, max] cm⁻¹
  deltaFromCenter: number;      // Distance from range center (cm⁻¹)
  functionalGroup: string;
  assignment: string;           // Detailed assignment
  confidence: number;           // 0-1
  ambiguity?: string;           // Ambiguity description if multiple candidates
}

export interface FtirDataset {
  id: string;
  label: string;
  sampleName: string;
  fileName: string;
  signal: {
    wavenumber: number[];       // cm⁻¹ (high to low for FTIR convention)
    absorbance: number[];       // Absorbance units
  };
  baseline: number[];           // Background absorbance
  bands: FtirDetectedBand[];
  matches: FtirFunctionalGroupMatch[];
}

/**
 * Generate realistic FTIR spectrum for metal oxide catalyst
 * Includes characteristic bands:
 * - Surface hydroxyl: ~3400 cm⁻¹ (broad, FWHM ~200 cm⁻¹)
 * - Adsorbed water: ~1630 cm⁻¹ (medium, FWHM ~60 cm⁻¹)
 * - Carbonate/carboxylate: ~1450-1550 cm⁻¹ (overlapping region)
 * - Metal-oxygen: ~550 cm⁻¹ (broad, FWHM ~100 cm⁻¹)
 */
function generateFtirSpectrum(): { wavenumber: number[]; absorbance: number[] } {
  const wavenumber: number[] = [];
  const absorbance: number[] = [];
  
  // FTIR mid-IR region: 4000-400 cm⁻¹ (high to low, FTIR convention)
  for (let wn = 4000; wn >= 400; wn -= 2) {
    wavenumber.push(wn);
    
    // Baseline (slightly sloped, typical for FTIR)
    let signal = 0.05 + (4000 - wn) / 40000;
    
    // Add noise (realistic FTIR noise level)
    signal += (Math.random() - 0.5) * 0.008;
    
    // Band 1: Surface hydroxyl (O–H stretch) at ~3400 cm⁻¹ (broad)
    const oh_stretch = 0.45 * Math.exp(-Math.pow((wn - 3400) / 100, 2));
    
    // Band 2: Adsorbed water (H–O–H bend) at ~1630 cm⁻¹ (medium)
    const water_bend = 0.25 * Math.exp(-Math.pow((wn - 1630) / 30, 2));
    
    // Band 3: Carbonate (CO₃²⁻) at ~1450 cm⁻¹ (medium, overlapping region)
    const carbonate = 0.18 * Math.exp(-Math.pow((wn - 1450) / 35, 2));
    
    // Band 4: Carboxylate (COO⁻) at ~1550 cm⁻¹ (medium, overlapping region)
    const carboxylate = 0.15 * Math.exp(-Math.pow((wn - 1550) / 40, 2));
    
    // Band 5: Metal-oxygen (M–O stretch) at ~550 cm⁻¹ (broad)
    const metal_oxygen = 0.35 * Math.exp(-Math.pow((wn - 550) / 50, 2));
    
    // Band 6: C–H stretch at ~2920 cm⁻¹ (narrow, minor contamination)
    const ch_stretch = 0.08 * Math.exp(-Math.pow((wn - 2920) / 15, 2));
    
    signal += oh_stretch + water_bend + carbonate + carboxylate + metal_oxygen + ch_stretch;
    
    absorbance.push(Number(signal.toFixed(4)));
  }
  
  return { wavenumber, absorbance };
}

/**
 * Generate baseline (polynomial-like background)
 */
function generateBaseline(absorbance: number[]): number[] {
  const baseline: number[] = [];
  const n = absorbance.length;
  
  for (let i = 0; i < n; i++) {
    // Simple polynomial baseline approximation
    const progress = i / (n - 1);
    const baselineValue = 0.05 + progress * 0.03;
    baseline.push(Number(baselineValue.toFixed(4)));
  }
  
  return baseline;
}

// Generate FTIR spectrum
const ftirSpectrum = generateFtirSpectrum();
const ftirBaseline = generateBaseline(ftirSpectrum.absorbance);

/**
 * FTIR Demo Dataset
 * 
 * Sample: Metal oxide catalyst (e.g., CuO/Al₂O₃)
 * Region: Mid-IR (400-4000 cm⁻¹)
 * Features: Surface hydroxyl, adsorbed water, carbonate/carboxylate species, metal-oxygen vibrations
 */
export const ftirDemoData: FtirDataset = {
  id: 'ftir-demo-001',
  label: 'Metal oxide catalyst',
  sampleName: 'CuO/Al₂O₃ catalyst',
  fileName: 'catalyst_ftir.csv',
  
  signal: ftirSpectrum,
  baseline: ftirBaseline,
  
  // Detected bands (after baseline correction and band detection)
  bands: [
    {
      id: 'band-1',
      wavenumber: 3400,
      intensity: 0.45,
      rawIntensity: 0.45,
      prominence: 0.42,
      fwhm: 200,
      area: 105,
      classification: 'broad',
      assignment: 'O–H stretch',
      label: 'Surface hydroxyl',
    },
    {
      id: 'band-2',
      wavenumber: 2920,
      intensity: 0.08,
      rawIntensity: 0.08,
      prominence: 0.07,
      fwhm: 30,
      area: 2.8,
      classification: 'narrow',
      assignment: 'C–H stretch',
      label: 'Organic contamination',
    },
    {
      id: 'band-3',
      wavenumber: 1630,
      intensity: 0.25,
      rawIntensity: 0.25,
      prominence: 0.23,
      fwhm: 60,
      area: 17.5,
      classification: 'medium',
      assignment: 'H–O–H bend',
      label: 'Adsorbed water',
    },
    {
      id: 'band-4',
      wavenumber: 1550,
      intensity: 0.15,
      rawIntensity: 0.15,
      prominence: 0.13,
      fwhm: 80,
      area: 14,
      classification: 'medium',
      assignment: 'COO⁻ stretch',
      label: 'Carboxylate',
    },
    {
      id: 'band-5',
      wavenumber: 1450,
      intensity: 0.18,
      rawIntensity: 0.18,
      prominence: 0.16,
      fwhm: 70,
      area: 14.7,
      classification: 'medium',
      assignment: 'CO₃²⁻ stretch',
      label: 'Carbonate',
    },
    {
      id: 'band-6',
      wavenumber: 550,
      intensity: 0.35,
      rawIntensity: 0.35,
      prominence: 0.32,
      fwhm: 100,
      area: 40.8,
      classification: 'broad',
      assignment: 'M–O stretch',
      label: 'Metal-oxygen',
    },
  ],
  
  // Functional group matching results
  matches: [
    {
      bandId: 'band-1',
      observedWavenumber: 3400,
      referenceRange: [3200, 3600],
      deltaFromCenter: 0,
      functionalGroup: 'Surface hydroxyl',
      assignment: 'O–H stretching vibration',
      confidence: 0.92,
    },
    {
      bandId: 'band-2',
      observedWavenumber: 2920,
      referenceRange: [2850, 2960],
      deltaFromCenter: 15,
      functionalGroup: 'Aliphatic C–H',
      assignment: 'C–H stretching vibration',
      confidence: 0.85,
    },
    {
      bandId: 'band-3',
      observedWavenumber: 1630,
      referenceRange: [1630, 1650],
      deltaFromCenter: 10,
      functionalGroup: 'Adsorbed water',
      assignment: 'H–O–H bending vibration',
      confidence: 0.88,
    },
    {
      bandId: 'band-4',
      observedWavenumber: 1550,
      referenceRange: [1550, 1650],
      deltaFromCenter: 50,
      functionalGroup: 'Carboxylate',
      assignment: 'COO⁻ asymmetric stretching',
      confidence: 0.68,
      ambiguity: 'Overlapping with carbonate region',
    },
    {
      bandId: 'band-5',
      observedWavenumber: 1450,
      referenceRange: [1400, 1500],
      deltaFromCenter: 0,
      functionalGroup: 'Carbonate',
      assignment: 'CO₃²⁻ asymmetric stretching',
      confidence: 0.72,
      ambiguity: 'Overlapping with carboxylate region',
    },
    {
      bandId: 'band-6',
      observedWavenumber: 550,
      referenceRange: [500, 650],
      deltaFromCenter: 25,
      functionalGroup: 'Metal-oxygen vibration',
      assignment: 'M–O stretching (spinel structure)',
      confidence: 0.90,
    },
  ],
};

export const fe3o4FtirDemoData: FtirDataset = {
  ...ftirDemoData,
  id: 'fe3o4-ftir-demo-001',
  label: 'Fe3O4 nanoparticle FTIR',
  sampleName: 'Fe3O4 nanoparticle sample',
  fileName: 'fe3o4_nanoparticles_ftir.csv',
};

/**
 * Export all demo datasets
 */
export const FTIR_DEMO_DATASETS = [ftirDemoData, fe3o4FtirDemoData];

export function getFtirProjectDatasetId(projectId?: string | null): string | null {
  if (projectId === 'fe3o4-nanoparticles') return fe3o4FtirDemoData.id;
  return null;
}

/**
 * Helper function to get demo dataset by ID
 */
export function getFtirDemoDataset(id: string | null): FtirDataset {
  if (!id) return ftirDemoData;
  return FTIR_DEMO_DATASETS.find(dataset => dataset.id === id) || ftirDemoData;
}
