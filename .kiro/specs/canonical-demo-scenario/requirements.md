# P0-02: Lock Canonical Demo Scenario - Requirements

## Overview

Define and implement one canonical demo scenario that all relevant demo/workspace panels can reference consistently. This scenario will serve as the single source of truth for DIFARYX demo data, ensuring consistency across Dashboard, Workspaces, Agent Demo, Notebook, and History views.

## Problem Statement

Currently, DIFARYX demo data is scattered across multiple files with inconsistent:
- Project names and identifiers
- Sample metadata
- Material descriptions
- Characterization objectives
- Technique coverage
- Expected output sections

This leads to:
- Inconsistent user experience across routes
- Difficulty maintaining demo coherence
- Risk of terminology drift
- Harder to extend with new P0 cards

## Goals

1. **Single Source of Truth**: Create one canonical scenario definition that all components reference
2. **Consistent Terminology**: Ensure all panels use research/R&D lab-grade terminology
3. **Deterministic Behavior**: Maintain fully deterministic demo data and outputs
4. **Extensibility**: Support future P0 cards (Characterization Objective, Sample Context, Data Availability, etc.)
5. **Clean Presentation**: Ensure demo feels like research workflow, not AI evaluation

## Canonical Scenario Definition

### Project Identity
- **Project Name**: CuFe₂O₄ Spinel Ferrite Characterization
- **Project ID**: `cufe2o4-spinel-characterization`
- **Sample ID**: `sample_spinel_01`
- **Created Date**: 2026-04-15
- **Last Updated**: 2026-04-29

### Material System
- **Material Formula**: CuFe₂O₄
- **Material System**: CuFe₂O₄-based spinel ferrite catalyst candidate
- **Material Class**: Spinel ferrite catalyst candidate
- **Crystal Structure**: Cubic spinel (Fd-3m space group)
- **Expected Lattice Parameter**: a ≈ 8.38 Å
- **Synthesis Method**: Co-precipitation followed by calcination at 800°C
- **Support Material**: SBA-15 mesoporous silica (for supported variant)

### Characterization Objective
**Main Objective**: Determine whether the available XRD-centered characterization data are consistent with a cubic spinel ferrite assignment.

**Specific Questions**:
1. Does the XRD pattern match the expected cubic spinel structure?
2. Are the observed peak positions consistent with CuFe₂O₄ reference data?
3. Do supporting techniques (Raman, XPS, FTIR) corroborate the structural assignment?
4. What limitations or validation gaps exist in the current dataset?

### Technique Coverage

**Primary Technique**: XRD (X-ray Diffraction)
- Purpose: Phase identification and structural characterization
- Dataset: 2θ range 10-80°, Cu Kα radiation
- Key Features: 9 major reflections detected
- Status: Complete

**Supporting Techniques**:
1. **Raman Spectroscopy**
   - Purpose: Vibrational fingerprinting and structural validation
   - Dataset: 100-4000 cm⁻¹ range
   - Key Features: 5 active modes (A₁g, Eg, T₂g)
   - Status: Complete

2. **XPS (X-ray Photoelectron Spectroscopy)**
   - Purpose: Surface oxidation state analysis
   - Dataset: Cu 2p, Fe 2p, O 1s regions
   - Key Features: Cu²⁺ and Fe³⁺/Fe²⁺ signatures
   - Status: Complete

3. **FTIR (Fourier Transform Infrared)**
   - Purpose: Metal-oxygen bonding characterization
   - Dataset: 400-4000 cm⁻¹ range
   - Key Features: M-O stretching bands, surface species
   - Status: Complete

### Expected Output Sections

All characterization outputs must include these sections in order:

1. **Characterization Overview**
   - High-level summary of findings
   - Technique coverage
   - Overall conclusion status

2. **Supporting Data**
   - Technique-specific observations
   - Peak/feature assignments
   - Quantitative measurements

3. **Cross-Technique Insights**
   - Multi-technique correlations
   - Convergent evidence
   - Technique-specific contributions

4. **Agent Interpretation**
   - Synthesis of evidence
   - Structural reasoning
   - Literature context (when applicable)

5. **Conclusion**
   - Final structural assignment
   - Finding status (Complete/Ready/In Progress/Requires Validation)
   - Confidence basis

6. **Limitations and Follow-up Validation**
   - Known gaps or uncertainties
   - Recommended validation experiments
   - Priority ranking

### Characterization Purpose

**Context**: Structured phase and evidence review for spinel ferrite characterization

**Use Case**: Pre-publication material verification for catalysis research

**Stakeholders**: Materials characterization lab, catalysis research group

## Critical Constraints

### Terminology Constraints (MUST NOT)
- ❌ Do NOT add judge notes
- ❌ Do NOT add scoring language (confidence %, quality scores, weights)
- ❌ Do NOT add challenge-specific labels
- ❌ Do NOT make UI look like AI evaluation dashboard
- ❌ Do NOT reintroduce old labels:
  - "Strongly Supported"
  - "Claim Status"
  - "Decision Status"
  - "AI Reasoning"
  - "Scientific Reasoning" as a visible heading
  - "Evidence Basis" (use "Supporting Data")
  - "Agent Evidence Summary" (use "Supporting Data")
  - "Caveats and Next Steps" (use "Limitations and Follow-up Validation")

### Technical Constraints (MUST)
- ✅ Preserve existing routes and behavior
- ✅ Keep all scenario data deterministic
- ✅ Maintain claim graph engine logic unchanged
- ✅ Support existing fusionEngine integration
- ✅ Ensure backward compatibility with current demo data structure

