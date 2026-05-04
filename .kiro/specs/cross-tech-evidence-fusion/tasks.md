# Implementation Plan: Cross-Tech Evidence Fusion Workspace

## Overview

Implement a fusion workspace that combines evidence from XPS, FTIR, and Raman techniques using technique-specific authority hierarchies, compatibility scoring, and contradiction detection to generate structured scientific decisions with claim-level confidence assessments.

## Tasks

- [x] 1. Create fusion agent type definitions
  - Create `src/agents/fusionAgent/types.ts`
  - Define `Claim`, `TechniqueSupport`, `EvidenceItem` interfaces
  - Define `EvidenceMatrix`, `MatrixCell` interfaces
  - Define `Contradiction` interface
  - Define `FusionResult` interface with decision, claims, matrix, contradictions, caveats, and report
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

- [x] 2. Implement fusion agent runner
  - [x] 2.1 Create runner file and evidence extraction functions
    - Create `src/agents/fusionAgent/runner.ts`
    - Implement `extractXpsEvidence()` to extract oxidation states and satellite features
    - Implement `extractFtirEvidence()` to extract functional groups
    - Implement `extractRamanEvidence()` to extract vibrational modes
    - _Requirements: 20.1, 20.2, 1.1, 1.2, 1.3, 1.7_

  - [x] 2.2 Implement claim evaluators
    - Implement `evaluateSpinelStructureClaim()` with Raman authority for structure
    - Implement `evaluateOxidationStateClaim()` with XPS authority for oxidation states
    - Implement `evaluateSurfaceSpeciesClaim()` with FTIR authority for surface species
    - Implement `evaluateCarbonaceousResidueClaim()` for Raman D/G bands
    - Implement `evaluateCarbonateSurfaceClaim()` for FTIR carbonate/carboxylate
    - Apply technique authority hierarchy rules per requirements
    - _Requirements: 20.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.3 Implement compatibility scoring and contradiction detection
    - Implement `buildEvidenceMatrix()` to populate claims × techniques matrix
    - Implement `detectContradictions()` applying contradiction rules
    - Score evidence compatibility for spinel structure, ferrite chemistry, and metal oxide framework
    - Detect Raman spinel vs XPS oxidation state mismatches
    - Detect FTIR carbonate/carboxylate surface complexity
    - Detect Raman D/G band carbon contributions
    - _Requirements: 20.4, 20.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 2.4 Implement decision generation and confidence calculation
    - Implement `generateFinalDecision()` to synthesize primary conclusion from claims
    - Implement structured confidence calculation (not averaging)
    - Apply HIGH confidence when Raman + XPS agree with no major contradictions
    - Apply MEDIUM confidence when Raman supports with partial XPS or surface ambiguity
    - Apply LOW confidence when single technique or major contradictions exist
    - Generate caveats and recommended validation steps
    - _Requirements: 20.6, 20.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 2.5 Implement main fusion runner function
    - Implement `runFusionAnalysis()` orchestrating all steps
    - Call evidence extraction for all three techniques
    - Call all five claim evaluators
    - Build evidence matrix
    - Detect contradictions
    - Generate final decision
    - Categorize supported vs unresolved claims
    - Generate report narrative
    - Return complete `FusionResult`
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

- [ ] 3. Checkpoint - Verify fusion agent logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement FusionWorkspace UI component
  - [x] 4.1 Create FusionWorkspace component with layout
    - Create `src/pages/FusionWorkspace.tsx`
    - Use `DashboardLayout` pattern from existing workspaces
    - Implement three-panel layout (left, center, right)
    - Add state management for `activeTab` and `fusionResult`
    - Implement `handleRunFusion()` to call `runFusionAnalysis()`
    - _Requirements: 8.1, 18.1, 18.2_

  - [x] 4.2 Implement left panel
    - Display project name and sample name
    - Display included techniques list (XPS, FTIR, Raman)
    - Display fusion rules card explaining authority hierarchy
    - Add "Run Fusion" button triggering `handleRunFusion()`
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 4.3 Implement right panel
    - Display Final Scientific Summary from `fusionResult.decision.primaryConclusion`
    - Display Confidence and Reliability section with confidence badge
    - Display Top Supporting Evidence section (top 3 evidence items)
    - Display Recommended Validation section from `fusionResult.recommendedValidation`
    - _Requirements: 8.7, 8.8, 8.9, 8.10_

  - [x] 4.4 Implement center panel tab bar
    - Create tab bar with 5 tabs: Fusion Decision, Evidence Matrix, Claim Cards, Contradictions, Report
    - Implement tab switching with `activeTab` state
    - Display exactly one tab content at a time
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 4.5 Implement Fusion Decision tab
    - Display final conclusion card with `fusionResult.decision.primaryConclusion`
    - Display confidence badge from `fusionResult.decision.confidence`
    - Display supported claims list from `fusionResult.supportedClaims`
    - Display unresolved claims list from `fusionResult.unresolvedClaims`
    - Display caveats list from `fusionResult.caveats`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 4.6 Implement Evidence Matrix tab
    - Render table with claims as rows and techniques (XPS, FTIR, Raman) as columns
    - Display support status (Supports, Contradicts, Neutral, Ambiguous) in each cell
    - Display short evidence text in each cell
    - Include at least five claim rows
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 4.7 Implement Claim Cards tab
    - Map over `fusionResult.claims` to display five claim cards
    - For each card, show supporting techniques
    - For each card, show evidence items
    - For each card, show confidence level badge
    - For each card, show caveats list
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [x] 4.8 Implement Contradictions tab
    - Map over `fusionResult.contradictions` to display contradiction cards
    - For each contradiction, show severity level badge
    - For each contradiction, show involved techniques
    - For each contradiction, show explanation
    - For each contradiction, show effect on confidence
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 4.9 Implement Report tab
    - Display final decision summary from `fusionResult.report`
    - Display evidence organized by technique
    - Display claim-level reasoning
    - Display caveats
    - Display recommended validation steps
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 5. Add fusion workspace route
  - Open `src/App.tsx`
  - Import `FusionWorkspace` component
  - Add route `/workspace/fusion` rendering `FusionWorkspace` with `ProtectedRoute` wrapper
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 6. Checkpoint - Test UI rendering
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Validate build success
  - Run `npm run build` to verify no build errors
  - Verify output bundle files are generated
  - Verify all fusion workspace components are included in build
  - Verify all fusion agent modules are included in build
  - _Requirements: 21.1, 21.2, 21.3, 21.4_

## Notes

- Tasks follow the existing DIFARYX workspace patterns (XPSWorkspace, FTIRWorkspace, RamanWorkspace)
- Fusion logic is deterministic and uses demo data from existing technique agents
- Authority hierarchy ensures XPS decides oxidation states, Raman decides structure, FTIR decides surface species
- Confidence is calculated from evidence agreement, not averaging
- Scientific conclusion rules enforce rigorous standards (no "confirmed" without multi-technique agreement)
- All UI components follow the DashboardLayout pattern with three-panel structure
- Checkpoints ensure incremental validation before proceeding
