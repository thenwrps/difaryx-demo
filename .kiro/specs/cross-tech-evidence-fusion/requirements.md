# Requirements Document

## Introduction

The Cross-Tech Evidence Fusion Workspace enables scientific decision-making by combining evidence from multiple analytical techniques (Raman spectroscopy, FTIR spectroscopy, and XPS) for the same material sample. The system applies technique-specific authority hierarchies, detects contradictions, scores evidence compatibility, and produces structured scientific conclusions with claim-level confidence assessments.

This feature addresses the challenge of integrating complementary analytical data where each technique has domain-specific authority (e.g., XPS for oxidation states, Raman for vibrational structure, FTIR for functional groups) and where naive averaging or single-technique conclusions would produce scientifically invalid results.

## Glossary

- **Fusion_Engine**: The core reasoning system that combines evidence from multiple analytical techniques
- **XPS_Agent**: X-ray Photoelectron Spectroscopy processing engine (existing, read-only)
- **FTIR_Agent**: Fourier Transform Infrared Spectroscopy processing engine (existing, read-only)
- **Raman_Agent**: Raman spectroscopy processing engine (existing, read-only)
- **Authority_Hierarchy**: The technique-specific domain where each analytical method has decision priority
- **Evidence_Item**: A single piece of analytical data from a technique (e.g., peak position, oxidation state)
- **Claim**: A scientific assertion about the material (e.g., "spinel-like structure present")
- **Contradiction**: A conflict between evidence items from different techniques
- **Compatibility_Score**: A measure of how well evidence items from different techniques support each other
- **Decision_Schema**: The structured output containing conclusions, confidence, and supporting evidence
- **Claim_Card**: A UI component displaying a single claim with supporting evidence and confidence
- **Evidence_Matrix**: A tabular view showing which techniques support which claims
- **Dashboard_Layout**: The existing UI layout pattern used across DIFARYX workspaces

## Requirements

### Requirement 1: Import Processed Analytical Data

**User Story:** As a materials scientist, I want to import processed outputs from existing technique workspaces, so that I can fuse evidence without reprocessing raw data.

#### Acceptance Criteria

1. WHEN the Fusion_Workspace is initialized, THE Fusion_Engine SHALL import processed outputs from XPS_Agent
2. WHEN the Fusion_Workspace is initialized, THE Fusion_Engine SHALL import processed outputs from FTIR_Agent
3. WHEN the Fusion_Workspace is initialized, THE Fusion_Engine SHALL import processed outputs from Raman_Agent
4. THE Fusion_Engine SHALL NOT modify the processing logic of XPS_Agent
5. THE Fusion_Engine SHALL NOT modify the processing logic of FTIR_Agent
6. THE Fusion_Engine SHALL NOT modify the processing logic of Raman_Agent
7. FOR ALL imported data structures, THE Fusion_Engine SHALL preserve the original evidence items without transformation

### Requirement 2: Apply Technique Authority Hierarchy

**User Story:** As a materials scientist, I want each analytical technique to have decision authority in its domain, so that conclusions respect the strengths of each method.

#### Acceptance Criteria

1. WHEN making oxidation-state decisions, THE Fusion_Engine SHALL prioritize XPS_Agent evidence over other techniques
2. WHEN making spinel vibrational structure decisions, THE Fusion_Engine SHALL prioritize Raman_Agent evidence over other techniques
3. WHEN making functional group decisions, THE Fusion_Engine SHALL prioritize FTIR_Agent evidence over other techniques
4. WHEN making adsorbate decisions, THE Fusion_Engine SHALL prioritize FTIR_Agent evidence over other techniques
5. THE Fusion_Engine SHALL NOT allow Raman_Agent evidence to override XPS_Agent oxidation-state conclusions
6. THE Fusion_Engine SHALL NOT allow FTIR_Agent evidence to override Raman_Agent vibrational structure conclusions
7. THE Fusion_Engine SHALL NOT allow XPS_Agent evidence to override FTIR_Agent functional group conclusions

### Requirement 3: Score Evidence Compatibility

**User Story:** As a materials scientist, I want the system to score how well evidence from different techniques supports each other, so that I can assess the strength of multi-technique conclusions.

