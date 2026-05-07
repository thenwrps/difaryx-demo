# Requirements Document

## Introduction

This feature implements Locked Scientific Context as a minimal additive public-beta guardrail for DIFARYX. The feature makes clear that DIFARYX can test analytical pathways, compare evidence, and refine interpretations, but cannot modify user-confirmed scientific context without explicit user action. This is a frontend-only implementation with no backend changes, no new dependencies, and preservation of all existing routes and deterministic demo behavior.

## Glossary

- **DIFARYX**: The scientific reasoning infrastructure for materials characterization
- **DIFARYX_LAB**: The company ecosystem containing DIFARYX
- **INANZ**: Universal Instant Spectra Analyzer
- **Locked_Scientific_Context**: User-confirmed scientific context treated as a locked constraint that cannot be modified by the agent without explicit user action
- **Source_Processing_Parameters**: Processing parameters from XRD Workspace or other technique workspaces
- **Claim_Boundary**: The boundary of what can be claimed based on current evidence coverage
- **Agent_Mode**: The autonomous agent demo interface at /demo/agent
- **XRD_Workspace**: The technique workspace for XRD at /workspace/xrd
- **Notebook**: The notebook/report surface at /notebook
- **Report_Export**: Export functionality for reports in various formats
- **LockedScientificContext_Component**: React component that displays locked scientific context information
- **Deterministic_Demo**: The current demo behavior where specific projects have predefined locked context data
- **Unsupported_Project**: Projects that do not have locked scientific context data defined (fe3o4-nanoparticles, nife2o4, cofe2o4)

## Requirements

### Requirement 1: LockedScientificContext Component Creation

**User Story:** As a developer, I want a reusable LockedScientificContext component, so that locked scientific context can be displayed consistently across different views.

#### Acceptance Criteria

1. THE LockedScientificContext_Component SHALL display sample identity
2. THE LockedScientificContext_Component SHALL display technique
3. THE LockedScientificContext_Component SHALL display source dataset
4. THE LockedScientificContext_Component SHALL display source processing path
5. THE LockedScientificContext_Component SHALL display reference scope
6. THE LockedScientificContext_Component SHALL display claim boundary
7. THE LockedScientificContext_Component SHALL accept locked context data as props
8. THE LockedScientificContext_Component SHALL render with appropriate styling consistent with existing DIFARYX components

### Requirement 2: Deterministic Locked Context Data for cu-fe2o4-spinel

**User Story:** As a user viewing the cu-fe2o4-spinel project, I want to see locked scientific context, so that I understand the constraints on the analysis.

#### Acceptance Criteria

1. WHEN the project is cu-fe2o4-spinel, THE System SHALL provide sample identity as "CuFe₂O₄ spinel ferrite"
2. WHEN the project is cu-fe2o4-spinel, THE System SHALL provide technique as "XRD"
3. WHEN the project is cu-fe2o4-spinel, THE System SHALL provide source dataset as "xrd-cufe2o4-clean"
4. WHEN the project is cu-fe2o4-spinel, THE System SHALL provide source processing path as "XRD Workspace / processing-cu-fe2o4-spinel-xrd-demo"
5. WHEN the project is cu-fe2o4-spinel, THE System SHALL provide reference scope as "spinel ferrite screening"
6. WHEN the project is cu-fe2o4-spinel, THE System SHALL provide claim boundary as "XRD supports phase assignment; phase purity remains validation-limited."

### Requirement 3: Deterministic Locked Context Data for cufe2o4-sba15

**User Story:** As a user viewing the cufe2o4-sba15 project, I want to see locked scientific context, so that I understand the constraints on the supported sample analysis.

#### Acceptance Criteria

1. WHEN the project is cufe2o4-sba15, THE System SHALL provide sample identity as "CuFe₂O₄/SBA-15 supported sample"
2. WHEN the project is cufe2o4-sba15, THE System SHALL provide technique as "XRD with contextual Raman/FTIR evidence"
3. WHEN the project is cufe2o4-sba15, THE System SHALL provide source dataset as "xrd-cufe2o4-sba15-demo"
4. WHEN the project is cufe2o4-sba15, THE System SHALL provide source processing path as "Multi-technique evidence context"
5. WHEN the project is cufe2o4-sba15, THE System SHALL provide reference scope as "supported copper ferrite on mesoporous silica context"
6. WHEN the project is cufe2o4-sba15, THE System SHALL provide claim boundary as "Do not describe as pure bulk CuFe₂O₄; phase purity remains validation-limited."

### Requirement 4: No-Data Fallback for Unsupported Projects

**User Story:** As a user viewing an unsupported project, I want to see a clear message, so that I understand locked context is not available for this project.

#### Acceptance Criteria

1. WHEN the project is fe3o4-nanoparticles, THE System SHALL display "No locked scientific context available for this project."
2. WHEN the project is nife2o4, THE System SHALL display "No locked scientific context available for this project."
3. WHEN the project is cofe2o4, THE System SHALL display "No locked scientific context available for this project."
4. WHEN the project is any Unsupported_Project, THE System SHALL NOT display locked context data from other projects

