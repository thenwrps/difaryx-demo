# Design Document: XPS Workspace Clone

## Overview

This design specifies the implementation of an XPS (X-ray Photoelectron Spectroscopy) Workspace as a **domain-adapted architectural clone** of the existing XRD Workspace. The XPS Workspace will reuse 100% of the XRD Workspace architecture—layout, components, processing pipeline, parameter drawer system—while adapting only the data model, processing logic, terminology, and scientific domain knowledge for XPS analysis.

**Core Design Principle:** This is NOT a new feature. This is an architectural clone with domain-specific adaptations.

### Design Constraints

**REUSE-FIRST ARCHITECTURE:**
- XPSWorkspace MUST be derived from XRDWorkspace architecture
- Do NOT introduce new UI patterns
- Do NOT modify XRDWorkspace
- Do NOT modify Agent Mode
- Do NOT modify shared components (DashboardLayout, Graph, ProcessingPipeline, ParameterDrawer)

**KEEP IDENTICAL:**
- 3-column layout (left sidebar, center graph, right sidebar)
- ProcessingPipeline component structure
- ParameterDrawer component structure
- Graph component structure
- Summary/Evidence/Validation panel structure
- Visual styling (spacing, typography, colors)

**ADAPT ONLY:**
1. XPS-specific data model (Binding Energy vs Intensity)
2. XPS processing functions (6 steps: Calibration → Background → Smoothing → Detection → Fitting → Assignment)
3. XPS parameter definitions (energy calibration, Shirley background, etc.)
4. XPS chemical state matching (binding energy database)
5. Reversed binding energy graph axis (high → low)
6. XPS-specific table/summary labels (no 2θ, d-spacing, hkl)

## Architecture

### Component Reuse Map

The following table documents exactly which components are reused vs adapted:

| Component | Reuse Strategy | Adaptation Required |
|-----------|---------------|---------------------|
| `DashboardLayout` | **Reuse as-is** | None |
| `Graph` | **Reuse as-is** | Pass `type="xps"` prop for axis reversal |
| `ProcessingPipeline` | **Reuse as-is** | Pass XPS-specific step data |
| `ParameterDrawer` | **Reuse as-is** | Pass XPS parameter definitions |
| `ParameterControl` | **Reuse as-is** | None |
| `XRDWorkspace.tsx` | **Clone & adapt** | Create `XPSWorkspace.tsx` with XPS data model |
| `xrdAgent/runner.ts` | **Clone & adapt** | Create `xpsAgent/runner.ts` with XPS processing |
| `parameterDefinitions.ts` | **Extend** | Add XPS parameter definitions |
| `xrdDemoDatasets.ts` | **Clone & adapt** | Create `xpsDemoDatasets.ts` with XPS data |

### File Structure

```
src/
├── pages/
│   ├── XRDWorkspace.tsx          # Template (DO NOT MODIFY)
│   └── XPSWorkspace.tsx          # NEW: Clone of XRDWorkspace with XPS adaptations
├── agents/
│   ├── xrdAgent/
│   │   ├── runner.ts             # Template (DO NOT MODIFY)
│   │   └── types.ts              # Template (DO NOT MODIFY)
│   └── xpsAgent/                 # NEW: Clone of xrdAgent with XPS logic
│       ├── runner.ts             # XPS processing functions
│       └── types.ts              # XPS type definitions
├── data/
│   ├── xrdDemoDatasets.ts        # Template (DO NOT MODIFY)
│   ├── xpsDemoDatasets.ts        # NEW: XPS demo datasets
│   ├── parameterDefinitions.ts   # EXTEND: Add XPS parameter definitions
│   └── xpsChemicalStateDatabase.ts  # NEW: Binding energy reference database
├── types/
│   └── parameters.ts             # EXTEND: Add XpsParameters interface
└── components/                   # DO NOT MODIFY
    ├── layout/DashboardLayout.tsx
    ├── ui/Graph.tsx
    └── workspace/
        ├── ProcessingPipeline.tsx
        ├── ParameterDrawer.tsx
        └── ParameterControl.tsx
```

## Components and Interfaces

### 1. XPS Data Model

#### XpsPoint
```typescript
interface XpsPoint {
  x: number;  // Binding Energy (eV)
  y: number;  // Intensity (counts)
}
```

