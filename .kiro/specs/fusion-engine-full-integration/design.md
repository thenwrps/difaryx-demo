# Fusion Engine Full Integration Bugfix Design

## Overview

This bugfix addresses system-level integration inconsistencies where components bypass fusionEngine or use legacy confidence-based reasoning. The fix ensures fusionEngine becomes the single reasoning authority across all workspaces and agents, replacing parallel reasoning systems, confidence displays, and outdated terminology with the unified scientific structure: Claim, Observed, Linked, Cross-check, Limitation, Decision.

The approach is **minimal and focused**: adapt existing components to consume FusionResult structure without rewriting UI layouts or adding new features. Legacy modules that are unused will be deprecated but not removed to avoid breaking changes.

## Glossary

- **Bug_Condition (C)**: Components use parallel reasoning systems, legacy confidence displays, or incompatible output structures instead of fusionEngine
- **Property (P)**: All reasoning flows through fusionEngine.evaluate() and displays FusionResult structure
- **Preservation**: Existing UI layouts, routing, graph displays, and deterministic demo behavior remain unchanged
- **fusionEngine**: The single reasoning authority in `src/engines/fusionEngine/fusionEngine.ts` that evaluates EvidenceNode arrays and returns FusionResult
- **FusionResult**: Output structure with fields: conclusion, basis, crossTech, limitations, decision, reasoningTrace, highlightedEvidenceIds
- **EvidenceNode**: Input structure for fusionEngine with fields: id, technique, x, unit, label, inferredCategory, concept
- **XrdInterpretation**: Legacy output structure from xrdAgent with confidenceScore, confidenceLevel, evidence, conflicts, caveats
- **CrossTechEvidence**: Legacy structure in MultiTechWorkspace for cross-technique reasoning
- **Confidence-based reasoning**: Legacy approach using percentage scores and confidence levels (Low/Medium/High/Very High)
- **Decision status**: Research-grade labels ("Supported", "Working hypothesis", "Requires validation") that replace confidence percentages

## Bug Details

### Bug Condition

The bug manifests when components perform reasoning or display results. The system either bypasses fusionEngine entirely, uses legacy confidence-based logic, or displays incompatible output structures.

**Formal Specification:**
```
FUNCTION isBugCondition(component, operation)
  INPUT: component of type Component, operation of type Operation
  OUTPUT: boolean
  
  RETURN (component == MultiTechWorkspace AND operation == reasoning AND usesCustomReasoningFunctions())
         OR (component == XRDWorkspace AND operation == display AND showsConfidencePercentage())
         OR (component == XPSWorkspace AND operation == display AND usesScientificSummaryInsteadOfFusionEngine())
         OR (component == xrdAgent AND operation == output AND returnsXrdInterpretationInsteadOfFusionResult())
         OR (component == RightPanel AND operation == display AND showsAgentThinkingText())
END FUNCTION
```

### Examples

- **MultiTechWorkspace**: Calls `runFusionReasoning()` and `runCrossTechReview()` instead of fusionEngine.evaluate()
- **XRDWorkspace**: Displays `agentResult.interpretation.confidenceScore.toFixed(1)}%` instead of decision status
- **XPSWorkspace**: Uses `processingResult.scientificSummary` instead of calling fusionEngine
- **xrdAgent**: Returns XrdInterpretation with confidenceScore/confidenceLevel instead of FusionResult structure
- **RightPanel**: Shows "Agent Thinking → Scientific Determination" instead of "Scientific Reasoning → Scientific Determination"

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- AgentDemo continues to use fusionEngine.evaluate() as single reasoning authority
- Dashboard continues to show "Supported" status labels instead of confidence percentages
- NotebookLab continues to use "Scientific Reasoning Summary" terminology
- All graph components remain visible during agent runs and workspace operations
- Routing structure remains unchanged
- Demo remains deterministic without LLM dependencies
- Build compiles successfully with TypeScript type safety

**Scope:**
All inputs that do NOT involve reasoning display or evidence processing should be completely unaffected by this fix. This includes:
- Graph rendering and visualization
- Navigation and routing
- Data loading and persistence
- Export functionality
- Settings and configuration

## Hypothesized Root Cause

Based on the bug description and investigation report, the most likely issues are:

1. **Incremental Refactoring**: fusionEngine was added to AgentDemo but other components were not updated, leaving parallel reasoning systems in place

2. **Type Incompatibility**: xrdAgent outputs XrdInterpretation structure which predates fusionEngine, requiring mapping logic in consuming components

3. **Missing Adapter Layer**: No conversion functions exist to transform legacy structures (CrossTechEvidence, XrdInterpretation) into EvidenceNode format for fusionEngine consumption

4. **UI Display Coupling**: Workspace components directly render interpretation fields (confidenceScore, evidence, caveats) instead of FusionResult fields (decision, basis, limitations)

5. **Legacy Code Retention**: Unused modules (insightEngine, useScientificEngine) remain in codebase as potential confusion sources

## Correctness Properties

Property 1: Bug Condition - FusionEngine Single Authority

