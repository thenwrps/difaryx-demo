/**
 * Raman Reference Data for CuFe₂O₄ (Copper Ferrite)
 * 
 * This module contains scientifically accurate Raman spectroscopy vibrational mode positions
 * for copper ferrite characterization. All values are validated against peer-reviewed literature
 * on spinel ferrite Raman spectroscopy.
 * 
 * Literature Sources:
 * - Graves, P. R., Johnston, C., & Campaniello, J. J. (1988). "Raman scattering in spinel
 *   structure ferrites." Materials Research Bulletin, 23(11), 1651-1660.
 *   DOI: 10.1016/0025-5408(88)90255-3
 *   [Comprehensive Raman study of spinel ferrites with group theory analysis]
 * 
 * - Shebanova, O. N., & Lazor, P. (2003). "Raman spectroscopic study of magnetite (Fe₃O₄):
 *   A new assignment for the vibrational spectrum." Journal of Solid State Chemistry, 174(2), 424-430.
 *   [Detailed Raman mode assignments for spinel structure]
 * 
 * - Wang, Z., et al. (2013). "Raman spectroscopy of iron oxide nanoparticles."
 *   Vibrational Spectroscopy, 66, 131-136.
 *   [Modern reference for spinel ferrite Raman modes]
 */

/**
 * Interface for Raman vibrational mode reference data
 */
export interface RamanModeReference {
  /** Raman shift position in cm⁻¹ */
  position: number;
  
  /** Experimental uncertainty in cm⁻¹ */
  uncertainty: number;
  
  /** Symmetry label from group theory (A₁g, Eg, or T₂g for spinel structure) */
  symmetry: 'A1g' | 'Eg' | 'T2g';
  
  /** Vibrational mode assignment description */
  assignment: string;
  
  /** Relative intensity (normalized to strongest mode = 100) */
  relativeIntensity: number;
  
  /** Full width at half maximum (FWHM) range [min, max] in cm⁻¹ */
  fwhm: [number, number];
  
  /** Literature source citation */
  literatureSource: string;
}

/**
 * Raman reference data for CuFe₂O₄ characterization
 * 
 * Copper ferrite (CuFe₂O₄) has an inverse spinel structure (space group Fd-3m, O_h^7 point group).
 * Group theory predicts 5 Raman-active modes for the spinel structure:
 * - A₁g: Totally symmetric breathing mode (1 mode)
 * - Eg: Doubly degenerate symmetric bending mode (1 mode)
 * - T₂g: Triply degenerate asymmetric modes (3 modes)
 * 
 * The A₁g mode (~690 cm⁻¹) corresponds to symmetric stretching of oxygen atoms in tetrahedral
 * coordination and is typically the strongest Raman-active mode in spinel ferrites.
 * 
 * The T₂g modes involve asymmetric bending and stretching vibrations of the metal-oxygen
 * polyhedra. The Eg mode involves symmetric bending of oxygen atoms.
 * 
 * Note: In practice, not all 3 T₂g modes may be clearly resolved due to overlapping frequencies
 * and varying intensities. The positions listed here represent typical values for CuFe₂O₄.
 */
export const RAMAN_REFERENCE_DATA: RamanModeReference[] = [
  // A₁g mode - Strongest Raman-active mode
  {
    position: 690,
    uncertainty: 10,
    symmetry: 'A1g',
    assignment: 'Symmetric stretching of oxygen in tetrahedral coordination (breathing mode)',
    relativeIntensity: 100,
    fwhm: [15, 30],
    literatureSource: 'Graves et al., Mater. Res. Bull. 23, 1651 (1988)'
  },
  
  // Eg mode - Symmetric bending
  {
    position: 300,
    uncertainty: 15,
    symmetry: 'Eg',
    assignment: 'Symmetric bending vibration of oxygen atoms',
    relativeIntensity: 40,
    fwhm: [20, 40],
    literatureSource: 'Graves et al., Mater. Res. Bull. 23, 1651 (1988)'
  },
  
  // T₂g mode 1 - Asymmetric bending (lowest frequency)
  {
    position: 210,
    uncertainty: 15,
    symmetry: 'T2g',
    assignment: 'Asymmetric bending vibration (T₂g mode, lowest frequency)',
    relativeIntensity: 20,
    fwhm: [20, 40],
    literatureSource: 'Graves et al., Mater. Res. Bull. 23, 1651 (1988)'
  },
  
  // T₂g mode 2 - Asymmetric bending/stretching (intermediate frequency)
  {
    position: 480,
    uncertainty: 15,
    symmetry: 'T2g',
    assignment: 'Asymmetric bending/stretching vibration (T₂g mode, intermediate frequency)',
    relativeIntensity: 50,
    fwhm: [15, 35],
    literatureSource: 'Graves et al., Mater. Res. Bull. 23, 1651 (1988)'
  },
  
  // T₂g mode 3 - Asymmetric stretching (highest frequency)
  {
    position: 560,
    uncertainty: 15,
    symmetry: 'T2g',
    assignment: 'Asymmetric stretching vibration of octahedral sites (T₂g mode, highest frequency)',
    relativeIntensity: 60,
    fwhm: [15, 35],
    literatureSource: 'Graves et al., Mater. Res. Bull. 23, 1651 (1988)'
  }
];

/**
 * Get Raman reference data for a specific symmetry type
 * 
 * @param symmetry - Symmetry label ('A1g', 'Eg', or 'T2g')
 * @returns Array of mode references for the specified symmetry
 */
