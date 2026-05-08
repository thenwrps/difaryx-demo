# Implementation Plan: Locked Scientific Context

## Overview

This implementation adds Locked Scientific Context as a minimal additive frontend feature for DIFARYX. The feature displays user-confirmed scientific context (sample identity, source dataset, processing path, reference scope, and claim boundary) as a locked constraint that cannot be modified by the agent without explicit user action. This is a frontend-only TypeScript/React implementation with no backend changes, no new dependencies, and preservation of all existing routes and deterministic demo behavior.

## Tasks

- [x] 1. Create locked context data layer
  - Create `src/data/lockedContext.ts` file
  - Define `LockedScientificContext` interface with six required fields
  - Define `LockedContextMap` type as Record<string, LockedScientificContext | undefined>
  - Implement `LOCKED_CONTEXT_DATA` constant with cu-fe2o4-spinel data
  - Implement `LOCKED_CONTEXT_DATA` constant with cufe2o4-sba15 data
  - Implement `getLockedContext(projectId: string)` function that returns LockedScientificContext | null
  - Ensure unsupported projects (fe3o4-nanoparticles, nife2o4, cofe2o4) return null
  - _Requirements: 1, 2, 3, 4, 10_

- [x] 2. Create LockedScientificContext component
  - [x] 2.1 Create component directory and file
    - Create `src/components/locked-context/` directory
    - Create `src/components/locked-context/LockedScientificContext.tsx` file
    - Define `LockedScientificContextProps` interface with six required fields and optional variant prop
    - _Requirements: 1_

  - [x] 2.2 Implement full variant rendering
    - Render all six fields with labels (Sample Identity, Technique, Source Dataset, Source Processing Path, Reference Scope, Claim Boundary)
    - Add "Locked by user" badge with amber styling (bg-amber-500/10 text-amber-700)
    - Add "Source context preserved" subtitle
    - Add guardrail wording section with four required phrases
    - Use amber theme styling (border-amber-500/30, bg-amber-500/5)
    - Use existing DIFARYX text styles (text-text-main for labels, text-text-muted for values)
    - _Requirements: 1, 9_

  - [x] 2.3 Implement compact variant rendering
    - Render condensed version suitable for narrow sidebar
    - Display all six fields with smaller text sizes
    - Include "Locked by user" badge
    - Omit guardrail wording section (compact variant only shows data)
    - Use same amber theme styling as full variant
    - _Requirements: 1, 6_

  - [x] 2.4 Add fallback handling for missing fields
    - Display "Not specified" for any missing field values
    - Ensure component does not crash with incomplete data
    - _Requirements: 1_

- [x] 3. Integrate locked context into Agent Mode RightPanel
  - [x] 3.1 Add imports to RightPanel.tsx
    - Import `LockedScientificContext` component from `../../locked-context/LockedScientificContext`
    - Import `getLockedContext` function from `../../../data/lockedContext`
    - _Requirements: 5_

  - [x] 3.2 Add locked context section to RightPanel
    - Call `getLockedContext(projectId)` to retrieve locked context data
    - Add locked context section after "Source Processing Parameters" section
    - Render `LockedScientificContext` component with variant="full"
    - Use conditional rendering to only show section when lockedContext is not null
    - Use same border/padding styling as other RightPanel sections (border-b border-border px-3 py-3)
    - _Requirements: 5, 13_

  - [x] 3.3 Ensure no layout overflow
    - Verify RightPanel parent container has overflow-y-auto
    - Test with cu-fe2o4-spinel project (should display locked context)
    - Test with cufe2o4-sba15 project (should display locked context)
    - Test with fe3o4-nanoparticles project (should not display locked context)
    - _Requirements: 5, 12_

