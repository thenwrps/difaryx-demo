# Fusion Engine Integration Inconsistencies Report

## Executive Summary

After the fusionEngine refactor, several components still use legacy confidence-based reasoning logic instead of fusionEngine as the single reasoning authority. This report documents all identified inconsistencies.

## Critical Findings

### 1. **MultiTechWorkspace: Parallel Reasoning System**
**Location:** `src/pages/MultiTechWorkspace.tsx`
**Issue:** MultiTechWorkspace implements its own complete reasoning system (`runFusionReasoning`, `runCrossTechReview`, `generateReasoningTrace`) instead of using fusionEngine.

**Current Behavior:**
- Has its own `CrossTechEvidence` and `CrossTechClaim` types (lines 21-43)
- Implements `runCrossTechReview()` function (line 223) with custom reasoning logic
- Implements `generateReasoningTrace()` function (line 276) with custom trace generation
- Implements `runFusionReasoning()` function (line 353) that doesn't call fusionEngine
- Uses hardcoded demo claims and evidence instead of EvidenceNode/ClaimNode structures

**Expected Behavior:**
- Should convert CrossTechEvidence to EvidenceNode format
- Should call fusionEngine.evaluate() as the single reasoning authority
- Should use FusionResult structure for all outputs
- Should eliminate custom reasoning logic

**Impact:** HIGH - Entire workspace bypasses fusionEngine

---

### 2. **XRDWorkspace: Legacy Confidence Display**
**Location:** `src/pages/XRDWorkspace.tsx`
**Issue:** XRDWorkspace displays confidence scores and uses old interpretation structure from xrdAgent.

**Current Behavior:**
- Line 594: Displays `agentResult.interpretation.confidenceScore.toFixed(1)}%`
- Line 594: Uses `confidenceClass(agentResult.interpretation.confidenceLevel)`
- Line 651-652: Displays confidence level badge
- Line 660-662: Displays `agentResult.interpretation.primaryPhase`
- Line 667: Maps `agentResult.interpretation.evidence`
- Line 756: Maps `agentResult.interpretation.caveats`

**Expected Behavior:**
- Should use fusionEngine FusionResult structure
- Should display decision status instead of confidence percentage
- Should use fusionEngine reasoning trace instead of interpretation fields

**Impact:** MEDIUM - Workspace shows legacy confidence UI

---

### 3. **XPSWorkspace: Legacy Interpretation Display**
**Location:** `src/pages/XPSWorkspace.tsx`
**Issue:** XPSWorkspace uses `chemicalStateInterpretation` from processing result instead of fusionEngine.

**Current Behavior:**
- Line 141: `const chemicalStateInterpretation = processingResult.scientificSummary;`
- Line 589: Displays `chemicalStateInterpretation` in UI
- Line 661: Has "CAVEATS" section (should be "Limitations")

**Expected Behavior:**
- Should convert XPS processing result to EvidenceNode format
- Should call fusionEngine.evaluate() for reasoning
- Should use FusionResult.limitations instead of caveats

**Impact:** MEDIUM - Workspace bypasses fusionEngine

---

### 4. **xrdAgent: Legacy Interpretation Structure**
**Location:** `src/agents/xrdAgent/types.ts`
**Issue:** XrdInterpretation type still uses old confidence-based fields.

**Current Behavior (lines 111-120):**
```typescript
export interface XrdInterpretation {
  primaryPhase: string;
  decision: string;
  confidenceScore: number;
  confidenceLevel: XrdConfidenceLevel;
  evidence: string[];
  conflicts: string[];
  caveats: string[];
  summary: string;
}
```

**Expected Behavior:**
- Should be replaced with FusionResult structure
- Or xrdAgent should output EvidenceNodes and call fusionEngine
- Fields should align with: conclusion, basis, crossTech, limitations, decision

**Impact:** HIGH - Agent output structure incompatible with fusionEngine

---

### 5. **insightEngine: Legacy Confidence Logic**
**Location:** `src/scientific/insightEngine.ts`
**Issue:** insightEngine still generates ScientificInsight with confidence scores.

**Current Behavior:**
- Function `generateInsight()` (line 7) creates ScientificInsight
- Uses `confidence.score` and `confidence.label` (lines 109-110)
- Returns `confidenceScore` and `confidenceLevel` fields
- Has `interpretation`, `keyEvidence`, `warnings` fields (not fusionEngine structure)

**Expected Behavior:**
- Should be deprecated or refactored to use fusionEngine
- Currently NOT used anywhere (verified via grep search)
- Should be removed or marked as deprecated

**Impact:** LOW - Not currently used, but exists as legacy code

---

### 6. **ScientificInsight Type: Legacy Structure**
**Location:** `src/scientific/types.ts`
**Issue:** ScientificInsight type (lines 90-100) uses old confidence-based structure.