#### XpsPreprocessedPoint
```typescript
interface XpsPreprocessedPoint {
  x: number;                    // Binding Energy (eV)
  rawIntensity: number;         // Original intensity
  smoothedIntensity: number;    // After smoothing
  baselineIntensity: number;    // Calculated baseline
  correctedIntensity: number;   // After background subtraction
  normalizedIntensity: number;  // Normalized to 0-100 scale
}
```

#### XpsDetectedPeak
```typescript
interface XpsDetectedPeak {
  id: string;                   // Unique identifier (e.g., "p1", "p2")
  position: number;             // Binding Energy (eV)
  intensity: number;            // Peak height (normalized)
  rawIntensity: number;         // Peak height (raw counts)
  prominence: number;           // Peak prominence
  fwhm: number;                 // Full Width at Half Maximum (eV)
  area: number;                 // Integrated peak area
  assignment: string;           // Chemical state assignment (e.g., "Cu²⁺", "Cu⁺", "Cu⁰")
  label: string;                // Display label
}
```

#### XpsChemicalStateCandidate
```typescript
interface XpsChemicalStateCandidate {
  element: string;              // Element symbol (e.g., "Cu", "Fe", "O")
  oxidationState: string;       // Oxidation state (e.g., "²⁺", "⁺", "⁰")
  bindingEnergy: number;        // Reference binding energy (eV)
  matches: XpsPeakMatch[];      // Matched observed peaks
  score: number;                // Confidence score (0-1)
  confidenceLevel: 'high' | 'medium' | 'low';
}
```

#### XpsPeakMatch
```typescript
interface XpsPeakMatch {
  referencePeak: XpsReferenceState;
  observedPeak: XpsDetectedPeak;
  delta: number;                // Binding energy difference (eV)
}
```

#### XpsReferenceState
```typescript
interface XpsReferenceState {
  element: string;
  oxidationState: string;
  bindingEnergy: number;        // Reference BE (eV)
  tolerance: number;            // Matching tolerance (eV)
  relativeIntensity: number;    // Expected relative intensity
  chemicalEnvironment: string;  // Description (e.g., "oxide", "metal")
}
```

### 2. XPS Parameters

#### XpsParameters Interface
```typescript
interface XpsParameters {
  energyCalibration: {
    reference_peak: 'C1s' | 'Au4f7' | 'Ag3d5';
    shift_value: number;        // Energy shift (eV)
  };
  backgroundSubtraction: {
    method: 'Shirley' | 'Linear';
    smoothing_factor: number;   // 0.0-1.0
  };
  smoothing: {
    method: 'Moving Average';
    window_size: number;        // 3-21 (odd)
  };
  peakDetection: {
    prominence: number;         // 0.0-1.0
    min_distance: number;       // Minimum peak separation (eV)
  };
  peakFitting: {
    model: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt';
    tolerance: number;          // 1e-6 to 1e-2
    max_iterations: number;     // 10-1000
  };
  chemicalStateAssignment: {
    database: 'NIST XPS' | 'PHI Handbook';
    binding_energy_tolerance: number;  // Matching tolerance (eV)
    use_intensity: boolean;     // Use intensity in matching
  };
}
```

#### Default XPS Parameters
```typescript
const XPS_DEFAULT_PARAMETERS: XpsParameters = {
  energyCalibration: {
    reference_peak: 'C1s',
    shift_value: 0.0
  },
  backgroundSubtraction: {
    method: 'Shirley',
    smoothing_factor: 0.5
  },
  smoothing: {
    method: 'Moving Average',
    window_size: 5
  },
  peakDetection: {
    prominence: 0.1,
    min_distance: 0.5
  },
  peakFitting: {
    model: 'Pseudo-Voigt',
    tolerance: 1e-4,
    max_iterations: 100
  },
  chemicalStateAssignment: {
    database: 'NIST XPS',
    binding_energy_tolerance: 0.3,
    use_intensity: true
  }
};
```

### 3. XPS Processing Functions

The XPS processing agent follows the same structure as XRD agent with 6 processing steps:

#### Step 1: Energy Calibration
```typescript
function calibrate_xps_energy(
  dataPoints: XpsPoint[],
  params: XpsParameters['energyCalibration']
): XpsPoint[]
```
- **Purpose:** Correct binding energy scale using reference peak
- **Reference peaks:**
  - C1s: 284.8 eV (adventitious carbon)
  - Au4f7: 84.0 eV (gold standard)
  - Ag3d5: 368.3 eV (silver standard)
