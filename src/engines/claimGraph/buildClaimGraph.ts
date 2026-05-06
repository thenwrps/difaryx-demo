/**
 * Claim Graph + Evidence Propagation Engine - Graph Construction
 * 
 * Builds claim graphs from evidence observations and claim definitions.
 * Uses concept matching to create typed relations (no scoring).
 */

import type {
  RawEvidenceInput,
  EvidenceNode,
  ClaimNode,
  EvidenceRelation,
  ClaimGraph,
  Technique,
  EvidenceRole,
  TechniqueAuthority,
} from './types';
import {
  CLAIM_DEFINITIONS,
  getEvidenceConcept,
  getTechniqueAuthority,
  isConceptIncompatible,
} from './claimDefinitions';

/**
 * Get unit for a technique
 */
function getUnitForTechnique(technique: Technique): string {
  const unitMap: Record<Technique, string> = {
    XRD: '° 2θ',
    Raman: 'cm⁻¹',
    XPS: 'eV',
    FTIR: 'cm⁻¹',
    TEM: 'nm',
    BET: 'm²/g',
    TPD: '°C',
  };
  return unitMap[technique] || '';
}

/**
 * Generate evidence ID from technique and peak data
 */
function generateEvidenceId(technique: Technique, peak: RawEvidenceInput['peaks'][0]): string {
  const techPrefix = technique.toLowerCase();
  
  // Use provided ID if available
  if (peak.id) {
    return peak.id;
  }
  
  // Generate ID based on technique and assignment
  if (peak.assignment) {
    return `${techPrefix}-${peak.assignment.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }
  
  // Generate ID based on technique and label
  if (peak.label) {
    return `${techPrefix}-${peak.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }
  
  // Fallback: use position
  return `${techPrefix}-${peak.position.toFixed(1)}`;
}

/**
 * Create evidence nodes from raw technique observations
 */
export function createEvidenceNodes(inputs: RawEvidenceInput[]): EvidenceNode[] {
  const evidenceNodes: EvidenceNode[] = [];
  
  for (const input of inputs) {
    for (const peak of input.peaks) {
      const evidenceId = generateEvidenceId(input.technique, peak);
      const concept = getEvidenceConcept(evidenceId);
      const unit = getUnitForTechnique(input.technique);
      
      evidenceNodes.push({
        id: evidenceId,
        technique: input.technique,
        value: peak.position,
        unit,
        label: peak.label || `Peak at ${peak.position.toFixed(1)}`,
        concept,
      });
    }
  }
  
  return evidenceNodes;
}

/**
 * Map technique authority to evidence role
 */
function mapAuthorityToRole(authority: TechniqueAuthority): EvidenceRole {
  const roleMap: Record<TechniqueAuthority, EvidenceRole> = {
    primary: 'primary',
    supporting: 'supporting',
    validation: 'validation',
    context: 'context',
  };
  return roleMap[authority];
}

/**
 * Check if evidence concept supports a claim
 * Evidence supports a claim if its concept is relevant and not incompatible
 */
function conceptSupportsClaim(concept: string, claim: ClaimNode): boolean {
  // If concept is incompatible, it doesn't support
  if (isConceptIncompatible(concept, claim)) {
    return false;
  }
  
  // If concept is unknown, it doesn't support
  if (concept === 'unknown-concept') {
    return false;
  }
  
  // Concept-to-claim support mapping
  const supportMap: Record<string, string[]> = {
    // Spinel ferrite assignment
    'cubic-spinel-lattice': ['spinel_ferrite_assignment'],
    'tetrahedral-site-vibration': ['spinel_ferrite_assignment'],
    'octahedral-site-vibration': ['spinel_ferrite_assignment'],
    'lattice-vibration': ['spinel_ferrite_assignment'],
    
    // Oxidation state consistency
    'oxidized-surface-state': ['oxidation_state_consistency'],
    'copper-oxidized-state': ['oxidation_state_consistency'],
    'iron-oxidized-state': ['oxidation_state_consistency'],
    'mixed-oxidation-state': ['oxidation_state_consistency'],
    
    // Metal-oxygen bonding
    'metal-oxygen-framework': ['metal_oxygen_bonding'],
    'oxide-bonding': ['metal_oxygen_bonding'],
    
    // Surface species presence
    'surface-hydroxyl-species': ['surface_species_presence'],
    'surface-carbonate-species': ['surface_species_presence'],
    'surface-water-species': ['surface_species_presence'],
    
    // Catalytic activation readiness
    'active-surface-sites': ['catalytic_activation_readiness'],
    'crystalline-structure': ['catalytic_activation_readiness'],
    'porous-structure': ['catalytic_activation_readiness'],
    'surface-area-measurement': ['catalytic_activation_readiness'],
  };
  
  const supportedClaims = supportMap[concept] || [];
  return supportedClaims.includes(claim.id);
}

/**
 * Check if evidence concept contextualizes a claim
 * Evidence contextualizes if it provides relevant context without direct support
 */
function conceptContextualizesClaim(concept: string, claim: ClaimNode): boolean {
  // If concept supports or contradicts, it doesn't contextualize
  if (conceptSupportsClaim(concept, claim) || isConceptIncompatible(concept, claim)) {
    return false;
  }
  
  // If concept is unknown, it doesn't contextualize
  if (concept === 'unknown-concept') {
    return false;
  }
  
  // Context mapping - evidence that provides background without direct support
  const contextMap: Record<string, string[]> = {
    // XRD provides context for oxidation state and bonding claims
    'cubic-spinel-lattice': ['oxidation_state_consistency', 'metal_oxygen_bonding', 'catalytic_activation_readiness'],
    
    // Raman provides context for oxidation state and surface species
    'tetrahedral-site-vibration': ['oxidation_state_consistency', 'surface_species_presence'],
    'octahedral-site-vibration': ['oxidation_state_consistency', 'surface_species_presence'],
    
    // XPS provides context for structure
    'oxidized-surface-state': ['spinel_ferrite_assignment'],
    'copper-oxidized-state': ['spinel_ferrite_assignment'],
    'iron-oxidized-state': ['spinel_ferrite_assignment'],
    
    // FTIR provides context for structure and oxidation
    'metal-oxygen-framework': ['spinel_ferrite_assignment', 'oxidation_state_consistency'],
    'surface-hydroxyl-species': ['oxidation_state_consistency', 'catalytic_activation_readiness'],
    'surface-carbonate-species': ['oxidation_state_consistency', 'catalytic_activation_readiness'],
    
    // TEM/BET provide context for multiple claims
    'crystalline-structure': ['spinel_ferrite_assignment', 'oxidation_state_consistency'],
    'surface-area-measurement': ['surface_species_presence'],
    'porous-structure': ['surface_species_presence'],
  };
  
  const contextualizedClaims = contextMap[concept] || [];
  return contextualizedClaims.includes(claim.id);
}

/**
 * Create evidence relations by connecting evidence to claims
 */
function createEvidenceRelations(
  evidenceNodes: EvidenceNode[],
  claimNodes: ClaimNode[]
): EvidenceRelation[] {
  const relations: EvidenceRelation[] = [];
  
  for (const claim of claimNodes) {
    for (const evidence of evidenceNodes) {
      // Check for contradiction (incompatible concept)
      if (isConceptIncompatible(evidence.concept, claim)) {
        relations.push({
          evidence_id: evidence.id,
          claim_id: claim.id,
          relation_type: 'contradicts',
          role: 'primary', // Contradictions are always primary
        });
        continue;
      }
      
      // Determine role based on technique authority
      const authority = getTechniqueAuthority(claim.id, evidence.technique);
      const role = mapAuthorityToRole(authority);
      
      // Check for support (concept matches claim requirements)
      if (conceptSupportsClaim(evidence.concept, claim)) {
        relations.push({
          evidence_id: evidence.id,
          claim_id: claim.id,
          relation_type: 'supports',
          role,
        });
        continue;
      }
      
      // Check for contextualization (provides context without direct support)
      if (conceptContextualizesClaim(evidence.concept, claim)) {
        relations.push({
          evidence_id: evidence.id,
          claim_id: claim.id,
          relation_type: 'contextualizes',
          role: 'context',
        });
      }
    }
  }
  
  return relations;
}

/**
 * Build claim graph from raw evidence inputs and claim definitions
 */
export function buildClaimGraph(inputs: RawEvidenceInput[]): ClaimGraph {
  // Create evidence nodes from raw inputs
  const evidenceNodes = createEvidenceNodes(inputs);
  
  // Use predefined claim definitions
  const claimNodes = CLAIM_DEFINITIONS;
  
  // Create relations between evidence and claims
  const relations = createEvidenceRelations(evidenceNodes, claimNodes);
  
  return {
    evidence_nodes: evidenceNodes,
    claim_nodes: claimNodes,
    relations,
  };
}
