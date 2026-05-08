// Fusion Engine - Main API

import type { FusionInput, FusionResult, EvidenceNode, Claim, ReasoningTraceItem, ClaimStatus, EvidenceCategory, Technique } from './types';
import { evaluateClaimGraph } from '../claimGraph';
import type { RawEvidenceInput as ClaimGraphRawInput } from '../claimGraph';

// ============================================================================
// CENTRAL EVIDENCE NODE CREATION
// ============================================================================

/**
 * Peak input for evidence node creation
 */
export interface PeakInput {
  id: string;
  position: number;  // 2θ for XRD, wavenumber for FTIR/Raman, binding energy for XPS
  intensity: number;
  label?: string;
  assignment?: string;  // For XPS chemical state assignments
  hkl?: string;  // For XRD Miller indices
}

/**
 * Raw input for evidence node creation
 */
export interface RawEvidenceInput {
  technique: Technique;
  peaks: PeakInput[];
}

/**
 * Central function to create EvidenceNodes from raw technique data
 * This is the ONLY place where EvidenceNodes should be created
 * 
 * @param input - Raw evidence input with technique and peaks
 * @returns Array of EvidenceNodes with proper concept mapping
 */
export function createEvidenceNodes(input: RawEvidenceInput): EvidenceNode[] {
  const { technique, peaks } = input;
  
  return peaks.map((peak) => {
    // Determine unit based on technique
    const unit = getUnitForTechnique(technique);
    
    // Determine label
    const label = peak.label || peak.assignment || peak.hkl || `Peak at ${peak.position.toFixed(1)}`;
    
    // Generate evidence ID based on technique and peak characteristics
    const evidenceId = generateEvidenceId(technique, peak);
    
    // Create base evidence node
    const evidenceNode: EvidenceNode = {
      id: evidenceId,
      technique,
      x: peak.position,
      unit,
      label,
      inferredCategory: EVIDENCE_CATEGORY[evidenceId],
      concept: EVIDENCE_CONCEPT[evidenceId],
    };
    
    return evidenceNode;
  });
}

/**
 * Get unit string for technique
 */
function getUnitForTechnique(technique: Technique): string {
  switch (technique) {
    case 'XRD':
      return '° 2θ';
    case 'XPS':
      return 'eV';
    case 'FTIR':
    case 'Raman':
      return 'cm⁻¹';
    default:
      return '';
  }
}

/**
 * Generate evidence ID based on technique and peak characteristics
 * This implements the concept mapping logic
 */
function generateEvidenceId(technique: Technique, peak: PeakInput): string {
  switch (technique) {
    case 'XRD':
      return generateXrdEvidenceId(peak);
    case 'Raman':
      return generateRamanEvidenceId(peak);
    case 'XPS':
      return generateXpsEvidenceId(peak);
    case 'FTIR':
      return generateFtirEvidenceId(peak);
    default:
      return `${technique.toLowerCase()}-${peak.id}`;
  }
}

/**
 * Generate XRD evidence ID based on peak position and characteristics
 */
function generateXrdEvidenceId(peak: PeakInput): string {
  // Check for spinel characteristic peaks
  // Spinel (311) around 35.5°, (220) around 30.1°, (400) around 43.2°
  if (peak.hkl === '311' || (peak.position >= 35.0 && peak.position <= 36.0)) {
    return 'xrd-spinel';
  }
  if (peak.hkl === '220' || (peak.position >= 29.5 && peak.position <= 30.5)) {
    return 'xrd-spinel';
  }
  if (peak.hkl === '400' || (peak.position >= 42.5 && peak.position <= 43.5)) {
    return 'xrd-spinel';
  }
  
  // Check for broad/amorphous features
  if (peak.label?.toLowerCase().includes('broad') || peak.label?.toLowerCase().includes('amorphous')) {
    return 'xrd-amorphous';
  }
  
  // Default to non-spinel crystalline
  return 'xrd-non-spinel';
}

/**
 * Generate Raman evidence ID based on peak position
 */
function generateRamanEvidenceId(peak: PeakInput): string {
  // A1g mode around 690 cm⁻¹ (characteristic of spinel)
  if (peak.position >= 680 && peak.position <= 700) {
    return 'raman-a1g';
  }
  
  // Check for disorder indicators
  if (peak.label?.toLowerCase().includes('disorder') || peak.label?.toLowerCase().includes('broad')) {
    return 'raman-disorder';
  }
  
  // Default to A1g if in reasonable range
  return 'raman-a1g';
}

/**
 * Generate XPS evidence ID based on binding energy and assignment
 */
function generateXpsEvidenceId(peak: PeakInput): string {
  const assignment = peak.assignment?.toLowerCase() || '';
  
  // Check for oxide states
  if (assignment.includes('oxide') || assignment.includes('o2-')) {
    return 'xps-oxide';
  }
  
  // Check for mixed oxidation states
  if (assignment.includes('mixed') || assignment.includes('cu2+') || assignment.includes('fe3+')) {
    return 'xps-mixed-state';
  }
  
  // Default to oxide
  return 'xps-oxide';
}

/**
 * Generate FTIR evidence ID based on wavenumber
 */
