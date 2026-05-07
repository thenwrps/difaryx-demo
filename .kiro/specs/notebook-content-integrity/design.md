# Notebook Content Integrity Bugfix Design

## Overview

The DIFARYX Notebook Lab contains hardcoded content that creates incorrect scientific implications. This bugfix corrects wording in the `getProjectNotebookContent()` function and related data structures to ensure:
- CuFe₂O₄/SBA-15 supported samples are described with supported-sample language, not pure/bulk CuFe₂O₄ language
- Key Evidence rows are distinct and technique-specific rather than repetitive
- Technical Trace labels use deterministic terminology (e.g., "interpretation_refinement") instead of live-model labels (e.g., "gemini_reasoner")
- Validation boundaries and claim strength are clearly communicated
- Source context preservation is explicitly stated

This is a minimal wording correction bugfix. No new components, routes, dependencies, or architectural changes are introduced.

## Glossary

- **Bug_Condition (C)**: The condition that triggers incorrect scientific wording - when notebook content is displayed for CuFe₂O₄/SBA-15 or when Technical Trace labels imply live model execution
- **Property (P)**: The desired behavior - notebook content uses supported-sample language, distinct technique-specific evidence, and deterministic trace labels
- **Preservation**: Existing Notebook Lab layout, routes, Agent handoff, History, Report/export behavior, and deterministic demo flow that must remain unchanged
- **getProjectNotebookContent()**: The function in `src/pages/NotebookLab.tsx` (lines 129-195) that returns hardcoded notebook content for demo projects
- **DETERMINISTIC_TRACE**: The array in `src/pages/NotebookLab.tsx` (lines 82-92) that defines the technical trace steps shown in the notebook
- **sanitizeTraceStep()**: The function in `src/pages/NotebookLab.tsx` (lines 251-256) that replaces legacy model labels with deterministic labels
- **supportingData**: The array of technique-specific evidence rows in the notebook content structure

## Bug Details

### Bug Condition

The bug manifests when notebook content is displayed for any project, particularly CuFe₂O₄/SBA-15. The `getProjectNotebookContent()` function returns hardcoded content that either uses pure/bulk CuFe₂O₄ language for supported samples, contains repetitive Key Evidence rows, or includes legacy model labels in the Technical Trace.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { projectId: string, displayContext: 'notebook' | 'export' }
  OUTPUT: boolean
  
  RETURN (input.projectId === 'cufe2o4-sba15' AND containsPureBulkLanguage(input))
         OR (input.displayContext === 'notebook' AND hasRepetitiveEvidence(input))
         OR (technicalTraceContains('gemini_reasoner'))
         OR (missingValidationBoundaryLanguage(input))
