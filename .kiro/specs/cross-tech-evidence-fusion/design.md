# Design Document: Cross-Tech Evidence Fusion Workspace

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    FusionWorkspace.tsx                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Left Panel   │  │ Center Panel │  │ Right Panel  │     │
│  │ - Project    │  │ - 5 Tabs     │  │ - Summary    │     │
│  │ - Techniques │  │ - Decision   │  │ - Confidence │     │
│  │ - Run Button │  │ - Matrix     │  │ - Evidence   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              fusionAgent/runner.ts                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ runFusionAnalysis()                                   │  │
│  │  1. Import technique outputs                          │  │
│  │  2. Extract evidence items                            │  │
│  │  3. Evaluate claims (5 claim evaluators)              │  │
│  │  4. Build evidence matrix                             │  │
│  │  5. Detect contradictions                             │  │
│  │  6. Generate final decision                           │  │
│  │  7. Return FusionResult                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Technique Agents (Read-Only)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ xpsAgent     │  │ ftirAgent    │  │ ramanAgent   │     │
│  │ - Cu²⁺ state │  │ - OH bands   │  │ - A1g mode   │     │
│  │ - Satellites │  │ - M-O bands  │  │ - Eg modes   │     │
│  │ - Confidence │  │ - Carbonate  │  │ - D/G bands  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

1. **User clicks "Run Fusion"** → FusionWorkspace calls `runFusionAnalysis()`
2. **Runner imports** → Loads processed outputs from XPS/FTIR/Raman agents
3. **Evidence extraction** → Converts technique outputs to standardized evidence items
4. **Claim evaluation** → Runs 5 claim evaluators (spinel structure, oxidation states, surface species, carbon, carbonate)
5. **Matrix building** → Populates evidence matrix (claims × techniques)
6. **Contradiction detection** → Applies contradiction rules
7. **Decision generation** → Synthesizes final conclusion from claim results
8. **UI rendering** → FusionWorkspace displays results in tabs

---

## 2. Core Data Structures

### 2.1 Claim Schema with Hierarchy

```typescript
// src/agents/fusionAgent/types.ts

export type ClaimHierarchy = 'primary' | 'supporting' | 'context';

export interface Claim {
  id: string;                          // e.g., "spinel-structure"
  title: string;                       // e.g., "Spinel-like ferrite structure"
  description: string;                 // What this claim asserts
  hierarchy: ClaimHierarchy;           // Claim importance level
  supportingTechniques: TechniqueSupport[];
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;             // 0-1 (calculated via formula)
  status: 'supported' | 'unresolved' | 'contradicted';
  caveats: string[];
}

export interface TechniqueSupport {
  technique: 'XPS' | 'FTIR' | 'Raman';
  support: 'supports' | 'contradicts' | 'neutral' | 'ambiguous';
  evidenceItems: EvidenceItem[];
  evidenceWeight: number;              // 0-1 (technique-specific weight)
  reasoning: string;                   // Why this technique supports/contradicts
}

export interface EvidenceItem {
  technique: 'XPS' | 'FTIR' | 'Raman';
  type: string;                        // e.g., "peak", "oxidation-state", "band"
  value: string | number;              // e.g., "690 cm⁻¹", "Cu²⁺"
  confidence: number;                  // 0-1 from original technique
  weight: number;                      // 0-1 (evidence-specific weight)
  label: string;                       // Human-readable description
}
```

**Claim Hierarchy Definitions:**

| Hierarchy | Definition | Examples | Impact on Final Decision |
|-----------|------------|----------|-------------------------|
| **Primary** | Core scientific assertions about material identity | Spinel structure, Oxidation states | Required for HIGH confidence; drives primary conclusion |
| **Supporting** | Corroborating evidence that strengthens primary claims | Surface species consistency | Increases confidence in primary claims |
| **Context** | Environmental or surface phenomena that don't affect bulk identity | Carbonaceous residue, Carbonate surface | Provides caveats; does not reduce primary claim confidence |

**Claim Hierarchy Assignments:**
- `spinel-structure`: **PRIMARY**
- `oxidation-states`: **PRIMARY**
- `surface-species`: **SUPPORTING**
- `carbonaceous-residue`: **CONTEXT**
- `carbonate-surface`: **CONTEXT**

### 2.2 Evidence Matrix Model