function generateFtirEvidenceId(peak: PeakInput): string {
  // Metal-oxygen bands typically 400-600 cm⁻¹
  if (peak.position >= 400 && peak.position <= 600) {
    return 'ftir-mo-band';
  }
  
  // Oxide bands typically 600-1000 cm⁻¹
  if (peak.position >= 600 && peak.position <= 1000) {
    return 'ftir-oxide-band';
  }
  
  // Default to M-O band
  return 'ftir-mo-band';
}

// ============================================================================
// EVIDENCE CATEGORY AND CONCEPT MAPPING
// ============================================================================

// Define evidence category mapping
const EVIDENCE_CATEGORY: Record<string, EvidenceCategory> = {
  'xrd-spinel': 'crystalline',
  'raman-a1g': 'crystalline',
  'xrd-non-spinel': 'crystalline',
  'xrd-amorphous': 'non-crystalline',
  'raman-disorder': 'non-crystalline',
  'ftir-mo-band': 'crystalline',
  'ftir-oxide-band': 'crystalline',
  'xps-oxide': 'crystalline',
  'xps-mixed-state': 'non-crystalline',
};

// Define evidence concept mapping (physical interpretation)
const EVIDENCE_CONCEPT: Record<string, string> = {
  'xrd-spinel': 'cubic-spinel-lattice',
  'raman-a1g': 'tetrahedral-site-vibration',
  'xrd-non-spinel': 'alternative-crystalline-phase',
  'xrd-amorphous': 'absence-of-long-range-order',
  'raman-disorder': 'structural-disorder',
  'ftir-mo-band': 'metal-oxygen-framework',
  'ftir-oxide-band': 'oxide-bonding',
  'xps-oxide': 'oxidized-surface-state',
  'xps-mixed-state': 'mixed-oxidation-state',
};

// Define multiple competing claims with hierarchy and classification
const CLAIMS: Claim[] = [
  {
    id: 'spinel-ferrite',
    type: 'structure',
    category: 'crystalline',
    requiredEvidenceIds: ['raman-a1g', 'xrd-spinel'],
    optionalEvidenceIds: ['ftir-mo-band'],
    contradictingEvidenceIds: ['xrd-amorphous', 'raman-disorder'],
    requiredConcepts: ['cubic-spinel-lattice', 'tetrahedral-site-vibration'],
    incompatibleConcepts: ['absence-of-long-range-order', 'structural-disorder'],
  },
  {
    id: 'non-spinel-oxide',
    type: 'structure',
    category: 'crystalline',
    requiredEvidenceIds: ['xrd-non-spinel', 'xps-oxide'],
    optionalEvidenceIds: ['ftir-oxide-band'],
    contradictingEvidenceIds: ['xrd-spinel', 'raman-a1g'],
    requiredConcepts: ['alternative-crystalline-phase', 'oxidized-surface-state'],
    incompatibleConcepts: ['cubic-spinel-lattice', 'absence-of-long-range-order'],
  },
  {
    id: 'amorphous-disordered',
    type: 'structure',
    category: 'non-crystalline',
    requiredEvidenceIds: ['xrd-amorphous', 'raman-disorder'],
    optionalEvidenceIds: ['xps-mixed-state'],
    contradictingEvidenceIds: ['xrd-spinel', 'xrd-non-spinel'],
    requiredConcepts: ['absence-of-long-range-order', 'structural-disorder'],
    incompatibleConcepts: ['cubic-spinel-lattice', 'tetrahedral-site-vibration', 'alternative-crystalline-phase'],
  },
];

// Define mutual exclusivity groups
const EXCLUSIVE_GROUPS: Record<string, string[]> = {
  structure: ['spinel-ferrite', 'non-spinel-oxide', 'amorphous-disordered'],
};

/**
 * Convert FusionInput evidence to ClaimGraph RawEvidenceInput format
 */
function convertToClaimGraphInput(evidence: EvidenceNode[]): ClaimGraphRawInput[] {
  // Group evidence by technique
  const byTechnique = new Map<Technique, EvidenceNode[]>();
  
  for (const e of evidence) {
    if (!byTechnique.has(e.technique)) {
      byTechnique.set(e.technique, []);
    }
    byTechnique.get(e.technique)!.push(e);
  }
  
  // Convert to RawEvidenceInput format
  const inputs: ClaimGraphRawInput[] = [];
  
  for (const [technique, nodes] of byTechnique) {
    inputs.push({
      technique,
      peaks: nodes.map(node => ({
        id: node.id,
        position: node.x,
        intensity: 100, // Default intensity (not used in claimGraph)
        label: node.label,
      })),
    });
  }
  
  return inputs;
}

/**
 * Evaluate multi-technique evidence and generate scientific conclusion
 * @param input - Fusion input containing evidence nodes
 * @returns Fusion result with conclusion and reasoning
 */