**Current Structure:**
```typescript
export interface ScientificInsight {
  primaryResult: string;
  confidenceScore: number;
  confidenceLevel: string;
  interpretation: string;
  keyEvidence: string[];
  warnings: string[];
  uncertainty: string;
  recommendedNextStep: string[];
}
```

**Expected Behavior:**
- Should align with FusionResult structure
- Or be deprecated if not used

**Impact:** LOW - Used by insightEngine which is not currently used

---

### 7. **useScientificEngine Hook: Legacy Pipeline**
**Location:** `src/scientific/useScientificEngine.ts`
**Issue:** Hook implements complete scientific pipeline with confidence scoring.

**Current Behavior:**
- Calls `computeConfidence()` (line 51)
- Calls `generateInsight()` (line 56)
- Returns EngineState with confidence and insight fields

**Expected Behavior:**
- Should be deprecated or refactored to use fusionEngine
- Currently NOT used anywhere (verified via grep search)
- Should be removed or marked as deprecated

**Impact:** LOW - Not currently used, but exists as legacy code

---

### 8. **Remaining "Agent Thinking" Reference**
**Location:** `src/components/agent-demo/RightPanel/RightPanel.tsx`
**Issue:** One remaining reference to "Agent Thinking" in a tooltip/hint.

**Current Behavior (line 1234):**
```typescript
💡 This evidence item is also referenced in the <span className="font-semibold">Agent Thinking → Scientific Determination</span> section.
```

**Expected Behavior:**
- Should say "Scientific Reasoning → Scientific Determination"

**Impact:** VERY LOW - Minor UI text inconsistency

---

## Summary by Component

| Component | Issue | Priority | Estimated Effort |
|-----------|-------|----------|------------------|
| MultiTechWorkspace | Parallel reasoning system | HIGH | Large |
| XRDWorkspace | Legacy confidence display | MEDIUM | Medium |
| XPSWorkspace | Legacy interpretation display | MEDIUM | Medium |
| xrdAgent types | Incompatible output structure | HIGH | Medium |
| insightEngine | Legacy confidence logic (unused) | LOW | Small |
| ScientificInsight type | Legacy structure (unused) | LOW | Small |
| useScientificEngine | Legacy pipeline (unused) | LOW | Small |
| RightPanel | Minor text reference | VERY LOW | Trivial |

## Recommended Fix Strategy

### Phase 1: Core Integration (HIGH Priority)
1. **xrdAgent**: Refactor to output EvidenceNodes and call fusionEngine
2. **MultiTechWorkspace**: Replace custom reasoning with fusionEngine.evaluate()

### Phase 2: Workspace Alignment (MEDIUM Priority)
3. **XRDWorkspace**: Update UI to use FusionResult structure
4. **XPSWorkspace**: Convert to EvidenceNode format and use fusionEngine

### Phase 3: Cleanup (LOW Priority)
5. **insightEngine**: Mark as deprecated or remove
6. **useScientificEngine**: Mark as deprecated or remove
7. **ScientificInsight type**: Deprecate or remove
8. **RightPanel**: Fix text reference

## Testing Requirements

After fixes:
1. Verify AgentDemo uses fusionEngine correctly
2. Verify MultiTechWorkspace uses fusionEngine
3. Verify XRDWorkspace displays FusionResult structure
4. Verify XPSWorkspace uses fusionEngine
5. Verify no confidence percentages displayed anywhere
6. Verify all reasoning uses scientific structure: Claim, Observed, Linked, Cross-check, Limitation, Decision
7. Run build and verify no TypeScript errors
8. Test all routes for runtime errors

## Files Requiring Changes

### High Priority:
- `src/pages/MultiTechWorkspace.tsx` - Replace reasoning system
- `src/agents/xrdAgent/types.ts` - Update XrdInterpretation
- `src/agents/xrdAgent/runner.ts` - Integrate fusionEngine
- `src/pages/XRDWorkspace.tsx` - Update UI to FusionResult

### Medium Priority:
- `src/pages/XPSWorkspace.tsx` - Integrate fusionEngine

### Low Priority (Cleanup):
- `src/scientific/insightEngine.ts` - Deprecate/remove
- `src/scientific/useScientificEngine.ts` - Deprecate/remove
- `src/scientific/types.ts` - Deprecate ScientificInsight
- `src/components/agent-demo/RightPanel/RightPanel.tsx` - Fix text

## Notes

- AgentDemo is correctly integrated with fusionEngine (verified)
- Dashboard already uses status labels instead of confidence (verified)
- NotebookLab already uses scientific terminology (verified)
- No LLM dependencies should be added
- Demo must remain deterministic
- No routing or layout changes required