- [x] 4. Integrate locked context into XRD Workspace
  - [x] 4.1 Add imports to XrdWorkspace.tsx
    - Import `LockedScientificContext` component from `../components/locked-context/LockedScientificContext`
    - Import `getLockedContext` function from `../data/lockedContext`
    - _Requirements: 6_

  - [x] 4.2 Add compact locked context card to left sidebar
    - Call `getLockedContext(project.id)` to retrieve locked context data
    - Add locked context card after "Evidence" section in left sidebar
    - Render `LockedScientificContext` component with variant="compact"
    - Use conditional rendering to only show card when lockedContext is not null
    - Use sidebar styling (border-b border-border px-3 py-1.5)
    - _Requirements: 6, 13_

  - [x] 4.3 Ensure no layout overflow
    - Verify compact variant fits in narrow sidebar without overflow
    - Test with cu-fe2o4-spinel project (should display locked context card)
    - Test with cufe2o4-sba15 project (should display locked context card)
    - Test with nife2o4 project (should not display locked context card)
    - _Requirements: 6, 12_

- [x] 5. Integrate locked context preservation notice into Notebook
  - [x] 5.1 Add import to NotebookLab.tsx
    - Import `getLockedContext` function from `../data/lockedContext`
    - _Requirements: 7_

  - [x] 5.2 Add preservation notice after experiment title
    - Call `getLockedContext(project.id)` to retrieve locked context data
    - Add preservation notice div after experiment title, before summary
    - Use amber styling (border border-amber-500/30 bg-amber-500/5 px-3 py-2)
    - Display text: "Locked context preserved: sample identity, source dataset, processing path, and claim boundary were not modified."
    - Use conditional rendering to only show notice when lockedContext is not null
    - _Requirements: 7, 9, 13_

  - [x] 5.3 Test preservation notice display
    - Test with cu-fe2o4-spinel project (should display preservation notice)
    - Test with cofe2o4 project (should not display preservation notice)
    - _Requirements: 7, 12_

- [x] 6. Integrate locked context into report export
  - [x] 6.1 Modify exportMarkdown function in NotebookLab.tsx
    - Call `getLockedContext(project.id)` at start of exportMarkdown function
    - Create `lockedContextMarkdown` variable with conditional locked context section
    - Include section heading "## Locked Scientific Context"
    - Include all six fields with labels (Sample Identity, Technique, Source Dataset, Source Processing Path, Reference Scope, Claim Boundary)
    - Place locked context section after "## Experiment" and before "## Source Workflow"
    - _Requirements: 8, 13_

  - [x] 6.2 Test report export with locked context
    - Test export with cu-fe2o4-spinel project (should include locked context section)
    - Test export with fe3o4-nanoparticles project (should not include locked context section)
    - Verify markdown formatting is correct
    - _Requirements: 8, 12_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Run build validation
  - Run `npm.cmd run build` and verify no errors
  - Run `git diff --check` and verify no errors
  - Fix any build or linting errors
  - _Requirements: 11_

- [x] 9. Run smoke tests on all required routes
  - Test `/workspace/xrd?project=cu-fe2o4-spinel` - Locked context card visible
  - Test `/workspace/xrd?project=cufe2o4-sba15` - Locked context card visible
  - Test `/workspace/xrd?project=fe3o4-nanoparticles` - No locked context card
  - Test `/demo/agent?project=cu-fe2o4-spinel&processing=processing-cu-fe2o4-spinel-xrd-demo&template=research` - Locked context in RightPanel
  - Test `/demo/agent?project=cufe2o4-sba15` - Locked context in RightPanel
  - Test `/notebook?project=cu-fe2o4-spinel` - Preservation notice visible
  - Test `/notebook?project=fe3o4-nanoparticles` - No preservation notice
  - Test `/history` - No locked context display (not required)
  - Verify no console errors
  - Verify no layout overflow
  - Verify correct styling (amber theme)
  - Verify correct wording (matches requirements)
  - _Requirements: 12_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- This is a frontend-only TypeScript/React implementation
- No backend changes, no new dependencies, no route changes
- All changes are additive only (no refactoring of existing components)
- Locked context data is hardcoded for cu-fe2o4-spinel and cufe2o4-sba15 only
- Unsupported projects (fe3o4-nanoparticles, nife2o4, cofe2o4) return null and show fallback message
- All wording uses past tense to avoid implying live backend sync
- Checkpoints ensure incremental validation
