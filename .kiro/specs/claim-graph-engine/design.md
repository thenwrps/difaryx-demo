# Design Document: Claim Graph + Evidence Propagation Engine

## Overview

The Claim Graph + Evidence Propagation Engine replaces label/ranking-based reasoning with graph-based scientific reasoning using explicit relation types and structural propagation rules. The system operates deterministically without LLM calls, numeric confidence scores, weights, thresholds, or quality adjectives.

**Core Principle**: Scientific conclusions emerge from the topology and relation types in the claim graph, not from numeric scoring.

**Key Design Constraints**:
- Pure graph-based reasoning without numeric scores
- Deterministic propagation based on relation types
- Maintain backward compatibility with existing FusionResult API
- Use relation-based terminology throughout (supports, contradicts, requires validation, etc.)
- Mid-size, implementation-oriented design (not over-expanded)

## Architecture

### High-Level Flow

```
Raw Evidence → Evidence Nodes → Claim Graph → Propagation → Reasoning Trace → Scientific Report
```

1. **Evidence Node Creation**: Convert raw technique observations (peaks, bands, binding energies) into EvidenceNodes with concept mapping
2. **Graph Construction**: Build ClaimGraph by connecting EvidenceNodes to ClaimNodes via typed EvidenceRelations
3. **Claim Propagation**: Determine claim status based on graph structure and relation types
4. **Reasoning Trace Generation**: Generate deterministic explanation of how evidence determines claim status
5. **Report Generation**: Produce scientific output with conclusion, basis, limitations, and required validation

### Module Structure

```
src/engines/claimGraph/
├── types.ts                    # Core type definitions
├── claimDefinitions.ts         # Predefined scientific claims
├── buildClaimGraph.ts          # Graph construction logic
├── propagateClaims.ts          # Propagation engine
├── generateReasoningTrace.ts   # Reasoning trace generation
└── index.ts                    # Public API
```

## Components and Interfaces

### Core Types (types.ts)

```typescript
// Evidence relation types
export type EvidenceRelationType = 
  | 'supports'        // Evidence directly supports the claim
  | 'contradicts'     // Evidence directly contradicts the claim
  | 'qualifies'       // Evidence adds nuance to the claim
  | 'requires'        // Claim requires this evidence for validation
  | 'contextualizes'; // Evidence provides context without direct support

// Evidence roles in supporting claims
export type EvidenceRole = 
  | 'primary'     // Primary evidence required for claim
  | 'supporting'  // Supporting evidence that strengthens claim
  | 'context'     // Contextual evidence
  | 'validation'; // Validation evidence required for full support

// Claim status after propagation
export type ClaimStatus = 
  | 'supported'           // All required evidence present, no blocking contradictions
  | 'partially_supported' // Some required evidence present
  | 'contradicted'        // Blocking contradiction exists
  | 'inconclusive'        // Insufficient evidence
  | 'requires_validation'; // Primary evidence present but validation missing

// Validation state
export type ValidationState = 
  | 'complete'          // All validation evidence present
  | 'incomplete'        // Some validation evidence missing
  | 'blocked'           // Validation blocked by contradiction
  | 'requires_followup'; // Validation requires additional experiments

// Technique authority for claim types
export type TechniqueAuthority = 
  | 'primary'     // Primary technique for this claim type
  | 'supporting'  // Supporting technique
  | 'validation'  // Validation technique
  | 'context';    // Contextual technique

// Evidence node
export interface EvidenceNode {
  id: string;
  technique: Technique;
  value: number;
  unit: string;
  label: string;
  concept: string;  // Physical interpretation (e.g., 'cubic-spinel-lattice')
  role?: EvidenceRole;
}

// Claim node
export interface ClaimNode {
  id: string;
  description: string;
  required_evidence_roles: EvidenceRole[];
  optional_evidence_roles: EvidenceRole[];
  incompatible_concepts: string[];
}

// Evidence relation
export interface EvidenceRelation {
  evidence_id: string;
  claim_id: string;
  relation_type: EvidenceRelationType;
  role: EvidenceRole;
}

// Claim graph
export interface ClaimGraph {
  evidence_nodes: EvidenceNode[];
  claim_nodes: ClaimNode[];
  relations: EvidenceRelation[];
}

// Propagation result
export interface PropagationResult {
  claim_id: string;
  status: ClaimStatus;
  supporting_evidence: EvidenceNode[];
  contradicting_evidence: EvidenceNode[];
  missing_validation: string[];
  qualifications: string[];
  rationale: string;
}

// Reasoning trace
export interface ReasoningTrace {
  claim: string;
  observed_evidence: string[];
  relation_summary: string;
  resulting_status: ClaimStatus;
  reviewer_rationale: string;
}
```

### Claim Definitions (claimDefinitions.ts)

Predefined scientific claims for common characterization scenarios:

