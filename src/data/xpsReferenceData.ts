/**
 * XPS Reference Data for CuFe₂O₄ (Copper Ferrite)
 * 
 * This module contains scientifically accurate X-ray Photoelectron Spectroscopy (XPS)
 * binding energies for copper ferrite characterization. All values are validated against
 * peer-reviewed literature and XPS databases.
 * 
 * Literature Sources:
 * - Biesinger, M. C., et al. (2009). "Resolving surface chemical states in XPS analysis
 *   of first row transition metals, oxides and hydroxides: Cr, Mn, Fe, Co and Ni."
 *   Applied Surface Science, 257(7), 2717-2730.
 * - Biesinger, M. C., et al. (2011). "Resolving surface chemical states in XPS analysis
 *   of first row transition metals, oxides and hydroxides: Sc, Ti, V, Cu and Zn."
 *   Applied Surface Science, 257(3), 887-898.
 * - NIST XPS Database (https://srdata.nist.gov/xps/)
 */

/**
 * Interface for XPS core level reference data
 */
export interface XpsCoreLevelReference {
  /** Chemical element symbol */
  element: string;
  
  /** Oxidation state (e.g., "2+", "3+") */
  oxidationState: string;
  
  /** Core level designation (e.g., "2p3/2", "2p1/2", "1s") */
  coreLevel: string;
  
  /** Binding energy in eV */
  bindingEnergy: number;
  
  /** Experimental uncertainty in eV */
  uncertainty: number;
  
  /** Full width at half maximum (FWHM) range [min, max] in eV */
  fwhm: [number, number];
  
  /** Spin-orbit splitting in eV (for doublets like 2p3/2 and 2p1/2) */
  spinOrbitSplitting?: number;
  
  /** Satellite peak offset from main peak in eV (for transition metals) */
  satelliteOffset?: number;
  
  /** Satellite peak intensity relative to main peak (0-1 scale) */
  satelliteIntensity?: number;
  
  /** Literature source citation */
  literatureSource: string;
}

/**
 * XPS reference data for CuFe₂O₄ characterization
 * 
 * Copper ferrite (CuFe₂O₄) has an inverse spinel structure where:
 * - Cu²⁺ ions occupy octahedral sites
 * - Fe³⁺ ions occupy both tetrahedral and octahedral sites
 * - O²⁻ ions form the spinel lattice
 * 
 * XPS is surface-sensitive (sampling depth 5-10 nm) and provides chemical state information
 * through core-level binding energies.
 */
export const XPS_REFERENCE_DATA: XpsCoreLevelReference[] = [
  // Copper 2p doublet (Cu²⁺ oxidation state)
  {
    element: 'Cu',
    oxidationState: '2+',
    coreLevel: '2p3/2',
    bindingEnergy: 933.5,
    uncertainty: 0.5,
    fwhm: [2.0, 3.0],
    spinOrbitSplitting: 19.8,
    satelliteOffset: 9.0,
    satelliteIntensity: 0.4,
    literatureSource: 'Biesinger et al., Appl. Surf. Sci. 257, 887 (2011)'
  },
  {
    element: 'Cu',
    oxidationState: '2+',
    coreLevel: '2p1/2',
    bindingEnergy: 953.3,
    uncertainty: 0.5,
    fwhm: [2.0, 3.0],
    spinOrbitSplitting: 19.8,
    satelliteOffset: 9.0,
    satelliteIntensity: 0.4,
    literatureSource: 'Biesinger et al., Appl. Surf. Sci. 257, 887 (2011)'
  },
  
  // Iron 2p doublet (Fe³⁺ oxidation state)
  {
    element: 'Fe',
    oxidationState: '3+',
    coreLevel: '2p3/2',
    bindingEnergy: 710.8,
    uncertainty: 0.5,
    fwhm: [2.5, 3.5],
    spinOrbitSplitting: 13.5,
    literatureSource: 'Biesinger et al., Appl. Surf. Sci. 257, 2717 (2009)'
  },
  {
    element: 'Fe',
    oxidationState: '3+',
    coreLevel: '2p1/2',
    bindingEnergy: 724.3,
    uncertainty: 0.5,
    fwhm: [2.5, 3.5],
    spinOrbitSplitting: 13.5,
    literatureSource: 'Biesinger et al., Appl. Surf. Sci. 257, 2717 (2009)'
  },
  
  // Oxygen 1s (lattice oxygen in spinel structure)
  {
    element: 'O',
    oxidationState: '2-',
    coreLevel: '1s',
    bindingEnergy: 529.8,
    uncertainty: 0.3,
    fwhm: [2.0, 2.5],
    literatureSource: 'NIST XPS Database, metal oxide lattice oxygen'
  },
  
  // Oxygen 1s (surface hydroxyl groups)
  {
    element: 'O',
    oxidationState: '2-',
    coreLevel: '1s',
    bindingEnergy: 531.5,
    uncertainty: 0.5,
    fwhm: [2.0, 3.0],
    literatureSource: 'NIST XPS Database, hydroxyl oxygen'
  }
];

