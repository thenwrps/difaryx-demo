# Requirements Document: Claim Graph + Evidence Propagation Engine

## Introduction

This document specifies requirements for implementing a production-grade Claim Graph + Evidence Propagation Engine for DIFARYX. The engine replaces remaining label/ranking-based reasoning with graph-based scientific reasoning using explicit relation types and structural propagation rules. The system operates deterministically without LLM calls, numeric confidence scores, weights, thresholds, or quality adjectives.

## Glossary

- **Claim_Graph_Engine**: The complete reasoning system that builds claim graphs, propagates evidence relations, and generates scientific conclusions
- **Claim_Node**: A scientific assertion about material properties (e.g., spinel_ferrite_assignment, oxidation_state_consistency)
- **Evidence_Node**: An observation from a characterization technique (e.g., XRD peak, Raman mode, XPS binding energy)
- **Evidence_Relation**: A typed connection between evidence and claims (supports, contradicts, qualifies, requires, contextualizes)
- **Claim_Graph**: A directed graph structure connecting evidence nodes to claim nodes via typed relations
- **Propagation_Result**: The output of structural reasoning showing claim status, supporting evidence, contradictions, and missing validation
- **Reasoning_Trace**: A deterministic record of how evidence relations determine claim status
- **Claim_Status**: The state of a claim after propagation (supported, partially_supported, contradicted, inconclusive, requires_validation)
- **Evidence_Role**: The function of evidence in supporting a claim (primary, supporting, context, validation)
- **Validation_State**: The completeness of validation evidence (complete, incomplete, blocked, requires_followup)
- **Technique_Authority**: The relative authority of characterization techniques for specific claim types (primary, supporting, validation, context)
- **Fusion_Engine**: The existing reasoning module that will be refactored to use Claim_Graph_Engine internally
- **Structural_Reasoning**: Deterministic propagation of claim status based on graph topology and relation types without numeric scoring

## Requirements

### Requirement 1: Core Type System

**User Story:** As a developer, I want a complete type system for the claim graph engine, so that all graph components have well-defined structures.

#### Acceptance Criteria

1. THE Claim_Graph_Engine SHALL define ClaimNode with fields: id, description, required_evidence_roles, optional_evidence_roles, incompatible_concepts
2. THE Claim_Graph_Engine SHALL define EvidenceNode with fields: id, technique, value, unit, label, concept, role
3. THE Claim_Graph_Engine SHALL define EvidenceRelation with fields: evidence_id, claim_id, relation_type, role
4. THE Claim_Graph_Engine SHALL define ClaimGraph with fields: evidence_nodes, claim_nodes, relations
5. THE Claim_Graph_Engine SHALL define PropagationResult with fields: claim_id, status, supporting_evidence, contradicting_evidence, missing_validation, qualifications, rationale
6. THE Claim_Graph_Engine SHALL define ReasoningTrace with fields: claim, observed_evidence, relation_summary, resulting_status, reviewer_rationale
7. THE Claim_Graph_Engine SHALL define ClaimStatus enum with values: supported, partially_supported, contradicted, inconclusive, requires_validation
8. THE Claim_Graph_Engine SHALL define EvidenceRelationType enum with values: supports, contradicts, qualifies, requires, contextualizes
9. THE Claim_Graph_Engine SHALL define EvidenceRole enum with values: primary, supporting, context, validation
10. THE Claim_Graph_Engine SHALL define ValidationState enum with values: complete, incomplete, blocked, requires_followup

### Requirement 2: Claim Definition System

**User Story:** As a materials scientist, I want predefined scientific claims for common characterization scenarios, so that the engine can reason about standard material properties.

#### Acceptance Criteria

