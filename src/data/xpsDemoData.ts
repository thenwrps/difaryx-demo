/**
 * XPS Demo Data
 * 
 * Realistic X-ray Photoelectron Spectroscopy data for Cu 2p region
 * demonstrating Cu²⁺ and Cu⁺ oxidation states in a copper oxide sample.
 */

export interface XpsPeak {
  id: string;
  bindingEnergy: number; // eV
  intensity: number; // counts
  fwhm: number; // eV
  area: number; // integrated intensity
  assignment?: string; // chemical state assignment
}

export interface XpsChemicalStateMatch {
  peakId: string;
  observedBE: number; // eV
  referenceBE: number; // eV
  deltaBE: number; // eV
  element: string;
  oxidationState: string;
  assignment: string;
  confidence: number; // 0-1
}

export interface XpsDataset {
  id: string;
  label: string;
  region: string;
  sampleName: string;
  fileName: string;
  signal: {
    bindingEnergy: number[]; // eV (high to low for XPS convention)
    intensity: number[]; // counts
  };
  baseline: number[]; // background intensity
  peaks: XpsPeak[];
  matches: XpsChemicalStateMatch[];
}

/**
 * Generate realistic Cu 2p XPS spectrum
 * Pure Cu²⁺ with 2p3/2, 2p1/2 doublet and satellite features
 */
function generateCu2pSpectrum(): { bindingEnergy: number[]; intensity: number[] } {
  const bindingEnergy: number[] = [];
  const intensity: number[] = [];
  
  // Cu 2p region: 925-965 eV (reversed for XPS convention: high to low)
  for (let be = 965; be >= 925; be -= 0.1) {
    bindingEnergy.push(Number(be.toFixed(1)));
    
    // Background baseline (Shirley-like)
    let signal = 1200 + Math.random() * 80;
    
    // Cu 2p3/2 main peak (Cu²⁺ at 933.3 eV)
    const cu2p3_cu2 = 10200 * Math.exp(-Math.pow((be - 933.3) / 1.7, 2));
    
    // Cu 2p1/2 main peak (Cu²⁺ at 953.1 eV)
    const cu2p1_cu2 = 5100 * Math.exp(-Math.pow((be - 953.1) / 1.8, 2));
    
    // Satellite features (characteristic of Cu²⁺)
    const satellite1 = 1400 * Math.exp(-Math.pow((be - 942.5) / 2.5, 2));
    const satellite2 = 900 * Math.exp(-Math.pow((be - 962.0) / 2.8, 2));
    
    signal += cu2p3_cu2 + cu2p1_cu2 + satellite1 + satellite2;
    
    intensity.push(Math.round(signal));
  }
  
  return { bindingEnergy, intensity };
}

/**
 * Generate baseline (Shirley-like background)
 */
function generateBaseline(intensity: number[]): number[] {
  const baseline: number[] = [];
  const minIntensity = Math.min(...intensity);
  
  for (let i = 0; i < intensity.length; i++) {
    // Simple linear baseline approximation
    const progress = i / (intensity.length - 1);
    const baselineValue = minIntensity + (1200 - minIntensity) * (1 - progress);
    baseline.push(Math.round(baselineValue));
  }
  
  return baseline;
}

// Generate Cu 2p spectrum
const cu2pSpectrum = generateCu2pSpectrum();
const cu2pBaseline = generateBaseline(cu2pSpectrum.intensity);

/**
 * Cu 2p XPS Demo Dataset
 * 
 * Sample: Copper(II) oxide (CuO) - pure Cu²⁺
 * Region: Cu 2p (925-965 eV)
 * Features: Cu²⁺ 2p3/2, 2p1/2 doublet with satellite structure
 */
