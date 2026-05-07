# Design Document: Locked Scientific Context

## Overview

This design implements Locked Scientific Context as a minimal additive frontend feature for DIFARYX. The feature displays user-confirmed scientific context (sample identity, source dataset, processing path, reference scope, and claim boundary) as a locked constraint that cannot be modified by the agent without explicit user action. This is a frontend-only implementation with no backend changes, no new dependencies, and preservation of all existing routes and deterministic demo behavior.

The implementation follows the principle of "show, don't modify" - the locked context is displayed prominently but remains immutable during agent execution. This reinforces the public-beta guardrail that DIFARYX can test analytical pathways and refine interpretations, but cannot modify user-confirmed scientific context.

## Architecture

### Component Structure

```
src/
├── components/
│   └── locked-context/
│       └── LockedScientificContext.tsx    # Reusable locked context display component
├── data/
│   └── lockedContext.ts                    # Locked context data and lookup functions
├── pages/
│   ├── NotebookLab.tsx                     # Add locked context preservation notice
│   └── XrdWorkspace.tsx                    # Add compact locked context card
└── components/
    └── agent-demo/
        └── RightPanel/
            └── RightPanel.tsx              # Add locked context section
```

### Data Flow

1. **Data Storage**: Locked context data lives in `src/data/lockedContext.ts` as a static lookup map keyed by project ID
2. **Data Retrieval**: Components call `getLockedContext(projectId)` to retrieve locked context for a project
3. **Fallback Handling**: Unsupported projects return `null`, triggering fallback UI
4. **Component Rendering**: `LockedScientificContext` component renders the locked context data with consistent styling

### Key Design Decisions

1. **No Backend**: All data is frontend-only, stored in TypeScript constants
2. **Project-Based Lookup**: Locked context is keyed by project ID, not processing run ID
3. **Immutable Display**: Locked context is read-only; no edit functionality
4. **Additive Only**: No refactoring of existing components; only additions
5. **Deterministic Demo**: Locked context data is hardcoded for cu-fe2o4-spinel and cufe2o4-sba15 only

## Components and Interfaces

### LockedScientificContext Component

**Location**: `src/components/locked-context/LockedScientificContext.tsx`

**Purpose**: Reusable component that displays locked scientific context information

**Props Interface**:
```typescript
interface LockedScientificContextProps {
  sampleIdentity: string;
  technique: string;
  sourceDataset: string;
  sourceProcessingPath: string;
  referenceScope: string;
  claimBoundary: string;
  variant?: 'full' | 'compact';  // 'full' for Agent Mode, 'compact' for XRD Workspace
}
```

**Rendering Behavior**:
- **Full variant**: Displays all six fields with labels, includes guardrail wording
- **Compact variant**: Displays condensed version suitable for workspace sidebar
- Uses existing DIFARYX component styling (Card, borders, text colors)
- Includes "Locked by user" badge
- Includes "Source context preserved" subtitle

**Styling**:
- Border: `border-amber-500/30`
- Background: `bg-amber-500/5`
- Text: `text-text-main` for labels, `text-text-muted` for values
- Badge: `bg-amber-500/10 text-amber-700`

### Locked Context Data Structure

**Location**: `src/data/lockedContext.ts`

**Interface**:
```typescript
export interface LockedScientificContext {
  sampleIdentity: string;
  technique: string;
  sourceDataset: string;
  sourceProcessingPath: string;
  referenceScope: string;
  claimBoundary: string;
}

export type LockedContextMap = Record<string, LockedScientificContext | undefined>;
```