### Presentation Constraints (MUST)
- ✅ Demo must feel like research workflow
- ✅ Demo must feel like experimental notebook
- ✅ Demo must feel like characterization workspace
- ✅ Demo must feel like reporting workspace
- ✅ Use research/R&D lab-grade terminology consistently

## Functional Requirements

### FR-1: Canonical Scenario Data Model
Create a centralized data model that defines:
- Project metadata
- Sample information
- Material properties
- Characterization objectives
- Technique coverage
- Expected datasets
- Reference data

**Acceptance Criteria**:
- Single TypeScript file exports canonical scenario
- All demo components import from this file
- Type-safe access to scenario properties
- Easy to extend for future P0 cards

### FR-2: Dashboard Integration
Update Dashboard to display canonical scenario consistently.

**Acceptance Criteria**:
- Project card shows canonical project name
- Material formula uses formatChemicalFormula()
- Status labels use canonical terminology (Complete/Ready/In Progress)
- Technique badges match canonical coverage
- Last updated date matches canonical scenario

### FR-3: Workspace Integration
Update all workspace pages to reference canonical scenario.

**Acceptance Criteria**:
- XRD workspace shows canonical XRD dataset
- Raman workspace shows canonical Raman dataset
- XPS workspace shows canonical XPS dataset
- FTIR workspace shows canonical FTIR dataset
- Multi-tech workspace shows canonical cross-technique data
- All workspaces use canonical output sections

### FR-4: Agent Demo Integration
Update Agent Demo to use canonical scenario.

**Acceptance Criteria**:
- Default dataset is canonical scenario
- Mission text references canonical objective
- Tool trace uses canonical technique names
- Output sections match canonical structure
- Reasoning uses canonical terminology

### FR-5: Notebook Integration
Update Notebook to generate reports from canonical scenario.

**Acceptance Criteria**:
- Report title uses canonical project name
- Sections follow canonical output structure
- Supporting data references canonical datasets
- Conclusion uses canonical terminology
- Export includes canonical metadata

### FR-6: History Integration
Update History to show canonical scenario runs.

**Acceptance Criteria**:
- History entries reference canonical project
- Run metadata includes canonical sample ID
- Technique coverage matches canonical definition
- Status labels use canonical terminology

## Non-Functional Requirements

### NFR-1: Performance
- Canonical scenario data must load instantly (< 10ms)
- No impact on existing page load times
- Minimal bundle size increase (< 5KB)

### NFR-2: Maintainability
- Single file to update for scenario changes
- Clear documentation of data structure
- Type-safe access prevents errors
- Easy to add new scenario variants

### NFR-3: Extensibility
- Support future P0 cards without breaking changes
- Allow multiple scenarios (future enhancement)
- Enable scenario switching (future enhancement)
- Support custom user scenarios (future enhancement)

## Future P0 Card Support

The canonical scenario must support these upcoming cards:

### P0-03: Characterization Objective Card
- Display main objective
- Show specific questions
- Link to relevant datasets
- Show completion status

### P0-04: Sample Context Card
- Display material system
- Show synthesis method
- Display material class
- Show expected properties

### P0-05: Data Availability Status
- Show technique coverage
- Display dataset completeness
- Show missing data gaps
- Link to data sources

### P0-06: Technique Coverage Panel
- Visual technique matrix
- Show primary vs supporting
- Display data quality indicators
- Show cross-technique links

### P0-07: Evidence Requirements Table
- List required evidence types
- Show availability status
- Display validation priority
- Link to supporting data

## Success Criteria

1. ✅ All demo routes reference canonical scenario consistently
2. ✅ No terminology violations in visible UI
3. ✅ Build passes without errors
4. ✅ Demo feels like research workflow
5. ✅ Easy to extend for future P0 cards
6. ✅ Single source of truth for demo data
7. ✅ Backward compatible with existing code

## Out of Scope

- Multiple scenario support (future enhancement)
- User-defined scenarios (future enhancement)
- Scenario import/export (future enhancement)
- Real backend integration (remains demo-only)
- Dynamic scenario generation (remains deterministic)

## Dependencies

- Existing demoProjects.ts structure
- Claim graph engine types
- Fusion engine integration
- Current route structure
- Existing component props

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing demo data | High | Maintain backward compatibility, add adapters if needed |
| Terminology drift | Medium | Centralize all labels in canonical scenario |
| Performance regression | Low | Keep scenario data lightweight, use memoization |
| Future extensibility issues | Medium | Design with P0 cards in mind, use flexible data structure |

## Acceptance Testing

### Test Case 1: Dashboard Consistency
- Navigate to /dashboard
- Verify project name matches canonical scenario
- Verify material formula is correctly formatted
- Verify status labels use canonical terminology
- Verify technique badges match canonical coverage

### Test Case 2: Workspace Consistency
- Navigate to each workspace (/workspace/xrd, /workspace/raman, etc.)
- Verify dataset matches canonical scenario
- Verify output sections follow canonical structure
- Verify terminology is consistent

### Test Case 3: Agent Demo Consistency
- Navigate to /demo/agent
- Verify default dataset is canonical scenario
- Verify mission text references canonical objective
- Verify output uses canonical sections
- Verify terminology is consistent

### Test Case 4: Notebook Consistency
- Navigate to /notebook
- Verify report uses canonical project name
- Verify sections follow canonical structure
- Verify terminology is consistent
- Verify export includes canonical metadata

### Test Case 5: History Consistency
- Navigate to /history
- Verify entries reference canonical project
- Verify metadata includes canonical sample ID
- Verify terminology is consistent

## References

- AGENTS.md: Project purpose and safety rules
- Phase 10 Summary: Research-grade scientific interpretation
- Terminology normalization audit: Canonical terminology definitions
- Claim graph engine: Deterministic reasoning structure