```typescript
export const CLAIM_DEFINITIONS: ClaimNode[] = [
  {
    id: 'spinel_ferrite_assignment',
    description: 'Material exhibits cubic spinel ferrite structure',
    required_evidence_roles: ['primary'],
    optional_evidence_roles: ['supporting', 'validation'],
    incompatible_concepts: [
      'absence-of-long-range-order',
      'alternative-crystalline-phase',
      'structural-disorder'
    ],
  },
  {
    id: 'oxidation_state_consistency',
    description: 'Surface oxidation states consistent with bulk composition',
    required_evidence_roles: ['primary'],
    optional_evidence_roles: ['validation'],
    incompatible_concepts: [
      'surface-reduction',
      'oxidation-state-mismatch'
    ],
  },
  {
    id: 'metal_oxygen_bonding',
    description: 'Metal-oxygen bonding framework consistent with ferrite structure',
    required_evidence_roles: ['primary'],
    optional_evidence_roles: ['supporting'],
    incompatible_concepts: [
      'absence-of-metal-oxygen-framework',
      'non-oxide-bonding'
    ],
  },
  {
    id: 'surface_species_presence',
    description: 'Surface species (hydroxyl, carbonate) detected',
    required_evidence_roles: ['primary'],
    optional_evidence_roles: ['context'],
    incompatible_concepts: [],
  },
  {
    id: 'catalytic_activation_readiness',
    description: 'Material exhibits characteristics consistent with catalytic activation',
    required_evidence_roles: ['primary', 'validation'],
    optional_evidence_roles: ['supporting'],
    incompatible_concepts: [
      'surface-passivation',
      'inactive-surface-state'
    ],
  },
];

// Technique authority mapping
export const TECHNIQUE_AUTHORITY: Record<string, Record<Technique, TechniqueAuthority>> = {
  spinel_ferrite_assignment: {
    XRD: 'primary',
    Raman: 'primary',
    XPS: 'context',
    FTIR: 'supporting',
  },
  oxidation_state_consistency: {
    XRD: 'context',
    Raman: 'context',
    XPS: 'primary',
    FTIR: 'context',
  },
  metal_oxygen_bonding: {
    XRD: 'context',
    Raman: 'supporting',
    XPS: 'supporting',
    FTIR: 'primary',
  },
  surface_species_presence: {
    XRD: 'context',
    Raman: 'context',
    XPS: 'primary',
    FTIR: 'primary',
  },
  catalytic_activation_readiness: {
    XRD: 'supporting',
    Raman: 'supporting',
    XPS: 'validation',
    FTIR: 'validation',
  },
};

// Evidence concept mapping (physical interpretation)
export const EVIDENCE_CONCEPTS: Record<string, string> = {
  'xrd-spinel': 'cubic-spinel-lattice',
  'raman-a1g': 'tetrahedral-site-vibration',
  'xrd-non-spinel': 'alternative-crystalline-phase',
  'xrd-amorphous': 'absence-of-long-range-order',
  'raman-disorder': 'structural-disorder',
  'ftir-mo-band': 'metal-oxygen-framework',
  'ftir-oxide-band': 'oxide-bonding',
  'xps-oxide': 'oxidized-surface-state',
  'xps-mixed-state': 'mixed-oxidation-state',
  'ftir-hydroxyl': 'surface-hydroxyl-species',
  'ftir-carbonate': 'surface-carbonate-species',
};
```

## Data Models

### Evidence Node Creation Flow

```typescript
// Input: Raw technique data
interface RawEvidenceInput {
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

// Process: Concept mapping
function createEvidenceNodes(input: RawEvidenceInput): EvidenceNode[] {
  return input.peaks.map(peak => {
    const evidenceId = generateEvidenceId(input.technique, peak);
    const concept = EVIDENCE_CONCEPTS[evidenceId];
    
    return {
      id: evidenceId,
      technique: input.technique,
      value: peak.position,
      unit: getUnitForTechnique(input.technique),
      label: peak.label || `Peak at ${peak.position.toFixed(1)}`,
      concept,
    };
  });
}
```

### Graph Construction Flow

```typescript
// Build claim graph from evidence nodes and claim definitions
function buildClaimGraph(
  evidenceNodes: EvidenceNode[],
  claimDefinitions: ClaimNode[]
): ClaimGraph {
  const relations: EvidenceRelation[] = [];
  
  for (const claim of claimDefinitions) {
    for (const evidence of evidenceNodes) {
      // Check for contradiction (incompatible concept)
      if (claim.incompatible_concepts.includes(evidence.concept)) {
        relations.push({
          evidence_id: evidence.id,
          claim_id: claim.id,
          relation_type: 'contradicts',
          role: 'primary',
        });
        continue;
      }
      
      // Determine role based on technique authority
      const authority = TECHNIQUE_AUTHORITY[claim.id]?.[evidence.technique];
      const role = mapAuthorityToRole(authority);
      
      // Check for support (concept matches claim requirements)
      if (conceptSupportsClaim(evidence.concept, claim)) {
        relations.push({
          evidence_id: evidence.id,
          claim_id: claim.id,
          relation_type: 'supports',
          role,
        });
      } else if (conceptContextualizesClaim(evidence.concept, claim)) {
        relations.push({
          evidence_id: evidence.id,
          claim_id: claim.id,
          relation_type: 'contextualizes',
          role: 'context',
        });
      }
    }
  }
  
  return {
    evidence_nodes: evidenceNodes,
    claim_nodes: claimDefinitions,
    relations,
  };
}
```

### Evidence Relation Rules

**Relation Type Determination**:

1. **Contradicts**: Evidence concept is in claim's `incompatible_concepts` list
2. **Supports**: Evidence concept matches claim requirements AND technique has appropriate authority
3. **Qualifies**: Evidence adds nuance without direct support/contradiction
4. **Requires**: Claim requires specific validation evidence that is missing
5. **Contextualizes**: Evidence provides context without direct support

**Role Assignment**:

- **Primary**: Technique has 'primary' authority for this claim type
- **Supporting**: Technique has 'supporting' authority
- **Validation**: Technique has 'validation' authority
- **Context**: Technique has 'context' authority

### Claim Propagation Rules

**Status Determination** (checked in order):

