/**
 * Claim Graph + Evidence Propagation Engine - Claim Definitions
 * 
 * Predefined scientific claims for materials characterization scenarios.
 * All definitions are deterministic and relation-based (no scoring).
 */

import type { ClaimNode, Technique, TechniqueAuthority } from './types';

/**
 * Predefined scientific claims for common characterization scenarios
 */
export const CLAIM_DEFINITIONS: ClaimNode[] = [
  {
    id: 'spinel_ferrite_assignment',
    description: 'Material exhibits cubic spinel ferrite structure',
    required_evidence_roles: ['primary'],
    optional_evidence_roles: ['supporting', 'validation'],
    incompatible_concepts: [
      'absence-of-long-range-order',
      'alternative-crystalline-phase',
      'structural-disorder',
    ],
    // No dependencies - this is a root claim
  },
  {
    id: 'oxidation_state_consistency',
    description: 'Surface oxidation states consistent with bulk composition',
    required_evidence_roles: ['primary'],
    optional_evidence_roles: ['validation'],
    incompatible_concepts: [
      'surface-reduction',
      'oxidation-state-mismatch',
    ],
    depends_on: ['spinel_ferrite_assignment'],  // Requires structural assignment first
  },
  {
    id: 'metal_oxygen_bonding',
    description: 'Metal-oxygen bonding framework consistent with ferrite structure',
    required_evidence_roles: ['primary'],
    optional_evidence_roles: ['supporting'],
    incompatible_concepts: [
      'absence-of-metal-oxygen-framework',
      'non-oxide-bonding',
    ],
    depends_on: ['spinel_ferrite_assignment'],  // Requires structural assignment first
  },
  {
    id: 'surface_species_presence',
    description: 'Surface species (hydroxyl, carbonate) detected',
    required_evidence_roles: ['primary'],
    optional_evidence_roles: ['context'],
    incompatible_concepts: [],
    depends_on: ['metal_oxygen_bonding'],  // Requires bonding framework first
  },
  {
    id: 'catalytic_activation_readiness',
    description: 'Material exhibits characteristics consistent with catalytic activation',
    required_evidence_roles: ['primary', 'validation'],
    optional_evidence_roles: ['supporting'],
    incompatible_concepts: [
      'surface-passivation',
      'inactive-surface-state',
    ],
    depends_on: ['oxidation_state_consistency', 'surface_species_presence'],  // Requires both oxidation state and surface species
  },
];

/**
 * Technique authority mapping for each claim type
 * Defines which techniques have primary, supporting, validation, or context authority
 */
export const TECHNIQUE_AUTHORITY: Record<string, Record<Technique, TechniqueAuthority>> = {
  spinel_ferrite_assignment: {
    XRD: 'primary',
    Raman: 'primary',
    XPS: 'context',
    FTIR: 'supporting',
    TEM: 'validation',
    BET: 'context',
    TPD: 'context',
  },
  oxidation_state_consistency: {
    XRD: 'context',
    Raman: 'context',
    XPS: 'primary',
    FTIR: 'context',
    TEM: 'validation',
    BET: 'context',
    TPD: 'context',
  },
  metal_oxygen_bonding: {
    XRD: 'context',
    Raman: 'supporting',
    XPS: 'supporting',
    FTIR: 'primary',
    TEM: 'context',
    BET: 'context',
    TPD: 'context',
  },
  surface_species_presence: {
    XRD: 'context',
    Raman: 'context',
    XPS: 'primary',
    FTIR: 'primary',
    TEM: 'context',
    BET: 'context',
    TPD: 'validation',
  },
  catalytic_activation_readiness: {
    XRD: 'supporting',
    Raman: 'supporting',
    XPS: 'validation',
    FTIR: 'validation',
    TEM: 'primary',
    BET: 'validation',
    TPD: 'validation',
  },
};

/**
 * Evidence concept mapping - physical interpretation of observations
 * Maps evidence identifiers to scientific concepts
 */
export const EVIDENCE_CONCEPTS: Record<string, string> = {
  // XRD concepts
  'xrd-spinel': 'cubic-spinel-lattice',
  'xrd-spinel-220': 'cubic-spinel-lattice',
  'xrd-spinel-311': 'cubic-spinel-lattice',
  'xrd-spinel-400': 'cubic-spinel-lattice',
  'xrd-spinel-511': 'cubic-spinel-lattice',
  'xrd-non-spinel': 'alternative-crystalline-phase',
  'xrd-amorphous': 'absence-of-long-range-order',
  'xrd-disorder': 'structural-disorder',
  
  // Raman concepts
  'raman-a1g': 'tetrahedral-site-vibration',
  'raman-t2g': 'octahedral-site-vibration',
  'raman-eg': 'lattice-vibration',
  'raman-disorder': 'structural-disorder',
  'raman-spinel': 'cubic-spinel-lattice',
  
  // FTIR concepts
  'ftir-mo-band': 'metal-oxygen-framework',
  'ftir-oxide-band': 'oxide-bonding',
  'ftir-hydroxyl': 'surface-hydroxyl-species',
  'ftir-carbonate': 'surface-carbonate-species',
  'ftir-water': 'surface-water-species',
  'ftir-no-mo': 'absence-of-metal-oxygen-framework',
  
  // XPS concepts
  'xps-oxide': 'oxidized-surface-state',
  'xps-mixed-state': 'mixed-oxidation-state',
  'xps-reduced': 'surface-reduction',
  'xps-cu2+': 'copper-oxidized-state',
  'xps-fe3+': 'iron-oxidized-state',
  'xps-mismatch': 'oxidation-state-mismatch',
  
  // TEM concepts
  'tem-crystalline': 'crystalline-structure',
  'tem-spinel': 'cubic-spinel-lattice',
  'tem-amorphous': 'absence-of-long-range-order',
  
  // BET concepts
  'bet-surface-area': 'surface-area-measurement',
  'bet-porosity': 'porous-structure',
  
  // TPD concepts
  'tpd-active-sites': 'active-surface-sites',
  'tpd-passivated': 'surface-passivation',
  'tpd-inactive': 'inactive-surface-state',
};

/**
 * Helper function to get technique authority for a claim
 */
export function getTechniqueAuthority(claimId: string, technique: Technique): TechniqueAuthority {
  const authorityMap = TECHNIQUE_AUTHORITY[claimId];
  if (!authorityMap) {
    console.warn(`No technique authority mapping found for claim: ${claimId}`);
    return 'context';
  }
  return authorityMap[technique] || 'context';
}

/**
 * Helper function to get evidence concept from evidence ID
 */
export function getEvidenceConcept(evidenceId: string): string {
  const concept = EVIDENCE_CONCEPTS[evidenceId];
  if (!concept) {
    console.warn(`No concept mapping found for evidence ID: ${evidenceId}. Using fallback.`);
    return 'unknown-concept';
  }
  return concept;
}

/**
 * Helper function to check if a concept is incompatible with a claim
 */
export function isConceptIncompatible(concept: string, claim: ClaimNode): boolean {
  return claim.incompatible_concepts.includes(concept);
}

/**
 * Helper function to get claim definition by ID
 */
export function getClaimDefinition(claimId: string): ClaimNode | undefined {
  return CLAIM_DEFINITIONS.find(claim => claim.id === claimId);
}
