# DIFARYX Run-Based Execution Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

    START: User opens Agent Mode
           /demo/agent?project=cu-fe2o4-spinel
                            │
                            │ User edits mission
                            │ User clicks "Run Agent"
                            ↓
    ┌───────────────────────────────────────────────┐
    │  AGENT EXECUTION (AgentDemo.tsx)              │
    │  ─────────────────────────────────────────    │
    │  1. Execute reasoning steps (deterministic)   │
    │  2. Generate runId = "run-1234567890-abc"     │
    │  3. Create AgentRun object:                   │
    │     {                                          │
    │       id: runId,                               │
    │       projectId: "cu-fe2o4-spinel",           │
    │       mission: "Determine CuFe2O4...",        │
    │       outputs: {                               │
    │         phase: "CuFe2O4 spinel ferrite",      │
    │         confidence: 92,                        │
    │         evidence: [...],                       │
    │         caveats: [...]                         │
    │       }                                        │
    │     }                                          │
    │  4. saveRun(agentRun)                         │
    │     → localStorage["difaryx_runs"]            │
    │  5. navigate("/workspace/xrd?project=...     │
    │              &run=run-1234567890-abc")        │
    └───────────────────────────────────────────────┘
                            │
                            │ Auto-navigate after 800ms
                            ↓
    ┌───────────────────────────────────────────────┐
    │  WORKSPACE (TechniqueWorkspace.tsx)           │
    │  ─────────────────────────────────────────    │
    │  URL: /workspace/xrd?project=cu-fe2o4-spinel │
    │       &run=run-1234567890-abc                 │
    │                                                │
    │  1. Read: runId = searchParams.get('run')     │
    │  2. Load: agentRun = getRun(runId)            │
    │  3. Display Agent Run Result Card:            │
    │     ┌─────────────────────────────────────┐  │
    │     │ 🌟 Agent Run Result                 │  │
    │     │ ─────────────────────────────────   │  │
    │     │ Phase: CuFe2O4 spinel ferrite       │  │
    │     │ Confidence: 92% (High confidence)   │  │
    │     │ Evidence:                            │  │
    │     │   ✓ Peak alignment consistency      │  │
    │     │   ✓ Strong match with reference     │  │
    │     │   ✓ No major conflicting peaks      │  │
    │     │                                      │  │
    │     │ [Save to Notebook] [Re-run Agent]   │  │
    │     └─────────────────────────────────────┘  │
    │                                                │
    │  4. Show XRD graph with detected peaks        │
    │  5. Show processing controls                  │
    └───────────────────────────────────────────────┘
                            │
                            │ User clicks "Save to Notebook"
                            ↓
    ┌───────────────────────────────────────────────┐
    │  NOTEBOOK (NotebookLab.tsx)                   │
    │  ─────────────────────────────────────────    │
    │  URL: /notebook?project=cu-fe2o4-spinel      │
    │       &run=run-1234567890-abc                 │
    │                                                │
    │  1. Read: runId = searchParams.get('run')     │
    │  2. Load: agentRun = getRun(runId)            │
    │  3. Display Structured Scientific Note:       │
    │     ┌─────────────────────────────────────┐  │
    │     │ Agent Run: CuFe2O4 Spinel           │  │
    │     │ ═══════════════════════════════════ │  │
    │     │                                      │  │
    │     │ MISSION                              │  │
    │     │ Determine whether the uploaded      │  │
    │     │ sample is consistent with CuFe2O4   │  │
    │     │ spinel ferrite phase...             │  │
    │     │                                      │  │
    │     │ RESULT                               │  │
    │     │ CuFe2O4 spinel ferrite at 92%       │  │
    │     │ confidence (High confidence)        │  │
    │     │                                      │  │
    │     │ EVIDENCE                             │  │
    │     │ • Peak alignment consistency (92%)  │  │
    │     │ • Strong match with spinel ferrite  │  │
    │     │ • No major conflicting peaks        │  │
    │     │ • COD reference matching ranked...  │  │
    │     │ • Structure inference assigned...   │  │
    │     │                                      │  │
    │     │ INTERPRETATION                       │  │
    │     │ The material shows structural       │  │
    │     │ features consistent with spinel     │  │
    │     │ ferrites, a class of catalysts...   │  │
    │     │                                      │  │
    │     │ CAVEATS                              │  │
    │     │ • Minor impurity phases (possible   │  │
    │     │   CuO trace) require Rietveld...    │  │
    │     │ • Surface chemistry remains         │  │
    │     │   unvalidated until XPS...          │  │
    │     │                                      │  │
    │     │ RECOMMENDATIONS                      │  │
    │     │ • Validate surface chemistry with   │  │
    │     │   XPS or compare with catalytic...  │  │
    │     └─────────────────────────────────────┘  │
    │                                                │
    │  4. Buttons: [Share] [Print Report] [Export]  │
    └───────────────────────────────────────────────┘
                            │
                            │ User clicks "Print Report"
                            ↓
    ┌───────────────────────────────────────────────┐
    │  REPORT EXPORT                                │
    │  ─────────────────────────────────────────    │
    │  1. Call: window.print()                      │
    │  2. Browser opens print dialog                │
    │  3. User can:                                  │
    │     • Print to PDF                             │
    │     • Print to printer                         │
    │     • Save as PDF                              │
    │  4. Document includes:                         │
    │     • Mission statement                        │
    │     • Results with confidence                  │
    │     • Complete evidence list                   │
    │     • Scientific interpretation                │
    │     • Caveats and limitations                  │
    │     • Recommendations                          │
    └───────────────────────────────────────────────┘
                            │
                            │ User can navigate back
                            ↓
    ┌───────────────────────────────────────────────┐
    │  RE-RUN CYCLE                                 │
    │  ─────────────────────────────────────────    │
    │  From Workspace:                               │
    │    Click "Re-run Agent"                        │
    │    → /demo/agent?project=cu-fe2o4-spinel      │
    │                                                │
    │  From Notebook:                                │
    │    Navigate to Agent Mode                      │
    │    → /demo/agent?project=cu-fe2o4-spinel      │
    │                                                │
    │  New run creates new runId                     │
    │  Previous runs remain in localStorage          │
    └───────────────────────────────────────────────┘
```

---

## Data Persistence

```
localStorage["difaryx_runs"] = [
  {
    id: "run-1714567890-abc123",
    projectId: "cu-fe2o4-spinel",
    createdAt: "2026-04-30T12:34:56.789Z",
    mission: "Determine whether...",
    outputs: {
      phase: "CuFe2O4 spinel ferrite...",
      confidence: 92,
      confidenceLabel: "High confidence",
      evidence: [...],
      interpretation: "The material shows...",
      caveats: [...],
      recommendations: [...],
      detectedPeaks: [...],
      selectedDatasets: ["XRD"]
    }
  },
  // Additional runs accumulate here
]
```

---

## URL Parameter Flow

```
Agent Mode:
  /demo/agent?project=cu-fe2o4-spinel
                ↓
Workspace:
  /workspace/xrd?project=cu-fe2o4-spinel&run=run-1234567890-abc
                ↓
Notebook:
  /notebook?project=cu-fe2o4-spinel&run=run-1234567890-abc
                ↓
Back to Agent:
  /demo/agent?project=cu-fe2o4-spinel
  (creates new run)
```

---

## Key Features

### ✅ Minimal Implementation
- No app refactoring
- Only execution context added
- Existing UI preserved

### ✅ URL-Based State
- Project from URL
- Run from URL
- No local state for context

### ✅ localStorage Persistence
- Runs survive page refresh
- Multiple runs can coexist
- Easy to inspect in DevTools

### ✅ Seamless Navigation
- Auto-navigate after agent run
- Preserve context across pages
- Clear user journey

### ✅ Deterministic Demo
- Same reasoning steps
- Predictable outputs
- Consistent timing

---

## Testing the Flow

1. **Start Agent:**
   - Navigate to `/demo/agent?project=cu-fe2o4-spinel`
   - Click "Run Agent"
   - Wait for execution

2. **Verify Workspace:**
   - URL should be `/workspace/xrd?project=cu-fe2o4-spinel&run=run-...`
   - Agent Run Result card should appear
   - Phase, confidence, evidence should display

3. **Check Notebook:**
   - Click "Save to Notebook"
   - URL should be `/notebook?project=cu-fe2o4-spinel&run=run-...`
   - Structured note should show mission, result, evidence, caveats

4. **Test Print:**
   - Click "Print Report"
   - Browser print dialog should open
   - Preview should show complete notebook

5. **Verify Persistence:**
   - Open DevTools → Application → localStorage
   - Check `difaryx_runs` key
   - Should contain run object with all data

---

## Success Criteria

✅ Agent creates run
✅ Workspace shows run
✅ Notebook shows run
✅ Navigation preserves runId
✅ Build passes
✅ UI not broken
✅ Layout unchanged
✅ No new dependencies
✅ Demo deterministic

**Status: ALL CRITERIA MET**