1. **Contradicted**: Any 'contradicts' relation with incompatible concept exists
2. **Supported**: All required primary evidence present AND no blocking contradictions AND validation complete
3. **Requires Validation**: All required primary evidence present AND no blocking contradictions AND validation incomplete
4. **Partially Supported**: Some required primary evidence present
5. **Inconclusive**: No required primary evidence present

```typescript
function propagateClaim(
  claim: ClaimNode,
  relations: EvidenceRelation[],
  evidenceNodes: EvidenceNode[]
): PropagationResult {
  const claimRelations = relations.filter(r => r.claim_id === claim.id);
  
  // Check for contradictions
  const contradictions = claimRelations.filter(r => r.relation_type === 'contradicts');
  if (contradictions.length > 0) {
    return {
      claim_id: claim.id,
      status: 'contradicted',
      supporting_evidence: [],
      contradicting_evidence: contradictions.map(r => 
        evidenceNodes.find(e => e.id === r.evidence_id)!
      ),
      missing_validation: [],
      qualifications: [],
      rationale: generateContradictionRationale(claim, contradictions, evidenceNodes),
    };
  }
  
  // Check for required evidence
  const supportingRelations = claimRelations.filter(r => r.relation_type === 'supports');
  const primaryEvidence = supportingRelations.filter(r => r.role === 'primary');
  const validationEvidence = supportingRelations.filter(r => r.role === 'validation');
  
  const hasPrimaryEvidence = primaryEvidence.length > 0;
  const hasValidation = claim.required_evidence_roles.includes('validation')
    ? validationEvidence.length > 0
    : true;
  
  if (hasPrimaryEvidence && hasValidation) {
    return {
      claim_id: claim.id,
      status: 'supported',
      supporting_evidence: supportingRelations.map(r => 
        evidenceNodes.find(e => e.id === r.evidence_id)!
      ),
      contradicting_evidence: [],
      missing_validation: [],
      qualifications: [],
      rationale: generateSupportedRationale(claim, supportingRelations, evidenceNodes),
    };
  } else if (hasPrimaryEvidence && !hasValidation) {
    return {
      claim_id: claim.id,
      status: 'requires_validation',
      supporting_evidence: primaryEvidence.map(r => 
        evidenceNodes.find(e => e.id === r.evidence_id)!
      ),
      contradicting_evidence: [],
      missing_validation: ['Validation evidence required for full support'],
      qualifications: [],
      rationale: generateValidationRequiredRationale(claim, primaryEvidence, evidenceNodes),
    };
  } else if (primaryEvidence.length > 0) {
    return {
      claim_id: claim.id,
      status: 'partially_supported',
      supporting_evidence: supportingRelations.map(r => 
        evidenceNodes.find(e => e.id === r.evidence_id)!
      ),
      contradicting_evidence: [],
      missing_validation: [],
      qualifications: [],
      rationale: generatePartialRationale(claim, supportingRelations, evidenceNodes),
    };
  } else {
    return {
      claim_id: claim.id,
      status: 'inconclusive',
      supporting_evidence: [],
      contradicting_evidence: [],
      missing_validation: ['Required primary evidence not present'],
      qualifications: [],
      rationale: generateInconclusiveRationale(claim),
    };
  }
}
```

## Error Handling

**Graph Construction Errors**:
- Missing evidence concept mapping → Use fallback concept
- Unknown technique → Throw error with descriptive message
- Invalid claim definition → Throw error during validation

**Propagation Errors**:
- Circular dependencies → Not possible with current design (evidence → claim only)
- Missing evidence nodes → Filter out invalid relations
- Conflicting relations → Contradiction takes precedence

**Error Recovery**:
- Graceful degradation: If concept mapping fails, use generic concept
- Validation: Validate claim definitions at module load time
- Logging: Log warnings for missing mappings without failing

## Testing Strategy

### Unit Tests

**Evidence Node Creation**:
- Test concept mapping for each technique
- Test fallback behavior for unknown peaks
- Test unit assignment for each technique

**Graph Construction**:
- Test relation creation for supports/contradicts/contextualizes
- Test role assignment based on technique authority
- Test handling of missing concept mappings

**Claim Propagation**:
- Test status determination for each ClaimStatus value
- Test contradiction detection
- Test validation requirement detection
- Test partial support detection

**Reasoning Trace Generation**:
- Test rationale generation for each status
- Test relation-based language (no scoring terms)
- Test evidence listing and formatting

### Integration Tests

**End-to-End Flow**:
- Test complete flow from raw evidence to scientific report
- Test CuFe2O4 demo case with real data
- Test backward compatibility with FusionResult API

**Cross-Technique Scenarios**:
- Test XRD + Raman convergence for spinel assignment
- Test XPS surface vs bulk consistency
- Test FTIR + Raman bonding framework support

### Deterministic Demo Case

**CuFe2O4 Spinel Ferrite Example**:

```typescript
const cufe2o4Evidence: RawEvidenceInput[] = [
  {
    technique: 'XRD',
    peaks: [
      { id: 'xrd-1', position: 30.1, intensity: 45, label: '(220)', hkl: '220' },
      { id: 'xrd-2', position: 35.5, intensity: 100, label: '(311)', hkl: '311' },
      { id: 'xrd-3', position: 43.2, intensity: 30, label: '(400)', hkl: '400' },
      { id: 'xrd-4', position: 57.1, intensity: 60, label: '(511)', hkl: '511' },
    ],
  },
  {
    technique: 'Raman',
    peaks: [
      { id: 'raman-1', position: 690, intensity: 85, label: 'A₁g mode' },
    ],
  },
  {
    technique: 'FTIR',
    peaks: [
      { id: 'ftir-1', position: 580, intensity: 70, label: 'M-O stretch' },
      { id: 'ftir-2', position: 3400, intensity: 40, label: 'OH/H₂O' },
    ],
  },
];

// Expected output:
// - spinel_ferrite_assignment: supported (XRD + Raman primary evidence)
// - metal_oxygen_bonding: supported (FTIR primary + Raman supporting)
// - surface_species_presence: supported (FTIR primary evidence)
```

