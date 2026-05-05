# Design Document: Cross-Tech Evidence Fusion Workspace

## Overview

The Cross-Tech Evidence Fusion Workspace is a deterministic frontend component that combines analytical evidence from three complementary spectroscopic techniques (XPS, FTIR, and Raman) to generate structured scientific conclusions about materials. The system implements technique-specific authority hierarchies, compatibility scoring, contradiction detection, and structured confidence calculation to produce scientifically rigorous multi-technique decisions.

### Key Design Principles

1. **Technique Authority Hierarchy**: Each analytical technique has decision authority in its domain (XPS for oxidation states, Raman for vibrational structure, FTIR for functional groups)
2. **Structured Confidence**: Confidence is calculated from evidence agreement using weighted formulas, not naive averaging
3. **Deterministic Operation**: All fusion logic runs client-side with no backend calls
4. **Scientific Rigor**: Enforces strict conclusion standards (no "confirmed" without multi-technique agreement)
5. **Existing Pattern Compliance**: Follows DIFARYX workspace patterns (DashboardLayout, three-panel structure, demo data)

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    FusionWorkspace (UI)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Left Panel  │  │Center Panel  │  │ Right Panel  │      │
│  │  - Project   │  │  - 5 Tabs    │  │  - Summary   │      │
│  │  - Techniques│  │  - Decision  │  │  - Confidence│      │
│  │  - Rules     │  │  - Matrix    │  │  - Evidence  │      │
│  │  - Run Btn   │  │  - Claims    │  │  - Validation│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Fusion Agent Runner (Logic)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Evidence Extraction                                  │  │
│  │  - extractXpsEvidence()                              │  │
│  │  - extractFtirEvidence()                             │  │
│  │  - extractRamanEvidence()                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Claim Evaluation (5 evaluators)                     │  │
│  │  - evaluateSpinelStructureClaim()                    │  │
│  │  - evaluateOxidationStateClaim()                     │  │
│  │  - evaluateSurfaceSpeciesClaim()                     │  │
│  │  - evaluateCarbonaceousResidueClaim()                │  │
│  │  - evaluateCarbonateSurfaceClaim()                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Evidence Matrix & Contradiction Detection            │  │
│  │  - buildEvidenceMatrix()                             │  │
│  │  - detectContradictions()                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Decision Generation                                  │  │
│  │  - generateFinalDecision()                           │  │
│  │  - calculateClaimConfidence()                        │  │
│  │  - generateCaveats()                                 │  │
│  │  - generateRecommendations()                         │  │
│  │  - generateReport()                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Technique Agents (Data Sources)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  XPS Agent   │  │  FTIR Agent  │  │ Raman Agent  │      │
│  │  (read-only) │  │  (read-only) │  │ (read-only)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Input**: FusionWorkspace calls `runFusionAnalysis()` with processed results from XPS, FTIR, and Raman agents
2. **Evidence Extraction**: Extract evidence items from each technique's processing result
3. **Claim Evaluation**: Evaluate 5 scientific claims using technique-specific authority weights
4. **Matrix Building**: Construct claims × techniques evidence matrix
5. **Contradiction Detection**: Apply contradiction rules to detect conflicts
6. **Decision Generation**: Synthesize final decision with structured confidence
7. **Output**: Return `FusionResult` containing decision, claims, matrix, contradictions, caveats, and report

## Components and Interfaces

### Type Definitions (`src/agents/fusionAgent/types.ts`)

#### Core Evidence Types

```typescript
export type TechniqueType = 'XPS' | 'FTIR' | 'Raman';
export type SupportType = 'supports' | 'contradicts' | 'neutral' | 'ambiguous';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ClaimHierarchy = 'primary' | 'supporting' | 'context';
export type ClaimStatus = 'supported' | 'unresolved' | 'contradicted';
export type ContradictionSeverity = 'none' | 'low' | 'medium' | 'high';

export interface EvidenceItem {
  technique: TechniqueType;
  type: string;                        // e.g., "oxidation-state", "functional-group"
  value: string | number;              // e.g., "Cu²⁺", "A1g spinel ferrite"
  confidence: number;                  // 0-1 from original technique
  weight: number;                      // 0-1 evidence-specific weight
  label: string;                       // Human-readable description
}

export interface TechniqueSupport {
  technique: TechniqueType;
  support: SupportType;
  evidenceItems: EvidenceItem[];
  evidenceWeight: number;              // 0-1 technique authority weight
  reasoning: string;                   // Why this technique supports/contradicts
}

export interface Claim {
  id: string;                          // e.g., "spinel-structure"
  title: string;                       // e.g., "Spinel-like ferrite structure"
  description: string;                 // What this claim asserts
  hierarchy: ClaimHierarchy;           // Claim importance level
  supportingTechniques: TechniqueSupport[];
  confidence: ConfidenceLevel;
  confidenceScore: number;             // 0-1 calculated via formula
  status: ClaimStatus;
  caveats: string[];
}
```

