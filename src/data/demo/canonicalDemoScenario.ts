/**
 * Canonical Demo Scenario
 *
 * Single source of truth for the DIFARYX autonomous agent demo.
 * All demo UI surfaces must consume this object directly.
 * Do not duplicate or hardcode these values elsewhere.
 */

export interface CanonicalDemoScenario {
  /** Short project name for display */
  projectName: string;
  /** Unique sample identifier used in the demo run */
  sampleId: string;
  /** Chemical system under investigation */
  materialSystem: string;
  /** Broad material family classification */
  materialClass: string;
  /** Primary characterization technique driving the decision */
  primaryTechnique: string;
  /** Supporting techniques providing corroborating evidence */
  supportingTechniques: string[];
  /** One-sentence characterization goal */
  objective: string;
  /** Expanded context describing why this characterization is performed */
  characterizationPurpose: string;
}

export const canonicalDemoScenario: CanonicalDemoScenario = {
  projectName: 'CuFe\u2082O\u2084 Spinel',
  sampleId: 'cu-fe2o4-spinel',
  materialSystem: 'CuFe\u2082O\u2084 copper ferrite',
  materialClass: 'Spinel ferrite oxide',
  primaryTechnique: 'XRD',
  supportingTechniques: ['Raman'],
  objective:
    'Confirm phase identity and structural purity of a synthesized CuFe\u2082O\u2084 spinel sample from diffraction and vibrational evidence.',
  characterizationPurpose:
    'Determine whether the sample has formed the target copper ferrite spinel phase, '
    + 'assess peak positions against reference patterns, and evaluate the structural '
    + 'consistency of bulk diffraction data with vibrational fingerprint evidence before '
    + 'proceeding to surface-state or catalytic characterization.',
};