```typescript
export interface EvidenceMatrix {
  claims: Claim[];
  techniques: ('XPS' | 'FTIR' | 'Raman')[];
  cells: MatrixCell[][];               // [claimIndex][techniqueIndex]
}

export interface MatrixCell {
  claimId: string;
  technique: 'XPS' | 'FTIR' | 'Raman';
  support: 'supports' | 'contradicts' | 'neutral' | 'ambiguous';
  evidenceText: string;                // Short summary for display
  evidenceItems: EvidenceItem[];
}
```

### 2.3 Contradiction Schema with Scoring

```typescript
export interface Contradiction {
  id: string;
  severity: 'none' | 'low' | 'medium' | 'high';
  score: number;                       // 0-1 (contradiction strength)
  techniques: ('XPS' | 'FTIR' | 'Raman')[];
  claimId: string;
  explanation: string;
  confidenceImpact: number;            // Penalty to apply (0-0.3)
  effectOnConfidence: string;          // Human-readable description
}
```

**Contradiction Scoring System:**

| Severity | Score Range | Confidence Impact | Conditions |
|----------|-------------|-------------------|------------|
| **HIGH** | 0.7 - 1.0 | -0.25 to -0.30 | Primary claims directly contradict (e.g., Raman says spinel, XPS says no metal oxides) |
| **MEDIUM** | 0.4 - 0.69 | -0.10 to -0.15 | Primary claim lacks corroboration from authority technique (e.g., Raman spinel without XPS oxidation states) |
| **LOW** | 0.1 - 0.39 | -0.03 to -0.05 | Context claims indicate complexity (e.g., surface carbonate, D/G bands) |
| **NONE** | 0.0 | 0.00 | No contradictions detected |

**Contradiction Scoring Formula:**
```
contradictionScore = (evidenceStrength × disagreementMagnitude × claimImportance)

Where:
- evidenceStrength = average confidence of conflicting evidence items (0-1)
- disagreementMagnitude = 1.0 (full contradiction) or 0.5 (partial/ambiguous)
- claimImportance = 1.0 (primary), 0.7 (supporting), 0.3 (context)
```

**Confidence Impact Calculation:**
```
confidenceImpact = contradictionScore × severityMultiplier

Where severityMultiplier:
- HIGH: 0.30
- MEDIUM: 0.15
- LOW: 0.05
```

### 2.4 Fusion Result Schema

```typescript
export interface FusionResult {
  decision: {
    primaryConclusion: string;
    confidence: 'high' | 'medium' | 'low';
    confidenceScore: number;           // 0-1
  };
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

---

## 3. Fusion Agent Runner Architecture

### 3.1 Main Function

```typescript
// src/agents/fusionAgent/runner.ts

export function runFusionAnalysis(
  xpsResult: XpsProcessingResult,
  ftirResult: FtirProcessingResult,
  ramanResult: RamanProcessingResult
): FusionResult {
  
  // Step 1: Extract evidence items from each technique
  const xpsEvidence = extractXpsEvidence(xpsResult);
  const ftirEvidence = extractFtirEvidence(ftirResult);
  const ramanEvidence = extractRamanEvidence(ramanResult);
  
  // Step 2: Evaluate each claim
  const claims: Claim[] = [
    evaluateSpinelStructureClaim(xpsEvidence, ftirEvidence, ramanEvidence),
    evaluateOxidationStateClaim(xpsEvidence, ftirEvidence, ramanEvidence),
    evaluateSurfaceSpeciesClaim(xpsEvidence, ftirEvidence, ramanEvidence),
    evaluateCarbonaceousResidueClaim(xpsEvidence, ftirEvidence, ramanEvidence),
    evaluateCarbonateSurfaceClaim(xpsEvidence, ftirEvidence, ramanEvidence),
  ];
  
  // Step 3: Build evidence matrix
  const evidenceMatrix = buildEvidenceMatrix(claims);
  
  // Step 4: Detect contradictions
  const contradictions = detectContradictions(claims, xpsEvidence, ftirEvidence, ramanEvidence);
  
  // Step 5: Generate final decision
  const decision = generateFinalDecision(claims, contradictions);
  
  // Step 6: Categorize claims
  const supportedClaims = claims.filter(c => c.status === 'supported').map(c => c.id);
  const unresolvedClaims = claims.filter(c => c.status === 'unresolved').map(c => c.id);
  
  // Step 7: Generate caveats and recommendations
  const caveats = generateCaveats(claims, contradictions);
  const recommendedValidation = generateRecommendations(claims, contradictions);
  
  // Step 8: Generate report
  const report = generateReport(decision, claims, evidenceMatrix, contradictions);
  
  return {
    decision,
    claims,
    evidenceMatrix,
    contradictions,
    supportedClaims,
    unresolvedClaims,
    caveats,
    recommendedValidation,
    report,
  };
}
```

### 3.2 Evidence Extraction Functions

```typescript
function extractXpsEvidence(result: XpsProcessingResult): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  
  // Extract oxidation states
  for (const state of result.chemicalStates) {
    evidence.push({
      technique: 'XPS',
      type: 'oxidation-state',
      value: state.element + state.oxidationState,
      confidence: state.confidence,
      label: `${state.element} ${state.oxidationState} at ${state.bindingEnergy.toFixed(1)} eV`,
    });
  }
  
  // Extract satellite features
  if (result.hasSatellite) {
    evidence.push({
      technique: 'XPS',
      type: 'satellite',
      value: 'Cu²⁺ satellite',
      confidence: 0.8,
      label: 'Cu²⁺ satellite peak detected',
    });
  }
  
  return evidence;
}

