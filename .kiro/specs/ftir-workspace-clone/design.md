# Design Document: FTIR Workspace Clone

## Overview

This design specifies the implementation of an FTIR (Fourier Transform Infrared Spectroscopy) Workspace as a **domain-adapted architectural clone** of the existing XRD/XPS Workspace. The FTIR Workspace will reuse 100% of the XRD/XPS Workspace architecture—layout, components, processing pipeline, parameter drawer system—while adapting only the data model, processing logic, terminology, and scientific domain knowledge for FTIR analysis with a sophisticated **scientific reasoning layer**.

**Core Design Principle:** This is NOT a new feature. This is an architectural clone with domain-specific adaptations for FTIR spectroscopy, particularly for catalyst and materials characterization workflows.

### Design Constraints

**REUSE-FIRST ARCHITECTURE:**
- FTIRWorkspace MUST be derived from XRDWorkspace/XPSWorkspace architecture
- Do NOT introduce new UI patterns
- Do NOT modify XRDWorkspace or XPSWorkspace
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
1. FTIR-specific data model (Wavenumber vs Absorbance/Transmittance)
2. FTIR processing functions (6 steps: Baseline Correction → Smoothing → Peak Detection → Band Assignment → Functional Group Matching → Interpretation Summary)
3. FTIR parameter definitions (baseline methods, Savitzky-Golay smoothing, etc.)
4. FTIR functional group reference database with **wavenumber ranges** (not exact positions)
5. Standard FTIR wavenumber axis (high → low, same as XPS)
6. FTIR-specific table/summary labels (no 2θ, d-spacing, hkl, binding energy, oxidation state)
7. **Scientific reasoning layer** with evidence aggregation, ambiguity detection, confidence scoring, and caveat generation

### Key Difference from XPS: Range-Based Matching

Unlike XPS (which uses exact binding energy positions ±0.5 eV), FTIR uses **wavenumber ranges** for functional group assignment:
- **Broad bands** (e.g., O–H stretch: 3200-3600 cm⁻¹, FWHM > 100 cm⁻¹)
- **Overlapping regions** (e.g., carbonate/carboxylate: 1400-1600 cm⁻¹)
- **Multiple candidates** per observed band when ranges overlap
- **Supporting band logic** (e.g., O–H stretch + H–O–H bend confirms water)

## Architecture

### Component Reuse Map

The following table documents exactly which components are reused vs adapted:

| Component | Reuse Strategy | Adaptation Required |
|-----------|---------------|---------------------|
| `DashboardLayout` | **Reuse as-is** | None |
| `Graph` | **Reuse as-is** | Pass `type="ftir"` prop for axis configuration |
| `ProcessingPipeline` | **Reuse as-is** | Pass FTIR-specific step data |
| `ParameterDrawer` | **Reuse as-is** | Pass FTIR parameter definitions |
| `ParameterControl` | **Reuse as-is** | None |
| `XRDWorkspace.tsx` | **Clone & adapt** | Create `FTIRWorkspace.tsx` with FTIR data model |
| `XPSWorkspace.tsx` | **Reference template** | Use as architectural reference |
| `xrdAgent/runner.ts` | **Clone & adapt** | Create `ftirAgent/runner.ts` with FTIR processing |
| `parameterDefinitions.ts` | **Extend** | Add FTIR parameter definitions |
| `xrdDemoDatasets.ts` | **Clone & adapt** | Create `ftirDemoDatasets.ts` with FTIR data |

### File Structure

```
src/
├── pages/
│   ├── XRDWorkspace.tsx          # Template (DO NOT MODIFY)
│   ├── XPSWorkspace.tsx          # Template (DO NOT MODIFY)
│   └── FTIRWorkspace.tsx         # NEW: Clone with FTIR adaptations
├── agents/
│   ├── xrdAgent/
│   │   ├── runner.ts             # Template (DO NOT MODIFY)
│   │   └── types.ts              # Template (DO NOT MODIFY)
│   ├── xpsAgent/
│   │   ├── runner.ts             # Template (DO NOT MODIFY)
│   │   └── types.ts              # Template (DO NOT MODIFY)
│   └── ftirAgent/                # NEW: Clone with FTIR logic
│       ├── runner.ts             # FTIR processing functions
│       ├── types.ts              # FTIR type definitions
│       └── scientificReasoning.ts # NEW: Scientific reasoning layer
├── data/
│   ├── xrdDemoDatasets.ts        # Template (DO NOT MODIFY)
│   ├── xpsDemoDatasets.ts        # Template (DO NOT MODIFY)
│   ├── ftirDemoDatasets.ts       # NEW: FTIR demo datasets
│   ├── parameterDefinitions.ts   # EXTEND: Add FTIR parameter definitions
│   └── ftirFunctionalGroupDatabase.ts  # NEW: Range-based reference database
├── types/
│   └── parameters.ts             # EXTEND: Add FtirParameters interface
└── components/                   # DO NOT MODIFY
    ├── layout/DashboardLayout.tsx
    ├── ui/Graph.tsx
    └── workspace/
        ├── ProcessingPipeline.tsx
        ├── ParameterDrawer.tsx
        └── ParameterControl.tsx
```

## Components and Interfaces

### 1. FTIR Data Model

#### FtirPoint
```typescript
interface FtirPoint {
  x: number;  // Wavenumber (cm⁻¹)
  y: number;  // Absorbance or Transmittance
}
```

#### FtirPreprocessedPoint
```typescript
interface FtirPreprocessedPoint {
  x: number;                    // Wavenumber (cm⁻¹)
  rawIntensity: number;         // Original absorbance/transmittance
  smoothedIntensity: number;    // After smoothing
  baselineIntensity: number;    // Calculated baseline
  correctedIntensity: number;   // After baseline subtraction
  normalizedIntensity: number;  // Normalized to 0-100 scale
}
```

#### FtirDetectedBand
```typescript
interface FtirDetectedBand {
  id: string;                   // Unique identifier (e.g., "b1", "b2")
  wavenumber: number;           // Band position (cm⁻¹)
  intensity: number;            // Band height (normalized)
  rawIntensity: number;         // Band height (raw absorbance)
  prominence: number;           // Band prominence
  fwhm: number;                 // Full Width at Half Maximum (cm⁻¹)
  area: number;                 // Integrated band area
  classification: 'narrow' | 'medium' | 'broad';  // Based on FWHM
  assignment: string;           // Functional group assignment (e.g., "O–H stretch")
  label: string;                // Display label
}
```

#### FtirFunctionalGroupCandidate
```typescript
interface FtirFunctionalGroupCandidate {
  functionalGroup: string;      // Functional group name (e.g., "Surface hydroxyl")
  assignment: string;           // Detailed assignment (e.g., "O–H stretching vibration")
  matches: FtirBandMatch[];     // Matched observed bands
  supportingBands: FtirBandMatch[];  // Supporting evidence bands
  score: number;                // Confidence score (0-1)
  confidenceLevel: 'high' | 'medium' | 'low';
  ambiguity: string | null;     // Ambiguity description if multiple candidates
}
```

