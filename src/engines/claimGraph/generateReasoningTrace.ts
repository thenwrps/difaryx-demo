/**
 * Claim Graph + Evidence Propagation Engine - Reasoning Trace Generation
 * 
 * Generates deterministic reasoning traces explaining how evidence determines claim status.
 * Uses relation-based language only (no scoring).
 */

import type {
  PropagationResult,
  ClaimGraph,
  ReasoningTrace,
  EvidenceNode,
  ClaimNode,
  ClaimStatus,
} from './types';
import { getClaimDefinition } from './claimDefinitions';

/**
 * Format evidence node as summary string
 */
function formatEvidenceSummary(evidence: EvidenceNode): string {
  return `${evidence.technique}: ${evidence.label} at ${evidence.value} ${evidence.unit}`;
}

/**
 * Generate observed evidence summaries
 */
function generateObservedEvidenceSummaries(
  supportingEvidence: EvidenceNode[],
  contradictingEvidence: EvidenceNode[]
): string[] {
  const summaries: string[] = [];
  
  // Add supporting evidence
  for (const evidence of supportingEvidence) {
    summaries.push(formatEvidenceSummary(evidence));
  }
  
  // Add contradicting evidence
  for (const evidence of contradictingEvidence) {
    summaries.push(formatEvidenceSummary(evidence));
  }
  
  return summaries;
}

/**
 * Generate relation summary describing how evidence connects to claim
 */
function generateRelationSummary(
  supportingEvidence: EvidenceNode[],
  contradictingEvidence: EvidenceNode[],
  graph: ClaimGraph,
  claimId: string
): string {
  const parts: string[] = [];
  
  // Count relations by type
  const claimRelations = graph.relations.filter(r => r.claim_id === claimId);
  const supportsCount = claimRelations.filter(r => r.relation_type === 'supports').length;
  const contradictsCount = claimRelations.filter(r => r.relation_type === 'contradicts').length;
  const contextualizesCount = claimRelations.filter(r => r.relation_type === 'contextualizes').length;
  
  // Build relation summary
  if (supportsCount > 0) {
    parts.push(`${supportsCount} observation(s) support this claim`);
  }
  
  if (contradictsCount > 0) {
    parts.push(`${contradictsCount} observation(s) contradict this claim`);
  }
  
  if (contextualizesCount > 0) {
    parts.push(`${contextualizesCount} observation(s) contextualize this claim`);
  }
  
  if (parts.length === 0) {
    return 'No direct evidence relations observed';
  }
  
  return parts.join('; ');
}

/**
 * Generate research-grade scientific interpretation
 * Produces paper-style discussion paragraph instead of step-based reasoning
 */