export function evaluate(input: FusionInput): FusionResult {
  const { evidence } = input;

  // Try using ClaimGraph engine if evidence is available
  if (evidence.length > 0) {
    try {
      const claimGraphInput = convertToClaimGraphInput(evidence);
      const claimGraphResult = evaluateClaimGraph(claimGraphInput);
      
      // Map ClaimGraph report to FusionResult
      const fusionResult: FusionResult = {
        conclusion: claimGraphResult.report.conclusion,
        basis: claimGraphResult.report.evidence_basis,
        crossTech: claimGraphResult.report.cross_tech_consistency,
        limitations: claimGraphResult.report.limitations,
        decision: claimGraphResult.report.decision,
        reasoningTrace: [], // Legacy format - will be populated below
        highlightedEvidenceIds: claimGraphResult.propagation
          .filter(p => p.status === 'supported' || p.status === 'partially_supported')
          .flatMap(p => p.supporting_evidence.map(e => e.id)),
      };
      
      return fusionResult;
    } catch (error) {
      console.warn('ClaimGraph evaluation failed, falling back to legacy fusion engine:', error);
      // Fall through to legacy implementation
    }
  }

  // Legacy fusion engine implementation (fallback)
  // Infer categories and concepts for evidence nodes
  const enrichedEvidence = evidence.map((e) => ({
    ...e,
    inferredCategory: EVIDENCE_CATEGORY[e.id],
    concept: EVIDENCE_CONCEPT[e.id],
  }));

  // Validate all claims independently (includes contradiction detection)
  let validatedClaims: ReasoningTraceItem[] = CLAIMS.map((claim) => 
    validateClaim(claim, enrichedEvidence)
  );

  // Detect exclusive conflicts within groups
  validatedClaims = detectExclusiveConflicts(validatedClaims);

  // Select dominant claim(s) (only among valid claims)
  const reasoningTrace = selectDominantClaim(validatedClaims);

  // Determine highlightedEvidenceIds based on dominant claim
  // DO NOT highlight contradicting evidence
  const dominantClaim = reasoningTrace.find((trace) => trace.isDominant);
  const highlightedEvidenceIds = dominantClaim 
    ? dominantClaim.evidenceIds.filter(
        (id) => !dominantClaim.contradictingEvidenceIds.includes(id)
      )
    : [];

  // Categorize claims by status
  const validClaims = reasoningTrace.filter((trace) => trace.status !== 'invalid');
  const invalidClaims = reasoningTrace.filter((trace) => trace.status === 'invalid');
  const activeClaims = reasoningTrace.filter((trace) => trace.status === 'active');
  const partialClaims = reasoningTrace.filter((trace) => trace.status === 'partial');
  const exclusiveConflicts = reasoningTrace.filter((trace) => trace.isExclusiveConflict);

  // Determine output based on claim states
  if (exclusiveConflicts.length > 0) {
    // Exclusive conflict → mutually exclusive models detected
    return generateExclusiveConflictResult(exclusiveConflicts, enrichedEvidence, reasoningTrace, highlightedEvidenceIds);
  } else if (validClaims.length === 0) {
    // All claims invalid → contradictory dataset
    return generateContradictoryDatasetResult(invalidClaims, enrichedEvidence, reasoningTrace, highlightedEvidenceIds);
  } else if (activeClaims.length === 1 && invalidClaims.length > 0) {
    // Dominant claim with others invalid → strong assignment
    return generateStrongAssignmentResult(activeClaims[0], invalidClaims, enrichedEvidence, reasoningTrace, highlightedEvidenceIds);
  } else if (activeClaims.length > 1) {
    // Multiple active claims → conflict (existing behavior)
    return generateConflictResult(activeClaims, enrichedEvidence, reasoningTrace, highlightedEvidenceIds);
  } else if (activeClaims.length === 1) {
    // Single active claim → dominant scientific conclusion
    return generateDominantClaimResult(activeClaims[0], enrichedEvidence, reasoningTrace, highlightedEvidenceIds);
  } else if (partialClaims.length > 0) {
    // Multiple partial claims → competing hypotheses
    return generateCompetingHypothesesResult(partialClaims, enrichedEvidence, reasoningTrace, highlightedEvidenceIds);
  } else {
    // No claims supported → insufficient evidence
    return generateInsufficientEvidenceResult(enrichedEvidence, reasoningTrace, highlightedEvidenceIds);
  }
}

/**
 * Detect exclusive conflicts within mutual exclusivity groups
 * If multiple claims in same group are active → mark as exclusive conflict
 */
function detectExclusiveConflicts(validatedClaims: ReasoningTraceItem[]): ReasoningTraceItem[] {
  // Group claims by their exclusive group
  const groupedClaims: Record<string, ReasoningTraceItem[]> = {};
  
  for (const claim of validatedClaims) {
    if (claim.group !== 'none') {
      if (!groupedClaims[claim.group]) {
        groupedClaims[claim.group] = [];
      }
      groupedClaims[claim.group].push(claim);
    }
  }
  
  // Check each group for conflicts
  const conflictingClaimIds = new Set<string>();
  
  for (const [group, claims] of Object.entries(groupedClaims)) {
    const activeClaims = claims.filter((c) => c.status === 'active');
    
    if (activeClaims.length > 1) {
      // Multiple active claims in same exclusive group → conflict
      for (const claim of activeClaims) {
        conflictingClaimIds.add(claim.claimId);
      }
    }
  }
  
  // Mark conflicting claims
  return validatedClaims.map((claim) => ({
    ...claim,
    isExclusiveConflict: conflictingClaimIds.has(claim.claimId),
  }));
}