#### Evidence Matrix Types

```typescript
export interface MatrixCell {
  claimId: string;
  technique: TechniqueType;
  support: SupportType;
  evidenceText: string;                // Short summary for display
  evidenceItems: EvidenceItem[];
}

export interface EvidenceMatrix {
  claims: Claim[];
  techniques: TechniqueType[];
  cells: MatrixCell[][];               // [claimIndex][techniqueIndex]
}
```

#### Contradiction Types

```typescript
export interface Contradiction {
  id: string;
  severity: ContradictionSeverity;
  score: number;                       // 0-1 contradiction strength
  techniques: TechniqueType[];
  claimId: string;
  explanation: string;
  confidenceImpact: number;            // Penalty to apply (0-0.3)
  effectOnConfidence: string;          // Human-readable description
}
```

#### Fusion Result Types

```typescript
export interface FusionDecision {
  primaryConclusion: string;
  confidence: ConfidenceLevel;
  confidenceScore: number;             // 0-1
}

export interface FusionResult {
  decision: FusionDecision;
  claims: Claim[];
  evidenceMatrix: EvidenceMatrix;
  contradictions: Contradiction[];
  supportedClaims: string[];           // Claim IDs
  unresolvedClaims: string[];          // Claim IDs
  caveats: string[];
  recommendedValidation: string[];
  report: string;                      // Reviewer-style narrative
}
```

### Fusion Agent Runner (`src/agents/fusionAgent/runner.ts`)

#### Evidence Extraction Functions

**`extractXpsEvidence(result: XpsProcessingResult): EvidenceItem[]`**
- Extracts oxidation states from XPS state aggregations
- Extracts satellite features when present
- Assigns confidence based on original technique confidence level
- Assigns weights: primary oxidation state (1.0), satellite (0.8)

**`extractFtirEvidence(result: FtirProcessingResult): EvidenceItem[]`**
- Extracts functional groups from FTIR functional group candidates
- Assigns confidence from original technique score
- Assigns weights: diagnostic (1.0), ambiguous (0.6)

**`extractRamanEvidence(result: RamanProcessingResult): EvidenceItem[]`**
- Extracts vibrational modes from Raman mode candidates
- Assigns weights based on mode type:
  - A1g primary: 1.0
  - Eg/T2g supporting: 0.8
  - Lower ferrite: 0.6
  - D/G carbon bands: 0.5

#### Claim Evaluators

**`evaluateSpinelStructureClaim()`**
- **Authority**: Raman (structure), XPS (corroboration), FTIR (context)
- **Logic**:
  - Raman: Supports if A1g + (Eg OR lower ferrite) detected
  - XPS: Supports if Cu²⁺ OR Fe³⁺ detected
  - FTIR: Neutral (M-O band supports metal oxide but not spinel specifically)
- **Confidence**: HIGH if Raman + XPS both support, MEDIUM if Raman supports with partial XPS, LOW otherwise

**`evaluateOxidationStateClaim()`**
- **Authority**: XPS (oxidation states), Raman (context), FTIR (irrelevant)
- **Logic**:
  - XPS: Supports if oxidation states detected
  - Raman: Supports if ferrite modes suggest expected oxidation states
  - FTIR: Neutral (does not provide oxidation state information)
- **Confidence**: Based on XPS evidence quality

**`evaluateSurfaceSpeciesClaim()`**
- **Authority**: FTIR (functional groups), XPS (corroboration), Raman (context)
- **Logic**:
  - FTIR: Supports if surface hydroxyl OR adsorbed water detected
  - XPS: Neutral (surface composition not in demo)
  - Raman: Neutral (does not probe surface species)
- **Confidence**: Based on FTIR evidence

**`evaluateCarbonaceousResidueClaim()`**
- **Authority**: Raman (D/G bands), FTIR (corroboration), XPS (context)
- **Logic**:
  - Raman: Supports if D band OR G band detected
  - FTIR: Neutral (C-H bands not in demo)
  - XPS: Neutral (C 1s analysis not in demo)