#### FtirBandMatch
```typescript
interface FtirBandMatch {
  referenceRange: FtirReferenceRange;
  observedBand: FtirDetectedBand;
  deltaFromCenter: number;      // Distance from range center (cm⁻¹)
  positionScore: number;        // How well positioned within range (0-1)
  widthScore: number;           // How well width matches expected (0-1)
  overallScore: number;         // Combined match score (0-1)
}
```

#### FtirReferenceRange
```typescript
interface FtirReferenceRange {
  functionalGroup: string;
  assignment: string;
  wavenumberRange: [number, number];  // [min, max] in cm⁻¹
  typicalCenter: number;        // Typical center position (cm⁻¹)
  expectedWidth: 'narrow' | 'medium' | 'broad';  // Expected FWHM category
  diagnosticWeight: number;     // Importance for identification (0-1)
  supportingBands: string[];    // IDs of supporting bands that increase confidence
  overlappingGroups: string[];  // Other groups with overlapping ranges
  literatureSource: string;     // Reference citation
}
```

### 2. FTIR Parameters

#### FtirParameters Interface
```typescript
interface FtirParameters {
  baselineCorrection: {
    method: 'Polynomial' | 'Rubberband' | 'Linear';
    polynomial_order: number;   // 2-5 (for Polynomial method)
    iterations: number;         // 10-50 (for Rubberband method)
  };
  smoothing: {
    method: 'Savitzky-Golay' | 'Moving Average';
    window_size: number;        // 5-21 (odd)
    polynomial_order: number;   // 2-4 (for Savitzky-Golay only)
  };
  peakDetection: {
    prominence: number;         // 0.01-0.5 (fraction of max intensity)
    min_distance: number;       // 10-50 cm⁻¹
    min_height: number;         // 0.01-0.2
  };
  bandAssignment: {
    wavenumber_tolerance: number;  // 10-50 cm⁻¹
    use_intensity: boolean;     // Use intensity in matching
    database: 'Standard FTIR' | 'Custom';
  };
  functionalGroupMatching: {
    require_supporting_bands: boolean;  // Require supporting evidence
    ambiguity_threshold: number;  // Score difference for ambiguity (0.1-0.3)
  };
  displayMode: {
    signal_mode: 'Absorbance' | 'Transmittance';
  };
}
```

#### Default FTIR Parameters
```typescript
const FTIR_DEFAULT_PARAMETERS: FtirParameters = {
  baselineCorrection: {
    method: 'Polynomial',
    polynomial_order: 3,
    iterations: 20
  },
  smoothing: {
    method: 'Savitzky-Golay',
    window_size: 9,
    polynomial_order: 3
  },
  peakDetection: {
    prominence: 0.1,
    min_distance: 20,
    min_height: 0.05
  },
  bandAssignment: {
    wavenumber_tolerance: 30,
    use_intensity: true,
    database: 'Standard FTIR'
  },
  functionalGroupMatching: {
    require_supporting_bands: true,
    ambiguity_threshold: 0.15
  },
  displayMode: {
    signal_mode: 'Absorbance'
  }
};
```

### 3. FTIR Processing Functions

The FTIR processing agent follows the same structure as XRD/XPS agent with 6 processing steps:

#### Step 1: Baseline Correction
```typescript
function correct_ftir_baseline(
  dataPoints: FtirPoint[],
  params: FtirParameters['baselineCorrection']
): FtirPreprocessedPoint[]
```
- **Purpose:** Remove baseline drift and background signal
- **Methods:**
  - **Polynomial:** Fit polynomial to baseline regions
  - **Rubberband:** Convex hull baseline (iterative)
  - **Linear:** Simple linear baseline between endpoints
- **Implementation:** Similar to XRD baseline correction but adapted for FTIR characteristics

#### Step 2: Smoothing
```typescript
function smooth_ftir_data(
  preprocessedData: FtirPreprocessedPoint[],
  params: FtirParameters['smoothing']
): FtirPreprocessedPoint[]
```
- **Purpose:** Reduce noise while preserving band shapes
- **Methods:**
  - **Savitzky-Golay:** Polynomial smoothing filter (preferred for FTIR)
  - **Moving Average:** Simple moving average
- **Implementation:** Savitzky-Golay is superior for preserving peak shapes

#### Step 3: Peak Detection
```typescript
function detect_ftir_bands(
  preprocessedData: FtirPreprocessedPoint[],
  params: FtirParameters['peakDetection']
): FtirDetectedBand[]
```
- **Purpose:** Identify band positions in FTIR spectrum
- **Implementation:** Similar to XRD/XPS peak detection with FTIR-specific thresholds
- **Band Classification:** Classify as narrow (<50 cm⁻¹), medium (50-100 cm⁻¹), or broad (>100 cm⁻¹)
- **Output:** List of detected bands with wavenumber, intensity, FWHM, area, classification

#### Step 4: Band Assignment (Initial Range Matching)
```typescript
function assign_bands_to_ranges(
  detectedBands: FtirDetectedBand[],
  database: FtirReferenceRange[],
  params: FtirParameters['bandAssignment']
): FtirBandMatch[]
```
- **Purpose:** Match observed bands to reference wavenumber ranges
- **Implementation:** Range-based matching (NOT exact position matching)
- **Matching criteria:**
  - Band wavenumber falls within reference range
  - Band width matches expected width category
  - Optional intensity matching
- **Output:** List of band-to-range matches with scores

#### Step 5: Functional Group Matching (Evidence Aggregation)
```typescript
function match_functional_groups(
  bandMatches: FtirBandMatch[],
  database: FtirReferenceRange[],
  params: FtirParameters['functionalGroupMatching']
): FtirFunctionalGroupCandidate[]
```
- **Purpose:** Aggregate band-level evidence into functional group-level interpretation
- **Implementation:** Scientific reasoning layer with:
  - **Evidence aggregation:** Combine primary + supporting bands
  - **Ambiguity detection:** Identify overlapping ranges
  - **Confidence scoring:** Based on evidence quality
  - **Caveat generation:** Flag uncertainties
- **Key Logic:**
  - Increase confidence when supporting bands present (e.g., O–H + H–O–H confirms water)
  - Decrease confidence when ambiguity detected (e.g., carbonate/carboxylate overlap)
  - Allow multiple candidates per band when ranges overlap
- **Output:** List of functional group candidates with confidence and ambiguity flags

#### Step 6: Interpretation Summary
```typescript
function generate_ftir_interpretation(
  functionalGroupCandidates: FtirFunctionalGroupCandidate[],
  detectedBands: FtirDetectedBand[]
): FtirInterpretation
```
- **Purpose:** Generate evidence-based scientific interpretation
- **Implementation:** Synthesize functional group-level evidence into coherent interpretation
- **Output:** Structured interpretation with dominant groups, confidence, evidence, caveats

