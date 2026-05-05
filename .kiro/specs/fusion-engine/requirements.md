# Requirements Document

## Introduction

The Fusion Engine is a reusable deterministic reasoning module that extracts cross-technique evidence fusion logic from the MultiTechWorkspace UI component. The engine provides a clean API for evaluating scientific claims based on multi-technique characterization data, generating structured reasoning traces, and producing research-grade documentation. The engine operates entirely client-side with no backend dependencies, no randomness, and no AI-generated confidence scores.

## Glossary

- **Fusion_Engine**: The deterministic reasoning module that evaluates scientific claims from multi-technique evidence
- **Evidence_Node**: A single piece of observational data from a characterization technique (XRD, XPS, Raman, FTIR)
- **Evidence_Link**: A relationship between two Evidence_Nodes indicating corroboration or complementarity
- **Claim**: A scientific assertion with linked Evidence_Nodes
- **Fusion_Input**: The input data structure containing selected claim, evidence, techniques, and project context
- **Fusion_Result**: The output data structure containing conclusion, reasoning trace, limitations, decision, and notebook draft
- **Reasoning_Trace**: A structured record of the reasoning process (claim, observed, linked, crossCheck, limitation, decision)
- **Claim_Evaluator**: A function that evaluates a specific type of scientific claim using technique-specific authority
- **Cross_Tech_Consistency_Analyzer**: A function that analyzes how evidence from different techniques supports or contradicts claims
- **Decision_Generator**: A function that generates action-oriented decisions based on claim evaluation
- **Notebook_Draft_Generator**: A function that generates markdown-formatted research documentation
- **MultiTechWorkspace**: The UI component that currently contains embedded reasoning logic (to be refactored)
- **Technique**: A characterization method (XRD, XPS, Raman, FTIR)
- **Research_Grade_Wording**: Scientific terminology without confidence scores, AI language, or probabilistic claims

## Requirements

### Requirement 1: Create Reusable Fusion Engine Module

**User Story:** As a developer, I want a reusable fusion engine module, so that I can consume reasoning logic from multiple UI components without duplicating code.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL be located at `src/engines/fusionEngine/`
2. THE Fusion_Engine SHALL export a primary API function `evaluate(input: FusionInput): FusionResult`
3. THE Fusion_Engine SHALL operate deterministically (same input produces same output)
4. THE Fusion_Engine SHALL not depend on backend services, LLM calls, or random number generation
5. THE Fusion_Engine SHALL use Research_Grade_Wording in all output text

### Requirement 2: Define Core Data Models

**User Story:** As a developer, I want well-defined TypeScript interfaces for engine inputs and outputs, so that I can integrate the engine with type safety.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL define an `EvidenceNode` interface with fields: id, technique, description, linkedEvidenceIds, claimId, xValue, xUnit, highlightLabel, highlightRole
2. THE Fusion_Engine SHALL define an `EvidenceLink` interface representing relationships between Evidence_Nodes
3. THE Fusion_Engine SHALL define a `Claim` interface with fields: id, title, description, linkedEvidenceIds, interpretation, evidenceBasis, limitations, recommendedValidation
4. THE Fusion_Engine SHALL define a `FusionInput` interface with fields: selectedClaim, selectedEvidence, linkedEvidence, activeTechniques, projectName
5. THE Fusion_Engine SHALL define a `FusionResult` interface with fields: scope, title, conclusion, reasoningTrace, basis, limitations, decision, recommendedValidation, notebookDraft
6. THE Fusion_Engine SHALL define a `ReasoningTrace` interface with fields: claim, observed, linked, crossCheck, limitation, decision

### Requirement 3: Implement Claim Evaluator Functions

**User Story:** As a scientist, I want claim-specific evaluation logic, so that different types of claims are evaluated using appropriate technique authority.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL implement `evaluateSpinelClaim()` that applies XRD and Raman authority for structural claims
2. THE Fusion_Engine SHALL implement `evaluateOxidationStateClaim()` that applies XPS authority for oxidation state claims
3. THE Fusion_Engine SHALL implement `evaluateBondingClaim()` that applies FTIR and Raman authority for bonding claims
4. THE Fusion_Engine SHALL implement `evaluateSurfaceSpeciesClaim()` that applies FTIR and XPS authority for surface species claims
5. WHEN a Claim is evaluated, THE Claim_Evaluator SHALL return conclusion, basis, limitations, and decision fields
6. THE Claim_Evaluator SHALL use technique-specific authority rules (XRD for long-range order, XPS for surface oxidation, FTIR for vibrational modes, Raman for local symmetry)

### Requirement 4: Implement Reasoning Trace Generator

**User Story:** As a scientist, I want structured reasoning traces, so that I can understand how the engine arrived at its conclusion.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL implement `generateReasoningTrace()` that produces a Reasoning_Trace structure
2. WHEN a Claim is selected, THE Reasoning_Trace SHALL include the claim title, observed evidence, linked evidence, cross-checks, limitations, and decision
3. WHEN an Evidence_Node is selected, THE Reasoning_Trace SHALL include the evidence description, linked evidence from other techniques, and cross-technique corroboration status
4. WHEN no specific Claim or Evidence_Node is selected, THE Reasoning_Trace SHALL generate project-level reasoning using all active Techniques
5. THE Reasoning_Trace SHALL separate primary evidence (highlightRole = 'primary') from supporting evidence (highlightRole = 'supporting')

### Requirement 5: Implement Cross-Tech Consistency Analyzer