function extractFtirEvidence(result: FtirProcessingResult): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  
  // Extract functional groups
  for (const group of result.functionalGroupCandidates) {
    evidence.push({
      technique: 'FTIR',
      type: 'functional-group',
      value: group.functionalGroup,
      confidence: group.score,
      label: `${group.functionalGroup} at ${group.matches[0]?.observedBand.wavenumber.toFixed(0)} cm⁻¹`,
    });
  }
  
  return evidence;
}

function extractRamanEvidence(result: RamanProcessingResult): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  
  // Extract vibrational modes
  for (const mode of result.modeCandidate) {
    evidence.push({
      technique: 'Raman',
      type: 'vibrational-mode',
      value: mode.modeName,
      confidence: mode.score,
      label: `${mode.modeName} at ${mode.matches[0]?.observedPeak.ramanShift.toFixed(0)} cm⁻¹`,
    });
  }
  
  return evidence;
}
```

### 3.3 Claim Evaluator: Spinel Structure

```typescript
function evaluateSpinelStructureClaim(
  xpsEvidence: EvidenceItem[],
  ftirEvidence: EvidenceItem[],
  ramanEvidence: EvidenceItem[]
): Claim {
  
  const supportingTechniques: TechniqueSupport[] = [];
  
  // Raman has authority for spinel structure
  const hasA1g = ramanEvidence.some(e => e.value === 'A1g spinel ferrite');
  const hasEg = ramanEvidence.some(e => e.value === 'Eg ferrite mode');
  const hasLowerFerrite = ramanEvidence.some(e => e.value === 'Lower ferrite mode');
  
  let ramanSupport: 'supports' | 'neutral' = 'neutral';
  let ramanReasoning = '';
  const ramanEvidenceItems: EvidenceItem[] = [];
  
  if (hasA1g && (hasEg || hasLowerFerrite)) {
    ramanSupport = 'supports';
    ramanReasoning = 'A1g mode with supporting Eg/T2g modes consistent with spinel structure';
    ramanEvidenceItems.push(...ramanEvidence.filter(e => 
      e.value === 'A1g spinel ferrite' || e.value === 'Eg ferrite mode' || e.value === 'Lower ferrite mode'
    ));
  } else if (hasA1g) {
    ramanSupport = 'supports';
    ramanReasoning = 'A1g mode suggests spinel structure (limited supporting evidence)';
    ramanEvidenceItems.push(...ramanEvidence.filter(e => e.value === 'A1g spinel ferrite'));
  }
  
  supportingTechniques.push({
    technique: 'Raman',
    support: ramanSupport,
    evidenceItems: ramanEvidenceItems,
    reasoning: ramanReasoning,
  });
  
  // XPS provides corroborating evidence for oxidation states
  const hasCu2 = xpsEvidence.some(e => e.type === 'oxidation-state' && e.value.includes('Cu²⁺'));
  const hasFe3 = xpsEvidence.some(e => e.type === 'oxidation-state' && e.value.includes('Fe³⁺'));
  
  let xpsSupport: 'supports' | 'neutral' | 'ambiguous' = 'neutral';
  let xpsReasoning = '';
  const xpsEvidenceItems: EvidenceItem[] = [];
  
  if (hasCu2 || hasFe3) {
    xpsSupport = 'supports';
    xpsReasoning = 'Oxidation states consistent with ferrite chemistry';
    xpsEvidenceItems.push(...xpsEvidence.filter(e => 
      e.type === 'oxidation-state' && (e.value.includes('Cu²⁺') || e.value.includes('Fe³⁺'))
    ));
  }
  
  supportingTechniques.push({
    technique: 'XPS',
    support: xpsSupport,
    evidenceItems: xpsEvidenceItems,
    reasoning: xpsReasoning,
  });
  
  // FTIR provides neutral evidence (M-O band supports metal oxide but not spinel specifically)
  const hasMO = ftirEvidence.some(e => e.value === 'Metal-oxygen');
  
  let ftirSupport: 'supports' | 'neutral' = 'neutral';
  let ftirReasoning = 'FTIR M-O band supports metal oxide framework but does not confirm spinel structure';
  const ftirEvidenceItems: EvidenceItem[] = [];
  
  if (hasMO) {
    ftirEvidenceItems.push(...ftirEvidence.filter(e => e.value === 'Metal-oxygen'));
  }
  
  supportingTechniques.push({
    technique: 'FTIR',
    support: ftirSupport,
    evidenceItems: ftirEvidenceItems,
    reasoning: ftirReasoning,
  });
  
  // Determine overall claim status and confidence
  let status: 'supported' | 'unresolved' | 'contradicted' = 'unresolved';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let confidenceScore = 0.3;
  
  if (ramanSupport === 'supports' && xpsSupport === 'supports') {
    status = 'supported';
    confidence = 'high';
    confidenceScore = 0.75;
  } else if (ramanSupport === 'supports') {
    status = 'supported';
    confidence = 'medium';
    confidenceScore = 0.60;
  }
  
  const caveats: string[] = [];
  if (!hasEg && !hasLowerFerrite && hasA1g) {
    caveats.push('A1g mode observed without corroborating Eg or T2g modes');
  }
  if (!hasCu2 && !hasFe3) {
    caveats.push('XPS oxidation state evidence not available for corroboration');
  }
  
  return {
    id: 'spinel-structure',
    title: 'Spinel-like ferrite structure',
    description: 'Material exhibits vibrational modes and oxidation states consistent with spinel ferrite structure',
    supportingTechniques,
    confidence,
    confidenceScore,
    status,
    caveats,
  };
}
```

### 3.4 Contradiction Detection

```typescript
function detectContradictions(
  claims: Claim[],
  xpsEvidence: EvidenceItem[],
  ftirEvidence: EvidenceItem[],
  ramanEvidence: EvidenceItem[]
): Contradiction[] {
  
  const contradictions: Contradiction[] = [];
  
  // Rule 1: Raman suggests spinel but XPS lacks expected oxidation states
  const spinelClaim = claims.find(c => c.id === 'spinel-structure');
  const ramanSupportsSpinel = spinelClaim?.supportingTechniques.find(t => t.technique === 'Raman')?.support === 'supports';
  const xpsSupportsSpinel = spinelClaim?.supportingTechniques.find(t => t.technique === 'XPS')?.support === 'supports';
  
  if (ramanSupportsSpinel && !xpsSupportsSpinel) {
    contradictions.push({
      id: 'spinel-xps-mismatch',
      severity: 'medium',
      techniques: ['Raman', 'XPS'],
      claimId: 'spinel-structure',
      explanation: 'Raman vibrational modes suggest spinel structure, but XPS does not provide corroborating oxidation state evidence',
      effectOnConfidence: 'Reduces overall confidence to MEDIUM; spinel assignment remains tentative',
    });
  }
  
  // Rule 2: Strong carbonate/carboxylate surface species
  const carbonateClaim = claims.find(c => c.id === 'carbonate-surface');
  const ftirSupportsCarbonate = carbonateClaim?.supportingTechniques.find(t => t.technique === 'FTIR')?.support === 'supports';
  
  if (ftirSupportsCarbonate) {
    contradictions.push({
      id: 'surface-complexity',
      severity: 'low',
      techniques: ['FTIR'],
      claimId: 'carbonate-surface',
      explanation: 'Strong carbonate/carboxylate surface species may complicate surface interpretation',
      effectOnConfidence: 'Does not affect bulk phase identification but indicates surface complexity',
    });
  }
  
  // Rule 3: Raman D/G bands indicate carbon contribution
  const carbonClaim = claims.find(c => c.id === 'carbonaceous-residue');
  const ramanSupportsCarbon = carbonClaim?.supportingTechniques.find(t => t.technique === 'Raman')?.support === 'supports';
  
  if (ramanSupportsCarbon) {
    contradictions.push({
      id: 'carbon-contribution',
      severity: 'low',
      techniques: ['Raman'],
      claimId: 'carbonaceous-residue',
      explanation: 'Raman D and G bands indicate carbonaceous residue or support contribution',
      effectOnConfidence: 'Does not contradict ferrite phase but indicates additional carbon-based species',
    });
  }
  
  return contradictions;
}
```

### 3.5 Final Decision Logic

```typescript
function generateFinalDecision(
  claims: Claim[],
  contradictions: Contradiction[]
): { primaryConclusion: string; confidence: 'high' | 'medium' | 'low'; confidenceScore: number } {
  
  const spinelClaim = claims.find(c => c.id === 'spinel-structure');
  const surfaceClaim = claims.find(c => c.id === 'surface-species');
  const carbonClaim = claims.find(c => c.id === 'carbonaceous-residue');
  
  let conclusion = '';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let confidenceScore = 0.3;
  
  // Build conclusion from supported claims
  const conclusionParts: string[] = [];
  
  if (spinelClaim?.status === 'supported') {
    if (spinelClaim.confidence === 'high') {
      conclusionParts.push('Multi-technique evidence supports a spinel-like ferrite material');
    } else {
      conclusionParts.push('Evidence suggests a spinel-like ferrite material');
    }
  }
  
  if (surfaceClaim?.status === 'supported') {
    conclusionParts.push('with surface hydroxyl/water species');
  }
  
  if (carbonClaim?.status === 'supported') {
    conclusionParts.push('and possible carbonaceous residue');
  }
  
  conclusion = conclusionParts.join(' ');
  
  // Add XPS caveat if oxidation state evidence is weak
  const xpsSupport = spinelClaim?.supportingTechniques.find(t => t.technique === 'XPS')?.support;
  if (xpsSupport !== 'supports') {
    conclusion += '. Oxidation-state confirmation remains dependent on XPS evidence quality';
  }
  
  // Determine overall confidence
  const highConfidenceClaims = claims.filter(c => c.confidence === 'high' && c.status === 'supported').length;
  const mediumConfidenceClaims = claims.filter(c => c.confidence === 'medium' && c.status === 'supported').length;
  const majorContradictions = contradictions.filter(c => c.severity === 'high' || c.severity === 'medium').length;
  
  if (highConfidenceClaims >= 1 && majorContradictions === 0) {
    confidence = 'high';
    confidenceScore = 0.75;
  } else if (mediumConfidenceClaims >= 1 || (highConfidenceClaims >= 1 && majorContradictions > 0)) {
    confidence = 'medium';
    confidenceScore = 0.60;
  } else {
    confidence = 'low';
    confidenceScore = 0.40;
  }
  
  // Apply contradiction penalty
  if (majorContradictions > 0) {
    confidenceScore -= 0.10 * majorContradictions;
    confidenceScore = Math.max(0.3, confidenceScore);
  }
  
  return {
    primaryConclusion: conclusion,
    confidence,
    confidenceScore,
  };
}
```

---

## 4. FusionWorkspace UI Architecture

### 4.1 Component Hierarchy

```
FusionWorkspace
├── DashboardLayout
│   ├── LeftPanel
│   │   ├── ProjectInfo
│   │   ├── TechniqueList
│   │   ├── FusionRulesCard
│   │   └── RunFusionButton
│   ├── CenterPanel
│   │   ├── TabBar (5 tabs)
│   │   ├── FusionDecisionTab
│   │   ├── EvidenceMatrixTab
│   │   ├── ClaimCardsTab
│   │   ├── ContradictionsTab
│   │   └── ReportTab
│   └── RightPanel
│       ├── ScientificSummary
│       ├── ConfidenceReliability
│       ├── TopEvidence
│       └── RecommendedValidation
```

### 4.2 State Management

```typescript
// FusionWorkspace.tsx

