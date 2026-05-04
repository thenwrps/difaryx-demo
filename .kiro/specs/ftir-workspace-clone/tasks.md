# Tasks: FTIR Workspace Clone

## Overview

This task list implements the FTIR Workspace as a domain-adapted clone of XRD/XPS workspace with a scientific reasoning layer for range-based functional group matching.

**Constraints:**
- Reuse existing components (DashboardLayout, Graph, ProcessingPipeline, ParameterDrawer)
- Do NOT modify XRD or XPS workspaces
- Do NOT modify Agent Mode
- No agent integration yet

---

## Task 1: FTIR Workspace Shell

**Goal:** Create basic FTIR workspace page with 3-column layout

**Files:**
- Create `src/pages/FTIRWorkspace.tsx`
- Update `src/App.tsx` (add `/workspace/ftir` route)

**Implementation:**
- Clone XPSWorkspace.tsx structure
- Replace XPS terminology with FTIR terminology (Wavenumber, Absorbance, Functional Group)
- Use static placeholder data for initial render
- Reuse DashboardLayout, Graph, ProcessingPipeline components
- Set up 3 tabs: Spectrum, Band List, Functional Groups

**Acceptance:**
- `/workspace/ftir` route loads without errors
- 3-column layout renders correctly
- Tabs switch between Spectrum, Band List, Functional Groups
- Graph displays with wavenumber axis (high to low)

---

## Task 2: FTIR Demo Data

**Goal:** Create realistic FTIR demo dataset for metal oxide catalyst

**Files:**
- Create `src/data/ftirDemoData.ts`

**Implementation:**
- Generate synthetic FTIR spectrum (400-4000 cm⁻¹)
- Include characteristic bands:
  - Surface hydroxyl: ~3400 cm⁻¹ (broad, FWHM ~200 cm⁻¹)
  - Adsorbed water: ~1630 cm⁻¹ (medium, FWHM ~60 cm⁻¹)
  - Carbonate/carboxylate: ~1450-1550 cm⁻¹ (overlapping region)
  - Metal-oxygen: ~550 cm⁻¹ (broad, FWHM ~100 cm⁻¹)
- Add baseline and noise for realism

**Acceptance:**
- Demo dataset loads in FTIR workspace
- Graph displays realistic FTIR spectrum
- Bands are visible at expected wavenumbers

---

## Task 3: FTIR Processing Pipeline

**Goal:** Implement 6 FTIR processing steps

**Files:**
- Create `src/agents/ftirAgent/runner.ts`
- Create `src/agents/ftirAgent/types.ts`

**Implementation:**
- **Step 1: Baseline Correction** - Polynomial/Rubberband/Linear methods
- **Step 2: Smoothing** - Savitzky-Golay or Moving Average
- **Step 3: Band Detection** - Local maxima with prominence threshold, classify as narrow/medium/broad based on FWHM
- **Step 4: Band Assignment** - Match bands to wavenumber ranges (not exact positions)
- **Step 5: Functional Group Matching** - Aggregate evidence, detect ambiguity, score confidence
- **Step 6: Interpretation Summary** - Generate scientific summary with caveats

**Acceptance:**
- All 6 steps execute without errors
- Bands are detected and classified by width
- Processing result includes detected bands, matches, interpretation

---

## Task 4: FTIR Reasoning Engine

**Goal:** Implement scientific reasoning layer with deterministic rules

**Files:**
- Create `src/agents/ftirAgent/scientificReasoning.ts`
- Create `src/data/ftirFunctionalGroupDatabase.ts`

**Implementation:**

**Range Scoring:**
- Calculate position score based on proximity to range center (not just within range)
- Calculate width score based on FWHM match to expected width
- Combine scores: `overallScore = positionScore × widthScore × diagnosticWeight`

**Overlap Resolution:**
- For each band, find all overlapping reference ranges
- Score all candidates
- If score difference < threshold (0.15) → mark as ambiguous

**Supporting Band Logic:**
- Check for supporting bands (e.g., O–H stretch requires H–O–H bend for water)
- Increase confidence when supporting bands present
- Decrease confidence when supporting bands missing

**Composite Band Detection:**
- Broad bands (FWHM > 100 cm⁻¹) with multiple candidates → mark as composite
- Do not force single assignment on composite bands

**Confidence Classification:**
- **HIGH:** Strong primary + supporting evidence, no ambiguity, score > 0.75
- **MEDIUM:** Primary present, partial support OR ambiguity present, score 0.5-0.75
- **LOW:** Ambiguous OR insufficient evidence, score < 0.5

**Caveat Generation:**
- Overlapping bands: "Overlapping bands in X-Y cm⁻¹ region: carbonate/carboxylate ambiguity"
- Missing supporting bands: "O–H stretch detected but H–O–H bending absent: water assignment tentative"
- Baseline distortion: "Intensity distortion possible due to baseline correction"
- Composite bands: "Broad band at X cm⁻¹ may include multiple overlapping environments"
- Unassigned bands: "Band at X cm⁻¹ unassigned: may indicate additional species"

**Acceptance:**
- Range scoring produces scores based on proximity to center
- Overlapping ranges produce multiple candidates
- Supporting band logic increases/decreases confidence correctly
- Composite bands are flagged
- Confidence levels follow deterministic thresholds
- Caveats are generated for all ambiguity cases

---

## Task 5: UI Data Binding