#### Acceptance Criteria

1. WHEN Raman_Agent detects A1g mode AND Raman_Agent detects Eg or T2g modes, THE Fusion_Engine SHALL assign positive compatibility to spinel-like structure claims
2. WHEN XPS_Agent detects Cu²⁺ oxidation state AND XPS_Agent detects Fe³⁺ oxidation state, THE Fusion_Engine SHALL assign positive compatibility to ferrite chemistry claims
3. WHEN FTIR_Agent detects M-O band between 400 and 700 wavenumbers, THE Fusion_Engine SHALL assign positive compatibility to metal oxide framework claims
4. WHEN FTIR_Agent detects OH band OR FTIR_Agent detects water band OR FTIR_Agent detects carbonate band, THE Fusion_Engine SHALL classify these as surface species evidence
5. THE Fusion_Engine SHALL NOT assign positive compatibility to spinel phase claims based solely on FTIR surface species evidence
6. WHEN Raman_Agent detects D band OR Raman_Agent detects G band, THE Fusion_Engine SHALL classify these as carbonaceous residue evidence
7. THE Fusion_Engine SHALL NOT assign positive compatibility to spinel structure claims based on Raman D or G band evidence

### Requirement 4: Detect Evidence Contradictions

**User Story:** As a materials scientist, I want the system to detect contradictions between techniques, so that I can identify areas requiring further investigation.

#### Acceptance Criteria

1. WHEN Raman_Agent suggests spinel structure AND XPS_Agent lacks expected oxidation states, THE Fusion_Engine SHALL flag a contradiction
2. WHEN XPS_Agent shows unexpected oxidation states AND Raman_Agent suggests ideal spinel structure, THE Fusion_Engine SHALL flag a contradiction
3. WHEN FTIR_Agent shows strong carbonate band OR FTIR_Agent shows strong carboxylate band, THE Fusion_Engine SHALL flag potential surface interpretation complexity
4. WHEN Raman_Agent shows D band OR Raman_Agent shows G band, THE Fusion_Engine SHALL flag carbon or support contribution
5. FOR ALL detected contradictions, THE Fusion_Engine SHALL include the involved techniques in the contradiction record
6. FOR ALL detected contradictions, THE Fusion_Engine SHALL include an explanation in the contradiction record
7. FOR ALL detected contradictions, THE Fusion_Engine SHALL assign a severity level of none, low, medium, or high

### Requirement 5: Generate Structured Decision Schema

**User Story:** As a materials scientist, I want a structured decision output, so that I can review conclusions, supporting evidence, and caveats in a standardized format.

#### Acceptance Criteria

1. WHEN fusion analysis completes, THE Fusion_Engine SHALL generate a Decision_Schema containing a primary conclusion
2. WHEN fusion analysis completes, THE Fusion_Engine SHALL generate a Decision_Schema containing supported claims
3. WHEN fusion analysis completes, THE Fusion_Engine SHALL generate a Decision_Schema containing unresolved claims
4. WHEN fusion analysis completes, THE Fusion_Engine SHALL generate a Decision_Schema containing detected contradictions
5. WHEN fusion analysis completes, THE Fusion_Engine SHALL generate a Decision_Schema containing caveats
6. WHEN fusion analysis completes, THE Fusion_Engine SHALL generate a Decision_Schema containing recommended next measurements
7. WHEN fusion analysis completes, THE Fusion_Engine SHALL generate a Decision_Schema containing a confidence classification

### Requirement 6: Calculate Structured Confidence Levels

**User Story:** As a materials scientist, I want confidence levels based on evidence agreement rather than blind averaging, so that confidence reflects actual scientific support.

#### Acceptance Criteria