const [activeTab, setActiveTab] = useState<'decision' | 'matrix' | 'claims' | 'contradictions' | 'report'>('decision');
const [fusionResult, setFusionResult] = useState<FusionResult | null>(null);

const handleRunFusion = () => {
  // Import processed results from demo data
  const xpsResult = runXpsProcessing(xpsDemoData);
  const ftirResult = runFtirProcessing(ftirDemoData);
  const ramanResult = runRamanProcessing(ramanDemoData);
  
  // Run fusion analysis
  const result = runFusionAnalysis(xpsResult, ftirResult, ramanResult);
  setFusionResult(result);
};
```

### 4.3 Tab Content Mapping

**Fusion Decision Tab:**
- Display `fusionResult.decision.primaryConclusion`
- Display `fusionResult.decision.confidence` badge
- List `fusionResult.supportedClaims` (map to claim titles)
- List `fusionResult.unresolvedClaims` (map to claim titles)
- List `fusionResult.caveats`

**Evidence Matrix Tab:**
- Render table with `fusionResult.evidenceMatrix`
- Rows: `fusionResult.claims` (claim titles)
- Columns: ['XPS', 'FTIR', 'Raman']
- Cells: `fusionResult.evidenceMatrix.cells[claimIndex][techniqueIndex]`
- Cell content: support status + evidenceText

**Claim Cards Tab:**
- Map over `fusionResult.claims`
- For each claim, render card with:
  - Title
  - Confidence badge
  - Supporting techniques list
  - Evidence items
  - Caveats

**Contradictions Tab:**
- Map over `fusionResult.contradictions`
- For each contradiction, render card with:
  - Severity badge
  - Techniques involved
  - Explanation
  - Effect on confidence

**Report Tab:**
- Display `fusionResult.report` (formatted markdown/text)

---

## 5. Implementation Files

### 5.1 File Structure

```
src/
├── pages/
│   └── FusionWorkspace.tsx          (Main UI component)
├── agents/
│   └── fusionAgent/
│       ├── types.ts                 (TypeScript interfaces)
│       └── runner.ts                (Fusion logic)
├── data/
│   └── fusionDemoData.ts            (Optional: demo data wrapper)
└── App.tsx                          (Add /workspace/fusion route)
```

### 5.2 Implementation Order

1. **types.ts** - Define all TypeScript interfaces
2. **runner.ts** - Implement fusion logic (evidence extraction, claim evaluators, contradiction detection, decision generation)
3. **FusionWorkspace.tsx** - Build UI with tabs and data binding
4. **App.tsx** - Add route
5. **Build validation** - Run `npm run build`

---

## 6. Deterministic Fusion Rules Summary

### 6.1 Claim Evaluation Rules

| Claim | Primary Authority | Support Criteria | Confidence |
|-------|------------------|------------------|------------|
| Spinel structure | Raman | A1g + Eg/T2g + XPS oxidation states | HIGH |
| Spinel structure | Raman | A1g + Eg/T2g, no XPS | MEDIUM |
| Spinel structure | Raman | A1g only | MEDIUM |
| Oxidation states | XPS | Cu²⁺ or Fe³⁺ detected | HIGH |
| Surface species | FTIR | OH + H-O-H bands | MEDIUM |
| Carbonaceous residue | Raman | D + G bands | MEDIUM |
| Carbonate surface | FTIR | Carbonate/carboxylate overlap | MEDIUM |

### 6.2 Contradiction Rules

| Condition | Severity | Effect |
|-----------|----------|--------|
| Raman spinel + no XPS oxidation states | MEDIUM | Reduce to MEDIUM confidence |
| Strong FTIR carbonate/carboxylate | LOW | Note surface complexity |
| Raman D/G bands present | LOW | Note carbon contribution |

### 6.3 Final Confidence Rules

- **HIGH**: ≥1 high-confidence claim + 0 major contradictions
- **MEDIUM**: ≥1 medium-confidence claim OR (high-confidence claim + major contradiction)
- **LOW**: No supported claims OR severe contradictions

---

## 7. Expected Demo Output

**Primary Conclusion:**
"Multi-technique evidence supports a spinel-like ferrite material with surface hydroxyl/water species and possible carbonaceous residue. Oxidation-state confirmation remains dependent on XPS evidence quality."

**Confidence:** MEDIUM (60%)

**Supported Claims:**
- Spinel-like ferrite structure (MEDIUM)
- Surface hydroxyl/adsorbed water (MEDIUM)
- Carbonaceous residue/disorder (MEDIUM)

**Unresolved Claims:**
- Cu/Fe oxidation state consistency (depends on XPS quality)

**Contradictions:**
- MEDIUM: Raman suggests spinel but XPS lacks corroborating oxidation state evidence
- LOW: Raman D/G bands indicate carbon contribution

**Caveats:**
- A1g mode observed without full corroborating Eg or T2g modes
- XPS oxidation state evidence not available for corroboration
- D and G bands indicate carbonaceous species; these do not confirm ferrite phase
- Carbonate/carboxylate surface species may complicate surface interpretation

**Recommended Validation:**
- XPS depth profiling to confirm bulk oxidation states
- TEM for structural confirmation
- Complementary XRD for crystallographic phase identification


---

## 8. Evidence Weighting System

### 8.1 Technique-Specific Weights

Evidence weight depends on technique authority for the claim type:

| Claim Type | XPS Weight | FTIR Weight | Raman Weight |
|------------|------------|-------------|--------------|
| Spinel structure | 0.6 (corroboration) | 0.2 (context) | **1.0 (authority)** |
| Oxidation states | **1.0 (authority)** | 0.1 (irrelevant) | 0.3 (context) |
| Surface species | 0.5 (corroboration) | **1.0 (authority)** | 0.2 (context) |
| Carbonaceous residue | 0.3 (context) | 0.5 (corroboration) | **1.0 (authority)** |
| Carbonate surface | 0.2 (context) | **1.0 (authority)** | 0.1 (irrelevant) |

**Weight Assignment Rules:**
- **Authority (1.0)**: Technique has primary decision power for this claim type
- **Corroboration (0.5-0.7)**: Technique provides supporting evidence
- **Context (0.2-0.3)**: Technique provides tangential information
- **Irrelevant (0.1)**: Technique does not inform this claim

### 8.2 Evidence Item Weights

Individual evidence items have intrinsic weights based on diagnostic value:

**XPS Evidence Weights:**
- Primary oxidation state peak: 1.0
- Satellite peak: 0.8
- Binding energy shift: 0.6
- Surface composition: 0.5

**FTIR Evidence Weights:**
- Diagnostic functional group (M-O, OH): 1.0
- Ambiguous overlap region (carbonate/carboxylate): 0.6
- Broad band (disorder): 0.5
- Weak/shoulder band: 0.3

**Raman Evidence Weights:**
- A1g primary mode: 1.0
- Eg/T2g supporting modes: 0.8
- Lower-frequency ferrite modes: 0.6
- D/G carbon bands: 0.5 (for carbon claims only)

### 8.3 Weighted Evidence Aggregation

When multiple evidence items support a claim from one technique:

```
techniqueScore = Σ(evidenceConfidence × evidenceWeight) / Σ(evidenceWeight)