_For any_ component that performs reasoning or displays reasoning results, the fixed system SHALL call fusionEngine.evaluate() as the single reasoning authority and render FusionResult structure, eliminating parallel reasoning systems and confidence-based displays.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.13**

Property 2: Preservation - Existing Functionality

_For any_ component operation that does NOT involve reasoning display or evidence processing (graph rendering, navigation, data loading, exports), the fixed system SHALL produce exactly the same behavior as the original system, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/pages/MultiTechWorkspace.tsx`

**Function**: `runFusionReasoning()`, `runCrossTechReview()`, `generateReasoningTrace()`

**Specific Changes**:
1. **Add EvidenceNode Conversion**: Create `convertCrossTechEvidenceToNodes()` function to map CrossTechEvidence to EvidenceNode format
   - Map technique field directly
   - Map position to x field
   - Map unit field directly
   - Map label field directly
   - Generate unique id from technique + position

2. **Replace Custom Reasoning**: Replace `runFusionReasoning()` body with fusionEngine.evaluate() call
   - Convert demo evidence to EvidenceNode array
   - Call fusionEngine.evaluate({ evidence })
   - Return FusionResult directly

3. **Update Display Logic**: Replace custom review output rendering with FusionResult field rendering
   - Replace claim display with FusionResult.conclusion
   - Replace evidence list with FusionResult.basis
   - Replace cross-tech review with FusionResult.crossTech
   - Replace caveats with FusionResult.limitations
   - Replace decision with FusionResult.decision

4. **Preserve Demo Data**: Keep existing CrossTechEvidence demo data structure for deterministic behavior
   - Only convert at reasoning boundary
   - Do not change data loading or storage

5. **Remove Custom Trace Generation**: Use FusionResult.reasoningTrace instead of generateReasoningTrace()

**File**: `src/agents/xrdAgent/types.ts`

**Interface**: `XrdInterpretation`

**Specific Changes**:
1. **Add FusionResult Compatibility**: Add optional fusionResult field to XrdAgentResult
   - Keep existing XrdInterpretation for backward compatibility
   - Add `fusionResult?: FusionResult` field to XrdAgentResult interface
   - This allows gradual migration without breaking existing consumers

**File**: `src/agents/xrdAgent/runner.ts` (or equivalent)

**Function**: xrdAgent execution logic

**Specific Changes**:
1. **Add FusionResult Generation**: After generating XrdInterpretation, convert to FusionResult
   - Map interpretation.decision to FusionResult.conclusion
   - Map interpretation.evidence to FusionResult.basis
   - Generate FusionResult.crossTech from single-technique context
   - Map interpretation.caveats to FusionResult.limitations
   - Map interpretation.decision to FusionResult.decision
   - Generate reasoningTrace with single claim status
   - Set highlightedEvidenceIds from matched peaks

2. **Preserve Existing Output**: Keep XrdInterpretation generation for backward compatibility
   - Do not remove confidenceScore/confidenceLevel fields yet
   - Add fusionResult alongside interpretation in result object

**File**: `src/pages/XRDWorkspace.tsx`

**Function**: Display logic for agent results

**Specific Changes**:
1. **Add FusionResult Display**: Check for fusionResult field first, fall back to interpretation
   - If `agentResult.fusionResult` exists, use it
   - Otherwise, use `agentResult.interpretation` (backward compatibility)

2. **Replace Confidence Display**: When using fusionResult, show decision status instead of percentage
   - Remove `confidenceScore.toFixed(1)}%` display
   - Remove `confidenceClass(confidenceLevel)` styling
   - Add decision status label from FusionResult.decision
   - Map decision text to status: "Supported", "Working hypothesis", "Requires validation"

3. **Update Evidence Display**: When using fusionResult, render basis and limitations
   - Replace interpretation.evidence with FusionResult.basis
   - Replace interpretation.caveats with FusionResult.limitations
   - Keep same UI layout structure

4. **Preserve Graph Display**: No changes to graph rendering or peak visualization

**File**: `src/pages/XPSWorkspace.tsx`

**Function**: Chemical state interpretation display

**Specific Changes**:
1. **Add EvidenceNode Conversion**: Create function to convert XPS processing result to EvidenceNode format
   - Map peak positions to EvidenceNode.x
   - Map binding energy unit to EvidenceNode.unit
   - Map peak labels to EvidenceNode.label
   - Set technique to 'XPS'

2. **Add FusionEngine Call**: After processing, convert to EvidenceNodes and call fusionEngine.evaluate()
   - Convert XPS peaks to EvidenceNode array
   - Call fusionEngine.evaluate({ evidence })
   - Store FusionResult in component state

3. **Update Display**: Replace scientificSummary with FusionResult rendering
   - Replace chemicalStateInterpretation with FusionResult.conclusion
   - Add FusionResult.basis display
   - Replace "CAVEATS" section with "Limitations" using FusionResult.limitations

4. **Preserve Processing Logic**: No changes to background subtraction, peak fitting, or graph rendering

**File**: `src/components/agent-demo/RightPanel/RightPanel.tsx`

**Line**: 1234

**Specific Changes**:
1. **Update Text Reference**: Replace "Agent Thinking" with "Scientific Reasoning"
   - Change: `Agent Thinking → Scientific Determination`
   - To: `Scientific Reasoning → Scientific Determination`

**File**: `src/scientific/insightEngine.ts`

**Function**: `generateInsight()`

**Specific Changes**:
1. **Add Deprecation Comment**: Mark module as deprecated without removing
   - Add JSDoc comment: `@deprecated This module is deprecated. Use fusionEngine instead.`
   - Keep existing code for backward compatibility
   - Do not remove to avoid breaking potential external references

**File**: `src/scientific/useScientificEngine.ts`

**Hook**: `useScientificEngine()`

**Specific Changes**:
1. **Add Deprecation Comment**: Mark hook as deprecated without removing
   - Add JSDoc comment: `@deprecated This hook is deprecated. Use fusionEngine directly.`
   - Keep existing code for backward compatibility

**File**: `src/scientific/types.ts`

**Interface**: `ScientificInsight`

**Specific Changes**:
1. **Add Deprecation Comment**: Mark type as deprecated without removing
   - Add JSDoc comment: `@deprecated This type is deprecated. Use FusionResult from fusionEngine instead.`
   - Keep existing type definition for backward compatibility

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the bug exists on unfixed code by observing parallel reasoning systems and confidence displays, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Manually inspect each component in the browser and verify it uses parallel reasoning or confidence displays. Run the unfixed code to observe failures.

**Test Cases**:
1. **MultiTechWorkspace Parallel Reasoning**: Navigate to `/workspace/multi` and trigger fusion reasoning (will show custom reasoning output on unfixed code)
2. **XRDWorkspace Confidence Display**: Navigate to `/workspace/xrd` and run agent analysis (will show confidence percentage on unfixed code)
3. **XPSWorkspace Legacy Display**: Navigate to `/workspace/xps` and view chemical state (will show scientificSummary on unfixed code)
4. **RightPanel Text**: Navigate to `/demo/agent` and hover over evidence (will show "Agent Thinking" on unfixed code)

**Expected Counterexamples**:
- MultiTechWorkspace displays custom claim/evidence structure instead of FusionResult
- XRDWorkspace displays "93.3%" confidence instead of decision status
- XPSWorkspace displays "CAVEATS" instead of "Limitations"
- RightPanel shows "Agent Thinking" instead of "Scientific Reasoning"

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL component WHERE isBugCondition(component, operation) DO
  result := component_fixed(operation)
  ASSERT usesFusionEngine(result) OR showsDecisionStatus(result) OR showsCorrectTerminology(result)
END FOR
```