**Data Storage**:
```typescript
const LOCKED_CONTEXT_DATA: LockedContextMap = {
  'cu-fe2o4-spinel': {
    sampleIdentity: 'CuFe₂O₄ spinel ferrite',
    technique: 'XRD',
    sourceDataset: 'xrd-cufe2o4-clean',
    sourceProcessingPath: 'XRD Workspace / processing-cu-fe2o4-spinel-xrd-demo',
    referenceScope: 'spinel ferrite screening',
    claimBoundary: 'XRD supports phase assignment; phase purity remains validation-limited.',
  },
  'cufe2o4-sba15': {
    sampleIdentity: 'CuFe₂O₄/SBA-15 supported sample',
    technique: 'XRD with contextual Raman/FTIR evidence',
    sourceDataset: 'xrd-cufe2o4-sba15-demo',
    sourceProcessingPath: 'Multi-technique evidence context',
    referenceScope: 'supported copper ferrite on mesoporous silica context',
    claimBoundary: 'Do not describe as pure bulk CuFe₂O₄; phase purity remains validation-limited.',
  },
};

export function getLockedContext(projectId: string): LockedScientificContext | null {
  return LOCKED_CONTEXT_DATA[projectId] ?? null;
}
```

**Fallback Behavior**:
- Unsupported projects (fe3o4-nanoparticles, nife2o4, cofe2o4) return `null`
- Components render fallback message: "No locked scientific context available for this project."

## Data Models

### Locked Context Record

```typescript
interface LockedScientificContext {
  sampleIdentity: string;        // e.g., "CuFe₂O₄ spinel ferrite"
  technique: string;              // e.g., "XRD"
  sourceDataset: string;          // e.g., "xrd-cufe2o4-clean"
  sourceProcessingPath: string;   // e.g., "XRD Workspace / processing-cu-fe2o4-spinel-xrd-demo"
  referenceScope: string;         // e.g., "spinel ferrite screening"
  claimBoundary: string;          // e.g., "XRD supports phase assignment; phase purity remains validation-limited."
}
```

### Project-to-Context Mapping

```typescript
type LockedContextMap = Record<string, LockedScientificContext | undefined>;
```

**Supported Projects**:
- `cu-fe2o4-spinel`: Full locked context data
- `cufe2o4-sba15`: Full locked context data

**Unsupported Projects**:
- `fe3o4-nanoparticles`: Returns `null`
- `nife2o4`: Returns `null`
- `cofe2o4`: Returns `null`

## Integration Points

### 1. Agent Mode RightPanel

**File**: `src/components/agent-demo/RightPanel/RightPanel.tsx`

**Placement**: Add new section in the RightPanel after "Source Processing Parameters" section

**Implementation**:
```typescript
// Add to RightPanel component
import { LockedScientificContext } from '../../locked-context/LockedScientificContext';
import { getLockedContext } from '../../../data/lockedContext';

// Inside RightPanel component
const lockedContext = getLockedContext(projectId);

// In render, add after Source Processing Parameters section:
{lockedContext && (
  <div className="border-b border-border px-3 py-3">
    <LockedScientificContext
      sampleIdentity={lockedContext.sampleIdentity}
      technique={lockedContext.technique}
      sourceDataset={lockedContext.sourceDataset}
      sourceProcessingPath={lockedContext.sourceProcessingPath}
      referenceScope={lockedContext.referenceScope}
      claimBoundary={lockedContext.claimBoundary}
      variant="full"
    />
  </div>
)}
```

**Layout Considerations**:
- Place after "Source Processing Parameters" section
- Use same border/padding as other RightPanel sections
- Ensure no overflow by using `overflow-y-auto` on parent container

### 2. XRD Workspace

**File**: `src/pages/XrdWorkspace.tsx`

**Placement**: Add compact card in the left sidebar after "Evidence" section

**Implementation**:
```typescript
// Add to XrdWorkspace component
import { LockedScientificContext } from '../components/locked-context/LockedScientificContext';
import { getLockedContext } from '../data/lockedContext';

// Inside XrdWorkspace component
const lockedContext = getLockedContext(project.id);

// In left sidebar, add after Evidence section:
{lockedContext && (
  <div className="border-b border-border px-3 py-1.5">
    <LockedScientificContext
      sampleIdentity={lockedContext.sampleIdentity}
      technique={lockedContext.technique}
      sourceDataset={lockedContext.sourceDataset}
      sourceProcessingPath={lockedContext.sourceProcessingPath}
      referenceScope={lockedContext.referenceScope}
      claimBoundary={lockedContext.claimBoundary}
      variant="compact"
    />
  </div>
)}
```