## FusionEngine Integration Path

### Refactoring Strategy

**Phase 1: Internal Replacement**
- Keep existing `evaluate()` function signature
- Replace internal logic with ClaimGraph engine
- Map PropagationResult → FusionResult

**Phase 2: Backward Compatibility**
- Preserve `reasoningTrace` field structure
- Preserve `highlightedEvidenceIds` field
- Map ClaimStatus to appropriate conclusion language

**Phase 3: Gradual Migration**
- Update callers to use new terminology
- Remove old scoring/ranking logic
- Clean up deprecated code paths

### Integration Code

```typescript
// src/engines/fusionEngine/fusionEngine.ts (refactored)

import { 
  buildClaimGraph, 
  propagateClaims, 
  generateReasoningTrace,
  CLAIM_DEFINITIONS 
} from '../claimGraph';

export function evaluate(input: FusionInput): FusionResult {
  // Convert FusionInput evidence to ClaimGraph evidence nodes
  const evidenceNodes = input.evidence.map(e => ({
    id: e.id,
    technique: e.technique,
    value: e.x,
    unit: e.unit,
    label: e.label,
    concept: e.concept || 'unknown-concept',
  }));
  
  // Build claim graph
  const claimGraph = buildClaimGraph(evidenceNodes, CLAIM_DEFINITIONS);
  
  // Propagate claims
  const propagationResults = propagateClaims(claimGraph);
  
  // Generate reasoning trace
  const reasoningTrace = generateReasoningTrace(propagationResults, claimGraph);
  
  // Convert to FusionResult (backward compatibility)
  return convertToFusionResult(propagationResults, reasoningTrace, evidenceNodes);
}

function convertToFusionResult(
  propagationResults: PropagationResult[],
  reasoningTrace: ReasoningTrace[],
  evidenceNodes: EvidenceNode[]
): FusionResult {
  // Find dominant claim (supported status)
  const supportedClaim = propagationResults.find(r => r.status === 'supported');
  const dominantResult = supportedClaim || propagationResults[0];
  
  // Map to FusionResult fields
  const conclusion = generateConclusion(dominantResult, propagationResults);
  const basis = dominantResult.supporting_evidence.map(e => 
    `${e.technique}: ${e.label} at ${e.value} ${e.unit}`
  );
  const crossTech = generateCrossTechSummary(propagationResults, evidenceNodes);
  const limitations = generateLimitations(propagationResults);
  const decision = generateDecision(dominantResult);
  
  // Map reasoning trace to old format (for backward compatibility)
  const legacyReasoningTrace = reasoningTrace.map(trace => ({
    claimId: trace.claim,
    status: mapClaimStatusToLegacy(dominantResult.status),
    evidenceIds: dominantResult.supporting_evidence.map(e => e.id),
    contradictingEvidenceIds: dominantResult.contradicting_evidence.map(e => e.id),
    group: 'structure',
    isExclusiveConflict: false,
    categoryConflict: false,
    conceptMatch: true,
    conceptConflict: dominantResult.contradicting_evidence.length > 0,
    isDominant: dominantResult.status === 'supported',
  }));
  
  const highlightedEvidenceIds = dominantResult.supporting_evidence.map(e => e.id);
  
  return {
    conclusion,
    basis,
    crossTech,
    limitations,
    decision,
    reasoningTrace: legacyReasoningTrace,
    highlightedEvidenceIds,
  };
}
```

## Minimal UI Consumption Changes

### MultiTechWorkspace Updates

**Current**: Uses FusionResult with scoring language
**Required**: Replace scoring language with relation-based terminology

```typescript
// Before:
<div>Confidence: {result.confidence}%</div>

// After:
<div>Status: {result.status}</div>  // 'supported', 'partially_supported', etc.
```

**Changes**:
1. Replace "confidence", "score", "quality" with ClaimStatus values
2. Display evidence relations (supports, contradicts, requires validation)
3. Display evidence roles (primary, supporting, validation, context)

### AgentDemo Updates

**Current**: Uses FusionResult with metrics and detail rows
**Required**: Update metrics to use relation-based language

```typescript
// Before:
{ label: 'Confidence', value: '85%', tone: 'emerald' }

// After:
{ label: 'Claim status', value: 'supported', tone: 'emerald' }
```

**Changes**:
1. Update metrics to show ClaimStatus instead of confidence
2. Update detail rows to show relation types
3. Update reasoning trace display to use relation-based language

## Deterministic Demo Case

### CuFe2O4 Spinel Ferrite Characterization

**Input Evidence**:

