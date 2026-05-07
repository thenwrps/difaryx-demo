# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Notebook Content Wording Verification
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate incorrect wording exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design
  - The test assertions should match the Expected Behavior Properties from design
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Notebook Layout and Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14_

- [x] 3. Fix for notebook content wording

  - [x] 3.1 Verify current wording in getProjectNotebookContent()
    - Review CuFe₂O₄/SBA-15 summary, discussion, and reportPreview strings
    - Review keyEvidence array for distinct technique-specific evidence
    - Review supportingData array for distinct technique-specific evidence
    - Review CuFe₂O₄ Spinel keyEvidence array for distinct technique-specific evidence
    - _Bug_Condition: isBugCondition(input) where input.projectId === 'cufe2o4-sba15' AND containsPureBulkLanguage(input) OR hasRepetitiveEvidence(input) OR technicalTraceContains('gemini_reasoner') OR missingValidationBoundaryLanguage(input)_
    - _Expected_Behavior: expectedBehavior(result) from design - uses supported-sample language, distinct technique-specific evidence, deterministic trace labels, and validation boundary language_
    - _Preservation: Preservation Requirements from design - all existing notebook layout, routes, agent handoff, history, report/export behavior, and deterministic demo flow remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.2 Verify DETERMINISTIC_TRACE array
    - Review DETERMINISTIC_TRACE array for legacy model labels
    - Verify sanitizeTraceStep() function covers all legacy model labels
    - _Bug_Condition: technicalTraceContains('gemini_reasoner')_
    - _Expected_Behavior: uses deterministic labels like 'interpretation_refinement'_
    - _Requirements: 2.3_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Notebook Content Wording Verification
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties from design - 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Notebook Layout and Functionality
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Run build validation
  - Run `npm.cmd run build` to verify no build errors
  - Verify build passes without errors
  - _Requirements: 3.11_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