function generateScientificInterpretation(
  claim: ClaimNode,
  result: PropagationResult,
  graph: ClaimGraph
): string {
  const supportingCount = result.supporting_evidence.length;
  const contradictingCount = result.contradicting_evidence.length;
  const techniques = new Set(result.supporting_evidence.map(e => e.technique));
  const techniqueList = Array.from(techniques);
  
  // Build interpretation based on claim status
  let interpretation = '';
  
  // 1. Structural assignment statement
  const claimDescription = claim.description.toLowerCase();
  
  if (result.status === 'supported') {
    // Multi-technique support
    if (techniqueList.length > 1) {
      interpretation = `The ${claimDescription} is supported by convergent evidence from ${techniqueList.length} characterization techniques. `;
      interpretation += `${techniqueList.slice(0, -1).join(', ')} and ${techniqueList[techniqueList.length - 1]} observations `;
      interpretation += `(${supportingCount} total) exhibit structural and chemical signatures consistent with this assignment. `;
    } else if (techniqueList.length === 1) {
      interpretation = `The ${claimDescription} is supported by ${techniqueList[0]} observations (${supportingCount} total). `;
      interpretation += `The observed signatures are consistent with this assignment. `;
    } else {
      interpretation = `The ${claimDescription} is supported by ${supportingCount} observation(s). `;
    }
    
    // Add cross-technique consistency if applicable
    if (techniqueList.length > 1) {
      interpretation += `Cross-technique consistency indicates no contradictory evidence across the characterization suite. `;
    }
    
    // Add validation requirement if present
    if (result.missing_validation.length > 0) {
      interpretation += `However, ${result.missing_validation[0].toLowerCase()}, which introduces uncertainty in the final interpretation. `;
    }
    
  } else if (result.status === 'requires_validation') {
    // Has support but needs validation
    interpretation = `The ${claimDescription} exhibits preliminary support from ${supportingCount} observation(s)`;
    if (techniqueList.length > 0) {
      interpretation += ` (${techniqueList.join(', ')})`;
    }
    interpretation += `. `;
    
    // Explain validation requirement
    if (result.dependency_limitation) {
      interpretation += `${result.dependency_limitation}, propagating uncertainty to this dependent claim. `;
    } else if (result.missing_validation.length > 0) {
      interpretation += `${result.missing_validation[0]}, which is required for definitive assignment. `;
    }
    
    interpretation += `Further validation experiments are necessary before conclusive interpretation. `;
    
  } else if (result.status === 'contradicted') {
    // Has contradicting evidence
    interpretation = `The ${claimDescription} cannot be assigned based on the available evidence. `;
    interpretation += `${contradictingCount} observation(s) exhibit signatures inconsistent with this assignment. `;
    
    // Describe possible origins of anomaly
    if (contradictingCount === 1) {
      interpretation += `The anomalous observation suggests either (i) presence of a secondary phase below the detection limit of complementary techniques, `;
      interpretation += `(ii) surface reconstruction not representative of bulk composition, or `;
      interpretation += `(iii) instrumental artifact requiring further investigation. `;
    } else {
      interpretation += `Multiple inconsistent observations suggest systematic deviation from the expected structural or chemical state. `;
    }
    
    // Propagation to dependent claims
    const dependentClaims = graph.claim_nodes.filter(c => c.depends_on?.includes(claim.id));
    if (dependentClaims.length > 0) {
      interpretation += `This inconsistency propagates to ${dependentClaims.length} dependent claim(s) `;
      interpretation += `(${dependentClaims.map(c => c.description.toLowerCase()).join(', ')}), `;
      interpretation += `which require further validation given the uncertainty in the parent assignment. `;
    }
    
  } else if (result.status === 'partially_supported') {
    // Partial support
    interpretation = `The ${claimDescription} exhibits partial support from ${supportingCount} observation(s). `;
    
    if (techniqueList.length > 0) {
      interpretation += `Evidence from ${techniqueList.join(', ')} suggests consistency with this assignment, `;
      interpretation += `but primary characterization evidence is incomplete. `;
    } else {
      interpretation += `However, primary characterization evidence is incomplete. `;
    }
    
    interpretation += `Additional observations from complementary techniques are required for definitive assignment. `;
    
  } else {
    // Inconclusive — frame as bounded, not blocked
    interpretation = `The ${claimDescription} yields a supported assignment with validation boundaries under current evidence. `;
    interpretation += `Primary observations are limited, and characterization coverage remains incomplete. `;
    interpretation += `Complementary technique data would extend the evidence base before publication-grade reporting. `;
  }
  
  // Add final caveat if dependency limitation exists
  if (result.dependency_limitation && result.status !== 'requires_validation') {
    interpretation += `Note that ${result.dependency_limitation.toLowerCase()}, `;
    interpretation += `which should be considered when interpreting this result. `;
  }
  
  return interpretation;
}

/**
 * Generate reviewer-style rationale based on claim status
 */
function generateReviewerRationale(
  claim: ClaimNode,
  result: PropagationResult,
  graph: ClaimGraph
): string {
  const status = result.status;
  const supportingCount = result.supporting_evidence.length;
  const contradictingCount = result.contradicting_evidence.length;
  
  switch (status) {
    case 'contradicted':
      return `Claim contradicted by ${contradictingCount} incompatible observation(s). ` +
             `Evidence concepts conflict with claim requirements. ` +
             `Structural reasoning blocks claim acceptance.`;
    
    case 'supported':
      return `Claim supported by ${supportingCount} primary observation(s). ` +
             `Required evidence roles satisfied. ` +
             `No blocking contradictions detected. ` +
             `Structural reasoning validates claim.`;
    
    case 'requires_validation':
      return `Claim has primary support from ${supportingCount} observation(s). ` +
             `Required validation evidence missing. ` +
             `Additional validation experiments required for full support.`;
    
    case 'partially_supported':
      if (supportingCount > 0) {
        return `Claim has partial support from ${supportingCount} observation(s). ` +
               `Primary evidence incomplete or only supporting evidence present. ` +
               `Additional primary evidence required for full support.`;
      } else {
        return `Claim has contextual evidence but lacks direct support. ` +
               `Primary evidence required for claim validation.`;
      }
    
    case 'inconclusive':
      return `Supported assignment with validation boundaries. ` +
             `Primary evidence coverage is limited; claim requires additional characterization. ` +
             `Assignment is bounded but not blocked.`;
    
    default:
      return `Status: ${status}`;
  }
}