/**
 * Get XPS reference data for a specific element and oxidation state
 * 
 * @param element - Chemical element symbol (e.g., "Cu", "Fe", "O")
 * @param oxidationState - Oxidation state (e.g., "2+", "3+")
 * @returns Array of core level references for the specified element and oxidation state
 */
export function getXpsReferenceData(
  element: string,
  oxidationState: string
): XpsCoreLevelReference[] {
  return XPS_REFERENCE_DATA.filter(
    ref => ref.element === element && ref.oxidationState === oxidationState
  );
}

/**
 * Get XPS reference data for a specific core level
 * 
 * @param element - Chemical element symbol
 * @param oxidationState - Oxidation state
 * @param coreLevel - Core level designation (e.g., "2p3/2", "1s")
 * @returns Core level reference or undefined if not found
 */
export function getCoreLevelReference(
  element: string,
  oxidationState: string,
  coreLevel: string
): XpsCoreLevelReference | undefined {
  return XPS_REFERENCE_DATA.find(
    ref =>
      ref.element === element &&
      ref.oxidationState === oxidationState &&
      ref.coreLevel === coreLevel
  );
}

/**
 * Get spin-orbit splitting for a given element and core level
 * 
 * @param element - Chemical element symbol
 * @param coreLevel - Core level designation (should be the lower binding energy component)
 * @returns Spin-orbit splitting in eV, or undefined if not applicable
 */
export function getSpinOrbitSplitting(
  element: string,
  coreLevel: string
): number | undefined {
  const ref = XPS_REFERENCE_DATA.find(
    r => r.element === element && r.coreLevel === coreLevel && r.spinOrbitSplitting
  );
  return ref?.spinOrbitSplitting;
}

/**
 * Check if a core level has satellite peaks
 * 
 * @param element - Chemical element symbol
 * @param oxidationState - Oxidation state
 * @param coreLevel - Core level designation
 * @returns True if satellite peaks are expected
 */
export function hasSatellitePeaks(
  element: string,
  oxidationState: string,
  coreLevel: string
): boolean {
  const ref = getCoreLevelReference(element, oxidationState, coreLevel);
  return ref?.satelliteOffset !== undefined && ref?.satelliteIntensity !== undefined;
}

/**
 * Get satellite peak parameters
 * 
 * @param element - Chemical element symbol
 * @param oxidationState - Oxidation state
 * @param coreLevel - Core level designation
 * @returns Satellite parameters { offset, intensity } or undefined
 */
export function getSatelliteParameters(
  element: string,
  oxidationState: string,
  coreLevel: string
): { offset: number; intensity: number } | undefined {
  const ref = getCoreLevelReference(element, oxidationState, coreLevel);
  if (ref?.satelliteOffset && ref?.satelliteIntensity) {
    return {
      offset: ref.satelliteOffset,
      intensity: ref.satelliteIntensity
    };
  }
  return undefined;
}