### Requirement 5: Agent Mode RightPanel Placement

**User Story:** As a user in Agent Mode, I want to see locked scientific context in the RightPanel, so that I understand the constraints while the agent is running.

#### Acceptance Criteria

1. WHEN viewing Agent_Mode, THE System SHALL display LockedScientificContext_Component in the RightPanel
2. THE LockedScientificContext_Component SHALL be placed near Source_Processing_Parameters
3. THE LockedScientificContext_Component SHALL be placed near Claim_Boundary section
4. THE LockedScientificContext_Component SHALL NOT overflow the RightPanel layout

### Requirement 6: XRD Workspace Placement

**User Story:** As a user in XRD Workspace, I want to see locked scientific context, so that I understand the constraints while processing data.

#### Acceptance Criteria

1. WHEN viewing XRD_Workspace, THE System SHALL display LockedScientificContext_Component as a compact card
2. THE LockedScientificContext_Component SHALL be placed near Evidence/Interpretation section if layout allows
3. THE LockedScientificContext_Component SHALL NOT cause layout overflow

### Requirement 7: Notebook Locked Context Preservation Notice

**User Story:** As a user viewing the Notebook, I want to see that locked context was preserved, so that I understand the analysis constraints were maintained.

#### Acceptance Criteria

1. WHEN viewing Notebook, THE System SHALL display a notice that locked context was preserved
2. THE notice SHALL state "Locked context preserved: sample identity, source dataset, processing path, and claim boundary were not modified."
3. THE notice SHALL be displayed as a line or small section in the Notebook view

### Requirement 8: Report Export Locked Context Inclusion

**User Story:** As a user exporting a report, I want locked context included in the export, so that the reproducibility trail is complete.

#### Acceptance Criteria

1. WHEN exporting a report, THE System SHALL include locked scientific context in the export
2. THE locked context SHALL be placed under Reproducibility Trail or equivalent existing section
3. THE locked context SHALL include all six fields: sample identity, technique, source dataset, source processing path, reference scope, and claim boundary

### Requirement 9: Required Wording and Terminology

**User Story:** As a user, I want consistent terminology, so that the locked context feature is clear and unambiguous.

#### Acceptance Criteria

1. THE System SHALL use the phrase "Locked by user" in locked context displays
2. THE System SHALL use the phrase "Source context preserved" in locked context displays
3. THE System SHALL use the phrase "User-confirmed context is treated as a locked scientific constraint." in locked context displays
4. THE System SHALL use the phrase "DIFARYX may test analytical paths, but source context remains unchanged." in locked context displays
5. THE System SHALL use the phrase "Suggested changes require explicit user action." in locked context displays
6. THE System SHALL use the phrase "Interpretation is bounded by current evidence coverage." in locked context displays

### Requirement 10: Guardrail Enforcement

**User Story:** As a developer, I want guardrails enforced, so that the feature is implemented safely and correctly.

#### Acceptance Criteria

1. THE System SHALL NOT allow unsupported projects to inherit CuFe₂O₄ locked context
2. THE System SHALL NOT imply live backend sync in any locked context display
3. THE System SHALL NOT imply the agent modifies source processing in any locked context display
4. THE System SHALL NOT add new routes during implementation
5. THE System SHALL NOT rename DIFARYX_LAB, DIFARYX, or INANZ
6. THE System SHALL NOT weaken existing validation-boundary wording

### Requirement 11: Build Validation

**User Story:** As a developer, I want the build to pass, so that the feature does not break the application.

#### Acceptance Criteria

1. WHEN the implementation is complete, THE System SHALL pass npm.cmd run build without errors
2. WHEN the implementation is complete, THE System SHALL pass git diff --check without errors

### Requirement 12: Smoke Test Coverage

**User Story:** As a developer, I want smoke tests to pass, so that the feature works correctly in all required views.

#### Acceptance Criteria

1. THE System SHALL render correctly at /workspace/xrd?project=cu-fe2o4-spinel
2. THE System SHALL render correctly at /workspace/xrd?project=cufe2o4-sba15
3. THE System SHALL render correctly at /workspace/xrd?project=fe3o4-nanoparticles
4. THE System SHALL render correctly at /demo/agent?project=cu-fe2o4-spinel&processing=processing-cu-fe2o4-spinel-xrd-demo&template=research
5. THE System SHALL render correctly at /demo/agent?project=cufe2o4-sba15
6. THE System SHALL render correctly at /notebook
7. THE System SHALL render correctly at /history

### Requirement 13: Preservation of Existing Behavior

**User Story:** As a user, I want existing functionality preserved, so that the feature is additive only.

#### Acceptance Criteria

1. THE System SHALL preserve all existing routes
2. THE System SHALL preserve deterministic demo behavior
3. THE System SHALL preserve Notebook behavior
4. THE System SHALL preserve Agent behavior
5. THE System SHALL preserve History behavior
6. THE System SHALL preserve Report/export behavior
7. THE System SHALL NOT refactor architecture
8. THE System SHALL make additive changes only
9. THE System SHALL NOT add new dependencies