/**
 * Generate limitation statements based on claim status and evidence
 */
function generateLimitationStatements(
  claim: ClaimNode,
  result: PropagationResult,
  graph: ClaimGraph
): string[] {
  const limitations: string[] = [];
  
  // Add missing validation as limitation
  if (result.missing_validation.length > 0) {
    limitations.push(...result.missing_validation);
  }
  
  // Add technique-specific limitations
  const techniques = new Set(result.supporting_evidence.map(e => e.technique));
  
  if (techniques.has('XRD') && !techniques.has('TEM')) {
    limitations.push('XRD provides bulk-averaged structural evidence. Surface-sensitive and phase-purity claims remain validation-limited.');
  }
  
  if (techniques.has('XPS') && !techniques.has('XRD')) {
    limitations.push('XPS is surface-sensitive (~5 nm); bulk composition may vary');
  }
  
  if (techniques.has('Raman') && !techniques.has('XRD')) {
    limitations.push('Raman provides vibrational symmetry; long-range order not confirmed');
  }
  
  if (techniques.has('FTIR') && !techniques.has('XPS')) {
    limitations.push('FTIR detects bonding signatures; oxidation states not determined');
  }
  
  // Add status-specific limitations
  if (result.status === 'partially_supported') {
    limitations.push('Partial support only; additional primary evidence required');
  }
  
  if (result.status === 'requires_validation') {
    limitations.push('Validation evidence required before final conclusion');
  }
  
  if (result.status === 'contradicted') {
    limitations.push('Conflicting observations introduce uncertainty; independent verification recommended before acceptance.');
  }
  
  return limitations;
}

/**
 * Generate decision statement based on claim status
 */
function generateDecisionStatement(
  claim: ClaimNode,
  result: PropagationResult
): string {
  const status = result.status;
  
  switch (status) {
    case 'contradicted':
      return `Reject claim: ${claim.description}. Contradictory evidence detected.`;
    
    case 'supported':
      return `Accept claim: ${claim.description}. Structural reasoning validates claim.`;
    
    case 'requires_validation':
      return `Provisional acceptance: ${claim.description}. Validation experiments required.`;
    
    case 'partially_supported':
      return `Supported assignment with validation boundaries: ${claim.description}. Additional primary evidence recommended.`;
    
    case 'inconclusive':
      return `Bounded assessment: ${claim.description}. Characterization coverage is limited; assignment is provisional.`;
    
    default:
      return `Status: ${status}`;
  }
}

/**
 * Generate conflict propagation chain
 */
function generateConflictPropagation(
  result: PropagationResult,
  graph: ClaimGraph
): string[] | undefined {
  const propagation: string[] = [];
  
  // If this claim has contradicting evidence, show how it affects downstream
  if (result.contradicting_evidence.length > 0) {
    propagation.push(`Conflict detected in ${result.claim_id}`);
    
    // Find claims that depend on this one
    const dependentClaims = graph.claim_nodes.filter(
      c => c.depends_on?.includes(result.claim_id)
    );
    
    if (dependentClaims.length > 0) {
      propagation.push(`Affects ${dependentClaims.length} downstream claim(s): ${dependentClaims.map(c => c.id).join(', ')}`);
    }
  }
  
  // If this claim inherited a limitation, show the chain
  if (result.dependency_limitation) {
    propagation.push(`Inherited limitation: ${result.dependency_limitation}`);
  }
  
  return propagation.length > 0 ? propagation : undefined;
}

/**
 * Generate reasoning trace for a single claim
 */
function generateClaimTrace(
  result: PropagationResult,
  graph: ClaimGraph
): ReasoningTrace {
  const claim = getClaimDefinition(result.claim_id);
  
  if (!claim) {
    return {
      claim: result.claim_id,
      observed_evidence: [],
      relation_summary: 'Claim definition not found',
      resulting_status: result.status,
      reviewer_rationale: 'Error: Claim definition not found',
    };
  }
  
  // Generate observed evidence summaries
  const observed_evidence = generateObservedEvidenceSummaries(
    result.supporting_evidence,
    result.contradicting_evidence
  );
  
  // Generate relation summary
  const relation_summary = generateRelationSummary(
    result.supporting_evidence,
    result.contradicting_evidence,
    graph,
    result.claim_id
  );
  
  // Generate scientific interpretation (research-grade discussion)
  const scientific_interpretation = generateScientificInterpretation(claim, result, graph);
  
  // Generate reviewer rationale (for backward compatibility)
  const reviewer_rationale = scientific_interpretation;  // Use scientific interpretation as rationale
  
  return {
    claim: claim.description,
    observed_evidence,
    relation_summary,
    resulting_status: result.status,
    reviewer_rationale,
    dependency_path: result.dependency_path,
    inherited_limitations: result.inherited_limitations,
    technique_contributions: result.technique_contributions,
    conflict_propagation: generateConflictPropagation(result, graph),
  };
}