**Layout Considerations**:
- Use compact variant to fit in narrow sidebar
- Place after Evidence section, before Actions section
- Ensure no layout overflow by using condensed text sizes

### 3. Notebook Locked Context Preservation Notice

**File**: `src/pages/NotebookLab.tsx`

**Placement**: Add notice line after experiment title, before summary

**Implementation**:
```typescript
// Add to NotebookLab component
import { getLockedContext } from '../data/lockedContext';

// Inside NotebookLab component
const lockedContext = getLockedContext(project.id);

// In render, add after experiment title:
{lockedContext && (
  <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2">
    <p className="text-[10px] font-semibold text-amber-700">
      Locked context preserved: sample identity, source dataset, processing path, and claim boundary were not modified.
    </p>
  </div>
)}
```

**Layout Considerations**:
- Use subtle amber styling to match locked context theme
- Keep text concise (single line)
- Place prominently near top of notebook

### 4. Report Export Locked Context Inclusion

**File**: `src/pages/NotebookLab.tsx` (in `exportMarkdown` function)

**Placement**: Add locked context section in markdown export under "Provenance" section

**Implementation**:
```typescript
// Modify exportMarkdown function
const exportMarkdown = () => {
  const lockedContext = getLockedContext(project.id);
  
  // ... existing code ...
  
  const lockedContextMarkdown = lockedContext
    ? `## Locked Scientific Context

Sample Identity: ${lockedContext.sampleIdentity}
Technique: ${lockedContext.technique}
Source Dataset: ${lockedContext.sourceDataset}
Source Processing Path: ${lockedContext.sourceProcessingPath}
Reference Scope: ${lockedContext.referenceScope}
Claim Boundary: ${lockedContext.claimBoundary}

`
    : '';
  
  const markdown = `# DIFARYX Notebook Report

## Experiment
${projectNotebookContent.experimentTitle}

${lockedContextMarkdown}

## Source Workflow
XRD processing + interpretation refinement

// ... rest of markdown ...
`;
  
  // ... rest of function ...
};
```

**Layout Considerations**:
- Place locked context section early in export (after Experiment, before Source Workflow)
- Use clear section heading: "Locked Scientific Context"
- Include all six fields with labels

## Error Handling

### Unsupported Project Handling

**Scenario**: User views a project without locked context data (fe3o4-nanoparticles, nife2o4, cofe2o4)

**Behavior**:
1. `getLockedContext(projectId)` returns `null`
2. Components check for `null` and render fallback UI
3. Fallback message: "No locked scientific context available for this project."

**Implementation**:
```typescript
// In components
const lockedContext = getLockedContext(projectId);

if (!lockedContext) {
  return (
    <div className="rounded border border-border bg-surface px-3 py-2">
      <p className="text-[10px] text-text-muted">
        No locked scientific context available for this project.
      </p>
    </div>
  );
}

// Render locked context...
```

### Missing Data Field Handling

**Scenario**: Locked context data is incomplete (missing field)

**Behavior**:
1. Display empty string or "Not specified" for missing fields
2. Do not crash or hide entire component

**Implementation**:
```typescript
// In LockedScientificContext component
<div className="text-[10px]">
  <span className="font-semibold text-text-main">Sample Identity:</span>{' '}
  <span className="text-text-muted">{sampleIdentity || 'Not specified'}</span>
</div>
```

## Testing Strategy

### Unit Tests

**Test File**: `src/components/locked-context/LockedScientificContext.test.tsx`

**Test Cases**:
1. Renders all six fields correctly
2. Renders "Locked by user" badge
3. Renders "Source context preserved" subtitle
4. Renders full variant with all guardrail wording
5. Renders compact variant with condensed layout
6. Handles missing props gracefully

**Test File**: `src/data/lockedContext.test.ts`

**Test Cases**:
1. Returns correct locked context for cu-fe2o4-spinel
2. Returns correct locked context for cufe2o4-sba15
3. Returns null for fe3o4-nanoparticles
4. Returns null for nife2o4
5. Returns null for cofe2o4
6. Returns null for unknown project ID

### Integration Tests

