# Implementation Plan

## Overview

This task list implements the fusion-engine-full-integration bugfix using the bug condition methodology. The workflow follows: Explore → Preserve → Implement → Validate.

---

## Tasks

- [x] 1. Audit and confirm active inconsistencies
  - **Property 1: Bug Condition** - Parallel Reasoning Systems Exist
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate components bypass fusionEngine
  - **Scoped PBT Approach**: Manually inspect each component in browser to verify parallel reasoning exists
  - Navigate to `/workspace/multi` and trigger fusion reasoning (expect custom reasoning output on unfixed code)
  - Navigate to `/workspace/xrd` and run agent analysis (expect confidence percentage display on unfixed code)
  - Navigate to `/workspace/xps` and view chemical state (expect scientificSummary display on unfixed code)
  - Navigate to `/demo/agent` and hover over evidence (expect "Agent Thinking" text on unfixed code)
  - Run `npm run build` to verify current state compiles
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - MultiTechWorkspace displays custom claim/evidence structure instead of FusionResult
    - XRDWorkspace displays "93.3%" confidence instead of decision status
    - XPSWorkspace displays "CAVEATS" instead of "Limitations"
    - RightPanel shows "Agent Thinking" instead of "Scientific Reasoning"
  - Mark task complete when inspection is done, failures are documented, and root cause is confirmed
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Reasoning Operations Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (operations that don't involve reasoning display)
  - Test graph rendering in all workspaces (XRD, XPS, FTIR, Raman, Multi-tech)
  - Test navigation between routes (`/`, `/dashboard`, `/demo/agent`, `/workspace/*`, `/notebook`, `/history`, `/settings`)
  - Test AgentDemo continues to use fusionEngine correctly (already integrated)
  - Test Dashboard continues to show "Supported" status labels
  - Test NotebookLab continues to use "Scientific Reasoning Summary" terminology
  - Test data loading and localStorage persistence
  - Test export functionality for notebooks and reports
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15_

- [x] 3. MultiTechWorkspace fusionEngine alignment

  - [x] 3.1 Add EvidenceNode conversion function
    - Create `convertCrossTechEvidenceToNodes()` function in MultiTechWorkspace
    - Map `technique` field directly from CrossTechEvidence
    - Map `position` to `x` field
    - Map `unit` field directly
    - Map `label` field directly
    - Generate unique `id` from technique + position
    - _Bug_Condition: isBugCondition(MultiTechWorkspace, reasoning) where usesCustomReasoningFunctions() returns true_
    - _Expected_Behavior: Component calls fusionEngine.evaluate() with EvidenceNode array_
    - _Preservation: Graph rendering, navigation, and data loading remain unchanged_
    - _Requirements: 1.1, 1.3, 2.1, 2.3_

  - [x] 3.2 Replace runFusionReasoning with fusionEngine call
    - Replace `runFusionReasoning()` body with fusionEngine.evaluate() call
    - Convert demo evidence to EvidenceNode array using conversion function
    - Call `fusionEngine.evaluate({ evidence })`
    - Return FusionResult directly
    - Keep existing CrossTechEvidence demo data structure for deterministic behavior
    - _Bug_Condition: isBugCondition(MultiTechWorkspace, reasoning) where usesCustomReasoningFunctions() returns true_
    - _Expected_Behavior: Component uses fusionEngine as single reasoning authority_
    - _Preservation: Demo data structure and deterministic behavior unchanged_
    - _Requirements: 1.1, 2.1, 2.3_

  - [x] 3.3 Update display logic to render FusionResult
    - Replace custom claim display with `FusionResult.conclusion`
    - Replace evidence list with `FusionResult.basis`
    - Replace cross-tech review with `FusionResult.crossTech`
    - Replace caveats with `FusionResult.limitations`
    - Replace decision with `FusionResult.decision`
    - Use `FusionResult.reasoningTrace` instead of `generateReasoningTrace()`
    - _Bug_Condition: isBugCondition(MultiTechWorkspace, display) where showsCustomReviewOutput() returns true_
    - _Expected_Behavior: Component displays FusionResult structure_
    - _Preservation: Layout structure and graph display remain unchanged_
    - _Requirements: 1.2, 1.4, 2.2, 2.4_

  - [x] 3.4 Run build verification
    - Run `npm run build` to verify TypeScript compilation
    - Fix any type errors that arise
    - Verify no runtime errors in browser
    - _Requirements: 3.14_

- [x] 4. xrdAgent + XRDWorkspace FusionResult compatibility

  - [x] 4.1 Add fusionResult field to XrdAgentResult interface
    - Open `src/agents/xrdAgent/types.ts`
    - Add optional `fusionResult?: FusionResult` field to XrdAgentResult interface
    - Keep existing XrdInterpretation for backward compatibility
    - Import FusionResult type from fusionEngine
    - _Bug_Condition: isBugCondition(xrdAgent, output) where returnsXrdInterpretationInsteadOfFusionResult() returns true_
    - _Expected_Behavior: xrdAgent output includes FusionResult structure_
    - _Preservation: Existing XrdInterpretation fields remain for backward compatibility_
    - _Requirements: 1.10, 1.11, 2.10, 2.11_

  - [x] 4.2 Generate FusionResult in xrdAgent runner
    - Open `src/agents/xrdAgent/runner.ts` (or equivalent execution file)
    - After generating XrdInterpretation, convert to FusionResult
    - Map `interpretation.decision` to `FusionResult.conclusion`
    - Map `interpretation.evidence` to `FusionResult.basis`
    - Generate `FusionResult.crossTech` from single-technique context
    - Map `interpretation.caveats` to `FusionResult.limitations`
    - Map `interpretation.decision` to `FusionResult.decision`
    - Generate `reasoningTrace` with single claim status
    - Set `highlightedEvidenceIds` from matched peaks
    - Add fusionResult to result object alongside interpretation
    - _Bug_Condition: isBugCondition(xrdAgent, output) where returnsXrdInterpretationInsteadOfFusionResult() returns true_
    - _Expected_Behavior: xrdAgent returns both XrdInterpretation and FusionResult_
    - _Preservation: XrdInterpretation generation unchanged for backward compatibility_
    - _Requirements: 1.10, 2.10, 2.11_

  - [x] 4.3 Update XRDWorkspace to use FusionResult
    - Open `src/pages/XRDWorkspace.tsx`
    - Add check for `agentResult.fusionResult` field first, fall back to `agentResult.interpretation`
    - When using fusionResult, replace confidence percentage display with decision status label
    - Remove `confidenceScore.toFixed(1)}%` display (line 594)
    - Remove `confidenceClass(confidenceLevel)` styling (line 594)
    - Add decision status label from `FusionResult.decision`
    - Map decision text to status: "Supported", "Working hypothesis", "Requires validation"
    - Replace `interpretation.evidence` with `FusionResult.basis` (line 667)
    - Replace `interpretation.caveats` with `FusionResult.limitations` (line 756)
    - Keep same UI layout structure
    - _Bug_Condition: isBugCondition(XRDWorkspace, display) where showsConfidencePercentage() returns true_
    - _Expected_Behavior: XRDWorkspace displays decision status labels instead of confidence percentages_
    - _Preservation: Graph display and layout structure unchanged_
    - _Requirements: 1.5, 1.6, 1.7, 2.5, 2.6, 2.7_

  - [x] 4.4 Run build verification
    - Run `npm run build` to verify TypeScript compilation
    - Fix any type errors that arise
    - Test XRDWorkspace in browser to verify decision status display
    - _Requirements: 3.14_

- [x] 5. XPSWorkspace terminology and fusionEngine alignment

  - [x] 5.1 Add EvidenceNode conversion for XPS data
    - Create function to convert XPS processing result to EvidenceNode format
    - Map peak positions to `EvidenceNode.x`
    - Map binding energy unit to `EvidenceNode.unit`
    - Map peak labels to `EvidenceNode.label`
    - Set `technique` to 'XPS'
    - Generate unique `id` for each peak
    - _Bug_Condition: isBugCondition(XPSWorkspace, display) where usesScientificSummaryInsteadOfFusionEngine() returns true_
    - _Expected_Behavior: XPSWorkspace converts data to EvidenceNode format_
    - _Preservation: Processing logic and graph rendering unchanged_
    - _Requirements: 1.8, 2.8_

  - [x] 5.2 Call fusionEngine after processing
    - After XPS processing completes, convert peaks to EvidenceNode array
    - Call `fusionEngine.evaluate({ evidence })`
    - Store FusionResult in component state
    - _Bug_Condition: isBugCondition(XPSWorkspace, display) where usesScientificSummaryInsteadOfFusionEngine() returns true_
    - _Expected_Behavior: XPSWorkspace uses fusionEngine as reasoning authority_
    - _Preservation: Background subtraction, peak fitting unchanged_
    - _Requirements: 1.8, 2.8_

  - [x] 5.3 Update display to render FusionResult
    - Replace `chemicalStateInterpretation` (line 141) with `FusionResult.conclusion`
    - Replace scientificSummary display (line 589) with FusionResult rendering
    - Replace "CAVEATS" section (line 661) with "Limitations" using `FusionResult.limitations`
    - Add `FusionResult.basis` display for evidence
    - Keep same UI layout structure
    - _Bug_Condition: isBugCondition(XPSWorkspace, display) where usesScientificSummaryInsteadOfFusionEngine() returns true_
    - _Expected_Behavior: XPSWorkspace displays FusionResult with correct terminology_
    - _Preservation: Layout structure and graph display unchanged_
    - _Requirements: 1.8, 1.9, 2.8, 2.9_

  - [x] 5.4 Run build verification
    - Run `npm run build` to verify TypeScript compilation
    - Fix any type errors that arise
    - Test XPSWorkspace in browser to verify "Limitations" terminology
    - _Requirements: 3.14_

- [x] 6. Final UI wording cleanup + build verification

  - [x] 6.1 Update RightPanel text reference
    - Open `src/components/agent-demo/RightPanel/RightPanel.tsx`
    - Find line 1234 with "Agent Thinking → Scientific Determination"
    - Replace with "Scientific Reasoning → Scientific Determination"
    - _Bug_Condition: isBugCondition(RightPanel, display) where showsAgentThinkingText() returns true_
    - _Expected_Behavior: RightPanel shows "Scientific Reasoning" terminology_
    - _Preservation: All other RightPanel functionality unchanged_
    - _Requirements: 1.13, 2.13_

  - [x] 6.2 Deprecate legacy modules
    - Open `src/scientific/insightEngine.ts`
    - Add JSDoc comment: `@deprecated This module is deprecated. Use fusionEngine instead.`
    - Open `src/scientific/useScientificEngine.ts`
    - Add JSDoc comment: `@deprecated This hook is deprecated. Use fusionEngine directly.`
    - Open `src/scientific/types.ts`
    - Add JSDoc comment to ScientificInsight: `@deprecated This type is deprecated. Use FusionResult from fusionEngine instead.`
    - Do NOT remove any code - keep for backward compatibility
    - _Bug_Condition: isBugCondition(codebase, scan) where containsUnusedLegacyModules() returns true_
    - _Expected_Behavior: Legacy modules marked as deprecated_
    - _Preservation: No code removed, backward compatibility maintained_
    - _Requirements: 1.12, 2.12_

  - [x] 6.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - FusionEngine Single Authority
    - **IMPORTANT**: Re-run the SAME inspection from task 1 - do NOT write a new test
    - Navigate to `/workspace/multi` and verify fusion reasoning uses fusionEngine (expect FusionResult display)
    - Navigate to `/workspace/xrd` and verify agent analysis shows decision status (expect "Supported" label)
    - Navigate to `/workspace/xps` and verify chemical state uses fusionEngine (expect "Limitations" section)
    - Navigate to `/demo/agent` and verify evidence hint shows correct text (expect "Scientific Reasoning")
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13_

  - [x] 6.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Reasoning Operations Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Verify graph rendering in all workspaces
    - Verify navigation between all routes
    - Verify AgentDemo continues to work correctly
    - Verify Dashboard continues to show status labels
    - Verify NotebookLab continues to use scientific terminology
    - Verify data loading and localStorage persistence
    - Verify export functionality
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15_

  - [x] 6.5 Final build verification
    - Run `npm run build` to verify complete project compiles
    - Fix any remaining TypeScript errors
    - Test all routes in browser for runtime errors
    - Verify no confidence percentages displayed anywhere
    - Verify all reasoning uses fusionEngine structure
    - _Requirements: 3.14, 3.15_

- [x] 7. Checkpoint - Ensure all tests pass
  - Verify all exploration tests pass (fusionEngine integration confirmed)
  - Verify all preservation tests pass (no regressions)
  - Verify build succeeds with no errors
  - Verify all routes work correctly in browser
  - Ask user if questions arise or additional verification needed