- **Confidence**: Based on Raman D/G band evidence
- **Caveat**: D/G bands do not confirm ferrite phase

**`evaluateCarbonateSurfaceClaim()`**
- **Authority**: FTIR (carbonate/carboxylate), XPS (context), Raman (irrelevant)
- **Logic**:
  - FTIR: Supports if carbonate/carboxylate overlap detected
  - XPS: Neutral (C 1s analysis not in demo)
  - Raman: Neutral (does not probe carbonate surface species)
- **Confidence**: Based on FTIR evidence
- **Caveat**: FTIR alone cannot distinguish carbonate from carboxylate

#### Confidence Calculation

**`calculateClaimConfidence()`**
- **Formula**: `baseConfidence * (1 - contradictionPenalty) * hierarchyMultiplier`
- **Base Confidence**: Weighted average of technique scores using authority weights
- **Contradiction Penalty**: 0-0.3 based on contradiction severity
- **Hierarchy Multiplier**: primary (1.0), supporting (0.9), context (0.8)

**Authority Weights** (from `types.ts`):
```typescript
'spinel-structure': { xps: 0.6, ftir: 0.2, raman: 1.0 }
'oxidation-states': { xps: 1.0, ftir: 0.1, raman: 0.3 }
'surface-species': { xps: 0.5, ftir: 1.0, raman: 0.2 }
'carbonaceous-residue': { xps: 0.3, ftir: 0.5, raman: 1.0 }
'carbonate-surface': { xps: 0.2, ftir: 1.0, raman: 0.1 }
```

#### Evidence Matrix Building

**`buildEvidenceMatrix(claims: Claim[]): EvidenceMatrix`**
- Constructs claims × techniques matrix
- For each claim-technique pair, creates MatrixCell with:
  - Support status (supports/contradicts/neutral/ambiguous)
  - Evidence text (first evidence item label or reasoning)
  - Evidence items array

#### Contradiction Detection

**`detectContradictions()`**
- **Rule 1**: Raman suggests spinel but XPS lacks expected oxidation states
  - Severity: MEDIUM
  - Impact: Reduces confidence to MEDIUM
- **Rule 2**: Strong carbonate/carboxylate surface species
  - Severity: LOW
  - Impact: Indicates surface complexity
- **Rule 3**: Raman D/G bands indicate carbon contribution
  - Severity: LOW
  - Impact: Indicates additional carbon-based species

**Contradiction Score Formula**:
```
score = evidenceStrength * disagreementMagnitude * claimImportance
confidenceImpact = score * CONTRADICTION_SEVERITY_MULTIPLIERS[severity]
```

#### Decision Generation

**`generateFinalDecision()`**
- Synthesizes primary conclusion from supported claims
- Calculates final confidence as minimum of primary claim confidences
- Applies contradiction penalties
- Classifies confidence: HIGH (≥0.70), MEDIUM (≥0.50), LOW (<0.50)
- Adds XPS caveat if oxidation state evidence is weak

**`generateCaveats()`**
- Collects caveats from all claims
- Adds contradiction-specific caveats for medium/high severity
- Removes duplicates

**`generateRecommendations()`**
- XPS depth profiling if oxidation states unresolved
- TEM and XRD if spinel structure not high confidence
- TPD if carbonate surface species detected
- CHN elemental analysis if carbon contribution detected

**`generateReport()`**
- Generates reviewer-style markdown report with:
  - Final decision summary
  - Evidence organized by technique
  - Claim-level reasoning
  - Contradictions
  - Caveats

### FusionWorkspace UI Component (`src/pages/FusionWorkspace.tsx`)

#### Component Structure

```typescript
export default function FusionWorkspace() {
  const [activeTab, setActiveTab] = useState<'decision' | 'matrix' | 'claims' | 'contradictions' | 'report'>('decision');
  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null);
  
  const handleRunFusion = () => {
    const xpsResult = runXpsProcessing(xpsDemoData);
    const ftirResult = runFtirProcessing(ftirDemoData);
    const ramanResult = runRamanProcessing(ramanDemoData);
    const result = runFusionAnalysis(xpsResult, ftirResult, ramanResult);
    setFusionResult(result);
  };
  
  // Auto-run fusion on mount
  React.useEffect(() => {
    handleRunFusion();
  }, []);
  
  return (
    <DashboardLayout
      leftPanel={leftPanel}
      centerPanel={centerPanel}
      rightPanel={rightPanel}
    />
  );
}
```