- **Implementation:** Apply shift correction to all x-values

#### Step 2: Background Subtraction
```typescript
function subtract_xps_background(
  dataPoints: XpsPoint[],
  params: XpsParameters['backgroundSubtraction']
): XpsPreprocessedPoint[]
```
- **Purpose:** Remove inelastic scattering background
- **Methods:**
  - **Shirley:** Iterative background calculation (most common for XPS)
  - **Linear:** Simple linear baseline
- **Implementation:** Similar to XRD baseline correction but using Shirley algorithm

#### Step 3: Smoothing
```typescript
function smooth_xps_data(
  preprocessedData: XpsPreprocessedPoint[],
  params: XpsParameters['smoothing']
): XpsPreprocessedPoint[]
```
- **Purpose:** Reduce noise while preserving peak shapes
- **Method:** Moving average (same as XRD)
- **Implementation:** Reuse XRD smoothing logic

#### Step 4: Peak Detection
```typescript
function detect_xps_peaks(
  preprocessedData: XpsPreprocessedPoint[],
  params: XpsParameters['peakDetection']
): XpsDetectedPeak[]
```
- **Purpose:** Identify peak positions in XPS spectrum
- **Implementation:** Similar to XRD peak detection with XPS-specific thresholds
- **Output:** List of detected peaks with position, intensity, FWHM, area

#### Step 5: Peak Fitting
```typescript
function fit_xps_peaks(
  preprocessedData: XpsPreprocessedPoint[],
  detectedPeaks: XpsDetectedPeak[],
  params: XpsParameters['peakFitting']
): XpsDetectedPeak[]
```
- **Purpose:** Fit mathematical functions to peaks for accurate quantification
- **Models:**
  - Gaussian: Symmetric peaks
  - Lorentzian: Broader tails
  - Pseudo-Voigt: Mixture of Gaussian and Lorentzian
- **Implementation:** Non-linear least squares fitting (similar to XRD)

#### Step 6: Chemical State Assignment
```typescript
function assign_chemical_states(
  detectedPeaks: XpsDetectedPeak[],
  database: XpsReferenceState[],
  params: XpsParameters['chemicalStateAssignment']
): XpsChemicalStateCandidate[]
```
- **Purpose:** Match observed peaks to reference binding energies
- **Implementation:** Similar to XRD phase matching but using binding energy database
- **Matching criteria:**
  - Binding energy within tolerance (±0.3 eV default)
  - Optional intensity matching
  - Score based on match quality

### 4. XPS Chemical State Database

Structure mirrors XRD phase database:

```typescript
interface XpsChemicalStateDatabase {
  element: string;
  states: XpsReferenceState[];
}

const XPS_CHEMICAL_STATE_DATABASE: XpsChemicalStateDatabase[] = [
  {
    element: 'Cu',
    states: [
      {
        element: 'Cu',
        oxidationState: '⁰',
        bindingEnergy: 932.7,
        tolerance: 0.3,
        relativeIntensity: 100,
        chemicalEnvironment: 'metallic copper'
      },
      {
        element: 'Cu',
        oxidationState: '⁺',
        bindingEnergy: 932.5,
        tolerance: 0.3,
        relativeIntensity: 90,
        chemicalEnvironment: 'cuprous oxide'
      },
      {
        element: 'Cu',
        oxidationState: '²⁺',
        bindingEnergy: 933.6,
        tolerance: 0.3,
        relativeIntensity: 85,
        chemicalEnvironment: 'cupric oxide'
      }
    ]
  },
  {
    element: 'Fe',
    states: [
      {
        element: 'Fe',
        oxidationState: '⁰',
        bindingEnergy: 706.8,
        tolerance: 0.3,
        relativeIntensity: 100,
        chemicalEnvironment: 'metallic iron'
      },
      {
        element: 'Fe',
        oxidationState: '²⁺',
        bindingEnergy: 709.5,
        tolerance: 0.3,
        relativeIntensity: 80,
        chemicalEnvironment: 'ferrous oxide'
      },
      {
        element: 'Fe',
        oxidationState: '³⁺',
        bindingEnergy: 711.2,
        tolerance: 0.3,
        relativeIntensity: 75,
        chemicalEnvironment: 'ferric oxide'
      }
    ]
  },
  {
    element: 'O',
    states: [
      {
        element: 'O',
        oxidationState: '²⁻',
        bindingEnergy: 530.0,
        tolerance: 0.3,
        relativeIntensity: 100,
        chemicalEnvironment: 'metal oxide'
      },
      {
        element: 'O',
        oxidationState: '²⁻',
        bindingEnergy: 531.5,
        tolerance: 0.3,
        relativeIntensity: 80,
        chemicalEnvironment: 'hydroxide'
      }
    ]
  }
];
```