Where:
- evidenceConfidence = original technique confidence (0-1)
- evidenceWeight = evidence item weight (0-1)
```

**Example (Raman for Spinel Structure):**
```
Evidence items:
- A1g mode: confidence=0.85, weight=1.0
- Eg mode: confidence=0.75, weight=0.8
- Lower ferrite: confidence=0.75, weight=0.6

techniqueScore = (0.85×1.0 + 0.75×0.8 + 0.75×0.6) / (1.0 + 0.8 + 0.6)
               = (0.85 + 0.60 + 0.45) / 2.4
               = 1.90 / 2.4
               = 0.79
```

---

## 9. Claim-Level Confidence Calculation

### 9.1 Confidence Formula

Claim confidence is calculated using weighted technique scores and contradiction penalties:

```
claimConfidence = (Σ(techniqueScore × techniqueWeight) / Σ(techniqueWeight)) 
                  × (1 - contradictionPenalty)
                  × hierarchyMultiplier

Where:
- techniqueScore = weighted evidence aggregation from technique (0-1)
- techniqueWeight = technique authority weight for this claim (0-1)
- contradictionPenalty = sum of contradiction impacts (0-0.3)
- hierarchyMultiplier = 1.0 (primary), 0.9 (supporting), 0.8 (context)
```

### 9.2 Confidence Classification

After calculating `claimConfidence` (0-1), classify as:

| Confidence Score | Classification | Conditions |
|------------------|----------------|------------|
| **0.70 - 1.00** | HIGH | Authority technique supports + corroboration + no major contradictions |
| **0.50 - 0.69** | MEDIUM | Authority technique supports OR partial corroboration OR minor contradictions |
| **0.00 - 0.49** | LOW | No authority support OR major contradictions OR single weak evidence |

### 9.3 Worked Example: Spinel Structure Claim

**Scenario:**
- Raman: A1g (0.85), Eg (0.75), Lower (0.75)
- XPS: Cu²⁺ (0.70)
- FTIR: M-O (0.65)
- Contradiction: MEDIUM (Raman spinel without full XPS corroboration)

**Step 1: Calculate technique scores**
```
ramanScore = (0.85×1.0 + 0.75×0.8 + 0.75×0.6) / (1.0 + 0.8 + 0.6) = 0.79
xpsScore = 0.70 (single evidence item)
ftirScore = 0.65 (single evidence item)
```

**Step 2: Apply technique weights**
```
Technique weights for spinel structure:
- Raman: 1.0 (authority)
- XPS: 0.6 (corroboration)
- FTIR: 0.2 (context)