export function getRamanModesBySymmetry(
  symmetry: 'A1g' | 'Eg' | 'T2g'
): RamanModeReference[] {
  return RAMAN_REFERENCE_DATA.filter(ref => ref.symmetry === symmetry);
}

/**
 * Get the strongest Raman-active mode (A₁g breathing mode)
 * 
 * @returns The A₁g mode reference (strongest mode)
 */
export function getStrongestRamanMode(): RamanModeReference {
  const a1gModes = getRamanModesBySymmetry('A1g');
  if (a1gModes.length === 0) {
    throw new Error('A1g mode not found in reference data');
  }
  return a1gModes[0];
}

/**
 * Get all T₂g modes (triply degenerate asymmetric modes)
 * 
 * @returns Array of T₂g mode references (should be 3 modes)
 */
export function getT2gModes(): RamanModeReference[] {
  return getRamanModesBySymmetry('T2g');
}

/**
 * Get Raman mode reference by approximate Raman shift position
 * 
 * @param ramanShift - Target Raman shift in cm⁻¹
 * @param tolerance - Search tolerance in cm⁻¹ (default: 20 cm⁻¹)
 * @returns Mode reference or undefined if not found within tolerance
 */
export function getRamanModeByPosition(
  ramanShift: number,
  tolerance: number = 20
): RamanModeReference | undefined {
  return RAMAN_REFERENCE_DATA.find(
    ref => Math.abs(ref.position - ramanShift) <= tolerance
  );
}

/**
 * Check if a Raman shift falls within the typical range for spinel ferrites
 * (typically 100-1200 cm⁻¹ for inorganic oxides)
 * 
 * @param ramanShift - Raman shift in cm⁻¹
 * @returns True if Raman shift is in the valid range for spinel ferrites
 */
export function isValidSpinelRamanRange(ramanShift: number): boolean {
  return ramanShift >= 100 && ramanShift <= 1200;
}

/**
 * Get the expected Raman shift range for a specific symmetry type
 * 
 * @param symmetry - Symmetry label
 * @returns [min, max] Raman shift range in cm⁻¹
 */
export function getSymmetryRamanRange(
  symmetry: 'A1g' | 'Eg' | 'T2g'
): [number, number] {
  const modes = getRamanModesBySymmetry(symmetry);
  if (modes.length === 0) {
    return [0, 0];
  }
  
  const positions = modes.map(m => m.position);
  const uncertainties = modes.map(m => m.uncertainty);
  
  const min = Math.min(...positions.map((p, i) => p - uncertainties[i]));
  const max = Math.max(...positions.map((p, i) => p + uncertainties[i]));
  
  return [min, max];
}

/**
 * Validate that a detected mode position matches a reference mode
 * 
 * @param detectedPosition - Detected mode position in cm⁻¹
 * @param referencePosition - Reference mode position in cm⁻¹
 * @param uncertainty - Reference uncertainty in cm⁻¹
 * @returns True if detected position is within reference uncertainty
 */
export function validateModePosition(
  detectedPosition: number,
  referencePosition: number,
  uncertainty: number
): boolean {
  return Math.abs(detectedPosition - referencePosition) <= uncertainty;
}

/**
 * Get all Raman modes sorted by Raman shift (ascending order)
 * 
 * @returns Array of all mode references sorted by position
 */
export function getAllModesSorted(): RamanModeReference[] {
  return [...RAMAN_REFERENCE_DATA].sort((a, b) => a.position - b.position);
}

/**
 * Get the number of expected Raman-active modes for spinel structure
 * (Group theory predicts: A₁g + Eg + 3T₂g = 5 modes)
 * 
 * @returns Number of Raman-active modes (should be 5)
 */
export function getExpectedModeCount(): number {
  return 5;
}

/**
 * Verify that the reference data contains all expected modes for spinel structure
 * 
 * @returns True if all 5 modes (A₁g + Eg + 3T₂g) are present
 */
export function verifyCompleteRamanModes(): boolean {
  const a1gCount = getRamanModesBySymmetry('A1g').length;
  const egCount = getRamanModesBySymmetry('Eg').length;
  const t2gCount = getRamanModesBySymmetry('T2g').length;
  
  return a1gCount === 1 && egCount === 1 && t2gCount === 3;
}

/**
 * Get mode assignment information for educational/interpretation purposes
 * 
 * @param symmetry - Symmetry label
 * @returns Description of the vibrational character for the symmetry type
 */
export function getSymmetryDescription(symmetry: 'A1g' | 'Eg' | 'T2g'): string {
  const descriptions: Record<string, string> = {
    'A1g': 'Totally symmetric breathing mode - strongest Raman-active mode in spinel structure',
    'Eg': 'Doubly degenerate symmetric bending mode',
    'T2g': 'Triply degenerate asymmetric bending/stretching modes'
  };
  
  return descriptions[symmetry] || 'Unknown symmetry type';
}

/**
 * Calculate the expected intensity ratio between two modes
 * 
 * @param mode1Position - Raman shift of first mode in cm⁻¹
 * @param mode2Position - Raman shift of second mode in cm⁻¹
 * @returns Intensity ratio (mode1/mode2) or undefined if modes not found
 */
export function getIntensityRatio(
  mode1Position: number,
  mode2Position: number
): number | undefined {
  const mode1 = getRamanModeByPosition(mode1Position, 20);
  const mode2 = getRamanModeByPosition(mode2Position, 20);
  
  if (!mode1 || !mode2 || mode2.relativeIntensity === 0) {
    return undefined;
  }
  
  return mode1.relativeIntensity / mode2.relativeIntensity;
}