/**
 * Validate a claim against available evidence
 * Returns claim status and matching evidence IDs
 * Priority: concept contradiction → category contradiction → ID contradiction → active → partial → unsupported
 */
function validateClaim(claim: Claim, evidence: EvidenceNode[]): ReasoningTraceItem {
  const availableEvidenceIds = evidence.map((e) => e.id);
  
  // Get claim from CLAIMS to access category
  const claimDef = CLAIMS.find((c) => c.id === claim.id);
  const claimCategory = claimDef?.category;
  
  // Check for concept-based contradictions FIRST (highest priority)
  const conceptConflictingEvidence = evidence.filter((e) => {
    if (!e.concept || !claimDef) return false;
    
    // Concept contradiction rule:
    // - If evidence concept is in claim's incompatibleConcepts → invalid
    return claimDef.incompatibleConcepts.includes(e.concept);
  });
  
  const hasConceptConflict = conceptConflictingEvidence.length > 0;
  
  // Check for concept matches (required concepts present in evidence)
  const conceptMatchingEvidence = evidence.filter((e) => {
    if (!e.concept || !claimDef) return false;
    return claimDef.requiredConcepts.includes(e.concept);
  });
  
  const hasConceptMatch = conceptMatchingEvidence.length > 0;
  
  // Check for category-based contradictions (second priority)
  const categoryConflictingEvidence = evidence.filter((e) => {
    if (!e.inferredCategory || !claimCategory) return false;
    
    // Category contradiction rules:
    // - crystalline claim + non-crystalline evidence → invalid
    // - non-crystalline claim + crystalline evidence → invalid
    if (claimCategory === 'crystalline' && e.inferredCategory === 'non-crystalline') {
      return true;
    }
    if (claimCategory === 'non-crystalline' && e.inferredCategory === 'crystalline') {
      return true;
    }
    return false;
  });
  
  const hasCategoryConflict = categoryConflictingEvidence.length > 0;
  
  // Check for ID-based contradicting evidence
  const presentContradictingIds = claim.contradictingEvidenceIds.filter((id) =>
    availableEvidenceIds.includes(id)
  );
  
  // Combine all contradicting evidence
  const allContradictingIds = [
    ...presentContradictingIds,
    ...categoryConflictingEvidence.map((e) => e.id),
    ...conceptConflictingEvidence.map((e) => e.id),
  ];
  const uniqueContradictingIds = [...new Set(allContradictingIds)];
  
  // Check required evidence
  const presentRequiredIds = claim.requiredEvidenceIds.filter((id) =>
    availableEvidenceIds.includes(id)
  );
  
  // Check optional evidence
  const presentOptionalIds = claim.optionalEvidenceIds.filter((id) =>
    availableEvidenceIds.includes(id)
  );
  
  // Combine all present evidence (excluding contradicting)
  const evidenceIds = [...presentRequiredIds, ...presentOptionalIds];
  
  // Determine status with concept contradiction as highest priority
  let status: ClaimStatus;
  
  if (hasConceptConflict || hasCategoryConflict || presentContradictingIds.length > 0) {
    // Contradiction exists (concept, category, or ID-based) → claim is INVALID
    status = 'invalid';
  } else if (presentRequiredIds.length === claim.requiredEvidenceIds.length) {
    // All required evidence present → claim is ACTIVE
    status = 'active';
  } else if (presentRequiredIds.length > 0) {
    // Some required evidence present → claim is PARTIAL
    status = 'partial';
  } else {
    // No required evidence present → claim is UNSUPPORTED
    status = 'unsupported';
  }
  
  // Determine group from exclusive groups
  let group = 'none';
  for (const [groupName, claimIds] of Object.entries(EXCLUSIVE_GROUPS)) {
    if (claimIds.includes(claim.id)) {
      group = groupName;
      break;
    }
  }
  
  return {
    claimId: claim.id,
    status,
    evidenceIds,
    contradictingEvidenceIds: uniqueContradictingIds,
    group,
    isExclusiveConflict: false, // Will be set by detectExclusiveConflicts
    categoryConflict: hasCategoryConflict,
    conceptMatch: hasConceptMatch,
    conceptConflict: hasConceptConflict,
    isDominant: false, // Will be set by selectDominantClaim
  };
}

/**
 * Select dominant claim based on validation results
 * - Only consider valid claims (not invalid)
 * - If multiple ACTIVE → mark as conflict (no dominant)
 * - If one ACTIVE → mark as dominant
 * - If only PARTIAL → no dominant (multiple allowed)
 */
function selectDominantClaim(validatedClaims: ReasoningTraceItem[]): ReasoningTraceItem[] {
  const validActiveClaims = validatedClaims.filter(
    (claim) => claim.status === 'active'
  );
  
  if (validActiveClaims.length === 1) {
    // Single active claim → mark as dominant
    return validatedClaims.map((claim) => ({
      ...claim,
      isDominant: claim.claimId === validActiveClaims[0].claimId,
    }));
  } else {
    // Multiple active (conflict), no active, or invalid → no dominant
    return validatedClaims.map((claim) => ({
      ...claim,
      isDominant: false,
    }));
  }
}