#### Left Panel

**Content**:
- Project Information (project name, sample name)
- Included Techniques (XPS, FTIR, Raman with checkmarks)
- Fusion Rules card explaining authority hierarchy
- Run Fusion button

**Styling**: Follows existing workspace patterns with white cards, blue info cards, and indigo primary button

#### Right Panel

**Content**:
- Final Scientific Summary (primary conclusion text)
- Confidence & Reliability section:
  - Overall confidence badge (HIGH/MEDIUM/LOW)
  - Confidence score percentage
  - Supported claims count
  - Contradictions count
- Top Supporting Evidence (top 3 supported claims with techniques)
- Recommended Validation (top 3 recommendations)

**Styling**: White cards with colored badges, amber warning card for validation

#### Center Panel

**Tab Bar**: 5 tabs with active state styling (indigo border-bottom)

**Tab 1: Fusion Decision**
- Final Conclusion card with confidence badge
- Supported Claims list with green checkmarks
- Unresolved Claims list with yellow warning icons
- Caveats card (amber background)

**Tab 2: Evidence Matrix**
- Table with claims as rows, techniques as columns
- Each cell shows:
  - Support badge (supports/contradicts/neutral/ambiguous)
  - Short evidence text (truncated with tooltip)
- Hover effect on rows

**Tab 3: Claim Cards**
- One card per claim (5 total)
- Each card shows:
  - Title and confidence badge
  - Description
  - Supporting techniques with reasoning
  - Evidence items list
  - Caveats (amber background)

**Tab 4: Contradictions**
- One card per contradiction
- Each card shows:
  - ID and severity badge
  - Techniques involved
  - Explanation
  - Effect on confidence
- Empty state if no contradictions

**Tab 5: Report**
- Markdown-formatted report in prose styling
- Pre-formatted text with whitespace preservation

## Data Models

### Demo Data Structure

The fusion workspace uses processed outputs from existing technique agents:

**XPS Demo Data** (`xpsDemoData`):
- Cu 2p region with Cu²⁺ oxidation state
- Satellite features indicating Cu²⁺
- State aggregations with confidence levels

**FTIR Demo Data** (`ftirDemoData`):
- Surface hydroxyl band (~3400 cm⁻¹)
- Adsorbed water band (~1630 cm⁻¹)
- Carbonate/carboxylate overlap region
- M-O band (~550 cm⁻¹)

**Raman Demo Data** (`ramanDemoData`):
- A1g spinel ferrite mode (~690 cm⁻¹)
- Eg ferrite mode (~470 cm⁻¹)
- Lower ferrite mode (~330 cm⁻¹)
- D and G bands (carbon)

### Expected Demo Output

**Final Decision**:
```
"Evidence suggests a spinel-like ferrite material with surface hydroxyl/water species 
and possible carbonaceous residue. Oxidation-state confirmation remains dependent on 
XPS evidence quality"
```

**Confidence**: MEDIUM (0.55-0.65)

**Supported Claims**:
1. Spinel-like ferrite structure (MEDIUM)
2. Cu and Fe oxidation state consistency (MEDIUM)
3. Surface hydroxyl and adsorbed water (MEDIUM)
4. Carbonaceous residue and disorder (LOW)
5. Carbonate and carboxylate surface species (LOW)

**Contradictions**:
1. spinel-xps-mismatch (MEDIUM): Raman suggests spinel but XPS lacks corroborating oxidation state evidence
2. surface-complexity (LOW): Carbonate/carboxylate surface species complicate interpretation
3. carbon-contribution (LOW): D/G bands indicate additional carbon-based species

## Error Handling

### Validation

- **Input Validation**: Fusion agent expects valid `XpsProcessingResult`, `FtirProcessingResult`, and `RamanProcessingResult` objects
- **Missing Evidence**: If a technique provides no evidence, claim evaluators handle gracefully with neutral support
- **Empty Results**: UI displays empty states for contradictions and unresolved claims

### Edge Cases

- **No Supported Claims**: Final decision defaults to LOW confidence with generic conclusion
- **All Techniques Neutral**: Claim remains unresolved with LOW confidence
- **High Contradiction Severity**: Confidence capped at MEDIUM even with strong evidence