**User Story:** As a scientist, I want cross-technique consistency analysis, so that I can assess convergent evidence and identify contradictions.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL implement `generateCrossTechConsistency()` that analyzes evidence from multiple Techniques
2. WHEN multiple Techniques support the same Claim, THE Cross_Tech_Consistency_Analyzer SHALL generate a convergence statement
3. WHEN a single Technique supports a Claim, THE Cross_Tech_Consistency_Analyzer SHALL flag the need for cross-validation
4. WHEN Techniques provide contradictory evidence, THE Cross_Tech_Consistency_Analyzer SHALL identify the contradiction
5. THE Cross_Tech_Consistency_Analyzer SHALL use Research_Grade_Wording (e.g., "convergent evidence", "complementary techniques", "consistent with")
6. THE Cross_Tech_Consistency_Analyzer SHALL not use confidence scores, percentages, or AI language

### Requirement 6: Implement Decision Generator

**User Story:** As a scientist, I want action-oriented decisions, so that I know how to proceed based on the evidence evaluation.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL implement `generateDecision()` that produces action-oriented decision text
2. WHEN a Claim is well-supported by convergent evidence, THE Decision_Generator SHALL recommend proceeding with the assignment
3. WHEN a Claim has single-technique support, THE Decision_Generator SHALL recommend validation experiments
4. WHEN a Claim has potential artifacts or limitations, THE Decision_Generator SHALL flag the issue and recommend further investigation
5. THE Decision_Generator SHALL be deterministic and claim-specific
6. THE Decision_Generator SHALL use Research_Grade_Wording without confidence scores or probabilistic language

### Requirement 7: Implement Notebook Draft Generator

**User Story:** As a scientist, I want markdown-formatted research documentation, so that I can export reasoning results to notebooks and reports.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL implement `generateNotebookDraft()` that produces markdown-formatted documentation
2. WHEN scope is 'claim', THE Notebook_Draft_Generator SHALL include sections: Summary, Evidence Basis, Cross-Technique Consistency, Limitations, Recommended Validation, Decision
3. WHEN scope is 'evidence', THE Notebook_Draft_Generator SHALL include sections: Summary, Evidence Basis, Cross-Technique Consistency, Limitations, Decision
4. WHEN scope is 'project', THE Notebook_Draft_Generator SHALL include sections: Summary, Evidence by Technique, Cross-Technique Consistency, Limitations, Recommended Validation, Decision
5. THE Notebook_Draft_Generator SHALL format evidence items as markdown bullet lists with technique labels
6. THE Notebook_Draft_Generator SHALL use Research_Grade_Wording throughout the document

### Requirement 8: Create Main Engine API

**User Story:** As a developer, I want a single entry point for the fusion engine, so that I can easily integrate it into UI components.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL export a primary function `evaluate(input: FusionInput): FusionResult`
2. WHEN Fusion_Input contains a selectedClaim, THE Fusion_Engine SHALL generate claim-level reasoning
3. WHEN Fusion_Input contains a selectedEvidence without a selectedClaim, THE Fusion_Engine SHALL generate evidence-level reasoning
4. WHEN Fusion_Input contains neither selectedClaim nor selectedEvidence, THE Fusion_Engine SHALL generate project-level reasoning
5. THE Fusion_Engine SHALL return a Fusion_Result with all required fields populated
6. THE Fusion_Engine SHALL handle missing or incomplete input gracefully with default values

### Requirement 9: Refactor MultiTechWorkspace to Consume Engine

**User Story:** As a developer, I want MultiTechWorkspace to use the fusion engine, so that reasoning logic is not duplicated between UI and engine.

#### Acceptance Criteria

1. THE MultiTechWorkspace SHALL import `fusionEngine.evaluate()` from the Fusion_Engine module
2. THE MultiTechWorkspace SHALL remove embedded functions: `runCrossTechReview()`, `runFusionReasoning()`, `generateReasoningTrace()`, `generateNotebookDraft()`, `generateCrossTechConsistency()`, `generateDecision()`, `parseLimitations()`, `parseValidation()`
3. WHEN MultiTechWorkspace needs reasoning output, THE MultiTechWorkspace SHALL call `fusionEngine.evaluate()` with appropriate Fusion_Input
4. THE MultiTechWorkspace SHALL map Fusion_Result fields to UI rendering components
5. THE MultiTechWorkspace SHALL not contain duplicated reasoning logic after refactoring

### Requirement 10: Maintain Scientific Rigor

**User Story:** As a scientist, I want research-grade output, so that I can trust the engine's reasoning for scientific publications and reports.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL not generate confidence scores, percentages, or probabilistic claims
2. THE Fusion_Engine SHALL not use AI wording such as "high match", "AI insight", "probability", "likely", "suggests"
3. THE Fusion_Engine SHALL use Research_Grade_Wording such as "convergent evidence", "complementary techniques", "consistent with", "corroborating evidence"
4. THE Fusion_Engine SHALL produce deterministic output (same input always produces same output)
5. THE Fusion_Engine SHALL not call external APIs, LLMs, or backend services

### Requirement 11: Build Validation

**User Story:** As a developer, I want the fusion engine to integrate cleanly with the existing codebase, so that the build succeeds without errors.

#### Acceptance Criteria

1. WHEN the Fusion_Engine is implemented, THE project SHALL compile without TypeScript errors
2. WHEN `npm run build` is executed, THE build SHALL succeed
3. THE Fusion_Engine SHALL not introduce new npm dependencies
4. THE Fusion_Engine SHALL follow existing DIFARYX code patterns and conventions
5. THE Fusion_Engine SHALL be located in `src/engines/fusionEngine/` directory structure
