# P0-02: Lock Canonical Demo Scenario - Design

## Architecture Overview

The canonical demo scenario will be implemented as a centralized data model that serves as the single source of truth for all DIFARYX demo components. This design ensures consistency, maintainability, and extensibility.

```
┌─────────────────────────────────────────────────────────────┐
│                  Canonical Scenario Model                    │
│                 (canonicalScenario.ts)                       │
│                                                              │
│  - Project Metadata                                          │
│  - Material Properties                                       │
│  - Characterization Objectives                               │
│  - Technique Coverage                                        │
│  - Dataset Definitions                                       │
│  - Output Section Templates                                  │
│  - Reference Data                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ imports
                            ▼
    ┌───────────────────────────────────────────────────────┐
    │                                                       │
    ▼                   ▼                   ▼               ▼
┌─────────┐      ┌──────────┐      ┌──────────┐    ┌──────────┐
│Dashboard│      │Workspaces│      │Agent Demo│    │ Notebook │
└─────────┘      └──────────┘      └──────────┘    └──────────┘
                                                           │
                                                           ▼
                                                    ┌──────────┐
                                                    │ History  │
                                                    └──────────┘
```

## Data Model Design

### Core Types

```typescript
// Canonical scenario type definitions
export interface CanonicalScenario {
  project: ProjectMetadata;
  material: MaterialProperties;
  objective: CharacterizationObjective;
  techniques: TechniqueCoverage;
  datasets: DatasetDefinitions;
  outputSections: OutputSectionTemplates;
  reference: ReferenceData;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  displayName: string; // For formatChemicalFormula
  sampleId: string;
  createdDate: string;
  lastUpdated: string;
  status: 'complete' | 'ready' | 'in-progress' | 'pending' | 'review';
}

export interface MaterialProperties {
  formula: string; // CuFe₂O₄
  system: string; // CuFe₂O₄-based spinel ferrite catalyst candidate
  class: string; // Spinel ferrite catalyst candidate
  crystalStructure: {
    type: string; // Cubic spinel
    spaceGroup: string; // Fd-3m
    latticeParameter: number; // 8.38 Å
  };
  synthesis: {
    method: string;
    temperature: string;
    support?: string;
  };
}

export interface CharacterizationObjective {
  main: string;
  questions: string[];
  context: string;
  useCase: string;
  stakeholders: string[];
}

export interface TechniqueCoverage {
  primary: TechniqueInfo;
  supporting: TechniqueInfo[];
}

export interface TechniqueInfo {
  name: 'XRD' | 'Raman' | 'XPS' | 'FTIR';
  purpose: string;
  dataset: string;
  keyFeatures: string;
  status: 'complete' | 'ready' | 'in-progress' | 'pending';
  dataQuality?: 'excellent' | 'good' | 'acceptable' | 'limited';
}

export interface DatasetDefinitions {
  xrd: XRDDataset;
  raman: RamanDataset;
  xps: XPSDataset;
  ftir: FTIRDataset;
}

export interface XRDDataset {
  id: string;
  sampleName: string;
  fileName: string;
  technique: 'XRD';
  range: string;
  radiation: string;
  detectedPeaks: number;
  majorReflections: Array<{
    twoTheta: number;
    hkl: string;
    intensity: number;
  }>;
}

export interface RamanDataset {
  id: string;
  sampleName: string;
  fileName: string;
  technique: 'Raman';
  range: string;
  laser: string;
  detectedModes: number;
  activeModes: Array<{
    position: number;
    symmetry: string;
    intensity: number;
  }>;
}

export interface XPSDataset {
  id: string;
  sampleName: string;
  fileName: string;
  technique: 'XPS';
  regions: string[];
  xraySource: string;
  detectedComponents: number;
  coreLevel: Array<{
    element: string;
    bindingEnergy: number;
    oxidationState: string;
  }>;
}

export interface FTIRDataset {
  id: string;
  sampleName: string;
  fileName: string;
  technique: 'FTIR';
  range: string;
  mode: string;
  detectedBands: number;
  vibrationalBands: Array<{
    wavenumber: number;
    assignment: string;
    intensity: string;
  }>;
}

export interface OutputSectionTemplates {
  sections: Array<{
    id: string;
    title: string;
    order: number;
    required: boolean;
    description: string;
  }>;
}

export interface ReferenceData {
  latticeParameters: {
    cufe2o4: number;
    fe3o4: number;
    cuo: number;
  };
  ramanModes: {
    a1g: number;
    eg: number;
    t2g: number[];
  };
  xpsBindingEnergies: {
    cu2p3_2: number;
    fe2p3_2: number;
  };
  ftirBands: {
    metalOxygen: number;
    hydroxyl: number;
  };
}
```