1. THE Claim_Graph_Engine SHALL define spinel_ferrite_assignment claim with required primary evidence from XRD and Raman
2. THE Claim_Graph_Engine SHALL define oxidation_state_consistency claim with required primary evidence from XPS
3. THE Claim_Graph_Engine SHALL define metal_oxygen_bonding claim with required primary evidence from FTIR and supporting evidence from Raman
4. THE Claim_Graph_Engine SHALL define surface_species_presence claim with required primary evidence from FTIR or XPS
5. THE Claim_Graph_Engine SHALL define catalytic_activation_readiness claim with required validation evidence from multiple techniques
6. WHEN a claim definition is created, THE Claim_Graph_Engine SHALL specify which evidence concepts are incompatible with the claim
7. WHEN a claim definition is created, THE Claim_Graph_Engine SHALL specify which evidence roles are required for the claim to be supported
8. THE Claim_Graph_Engine SHALL define technique authority mappings where XRD is primary for phase/structure, Raman is primary or supporting for lattice vibration depending on claim, XPS is primary for oxidation state and surface chemistry, FTIR is supporting for bonding, and TEM/BET/TPD are validation/context

### Requirement 3: Graph Construction

**User Story:** As a developer, I want to build a claim graph from evidence observations and claim definitions, so that the engine can perform structural reasoning.

#### Acceptance Criteria

1. WHEN evidence observations are provided, THE Claim_Graph_Engine SHALL create EvidenceNode instances with technique, value, unit, label, and concept fields populated
2. WHEN claim definitions are provided, THE Claim_Graph_Engine SHALL create ClaimNode instances with all required fields populated
3. WHEN evidence nodes and claim nodes exist, THE Claim_Graph_Engine SHALL create EvidenceRelation instances connecting evidence to claims based on concept matching
4. WHEN an evidence concept matches a claim's required concepts, THE Claim_Graph_Engine SHALL create a "supports" relation with appropriate role (primary, supporting, or validation)
5. WHEN an evidence concept matches a claim's incompatible concepts, THE Claim_Graph_Engine SHALL create a "contradicts" relation
6. WHEN an evidence concept provides additional context without directly supporting or contradicting, THE Claim_Graph_Engine SHALL create a "contextualizes" relation
7. WHEN an evidence observation adds nuance to a claim, THE Claim_Graph_Engine SHALL create a "qualifies" relation
8. WHEN a claim requires specific validation evidence that is missing, THE Claim_Graph_Engine SHALL create a "requires" relation placeholder
9. THE Claim_Graph_Engine SHALL return a complete ClaimGraph structure with all nodes and relations

### Requirement 4: Evidence Propagation Engine

**User Story:** As a materials scientist, I want the engine to propagate claim status based on structural reasoning, so that conclusions are derived from explicit relation types rather than numeric scores.

#### Acceptance Criteria

1. WHEN all required primary evidence exists and no blocking contradiction exists, THE Claim_Graph_Engine SHALL set claim status to "supported"
2. WHEN only supporting or context evidence exists, THE Claim_Graph_Engine SHALL set claim status to "partially_supported"
3. WHEN validation evidence is missing for a claim that requires validation, THE Claim_Graph_Engine SHALL set claim status to "partially_supported" or "requires_validation"
4. WHEN contradiction evidence directly conflicts with a required claim condition, THE Claim_Graph_Engine SHALL set claim status to "contradicted"
5. WHEN evidence is insufficient or only contextual, THE Claim_Graph_Engine SHALL set claim status to "inconclusive"
6. WHEN a claim has a "contradicts" relation from evidence with an incompatible concept, THE Claim_Graph_Engine SHALL mark the claim as "contradicted" regardless of supporting evidence
7. WHEN a claim has all required primary evidence roles satisfied, THE Claim_Graph_Engine SHALL check for validation requirements before marking as "supported"
8. THE Claim_Graph_Engine SHALL propagate claim status deterministically based on graph structure without using numeric thresholds or confidence scores
9. THE Claim_Graph_Engine SHALL produce PropagationResult for each claim containing status, supporting evidence list, contradicting evidence list, missing validation list, and qualifications

### Requirement 5: Reasoning Trace Generation

**User Story:** As a materials scientist, I want deterministic reasoning traces that explain how evidence determines claim status, so that I can understand and validate the engine's conclusions.

#### Acceptance Criteria

