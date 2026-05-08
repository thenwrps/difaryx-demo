# Multi-Technique Wording Patch Bugfix Design

## Overview

This bugfix addresses inconsistent wording across the DIFARYX multi-technique workspace, landing page, Notebook claim boundaries, and Agent Demo that either overclaims capabilities (listing XPS as "supported context" when it's actually "pending validation") or undermines the multi-technique narrative (XRD-only framing). The fix ensures consistent messaging that positions DIFARYX as a validation-aware multi-technique scientific reasoning system with clear claim boundaries.

The approach is minimal copy/data edits only—no backend, no dependencies, no architecture changes, no new routes or components.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when user-facing copy displays inconsistent validation status for XPS, overclaims interpretation strength, uses plain text chemical formulas in display copy, or lacks validation-aware framing
- **Property (P)**: The desired behavior - consistent validation-limited language, proper Unicode subscripts in display copy, clear multi-technique narrative with validation boundaries
- **Preservation**: Existing routes, layouts, deterministic demo behavior, Locked Scientific Context behavior, Notebook, Agent, History, Report/export behavior, and current architecture must remain unchanged
- **CLAIM_BOUNDARY**: The data structure in `src/data/workflowPipeline.ts` that defines supported, requiresValidation, notSupportedYet, contextual, and pending evidence categories
- **Cross-Tech Evidence Review**: The interpretation, recommendation, and status copy displayed in the Multi-Tech Workspace fusion reasoning output
- **Landing Hero Copy**: The tagline and supporting copy in `src/components/landing/HeroSection.tsx`
- **Agent Mode Microcopy**: The explanatory text in Agent Demo that clarifies the role of XRD as primary structural workflow with Raman, FTIR, XPS, and literature as validation context

## Bug Details

### Bug Condition

The bug manifests when user-facing copy displays inconsistent validation status, overclaims interpretation strength, or lacks validation-aware framing. The system is either listing XPS as "supported" when it requires review, stating "Convergent multi-technique evidence supports spinel ferrite structure" without qualifying XPS validation status, recommending "Proceed with spinel ferrite structural assignment for downstream analysis and reporting" without validation-limited framing, or displaying plain text "CuFe2O4" instead of properly formatted "CuFe₂O₄" subscripts.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserFacingCopyContext
  OUTPUT: boolean
  
  RETURN (input.claimBoundary.supported CONTAINS "Cross-technique convergence with Raman/XPS context")
         OR (input.fusionInterpretation CONTAINS "Convergent multi-technique evidence supports spinel ferrite structure" 
             AND NOT input.fusionInterpretation CONTAINS "XPS surface-state validation remains under review")
         OR (input.fusionRecommendation CONTAINS "Proceed with spinel ferrite structural assignment for downstream analysis and reporting"
             AND NOT input.fusionRecommendation CONTAINS "validation-limited")
         OR (input.fusionStatus CONTAINS "CuFe2O4" AND NOT input.fusionStatus CONTAINS "CuFe₂O₄")
         OR (input.landingHero CONTAINS "From experimental signal to evidence-linked interpretation"
             AND NOT input.landingHero CONTAINS "validation-aware")
         OR (input.agentModeTitle LACKS explanatory microcopy about validation context)
         OR (input.displayCopy CONTAINS plain text chemical formulas without Unicode subscripts)
END FUNCTION
```

### Examples

- **Example 1**: Notebook claim boundary lists "Cross-technique convergence with Raman/XPS context" as "Supported" even though XPS is marked as "Review" strength with caveat "Run Cu 2p / Fe 2p review before surface-state claims"
  - **Expected**: Separate "Contextual: Raman/FTIR support features" and "Pending: XPS surface-state validation"

- **Example 2**: Cross-Tech Evidence Review displays "Convergent multi-technique evidence supports spinel ferrite structure" without qualifying XPS validation status
  - **Expected**: "Linked XRD, Raman, and FTIR evidence supports a spinel-ferrite working interpretation, while XPS surface-state validation remains under review"

- **Example 3**: Cross-Tech Evidence Review displays "Proceed with spinel ferrite structural assignment for downstream analysis and reporting" without validation-limited framing
  - **Expected**: "Use spinel ferrite assignment as a working interpretation; phase purity and surface-state claims remain validation-limited"

- **Example 4**: Cross-Tech Evidence Review displays "Preliminary assignment: CuFe2O4 spinel ferrite" without subscripts or validation qualifier
  - **Expected**: "Preliminary interpretation: CuFe₂O₄-related spinel ferrite evidence, validation required"

- **Example 5**: Landing page hero displays "From experimental signal to evidence-linked interpretation" without emphasizing validation-aware decisions
  - **Expected**: "From experimental signals to traceable scientific decisions" with "validation-aware decisions" in supporting copy

- **Example 6**: Agent Mode displays XRD scenario title without explanatory microcopy
  - **Expected**: Include microcopy stating "Primary structural evidence workflow. Raman, FTIR, XPS, and literature layers provide validation context."

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All existing routes (`/`, `/dashboard`, `/workspace`, `/workspace/multi`, `/demo/agent`, `/notebook`, `/history`) must continue to render without breaking
- Build process (`npm.cmd run build`) must pass without errors
- Git diff check (`git diff --check`) must pass without whitespace errors
- Route IDs, project IDs, dataset IDs, file IDs, query params, and code identifiers must continue to use plain text chemical formulas without subscripts
- Locked Scientific Context must continue to preserve existing copy without weakening claim boundaries
- Unsupported projects must continue to avoid inheriting CuFe₂O₄ evidence or locked context
- Report exports, notebook entry saves, and processing result generation must continue to maintain existing deterministic demo behavior
- Notebook, Agent Demo, History, and Report sections must continue to preserve all existing layouts and export behavior
- Backend and architecture must remain frontend-only with no backend changes, no new dependencies, and no architecture refactor

**Scope:**
All inputs that do NOT involve user-facing display copy should be completely unaffected by this fix. This includes:
- Internal code identifiers (variable names, function names, type names)
- Route paths and query parameters
- Dataset IDs, project IDs, file IDs
- localStorage keys
- Git commit history and branch names

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Inconsistent Claim Boundary Structure**: The `CLAIM_BOUNDARY` constant in `src/data/workflowPipeline.ts` lists "Cross-technique convergence with Raman/XPS context" as "supported" when XPS should be separated into "contextual" (Raman/FTIR) and "pending" (XPS)

2. **Overclaiming Fusion Interpretation**: The `fusionEngine.ts` conclusion states "Convergent multi-technique evidence supports spinel ferrite structure" without qualifying that XPS surface-state validation remains under review

3. **Missing Validation-Limited Framing**: The `fusionEngine.ts` decision states "Proceed with spinel ferrite structural assignment for downstream analysis and reporting" without "working interpretation" or "validation-limited" language

4. **Plain Text Chemical Formulas**: User-facing copy displays "CuFe2O4" instead of "CuFe₂O₄" with proper Unicode subscripts

5. **Landing Page Overclaiming**: The hero tagline "From experimental signal to evidence-linked interpretation" does not emphasize validation-aware decisions

6. **Missing Agent Mode Microcopy**: The Agent Demo XRD scenario title lacks explanatory text clarifying that Raman, FTIR, XPS, and literature provide validation context

## Correctness Properties

Property 1: Bug Condition - Consistent Validation-Limited Wording

_For any_ user-facing copy where validation status is displayed (claim boundaries, fusion interpretation, fusion recommendation, fusion status, landing hero, agent mode title), the fixed system SHALL use consistent validation-limited language that separates "Contextual: Raman/FTIR support features" and "Pending: XPS surface-state validation", states "Linked XRD, Raman, and FTIR evidence supports a spinel-ferrite working interpretation, while XPS surface-state validation remains under review", recommends "Use spinel ferrite assignment as a working interpretation; phase purity and surface-state claims remain validation-limited", displays "Preliminary interpretation: CuFe₂O₄-related spinel ferrite evidence, validation required", shows "From experimental signals to traceable scientific decisions" with "validation-aware decisions" in supporting copy, and includes microcopy stating "Primary structural evidence workflow. Raman, FTIR, XPS, and literature layers provide validation context."

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

Property 2: Preservation - Non-Display-Copy Behavior

_For any_ input that is NOT user-facing display copy (route IDs, project IDs, dataset IDs, file IDs, query params, code identifiers, internal data structures, build process, git diff check, locked context, unsupported projects, report exports, notebook saves, processing results), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for non-display-copy interactions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/data/workflowPipeline.ts`

**Function**: `CLAIM_BOUNDARY` constant

**Specific Changes**:
1. **Separate XPS from Raman/FTIR**: Replace `'Cross-technique convergence with Raman/XPS context'` in `supported` array with two separate entries:
   - Add `'Contextual: Raman/FTIR support features'` to `contextual` array (or keep in `supported` with clearer wording)
   - Add `'Pending: XPS surface-state validation'` to `pending` array

2. **Update SBA-15 Claim Boundary**: Apply the same separation to `getProjectClaimBoundary()` for the SBA-15 project

**File**: `src/engines/fusionEngine/fusionEngine.ts`

**Function**: `evaluate()` return statement

**Specific Changes**:
1. **Qualify Fusion Interpretation**: Replace `'Convergent multi-technique evidence supports spinel ferrite structure with characteristic vibrational and diffraction signatures.'` with `'Linked XRD, Raman, and FTIR evidence supports a spinel-ferrite working interpretation, while XPS surface-state validation remains under review.'`

2. **Add Validation-Limited Framing**: Replace `'Proceed with spinel ferrite structural assignment for downstream analysis and reporting.'` with `'Use spinel ferrite assignment as a working interpretation; phase purity and surface-state claims remain validation-limited.'`

3. **Update Status Line**: Ensure any status line displays `'Preliminary interpretation: CuFe₂O₄-related spinel ferrite evidence, validation required'` with proper subscripts and validation qualifier

**File**: `src/pages/MultiTechWorkspace.tsx`

**Function**: `generateDecision()` and related copy functions

**Specific Changes**:
1. **Update Spinel Ferrite Decision**: Replace `'Proceed with spinel ferrite structural assignment for downstream analysis and reporting.'` with `'Use spinel ferrite assignment as a working interpretation; phase purity and surface-state claims remain validation-limited.'`

2. **Update Project-Level Decision**: Replace `'Proceed with spinel ferrite structural assignment for ${projectName}. Recommend validation experiments to confirm surface vs bulk consistency and assess impact of surface species on functional properties.'` with `'Use spinel ferrite assignment as a working interpretation for ${projectName}; phase purity and surface-state claims remain validation-limited. Recommend validation experiments to confirm surface vs bulk consistency.'`

3. **Update Fallback Copy**: Replace any fallback copy that uses "Convergent multi-technique evidence supports spinel ferrite structure" with "Linked XRD, Raman, and FTIR evidence supports a spinel-ferrite working interpretation, while XPS surface-state validation remains under review."

**File**: `src/components/landing/HeroSection.tsx`

**Function**: Hero section JSX

**Specific Changes**:
1. **Update Hero Tagline**: Replace `"From Fragmented Workflows to Unified Scientific Decisions"` (current) or `"From experimental signal to evidence-linked interpretation"` (if found) with `"From Fragmented Workflows to Unified Scientific Decisions"` (keep current) and ensure supporting copy emphasizes validation-aware decisions

2. **Update Supporting Copy**: Replace `"DIFARYX integrates multi-technique data, eliminates manual workflows, and enables controllable, reproducible scientific analysis."` with `"DIFARYX integrates multi-technique data, eliminates manual workflows, and enables validation-aware, reproducible scientific decisions."`

**File**: `src/pages/AgentDemo.tsx` or related Agent Mode components

**Function**: XRD scenario title or description

**Specific Changes**:
1. **Add Agent Mode Microcopy**: Add explanatory text near the XRD scenario title stating: `"Primary structural evidence workflow. Raman, FTIR, XPS, and literature layers provide validation context."`

**File**: All user-facing display copy files

**Function**: Any JSX or string literals displaying chemical formulas

**Specific Changes**:
1. **Apply Unicode Subscripts**: Replace plain text chemical formulas like `"CuFe2O4"`, `"Fe3O4"`, `"NiFe2O4"`, `"CoFe2O4"` with proper Unicode subscripts: `"CuFe₂O₄"`, `"Fe₃O₄"`, `"NiFe₂O₄"`, `"CoFe₂O₄"`

2. **Preserve Plain Text in Code**: Do NOT modify route IDs, project IDs, dataset IDs, file IDs, query params, or code identifiers—these must remain plain text

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug BEFORE implementing the fix, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Manually inspect the current copy in the specified files and routes to observe the bug manifestations. Document the exact current wording before making changes.

**Test Cases**:
1. **Notebook Claim Boundary Test**: Navigate to `/notebook?project=cu-fe2o4-spinel` and inspect the claim boundary section (will show bug: "Cross-technique convergence with Raman/XPS context" as "Supported")
2. **Cross-Tech Evidence Review Test**: Navigate to `/workspace/multi?project=cu-fe2o4-spinel` and inspect the interpretation copy (will show bug: "Convergent multi-technique evidence supports spinel ferrite structure" without XPS qualifier)
3. **Landing Hero Test**: Navigate to `/` and inspect the hero tagline (will show bug: lacks "validation-aware" emphasis)
4. **Agent Mode Test**: Navigate to `/demo/agent?project=cu-fe2o4-spinel` and inspect the XRD scenario title (will show bug: lacks explanatory microcopy)
5. **Chemical Formula Test**: Search all user-facing copy for plain text "CuFe2O4" (will show bug: plain text instead of subscripts)

**Expected Counterexamples**:
- Claim boundary lists XPS as "supported" when it should be "pending"
- Fusion interpretation overclaims without XPS validation qualifier
- Fusion recommendation lacks "working interpretation" or "validation-limited" language
- Landing hero lacks "validation-aware" emphasis
- Agent mode lacks explanatory microcopy
- Chemical formulas display as plain text instead of Unicode subscripts

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedCopy(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Test Plan**: After implementing the fix, manually verify each changed file and route to confirm the new wording is correct.

**Test Cases**:
1. **Notebook Claim Boundary Verification**: Navigate to `/notebook?project=cu-fe2o4-spinel` and verify claim boundary shows "Contextual: Raman/FTIR support features" and "Pending: XPS surface-state validation" separately
2. **Cross-Tech Evidence Review Verification**: Navigate to `/workspace/multi?project=cu-fe2o4-spinel` and verify interpretation copy states "Linked XRD, Raman, and FTIR evidence supports a spinel-ferrite working interpretation, while XPS surface-state validation remains under review"
3. **Fusion Recommendation Verification**: Verify recommendation copy states "Use spinel ferrite assignment as a working interpretation; phase purity and surface-state claims remain validation-limited"
4. **Landing Hero Verification**: Navigate to `/` and verify supporting copy includes "validation-aware" language
5. **Agent Mode Verification**: Navigate to `/demo/agent?project=cu-fe2o4-spinel` and verify XRD scenario includes microcopy "Primary structural evidence workflow. Raman, FTIR, XPS, and literature layers provide validation context."
6. **Chemical Formula Verification**: Search all user-facing copy and verify chemical formulas display as "CuFe₂O₄", "Fe₃O₄", "NiFe₂O₄", "CoFe₂O₄" with proper Unicode subscripts

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-display-copy interactions, then verify the same behavior continues after fix.

**Test Cases**:
1. **Build Preservation**: Run `npm.cmd run build` before and after fix, verify both succeed without errors
2. **Git Diff Preservation**: Run `git diff --check` before and after fix, verify both pass without whitespace errors
3. **Route Preservation**: Navigate to all routes (`/`, `/dashboard`, `/workspace`, `/workspace/multi`, `/demo/agent`, `/notebook`, `/history`) before and after fix, verify all render without breaking
4. **Route ID Preservation**: Verify route IDs, project IDs, dataset IDs, file IDs, query params continue to use plain text chemical formulas (e.g., `?project=cu-fe2o4-spinel` not `?project=cu-fe₂o₄-spinel`)
5. **Locked Context Preservation**: Navigate to projects with locked context, verify existing copy is preserved without weakening claim boundaries
6. **Unsupported Project Preservation**: Navigate to unsupported projects, verify they do not inherit CuFe₂O₄ evidence or locked context
7. **Export Preservation**: Export reports, save notebook entries, generate processing results before and after fix, verify deterministic demo behavior is maintained
8. **Layout Preservation**: Verify Notebook, Agent Demo, History, and Report sections maintain all existing layouts and export behavior

### Unit Tests

- Test claim boundary structure in `workflowPipeline.ts` to verify XPS is separated into "contextual" and "pending"
- Test fusion interpretation copy in `fusionEngine.ts` to verify XPS validation qualifier is present
- Test fusion recommendation copy in `fusionEngine.ts` to verify "working interpretation" and "validation-limited" language is present
- Test landing hero copy in `HeroSection.tsx` to verify "validation-aware" language is present
- Test agent mode microcopy in `AgentDemo.tsx` to verify explanatory text is present
- Test chemical formula display to verify Unicode subscripts are used in user-facing copy
- Test route IDs, project IDs, dataset IDs, file IDs, query params to verify plain text chemical formulas are preserved

### Property-Based Tests

- Generate random navigation paths and verify all routes continue to render without breaking
- Generate random project selections and verify claim boundaries display consistent validation-limited language
- Generate random export operations and verify deterministic demo behavior is maintained

### Integration Tests

- Test full workflow from landing page → dashboard → workspace → multi-tech → notebook → export
- Test switching between projects and verify claim boundaries update correctly
- Test that visual feedback and layout remain unchanged across all routes