```typescript
const cufe2o4Demo = {
  XRD: [
    { position: 30.1, intensity: 45, label: '(220) spinel', hkl: '220' },
    { position: 35.5, intensity: 100, label: '(311) spinel', hkl: '311' },
    { position: 43.2, intensity: 30, label: '(400) spinel', hkl: '400' },
    { position: 57.1, intensity: 60, label: '(511) spinel', hkl: '511' },
  ],
  Raman: [
    { position: 690, intensity: 85, label: 'A₁g mode' },
  ],
  FTIR: [
    { position: 580, intensity: 70, label: 'M-O stretch' },
    { position: 3400, intensity: 40, label: 'OH/H₂O' },
    { position: 1380, intensity: 25, label: 'Carbonate' },
  ],
  XPS: [
    { position: 933.8, intensity: 60, label: 'Cu 2p₃/₂', assignment: 'Cu²⁺' },
    { position: 710.5, intensity: 75, label: 'Fe 2p₃/₂', assignment: 'Fe³⁺' },
  ],
};
```

**Expected Claim Status**:

1. **spinel_ferrite_assignment**: `supported`
   - XRD: 4 characteristic spinel reflections (primary evidence)
   - Raman: A₁g mode at 690 cm⁻¹ (primary evidence)
   - FTIR: M-O stretch (supporting evidence)

2. **oxidation_state_consistency**: `supported`
   - XPS: Cu²⁺ and Fe³⁺ binding energies (primary evidence)

3. **metal_oxygen_bonding**: `supported`
   - FTIR: M-O stretch at 580 cm⁻¹ (primary evidence)
   - Raman: A₁g mode (supporting evidence)

4. **surface_species_presence**: `supported`
   - FTIR: OH/H₂O at 3400 cm⁻¹ (primary evidence)
   - FTIR: Carbonate at 1380 cm⁻¹ (primary evidence)

**Expected Scientific Report**:

```
Conclusion: Convergent multi-technique evidence supports spinel ferrite structure 
with characteristic vibrational and diffraction signatures. Surface oxidation states 
consistent with Cu²⁺/Fe³⁺ composition. Surface species (hydroxyl, carbonate) detected.

Basis:
- XRD: (311) spinel at 35.5° 2θ
- Raman: A₁g mode at 690 cm⁻¹
- FTIR: M-O stretch at 580 cm⁻¹
- XPS: Cu 2p₃/₂ at 933.8 eV (Cu²⁺)
- XPS: Fe 2p₃/₂ at 710.5 eV (Fe³⁺)

Cross-Technique Consistency: Raman vibrational symmetry and XRD long-range order 
independently converge on cubic spinel structure. XPS surface analysis confirms 
expected oxidation states. FTIR supports metal-oxygen framework and detects surface 
species. No contradictions observed across techniques.

Limitations:
- XRD provides bulk-averaged structure; surface reconstruction not detected
- XPS is surface-sensitive (~5 nm); bulk composition may vary
- Cation distribution between tetrahedral/octahedral sites not determined
- Surface species may be ambient artifacts

Decision: Proceed with spinel ferrite structural assignment for downstream analysis. 
Recommend depth-profiling XPS for surface vs bulk validation.
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Graph Construction Completeness

*For any* valid evidence observations and claim definitions, the buildClaimGraph function SHALL produce a ClaimGraph containing all evidence nodes, all claim nodes, and all appropriate relations based on concept matching rules.

**Validates: Requirements 3.1, 3.2, 3.3, 3.9**

### Property 2: Relation Type Determination

*For any* evidence node and claim node pair, the relation type SHALL be determined by concept matching: "contradicts" when evidence concept is in claim's incompatible list, "supports" when evidence concept matches claim requirements, "contextualizes" when evidence provides context without direct support or contradiction.

**Validates: Requirements 3.4, 3.5, 3.6**

### Property 3: Contradiction Precedence

*For any* claim with a "contradicts" relation from evidence with an incompatible concept, the claim status SHALL be "contradicted" regardless of any supporting evidence present.

**Validates: Requirements 4.4, 4.6**

### Property 4: Status Determination Rules

*For any* claim after propagation, the status SHALL be determined by: "contradicted" if any contradiction exists, "supported" if all required primary evidence exists and validation is complete, "requires_validation" if primary evidence exists but validation is incomplete, "partially_supported" if some primary evidence exists, "inconclusive" if no primary evidence exists.

**Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.7**

### Property 5: Deterministic Propagation

*For any* given ClaimGraph structure, multiple propagations SHALL produce identical PropagationResults without using numeric thresholds, confidence scores, or randomization.

**Validates: Requirements 4.8**

### Property 6: Reasoning Trace Completeness

*For any* claim propagation, the generated ReasoningTrace SHALL include claim identifier, supporting evidence list, contradicting evidence list, missing validation list, qualifications list, resulting status, and reviewer rationale.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8**

### Property 7: Language Constraint Compliance

*For any* generated ReasoningTrace or scientific report, the text SHALL NOT contain forbidden scoring terms (high, medium, low, excellent, confidence, quality, score, weight, threshold) and SHALL use relation-based terminology (supports, contradicts, qualifies, requires validation, structurally consistent).

**Validates: Requirements 5.9, 6.7, 6.8**

### Property 8: Scientific Report Completeness

*For any* propagation completion, the generated report SHALL include conclusion statement, evidence basis section, cross-technique consistency section, limitations section, required validation section, and decision statement.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 9: Fusion Engine Conversion Completeness

*For any* PropagationResult and ReasoningTrace, conversion to FusionResult SHALL preserve all information by deriving conclusion, basis, crossTech, limitations, decision fields, and maintaining reasoningTrace and highlightedEvidenceIds fields for backward compatibility.

**Validates: Requirements 7.2, 7.3, 7.5, 7.7, 7.8**

### Property 10: Claim Definition Validation

*For any* claim definition, validation SHALL verify that all required fields (id, description, required_evidence_roles, incompatible_concepts) are present, evidence roles reference valid EvidenceRole enum values, and incompatible concepts exist in the evidence concept mapping.

**Validates: Requirements 12.2, 12.3, 12.4**

### Property 11: Round-Trip Preservation

*For any* valid ClaimNode object, parsing then pretty-printing then parsing SHALL produce an equivalent object with all fields preserved.

**Validates: Requirements 12.7**

## Error Handling

### Graph Construction Errors

**Missing Evidence Concept Mapping**:
- **Scenario**: Evidence ID does not have a corresponding concept in EVIDENCE_CONCEPTS mapping
- **Handling**: Use fallback concept 'unknown-concept' and log warning
- **Recovery**: Continue graph construction with fallback concept

**Unknown Technique**:
- **Scenario**: Evidence node has technique not in Technique type
- **Handling**: Throw descriptive error: `Unknown technique: ${technique}. Expected one of: XRD, Raman, XPS, FTIR`
- **Recovery**: Not recoverable - caller must provide valid technique

**Invalid Claim Definition**:
- **Scenario**: Claim definition missing required fields or has invalid structure
- **Handling**: Throw descriptive error during validation: `Invalid claim definition: missing required field ${fieldName}`
- **Recovery**: Not recoverable - claim definitions must be valid

### Propagation Errors

**Circular Dependencies**:
- **Scenario**: Not possible with current design (evidence → claim only, no claim → claim)
- **Handling**: N/A
- **Recovery**: N/A

**Missing Evidence Nodes**:
- **Scenario**: Relation references evidence_id that doesn't exist in evidence_nodes
- **Handling**: Filter out invalid relations and log warning
- **Recovery**: Continue propagation with valid relations only

**Conflicting Relations**:
- **Scenario**: Evidence has both 'supports' and 'contradicts' relations to same claim
- **Handling**: Contradiction takes precedence (claim status becomes 'contradicted')
- **Recovery**: Deterministic resolution based on precedence rules

### Parsing Errors

**Invalid JSON Structure**:
- **Scenario**: Claim definition JSON is malformed or missing required fields
- **Handling**: Throw descriptive error: `Invalid claim definition: ${errorDetails}`
- **Recovery**: Not recoverable - caller must provide valid JSON

**Invalid Enum Values**:
- **Scenario**: Evidence role or relation type not in valid enum values
- **Handling**: Throw descriptive error: `Invalid evidence role: ${role}. Expected one of: primary, supporting, context, validation`
- **Recovery**: Not recoverable - caller must provide valid enum values

**Missing Concept Mapping**:
- **Scenario**: Claim's incompatible_concepts references concept not in EVIDENCE_CONCEPTS
- **Handling**: Log warning and continue validation
- **Recovery**: Graceful degradation - concept matching will not detect this incompatibility

### Error Recovery Strategy

**Graceful Degradation**:
- If concept mapping fails → use generic fallback concept
- If relation is invalid → filter out and continue with valid relations
- If evidence node is missing → skip relation and log warning

**Validation at Module Load**:
- Validate all claim definitions when module loads
- Validate all concept mappings are complete
- Throw errors early if configuration is invalid

**Logging**:
- Log warnings for missing mappings without failing
- Log info for fallback behavior
- Log errors for unrecoverable failures

**Example Error Handling Code**:

```typescript
function createEvidenceNode(evidenceId: string, technique: Technique, value: number): EvidenceNode {
  // Check for concept mapping
  const concept = EVIDENCE_CONCEPTS[evidenceId];
  
  if (!concept) {
    console.warn(`Missing concept mapping for evidence ID: ${evidenceId}. Using fallback.`);
    return {
      id: evidenceId,
      technique,
      value,
      unit: getUnitForTechnique(technique),
      label: `Evidence at ${value}`,
      concept: 'unknown-concept', // Fallback
    };
  }
  
  return {
    id: evidenceId,
    technique,
    value,
    unit: getUnitForTechnique(technique),
    label: `Evidence at ${value}`,
    concept,
  };
}

