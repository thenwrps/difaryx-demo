/**
 * Claim Graph + Evidence Propagation Engine - Type Definitions
 * 
 * Pure graph-based scientific reasoning without numeric scores, weights, or thresholds.
 * All reasoning is relation-based and deterministic.
 */

/**
 * Characterization technique types
 */
export type Technique = 'XRD' | 'Raman' | 'XPS' | 'FTIR' | 'TEM' | 'BET' | 'TPD';

/**
 * Evidence relation types - how evidence connects to claims
 */
export type EvidenceRelationType = 
  | 'supports'        // Evidence directly supports the claim
  | 'contradicts'     // Evidence directly contradicts the claim
  | 'qualifies'       // Evidence adds nuance to the claim
  | 'requires'        // Claim requires this evidence for validation
  | 'contextualizes'; // Evidence provides context without direct support

/**
 * Evidence roles in supporting claims
 */
export type EvidenceRole = 
  | 'primary'     // Primary evidence required for claim
  | 'supporting'  // Supporting evidence that strengthens claim
  | 'context'     // Contextual evidence
  | 'validation'; // Validation evidence required for full support

/**
 * Claim status after propagation
 */
export type ClaimStatus = 
  | 'supported'           // All required evidence present, no blocking contradictions
  | 'partially_supported' // Some required evidence present
  | 'contradicted'        // Blocking contradiction exists
  | 'inconclusive'        // Insufficient evidence
  | 'requires_validation'; // Primary evidence present but validation missing

/**
 * Validation state
 */
export type ValidationState = 
  | 'complete'          // All validation evidence present
  | 'incomplete'        // Some validation evidence missing
  | 'blocked'           // Validation blocked by contradiction
  | 'requires_followup'; // Validation requires additional experiments

/**
 * Technique authority for claim types
 */
export type TechniqueAuthority = 
  | 'primary'     // Primary technique for this claim type
  | 'supporting'  // Supporting technique
  | 'validation'  // Validation technique
  | 'context';    // Contextual technique

/**
 * Evidence node - an observation from a characterization technique
 */
export interface EvidenceNode {
  id: string;
  technique: Technique;
  value: number;
  unit: string;
  label: string;
  concept: string;  // Physical interpretation (e.g., 'cubic-spinel-lattice')
  role?: EvidenceRole;
}

/**
 * Claim node - a scientific assertion about material properties
 */
export interface ClaimNode {
  id: string;
  description: string;
  required_evidence_roles: EvidenceRole[];
  optional_evidence_roles: EvidenceRole[];
  incompatible_concepts: string[];
  depends_on?: string[];  // Parent claim IDs that must be satisfied first
}

/**
 * Evidence relation - typed connection between evidence and claims
 */
export interface EvidenceRelation {
  evidence_id: string;
  claim_id: string;
  relation_type: EvidenceRelationType;
  role: EvidenceRole;
}

/**
 * Claim graph - directed graph structure connecting evidence to claims
 */
export interface ClaimGraph {
  evidence_nodes: EvidenceNode[];
  claim_nodes: ClaimNode[];
  relations: EvidenceRelation[];
}

/**
 * Propagation result - output of structural reasoning
 */
export interface PropagationResult {
  claim_id: string;
  status: ClaimStatus;
  supporting_evidence: EvidenceNode[];
  contradicting_evidence: EvidenceNode[];
  missing_validation: string[];
  qualifications: string[];
  rationale: string;
  parent_claim_status?: ClaimStatus;  // Status of parent claim if dependency exists
  dependency_limitation?: string;     // Limitation inherited from parent claim
  dependency_path?: string[];         // Chain of parent claims (root to current)
  inherited_limitations?: string[];   // All limitations inherited from parent chain
  technique_contributions?: Record<string, string>;  // How each technique contributes
}

/**
 * Reasoning trace - deterministic record of how evidence determines claim status
 */
export interface ReasoningTrace {
  claim: string;
  observed_evidence: string[];
  relation_summary: string;
  resulting_status: ClaimStatus;
  reviewer_rationale: string;
  dependency_path?: string[];         // Chain of parent claims
  inherited_limitations?: string[];   // Limitations from parent claims
  technique_contributions?: Record<string, string>;  // How each technique contributes
  conflict_propagation?: string[];    // How conflicts propagate downstream
}

/**
 * Raw evidence input for graph construction
 */
export interface RawEvidenceInput {
  technique: Technique;
  peaks: Array<{
    id: string;
    position: number;
    intensity: number;
    label?: string;
    assignment?: string;
    hkl?: string;
  }>;
}