### 5. Graph Component Adaptation

The Graph component already supports multiple technique types. For XPS:

```typescript
<Graph
  type="xps"                          // NEW: XPS type for axis configuration
  height="100%"
  externalData={selectedDataset.dataPoints}
  baselineData={agentResult.baselineData}
  peakMarkers={graphPeakMarkers}
  showBackground
  showCalculated={false}
  showResidual={false}
/>
```

**Graph Component Changes (if needed):**
- Add `type="xps"` support in Graph.tsx
- When `type="xps"`, reverse x-axis direction (high to low)
- Update axis labels: "Binding Energy (eV)" and "Intensity (counts)"
- Maintain all other graph functionality (zoom, pan, markers)

## Data Models

### XPS Agent Input
```typescript
interface XpsAgentInput {
  datasetId: string;
  sampleName: string;
  sourceLabel: string;
  dataPoints: XpsPoint[];
}
```

### XPS Agent Result
```typescript
interface XpsAgentResult {
  input: XpsAgentInput;
  validation: XpsValidationResult;
  preprocessedData: XpsPreprocessedPoint[];
  baselineData: XpsPoint[];
  detectedPeaks: XpsDetectedPeak[];
  candidates: XpsChemicalStateCandidate[];
  conflicts: XpsConflictAnalysis;
  interpretation: XpsInterpretation;
  executionLog: XpsExecutionLogEntry[];
  parameterImpact?: XpsParameterImpact;
}
```

### XPS Interpretation
```typescript
interface XpsInterpretation {
  primaryElement: string;           // e.g., "Cu"
  chemicalStates: string;           // e.g., "Cu²⁺ dominant with minor Cu⁺"
  decision: string;                 // Interpretation summary
  confidenceScore: number;          // 0-100
  confidenceLevel: 'high' | 'medium' | 'low';
  evidence: string[];               // Top matched peaks
  conflicts: string[];              // Unassigned peaks, overlaps
  caveats: string[];                // Limitations, uncertainties
  summary: string;                  // One-line summary
}
```

## Error Handling

### Validation Rules

Mirror XRD validation structure:

```typescript
function validate_xps_input(input: XpsAgentInput): XpsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Minimum data points
  if (validPoints.length < 50) {
    errors.push('At least 50 numeric XPS points are required for peak detection.');
  }
  
  // Binding energy range check
  const xRange = [sorted[0].x, sorted[sorted.length - 1].x];
  if (xRange[0] < 0 || xRange[1] > 1200) {
    warnings.push('Binding energy range is unusual for typical XPS survey scan.');
  }
  
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    pointCount: validPoints.length,
    xRange
  };
}
```

### Error States

- **No peaks detected:** Display message "No peaks detected. Adjust detection parameters."
- **No chemical state matches:** Display message "No chemical state assignments found. Check binding energy calibration."
- **Invalid data:** Display validation errors in left sidebar
- **Parameter validation:** Real-time validation in ParameterDrawer

## Testing Strategy

### Unit Tests

**XPS Processing Functions:**
- `calibrate_xps_energy()`: Test energy shift correction
- `subtract_xps_background()`: Test Shirley and linear background methods
- `smooth_xps_data()`: Test moving average smoothing
- `detect_xps_peaks()`: Test peak detection with various prominence thresholds
- `fit_xps_peaks()`: Test Gaussian, Lorentzian, Pseudo-Voigt fitting
- `assign_chemical_states()`: Test binding energy matching with tolerance

**XPS Data Model:**
- Test XpsPoint, XpsDetectedPeak, XpsChemicalStateCandidate interfaces
- Test XpsParameters validation
- Test XPS demo dataset loading