function validateClaimDefinition(claim: ClaimNode): void {
  if (!claim.id) {
    throw new Error('Invalid claim definition: missing required field "id"');
  }
  
  if (!claim.description) {
    throw new Error(`Invalid claim definition ${claim.id}: missing required field "description"`);
  }
  
  if (!Array.isArray(claim.required_evidence_roles)) {
    throw new Error(`Invalid claim definition ${claim.id}: "required_evidence_roles" must be an array`);
  }
  
  // Validate evidence roles
  const validRoles: EvidenceRole[] = ['primary', 'supporting', 'context', 'validation'];
  for (const role of claim.required_evidence_roles) {
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid claim definition ${claim.id}: invalid evidence role "${role}"`);
    }
  }
  
  // Validate incompatible concepts (warning only)
  for (const concept of claim.incompatible_concepts) {
    const conceptExists = Object.values(EVIDENCE_CONCEPTS).includes(concept);
    if (!conceptExists) {
      console.warn(`Claim ${claim.id}: incompatible concept "${concept}" not found in EVIDENCE_CONCEPTS mapping`);
    }
  }
}

function propagateClaims(graph: ClaimGraph): PropagationResult[] {
  const results: PropagationResult[] = [];
  
  for (const claim of graph.claim_nodes) {
    try {
      const result = propagateClaim(claim, graph.relations, graph.evidence_nodes);
      results.push(result);
    } catch (error) {
      console.error(`Error propagating claim ${claim.id}:`, error);
      // Add inconclusive result as fallback
      results.push({
        claim_id: claim.id,
        status: 'inconclusive',
        supporting_evidence: [],
        contradicting_evidence: [],
        missing_validation: ['Error during propagation'],
        qualifications: [],
        rationale: `Propagation failed: ${error.message}`,
      });
    }
  }
  
  return results;
}
```

## Testing Strategy

### Dual Testing Approach

The Claim Graph Engine will use both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Specific claim definitions (spinel_ferrite_assignment, oxidation_state_consistency, etc.)
- Specific evidence node creation examples (XRD peaks, Raman modes, XPS binding energies)
- Edge cases (empty evidence, missing validation, invalid claim definitions)
- Error conditions (invalid input, missing concept mappings)
- Integration points (FusionEngine conversion, UI component rendering)

**Property-Based Tests**: Verify universal properties across all inputs
- Graph construction completeness (Property 1)
- Relation type determination (Property 2)
- Contradiction precedence (Property 3)
- Status determination rules (Property 4)
- Deterministic propagation (Property 5)
- Reasoning trace completeness (Property 6)
- Language constraint compliance (Property 7)
- Scientific report completeness (Property 8)
- Fusion engine conversion completeness (Property 9)
- Claim definition validation (Property 10)
- Round-trip preservation (Property 11)

### Property-Based Testing Configuration

**Library Selection**: Use `fast-check` for TypeScript property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `// Feature: claim-graph-engine, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import fc from 'fast-check';

// Feature: claim-graph-engine, Property 1: Graph Construction Completeness
test('Graph construction produces complete graph with all nodes and relations', () => {
  fc.assert(
    fc.property(
      fc.array(arbitraryEvidenceNode()),
      fc.array(arbitraryClaimNode()),
      (evidenceNodes, claimNodes) => {
        const graph = buildClaimGraph(evidenceNodes, claimNodes);
        
        // Verify all evidence nodes are present
        expect(graph.evidence_nodes).toHaveLength(evidenceNodes.length);
        
        // Verify all claim nodes are present
        expect(graph.claim_nodes).toHaveLength(claimNodes.length);
        
        // Verify relations are created based on concept matching
        for (const relation of graph.relations) {
          const evidence = evidenceNodes.find(e => e.id === relation.evidence_id);
          const claim = claimNodes.find(c => c.id === relation.claim_id);
          expect(evidence).toBeDefined();
          expect(claim).toBeDefined();
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: claim-graph-engine, Property 5: Deterministic Propagation
test('Propagation produces identical results for same graph structure', () => {
  fc.assert(
    fc.property(
      arbitraryClaimGraph(),
      (graph) => {
        const result1 = propagateClaims(graph);
        const result2 = propagateClaims(graph);
        
        // Verify results are identical
        expect(result1).toEqual(result2);
        
        // Verify no numeric scores or confidence values
        for (const result of result1) {
          expect(result.rationale).not.toMatch(/\d+%/);
          expect(result.rationale).not.toMatch(/confidence|score|weight|threshold/i);
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: claim-graph-engine, Property 7: Language Constraint Compliance
test('Generated text does not contain forbidden scoring terms', () => {
  fc.assert(
    fc.property(
      arbitraryClaimGraph(),
      (graph) => {
        const results = propagateClaims(graph);
        const traces = generateReasoningTrace(results, graph);
        
        const forbiddenTerms = /\b(high|medium|low|excellent|confidence|quality|score|weight|threshold)\b/i;
        
        for (const trace of traces) {
          expect(trace.reviewer_rationale).not.toMatch(forbiddenTerms);
          expect(trace.relation_summary).not.toMatch(forbiddenTerms);
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: claim-graph-engine, Property 11: Round-Trip Preservation
test('Parsing then pretty-printing then parsing preserves ClaimNode', () => {
  fc.assert(
    fc.property(
      arbitraryClaimNode(),
      (claimNode) => {
        const json = JSON.stringify(claimNode);
        const parsed1 = parseClaimDefinition(json);
        const prettyPrinted = prettyPrintClaimNode(parsed1);
        const parsed2 = parseClaimDefinition(prettyPrinted);
        
        expect(parsed2).toEqual(parsed1);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Arbitrary Generators

Property-based tests require generators for random test data:

```typescript
// Generate arbitrary EvidenceNode
function arbitraryEvidenceNode(): fc.Arbitrary<EvidenceNode> {
  return fc.record({
    id: fc.string(),
    technique: fc.constantFrom('XRD', 'Raman', 'XPS', 'FTIR'),
    value: fc.double({ min: 0, max: 1000 }),
    unit: fc.constantFrom('° 2θ', 'cm⁻¹', 'eV'),
    label: fc.string(),
    concept: fc.constantFrom(
      'cubic-spinel-lattice',
      'tetrahedral-site-vibration',
      'alternative-crystalline-phase',
      'absence-of-long-range-order',
      'structural-disorder',
      'metal-oxygen-framework',
      'oxidized-surface-state'
    ),
  });
}

// Generate arbitrary ClaimNode
function arbitraryClaimNode(): fc.Arbitrary<ClaimNode> {
  return fc.record({
    id: fc.string(),
    description: fc.string(),
    required_evidence_roles: fc.array(
      fc.constantFrom('primary', 'supporting', 'context', 'validation')
    ),
    optional_evidence_roles: fc.array(
      fc.constantFrom('primary', 'supporting', 'context', 'validation')
    ),
    incompatible_concepts: fc.array(fc.string()),
  });
}

// Generate arbitrary ClaimGraph
function arbitraryClaimGraph(): fc.Arbitrary<ClaimGraph> {
  return fc.record({
    evidence_nodes: fc.array(arbitraryEvidenceNode()),
    claim_nodes: fc.array(arbitraryClaimNode()),
    relations: fc.array(
      fc.record({
        evidence_id: fc.string(),
        claim_id: fc.string(),
        relation_type: fc.constantFrom('supports', 'contradicts', 'qualifies', 'requires', 'contextualizes'),
        role: fc.constantFrom('primary', 'supporting', 'context', 'validation'),
      })
    ),
  });
}
```

### Unit Test Examples

**Specific Claim Definition Tests**:
```typescript
test('spinel_ferrite_assignment claim has correct structure', () => {
  const claim = CLAIM_DEFINITIONS.find(c => c.id === 'spinel_ferrite_assignment');
  expect(claim).toBeDefined();
  expect(claim?.required_evidence_roles).toContain('primary');
  expect(claim?.incompatible_concepts).toContain('absence-of-long-range-order');
});
```

**Edge Case Tests**:
```typescript
test('propagation handles empty evidence gracefully', () => {
  const graph: ClaimGraph = {
    evidence_nodes: [],
    claim_nodes: CLAIM_DEFINITIONS,
    relations: [],
  };
  
  const results = propagateClaims(graph);
  
  for (const result of results) {
    expect(result.status).toBe('inconclusive');
    expect(result.supporting_evidence).toHaveLength(0);
  }
});

test('propagation handles missing validation evidence', () => {
  const graph = buildClaimGraph(
    [createEvidenceNode('xrd-spinel', 'XRD', 35.5)],
    [CLAIM_DEFINITIONS.find(c => c.id === 'catalytic_activation_readiness')!]
  );
  
  const results = propagateClaims(graph);
  const result = results[0];
  
  expect(result.status).toBe('requires_validation');
  expect(result.missing_validation.length).toBeGreaterThan(0);
});
```

**Error Condition Tests**:
```typescript
test('parser returns descriptive error for invalid claim definition', () => {
  const invalidJson = '{"id": "test", "description": "test"}'; // missing required fields
  
  expect(() => parseClaimDefinition(invalidJson)).toThrow(/required_evidence_roles/);
});

test('graph construction handles unknown concept gracefully', () => {
  const evidence: EvidenceNode = {
    id: 'unknown-1',
    technique: 'XRD',
    value: 35.5,
    unit: '° 2θ',
    label: 'Unknown peak',
    concept: 'unknown-concept-not-in-mapping',
  };
  
  const graph = buildClaimGraph([evidence], CLAIM_DEFINITIONS);
  
  // Should not throw, should handle gracefully
  expect(graph.evidence_nodes).toHaveLength(1);
});
```

### Integration Tests

**FusionEngine Integration**:
```typescript
test('FusionEngine evaluate uses ClaimGraph internally', () => {
  const input: FusionInput = {
    evidence: [
      { id: 'xrd-1', technique: 'XRD', x: 35.5, unit: '° 2θ', label: '(311)', concept: 'cubic-spinel-lattice' },
      { id: 'raman-1', technique: 'Raman', x: 690, unit: 'cm⁻¹', label: 'A₁g', concept: 'tetrahedral-site-vibration' },
    ],
  };
  
  const result = evaluate(input);
  
  expect(result.conclusion).toBeDefined();
  expect(result.basis).toHaveLength(2);
  expect(result.reasoningTrace).toBeDefined();
  expect(result.highlightedEvidenceIds).toBeDefined();
  
  // Verify no scoring language
  expect(result.conclusion).not.toMatch(/confidence|score|high|medium|low/i);
});
```

**CuFe2O4 Demo Case**:
```typescript
test('CuFe2O4 demo case produces expected claim status', () => {
  const cufe2o4Evidence = createCuFe2O4Evidence(); // From demo case
  const graph = buildClaimGraph(cufe2o4Evidence, CLAIM_DEFINITIONS);
  const results = propagateClaims(graph);
  
  const spinelClaim = results.find(r => r.claim_id === 'spinel_ferrite_assignment');
  expect(spinelClaim?.status).toBe('supported');
  
  const oxidationClaim = results.find(r => r.claim_id === 'oxidation_state_consistency');
  expect(oxidationClaim?.status).toBe('supported');
  
  const bondingClaim = results.find(r => r.claim_id === 'metal_oxygen_bonding');
  expect(bondingClaim?.status).toBe('supported');
  
  const surfaceClaim = results.find(r => r.claim_id === 'surface_species_presence');
  expect(surfaceClaim?.status).toBe('supported');
});
```

## Implementation Notes

**Development Order**:
1. Implement types.ts (core type definitions)
2. Implement claimDefinitions.ts (predefined claims and mappings)
3. Implement buildClaimGraph.ts (graph construction)
4. Implement propagateClaims.ts (propagation engine)
5. Implement generateReasoningTrace.ts (reasoning trace generation)
6. Implement index.ts (public API)
7. Refactor fusionEngine.ts to use ClaimGraph internally
8. Update UI components (MultiTechWorkspace, AgentDemo)
9. Add deterministic demo case
10. Run build validation

**Key Implementation Principles**:
- No numeric scores, weights, thresholds, or confidence values
- Use relation-based terminology throughout
- Deterministic propagation based on graph structure
- Maintain backward compatibility with FusionResult API
- Keep design mid-size and implementation-oriented

**Build Validation**:
- `npm run build` must complete without errors
- No TypeScript type errors
- No new runtime dependencies
- Backward compatibility with existing callers
- UI components render without runtime errors