END FUNCTION
```

### Examples

**Example 1: CuFe₂O₄/SBA-15 Pure/Bulk Language**
- **Current (incorrect)**: "XRD Phase Identification: Supported CuFe₂O₄ spinel ferrite reflections in the CuFe₂O₄/SBA-15 sample"
- **Expected (correct)**: "XRD Phase Identification: Supported CuFe₂O₄ spinel ferrite reflections in the CuFe₂O₄/SBA-15 sample, with validation boundaries for dispersion, loading, support interaction, and surface oxidation state."

**Example 2: Repetitive Key Evidence**
- **Current (incorrect)**: Three evidence rows all say "XRD reflections assigned to CuFe₂O₄ remain visible"
- **Expected (correct)**: 
  - "XRD reflections assigned to CuFe₂O₄ remain visible in the supported CuFe₂O₄/SBA-15 sample."
  - "Raman vibrational modes provide supporting evidence for ferrite-like local structure."
  - "FTIR silica/support features contextualize the SBA-15 matrix but do not independently prove ferrite phase purity."

**Example 3: Legacy Model Label in Technical Trace**
- **Current (incorrect)**: DETERMINISTIC_TRACE includes "gemini_reasoner" or similar live-model labels
- **Expected (correct)**: DETERMINISTIC_TRACE uses "interpretation_refinement" or other deterministic labels

**Example 4: Missing Validation Boundary Language**
- **Current (incorrect)**: "The processed evidence supports CuFe₂O₄ spinel ferrite reflections."
- **Expected (correct)**: "The processed evidence supports CuFe₂O₄ spinel ferrite reflections in the CuFe₂O₄/SBA-15 sample, consistent with dispersed copper ferrite on mesoporous SBA-15. Phase distribution, loading uniformity, surface oxidation state, and support interaction remain validation-limited."

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Notebook Lab layout with experiments sidebar, template mode selection, and report sections must continue to work
- Agent Demo → Notebook handoff must preserve agent run context
- XRD/XPS/FTIR/Raman workspace → Notebook handoff must preserve workspace processing results
- Export (Markdown, PNG) and Print functionality must continue to work
- Share link generation must continue to work
- History view must continue to show previous runs
- All existing routes must continue to render correctly
- `npm.cmd run build` must pass without errors
- Demo projects data structure and localStorage persistence must remain unchanged

**Scope:**
All inputs that do NOT involve displaying notebook content (e.g., navigating to workspace, viewing history, changing settings) should be completely unaffected by this fix. This includes:
- Dashboard project cards and graph previews
- Workspace processing controls and graph rendering
- Agent Demo execution flow and evidence display
- Settings page and profile management

## Hypothesized Root Cause

Based on the bug description and code inspection, the most likely issues are:

1. **Hardcoded Content in getProjectNotebookContent()**: The function at lines 129-195 in `src/pages/NotebookLab.tsx` contains hardcoded strings that use pure/bulk CuFe₂O₄ language instead of supported-sample language for the CuFe₂O₄/SBA-15 project.

2. **Repetitive Evidence Rows**: The `supportingData` array in the returned object contains evidence rows that are not sufficiently distinct or technique-specific.

3. **Legacy Model Labels in DETERMINISTIC_TRACE**: The `DETERMINISTIC_TRACE` array at lines 82-92 may contain legacy labels, and the `sanitizeTraceStep()` function at lines 251-256 attempts to replace them but may not cover all cases.

4. **Missing Validation Boundary Language**: The `summary`, `discussion`, and `reportPreview` strings in the returned object do not consistently include validation-aware wording.

## Correctness Properties

Property 1: Bug Condition - Supported Sample Language for CuFe₂O₄/SBA-15

_For any_ notebook content display where the project is CuFe₂O₄/SBA-15, the fixed getProjectNotebookContent function SHALL return content that uses supported-sample language (e.g., "CuFe₂O₄ spinel ferrite reflections in the CuFe₂O₄/SBA-15 sample, consistent with dispersed copper ferrite on mesoporous SBA-15") and SHALL NOT use pure/bulk CuFe₂O₄ language without support context.

**Validates: Requirements 2.1, 2.6**

Property 2: Bug Condition - Distinct Technique-Specific Evidence

_For any_ notebook content display, the fixed getProjectNotebookContent function SHALL return Key Evidence rows that are distinct and technique-specific, with each row clearly stating the technique (XRD, Raman, FTIR, XPS) and its specific contribution to the evidence base.

**Validates: Requirements 2.2**

Property 3: Bug Condition - Deterministic Technical Trace Labels

_For any_ Technical Trace display, the fixed DETERMINISTIC_TRACE array and sanitizeTraceStep function SHALL use deterministic labels (e.g., "interpretation_refinement", "evidence_reasoning_step") and SHALL NOT display live-model labels (e.g., "gemini_reasoner", "Gemini reasoner") in the final rendered output.

**Validates: Requirements 2.3**

Property 4: Bug Condition - Validation Boundary Language

_For any_ notebook content display, the fixed getProjectNotebookContent function SHALL include validation-aware wording in summary, discussion, and reportPreview strings that explicitly states validation boundaries and claim strength limitations.

**Validates: Requirements 2.4, 2.5**

Property 5: Preservation - Notebook Layout and Navigation

_For any_ user interaction that does NOT involve displaying notebook content (e.g., navigating to workspace, viewing history, changing template mode), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing layout, navigation, and interaction patterns.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.11, 3.12**

Property 6: Preservation - Export and Report Functionality

_For any_ export or report action (Markdown, PNG, Print, Share), the fixed code SHALL produce the same functionality as the original code, with the only difference being the corrected wording in the exported content.

**Validates: Requirements 3.7, 3.8, 3.9, 3.10**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/pages/NotebookLab.tsx`

