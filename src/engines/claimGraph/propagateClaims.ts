/**
 * Claim Graph + Evidence Propagation Engine - Claim Propagation
 * 
 * Deterministic propagation of claim status based on graph structure and relation types.
 * No numeric scoring, weights, or thresholds.
 */

import type {
  ClaimGraph,
  PropagationResult,
  ClaimStatus,
  EvidenceNode,
  ClaimNode,
  EvidenceRelation,
} from './types';

/**
 * Get evidence node by ID
 */
function getEvidenceNode(evidenceId: string, evidenceNodes: EvidenceNode[]): EvidenceNode | undefined {
  return evidenceNodes.find(node => node.id === evidenceId);
}

/**
 * Get relations for a specific claim
 */
function getClaimRelations(claimId: string, relations: EvidenceRelation[]): EvidenceRelation[] {
  return relations.filter(relation => relation.claim_id === claimId);
}

/**
 * Determine claim status based on relations (deterministic precedence)
 * 
 * Precedence order:
 * 1. contradicted - if any contradicts relation exists
 * 2. supported - if primary support exists and no contradiction
 * 3. requires_validation - if support exists but required validation missing
 * 4. partially_supported - if only contextual or partial support exists
 * 5. inconclusive - if no meaningful evidence exists
 */
function determineClaimStatus(
  claim: ClaimNode,
  claimRelations: EvidenceRelation[],
  evidenceNodes: EvidenceNode[]
): ClaimStatus {
  // Check for contradictions (highest precedence)
  const contradictions = claimRelations.filter(r => r.relation_type === 'contradicts');
  if (contradictions.length > 0) {
    return 'contradicted';
  }
  
  // Get supporting relations
  const supportingRelations = claimRelations.filter(r => r.relation_type === 'supports');
  
  // Separate by role
  const primaryEvidence = supportingRelations.filter(r => r.role === 'primary');
  const supportingEvidence = supportingRelations.filter(r => r.role === 'supporting');
  const validationEvidence = supportingRelations.filter(r => r.role === 'validation');
  
  // Check if claim requires validation evidence
  const requiresValidation = claim.required_evidence_roles.includes('validation');
  
  // Check if primary evidence exists
  const hasPrimaryEvidence = primaryEvidence.length > 0;
  
  // Check if validation evidence exists (when required)
  const hasValidation = requiresValidation ? validationEvidence.length > 0 : true;
  
  // Determine status based on evidence presence
  if (hasPrimaryEvidence && hasValidation) {
    return 'supported';
  } else if (hasPrimaryEvidence && !hasValidation) {
    return 'requires_validation';
  } else if (supportingEvidence.length > 0 || supportingRelations.length > 0) {
    return 'partially_supported';
  } else {
    return 'inconclusive';
  }
}

/**
 * Generate basic rationale for claim status (minimal, no prose yet)
 */
function generateBasicRationale(
  claim: ClaimNode,
  status: ClaimStatus,
  supportingEvidence: EvidenceNode[],
  contradictingEvidence: EvidenceNode[],
  dependencyLimitation?: string
): string {
  let rationale = '';
  
  switch (status) {
    case 'contradicted':
      rationale = `Claim contradicted by ${contradictingEvidence.length} incompatible evidence observation(s)`;
      break;
    case 'supported':
      rationale = `Claim supported by ${supportingEvidence.length} primary evidence observation(s)`;
      break;
    case 'requires_validation':
      if (dependencyLimitation) {
        rationale = `Claim requires validation due to parent claim limitation`;
      } else {
        rationale = `Claim has primary support but requires validation evidence`;
      }
      break;
    case 'partially_supported':
      rationale = `Claim has partial support from ${supportingEvidence.length} observation(s)`;
      break;
    case 'inconclusive':
      rationale = `Insufficient evidence to evaluate claim`;
      break;
    default:
      rationale = `Status: ${status}`;
  }
  
  if (dependencyLimitation && status !== 'requires_validation') {
    rationale += `. ${dependencyLimitation}`;
  }
  
  return rationale;
}

/**
 * Identify missing validation requirements
 */
function identifyMissingValidation(
  claim: ClaimNode,
  claimRelations: EvidenceRelation[]
): string[] {
  const missingValidation: string[] = [];
  
  // Check if validation evidence is required
  if (claim.required_evidence_roles.includes('validation')) {
    const validationRelations = claimRelations.filter(
      r => r.relation_type === 'supports' && r.role === 'validation'
    );
    
    if (validationRelations.length === 0) {
      missingValidation.push('Validation evidence required for full support');
    }
  }
  
  return missingValidation;
}