**Test Cases**:
1. **MultiTechWorkspace FusionEngine Integration**: Verify fusion reasoning calls fusionEngine.evaluate() and displays FusionResult
2. **XRDWorkspace Decision Status**: Verify agent results show decision status labels instead of confidence percentages
3. **XPSWorkspace FusionEngine Integration**: Verify chemical state interpretation uses fusionEngine and shows "Limitations"
4. **xrdAgent FusionResult Output**: Verify xrdAgent includes fusionResult field in output
5. **RightPanel Terminology**: Verify tooltip shows "Scientific Reasoning"

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL component, operation WHERE NOT isBugCondition(component, operation) DO
  ASSERT component_original(operation) = component_fixed(operation)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for graph rendering, navigation, and data operations, then verify these continue working after fix.

**Test Cases**:
1. **Graph Rendering Preservation**: Verify all graph components render correctly in workspaces and agent demo
2. **Navigation Preservation**: Verify all routes work correctly and maintain state
3. **Data Loading Preservation**: Verify demo data loads correctly and localStorage persists
4. **Export Preservation**: Verify export functionality works for notebooks and reports
5. **AgentDemo Preservation**: Verify AgentDemo continues to work exactly as before (already uses fusionEngine)
6. **Dashboard Preservation**: Verify Dashboard continues to show status labels correctly
7. **NotebookLab Preservation**: Verify NotebookLab continues to use scientific terminology

### Unit Tests

- Test EvidenceNode conversion functions for MultiTechWorkspace and XPSWorkspace
- Test FusionResult display logic in XRDWorkspace and XPSWorkspace
- Test backward compatibility when fusionResult field is missing
- Test decision status label mapping from FusionResult.decision text

### Property-Based Tests

- Generate random CrossTechEvidence arrays and verify conversion to EvidenceNode preserves data
- Generate random XrdInterpretation objects and verify FusionResult conversion preserves meaning
- Test that all workspace operations produce deterministic results across many scenarios

### Integration Tests

- Test full MultiTechWorkspace flow: load data → run fusion → display results
- Test full XRDWorkspace flow: load XRD data → run agent → display results with decision status
- Test full XPSWorkspace flow: load XPS data → process → display with fusionEngine reasoning
- Test AgentDemo flow remains unchanged after fixes
- Test build succeeds with no TypeScript errors