**Goal:** Wire processing results to UI components

**Files:**
- Update `src/pages/FTIRWorkspace.tsx`

**Implementation:**

**Graph Tab:**
- Display FTIR spectrum with baseline overlay
- Show band markers at detected positions
- Wavenumber axis reversed (high to low)

**Band List Tab:**
- Table columns: #, Wavenumber (cm⁻¹), Intensity, FWHM (cm⁻¹), Area, Assignment
- Display all detected bands
- Quality Metrics panel: BANDS, MATCHED, SNR, UNASSIGNED, DATA POINTS, CONFIDENCE

**Functional Groups Tab:**
- Table columns: Observed cm⁻¹, Reference Range, Δcm⁻¹, Functional Group, Assignment, Confidence (%), Ambiguity
- Show multiple candidates for overlapping regions
- Display ambiguity indicators

**Scientific Summary (Right Sidebar):**
- Dominant Functional Groups
- Chemical Interpretation
- Confidence badge (HIGH/MEDIUM/LOW)
- Reliability (X/Y matched, Z unassigned)

**Evidence Snapshot:**
- Top 3 assigned bands
- Display: #, Functional Group, Wavenumber, Δcm⁻¹, Intensity

**Validation Panel:**
- Recommended techniques: Raman, XPS, XRD, Multi-tech fusion

**Caveats Panel:**
- Display all generated caveats

**Acceptance:**
- All tabs display correct data from processing results
- Tables populate with band and match data
- Scientific Summary shows interpretation
- Evidence Snapshot shows top 3 matches
- Caveats display warnings

---

## Task 6: Parameter Drawer

**Goal:** Add FTIR parameter definitions and wire to ParameterDrawer

**Files:**
- Update `src/data/parameterDefinitions.ts`
- Update `src/types/parameters.ts`

**Implementation:**

**Add FtirParameters interface:**
```typescript
interface FtirParameters {
  baselineCorrection: {
    method: 'Polynomial' | 'Rubberband' | 'Linear';
    polynomial_order: number;  // 2-5
    iterations: number;         // 10-50
  };
  smoothing: {
    method: 'Savitzky-Golay' | 'Moving Average';
    window_size: number;        // 5-21 (odd)
    polynomial_order: number;   // 2-4
  };
  peakDetection: {
    prominence: number;         // 0.01-0.5
    min_distance: number;       // 10-50 cm⁻¹
    min_height: number;         // 0.01-0.2
  };
  bandAssignment: {
    wavenumber_tolerance: number;  // 10-50 cm⁻¹
    use_intensity: boolean;
    database: 'Standard FTIR' | 'Custom';
  };
  functionalGroupMatching: {
    require_supporting_bands: boolean;
    ambiguity_threshold: number;  // 0.1-0.3
  };
  displayMode: {
    signal_mode: 'Absorbance' | 'Transmittance';
  };
}
```

**Add FTIR parameter definitions:**
- Define parameter controls for each step
- Set default values
- Add validation ranges

**Wire to ParameterDrawer:**
- Connect "Params" buttons to ParameterDrawer
- Pass FTIR parameter definitions
- Handle parameter changes and recomputation

**Acceptance:**
- Params buttons open ParameterDrawer with FTIR parameters
- Parameter changes trigger recomputation
- Parameters persist to localStorage
- Auto Mode resets to defaults

---

## Testing

**Manual Testing Checklist:**
- [ ] FTIR workspace loads at `/workspace/ftir`
- [ ] Graph displays with wavenumber axis (high to low)
- [ ] 6 processing steps shown in pipeline
- [ ] Band List shows detected bands with FWHM and assignments
- [ ] Functional Groups tab shows multiple candidates for overlapping regions
- [ ] Ambiguity indicators display correctly
- [ ] Scientific Summary shows dominant functional groups
- [ ] Confidence badge reflects evidence quality (HIGH/MEDIUM/LOW)
- [ ] Evidence Snapshot shows top 3 matches
- [ ] Caveats panel shows warnings for overlapping bands and missing support
- [ ] Parameter drawer opens and closes
- [ ] Parameter changes trigger recomputation
- [ ] Auto Mode toggle works

**Build Verification:**
- [ ] `npm run build` passes without errors
- [ ] No TypeScript errors
- [ ] No console errors in browser

---

## Notes

**Reuse Strategy:**
- 100% reuse: DashboardLayout, Graph, ProcessingPipeline, ParameterDrawer, ParameterControl
- 95% reuse: FTIRWorkspace.tsx (clone of XPSWorkspace.tsx)
- 80% reuse: ftirAgent/runner.ts (clone of xpsAgent/runner.ts with FTIR logic)
- New code: scientificReasoning.ts, ftirFunctionalGroupDatabase.ts, ftirDemoData.ts

**Estimated LOC:**
- FTIRWorkspace.tsx: ~700 lines
- ftirAgent/runner.ts: ~700 lines
- ftirAgent/scientificReasoning.ts: ~400 lines
- ftirAgent/types.ts: ~250 lines
- ftirDemoData.ts: ~150 lines
- ftirFunctionalGroupDatabase.ts: ~200 lines
- parameterDefinitions.ts additions: ~250 lines
- **Total: ~2,650 lines new/adapted code**

**Do NOT:**
- Modify XRDWorkspace or XPSWorkspace
- Modify Agent Mode
- Add agent integration
- Overbuild with unnecessary features