**Test Scenarios**:
1. Agent Mode RightPanel displays locked context for cu-fe2o4-spinel
2. Agent Mode RightPanel displays locked context for cufe2o4-sba15
3. Agent Mode RightPanel does not display locked context for fe3o4-nanoparticles
4. XRD Workspace displays compact locked context card for cu-fe2o4-spinel
5. XRD Workspace does not display locked context card for nife2o4
6. Notebook displays preservation notice for cu-fe2o4-spinel
7. Notebook does not display preservation notice for cofe2o4
8. Report export includes locked context section for cu-fe2o4-spinel
9. Report export does not include locked context section for fe3o4-nanoparticles

### Smoke Tests

**Test Routes**:
1. `/workspace/xrd?project=cu-fe2o4-spinel` - Locked context card visible
2. `/workspace/xrd?project=cufe2o4-sba15` - Locked context card visible
3. `/workspace/xrd?project=fe3o4-nanoparticles` - No locked context card
4. `/demo/agent?project=cu-fe2o4-spinel&processing=processing-cu-fe2o4-spinel-xrd-demo&template=research` - Locked context in RightPanel
5. `/demo/agent?project=cufe2o4-sba15` - Locked context in RightPanel
6. `/notebook?project=cu-fe2o4-spinel` - Preservation notice visible
7. `/notebook?project=fe3o4-nanoparticles` - No preservation notice
8. `/history` - No locked context display (not required)

**Validation Checks**:
- No console errors
- No layout overflow
- Correct styling (amber theme)
- Correct wording (matches requirements)
- Build passes: `npm.cmd run build`
- Git check passes: `git diff --check`

## Guardrail Enforcement

### Terminology Consistency

**Required Phrases** (from Requirements 9):
1. "Locked by user" - Used in badge
2. "Source context preserved" - Used in subtitle
3. "User-confirmed context is treated as a locked scientific constraint." - Used in full variant
4. "DIFARYX may test analytical paths, but source context remains unchanged." - Used in full variant
5. "Suggested changes require explicit user action." - Used in full variant
6. "Interpretation is bounded by current evidence coverage." - Used in full variant

**Implementation**:
```typescript
// In LockedScientificContext component (full variant)
<div className="text-[9px] text-text-muted leading-snug space-y-1">
  <p>User-confirmed context is treated as a locked scientific constraint.</p>
  <p>DIFARYX may test analytical paths, but source context remains unchanged.</p>
  <p>Suggested changes require explicit user action.</p>
  <p>Interpretation is bounded by current evidence coverage.</p>
</div>
```

### Data Isolation

**Guardrail**: Unsupported projects must not inherit CuFe₂O₄ locked context

**Implementation**:
- Locked context data is keyed by exact project ID
- No fallback to default locked context
- `getLockedContext()` returns `null` for unsupported projects
- Components explicitly check for `null` and render fallback UI

**Validation**:
```typescript
// Test case
test('fe3o4-nanoparticles does not inherit cu-fe2o4-spinel locked context', () => {
  const context = getLockedContext('fe3o4-nanoparticles');
  expect(context).toBeNull();
});
```

### No Backend Implications

**Guardrail**: Do not imply live backend sync or automatic source-processing mutation

**Implementation**:
- All wording uses past tense: "preserved", "was not modified"
- No "syncing" or "updating" language
- No loading spinners or async operations
- No "save" or "update" buttons near locked context display

**Validation**:
- Review all component text for backend-implying language
- Ensure no API calls in locked context code
- Ensure no localStorage writes in locked context code

## Preservation of Existing Behavior

### No Route Changes

**Validation**:
- All existing routes remain unchanged
- No new routes added
- No route redirects added

### No Architecture Refactoring

**Validation**:
- No changes to `src/data/demoProjects.ts` structure
- No changes to `src/types/agent.ts` structure
- No changes to existing component props
- Only additive changes (new files, new sections in existing files)

### No Dependency Changes

**Validation**:
- No changes to `package.json`
- No new npm packages installed
- No changes to `vite.config.ts`

### Deterministic Demo Preservation

