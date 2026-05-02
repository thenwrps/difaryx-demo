/**
 * FTIR Reference Data for CuFe₂O₄ (Copper Ferrite)
 * 
 * This module contains scientifically accurate Fourier Transform Infrared Spectroscopy (FTIR)
 * vibrational band positions for copper ferrite characterization. All values are validated
 * against peer-reviewed literature on spinel ferrite spectroscopy.
 * 
 * Literature Sources:
 * - Waldron, R. D. (1955). "Infrared Spectra of Ferrites." Physical Review, 99(6), 1727-1735.
 *   DOI: 10.1103/PhysRev.99.1727
 *   [Seminal work on metal-oxygen vibrations in spinel ferrites]
 * 
 * - Preudhomme, J., & Tarte, P. (1971). "Infrared studies of spinels—III: The normal II-III
 *   spinels." Spectrochimica Acta Part A, 27(9), 1817-1835.
 *   [Comprehensive IR study of spinel structure vibrations]
 * 
 * - Nakamoto, K. (2009). "Infrared and Raman Spectra of Inorganic and Coordination Compounds."
 *   6th Edition, Wiley. [Reference for metal-oxygen stretching vibrations]
 */

/**
 * Interface for FTIR vibrational band reference data
 */
export interface FtirBandReference {
  /** Wavenumber position in cm⁻¹ */
  position: number;
  
  /** Experimental uncertainty in cm⁻¹ */
  uncertainty: number;
  
  /** Vibrational mode assignment description */
  assignment: string;
  
  /** Type of chemical bond involved */
  bondType: string;
  
  /** Crystallographic site (tetrahedral, octahedral, or surface) */
  site: 'tetrahedral' | 'octahedral' | 'surface';
  
  /** Full width at half maximum (FWHM) range [min, max] in cm⁻¹ */
  fwhm: [number, number];
  
  /** Literature source citation */
  literatureSource: string;
}

/**
 * FTIR reference data for CuFe₂O₄ characterization
 * 
 * Copper ferrite (CuFe₂O₄) has an inverse spinel structure (space group Fd-3m) where:
 * - Tetrahedral sites (A-sites): Fe³⁺ ions coordinated by 4 oxygen atoms
 * - Octahedral sites (B-sites): Cu²⁺ and Fe³⁺ ions coordinated by 6 oxygen atoms
 * 
 * FTIR spectroscopy probes vibrational modes of metal-oxygen bonds. In spinel ferrites,
 * two characteristic absorption bands appear in the far-infrared region:
 * - ν₁ (~580 cm⁻¹): Stretching vibrations of tetrahedral metal-oxygen bonds (Fe³⁺-O)
 * - ν₂ (~400 cm⁻¹): Stretching vibrations of octahedral metal-oxygen bonds (Cu²⁺-O, Fe³⁺-O)
 * 
 * Additional bands in the mid-infrared region arise from surface species:
 * - O-H stretching (~3400 cm⁻¹): Surface hydroxyl groups
 * - H-O-H bending (~1630 cm⁻¹): Adsorbed water molecules
 */
export const FTIR_REFERENCE_DATA: FtirBandReference[] = [
  // Tetrahedral site metal-oxygen stretching (ν₁ band)
  {
    position: 580,
    uncertainty: 20,
    assignment: 'Fe-O stretching vibration (tetrahedral A-site)',
    bondType: 'metal-oxygen',
    site: 'tetrahedral',
    fwhm: [40, 80],
    literatureSource: 'Waldron, Phys. Rev. 99, 1727 (1955)'
  },
  
  // Octahedral site metal-oxygen stretching (ν₂ band)
  {
    position: 400,
    uncertainty: 20,
    assignment: 'Metal-oxygen stretching vibration (octahedral B-site, Cu²⁺-O and Fe³⁺-O)',
    bondType: 'metal-oxygen',
    site: 'octahedral',
    fwhm: [40, 100],
    literatureSource: 'Waldron, Phys. Rev. 99, 1727 (1955)'
  },
  
  // Surface hydroxyl stretching
  {
    position: 3400,
    uncertainty: 100,
    assignment: 'O-H stretching vibration (surface hydroxyl groups)',
    bondType: 'hydroxyl',
    site: 'surface',
    fwhm: [80, 150],
    literatureSource: 'Nakamoto, Infrared and Raman Spectra (2009)'
  },
  
  // Adsorbed water bending
  {
    position: 1630,
    uncertainty: 30,
    assignment: 'H-O-H bending vibration (adsorbed water molecules)',
    bondType: 'water',
    site: 'surface',
    fwhm: [40, 80],
    literatureSource: 'Nakamoto, Infrared and Raman Spectra (2009)'
  }
];