**XPS Workspace Component:**
- Test dataset selection
- Test Auto Mode toggle
- Test parameter drawer opening/closing
- Test tab switching (Pattern, Peak List, Reference Overlay)
- Test graph rendering with reversed x-axis

### Integration Tests

- Test complete XPS processing pipeline (calibration → assignment)
- Test parameter changes triggering recomputation
- Test localStorage persistence for XPS parameters
- Test URL query parameters (project, dataset)
- Test navigation to Notebook and Agent Mode

### Manual Testing Checklist

- [ ] XPS workspace loads at `/workspace/xps`
- [ ] Graph displays with reversed x-axis (high BE on left)
- [ ] Processing pipeline shows 6 XPS steps
- [ ] Auto Mode toggle works correctly
- [ ] Parameter drawer opens for each step
- [ ] Parameter changes trigger recomputation
- [ ] Peak List tab shows detected peaks with BE, FWHM, Area
- [ ] Reference Overlay tab shows chemical state matches
- [ ] Scientific Summary shows element and oxidation states
- [ ] Evidence Snapshot shows top 3 matched peaks
- [ ] Validation panel shows XPS-appropriate recommendations
- [ ] Caveats panel shows XPS-specific limitations
- [ ] Parameters persist across page reloads
- [ ] Dataset selection works correctly
- [ ] Project integration works (Notebook, Agent Mode links)

## Implementation Notes

### Cloning Strategy

1. **Copy XRDWorkspace.tsx → XPSWorkspace.tsx**
   - Find/replace: XRD → XPS, xrd → xps
   - Update imports to point to XPS agent and data files
   - Update terminology in UI labels
   - Update graph axis labels and direction

2. **Copy xrdAgent/runner.ts → xpsAgent/runner.ts**
   - Implement 6 XPS processing functions
   - Replace XRD phase database with XPS chemical state database
   - Update scoring logic for binding energy matching
   - Update interpretation generation for chemical states

3. **Copy xrdAgent/types.ts → xpsAgent/types.ts**
   - Define XPS-specific interfaces
   - Remove XRD-specific fields (hkl, dSpacing, crystalSystem, etc.)
   - Add XPS-specific fields (oxidationState, chemicalEnvironment, etc.)

4. **Extend parameterDefinitions.ts**
   - Add XPS_PARAMETER_DEFINITIONS
   - Add XPS_DEFAULT_PARAMETERS
   - Update getStepParameterDefinitions() to handle 'xps' technique

5. **Create xpsDemoDatasets.ts**
   - Define 2-3 XPS demo datasets
   - Use realistic binding energy ranges (0-1000 eV)
   - Include Cu 2p, Fe 2p, O 1s regions

6. **Create xpsChemicalStateDatabase.ts**
   - Define reference binding energies for common elements
   - Include Cu, Fe, O, C oxidation states
   - Follow same structure as XRD phase database

7. **Update Graph.tsx (if needed)**
   - Add `type="xps"` support
   - Implement x-axis reversal for XPS
   - Update axis labels based on type

8. **Update Router**
   - Add `/workspace/xps` route
   - Point to XPSWorkspace component

### Development Workflow

1. Create XPS type definitions (`xpsAgent/types.ts`)
2. Create XPS chemical state database (`xpsChemicalStateDatabase.ts`)
3. Create XPS demo datasets (`xpsDemoDatasets.ts`)
4. Implement XPS processing functions (`xpsAgent/runner.ts`)
5. Add XPS parameter definitions (`parameterDefinitions.ts`)
6. Clone and adapt XPS workspace component (`XPSWorkspace.tsx`)
7. Update Graph component for XPS support (if needed)
8. Add XPS route to router
9. Test complete workflow

### Code Reuse Metrics

- **100% reuse:** DashboardLayout, ProcessingPipeline, ParameterDrawer, ParameterControl
- **95% reuse:** XPSWorkspace.tsx (clone of XRDWorkspace.tsx with terminology changes)
- **90% reuse:** xpsAgent/runner.ts (clone of xrdAgent/runner.ts with XPS logic)
- **New code:** xpsChemicalStateDatabase.ts, xpsDemoDatasets.ts, XPS parameter definitions