**Validation**:
- Locked context data is hardcoded (no randomization)
- cu-fe2o4-spinel always shows same locked context
- cufe2o4-sba15 always shows same locked context
- Unsupported projects always show same fallback message

## Implementation Checklist

### Phase 1: Data Layer
- [ ] Create `src/data/lockedContext.ts`
- [ ] Define `LockedScientificContext` interface
- [ ] Define `LOCKED_CONTEXT_DATA` constant with cu-fe2o4-spinel data
- [ ] Define `LOCKED_CONTEXT_DATA` constant with cufe2o4-sba15 data
- [ ] Implement `getLockedContext()` function
- [ ] Write unit tests for `getLockedContext()`

### Phase 2: Component Creation
- [ ] Create `src/components/locked-context/` directory
- [ ] Create `LockedScientificContext.tsx` component
- [ ] Implement full variant rendering
- [ ] Implement compact variant rendering
- [ ] Add "Locked by user" badge
- [ ] Add "Source context preserved" subtitle
- [ ] Add guardrail wording (full variant only)
- [ ] Write unit tests for component

### Phase 3: Agent Mode Integration
- [ ] Import `LockedScientificContext` in `RightPanel.tsx`
- [ ] Import `getLockedContext` in `RightPanel.tsx`
- [ ] Add locked context section after Source Processing Parameters
- [ ] Test with cu-fe2o4-spinel project
- [ ] Test with cufe2o4-sba15 project
- [ ] Test with fe3o4-nanoparticles project (fallback)

### Phase 4: XRD Workspace Integration
- [ ] Import `LockedScientificContext` in `XrdWorkspace.tsx`
- [ ] Import `getLockedContext` in `XrdWorkspace.tsx`
- [ ] Add compact locked context card in left sidebar
- [ ] Test with cu-fe2o4-spinel project
- [ ] Test with cufe2o4-sba15 project
- [ ] Test with nife2o4 project (fallback)

### Phase 5: Notebook Integration
- [ ] Import `getLockedContext` in `NotebookLab.tsx`
- [ ] Add preservation notice after experiment title
- [ ] Test with cu-fe2o4-spinel project
- [ ] Test with cofe2o4 project (no notice)

### Phase 6: Report Export Integration
- [ ] Modify `exportMarkdown()` function in `NotebookLab.tsx`
- [ ] Add locked context section in markdown export
- [ ] Test export with cu-fe2o4-spinel project
- [ ] Test export with fe3o4-nanoparticles project (no section)

### Phase 7: Testing and Validation
- [ ] Run all unit tests
- [ ] Run all integration tests
- [ ] Run smoke tests on all required routes
- [ ] Validate no console errors
- [ ] Validate no layout overflow
- [ ] Validate correct styling
- [ ] Validate correct wording
- [ ] Run `npm.cmd run build` (must pass)
- [ ] Run `git diff --check` (must pass)

### Phase 8: Documentation
- [ ] Update README if needed
- [ ] Add inline code comments
- [ ] Document locked context data format
- [ ] Document component props
- [ ] Document integration points

## Acceptance Criteria Mapping

This design addresses all requirements from the requirements document:

- **Requirement 1**: LockedScientificContext component displays all six fields
- **Requirement 2**: Deterministic data for cu-fe2o4-spinel in `LOCKED_CONTEXT_DATA`
- **Requirement 3**: Deterministic data for cufe2o4-sba15 in `LOCKED_CONTEXT_DATA`
- **Requirement 4**: Fallback message for unsupported projects
- **Requirement 5**: Locked context in Agent Mode RightPanel
- **Requirement 6**: Compact locked context card in XRD Workspace
- **Requirement 7**: Preservation notice in Notebook
- **Requirement 8**: Locked context in report export
- **Requirement 9**: Required wording and terminology
- **Requirement 10**: Guardrail enforcement (no inheritance, no backend implications)
- **Requirement 11**: Build validation (npm.cmd run build, git diff --check)
- **Requirement 12**: Smoke test coverage (all required routes)
- **Requirement 13**: Preservation of existing behavior (no refactoring, additive only)