/**
 * Get FTIR reference data for a specific crystallographic site
 * 
 * @param site - Crystallographic site ('tetrahedral', 'octahedral', or 'surface')
 * @returns Array of band references for the specified site
 */
export function getFtirBandsBySite(
  site: 'tetrahedral' | 'octahedral' | 'surface'
): FtirBandReference[] {
  return FTIR_REFERENCE_DATA.filter(ref => ref.site === site);
}

/**
 * Get FTIR reference data for metal-oxygen stretching vibrations
 * (characteristic bands of spinel structure in far-infrared region)
 * 
 * @returns Array of metal-oxygen stretching band references
 */
export function getMetalOxygenBands(): FtirBandReference[] {
  return FTIR_REFERENCE_DATA.filter(ref => ref.bondType === 'metal-oxygen');
}

/**
 * Get FTIR reference data for surface species
 * (hydroxyl groups and adsorbed water in mid-infrared region)
 * 
 * @returns Array of surface species band references
 */
export function getSurfaceBands(): FtirBandReference[] {
  return FTIR_REFERENCE_DATA.filter(ref => ref.site === 'surface');
}

/**
 * Get FTIR band reference by approximate wavenumber position
 * 
 * @param wavenumber - Target wavenumber in cm⁻¹
 * @param tolerance - Search tolerance in cm⁻¹ (default: 50 cm⁻¹)
 * @returns Band reference or undefined if not found within tolerance
 */
export function getFtirBandByPosition(
  wavenumber: number,
  tolerance: number = 50
): FtirBandReference | undefined {
  return FTIR_REFERENCE_DATA.find(
    ref => Math.abs(ref.position - wavenumber) <= tolerance
  );
}

/**
 * Check if a wavenumber falls within the metal-oxygen stretching region
 * (characteristic of spinel ferrite structure, typically 300-700 cm⁻¹)
 * 
 * @param wavenumber - Wavenumber in cm⁻¹
 * @returns True if wavenumber is in the metal-oxygen stretching region
 */
export function isMetalOxygenRegion(wavenumber: number): boolean {
  return wavenumber >= 300 && wavenumber <= 700;
}

/**
 * Get the expected wavenumber range for a specific site
 * 
 * @param site - Crystallographic site
 * @returns [min, max] wavenumber range in cm⁻¹
 */
export function getSiteWavenumberRange(
  site: 'tetrahedral' | 'octahedral' | 'surface'
): [number, number] {
  const bands = getFtirBandsBySite(site);
  if (bands.length === 0) {
    return [0, 0];
  }
  
  const positions = bands.map(b => b.position);
  const uncertainties = bands.map(b => b.uncertainty);
  
  const min = Math.min(...positions.map((p, i) => p - uncertainties[i]));
  const max = Math.max(...positions.map((p, i) => p + uncertainties[i]));
  
  return [min, max];
}

/**
 * Validate that a detected band position matches a reference band
 * 
 * @param detectedPosition - Detected band position in cm⁻¹
 * @param referencePosition - Reference band position in cm⁻¹
 * @param uncertainty - Reference uncertainty in cm⁻¹
 * @returns True if detected position is within reference uncertainty
 */
export function validateBandPosition(
  detectedPosition: number,
  referencePosition: number,
  uncertainty: number
): boolean {
  return Math.abs(detectedPosition - referencePosition) <= uncertainty;
}

/**
 * Get all FTIR bands sorted by wavenumber (ascending order)
 * 
 * @returns Array of all band references sorted by position
 */
export function getAllBandsSorted(): FtirBandReference[] {
  return [...FTIR_REFERENCE_DATA].sort((a, b) => a.position - b.position);
}