/**
 * Build dependency path from root to current claim
 */
function buildDependencyPath(
  claim: ClaimNode,
  claims: ClaimNode[]
): string[] {
  const path: string[] = [];
  
  function tracePath(currentClaim: ClaimNode) {
    if (currentClaim.depends_on) {
      for (const parentId of currentClaim.depends_on) {
        const parentClaim = claims.find(c => c.id === parentId);
        if (parentClaim) {
          tracePath(parentClaim);
        }
      }
    }
    path.push(currentClaim.id);
  }
  
  tracePath(claim);
  return path;
}

/**
 * Collect inherited limitations from parent chain
 */
function collectInheritedLimitations(
  parentResults: PropagationResult[]
): string[] {
  const limitations: string[] = [];
  
  for (const parent of parentResults) {
    if (parent.dependency_limitation) {
      limitations.push(parent.dependency_limitation);
    }
    if (parent.inherited_limitations) {
      limitations.push(...parent.inherited_limitations);
    }
  }
  
  return limitations;
}

/**
 * Analyze technique contributions to claim
 */
function analyzeTechniqueContributions(
  supportingEvidence: EvidenceNode[],
  contradictingEvidence: EvidenceNode[]
): Record<string, string> {
  const contributions: Record<string, string> = {};
  
  // Group evidence by technique
  const techniqueGroups = new Map<string, { supporting: number; contradicting: number }>();
  
  for (const evidence of supportingEvidence) {
    const current = techniqueGroups.get(evidence.technique) || { supporting: 0, contradicting: 0 };
    current.supporting++;
    techniqueGroups.set(evidence.technique, current);
  }
  
  for (const evidence of contradictingEvidence) {
    const current = techniqueGroups.get(evidence.technique) || { supporting: 0, contradicting: 0 };
    current.contradicting++;
    techniqueGroups.set(evidence.technique, current);
  }
  
  // Generate contribution descriptions
  for (const [technique, counts] of techniqueGroups) {
    if (counts.contradicting > 0) {
      contributions[technique] = `Contradicts claim (${counts.contradicting} observation${counts.contradicting > 1 ? 's' : ''})`;
    } else if (counts.supporting > 0) {
      contributions[technique] = `Supports claim (${counts.supporting} observation${counts.supporting > 1 ? 's' : ''})`;
    }
  }
  
  return contributions;
}

/**
 * Propagate a single claim with dependency handling
 */