/**
 * Generate result when exclusive conflict is detected (mutually exclusive models)
 */
function generateExclusiveConflictResult(
  exclusiveConflicts: ReasoningTraceItem[],
  evidence: EvidenceNode[],
  reasoningTrace: ReasoningTraceItem[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const claimNames = exclusiveConflicts.map((c) => c.claimId).join(', ');
  const group = exclusiveConflicts[0].group;
  const techniques = [...new Set(evidence.map((e) => e.technique))];
  const techniqueList = techniques.join(', ');
  
  // Get claim details for category information
  const conflictingClaims = CLAIMS.filter((c) => 
    exclusiveConflicts.some((ec) => ec.claimId === c.id)
  );
  const categories = [...new Set(conflictingClaims.map((c) => c.category))];
  
  const basis = evidence.map(
    (e) => `${e.technique}: ${e.label} at ${e.x} ${e.unit}`
  );
  
  const conclusion =
    `Mutually exclusive ${group} models detected. Evidence from ${techniqueList} simultaneously supports incompatible structural interpretations: ${claimNames}. This represents a fundamental ambiguity requiring discriminating characterization.`;
  
  const crossTech =
    `${exclusiveConflicts.length} mutually exclusive ${group} claims are fully supported by current evidence. These models belong to incompatible categories (${categories.join(', ')}) and cannot coexist. Ambiguity arises from insufficient discriminating power in current technique combination. Orthogonal characterization required to resolve ${group} assignment.`;
  
  const limitations = [
    `Mutually exclusive ${group} models are simultaneously supported`,
    `Incompatible categories detected: ${categories.join(', ')}`,
    'Current evidence lacks sufficient discriminating features',
    'Technique combination insufficient to resolve structural ambiguity',
    'Additional orthogonal characterization required for definitive assignment',
  ];
  
  const decision =
    `Suspend definitive ${group} assignment pending discriminating characterization. Recommend techniques with high specificity for ${categories.join(' vs ')} distinction. Consider: high-resolution TEM for direct structural imaging, synchrotron XRD for detailed phase analysis, or advanced spectroscopic methods with enhanced structural sensitivity.`;
  
  return {
    conclusion,
    basis,
    crossTech,
    limitations,
    decision,
    reasoningTrace,
    highlightedEvidenceIds: [], // No highlighting for exclusive conflicts
  };
}

/**
 * Generate result when all claims are invalid (contradictory dataset)
 */
function generateContradictoryDatasetResult(
  invalidClaims: ReasoningTraceItem[],
  evidence: EvidenceNode[],
  reasoningTrace: ReasoningTraceItem[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const techniques = [...new Set(evidence.map((e) => e.technique))];
  const techniqueList = techniques.join(', ');
  
  const basis = evidence.map(
    (e) => `${e.technique}: ${e.label} at ${e.x} ${e.unit}`
  );
  
  // Collect all contradictions (concept and category-aware)
  const contradictions: string[] = [];
  for (const claim of invalidClaims) {
    const claimDef = CLAIMS.find((c) => c.id === claim.claimId);
    
    if (claim.conceptConflict && claimDef) {
      // Concept-based contradiction
      const conceptConflictingEvidence = evidence.filter((e) => 
        claim.contradictingEvidenceIds.includes(e.id) && 
        e.concept && 
        claimDef.incompatibleConcepts.includes(e.concept)
      );
      
      for (const e of conceptConflictingEvidence) {
        contradictions.push(
          `Observed ${e.concept} (${e.technique}: ${e.label}) is physically incompatible with ${claim.claimId} structural model`
        );
      }
    }
    
    if (claim.categoryConflict && claimDef) {
      // Category-based contradiction
      const categoryConflictingEvidence = evidence.filter((e) => 
        claim.contradictingEvidenceIds.includes(e.id) && 
        e.inferredCategory && 
        e.inferredCategory !== claimDef.category &&
        (!e.concept || !claimDef.incompatibleConcepts.includes(e.concept))
      );
      
      for (const e of categoryConflictingEvidence) {
        contradictions.push(
          `Observed ${e.inferredCategory} structure (${e.technique}: ${e.label}) contradicts ${claimDef.category} model (${claim.claimId})`
        );
      }
    }
    
    // ID-based contradictions
    const idConflictingEvidence = evidence.filter((e) => 
      claim.contradictingEvidenceIds.includes(e.id) &&
      (!e.inferredCategory || e.inferredCategory === claimDef?.category) &&
      (!e.concept || !claimDef?.incompatibleConcepts.includes(e.concept))
    );
    
    for (const e of idConflictingEvidence) {
      contradictions.push(
        `${claim.claimId} contradicted by ${e.technique}: ${e.label}`
      );
    }
  }
  
  const conclusion =
    `Contradictory evidence detected from ${techniqueList}. All structural models are invalidated by conflicting observations. Dataset may contain mixed phases, experimental artifacts, or sample heterogeneity.`;
  
  const crossTech =
    `All ${invalidClaims.length} structural models are contradicted by current evidence. Systematic contradictions suggest dataset complexity beyond single-phase interpretation. Re-evaluation of sample preparation, measurement conditions, and phase purity required.`;
  
  const limitations = [
    'All structural models contradicted by evidence',
    ...contradictions,
    'Dataset may represent mixed-phase sample or experimental artifacts',
    'Sample heterogeneity or contamination cannot be excluded',
  ];
  
  const decision =
    'Suspend structural assignment. Recommend sample re-characterization, phase separation analysis, and verification of measurement conditions. Consider mixed-phase or composite material interpretation.';
  
  return {
    conclusion,
    basis,
    crossTech,
    limitations,
    decision,
    reasoningTrace,
    highlightedEvidenceIds,
  };
}

/**
 * Generate result when dominant claim is active and others are invalid (strong assignment)
 */
function generateStrongAssignmentResult(
  dominantClaim: ReasoningTraceItem,
  invalidClaims: ReasoningTraceItem[],
  evidence: EvidenceNode[],
  reasoningTrace: ReasoningTraceItem[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const claimEvidence = evidence.filter((e) => dominantClaim.evidenceIds.includes(e.id));
  
  // Collect contradictions for invalid claims (concept and category-aware)
  const contradictions: string[] = [];
  for (const claim of invalidClaims) {
    const claimDef = CLAIMS.find((c) => c.id === claim.claimId);
    
    if (claim.conceptConflict && claimDef) {
      // Concept-based contradiction
      const conceptConflictingEvidence = evidence.filter((e) => 
        claim.contradictingEvidenceIds.includes(e.id) && 
        e.concept && 
        claimDef.incompatibleConcepts.includes(e.concept)
      );
      
      for (const e of conceptConflictingEvidence) {
        contradictions.push(
          `Observed ${e.concept} (${e.technique}: ${e.label}) excludes ${claim.claimId} structural model`
        );
      }
    }
    
    if (claim.categoryConflict && claimDef) {
      // Category-based contradiction
      const categoryConflictingEvidence = evidence.filter((e) => 
        claim.contradictingEvidenceIds.includes(e.id) && 
        e.inferredCategory && 
        e.inferredCategory !== claimDef.category &&
        (!e.concept || !claimDef.incompatibleConcepts.includes(e.concept))
      );
      
      for (const e of categoryConflictingEvidence) {
        contradictions.push(
          `Observed ${e.inferredCategory} structure (${e.technique}: ${e.label}) excludes ${claimDef.category} model (${claim.claimId})`
        );
      }
    }
    
    // ID-based contradictions
    const idConflictingEvidence = evidence.filter((e) => 
      claim.contradictingEvidenceIds.includes(e.id) &&
      (!e.inferredCategory || e.inferredCategory === claimDef?.category) &&
      (!e.concept || !claimDef?.incompatibleConcepts.includes(e.concept))
    );
    
    for (const e of idConflictingEvidence) {
      contradictions.push(
        `${claim.claimId} excluded by ${e.technique}: ${e.label}`
      );
    }
  }
  
  // Generate claim-specific result with added strength from exclusions
  const baseResult = generateDominantClaimResult(
    dominantClaim,
    evidence,
    reasoningTrace,
    highlightedEvidenceIds
  );
  
  // Enhance with exclusion information
  const enhancedConclusion = baseResult.conclusion + 
    ` Alternative structural models (${invalidClaims.map((c) => c.claimId).join(', ')}) are excluded by contradictory evidence.`;
  
  const enhancedCrossTech = baseResult.crossTech + 
    ` Competing interpretations are systematically ruled out by contradictory observations, strengthening the ${dominantClaim.claimId} assignment.`;
  
  const enhancedLimitations = [
    ...baseResult.limitations,
    ...contradictions,
  ];
  
  return {
    ...baseResult,
    conclusion: enhancedConclusion,
    crossTech: enhancedCrossTech,
    limitations: enhancedLimitations,
  };
}

/**
 * Generate result when multiple active claims conflict
 */
function generateConflictResult(
  activeClaims: ReasoningTraceItem[],
  evidence: EvidenceNode[],
  reasoningTrace: ReasoningTraceItem[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const claimNames = activeClaims.map((c) => c.claimId).join(', ');
  const techniques = [...new Set(evidence.map((e) => e.technique))];
  const techniqueList = techniques.join(', ');
  
  const basis = evidence.map(
    (e) => `${e.technique}: ${e.label} at ${e.x} ${e.unit}`
  );
  
  const conclusion =
    `Conflicting interpretations detected. Evidence from ${techniqueList} supports multiple structural models: ${claimNames}. Additional discriminating techniques required for definitive assignment.`;
  
  const crossTech =
    `${activeClaims.length} competing claims are fully supported by current evidence. Ambiguity arises from overlapping spectral signatures or insufficient discriminating features. Orthogonal characterization methods required to resolve structural assignment.`;
  
  const limitations = [
    'Multiple structural models are consistent with current evidence',
    'Overlapping spectral features prevent unambiguous assignment',
    'Additional discriminating techniques required to resolve conflict',
    'Current evidence set lacks sufficient specificity for definitive conclusion',
  ];
  
  const decision =
    `Suspend definitive structural assignment pending additional characterization. Recommend techniques with high discriminating power for ${claimNames} distinction.`;
  
  return {
    conclusion,
    basis,
    crossTech,
    limitations,
    decision,
    reasoningTrace,
    highlightedEvidenceIds,
  };
}

/**
 * Generate result when single dominant claim is active
 */
function generateDominantClaimResult(
  dominantClaim: ReasoningTraceItem,
  evidence: EvidenceNode[],
  reasoningTrace: ReasoningTraceItem[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const claimEvidence = evidence.filter((e) => dominantClaim.evidenceIds.includes(e.id));
  
  // Generate claim-specific result
  if (dominantClaim.claimId === 'spinel-ferrite') {
    return generateSpinelFerriteResult(claimEvidence, reasoningTrace, highlightedEvidenceIds);
  } else if (dominantClaim.claimId === 'non-spinel-oxide') {
    return generateNonSpinelOxideResult(claimEvidence, reasoningTrace, highlightedEvidenceIds);
  } else if (dominantClaim.claimId === 'amorphous-disordered') {
    return generateAmorphousDisorderedResult(claimEvidence, reasoningTrace, highlightedEvidenceIds);
  }
  
  // Fallback for unknown claims
  return generateGenericDominantResult(dominantClaim, claimEvidence, reasoningTrace, highlightedEvidenceIds);
}

/**
 * Generate spinel ferrite scientific conclusion
 */
function generateSpinelFerriteResult(
  claimEvidence: EvidenceNode[],
  reasoningTrace: ReasoningTraceItem[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const basis: string[] = [];
  
  const ramanEvidence = claimEvidence.find((e) => e.id === 'raman-a1g');
  const xrdEvidence = claimEvidence.find((e) => e.id === 'xrd-spinel');
  const ftirEvidence = claimEvidence.find((e) => e.id === 'ftir-mo-band');
  
  if (ramanEvidence) {
    basis.push(
      `Raman: ${ramanEvidence.label} at ${ramanEvidence.x} ${ramanEvidence.unit} characteristic of tetrahedral-site cation vibrations in spinel lattice`
    );
  }
  
  if (xrdEvidence) {
    basis.push(
      `XRD: ${xrdEvidence.label} at ${xrdEvidence.x}° ${xrdEvidence.unit} consistent with cubic spinel phase`
    );
  }
  
  if (ftirEvidence) {
    basis.push(
      `FTIR: ${ftirEvidence.label} at ${ftirEvidence.x} ${ftirEvidence.unit} supports metal-oxygen framework`
    );
  }
  
  const crossTech = ftirEvidence
    ? 'Raman vibrational symmetry and XRD long-range order independently converge on cubic spinel structure. FTIR metal-oxygen band provides additional support. No contradictions observed across techniques.'
    : 'Raman vibrational symmetry and XRD long-range order independently converge on cubic spinel structure. Complementary techniques provide convergent structural assignment.';
  
  const limitations: string[] = [
    'XRD provides bulk-averaged structure; surface reconstruction or amorphous surface layers not detected',
    'Cation distribution between tetrahedral and octahedral sites not determined from current evidence',
    'Raman selection rules may obscure certain vibrational modes depending on laser polarization',
  ];
  
  const decision =
    'Use spinel ferrite assignment as a working interpretation; phase purity and surface-state claims remain validation-limited.';
  
  return {
    conclusion:
      'Linked XRD, Raman, and FTIR evidence supports a spinel-ferrite working interpretation, while XPS surface-state validation remains under review.',
    basis,
    crossTech,
    limitations,
    decision,
    reasoningTrace,
    highlightedEvidenceIds,
  };
}

/**
 * Generate non-spinel oxide scientific conclusion
 */
function generateNonSpinelOxideResult(
  claimEvidence: EvidenceNode[],
  reasoningTrace: ReasoningTraceItem[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const basis = claimEvidence.map(
    (e) => `${e.technique}: ${e.label} at ${e.x} ${e.unit}`
  );
  
  return {
    conclusion:
      'Convergent evidence supports non-spinel oxide phase with distinct structural and electronic signatures inconsistent with spinel symmetry.',
    basis,
    crossTech:
      'XRD and XPS independently confirm non-spinel oxide structure. Diffraction pattern lacks characteristic spinel reflections. Electronic structure indicates alternative coordination environment.',
    limitations: [
      'Specific oxide phase not determined from current evidence',
      'Additional structural refinement required for definitive phase identification',
      'Surface vs bulk composition may differ',
    ],
    decision:
      'Proceed with non-spinel oxide classification. Recommend high-resolution structural characterization for phase identification.',
    reasoningTrace,
    highlightedEvidenceIds,
  };
}

/**
 * Generate amorphous/disordered phase scientific conclusion
 */
function generateAmorphousDisorderedResult(
  claimEvidence: EvidenceNode[],
  reasoningTrace: ReasoningTraceItem[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const basis = claimEvidence.map(
    (e) => `${e.technique}: ${e.label} at ${e.x} ${e.unit}`
  );
  
  return {
    conclusion:
      'Convergent evidence indicates amorphous or highly disordered phase with absence of long-range crystalline order.',
    basis,
    crossTech:
      'XRD and Raman independently confirm lack of long-range order. Broad diffraction features and disorder-induced Raman bands indicate structural amorphization or nanoscale disorder.',
    limitations: [
      'Degree of disorder not quantified from current evidence',
      'Local short-range order may exist but is not detected by current techniques',
      'Amorphous vs nanocrystalline distinction requires additional characterization',
    ],
    decision:
      'Proceed with amorphous/disordered phase classification. Recommend pair distribution function analysis or high-resolution TEM for local structure determination.',
    reasoningTrace,
    highlightedEvidenceIds,
  };
}

/**
 * Generate result when multiple partial claims exist (competing hypotheses)
 */
function generateCompetingHypothesesResult(
  partialClaims: ReasoningTraceItem[],
  evidence: EvidenceNode[],
  reasoningTrace: ReasoningTraceItem[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const claimNames = partialClaims.map((c) => c.claimId).join(', ');
  const techniques = [...new Set(evidence.map((e) => e.technique))];
  const techniqueList = techniques.join(', ');
  
  const basis = evidence.map(
    (e) => `${e.technique}: ${e.label} at ${e.x} ${e.unit}`
  );
  
  const conclusion =
    `Partial evidence from ${techniqueList} suggests multiple competing structural hypotheses: ${claimNames}. Additional complementary techniques required for definitive assignment.`;
  
  const crossTech =
    `${partialClaims.length} competing hypotheses have partial support from current evidence. Incomplete evidence sets prevent definitive discrimination between structural models. Convergent multi-technique characterization required.`;
  
  const limitations = [
    'Incomplete evidence sets for all competing hypotheses',
    'Additional required techniques needed to validate or eliminate structural models',
    'Current observations provide preliminary characterization only',
    'Ambiguity cannot be resolved without completing required evidence sets',
  ];
  
  const decision =
    `Proceed with additional characterization to complete required evidence sets for competing hypotheses. Prioritize techniques that discriminate between ${claimNames}.`;
  
  return {
    conclusion,
    basis,
    crossTech,
    limitations,
    decision,
    reasoningTrace,
    highlightedEvidenceIds,
  };
}

/**
 * Generate result when no claims are supported
 */
function generateInsufficientEvidenceResult(
  evidence: EvidenceNode[],
  reasoningTrace: ReasoningTraceItem[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const techniques = [...new Set(evidence.map((e) => e.technique))];
  const techniqueList = techniques.join(', ');
  
  const basis = evidence.length > 0
    ? evidence.map((e) => `${e.technique}: ${e.label} at ${e.x} ${e.unit}`)
    : [];
  
  const conclusion =
    evidence.length > 0
      ? `Current evidence from ${techniqueList} provides preliminary characterization. Multi-technique convergent evidence required for structural assignment.`
      : 'No evidence provided for evaluation. Multi-technique characterization required for structural assignment.';
  
  const crossTech =
    evidence.length > 1
      ? `${techniques.length} techniques provide complementary information. Convergent evidence from required technique combinations needed for structural assignment.`
      : evidence.length === 1
      ? 'Single-technique observation. Cross-validation with complementary techniques recommended for definitive assignment.'
      : 'No cross-technique validation available.';
  
  const limitations =
    evidence.length > 0
      ? [
          'Insufficient convergent evidence for definitive structural assignment',
          'Required techniques not present in current evidence set',
          'Additional characterization required to resolve structural ambiguity',
        ]
      : ['No evidence available for evaluation'];
  
  const decision =
    evidence.length > 0
      ? 'Initiate additional characterization with required technique combinations for structural assignment. Recommend multi-technique approach for comprehensive analysis.'
      : 'Initiate multi-technique characterization with Raman, XRD, XPS, and FTIR.';
  
  return {
    conclusion,
    basis,
    crossTech,
    limitations,
    decision,
    reasoningTrace,
    highlightedEvidenceIds,
  };
}

/**
 * Generic dominant result for unknown claims
 */
function generateGenericDominantResult(
  dominantClaim: ReasoningTraceItem,
  claimEvidence: EvidenceNode[],
  reasoningTrace: ReasoningTraceItem[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const techniques = [...new Set(claimEvidence.map((e) => e.technique))];
  const techniqueList = techniques.join(', ');
  
  const basis = claimEvidence.map(
    (e) => `${e.technique}: ${e.label} at ${e.x} ${e.unit}`
  );
  
  return {
    conclusion: `Multi-technique evidence from ${techniqueList} supports ${dominantClaim.claimId} structural assignment.`,
    basis,
    crossTech: `Convergent evidence from ${techniques.length} technique${techniques.length === 1 ? '' : 's'} supports ${dominantClaim.claimId} interpretation.`,
    limitations: ['Technique-specific limitations apply to current observations'],
    decision: `Proceed with ${dominantClaim.claimId} structural assignment based on convergent evidence.`,
    reasoningTrace,
    highlightedEvidenceIds,
  };
}