## Testing Strategy

### Unit Tests

**Evidence Extraction**:
- Test `extractXpsEvidence()` with various XPS state aggregations
- Test `extractFtirEvidence()` with various functional group candidates
- Test `extractRamanEvidence()` with various mode candidates
- Verify evidence item weights and confidence values

**Claim Evaluation**:
- Test each claim evaluator with all combinations of technique support
- Verify authority hierarchy is respected
- Verify confidence calculation formulas
- Test edge cases (no evidence, single technique, all techniques)

**Confidence Calculation**:
- Test `calculateClaimConfidence()` with various technique scores and weights
- Verify contradiction penalties are applied correctly
- Verify hierarchy multipliers are applied correctly

**Contradiction Detection**:
- Test each contradiction rule with matching and non-matching evidence
- Verify contradiction severity classification
- Verify confidence impact calculation

**Decision Generation**:
- Test `generateFinalDecision()` with various claim combinations
- Verify final confidence is minimum of primary claims
- Verify contradiction penalties reduce confidence
- Test caveat and recommendation generation

### Integration Tests

**Full Fusion Workflow**:
- Test `runFusionAnalysis()` with demo data
- Verify all 5 claims are evaluated
- Verify evidence matrix is built correctly
- Verify contradictions are detected
- Verify final decision matches expected output

**UI Component Tests**:
- Test FusionWorkspace renders without errors
- Test tab switching
- Test Run Fusion button triggers analysis
- Test all 5 tabs display correct content
- Test empty states

### Property-Based Testing

Property-based testing is **NOT applicable** to this feature because:

1. **Deterministic Demo Data**: The fusion workspace uses fixed demo data, not variable inputs
2. **Complex Domain Logic**: Fusion rules are domain-specific and cannot be expressed as universal properties
3. **UI Rendering**: The workspace is primarily a UI component with rendering logic
4. **Configuration Validation**: Authority weights and contradiction rules are configuration, not testable properties

**Alternative Testing Approach**:
- **Snapshot Tests**: Capture expected fusion results for demo data
- **Example-Based Unit Tests**: Test specific evidence combinations with known expected outcomes
- **Integration Tests**: Verify end-to-end workflow with demo data

## Deployment Considerations

### Build Requirements

- No new dependencies required
- All fusion logic is TypeScript/React
- Uses existing DIFARYX workspace patterns
- Compatible with Vite build system

### Performance

- **Client-Side Only**: All fusion logic runs in browser
- **Deterministic**: No network calls, no async operations
- **Fast Execution**: Fusion analysis completes in <100ms
- **Memory Efficient**: Demo data is small (~10KB total)

### Browser Compatibility

- Requires modern browser with ES6+ support
- Uses React 18 features (hooks, concurrent rendering)
- No special browser APIs required

## Future Enhancements

### Phase 2 Enhancements (Not in Current Scope)

1. **Dynamic Data Loading**: Support uploading real XPS/FTIR/Raman data files
2. **Customizable Authority Weights**: UI for adjusting technique authority weights
3. **Export Functionality**: Export fusion report as PDF or JSON
4. **Visualization**: Add graphs showing evidence strength by technique
5. **Comparison Mode**: Compare fusion results across multiple samples
6. **Advanced Contradiction Rules**: Add more sophisticated contradiction detection
7. **Confidence Sensitivity Analysis**: Show how confidence changes with different weights

### Extensibility

The fusion agent architecture supports:
- Adding new claim types (modify claim evaluators)
- Adding new techniques (extend evidence extraction)
- Modifying authority weights (update `TECHNIQUE_AUTHORITY_WEIGHTS`)
- Adding new contradiction rules (extend `detectContradictions()`)

## References

### Scientific Background

- **XPS**: X-ray Photoelectron Spectroscopy for oxidation state determination
- **FTIR**: Fourier Transform Infrared Spectroscopy for functional group identification
- **Raman**: Raman Spectroscopy for vibrational mode and phase identification
- **Spinel Ferrites**: CuFe2O4 and related materials with spinel crystal structure

### Implementation References

- Existing DIFARYX workspace patterns (XPSWorkspace, FTIRWorkspace, RamanWorkspace)
- DashboardLayout component for three-panel structure
- Existing agent runners (xpsAgent, ftirAgent, ramanAgent)
- Demo data structures (xpsDemoData, ftirDemoData, ramanDemoData)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-29  
**Status**: Implementation Complete