### File Structure

```
src/
├── data/
│   ├── canonicalScenario.ts          # Main canonical scenario definition
│   ├── canonicalScenarioTypes.ts     # Type definitions
│   ├── canonicalScenarioAdapters.ts  # Adapters for backward compatibility
│   └── demoProjects.ts                # Existing file (updated to use canonical)
```

## Component Integration Design

### Dashboard Integration

**Current State**: Dashboard reads from `demoProjects` array
**New State**: Dashboard reads from `canonicalScenario` via adapter

```typescript
// Dashboard.tsx
import { canonicalScenario, getCanonicalProject } from '../data/canonicalScenario';

// Use canonical project
const project = getCanonicalProject();
const displayName = formatChemicalFormula(project.displayName);
const status = project.status; // 'complete' | 'ready' | 'in-progress'
```

**Changes**:
- Replace hardcoded project data with canonical scenario
- Use canonical status labels
- Display canonical technique badges
- Show canonical last updated date

### Workspace Integration

**Current State**: Workspaces read from `getProjectDatasets()`
**New State**: Workspaces read from `canonicalScenario.datasets`

```typescript
// XRDWorkspace.tsx
import { canonicalScenario } from '../data/canonicalScenario';

const xrdDataset = canonicalScenario.datasets.xrd;
const objective = canonicalScenario.objective.main;
```

**Changes**:
- Use canonical dataset definitions
- Display canonical objective
- Use canonical output sections
- Apply canonical terminology

### Agent Demo Integration

**Current State**: Agent Demo uses default mission text
**New State**: Agent Demo uses canonical objective

```typescript
// AgentDemo.tsx
import { canonicalScenario } from '../data/canonicalScenario';

const DEFAULT_MISSION = canonicalScenario.objective.main;
const selectedDataset = canonicalScenario.datasets.xrd;
```

**Changes**:
- Default mission from canonical objective
- Dataset selection from canonical coverage
- Output sections from canonical templates
- Terminology from canonical definitions

### Notebook Integration

**Current State**: Notebook generates report from agent run
**New State**: Notebook uses canonical output sections

```typescript
// NotebookLab.tsx
import { canonicalScenario, getCanonicalOutputSections } from '../data/canonicalScenario';

const sections = getCanonicalOutputSections();
const projectName = canonicalScenario.project.displayName;
```

**Changes**:
- Report structure from canonical sections
- Project metadata from canonical scenario
- Terminology from canonical definitions
- Export includes canonical metadata

### History Integration

**Current State**: History shows hardcoded runs
**New State**: History references canonical scenario

```typescript
// History.tsx
import { canonicalScenario } from '../data/canonicalScenario';

const projectName = canonicalScenario.project.displayName;
const sampleId = canonicalScenario.project.sampleId;
```

**Changes**:
- Run entries reference canonical project
- Metadata includes canonical sample ID
- Technique coverage from canonical definition
- Status labels from canonical terminology

## Backward Compatibility Strategy

### Adapter Pattern

Create adapters to maintain compatibility with existing code:

```typescript
// canonicalScenarioAdapters.ts

/**
 * Adapter: Convert canonical scenario to DemoProject format
 */
export function canonicalToDemoProject(): DemoProject {
  return {
    id: canonicalScenario.project.id,
    name: canonicalScenario.project.displayName,
    material: canonicalScenario.material.formula,
    techniques: [
      canonicalScenario.techniques.primary.name,
      ...canonicalScenario.techniques.supporting.map(t => t.name)
    ],
    claimStatus: canonicalScenario.project.status,
    summary: canonicalScenario.objective.main,
    lastUpdated: canonicalScenario.project.lastUpdated,
    createdDate: canonicalScenario.project.createdDate,
    status: canonicalScenario.project.status === 'complete' ? 'Complete' : 'In Progress',
  };
}

/**
 * Adapter: Convert canonical dataset to DemoDataset format
 */
export function canonicalToDataset(technique: 'XRD' | 'Raman' | 'XPS' | 'FTIR'): DemoDataset {
  const dataset = canonicalScenario.datasets[technique.toLowerCase()];
  return {
    id: dataset.id,
    sampleName: dataset.sampleName,
    fileName: dataset.fileName,
    technique: dataset.technique,
    // ... map other fields
  };
}
```

