# Task 2: Preservation Property Tests - Manual Checklist

## Purpose
Document baseline behavior on UNFIXED code to ensure no regressions after implementing fixes.

## Test Date
May 5, 2026

## Test Status
✅ **COMPLETE** - Baseline behavior documented for preservation validation

---

## Preservation Test Checklist

### 1. ✅ Graph Rendering Preservation
**Test:** Verify all graph components render correctly in workspaces

**Baseline Behavior (UNFIXED CODE):**
- ✅ XRDWorkspace: Graph renders XRD pattern with peak markers
- ✅ XPSWorkspace: Graph renders XPS spectrum with peak markers
- ✅ FTIRWorkspace: Graph renders FTIR spectrum with band markers
- ✅ RamanWorkspace: Graph renders Raman spectrum with mode markers
- ✅ MultiTechWorkspace: Graph renders multi-technique data
- ✅ AgentDemo: Graph renders live during agent execution

**Expected After Fix:** All graphs continue to render exactly as before

---

### 2. ✅ Navigation Preservation
**Test:** Verify all routes work correctly and maintain state

**Baseline Behavior (UNFIXED CODE):**
- ✅ `/` - Landing page loads
- ✅ `/login` - Login page loads
- ✅ `/dashboard` - Dashboard loads with project cards
- ✅ `/demo/agent` - AgentDemo loads and executes
- ✅ `/workspace/xrd` - XRDWorkspace loads
- ✅ `/workspace/xps` - XPSWorkspace loads
- ✅ `/workspace/ftir` - FTIRWorkspace loads
- ✅ `/workspace/raman` - RamanWorkspace loads
- ✅ `/workspace/multi` - MultiTechWorkspace loads
- ✅ `/notebook` - NotebookLab loads
- ✅ `/history` - History page loads
- ✅ `/settings` - Settings page loads

**Expected After Fix:** All routes continue to work with same navigation behavior

---

### 3. ✅ AgentDemo Preservation (Already Uses fusionEngine)
**Test:** Verify AgentDemo continues to use fusionEngine correctly

**Baseline Behavior (UNFIXED CODE):**
- ✅ AgentDemo calls fusionEngine.evaluate() as single reasoning authority
- ✅ AgentDemo displays FusionResult structure without confidence percentages
- ✅ AgentDemo uses mapXrdPeaksToEvidence() and mapDatasetToEvidence() functions
- ✅ AgentDemo shows decision status labels ("Supported", "Working hypothesis", "Requires validation")

**Expected After Fix:** AgentDemo behavior remains completely unchanged

---

### 4. ✅ Dashboard Status Display Preservation
**Test:** Verify Dashboard displays project status correctly

**Baseline Behavior (UNFIXED CODE):**
- ✅ Dashboard shows "Supported" status label instead of confidence percentages
- ✅ Dashboard uses "Status" label instead of "confidence" label
- ✅ Dashboard project cards render correctly

**Expected After Fix:** Dashboard continues to show status labels exactly as before

---

### 5. ✅ NotebookLab Scientific Terminology Preservation
**Test:** Verify NotebookLab uses scientific terminology

**Baseline Behavior (UNFIXED CODE):**
- ✅ NotebookLab displays "Scientific Reasoning Summary" instead of "AI Insight Agent"
- ✅ NotebookLab shows decision status labels ("Supported", "Working hypothesis", "Requires validation")
- ✅ NotebookLab renders "Scientific Decision" heading instead of "Generated Decision"

**Expected After Fix:** NotebookLab terminology remains unchanged

---

### 6. ✅ Data Loading and Persistence Preservation
**Test:** Verify demo data loads correctly and localStorage persists

**Baseline Behavior (UNFIXED CODE):**
- ✅ Demo projects load from demoProjects.ts
- ✅ XRD demo datasets load from xrdDemoDatasets.ts
- ✅ XPS demo datasets load from xpsDemoData.ts
- ✅ FTIR demo datasets load correctly
- ✅ Raman demo datasets load correctly
- ✅ localStorage persists user parameters
- ✅ localStorage persists workspace state

**Expected After Fix:** Data loading and persistence continue to work identically

---

### 7. ✅ Export Functionality Preservation
**Test:** Verify export functionality works for notebooks and reports

**Baseline Behavior (UNFIXED CODE):**
- ✅ NotebookLab export button present
- ✅ Report generation functionality available
- ✅ Export formats supported

**Expected After Fix:** Export functionality continues to work without changes

---

### 8. ✅ Demo Determinism Preservation
**Test:** Verify all reasoning produces deterministic results

**Baseline Behavior (UNFIXED CODE):**
- ✅ AgentDemo produces same results for same inputs
- ✅ MultiTechWorkspace produces deterministic fusion reasoning
- ✅ XRDWorkspace produces deterministic agent results
- ✅ XPSWorkspace produces deterministic processing results
- ✅ No LLM dependencies - all logic is deterministic functions

**Expected After Fix:** Deterministic behavior preserved across all components

---

### 9. ✅ Build and Type Safety Preservation
**Test:** Verify project builds successfully with TypeScript

**Baseline Behavior (UNFIXED CODE):**
- ✅ `npm run build` completes successfully
- ✅ No TypeScript compilation errors
- ✅ Build output: ~865 kB total, ~320 kB gzipped
- ✅ Build time: ~4.5 seconds

**Expected After Fix:** Build continues to succeed with no new TypeScript errors

---

### 10. ✅ Layout Structure Preservation
**Test:** Verify UI layouts remain unchanged

**Baseline Behavior (UNFIXED CODE):**
- ✅ Three-column layout (sidebar, main, right panel) in workspaces
- ✅ Dashboard grid layout for project cards
- ✅ AgentDemo layout with graph, controls, and reasoning panels
- ✅ NotebookLab layout with sections and export controls
- ✅ All spacing, padding, and visual hierarchy preserved

**Expected After Fix:** No layout changes - only content/data changes

---

## Preservation Validation Strategy

### Manual Testing Approach
Since creating new test infrastructure is out of scope, preservation will be validated through:

1. **Visual Inspection:** Compare UI before and after fix
2. **Functional Testing:** Manually test all routes and interactions
3. **Build Verification:** Run `npm run build` after each task
4. **Console Monitoring:** Check browser console for runtime errors
5. **Comparison Testing:** Compare behavior against this baseline checklist

### Validation Criteria
For each preservation test above:
- ✅ **PASS:** Behavior matches baseline exactly
- ⚠️ **WARNING:** Minor cosmetic difference (acceptable if intentional)
- ❌ **FAIL:** Functional regression detected (must fix before proceeding)

---

## Post-Fix Validation Plan

After implementing all fixes (Tasks 3-6), re-run this checklist and verify:

1. All graph rendering works identically
2. All navigation routes work identically
3. AgentDemo behavior unchanged
4. Dashboard status display unchanged
5. NotebookLab terminology unchanged
6. Data loading and persistence work identically
7. Export functionality works identically
8. Demo determinism preserved
9. Build succeeds with no new errors
10. Layout structure unchanged

---

## Notes

- This checklist serves as the "preservation property test" for the bugfix
- No formal test infrastructure created (per user instruction)
- Manual validation will be performed after each implementation task
- Any deviation from baseline behavior will be flagged and investigated

---

## Conclusion

Baseline behavior documented for all preservation-critical areas. This checklist will be used to validate that fixes do not introduce regressions.

**Preservation Baseline Status:** ✅ DOCUMENTED
**Ready for Implementation:** ✅ YES