1. WHEN Raman_Agent supports spinel structure AND XPS_Agent supports expected oxidation states AND no major contradictions exist, THE Fusion_Engine SHALL assign HIGH confidence
2. WHEN Raman_Agent supports spinel structure AND XPS_Agent provides partial support AND no major contradictions exist, THE Fusion_Engine SHALL assign MEDIUM confidence
3. WHEN Raman_Agent supports spinel structure AND surface ambiguity exists in FTIR_Agent evidence, THE Fusion_Engine SHALL assign MEDIUM confidence
4. WHEN only one technique provides evidence for a claim, THE Fusion_Engine SHALL assign LOW confidence
5. WHEN major contradictions exist between techniques, THE Fusion_Engine SHALL assign LOW confidence
6. WHEN severe ambiguity exists in evidence interpretation, THE Fusion_Engine SHALL assign LOW confidence
7. THE Fusion_Engine SHALL NOT calculate confidence by averaging individual technique confidence scores

### Requirement 7: Generate Claim-Level Confidence Assessments

**User Story:** As a materials scientist, I want separate confidence assessments for each scientific claim, so that I can understand which conclusions are well-supported and which require more evidence.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL generate a Claim_Card for spinel-like ferrite structure claims
2. THE Fusion_Engine SHALL generate a Claim_Card for Cu and Fe oxidation state consistency claims
3. THE Fusion_Engine SHALL generate a Claim_Card for surface hydroxyl and adsorbed water claims
4. THE Fusion_Engine SHALL generate a Claim_Card for carbonaceous residue and disorder claims
5. THE Fusion_Engine SHALL generate a Claim_Card for carbonate and carboxylate surface species claims
6. FOR ALL Claim_Cards, THE Fusion_Engine SHALL include supporting techniques
7. FOR ALL Claim_Cards, THE Fusion_Engine SHALL include evidence items
8. FOR ALL Claim_Cards, THE Fusion_Engine SHALL include confidence level
9. FOR ALL Claim_Cards, THE Fusion_Engine SHALL include caveats

### Requirement 8: Render Fusion Workspace UI

**User Story:** As a materials scientist, I want a workspace interface for fusion analysis, so that I can configure inputs, run fusion, and review results.

#### Acceptance Criteria

1. THE Fusion_Workspace SHALL render using Dashboard_Layout pattern
2. THE Fusion_Workspace SHALL display project name in the left panel
3. THE Fusion_Workspace SHALL display sample name in the left panel
4. THE Fusion_Workspace SHALL display included techniques list in the left panel
5. THE Fusion_Workspace SHALL display fusion rules card in the left panel
6. THE Fusion_Workspace SHALL display Run Fusion button in the left panel
7. THE Fusion_Workspace SHALL display Final Scientific Summary in the right panel
8. THE Fusion_Workspace SHALL display Confidence and Reliability section in the right panel
9. THE Fusion_Workspace SHALL display Top Supporting Evidence section in the right panel
10. THE Fusion_Workspace SHALL display Recommended Validation section in the right panel

### Requirement 9: Render Center Panel Tabs

**User Story:** As a materials scientist, I want tabbed views for different aspects of fusion results, so that I can navigate between decision, evidence, claims, contradictions, and report views.

#### Acceptance Criteria

1. THE Fusion_Workspace SHALL render a Fusion Decision tab in the center panel
2. THE Fusion_Workspace SHALL render an Evidence Matrix tab in the center panel
3. THE Fusion_Workspace SHALL render a Claim Cards tab in the center panel
4. THE Fusion_Workspace SHALL render a Contradictions tab in the center panel
5. THE Fusion_Workspace SHALL render a Report tab in the center panel
6. WHEN a user selects a tab, THE Fusion_Workspace SHALL display the corresponding content
7. THE Fusion_Workspace SHALL display exactly one tab content at a time

### Requirement 10: Render Fusion Decision Tab Content

**User Story:** As a materials scientist, I want to see the primary fusion decision with confidence and supporting details, so that I can quickly understand the main conclusion.

#### Acceptance Criteria

1. WHEN Fusion Decision tab is active, THE Fusion_Workspace SHALL display a final conclusion card
2. WHEN Fusion Decision tab is active, THE Fusion_Workspace SHALL display a confidence badge
3. WHEN Fusion Decision tab is active, THE Fusion_Workspace SHALL display supported claims list
4. WHEN Fusion Decision tab is active, THE Fusion_Workspace SHALL display unresolved claims list
5. WHEN Fusion Decision tab is active, THE Fusion_Workspace SHALL display caveats list