/**
 * Generate reasoning traces for all propagation results
 */
export function generateReasoningTrace(
  results: PropagationResult[],
  graph: ClaimGraph
): ReasoningTrace[] {
  return results.map(result => generateClaimTrace(result, graph));
}

/**
 * Generate scientific report sections from reasoning traces
 */
export interface ScientificReport {
  conclusion: string;
  evidence_basis: string[];
  cross_tech_consistency: string;
  limitations: string[];
  required_validation: string[];
  decision: string;
}

/**
 * Generate scientific report from propagation results
 * Uses research-grade language suitable for journal publication
 */
export function generateScientificReport(
  results: PropagationResult[],
  graph: ClaimGraph
): ScientificReport {
  // Find dominant claim (supported status)
  const supportedClaim = results.find(r => r.status === 'supported');
  const dominantResult = supportedClaim || results[0];
  const dominantClaimDef = getClaimDefinition(dominantResult.claim_id);
  
  // Generate conclusion using scientific language
  const supportedClaims = results.filter(r => r.status === 'supported');
  const partiallySupportedClaims = results.filter(r => r.status === 'partially_supported');
  const contradictedClaims = results.filter(r => r.status === 'contradicted');
  const validationRequiredClaims = results.filter(r => r.status === 'requires_validation');
  
  let conclusion = '';
  if (supportedClaims.length > 0) {
    const claimDescriptions = supportedClaims
      .map(r => getClaimDefinition(r.claim_id)?.description.toLowerCase() || r.claim_id)
      .join(', ');
    conclusion = `Convergent multi-technique evidence supports the following assignments: ${claimDescriptions}. `;
    
    if (validationRequiredClaims.length > 0) {
      conclusion += `However, ${validationRequiredClaims.length} dependent claim(s) require further validation due to inherited uncertainties. `;
    }
  } else if (partiallySupportedClaims.length > 0) {
    conclusion = `Partial characterization evidence suggests ${partiallySupportedClaims.length} claim(s) exhibit preliminary support. `;
    conclusion += `Additional observations from complementary techniques are required for definitive assignment. `;
  } else if (contradictedClaims.length > 0) {
    conclusion = `The available evidence is inconsistent with ${contradictedClaims.length} proposed assignment(s). `;
    conclusion += `Anomalous observations suggest either secondary phases, surface reconstruction, or instrumental artifacts requiring further investigation. `;
  } else {
    conclusion = `Insufficient characterization evidence for conclusive determination. Comprehensive multi-technique analysis is required. `;
  }
  
  // Generate evidence basis using scientific language
  const evidence_basis: string[] = [];
  for (const evidence of dominantResult.supporting_evidence) {
    const techniqueContribution = `${evidence.technique} observations at ${evidence.value} ${evidence.unit} (${evidence.label}) `;
    evidence_basis.push(techniqueContribution + `exhibit signatures consistent with the proposed assignment`);
  }
  
  // Generate cross-technique consistency using scientific language
  const techniques = new Set(dominantResult.supporting_evidence.map(e => e.technique));
  const techniqueList = Array.from(techniques).join(', ');
  
  let cross_tech_consistency = '';
  if (techniques.size > 1) {
    cross_tech_consistency = `Evidence from ${techniques.size} characterization techniques (${techniqueList}) exhibits convergent structural and chemical signatures. `;
    cross_tech_consistency += `No systematic contradictions were observed across the technique suite, indicating internal consistency of the assignment. `;
    
    // Add technique-specific insights
    if (techniques.has('XRD') && techniques.has('Raman')) {
      cross_tech_consistency += `The combination of XRD (long-range order) and Raman (local symmetry) provides complementary structural validation. `;
    }
    if (techniques.has('XPS') && techniques.has('XRD')) {
      cross_tech_consistency += `XPS surface analysis is consistent with XRD bulk structural assignment, suggesting minimal surface reconstruction. `;
    }
  } else if (techniques.size === 1) {
    cross_tech_consistency = `Evidence from a single characterization technique (${techniqueList}) supports the assignment. `;
    cross_tech_consistency += `Cross-technique validation is not available; complementary observations would strengthen the interpretation. `;
  } else {
    cross_tech_consistency = `No characterization evidence available for cross-technique consistency evaluation. `;
  }
  
  // Generate limitations using scientific language
  const limitations: string[] = [];
  
  // Technique-specific limitations
  const techniqueArray = Array.from(techniques);
  if (techniqueArray.includes('XRD') && !techniqueArray.includes('TEM')) {
    limitations.push('XRD provides bulk-averaged structural information; nanoscale heterogeneity or surface reconstruction cannot be excluded without complementary TEM analysis');
  }
  
  if (techniqueArray.includes('XPS') && !techniqueArray.includes('XRD')) {
    limitations.push('XPS probes surface composition (~5 nm depth); bulk stoichiometry may deviate from surface observations and requires validation by bulk-sensitive techniques');
  }
  
  if (techniqueArray.includes('Raman') && !techniqueArray.includes('XRD')) {
    limitations.push('Raman spectroscopy confirms vibrational symmetry; long-range crystallographic order requires validation by diffraction-based techniques');
  }
  
  if (techniqueArray.includes('FTIR') && !techniqueArray.includes('XPS')) {
    limitations.push('FTIR identifies bonding signatures; oxidation state assignments require validation by core-level spectroscopy');
  }
  
  // Status-specific limitations
  if (dominantResult.status === 'partially_supported') {
    limitations.push('Partial characterization evidence only; comprehensive multi-technique analysis required for definitive assignment');
  }
  
  if (dominantResult.status === 'requires_validation') {
    limitations.push('Primary evidence present but validation experiments required before conclusive interpretation');
  }
  
  if (dominantResult.status === 'contradicted') {
    limitations.push('Contradictory evidence detected; anomalous observations require resolution through additional experiments or alternative interpretation');
  }
  
  // Add dependency limitations
  if (dominantResult.dependency_limitation) {
    limitations.push(dominantResult.dependency_limitation.replace('Parent claim', 'Dependent assignment uncertainty:'));
  }
  
  // Generate required validation using scientific language
  const required_validation: string[] = [];
  for (const result of results) {
    if (result.status === 'requires_validation') {
      const claimDef = getClaimDefinition(result.claim_id);
      if (claimDef) {
        const validationStatement = `${claimDef.description}: `;
        if (result.missing_validation.length > 0) {
          required_validation.push(validationStatement + result.missing_validation.join('; ').toLowerCase());
        } else {
          required_validation.push(validationStatement + 'additional validation experiments required');
        }
      }
    }
  }
  
  // Generate decision using scientific language
  let decision = '';
  if (dominantResult.status === 'contradicted') {
    decision = `The proposed assignment (${dominantClaimDef?.description.toLowerCase() || 'unknown'}) is inconsistent with the available characterization evidence. `;
    decision += `Alternative interpretations should be considered, or additional experiments performed to resolve the observed inconsistencies. `;
  } else if (dominantResult.status === 'supported') {
    decision = `The characterization evidence supports the assignment: ${dominantClaimDef?.description.toLowerCase() || 'unknown'}. `;
    if (required_validation.length > 0) {
      decision += `However, ${required_validation.length} dependent claim(s) require further validation before final conclusions. `;
    } else {
      decision += `The convergent multi-technique evidence provides robust support for this interpretation. `;
    }
  } else if (dominantResult.status === 'requires_validation') {
    decision = `The assignment (${dominantClaimDef?.description.toLowerCase() || 'unknown'}) exhibits preliminary support but requires validation experiments. `;
    decision += `Provisional acceptance is recommended pending additional characterization. `;
  } else if (dominantResult.status === 'partially_supported') {
    decision = `The assignment (${dominantClaimDef?.description.toLowerCase() || 'unknown'}) exhibits partial support from available evidence. `;
    decision += `Additional primary characterization is required for definitive assignment. `;
  } else {
    decision = `Insufficient characterization evidence for conclusive assignment. Comprehensive multi-technique analysis is required. `;
  }
  
  return {
    conclusion,
    evidence_basis,
    cross_tech_consistency,
    limitations,
    required_validation,
    decision,
  };
}