### 4. FTIR Functional Group Reference Database

Structure uses **wavenumber ranges** (not exact positions):

```typescript
interface FtirFunctionalGroupDatabase {
  category: string;
  ranges: FtirReferenceRange[];
}

const FTIR_FUNCTIONAL_GROUP_DATABASE: FtirFunctionalGroupDatabase[] = [
  {
    category: 'Hydroxyl Groups',
    ranges: [
      {
        functionalGroup: 'Surface hydroxyl',
        assignment: 'O–H stretching vibration',
        wavenumberRange: [3200, 3600],
        typicalCenter: 3400,
        expectedWidth: 'broad',  // FWHM > 100 cm⁻¹
        diagnosticWeight: 0.9,
        supportingBands: ['water_bending'],
        overlappingGroups: [],
        literatureSource: 'Busca, G. (2014). Heterogeneous Catalytic Materials'
      }
    ]
  },
  {
    category: 'Water',
    ranges: [
      {
        functionalGroup: 'Adsorbed water',
        assignment: 'H–O–H bending vibration',
        wavenumberRange: [1630, 1650],
        typicalCenter: 1640,
        expectedWidth: 'medium',  // FWHM 50-100 cm⁻¹
        diagnosticWeight: 0.8,
        supportingBands: ['surface_hydroxyl'],
        overlappingGroups: [],
        literatureSource: 'Busca, G. (2014). Heterogeneous Catalytic Materials'
      }
    ]
  },
  {
    category: 'Carbonate Species',
    ranges: [
      {
        functionalGroup: 'Carbonate',
        assignment: 'CO₃²⁻ asymmetric stretching',
        wavenumberRange: [1400, 1500],
        typicalCenter: 1450,
        expectedWidth: 'medium',
        diagnosticWeight: 0.7,
        supportingBands: [],
        overlappingGroups: ['carboxylate'],  // AMBIGUITY
        literatureSource: 'Busca, G. (2014). Heterogeneous Catalytic Materials'
      },
      {
        functionalGroup: 'Carboxylate',
        assignment: 'COO⁻ asymmetric stretching',
        wavenumberRange: [1550, 1650],
        typicalCenter: 1600,
        expectedWidth: 'medium',
        diagnosticWeight: 0.7,
        supportingBands: [],
        overlappingGroups: ['carbonate'],  // AMBIGUITY
        literatureSource: 'Busca, G. (2014). Heterogeneous Catalytic Materials'
      }
    ]
  },
  {
    category: 'Metal-Oxygen Vibrations',
    ranges: [
      {
        functionalGroup: 'Metal-oxygen vibration',
        assignment: 'M–O stretching (spinel structure)',
        wavenumberRange: [500, 650],
        typicalCenter: 575,
        expectedWidth: 'broad',
        diagnosticWeight: 0.85,
        supportingBands: [],
        overlappingGroups: [],
        literatureSource: 'Waldron, R. D. (1955). Physical Review, 99(6), 1727'
      }
    ]
  }
];
```

### 5. Scientific Reasoning Layer

The scientific reasoning layer is the core innovation for FTIR analysis. It operates on **functional group-level evidence** rather than simple band matching.

#### Evidence Aggregation Engine
```typescript
function aggregateEvidence(
  bandMatches: FtirBandMatch[],
  database: FtirReferenceRange[]
): FunctionalGroupEvidence[]
```
- **Purpose:** Combine primary bands with supporting bands
- **Logic:**
  - For each functional group, find primary band matches
  - Check for supporting bands (e.g., O–H stretch requires H–O–H bend for water)
  - Calculate evidence strength based on primary + supporting bands
- **Output:** Evidence objects with primary/supporting band lists

#### Ambiguity Detection Engine
```typescript
function detectAmbiguity(
  bandMatches: FtirBandMatch[],
  database: FtirReferenceRange[]
): AmbiguityReport[]
```
- **Purpose:** Identify bands in overlapping regions
- **Logic:**
  - For each band, check if multiple reference ranges overlap
  - Calculate score difference between top candidates
  - Flag as ambiguous if score difference < threshold (e.g., 0.15)
- **Output:** Ambiguity reports with candidate list and confidence reduction

#### Confidence Scoring Engine
```typescript
function calculateFunctionalGroupConfidence(
  evidence: FunctionalGroupEvidence,
  ambiguity: AmbiguityReport | null
): ConfidenceScore
```
- **Purpose:** Calculate confidence based on evidence quality
- **Scoring Factors:**
  - **Primary band match quality** (0.4 weight)
  - **Supporting band presence** (0.3 weight)
  - **Ambiguity penalty** (0.2 weight)
  - **Band width consistency** (0.1 weight)
- **Thresholds:**
  - High confidence: score > 0.75, supporting bands present, no ambiguity
  - Medium confidence: score 0.5-0.75, or ambiguity present
  - Low confidence: score < 0.5, or missing supporting bands
- **Output:** Confidence score (0-1) and level (high/medium/low)

#### Caveat Generation Engine
```typescript
function generateCaveats(
  functionalGroupCandidates: FtirFunctionalGroupCandidate[],
  detectedBands: FtirDetectedBand[],
  preprocessedData: FtirPreprocessedPoint[]
): string[]
```
- **Purpose:** Generate scientific caveats for interpretation
- **Caveat Types:**
  - **Overlapping bands:** "Overlapping bands in 1400-1600 cm⁻¹ region: carbonate/carboxylate ambiguity"
  - **Missing supporting bands:** "O–H stretch detected but H–O–H bending band absent: water assignment tentative"
  - **Baseline distortion:** "Intensity distortion possible due to baseline correction artifacts"
  - **Broad bands:** "Broad band at 3400 cm⁻¹ may include multiple overlapping O–H environments"
  - **Unassigned bands:** "Band at 1234 cm⁻¹ unassigned: may indicate additional species"
- **Output:** List of caveat strings

### 6. Graph Component Adaptation

The Graph component already supports multiple technique types. For FTIR:

```typescript
<Graph
  type="ftir"                         // NEW: FTIR type for axis configuration
  height="100%"
  externalData={selectedDataset.dataPoints}
  baselineData={agentResult.baselineData}
  peakMarkers={graphBandMarkers}
  showBackground
  showCalculated={false}
  showResidual={false}
/>
```

**Graph Component Changes (if needed):**
- Add `type="ftir"` support in Graph.tsx
- When `type="ftir"`, configure x-axis: "Wavenumber (cm⁻¹)", reversed (high to low)
- When `type="ftir"`, configure y-axis based on signal_mode: "Absorbance" or "Transmittance (%)"
- Maintain all other graph functionality (zoom, pan, markers)