**Estimated LOC:**
- XPSWorkspace.tsx: ~700 lines (cloned from XRD)
- xpsAgent/runner.ts: ~600 lines (cloned from XRD)
- xpsAgent/types.ts: ~200 lines (adapted from XRD)
- xpsDemoDatasets.ts: ~100 lines
- xpsChemicalStateDatabase.ts: ~150 lines
- parameterDefinitions.ts additions: ~200 lines
- **Total new/adapted code: ~1,950 lines**
- **Total reused code: ~2,000 lines (components, layout, utilities)**

## Visual Consistency

### Layout Dimensions (Identical to XRD)

- **Left Sidebar:** 288px (w-72)
- **Right Sidebar:** 380px (w-[380px])
- **Center Column:** Flexible (flex-1)
- **Graph Height:** 420px (h-[420px])
- **Sidebar Padding:** 16px (p-4)
- **Section Spacing:** 8px (space-y-2)

### Typography (Identical to XRD)

- **Section Headers:** text-[10px] font-semibold uppercase tracking-wider
- **Labels:** text-[10px] text-text-muted
- **Values:** text-sm font-semibold text-text-main
- **Monospace:** font-mono tabular-nums

### Colors (Identical to XRD)

- **Primary:** text-primary, bg-primary
- **Success:** text-emerald-600
- **Warning:** text-amber-600
- **Error:** text-red-600
- **Borders:** border-border, border-border/40
- **Backgrounds:** bg-surface, bg-surface/50

### Spacing (Identical to XRD)

- **Compact sections:** px-2 py-1.5
- **Standard sections:** px-3 py-2
- **Large sections:** px-4 py-4
- **Gap between items:** gap-1, gap-2, gap-3

## Terminology Mapping

| XRD Term | XPS Term |
|----------|----------|
| 2θ (degrees) | Binding Energy (eV) |
| d-spacing (Å) | FWHM (eV) |
| Intensity (a.u.) | Intensity (counts) |
| hkl (Miller indices) | Chemical State (e.g., Cu²⁺) |
| Phase | Element |
| Crystal System | Oxidation State |
| Lattice Parameters | Chemical Environment |
| JCPDS Card | NIST XPS Database |
| Baseline Correction | Background Subtraction |
| Reference Matching | Chemical State Assignment |
| Unexplained Peaks | Unassigned Peaks |
| Phase Confidence | Assignment Confidence |

## XPS-Specific Caveats

The Caveats panel should display XPS-specific limitations:

1. **Surface Sensitivity:** XPS probes only the top 5-10 nm of the sample surface
2. **Charging Effects:** Insulating samples may exhibit binding energy shifts due to charging
3. **Peak Overlap:** Closely spaced oxidation states may have overlapping peaks
4. **Reference Database:** Binding energies can vary with chemical environment
5. **Quantification:** Relative intensities depend on photoionization cross-sections
6. **Sample Preparation:** Surface contamination (adventitious carbon) affects results
7. **Energy Resolution:** Instrument resolution limits ability to resolve close peaks

## XPS-Specific Validation Recommendations

The Validation panel should suggest XPS-appropriate complementary techniques:

1. **XRD:** Confirm bulk crystalline phase (XPS is surface-sensitive)
2. **Raman:** Validate oxidation states through vibrational modes
3. **FTIR:** Confirm bonding environment and functional groups
4. **Multi-tech Fusion:** Combine XPS surface analysis with bulk characterization
5. **Depth Profiling:** Use Ar+ sputtering to probe subsurface composition
6. **Angle-Resolved XPS:** Vary take-off angle to probe depth distribution

## Summary

This design document specifies a **reuse-first architecture** for the XPS Workspace Clone. By cloning the XRD Workspace structure and adapting only the domain-specific elements (data model, processing logic, terminology), we achieve:

1. **Maximum code reuse:** 100% reuse of layout and UI components
2. **Consistent user experience:** Identical visual design and interaction patterns
3. **Minimal implementation effort:** ~2,000 lines of new/adapted code vs ~2,000 lines reused
4. **Maintainability:** Changes to shared components benefit both XRD and XPS workspaces
5. **Extensibility:** Same pattern can be applied for FTIR and Raman workspaces

The XPS Workspace will provide materials scientists with a familiar, powerful interface for XPS data analysis while maintaining the high-quality scientific rigor established in the XRD Workspace.