### Requirement 11: Render Evidence Matrix Tab Content

**User Story:** As a materials scientist, I want a matrix view showing which techniques support which claims, so that I can see evidence alignment at a glance.

#### Acceptance Criteria

1. WHEN Evidence Matrix tab is active, THE Fusion_Workspace SHALL display a table with claims as rows
2. WHEN Evidence Matrix tab is active, THE Fusion_Workspace SHALL display a table with XPS, FTIR, and Raman as columns
3. FOR ALL matrix cells, THE Fusion_Workspace SHALL display one of: Supports, Contradicts, Neutral, or Ambiguous
4. FOR ALL matrix cells, THE Fusion_Workspace SHALL display short evidence text
5. THE Evidence_Matrix SHALL include at least five claim rows

### Requirement 12: Render Claim Cards Tab Content

**User Story:** As a materials scientist, I want detailed cards for each scientific claim, so that I can review supporting evidence and confidence for individual assertions.

#### Acceptance Criteria

1. WHEN Claim Cards tab is active, THE Fusion_Workspace SHALL display five Claim_Cards
2. FOR ALL displayed Claim_Cards, THE Fusion_Workspace SHALL show supporting techniques
3. FOR ALL displayed Claim_Cards, THE Fusion_Workspace SHALL show evidence items
4. FOR ALL displayed Claim_Cards, THE Fusion_Workspace SHALL show confidence level
5. FOR ALL displayed Claim_Cards, THE Fusion_Workspace SHALL show caveats

### Requirement 13: Render Contradictions Tab Content

**User Story:** As a materials scientist, I want to see detected contradictions with severity levels, so that I can assess conflicts between techniques.

#### Acceptance Criteria

1. WHEN Contradictions tab is active, THE Fusion_Workspace SHALL display detected contradictions
2. FOR ALL displayed contradictions, THE Fusion_Workspace SHALL show severity level
3. FOR ALL displayed contradictions, THE Fusion_Workspace SHALL show involved techniques
4. FOR ALL displayed contradictions, THE Fusion_Workspace SHALL show explanation
5. FOR ALL displayed contradictions, THE Fusion_Workspace SHALL show effect on confidence

### Requirement 14: Render Report Tab Content

**User Story:** As a materials scientist, I want a reviewer-style summary report, so that I can export or share fusion results in a narrative format.

#### Acceptance Criteria

1. WHEN Report tab is active, THE Fusion_Workspace SHALL display final decision summary
2. WHEN Report tab is active, THE Fusion_Workspace SHALL display evidence organized by technique
3. WHEN Report tab is active, THE Fusion_Workspace SHALL display claim-level reasoning
4. WHEN Report tab is active, THE Fusion_Workspace SHALL display caveats
5. WHEN Report tab is active, THE Fusion_Workspace SHALL display recommended validation steps

### Requirement 15: Load Demo Data for Fusion Analysis

**User Story:** As a developer, I want demo data representing processed outputs from XPS, FTIR, and Raman, so that I can demonstrate fusion functionality without live processing engines.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL load demo Raman data containing A1g peak at 690 wavenumbers
2. THE Fusion_Engine SHALL load demo Raman data containing Eg peak at 470 wavenumbers
3. THE Fusion_Engine SHALL load demo Raman data containing lower peak at 330 wavenumbers
4. THE Fusion_Engine SHALL load demo Raman data containing D and G bands
5. THE Fusion_Engine SHALL load demo FTIR data containing OH band at 3400 wavenumbers
6. THE Fusion_Engine SHALL load demo FTIR data containing H-O-H band at 1630 wavenumbers
7. THE Fusion_Engine SHALL load demo FTIR data containing carbonate or carboxylate overlap region
8. THE Fusion_Engine SHALL load demo FTIR data containing M-O band at 550 wavenumbers
9. THE Fusion_Engine SHALL load demo XPS data containing Cu 2p evidence
10. THE Fusion_Engine SHALL load demo XPS data indicating Cu²⁺ dominant oxidation state
11. THE Fusion_Engine SHALL load demo XPS data containing satellite features or caveats

### Requirement 16: Generate Expected Demo Output