## Data Models

### FTIR Agent Input
```typescript
interface FtirAgentInput {
  datasetId: string;
  sampleName: string;
  sourceLabel: string;
  dataPoints: FtirPoint[];
}
```

### FTIR Agent Result
```typescript
interface FtirAgentResult {
  input: FtirAgentInput;
  validation: FtirValidationResult;
  preprocessedData: FtirPreprocessedPoint[];
  baselineData: FtirPoint[];
  detectedBands: FtirDetectedBand[];
  bandMatches: FtirBandMatch[];
  functionalGroupCandidates: FtirFunctionalGroupCandidate[];
  interpretation: FtirInterpretation;
  executionLog: FtirExecutionLogEntry[];
  parameterImpact?: FtirParameterImpact;
}
```

### FTIR Interpretation
```typescript
interface FtirInterpretation {
  dominantFunctionalGroups: string[];  // e.g., ["Surface hydroxyl", "Adsorbed water"]
  chemicalInterpretation: string;      // e.g., "Metal oxide catalyst with surface hydroxyl groups"
  decision: string;                    // Interpretation summary
  confidenceScore: number;             // 0-100
  confidenceLevel: 'high' | 'medium' | 'low';
  evidence: string[];                  // Top matched bands with supporting evidence
  ambiguities: string[];               // Overlapping regions, multiple candidates
  caveats: string[];                   // Limitations, uncertainties, artifacts
  summary: string;                     // One-line summary
}
```

### Functional Group Evidence
```typescript
interface FunctionalGroupEvidence {
  functionalGroup: string;
  primaryBands: FtirBandMatch[];
  supportingBands: FtirBandMatch[];
  evidenceStrength: number;  // 0-1
}
```

### Ambiguity Report
```typescript
interface AmbiguityReport {
  observedBand: FtirDetectedBand;
  candidates: FtirFunctionalGroupCandidate[];
  scoreDifference: number;
  description: string;  // e.g., "Overlapping carbonate/carboxylate region"
}
```

## Error Handling

### Validation Rules

Mirror XRD/XPS validation structure:

```typescript
function validate_ftir_input(input: FtirAgentInput): FtirValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Minimum data points
  if (validPoints.length < 50) {
    errors.push('At least 50 numeric FTIR points are required for band detection.');
  }
  
  // Wavenumber range check
  const xRange = [sorted[0].x, sorted[sorted.length - 1].x];
  if (xRange[0] < 400 || xRange[1] > 4000) {
    warnings.push('Wavenumber range is unusual for typical FTIR mid-IR region.');
  }
  
  // Intensity range check (for absorbance)
  if (signalMode === 'Absorbance' && maxY > 3.0) {
    warnings.push('Absorbance > 3.0 detected: may indicate saturation or baseline issues.');
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

- **No bands detected:** Display message "No bands detected. Adjust detection parameters or check baseline correction."
- **No functional group matches:** Display message "No functional group assignments found. Check wavenumber calibration or expand tolerance."
- **Invalid data:** Display validation errors in left sidebar
- **Parameter validation:** Real-time validation in ParameterDrawer
- **Ambiguous assignments:** Display ambiguity warnings in Caveats panel


## Testing Strategy

### Assessment of Property-Based Testing Applicability

This feature involves creating an FTIR workspace with **range-based functional group matching** and a **scientific reasoning layer**. The core components are:

1. **FTIR processing functions**: Mathematical operations (baseline correction, smoothing, peak detection)
2. **Range-based matching**: Algorithmic matching of bands to wavenumber ranges
3. **Scientific reasoning layer**: Evidence aggregation, ambiguity detection, confidence scoring
4. **UI components**: Workspace layout (reused from XPS)

**PBT IS appropriate for**:
- FTIR processing functions (mathematical properties)
- Range-based matching algorithms (matching properties)
- Confidence scoring algorithms (scoring properties)
- Evidence aggregation logic (aggregation properties)

**PBT is NOT appropriate for**:
- UI rendering (snapshot tests more appropriate)
- Reference database accuracy (validated against literature)

Given the algorithmic nature of FTIR analysis with scientific reasoning, property-based testing is highly appropriate for this feature.

### Unit Tests (Example-Based)

Unit tests will validate specific examples and edge cases:

1. **FTIR Processing Functions**:
   - `correct_ftir_baseline()`: Test polynomial, rubberband, linear methods with known data
   - `smooth_ftir_data()`: Test Savitzky-Golay and moving average with known data
   - `detect_ftir_bands()`: Test band detection with synthetic spectra (3-5 examples)
   - `assign_bands_to_ranges()`: Test range matching with known bands (5-7 examples)
   - `match_functional_groups()`: Test evidence aggregation with known scenarios (5-7 examples)

2. **FTIR Data Model**:
   - Test FtirPoint, FtirDetectedBand, FtirFunctionalGroupCandidate interfaces
   - Test FtirParameters validation
   - Test FTIR demo dataset loading

3. **FTIR Workspace Component**:
   - Test dataset selection
   - Test Auto Mode toggle
   - Test parameter drawer opening/closing
   - Test tab switching (Spectrum, Band List, Functional Groups)
   - Test graph rendering with wavenumber axis

4. **Scientific Reasoning Layer**:
   - Test evidence aggregation with known band combinations (water: O–H + H–O–H)
   - Test ambiguity detection with overlapping ranges (carbonate/carboxylate)
   - Test confidence scoring with known evidence quality scenarios
   - Test caveat generation with known artifact patterns

**Estimated Unit Tests**: ~35 tests

### Property-Based Tests

Property-based tests will validate algorithmic correctness across many generated inputs. Each property test will run with **minimum 100 iterations**.

#### Property 1: Baseline Correction Preserves Data Range
*For any* FTIR spectrum, applying baseline correction SHALL NOT introduce absorbance values outside the original data range

**Validates: Requirements 23**

#### Property 2: Smoothing Reduces Noise
*For any* FTIR spectrum, applying Savitzky-Golay or moving average smoothing SHALL reduce the standard deviation of intensity values

**Validates: Requirements 24**

#### Property 3: Peak Detection Monotonicity
*For any* FTIR spectrum, if the prominence threshold is decreased, the number of detected bands SHALL increase or remain the same

**Validates: Requirements 25**

#### Property 4: Band Width Classification Consistency
*For any* detected FTIR band, the classification (narrow/medium/broad) SHALL be consistent with the FWHM value:
- narrow: FWHM < 50 cm⁻¹
- medium: 50 ≤ FWHM ≤ 100 cm⁻¹
- broad: FWHM > 100 cm⁻¹

**Validates: Requirements 26**

#### Property 5: Range-Based Matching Correctness
*For any* observed band and reference range, the band SHALL be matched to the range if and only if the band wavenumber falls within [range_min, range_max]

**Validates: Requirements 26**

#### Property 6: Multiple Candidates for Overlapping Ranges
*For any* observed band that falls within multiple overlapping reference ranges, the band assignment SHALL include all matching ranges as candidates

**Validates: Requirements 26, 31**

#### Property 7: Supporting Band Logic
*For any* functional group with supporting bands defined, if both primary and supporting bands are matched, the confidence score SHALL be higher than if only the primary band is matched

**Validates: Requirements 27, 31**

#### Property 8: Ambiguity Detection Threshold
*For any* two functional group candidates for the same band, if their score difference is less than the ambiguity threshold, both SHALL be flagged as ambiguous

**Validates: Requirements 27, 31**

#### Property 9: Confidence Score Monotonicity
*For any* two functional group candidates where candidate A has more supporting bands matched than candidate B, the confidence score for A SHALL be greater than or equal to the confidence score for B

**Validates: Requirements 27, 31**

#### Property 10: Confidence Level Thresholds
*For any* functional group candidate:
- If confidence score > 0.75 AND supporting bands present AND no ambiguity, confidence level SHALL be 'high'
- If confidence score < 0.5 OR missing supporting bands, confidence level SHALL be 'low'
- Otherwise, confidence level SHALL be 'medium'

**Validates: Requirements 27, 31**

#### Property 11: Caveat Generation for Ambiguity
*For any* functional group candidate flagged as ambiguous, the caveats list SHALL include a description of the ambiguity

**Validates: Requirements 28, 31**

#### Property 12: Caveat Generation for Missing Supporting Bands
*For any* functional group candidate with supporting bands defined but not matched, the caveats list SHALL include a warning about missing supporting evidence

**Validates: Requirements 28, 31**

#### Property 13: Absorbance-Transmittance Conversion
*For any* FTIR spectrum, converting from Absorbance to Transmittance and back SHALL preserve the original absorbance values within numerical precision (A = -log₁₀(T/100))

**Validates: Requirements 29**

#### Property 14: Wavenumber Range Validation
*For any* generated FTIR spectrum, all wavenumber values SHALL fall within the valid range [400 cm⁻¹, 4000 cm⁻¹]

**Validates: Requirements 22**

#### Property 15: Band Sorting Invariant
*For any* list of detected FTIR bands, the bands SHALL be sorted in descending order by wavenumber (high to low)

**Validates: Requirements 22**

### Property Test Configuration

- **Library**: fast-check (JavaScript/TypeScript property-based testing library)
- **Iterations**: Minimum 100 per property test
- **Tag Format**: `Feature: ftir-workspace-clone, Property {number}: {property_text}`
- **Example Tag**: `Feature: ftir-workspace-clone, Property 5: Range-Based Matching Correctness`

**Estimated Property Tests**: 15 property tests × 100 iterations = 1,500 test cases

### Integration Tests

Integration tests will validate end-to-end workflows:

1. **FTIR Complete Workflow**:
   - Load demo dataset → Baseline correction → Smoothing → Band detection → Band assignment → Functional group matching → Interpretation
   - Verify final interpretation contains expected functional groups (surface hydroxyl, adsorbed water, metal-oxygen)
   - Verify confidence level is reasonable for clean catalyst spectrum (medium to high)

2. **Parameter Changes**:
   - Change baseline method → Verify recomputation
   - Change smoothing window → Verify band detection changes
   - Change prominence threshold → Verify number of detected bands changes

3. **Scientific Reasoning Layer**:
   - Test evidence aggregation: O–H stretch + H–O–H bend → water with high confidence
   - Test ambiguity detection: Band at 1480 cm⁻¹ → carbonate/carboxylate ambiguity
   - Test caveat generation: Missing supporting band → caveat in interpretation

4. **UI Integration**:
   - Test localStorage persistence for FTIR parameters
   - Test URL query parameters (project, dataset)
   - Test navigation to Notebook and Agent Mode
   - Test tab switching with correct data display

**Estimated Integration Tests**: ~12 tests

### Manual Testing Checklist

- [ ] FTIR workspace loads at `/workspace/ftir`
- [ ] Graph displays with wavenumber axis (high to low)
- [ ] Processing pipeline shows 6 FTIR steps
- [ ] Auto Mode toggle works correctly
- [ ] Parameter drawer opens for each step
- [ ] Parameter changes trigger recomputation
- [ ] Band List tab shows detected bands with wavenumber, FWHM, area
- [ ] Functional Groups tab shows multiple candidates for overlapping regions
- [ ] Functional Groups tab shows ambiguity indicators
- [ ] Scientific Summary shows dominant functional groups
- [ ] Evidence Snapshot shows top 3 assigned bands with supporting evidence
- [ ] Validation panel shows FTIR-appropriate recommendations
- [ ] Caveats panel shows overlapping region warnings
- [ ] Caveats panel shows missing supporting band warnings
- [ ] Parameters persist across page reloads
- [ ] Dataset selection works correctly
- [ ] Project integration works (Notebook, Agent Mode links)
- [ ] Absorbance/Transmittance mode switching works correctly

## Implementation Notes

### Cloning Strategy

1. **Copy XPSWorkspace.tsx → FTIRWorkspace.tsx**
   - Find/replace: XPS → FTIR, xps → ftir
   - Update imports to point to FTIR agent and data files
   - Update terminology in UI labels
   - Update graph axis labels (Wavenumber, Absorbance/Transmittance)

2. **Copy xpsAgent/runner.ts → ftirAgent/runner.ts**
   - Implement 6 FTIR processing functions
   - Replace XPS chemical state database with FTIR functional group database
   - Implement range-based matching (NOT exact position matching)
   - Implement scientific reasoning layer (evidence aggregation, ambiguity detection, confidence scoring, caveat generation)
   - Update interpretation generation for functional groups

3. **Create ftirAgent/scientificReasoning.ts**
   - Implement evidence aggregation engine
   - Implement ambiguity detection engine
   - Implement confidence scoring engine
   - Implement caveat generation engine

4. **Copy xpsAgent/types.ts → ftirAgent/types.ts**
   - Define FTIR-specific interfaces
   - Remove XPS-specific fields (bindingEnergy, oxidationState, chemicalEnvironment, etc.)
   - Add FTIR-specific fields (wavenumber, wavenumberRange, functionalGroup, supportingBands, ambiguity, etc.)

5. **Extend parameterDefinitions.ts**
   - Add FTIR_PARAMETER_DEFINITIONS
   - Add FTIR_DEFAULT_PARAMETERS
   - Update getStepParameterDefinitions() to handle 'ftir' technique

6. **Create ftirDemoDatasets.ts**
   - Define 1-2 FTIR demo datasets
   - Use realistic wavenumber ranges (400-4000 cm⁻¹)
   - Include characteristic bands: surface hydroxyl (~3400 cm⁻¹), adsorbed water (~1630 cm⁻¹), carbonate/carboxylate (~1450-1550 cm⁻¹), metal-oxygen (~500-650 cm⁻¹)

7. **Create ftirFunctionalGroupDatabase.ts**
   - Define reference wavenumber ranges for common functional groups
   - Include O–H stretch, H–O–H bend, C–H stretch, C=O stretch, CO₃²⁻, COO⁻, M–O stretch
   - Follow structure with wavenumberRange, expectedWidth, supportingBands, overlappingGroups

8. **Update Graph.tsx (if needed)**
   - Add `type="ftir"` support
   - Implement wavenumber axis configuration (high to low)
   - Update axis labels based on type and signal_mode

9. **Update Router**
   - Add `/workspace/ftir` route
   - Point to FTIRWorkspace component

### Development Workflow

1. Create FTIR type definitions (`ftirAgent/types.ts`)
2. Create FTIR functional group database (`ftirFunctionalGroupDatabase.ts`)
3. Create FTIR demo datasets (`ftirDemoDatasets.ts`)
4. Implement FTIR processing functions (`ftirAgent/runner.ts`)
5. Implement scientific reasoning layer (`ftirAgent/scientificReasoning.ts`)
6. Add FTIR parameter definitions (`parameterDefinitions.ts`)
7. Clone and adapt FTIR workspace component (`FTIRWorkspace.tsx`)
8. Update Graph component for FTIR support (if needed)
9. Add FTIR route to router
10. Test complete workflow

### Code Reuse Metrics

- **100% reuse:** DashboardLayout, ProcessingPipeline, ParameterDrawer, ParameterControl
- **95% reuse:** FTIRWorkspace.tsx (clone of XPSWorkspace.tsx with terminology changes)
- **80% reuse:** ftirAgent/runner.ts (clone of xpsAgent/runner.ts with FTIR logic and scientific reasoning layer)
- **New code:** ftirFunctionalGroupDatabase.ts, ftirDemoDatasets.ts, ftirAgent/scientificReasoning.ts, FTIR parameter definitions

**Estimated LOC:**
- FTIRWorkspace.tsx: ~700 lines (cloned from XPS)
- ftirAgent/runner.ts: ~700 lines (cloned from XPS + scientific reasoning integration)
- ftirAgent/scientificReasoning.ts: ~400 lines (NEW: evidence aggregation, ambiguity detection, confidence scoring, caveat generation)
- ftirAgent/types.ts: ~250 lines (adapted from XPS)
- ftirDemoDatasets.ts: ~150 lines
- ftirFunctionalGroupDatabase.ts: ~200 lines
- parameterDefinitions.ts additions: ~250 lines
- **Total new/adapted code: ~2,650 lines**
- **Total reused code: ~2,000 lines (components, layout, utilities)**

## Visual Consistency

### Layout Dimensions (Identical to XRD/XPS)

- **Left Sidebar:** 288px (w-72)
- **Right Sidebar:** 380px (w-[380px])
- **Center Column:** Flexible (flex-1)
- **Graph Height:** 420px (h-[420px])
- **Sidebar Padding:** 16px (p-4)
- **Section Spacing:** 8px (space-y-2)

### Typography (Identical to XRD/XPS)

- **Section Headers:** text-[10px] font-semibold uppercase tracking-wider
- **Labels:** text-[10px] text-text-muted
- **Values:** text-sm font-semibold text-text-main
- **Monospace:** font-mono tabular-nums

### Colors (Identical to XRD/XPS)

- **Primary:** text-primary, bg-primary
- **Success:** text-emerald-600
- **Warning:** text-amber-600
- **Error:** text-red-600
- **Borders:** border-border, border-border/40
- **Backgrounds:** bg-surface, bg-surface/50

### Spacing (Identical to XRD/XPS)

- **Compact sections:** px-2 py-1.5
- **Standard sections:** px-3 py-2
- **Large sections:** px-4 py-4
- **Gap between items:** gap-1, gap-2, gap-3

## Terminology Mapping

| XRD Term | XPS Term | FTIR Term |
|----------|----------|-----------|
| 2θ (degrees) | Binding Energy (eV) | Wavenumber (cm⁻¹) |
| d-spacing (Å) | FWHM (eV) | FWHM (cm⁻¹) |
| Intensity (a.u.) | Counts (a.u.) | Absorbance or Transmittance (%) |
| hkl (Miller indices) | Chemical State (e.g., Cu²⁺) | Functional Group (e.g., O–H stretch) |
| Phase | Element | Functional Group Category |
| Crystal System | Oxidation State | Bond Type |
| Lattice Parameters | Chemical Environment | Vibrational Mode |
| JCPDS Card | NIST XPS Database | Standard FTIR Database |
| Baseline Correction | Background Subtraction | Baseline Correction |
| Reference Matching | Chemical State Assignment | Functional Group Matching |
| Unexplained Peaks | Unassigned Peaks | Unassigned Bands |
| Phase Confidence | Assignment Confidence | Functional Group Confidence |

## FTIR-Specific Caveats

The Caveats panel should display FTIR-specific limitations:

1. **Overlapping Bands:** "Overlapping bands in 1400-1600 cm⁻¹ region: carbonate/carboxylate ambiguity"
2. **Missing Supporting Bands:** "O–H stretch detected but H–O–H bending band absent: water assignment tentative"
3. **Baseline Distortion:** "Intensity distortion possible due to baseline correction artifacts"
4. **Broad Bands:** "Broad band at 3400 cm⁻¹ may include multiple overlapping O–H environments"
5. **Unassigned Bands:** "Band at 1234 cm⁻¹ unassigned: may indicate additional species"
6. **Sample Preparation:** "Transmission mode sensitive to sample thickness and preparation"
7. **Atmospheric Interference:** "Bands at 2350 cm⁻¹ (CO₂) and 3700 cm⁻¹ (H₂O vapor) may be atmospheric"

## FTIR-Specific Validation Recommendations

The Validation panel should suggest FTIR-appropriate complementary techniques:

1. **Raman:** Confirm vibrational modes through complementary selection rules
2. **XPS:** Validate oxidation states and surface composition
3. **XRD:** Confirm bulk crystalline phase (FTIR is bulk-sensitive)
4. **Multi-tech Fusion:** Combine FTIR vibrational analysis with structural and electronic characterization
5. **Temperature-Programmed Studies:** Use TPD/TPR to probe surface species reactivity
6. **In-situ FTIR:** Perform operando studies under reaction conditions

## Scientific Reasoning Layer Architecture

The scientific reasoning layer is the key innovation for FTIR analysis. It transforms simple band matching into evidence-based interpretation.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FTIR Processing Pipeline                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1-3: Baseline → Smoothing → Band Detection            │
│            (Standard signal processing)                       │
│                                                               │
│                          ↓                                    │
│                                                               │
│  Step 4: Band Assignment (Range-Based Matching)              │
│          ┌──────────────────────────────────┐               │
│          │ For each detected band:          │               │
│          │ - Find overlapping ranges        │               │
│          │ - Calculate position score       │               │
│          │ - Calculate width score          │               │
│          │ - Create band matches            │               │
│          └──────────────────────────────────┘               │
│                                                               │
│                          ↓                                    │
│                                                               │
│  Step 5: Functional Group Matching (Scientific Reasoning)    │
│          ┌──────────────────────────────────┐               │
│          │ Evidence Aggregation Engine      │               │
│          │ - Combine primary + supporting   │               │
│          │ - Calculate evidence strength    │               │
│          └──────────────────────────────────┘               │
│                          ↓                                    │
│          ┌──────────────────────────────────┐               │
│          │ Ambiguity Detection Engine       │               │
│          │ - Identify overlapping ranges    │               │
│          │ - Calculate score differences    │               │
│          │ - Flag ambiguous assignments     │               │
│          └──────────────────────────────────┘               │
│                          ↓                                    │
│          ┌──────────────────────────────────┐               │
│          │ Confidence Scoring Engine        │               │
│          │ - Weight evidence quality        │               │
│          │ - Apply ambiguity penalty        │               │
│          │ - Assign confidence level        │               │
│          └──────────────────────────────────┘               │
│                          ↓                                    │
│          ┌──────────────────────────────────┐               │
│          │ Caveat Generation Engine         │               │
│          │ - Overlapping bands              │               │
│          │ - Missing supporting bands       │               │
│          │ - Baseline artifacts             │               │
│          │ - Unassigned bands               │               │
│          └──────────────────────────────────┘               │
│                                                               │
│                          ↓                                    │
│                                                               │
│  Step 6: Interpretation Summary                              │
│          (Synthesize functional group-level evidence)        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Example: Water Detection with Supporting Evidence

**Input:**
- Band 1: 3400 cm⁻¹, FWHM 200 cm⁻¹ (broad)
- Band 2: 1640 cm⁻¹, FWHM 60 cm⁻¹ (medium)

**Step 4: Band Assignment**
- Band 1 matches "Surface hydroxyl" range [3200-3600 cm⁻¹]
- Band 2 matches "Adsorbed water" range [1630-1650 cm⁻¹]

**Step 5: Functional Group Matching**

*Evidence Aggregation:*
- Primary band: 3400 cm⁻¹ O–H stretch
- Supporting band: 1640 cm⁻¹ H–O–H bending
- Evidence strength: HIGH (both primary and supporting present)

*Ambiguity Detection:*
- No overlapping ranges
- Ambiguity: NONE

*Confidence Scoring:*
- Primary band match: 0.9 (well-positioned, correct width)
- Supporting band present: +0.3 bonus
- No ambiguity: no penalty
- Final score: 0.95 → HIGH confidence

*Caveat Generation:*
- No caveats (clean assignment with supporting evidence)

**Step 6: Interpretation**
- Dominant functional groups: "Surface hydroxyl, Adsorbed water"
- Chemical interpretation: "Metal oxide catalyst with adsorbed water"
- Confidence: HIGH
- Evidence: "Broad 3400 cm⁻¹ band → O–H stretch, 1640 cm⁻¹ → H–O–H bending confirms water"
- Caveats: []

### Example: Carbonate/Carboxylate Ambiguity

**Input:**
- Band 1: 1480 cm⁻¹, FWHM 70 cm⁻¹ (medium)

**Step 4: Band Assignment**
- Band 1 matches "Carbonate" range [1400-1500 cm⁻¹]
- Band 1 also matches "Carboxylate" range [1550-1650 cm⁻¹] (partial overlap)

**Step 5: Functional Group Matching**

*Evidence Aggregation:*
- Primary band: 1480 cm⁻¹
- Supporting bands: NONE
- Evidence strength: MEDIUM (primary only, no supporting)

*Ambiguity Detection:*
- Overlapping ranges detected: carbonate [1400-1500] and carboxylate [1550-1650]
- Score difference: 0.12 (< threshold 0.15)
- Ambiguity: HIGH

*Confidence Scoring:*
- Primary band match: 0.7 (in overlapping region)
- No supporting bands: -0.2 penalty
- Ambiguity detected: -0.2 penalty
- Final score: 0.55 → MEDIUM confidence

*Caveat Generation:*
- "Overlapping bands in 1400-1600 cm⁻¹ region: carbonate/carboxylate ambiguity"
- "No supporting bands detected: assignment tentative"

**Step 6: Interpretation**
- Dominant functional groups: "Carbonate species (tentative)"
- Chemical interpretation: "Carbonate or carboxylate species present (ambiguous)"
- Confidence: MEDIUM
- Evidence: "Band at 1480 cm⁻¹ in overlapping region"
- Caveats: ["Overlapping bands in 1400-1600 cm⁻¹ region: carbonate/carboxylate ambiguity", "No supporting bands detected: assignment tentative"]

## Summary

This design document specifies a **reuse-first architecture** for the FTIR Workspace Clone with a sophisticated **scientific reasoning layer**. By cloning the XRD/XPS Workspace structure and adapting only the domain-specific elements (data model, processing logic, terminology, scientific reasoning), we achieve:

1. **Maximum code reuse:** 100% reuse of layout and UI components
2. **Consistent user experience:** Identical visual design and interaction patterns
3. **Scientific rigor:** Range-based matching with evidence aggregation, ambiguity detection, and confidence scoring
4. **Realistic interpretation:** Evidence-based interpretations with caveats rather than simple peak matching
5. **Maintainability:** Changes to shared components benefit all workspaces (XRD, XPS, FTIR)
6. **Extensibility:** Same pattern can be applied for Raman workspace

The FTIR Workspace will provide materials scientists with a familiar, powerful interface for FTIR data analysis while maintaining the high-quality scientific rigor established in the XRD/XPS Workspaces. The scientific reasoning layer transforms FTIR analysis from simple band matching into evidence-based interpretation with appropriate handling of ambiguity and uncertainty.

**Key Innovation:** The scientific reasoning layer with evidence aggregation, ambiguity detection, confidence scoring, and caveat generation represents a significant advancement over simple peak matching approaches, providing interpretations that reflect the complexity and ambiguity inherent in FTIR spectroscopy.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all 31 requirements with 150+ acceptance criteria, I identified testable properties and eliminated redundancy:

**Redundancy Identified:**
- Requirements 2.2, 5.1, and 22.1-22.5 all test wavenumber axis reversal → Combined into Property 1
- Requirements 8.4, 17.5, 26.2, 26.6, 31.3 all test multiple candidates for overlapping ranges → Combined into Property 6
- Requirements 27.1, 27.3, 31.5 all test supporting band confidence increase → Combined into Property 9
- Requirements 27.4, 31.6 both test ambiguity confidence decrease → Combined into Property 10
- Requirements 17.3, 26.5, 31.2 all test overlap detection → Combined into Property 5
- Requirements 8.5, 27.6, 31.8 all test ambiguity flagging and caveat generation → Combined into Properties 11-12

**Final Property Set** (15 unique properties after removing redundancy):

### Property 1: Wavenumber Axis Reversal

*For any* FTIR dataset, the graph x-axis SHALL be configured with high wavenumber values on the left and low wavenumber values on the right (descending order)

**Validates: Requirements 2.2, 5.1, 22.1-22.5**

### Property 2: FTIR Data Model Structure

*For any* FTIR dataset, all data points SHALL have a wavenumber field (x) in cm⁻¹ and an intensity field (y) representing absorbance or transmittance

**Validates: Requirements 2.1, 2.6**

### Property 3: Parameter Range Validation

*For any* FTIR parameter value, the validation function SHALL accept values within the defined range and reject values outside the range:
- baseline_correction.polynomial_order: [2, 5]
- smoothing.window_size: [5, 21] (odd only)
- smoothing.polynomial_order: [2, 4]
- peakDetection.prominence: [0.01, 0.5]
- peakDetection.min_distance: [10, 50]
- peakDetection.min_height: [0.01, 0.2]
- bandAssignment.wavenumber_tolerance: [10, 50]

**Validates: Requirements 4.8**

### Property 4: Baseline Correction Preserves Data Range

*For any* FTIR spectrum, applying baseline correction (Polynomial, Rubberband, or Linear method) SHALL NOT introduce absorbance values outside the original data range [min, max]

**Validates: Requirements 23.1-23.5**

### Property 5: Range Overlap Detection

*For any* two wavenumber ranges [min1, max1] and [min2, max2], the overlap detection function SHALL correctly identify overlap if and only if the ranges intersect (max1 >= min2 AND max2 >= min1)

**Validates: Requirements 17.3, 26.5, 31.2**

### Property 6: Multiple Candidates for Overlapping Ranges

*For any* observed band with wavenumber W, if W falls within N overlapping reference ranges, the band assignment SHALL produce N candidate assignments (one for each overlapping range)

**Validates: Requirements 8.4, 17.5, 26.2, 26.6, 31.3**

### Property 7: Range-Based Matching Correctness

*For any* observed band with wavenumber W and reference range [min, max], the band SHALL be matched to the range if and only if min ≤ W ≤ max

**Validates: Requirements 26.1**

### Property 8: Band Width Classification

*For any* detected FTIR band with FWHM value F, the classification SHALL be:
- 'narrow' if F < 50 cm⁻¹
- 'medium' if 50 ≤ F ≤ 100 cm⁻¹
- 'broad' if F > 100 cm⁻¹

**Validates: Requirements 26.4**

### Property 9: Supporting Band Confidence Increase

*For any* functional group candidate, if both primary band and supporting bands are matched, the confidence score SHALL be higher than if only the primary band is matched (with all other factors equal)

**Validates: Requirements 27.1, 27.3, 31.5**

### Property 10: Ambiguity Confidence Decrease

*For any* functional group candidate, if ambiguity is detected (multiple candidates with score difference < threshold), the confidence score SHALL be lower than if no ambiguity is detected (with all other factors equal)

**Validates: Requirements 27.4, 31.6**

### Property 11: Ambiguity Indicator Presence

*For any* observed band with multiple candidate assignments where the score difference between top candidates is less than the ambiguity threshold, the ambiguity indicator SHALL be set (non-null)

**Validates: Requirements 8.5**

### Property 12: Caveat Generation for Ambiguity

*For any* functional group candidate flagged as ambiguous, the caveats list SHALL include at least one caveat describing the ambiguity (e.g., "Overlapping bands in X-Y cm⁻¹ region")

**Validates: Requirements 27.6, 31.8**

### Property 13: Caveat Generation for Missing Supporting Bands

*For any* functional group candidate with supporting bands defined in the reference database but not matched in the observed data, the caveats list SHALL include a caveat about missing supporting evidence

**Validates: Requirements 27.6, 31.8**

### Property 14: Confidence Level Thresholds

*For any* functional group candidate with confidence score S:
- If S > 0.75 AND supporting bands present AND no ambiguity, confidence level SHALL be 'high'
- If S < 0.5 OR missing supporting bands, confidence level SHALL be 'low'
- Otherwise, confidence level SHALL be 'medium'

**Validates: Requirements 27.5**

### Property 15: Absorbance-Transmittance Round-Trip

*For any* absorbance value A in the range [0, 3], converting to transmittance T = 10^(-A) × 100, then back to absorbance A' = -log₁₀(T/100), SHALL preserve the original value within numerical precision (|A - A'| < 1e-10)

**Validates: Requirements 29.1-29.5**

### Property 16: Smoothing Noise Reduction

*For any* FTIR spectrum with noise, applying Savitzky-Golay or moving average smoothing SHALL reduce the standard deviation of intensity values (σ_smoothed ≤ σ_original)

**Validates: Requirements 24.1-24.5**

### Property 17: Peak Detection Monotonicity

*For any* FTIR spectrum, if the prominence threshold is decreased (while keeping all other parameters constant), the number of detected bands SHALL increase or remain the same

**Validates: Requirements 25.1-25.5**

### Property 18: Wavenumber Range Validation

*For any* FTIR spectrum, all wavenumber values SHALL fall within the valid mid-IR range [400 cm⁻¹, 4000 cm⁻¹]

**Validates: Requirements 22.1-22.5**

### Property 19: Band Sorting Invariant

*For any* list of detected FTIR bands, the bands SHALL be sorted in descending order by wavenumber (high to low, matching FTIR convention)

**Validates: Requirements 22.1-22.5**

### Property 20: Match Score Calculation

*For any* band-to-range match, the overall match score SHALL be calculated as a weighted combination of position score (how well positioned within range) and width score (how well width matches expected), with both scores in the range [0, 1]

**Validates: Requirements 26.3**

## Notes on Property-Based Testing Strategy

The 20 correctness properties above represent the core algorithmic and mathematical components of the FTIR workspace that benefit from property-based testing. Each property will be tested with **minimum 100 iterations** using the fast-check library.

**Properties NOT included** (tested with unit tests or integration tests instead):
- UI rendering and layout (snapshot tests)
- Terminology and text content (example-based unit tests)
- Reference database content (validation tests against literature)
- Complete workflow integration (integration tests)
- Type system requirements (TypeScript compiler)
- Implementation details (file structure, imports)

**Property Test Tags:**
Each property test will be tagged with: `Feature: ftir-workspace-clone, Property {number}: {property_text}`

Example: `Feature: ftir-workspace-clone, Property 6: Multiple Candidates for Overlapping Ranges`

This tagging enables traceability from requirements → properties → tests and facilitates test result analysis.