**Function**: `getProjectNotebookContent(projectId: string)` (lines 129-195)

**Specific Changes**:

1. **CuFe₂O₄/SBA-15 Summary String** (line ~134):
   - **Current**: `'XRD Phase Identification: Supported CuFe2O4 spinel ferrite reflections in the CuFe2O4/SBA-15 sample, with validation boundaries for dispersion, loading, support interaction, and surface oxidation state.'`
   - **Change**: Verify this string already includes validation boundaries; if not, add them explicitly

2. **CuFe₂O₄/SBA-15 Discussion String** (line ~136):
   - **Current**: `'The processed evidence supports CuFe2O4 spinel ferrite reflections in the CuFe2O4/SBA-15 sample, consistent with dispersed copper ferrite on mesoporous SBA-15. Phase distribution, loading uniformity, surface oxidation state, and support interaction remain validation-limited.'`
   - **Change**: Verify this string uses supported-sample language and validation-limited framing

3. **CuFe₂O₄/SBA-15 Report Preview String** (line ~138):
   - **Current**: `'The processed evidence supports CuFe2O4 spinel ferrite reflections in the CuFe2O4/SBA-15 sample. Supporting Raman evidence is consistent with ferrite-like local symmetry, while FTIR contextualizes the silica support environment. The interpretation should remain framed as validation-limited because phase distribution, support interaction, loading uniformity, and surface oxidation-state assignment require additional validation.'`
   - **Change**: Verify this string explicitly states validation-limited framing and does not imply pure/bulk CuFe₂O₄

4. **CuFe₂O₄/SBA-15 Key Evidence Array** (lines ~140-144):
   - **Current**: Three strings that may be repetitive
   - **Change**: Replace with distinct technique-specific evidence:
     - "XRD reflections assigned to CuFe₂O₄ remain visible in the supported CuFe₂O₄/SBA-15 sample."
     - "Raman vibrational modes provide supporting evidence for ferrite-like local structure."
     - "FTIR silica/support features contextualize the SBA-15 matrix but do not independently prove ferrite phase purity."

5. **CuFe₂O₄/SBA-15 Supporting Data Array** (lines ~145-170):
   - **Current**: Four objects with technique, evidence, strength, dataset, caveat
   - **Change**: Verify each evidence string is distinct and technique-specific:
     - XRD: "CuFe₂O₄-assigned reflections remain visible in the supported sample"
     - Raman: "Ferrite-like vibrational modes support local spinel symmetry"
     - FTIR: "Silica/support bands contextualize the SBA-15 matrix"
     - XPS: "Surface oxidation-state assignment remains under review"

6. **CuFe₂O₄ Spinel Key Evidence Array** (lines ~185-189):
   - **Current**: Three strings that may be repetitive
   - **Change**: Verify each string is distinct and technique-specific

7. **DETERMINISTIC_TRACE Array** (lines 82-92):
   - **Current**: May contain legacy model labels
   - **Change**: Verify all labels are deterministic (e.g., "interpretation_refinement" instead of "gemini_reasoner")

8. **sanitizeTraceStep() Function** (lines 251-256):
   - **Current**: Replaces "gemini_reasoner" with "interpretation_refinement"
   - **Change**: Verify this function covers all legacy model labels that may appear in the trace

### Additional Verification Points