**User Story:** As a developer, I want the demo to produce a realistic fusion decision, so that users can see how the system handles real-world evidence patterns.

#### Acceptance Criteria

1. WHEN demo data is processed, THE Fusion_Engine SHALL generate a final decision stating multi-technique evidence supports spinel-like ferrite material
2. WHEN demo data is processed, THE Fusion_Engine SHALL include surface hydroxyl and water species in the final decision
3. WHEN demo data is processed, THE Fusion_Engine SHALL include possible carbonaceous residue in the final decision
4. WHEN demo data is processed, THE Fusion_Engine SHALL note that oxidation-state confirmation depends on XPS evidence quality
5. WHEN demo XPS evidence is weak or ambiguous, THE Fusion_Engine SHALL assign MEDIUM confidence
6. THE Fusion_Engine SHALL NOT assign confidence higher than MEDIUM-HIGH for demo data

### Requirement 17: Enforce Scientific Conclusion Rules

**User Story:** As a materials scientist, I want the system to enforce rigorous conclusion standards, so that I can trust the scientific validity of fusion decisions.

#### Acceptance Criteria

1. THE Fusion_Engine SHALL NOT use the term "confirmed" unless Raman_Agent evidence AND XPS_Agent evidence agree
2. THE Fusion_Engine SHALL NOT allow FTIR_Agent evidence alone to confirm phase identity
3. THE Fusion_Engine SHALL NOT allow Raman D band or G band evidence to support spinel structure claims
4. THE Fusion_Engine SHALL NOT calculate confidence by averaging technique-level confidence scores
5. FOR ALL conclusions in Decision_Schema, THE Fusion_Engine SHALL cite which techniques support the conclusion

### Requirement 18: Implement Fusion Workspace Route

**User Story:** As a user, I want to navigate to the fusion workspace via a dedicated route, so that I can access fusion functionality from the application.

#### Acceptance Criteria

1. THE Application SHALL register route `/workspace/fusion` in the router
2. WHEN a user navigates to `/workspace/fusion`, THE Application SHALL render Fusion_Workspace component
3. THE Application SHALL include `/workspace/fusion` route in App.tsx routing configuration

### Requirement 19: Create Fusion Agent Type Definitions

**User Story:** As a developer, I want TypeScript type definitions for fusion agent data structures, so that I can ensure type safety across the fusion implementation.

#### Acceptance Criteria

1. THE Fusion_Agent SHALL define TypeScript types in `src/agents/fusionAgent/types.ts`
2. THE Fusion_Agent type definitions SHALL include Decision_Schema structure
3. THE Fusion_Agent type definitions SHALL include Claim_Card structure
4. THE Fusion_Agent type definitions SHALL include Evidence_Item structure
5. THE Fusion_Agent type definitions SHALL include Contradiction structure
6. THE Fusion_Agent type definitions SHALL include Compatibility_Score structure

### Requirement 20: Implement Fusion Agent Runner

**User Story:** As a developer, I want a fusion agent runner that executes the fusion logic, so that the workspace can process evidence and generate decisions.

#### Acceptance Criteria

1. THE Fusion_Agent SHALL implement runner logic in `src/agents/fusionAgent/runner.ts`
2. THE Fusion_Agent runner SHALL import evidence from XPS_Agent, FTIR_Agent, and Raman_Agent
3. THE Fusion_Agent runner SHALL apply Authority_Hierarchy rules
4. THE Fusion_Agent runner SHALL calculate Compatibility_Scores
5. THE Fusion_Agent runner SHALL detect contradictions
6. THE Fusion_Agent runner SHALL generate Decision_Schema output
7. THE Fusion_Agent runner SHALL calculate structured confidence levels

### Requirement 21: Validate Build Success

**User Story:** As a developer, I want the implementation to build successfully, so that I can deploy the fusion workspace without build errors.

#### Acceptance Criteria

1. WHEN the command `npm run build` is executed, THE Application SHALL complete without errors
2. WHEN the command `npm run build` is executed, THE Application SHALL produce output bundle files
3. THE Application build process SHALL include all fusion workspace components
4. THE Application build process SHALL include all fusion agent modules