weightedSum = (0.79×1.0 + 0.70×0.6 + 0.65×0.2) / (1.0 + 0.6 + 0.2)
            = (0.79 + 0.42 + 0.13) / 1.8
            = 1.34 / 1.8
            = 0.74
```

**Step 3: Apply contradiction penalty**
```
Contradiction: MEDIUM severity
contradictionScore = 0.5 (partial disagreement)
confidenceImpact = 0.5 × 0.15 = 0.075

claimConfidence = 0.74 × (1 - 0.075) × 1.0 (primary claim)
                = 0.74 × 0.925
                = 0.68
```

**Step 4: Classify**
```
0.68 falls in 0.50-0.69 range → MEDIUM confidence
```

### 9.4 Final Decision Confidence

Overall fusion confidence is determined by primary claims only:

```
finalConfidence = min(primaryClaimConfidences)

Classification:
- HIGH: All primary claims ≥ 0.70
- MEDIUM: At least one primary claim in 0.50-0.69
- LOW: Any primary claim < 0.50
```

**Rationale:** The weakest primary claim determines overall confidence, as all primary claims must be well-supported for a HIGH confidence conclusion.

---

## 10. Implementation Formulas Summary

### 10.1 Evidence Aggregation
```typescript
function aggregateEvidenceScore(evidenceItems: EvidenceItem[]): number {
  const weightedSum = evidenceItems.reduce((sum, item) => 
    sum + (item.confidence * item.weight), 0);
  const totalWeight = evidenceItems.reduce((sum, item) => 
    sum + item.weight, 0);
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
```

### 10.2 Contradiction Scoring
```typescript
function calculateContradictionScore(
  evidenceStrength: number,
  disagreementMagnitude: number,
  claimImportance: number
): number {
  return evidenceStrength * disagreementMagnitude * claimImportance;
}

function calculateConfidenceImpact(
  contradictionScore: number,
  severity: 'high' | 'medium' | 'low'
): number {
  const multipliers = { high: 0.30, medium: 0.15, low: 0.05 };
  return contradictionScore * multipliers[severity];
}
```

### 10.3 Claim Confidence
```typescript
function calculateClaimConfidence(
  techniqueScores: Map<string, number>,
  techniqueWeights: Map<string, number>,
  contradictionPenalty: number,
  hierarchyMultiplier: number
): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const [technique, score] of techniqueScores) {
    const weight = techniqueWeights.get(technique) || 0;
    weightedSum += score * weight;
    totalWeight += weight;
  }
  
  const baseConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return baseConfidence * (1 - contradictionPenalty) * hierarchyMultiplier;
}
```

### 10.4 Final Decision Confidence
```typescript
function calculateFinalConfidence(claims: Claim[]): {
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
} {
  const primaryClaims = claims.filter(c => c.hierarchy === 'primary');
  const minConfidence = Math.min(...primaryClaims.map(c => c.confidenceScore));
  
  let confidence: 'high' | 'medium' | 'low';
  if (minConfidence >= 0.70) {
    confidence = 'high';
  } else if (minConfidence >= 0.50) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  return { confidence, confidenceScore: minConfidence };
}
```