function propagateClaim(
  claim: ClaimNode,
  relations: EvidenceRelation[],
  evidenceNodes: EvidenceNode[],
  parentResults: PropagationResult[] = [],
  allClaims: ClaimNode[] = []
): PropagationResult {
  // Get relations for this claim
  const claimRelations = getClaimRelations(claim.id, relations);
  
  // Check parent claim status for dependency propagation
  let parentClaimStatus: ClaimStatus | undefined;
  let dependencyLimitation: string | undefined;
  
  if (parentResults.length > 0) {
    // Check if any parent is contradicted
    const contradictedParent = parentResults.find(p => p.status === 'contradicted');
    if (contradictedParent) {
      parentClaimStatus = 'contradicted';
      dependencyLimitation = `Parent claim '${contradictedParent.claim_id}' is contradicted, limiting child claim evaluation`;
    }
    
    // Check if any parent requires validation
    const validationParent = parentResults.find(p => p.status === 'requires_validation');
    if (validationParent && !contradictedParent) {
      parentClaimStatus = 'requires_validation';
      dependencyLimitation = `Parent claim '${validationParent.claim_id}' requires validation, propagating limitation`;
    }
  }
  
  // Determine claim status (may be overridden by parent status)
  let status = determineClaimStatus(claim, claimRelations, evidenceNodes);
  
  // Apply dependency propagation rules
  if (parentClaimStatus === 'contradicted') {
    // If parent is contradicted, child becomes requires_validation
    status = 'requires_validation';
  } else if (parentClaimStatus === 'requires_validation' && status === 'supported') {
    // If parent requires validation and child is supported, propagate validation requirement
    status = 'requires_validation';
  }
  
  // Get supporting evidence
  const supportingRelations = claimRelations.filter(r => r.relation_type === 'supports');
  const supporting_evidence = supportingRelations
    .map(r => getEvidenceNode(r.evidence_id, evidenceNodes))
    .filter((node): node is EvidenceNode => node !== undefined);
  
  // Get contradicting evidence
  const contradictingRelations = claimRelations.filter(r => r.relation_type === 'contradicts');
  const contradicting_evidence = contradictingRelations
    .map(r => getEvidenceNode(r.evidence_id, evidenceNodes))
    .filter((node): node is EvidenceNode => node !== undefined);
  
  // Identify missing validation
  const missing_validation = identifyMissingValidation(claim, claimRelations);
  
  // Add dependency limitation to missing validation if present
  if (dependencyLimitation) {
    missing_validation.push(dependencyLimitation);
  }
  
  // Build dependency path
  const dependency_path = allClaims.length > 0 ? buildDependencyPath(claim, allClaims) : undefined;
  
  // Collect inherited limitations
  const inherited_limitations = parentResults.length > 0 ? collectInheritedLimitations(parentResults) : undefined;
  
  // Analyze technique contributions
  const technique_contributions = analyzeTechniqueContributions(supporting_evidence, contradicting_evidence);
  
  // Generate basic rationale
  const rationale = generateBasicRationale(
    claim,
    status,
    supporting_evidence,
    contradicting_evidence,
    dependencyLimitation
  );
  
  return {
    claim_id: claim.id,
    status,
    supporting_evidence,
    contradicting_evidence,
    missing_validation,
    qualifications: [], // Will be populated in reasoning trace generation
    rationale,
    parent_claim_status: parentClaimStatus,
    dependency_limitation: dependencyLimitation,
    dependency_path,
    inherited_limitations,
    technique_contributions,
  };
}

/**
 * Propagate all claims in the graph with dependency handling
 * 
 * Claims are processed in dependency order:
 * 1. Root claims (no dependencies) are evaluated first
 * 2. Child claims inherit limitations from parent claims
 * 3. If parent is contradicted → child becomes requires_validation
 * 4. If parent has validation gap → propagate as contextual limitation
 */
export function propagateClaims(graph: ClaimGraph): PropagationResult[] {
  const results: PropagationResult[] = [];
  const resultMap = new Map<string, PropagationResult>();
  
  // Sort claims by dependency order (topological sort)
  const sortedClaims = topologicalSort(graph.claim_nodes);
  
  for (const claim of sortedClaims) {
    try {
      // Get parent claim results if dependencies exist
      const parentResults = claim.depends_on
        ? claim.depends_on.map(parentId => resultMap.get(parentId)).filter((r): r is PropagationResult => r !== undefined)
        : [];
      
      // Propagate the claim
      const result = propagateClaim(claim, graph.relations, graph.evidence_nodes, parentResults, graph.claim_nodes);
      
      results.push(result);
      resultMap.set(claim.id, result);
    } catch (error) {
      console.error(`Error propagating claim ${claim.id}:`, error);
      // Add inconclusive result as fallback
      const fallbackResult: PropagationResult = {
        claim_id: claim.id,
        status: 'inconclusive',
        supporting_evidence: [],
        contradicting_evidence: [],
        missing_validation: ['Error during propagation'],
        qualifications: [],
        rationale: `Propagation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      results.push(fallbackResult);
      resultMap.set(claim.id, fallbackResult);
    }
  }
  
  return results;
}

/**
 * Topological sort of claims by dependencies
 * Returns claims in order where parent claims come before child claims
 */
function topologicalSort(claims: ClaimNode[]): ClaimNode[] {
  const sorted: ClaimNode[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  
  function visit(claim: ClaimNode) {
    if (visited.has(claim.id)) return;
    if (visiting.has(claim.id)) {
      console.warn(`Circular dependency detected for claim: ${claim.id}`);
      return;
    }
    
    visiting.add(claim.id);
    
    // Visit dependencies first
    if (claim.depends_on) {
      for (const parentId of claim.depends_on) {
        const parentClaim = claims.find(c => c.id === parentId);
        if (parentClaim) {
          visit(parentClaim);
        }
      }
    }
    
    visiting.delete(claim.id);
    visited.add(claim.id);
    sorted.push(claim);
  }
  
  for (const claim of claims) {
    visit(claim);
  }
  
  return sorted;
}