### Migration Strategy

1. **Phase 1**: Create canonical scenario file
2. **Phase 2**: Add adapters for backward compatibility
3. **Phase 3**: Update components one by one
4. **Phase 4**: Remove old hardcoded data
5. **Phase 5**: Clean up adapters if no longer needed

## Output Section Templates

### Canonical Section Order

```typescript
export const CANONICAL_OUTPUT_SECTIONS = [
  {
    id: 'characterization-overview',
    title: 'Characterization Overview',
    order: 1,
    required: true,
    description: 'High-level summary of findings and technique coverage',
  },
  {
    id: 'supporting-data',
    title: 'Supporting Data',
    order: 2,
    required: true,
    description: 'Technique-specific observations and measurements',
  },
  {
    id: 'cross-technique-insights',
    title: 'Cross-Technique Insights',
    order: 3,
    required: true,
    description: 'Multi-technique correlations and convergent evidence',
  },
  {
    id: 'agent-interpretation',
    title: 'Agent Interpretation',
    order: 4,
    required: true,
    description: 'Synthesis of evidence and structural reasoning',
  },
  {
    id: 'conclusion',
    title: 'Conclusion',
    order: 5,
    required: true,
    description: 'Final structural assignment and finding status',
  },
  {
    id: 'limitations-validation',
    title: 'Limitations and Follow-up Validation',
    order: 6,
    required: true,
    description: 'Known gaps and recommended validation experiments',
  },
];
```

### Section Content Templates

```typescript
export const SECTION_TEMPLATES = {
  characterizationOverview: {
    template: `
Multi-technique characterization of {material} provides convergent evidence for {structure}. 
{techniques} techniques yield complementary structural, chemical, and vibrational information.
    `,
    variables: ['material', 'structure', 'techniques'],
  },
  supportingData: {
    template: `
### {technique}
{observations}
    `,
    variables: ['technique', 'observations'],
  },
  // ... other templates
};
```

## Terminology Mapping

### Status Labels

```typescript
export const STATUS_LABELS = {
  complete: 'Complete',
  ready: 'Ready',
  'in-progress': 'In Progress',
  pending: 'Pending',
  review: 'Review',
} as const;

// FORBIDDEN (must not use):
// - 'Strongly Supported'
// - 'Supported' (as status label)
// - 'Partial'
// - 'Inconclusive'
// - 'Contradicted'
```

### Section Headers

```typescript
export const SECTION_HEADERS = {
  overview: 'Characterization Overview',
  data: 'Supporting Data',
  insights: 'Cross-Technique Insights',
  interpretation: 'Agent Interpretation',
  conclusion: 'Conclusion',
  limitations: 'Limitations and Follow-up Validation',
} as const;

// FORBIDDEN (must not use):
// - 'Scientific Reasoning Summary'
// - 'Agent Evidence Summary'
// - 'Evidence Matrix'
// - 'Evidence Basis'
// - 'Scientific Interpretation'
// - 'Decision Statement'
// - 'Caveats and Next Steps'
```

## Future P0 Card Design

### P0-03: Characterization Objective Card

```typescript
export function CharacterizationObjectiveCard() {
  const objective = canonicalScenario.objective;
  
  return (
    <Card>
      <h3>Characterization Objective</h3>
      <p>{objective.main}</p>
      <ul>
        {objective.questions.map(q => <li key={q}>{q}</li>)}
      </ul>
    </Card>
  );
}
```

### P0-04: Sample Context Card

```typescript
export function SampleContextCard() {
  const material = canonicalScenario.material;
  
  return (
    <Card>
      <h3>Sample Context</h3>
      <div>Material: {formatChemicalFormula(material.formula)}</div>
      <div>System: {material.system}</div>
      <div>Class: {material.class}</div>
      <div>Synthesis: {material.synthesis.method}</div>
    </Card>
  );
}
```