export const xpsDemoData: XpsDataset = {
  id: 'cu2p-demo-001',
  label: 'Cu 2p region',
  region: 'Cu 2p',
  sampleName: 'Copper oxide sample',
  fileName: 'cu2p_spectrum.xy',
  
  signal: cu2pSpectrum,
  baseline: cu2pBaseline,
  
  // Detected peaks (after background subtraction and peak fitting)
  peaks: [
    {
      id: 'peak-1',
      bindingEnergy: 933.3,
      intensity: 10200,
      fwhm: 1.7,
      area: 20100,
      assignment: 'Cu²⁺',
    },
    {
      id: 'peak-2',
      bindingEnergy: 942.5,
      intensity: 1400,
      fwhm: 2.5,
      area: 4050,
      assignment: 'Cu²⁺ satellite',
    },
    {
      id: 'peak-3',
      bindingEnergy: 953.1,
      intensity: 5100,
      fwhm: 1.8,
      area: 10650,
      assignment: 'Cu²⁺',
    },
  ],
  
  // Chemical state matching results
  matches: [
    {
      peakId: 'peak-1',
      observedBE: 933.3,
      referenceBE: 933.6,
      deltaBE: -0.3,
      element: 'Cu',
      oxidationState: 'Cu²⁺',
      assignment: 'Cu 2p3/2 (Cu²⁺)',
      confidence: 0.98,
    },
    {
      peakId: 'peak-3',
      observedBE: 953.1,
      referenceBE: 953.4,
      deltaBE: -0.3,
      element: 'Cu',
      oxidationState: 'Cu²⁺',
      assignment: 'Cu 2p1/2 (Cu²⁺)',
      confidence: 0.95,
    },
  ],
};

/**
 * Additional demo dataset: C 1s region (for reference)
 * Useful for energy calibration
 */
export const c1sDemoData: XpsDataset = {
  id: 'c1s-demo-001',
  label: 'C 1s region',
  region: 'C 1s',
  sampleName: 'Carbon reference',
  fileName: 'c1s_spectrum.xy',
  
  signal: {
    bindingEnergy: Array.from({ length: 81 }, (_, i) => 292 - i * 0.1),
    intensity: Array.from({ length: 81 }, (_, i) => {
      const be = 292 - i * 0.1;
      let signal = 800 + Math.random() * 50;
      
      // C-C peak at 284.8 eV
      signal += 6500 * Math.exp(-Math.pow((be - 284.8) / 1.2, 2));
      
      // C-O peak at 286.5 eV
      signal += 2200 * Math.exp(-Math.pow((be - 286.5) / 1.3, 2));
      
      // C=O peak at 288.2 eV
      signal += 1100 * Math.exp(-Math.pow((be - 288.2) / 1.4, 2));
      
      return Math.round(signal);
    }),
  },
  
  baseline: Array.from({ length: 81 }, () => 800),
  
  peaks: [
    {
      id: 'c-peak-1',
      bindingEnergy: 284.8,
      intensity: 6500,
      fwhm: 1.2,
      area: 9100,
      assignment: 'C–C',
    },
    {
      id: 'c-peak-2',
      bindingEnergy: 286.5,
      intensity: 2200,
      fwhm: 1.3,
      area: 3300,
      assignment: 'C–O',
    },
    {
      id: 'c-peak-3',
      bindingEnergy: 288.2,
      intensity: 1100,
      fwhm: 1.4,
      area: 1800,
      assignment: 'C=O',
    },
  ],
  
  matches: [
    {
      peakId: 'c-peak-1',
      observedBE: 284.8,
      referenceBE: 284.8,
      deltaBE: 0.0,
      element: 'C',
      oxidationState: 'C(0)',
      assignment: 'C 1s (C–C)',
      confidence: 1.0,
    },
    {
      peakId: 'c-peak-2',
      observedBE: 286.5,
      referenceBE: 286.5,
      deltaBE: 0.0,
      element: 'C',
      oxidationState: 'C(+2)',
      assignment: 'C 1s (C–O)',
      confidence: 0.95,
    },
    {
      peakId: 'c-peak-3',
      observedBE: 288.2,
      referenceBE: 288.3,
      deltaBE: -0.1,
      element: 'C',
      oxidationState: 'C(+4)',
      assignment: 'C 1s (C=O)',
      confidence: 0.91,
    },
  ],
};