9. **workflowPipeline.ts Consistency**: Verify that the discussion drafts in `src/data/workflowPipeline.ts` (lines ~115-120 for SBA15_RESEARCH_DISCUSSION_DRAFT) use consistent supported-sample language

10. **Export Markdown Function**: Verify that the `exportMarkdown()` function (lines ~407-450) uses the corrected content from `getProjectNotebookContent()`

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Manually inspect the Notebook Lab UI for the CuFe₂O₄/SBA-15 project and verify that the current content uses pure/bulk language, has repetitive evidence, or shows legacy model labels. Run the app on the UNFIXED code to observe the defects.

**Test Cases**:
1. **CuFe₂O₄/SBA-15 Summary Test**: Navigate to `/notebook?project=cufe2o4-sba15` and verify the summary uses pure/bulk language (will fail on unfixed code)
2. **Key Evidence Repetition Test**: Navigate to `/notebook?project=cufe2o4-sba15` and verify Key Evidence rows are repetitive (will fail on unfixed code)
3. **Technical Trace Label Test**: Navigate to `/notebook?project=cufe2o4-sba15` and verify Technical Trace shows "gemini_reasoner" (will fail on unfixed code)
4. **Markdown Export Test**: Export Markdown report and verify it contains pure/bulk language (will fail on unfixed code)

**Expected Counterexamples**:
- Summary, discussion, and report preview strings use pure/bulk CuFe₂O₄ language without support context
- Key Evidence rows are repetitive and not technique-specific
- Technical Trace displays "gemini_reasoner" or similar live-model labels
- Possible causes: hardcoded strings in getProjectNotebookContent(), incomplete sanitizeTraceStep() coverage

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := getProjectNotebookContent_fixed(input.projectId)
  ASSERT expectedBehavior(result)
END FOR
```

**Test Cases**:
1. **CuFe₂O₄/SBA-15 Supported Sample Language**: Verify summary, discussion, and reportPreview use supported-sample language
2. **Distinct Technique-Specific Evidence**: Verify keyEvidence and supportingData arrays contain distinct technique-specific rows
3. **Deterministic Technical Trace**: Verify DETERMINISTIC_TRACE and sanitizeTraceStep() produce deterministic labels
4. **Validation Boundary Language**: Verify all content strings include validation-aware wording

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT getProjectNotebookContent_original(input) = getProjectNotebookContent_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-CuFe₂O₄/SBA-15 projects and non-notebook routes, then verify the fixed code produces identical behavior.

**Test Cases**:
1. **CuFe₂O₄ Spinel Project Preservation**: Verify notebook content for `cu-fe2o4-spinel` project is unchanged (or only improved with validation language)
2. **Dashboard Navigation Preservation**: Verify navigating to `/dashboard` works identically
3. **Workspace Navigation Preservation**: Verify navigating to `/workspace/xrd?project=cufe2o4-sba15` works identically
4. **Agent Demo Preservation**: Verify navigating to `/demo/agent?project=cufe2o4-sba15` works identically
5. **Export Functionality Preservation**: Verify PNG export, Print, and Share link generation work identically
6. **Build Preservation**: Verify `npm.cmd run build` passes without errors

### Unit Tests

- Test `getProjectNotebookContent('cufe2o4-sba15')` returns supported-sample language
- Test `getProjectNotebookContent('cu-fe2o4-spinel')` returns appropriate language for pure sample
- Test `sanitizeTraceStep('gemini_reasoner')` returns 'interpretation_refinement'
- Test Key Evidence arrays contain distinct technique-specific strings

### Property-Based Tests

- Generate random project IDs and verify notebook content structure is valid
- Generate random navigation paths and verify routes render correctly
- Test that all non-notebook routes continue to work across many scenarios

### Integration Tests

- Test full notebook flow: Dashboard → Notebook → Export Markdown
- Test Agent → Notebook handoff preserves agent run context
- Test Workspace → Notebook handoff preserves processing results
- Test template mode switching updates content correctly