### P0-05: Data Availability Status

```typescript
export function DataAvailabilityStatus() {
  const techniques = canonicalScenario.techniques;
  
  return (
    <Card>
      <h3>Data Availability</h3>
      <TechniqueList>
        <TechniqueItem 
          name={techniques.primary.name}
          status={techniques.primary.status}
          isPrimary={true}
        />
        {techniques.supporting.map(t => (
          <TechniqueItem 
            key={t.name}
            name={t.name}
            status={t.status}
            isPrimary={false}
          />
        ))}
      </TechniqueList>
    </Card>
  );
}
```

### P0-06: Technique Coverage Panel

```typescript
export function TechniqueCoveragePanel() {
  const techniques = canonicalScenario.techniques;
  
  return (
    <Card>
      <h3>Technique Coverage</h3>
      <TechniqueMatrix>
        {/* Visual matrix showing technique relationships */}
      </TechniqueMatrix>
    </Card>
  );
}
```

### P0-07: Evidence Requirements Table

```typescript
export function EvidenceRequirementsTable() {
  const requirements = canonicalScenario.evidenceRequirements;
  
  return (
    <Card>
      <h3>Evidence Requirements</h3>
      <Table>
        {requirements.map(req => (
          <Row key={req.id}>
            <Cell>{req.type}</Cell>
            <Cell>{req.status}</Cell>
            <Cell>{req.priority}</Cell>
          </Row>
        ))}
      </Table>
    </Card>
  );
}
```

## Implementation Phases

### Phase 1: Core Data Model (Priority: P0)
- Create canonicalScenario.ts
- Define all TypeScript types
- Implement canonical scenario data
- Add basic helper functions

### Phase 2: Adapters (Priority: P0)
- Create backward compatibility adapters
- Test adapter conversions
- Ensure no breaking changes

### Phase 3: Component Updates (Priority: P0)
- Update Dashboard
- Update Workspaces (XRD, Raman, XPS, FTIR, Multi)
- Update Agent Demo
- Update Notebook
- Update History

### Phase 4: Validation (Priority: P0)
- Run full terminology audit
- Test all routes
- Verify consistency
- Check build

### Phase 5: Future Cards (Priority: P1)
- Implement P0-03 through P0-07
- Add to relevant routes
- Test integration

## Testing Strategy

### Unit Tests
- Test canonical scenario data structure
- Test adapter conversions
- Test helper functions
- Test type safety

### Integration Tests
- Test Dashboard with canonical scenario
- Test each Workspace with canonical datasets
- Test Agent Demo with canonical objective
- Test Notebook with canonical sections
- Test History with canonical metadata

### Visual Regression Tests
- Screenshot each route before/after
- Verify no visual changes
- Verify terminology consistency
- Verify layout preservation

## Performance Considerations

### Bundle Size
- Canonical scenario: ~3KB
- Type definitions: ~2KB
- Adapters: ~1KB
- Total impact: ~6KB (acceptable)

### Load Time
- Canonical scenario loads synchronously
- No async operations needed
- Instant access to all data
- No performance impact

### Memory Usage
- Single scenario instance
- Shared across all components
- Minimal memory footprint
- No memory leaks

## Security Considerations

- No user input in canonical scenario
- All data is hardcoded and deterministic
- No XSS vulnerabilities
- No injection risks
- Safe for demo environment

## Accessibility Considerations

- All labels use semantic HTML
- ARIA labels where appropriate
- Keyboard navigation preserved
- Screen reader friendly
- Color contrast maintained

## Documentation Requirements

### Code Documentation
- JSDoc comments for all exports
- Type documentation
- Usage examples
- Migration guide

### User Documentation
- Update AGENTS.md with canonical scenario reference
- Document output section structure
- Explain terminology choices
- Provide extension guide

## Success Metrics

1. ✅ Single source of truth established
2. ✅ All routes use canonical scenario
3. ✅ Zero terminology violations
4. ✅ Build passes without errors
5. ✅ No performance regression
6. ✅ Easy to extend for P0 cards
7. ✅ Backward compatible
8. ✅ Well documented