function generateCoFe2pSpectrum(): { bindingEnergy: number[]; intensity: number[] } {
  const bindingEnergy: number[] = [];
  const intensity: number[] = [];

  for (let be = 810; be >= 700; be -= 0.2) {
    const rounded = Number(be.toFixed(1));
    bindingEnergy.push(rounded);

    let signal = 980 + 120 * Math.exp(-(810 - be) / 95) + 22 * Math.sin(be * 0.17);
    signal += 6200 * Math.exp(-Math.pow((be - 780.1) / 1.7, 2));
    signal += 4200 * Math.exp(-Math.pow((be - 795.6) / 1.9, 2));
    signal += 5600 * Math.exp(-Math.pow((be - 710.8) / 1.6, 2));
    signal += 3600 * Math.exp(-Math.pow((be - 724.4) / 1.8, 2));
    signal += 700 * Math.exp(-Math.pow((be - 786.0) / 2.8, 2));

    intensity.push(Math.round(signal));
  }

  return { bindingEnergy, intensity };
}

const coFe2pSpectrum = generateCoFe2pSpectrum();
const coFe2pBaseline = generateBaseline(coFe2pSpectrum.intensity);

export const cofe2o4XpsDemoData: XpsDataset = {
  id: 'cofe2o4-xps-demo-001',
  label: 'CoFe2O4 Co/Fe 2p regions',
  region: 'Co 2p + Fe 2p',
  sampleName: 'CoFe2O4 control sample',
  fileName: 'cofe2o4_surface_xps.xy',

  signal: coFe2pSpectrum,
  baseline: coFe2pBaseline,

  peaks: [
    {
      id: 'co-peak-1',
      bindingEnergy: 780.1,
      intensity: 6200,
      fwhm: 1.7,
      area: 11800,
      assignment: 'Co 2p3/2',
    },
    {
      id: 'co-peak-2',
      bindingEnergy: 795.6,
      intensity: 4200,
      fwhm: 1.9,
      area: 8200,
      assignment: 'Co 2p1/2',
    },
    {
      id: 'fe-peak-1',
      bindingEnergy: 710.8,
      intensity: 5600,
      fwhm: 1.6,
      area: 9800,
      assignment: 'Fe 2p3/2',
    },
    {
      id: 'fe-peak-2',
      bindingEnergy: 724.4,
      intensity: 3600,
      fwhm: 1.8,
      area: 6500,
      assignment: 'Fe 2p1/2',
    },
  ],

  matches: [
    {
      peakId: 'co-peak-1',
      observedBE: 780.1,
      referenceBE: 780.0,
      deltaBE: 0.1,
      element: 'Co',
      oxidationState: 'Co(II/III)',
      assignment: 'Co 2p3/2 surface-state envelope',
      confidence: 0.86,
    },
    {
      peakId: 'fe-peak-1',
      observedBE: 710.8,
      referenceBE: 710.8,
      deltaBE: 0.0,
      element: 'Fe',
      oxidationState: 'Fe(III)',
      assignment: 'Fe 2p3/2 ferrite-like envelope',
      confidence: 0.9,
    },
  ],
};

/**
 * Export all demo datasets
 */
export const XPS_DEMO_DATASETS = [xpsDemoData, c1sDemoData, cofe2o4XpsDemoData];

export function getXpsProjectDatasetId(projectId?: string | null): string | null {
  if (projectId === 'cofe2o4') return cofe2o4XpsDemoData.id;
  return null;
}

/**
 * Helper function to get demo dataset by ID
 */
export function getXpsDemoDataset(id: string | null): XpsDataset {
  if (!id) return xpsDemoData;
  return XPS_DEMO_DATASETS.find(dataset => dataset.id === id) || xpsDemoData;
}