1. WHEN propagation completes, THE Claim_Graph_Engine SHALL generate a ReasoningTrace for each claim
2. THE Reasoning_Trace SHALL include the claim identifier
3. THE Reasoning_Trace SHALL include a list of supporting evidence with technique and description
4. THE Reasoning_Trace SHALL include a list of contradicting evidence with technique and description
5. THE Reasoning_Trace SHALL include a list of missing validation requirements
6. THE Reasoning_Trace SHALL include a list of qualifications that add nuance to the claim
7. THE Reasoning_Trace SHALL include the resulting claim status
8. THE Reasoning_Trace SHALL include a reviewer-style rationale explaining why the claim has its current status based on relation types
9. THE Reasoning_Trace SHALL use relation-based language (supports, contradicts, qualifies, requires validation, incomplete validation, structurally consistent) and SHALL NOT use scoring language (high, medium, low, excellent, confidence, quality)

### Requirement 6: Scientific Report Generation

**User Story:** As a materials scientist, I want report-ready scientific output that summarizes conclusions, evidence basis, cross-technique consistency, limitations, and required validation, so that I can communicate findings effectively.

#### Acceptance Criteria

1. WHEN propagation completes, THE Claim_Graph_Engine SHALL generate a conclusion statement summarizing the dominant claim or ambiguity
2. THE Claim_Graph_Engine SHALL generate an evidence basis section listing all supporting evidence by technique
3. THE Claim_Graph_Engine SHALL generate a cross-technique consistency section describing how evidence from multiple techniques converges or conflicts
4. THE Claim_Graph_Engine SHALL generate a limitations section listing technique-specific limitations, missing validation, and unresolved contradictions
5. THE Claim_Graph_Engine SHALL generate a required validation section listing specific experiments needed to resolve ambiguities or confirm claims
6. THE Claim_Graph_Engine SHALL generate a decision statement recommending next steps based on claim status
7. THE Claim_Graph_Engine SHALL NOT use numeric confidence scores, quality adjectives, or ranking labels in any report section
8. THE Claim_Graph_Engine SHALL use relation-based terminology throughout the report (supports, contradicts, requires validation, structurally consistent, surface-state unresolved)

### Requirement 7: Fusion Engine Integration

**User Story:** As a developer, I want to refactor the existing fusion engine to use the claim graph engine internally, so that the system uses graph-based reasoning while maintaining API compatibility.

#### Acceptance Criteria

1. WHEN the Fusion_Engine evaluate function is called, THE Fusion_Engine SHALL invoke Claim_Graph_Engine internally
2. THE Fusion_Engine SHALL convert input evidence to the format expected by Claim_Graph_Engine
3. THE Fusion_Engine SHALL convert PropagationResult back to the existing FusionResult shape where possible
4. THE Fusion_Engine SHALL maintain the existing public API signature: evaluate(input: FusionInput): FusionResult
5. THE Fusion_Engine SHALL derive FusionResult fields (conclusion, basis, crossTech, limitations, decision) from PropagationResult and ReasoningTrace
6. THE Fusion_Engine SHALL map claim status to appropriate conclusion language without using confidence scores
7. THE Fusion_Engine SHALL preserve the reasoningTrace field in FusionResult for backward compatibility
8. THE Fusion_Engine SHALL preserve the highlightedEvidenceIds field in FusionResult for UI highlighting

### Requirement 8: UI Integration

**User Story:** As a developer, I want to update UI components to consume the new reasoning trace format, so that the interface displays relation-based reasoning instead of scoring language.

#### Acceptance Criteria

1. WHEN MultiTechWorkspace displays reasoning output, THE MultiTechWorkspace SHALL render relation-based language from ReasoningTrace
2. WHEN AgentDemo displays reasoning output, THE AgentDemo SHALL render relation-based language from ReasoningTrace
3. THE MultiTechWorkspace SHALL replace any remaining "high", "medium", "low", "excellent", "confidence", "score", "quality" language with relation-based wording
4. THE AgentDemo SHALL replace any remaining "high", "medium", "low", "excellent", "confidence", "score", "quality" language with relation-based wording
5. THE MultiTechWorkspace SHALL display claim status using the ClaimStatus enum values (supported, partially_supported, contradicted, inconclusive, requires_validation)
6. THE AgentDemo SHALL display claim status using the ClaimStatus enum values (supported, partially_supported, contradicted, inconclusive, requires_validation)
7. THE UI components SHALL display evidence relations using EvidenceRelationType values (supports, contradicts, qualifies, requires, contextualizes)
8. THE UI components SHALL display evidence roles using EvidenceRole values (primary, supporting, context, validation)

### Requirement 9: Module Structure

**User Story:** As a developer, I want a well-organized module structure for the claim graph engine, so that the codebase is maintainable and testable.

#### Acceptance Criteria

1. THE Claim_Graph_Engine SHALL be implemented in src/engines/claimGraph/ directory
2. THE Claim_Graph_Engine SHALL define all types in src/engines/claimGraph/types.ts
3. THE Claim_Graph_Engine SHALL define all claim definitions in src/engines/claimGraph/claimDefinitions.ts
4. THE Claim_Graph_Engine SHALL implement graph construction in src/engines/claimGraph/buildClaimGraph.ts
5. THE Claim_Graph_Engine SHALL implement propagation logic in src/engines/claimGraph/propagateClaims.ts
6. THE Claim_Graph_Engine SHALL implement reasoning trace generation in src/engines/claimGraph/generateReasoningTrace.ts
7. THE Claim_Graph_Engine SHALL export a public API from src/engines/claimGraph/index.ts
8. THE Claim_Graph_Engine SHALL NOT introduce new runtime dependencies beyond existing project dependencies

### Requirement 10: Deterministic Demo Example

**User Story:** As a developer, I want at least one deterministic demo example using real DIFARYX data, so that I can verify the engine works correctly with CuFe2O4 characterization data.

#### Acceptance Criteria

1. THE Claim_Graph_Engine SHALL include a demo example using CuFe2O4 or CuFe2O4-SBA-15 evidence
2. THE demo example SHALL use real XRD peak positions from the DIFARYX dataset
3. THE demo example SHALL use real Raman mode positions from the DIFARYX dataset
4. THE demo example SHALL use real XPS binding energies from the DIFARYX dataset if available
5. THE demo example SHALL use real FTIR band positions from the DIFARYX dataset if available
6. THE demo example SHALL demonstrate graph construction, propagation, and reasoning trace generation
7. THE demo example SHALL produce deterministic output that can be verified against expected claim status
8. THE demo example SHALL demonstrate at least one "supported" claim, one "partially_supported" claim, and one "contradicted" or "inconclusive" claim

### Requirement 11: Build Validation

**User Story:** As a developer, I want the implementation to pass build validation, so that the engine integrates cleanly with the existing DIFARYX codebase.

#### Acceptance Criteria

1. WHEN npm run build is executed, THE build process SHALL complete without errors
2. WHEN npm run build is executed, THE build process SHALL complete without TypeScript type errors
3. THE Claim_Graph_Engine SHALL NOT introduce new runtime dependencies
4. THE Claim_Graph_Engine SHALL use only existing project dependencies (React, TypeScript, Vite)
5. THE Claim_Graph_Engine module SHALL NOT contain any "confidence", "score", "weight", "threshold", "high", "medium", "low", "excellent", "quality" terminology in code or comments
6. THE refactored Fusion_Engine SHALL maintain backward compatibility with existing callers
7. THE refactored UI components SHALL render without runtime errors

### Requirement 12: Parser and Pretty Printer for Claim Definitions

**User Story:** As a developer, I want to parse claim definitions from a structured format and pretty-print them back, so that claim definitions can be maintained and validated programmatically.

#### Acceptance Criteria

1. THE Claim_Graph_Engine SHALL parse claim definitions from a structured JSON or TypeScript object format
2. THE Claim_Graph_Engine SHALL validate that all required fields are present in claim definitions (id, description, required_evidence_roles, incompatible_concepts)
3. THE Claim_Graph_Engine SHALL validate that evidence role specifications reference valid EvidenceRole enum values
4. THE Claim_Graph_Engine SHALL validate that incompatible concepts are defined in the evidence concept mapping
5. THE Pretty_Printer SHALL format ClaimNode objects into human-readable structured text
6. THE Pretty_Printer SHALL format PropagationResult objects into human-readable reasoning summaries
7. FOR ALL valid ClaimNode objects, parsing then pretty-printing then parsing SHALL produce an equivalent object (round-trip property)
8. WHEN an invalid claim definition is provided, THE Parser SHALL return a descriptive error indicating which field is invalid or missing

