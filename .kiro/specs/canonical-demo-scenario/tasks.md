# P0-02: Lock Canonical Demo Scenario - Tasks

## Task Overview

This document breaks down the implementation of the canonical demo scenario into discrete, testable tasks. Each task is designed to be completed independently while maintaining system stability.

---

## Phase 1: Core Data Model

### Task 1.1: Create Type Definitions
**File**: `src/data/canonicalScenarioTypes.ts`

**Objective**: Define all TypeScript types for the canonical scenario.

**Implementation**:
1. Create `CanonicalScenario` interface
2. Create `ProjectMetadata` interface
3. Create `MaterialProperties` interface
4. Create `CharacterizationObjective` interface
5. Create `TechniqueCoverage` interface
6. Create `TechniqueInfo` interface
7. Create `DatasetDefinitions` interface
8. Create dataset-specific interfaces (XRD, Raman, XPS, FTIR)
9. Create `OutputSectionTemplates` interface
10. Create `ReferenceData` interface
11. Export all types

**Acceptance Criteria**:
- All types compile without errors
- Types are exported and importable
- JSDoc comments added for all interfaces
- No `any` types used

**Estimated Time**: 1 hour

---

### Task 1.2: Create Canonical Scenario Data
**File**: `src/data/canonicalScenario.ts`

**Objective**: Implement the canonical scenario with all required data.

**Implementation**:
1. Import types from `canonicalScenarioTypes.ts`
2. Define `CANONICAL_SCENARIO` constant with:
   - Project metadata (id, name, sampleId, dates, status)
   - Material properties (formula, system, class, crystal structure, synthesis)
   - Characterization objective (main, questions, context, use case, stakeholders)
   - Technique coverage (primary XRD, supporting Raman/XPS/FTIR)
   - Dataset definitions (XRD, Raman, XPS, FTIR with full data)
   - Output section templates (6 canonical sections)
   - Reference data (lattice parameters, Raman modes, XPS energies, FTIR bands)
3. Export `CANONICAL_SCENARIO` as default
4. Add helper functions:
   - `getCanonicalProject()`
   - `getCanonicalDataset(technique)`
   - `getCanonicalOutputSections()`
   - `getCanonicalTechniques()`

**Acceptance Criteria**:
- Canonical scenario compiles without errors
- All required fields populated
- Helper functions work correctly
- Data matches requirements.md specification
- Chemical formulas use proper subscript notation

**Estimated Time**: 2 hours

---

### Task 1.3: Create Status and Label Constants
**File**: `src/data/canonicalScenario.ts` (add to existing)

**Objective**: Define canonical terminology constants.

**Implementation**:
1. Add `STATUS_LABELS` constant:
   ```typescript
   export const STATUS_LABELS = {
     complete: 'Complete',
     ready: 'Ready',
     'in-progress': 'In Progress',
     pending: 'Pending',
     review: 'Review',
   } as const;
   ```

2. Add `SECTION_HEADERS` constant:
   ```typescript
   export const SECTION_HEADERS = {
     overview: 'Characterization Overview',
     data: 'Supporting Data',
     insights: 'Cross-Technique Insights',
     interpretation: 'Agent Interpretation',
     conclusion: 'Conclusion',
     limitations: 'Limitations and Follow-up Validation',
   } as const;
   ```

3. Add `FORBIDDEN_TERMS` constant (for validation):
   ```typescript
   export const FORBIDDEN_TERMS = [
     'Strongly Supported',
     'Claim Status',
     'Decision Status',
     'AI Reasoning',
     'Scientific Reasoning Summary',
     'Agent Evidence Summary',
     'Evidence Matrix',
     'Evidence Basis',
     'Scientific Interpretation',
     'Decision Statement',
     'Caveats and Next Steps',
   ] as const;
   ```

**Acceptance Criteria**:
- Constants compile without errors
- All canonical labels defined
- Forbidden terms documented
- Type-safe access to labels

**Estimated Time**: 30 minutes

---

## Phase 2: Backward Compatibility

### Task 2.1: Create Adapter Functions
**File**: `src/data/canonicalScenarioAdapters.ts`

**Objective**: Create adapters to convert canonical scenario to existing data formats.

**Implementation**:
1. Import `CANONICAL_SCENARIO` and existing types
2. Implement `canonicalToDemoProject()`:
   - Convert canonical project to `DemoProject` format
   - Map status labels
   - Map technique arrays
3. Implement `canonicalToDataset(technique)`:
   - Convert canonical dataset to `DemoDataset` format
   - Handle technique-specific fields
4. Implement `canonicalToAgentRun()`:
   - Convert canonical scenario to `AgentRun` format
   - Map output sections
5. Add validation functions:
   - `validateCanonicalScenario()`
   - `checkTerminologyCompliance()`

**Acceptance Criteria**:
- All adapters compile without errors
- Adapters produce valid output
- No data loss in conversion
- Validation functions work correctly

**Estimated Time**: 1.5 hours

---

### Task 2.2: Update demoProjects.ts
**File**: `src/data/demoProjects.ts`

**Objective**: Integrate canonical scenario with existing demo projects.

**Implementation**:
1. Import `CANONICAL_SCENARIO` and adapters
2. Update `demoProjects` array to include canonical project:
   ```typescript
   export const demoProjects: DemoProject[] = [
     canonicalToDemoProject(),
     // ... other projects
   ];
   ```
3. Update `getProject()` to prioritize canonical scenario
4. Update `getProjectDatasets()` to use canonical datasets
5. Add `isCanonicalProject(projectId)` helper
6. Maintain backward compatibility for non-canonical projects

**Acceptance Criteria**:
- Existing code continues to work
- Canonical project appears in demo projects
- No breaking changes
- Build passes without errors

**Estimated Time**: 1 hour

---

## Phase 3: Component Updates

### Task 3.1: Update Dashboard
**File**: `src/pages/Dashboard.tsx`

**Objective**: Update Dashboard to use canonical scenario.

**Implementation**:
1. Import `CANONICAL_SCENARIO`, `STATUS_LABELS`
2. Update project card rendering:
   - Use `canonicalScenario.project.displayName`
   - Use `STATUS_LABELS[canonicalScenario.project.status]`
   - Use `canonicalScenario.techniques` for badges
   - Use `canonicalScenario.project.lastUpdated`
3. Ensure `formatChemicalFormula()` applied to display name
4. Verify status colors match canonical labels
5. Test all project card interactions

**Acceptance Criteria**:
- Dashboard displays canonical project correctly
- Status labels use canonical terminology
- Technique badges match canonical coverage
- No visual regressions
- Build passes

**Estimated Time**: 1 hour

---

### Task 3.2: Update XRD Workspace
**File**: `src/pages/XRDWorkspace.tsx`

**Objective**: Update XRD workspace to use canonical XRD dataset.

**Implementation**:
1. Import `CANONICAL_SCENARIO`, `SECTION_HEADERS`
2. Update dataset loading:
   - Use `canonicalScenario.datasets.xrd`
3. Update objective display:
   - Use `canonicalScenario.objective.main`
4. Update output sections:
   - Use `SECTION_HEADERS` for all section titles
5. Update status labels:
   - Use `STATUS_LABELS` for conclusion
6. Verify all XRD-specific data matches canonical

**Acceptance Criteria**:
- XRD workspace uses canonical dataset
- Objective matches canonical definition
- Section headers use canonical terminology
- Status labels correct
- No visual regressions

**Estimated Time**: 1.5 hours

---

### Task 3.3: Update Raman Workspace
**File**: `src/pages/RamanWorkspace.tsx` (if exists, else skip)

**Objective**: Update Raman workspace to use canonical Raman dataset.

**Implementation**:
1. Import `CANONICAL_SCENARIO`, `SECTION_HEADERS`
2. Update dataset loading:
   - Use `canonicalScenario.datasets.raman`
3. Update output sections:
   - Use `SECTION_HEADERS` for all section titles
4. Update status labels:
   - Use `STATUS_LABELS`
5. Verify Raman-specific data matches canonical

**Acceptance Criteria**:
- Raman workspace uses canonical dataset
- Section headers use canonical terminology
- Status labels correct
- No visual regressions

**Estimated Time**: 1.5 hours

---

### Task 3.4: Update XPS Workspace
**File**: `src/pages/XPSWorkspace.tsx`

**Objective**: Update XPS workspace to use canonical XPS dataset.

**Implementation**:
1. Import `CANONICAL_SCENARIO`, `SECTION_HEADERS`
2. Update dataset loading:
   - Use `canonicalScenario.datasets.xps`
3. Update output sections:
   - Use `SECTION_HEADERS` for all section titles
4. Update status labels:
   - Use `STATUS_LABELS`
5. Update `conclusionBadge` to use canonical labels
6. Verify XPS-specific data matches canonical

**Acceptance Criteria**:
- XPS workspace uses canonical dataset
- Section headers use canonical terminology
- Status labels correct
- No visual regressions

**Estimated Time**: 1.5 hours

---

### Task 3.5: Update FTIR Workspace
**File**: `src/pages/FTIRWorkspace.tsx` (if exists, else skip)

**Objective**: Update FTIR workspace to use canonical FTIR dataset.

**Implementation**:
1. Import `CANONICAL_SCENARIO`, `SECTION_HEADERS`
2. Update dataset loading:
   - Use `canonicalScenario.datasets.ftir`
3. Update output sections:
   - Use `SECTION_HEADERS` for all section titles
4. Update status labels:
   - Use `STATUS_LABELS`
5. Verify FTIR-specific data matches canonical

**Acceptance Criteria**:
- FTIR workspace uses canonical dataset
- Section headers use canonical terminology
- Status labels correct
- No visual regressions

**Estimated Time**: 1.5 hours

---

### Task 3.6: Update Multi-Tech Workspace
**File**: `src/pages/MultiTechWorkspace.tsx`

**Objective**: Update multi-tech workspace to use canonical cross-technique data.

**Implementation**:
1. Import `CANONICAL_SCENARIO`, `SECTION_HEADERS`
2. Update technique coverage display:
   - Use `canonicalScenario.techniques`
3. Update cross-technique insights:
   - Use canonical technique relationships
4. Update output sections:
   - Use `SECTION_HEADERS` for all section titles
5. Update notebook draft generation:
   - Use canonical section templates
6. Verify "Cross-Technique Insights" header used (not "Evidence Matrix")

**Acceptance Criteria**:
- Multi-tech workspace uses canonical techniques
- Section headers use canonical terminology
- Cross-technique insights properly labeled
- No visual regressions

**Estimated Time**: 2 hours

---

### Task 3.7: Update Agent Demo
**File**: `src/pages/AgentDemo.tsx`

**Objective**: Update Agent Demo to use canonical scenario.

**Implementation**:
1. Import `CANONICAL_SCENARIO`, `SECTION_HEADERS`, `STATUS_LABELS`
2. Update default mission:
   ```typescript
   const DEFAULT_MISSION = CANONICAL_SCENARIO.objective.main;
   ```
3. Update dataset selection:
   - Default to canonical XRD dataset
4. Update output sections:
   - Use `SECTION_HEADERS` for all section titles
5. Update status labels:
   - Use `STATUS_LABELS` for finding status
6. Update subtitle:
   - Ensure "Agent Interpretation" used (not "Scientific Reasoning")
7. Verify tool trace uses canonical technique names

**Acceptance Criteria**:
- Agent Demo uses canonical objective
- Default dataset is canonical XRD
- Section headers use canonical terminology
- Status labels correct
- No visual regressions

**Estimated Time**: 2 hours

---

### Task 3.8: Update Notebook
**File**: `src/pages/NotebookLab.tsx`

**Objective**: Update Notebook to use canonical output sections.

**Implementation**:
1. Import `CANONICAL_SCENARIO`, `SECTION_HEADERS`, `STATUS_LABELS`
2. Update report title:
   - Use `canonicalScenario.project.displayName`
3. Update section structure:
   - Use `SECTION_HEADERS` for all section titles
   - Ensure sections in canonical order
4. Update metadata:
   - Include `canonicalScenario.project.sampleId`
   - Include `canonicalScenario.project.createdDate`
5. Update export:
   - Include canonical metadata in exports
6. Verify "Characterization Overview" used (not "Scientific Reasoning Summary")
7. Verify "Supporting Data" used (not "Agent Evidence Summary")
8. Verify "Limitations and Follow-up Validation" used (not "Caveats and Next Steps")

**Acceptance Criteria**:
- Notebook uses canonical project name
- Sections follow canonical structure
- Section headers use canonical terminology
- Metadata includes canonical fields
- No visual regressions

**Estimated Time**: 2 hours

---

### Task 3.9: Update History
**File**: `src/pages/History.tsx`

**Objective**: Update History to reference canonical scenario.

**Implementation**:
1. Import `CANONICAL_SCENARIO`, `STATUS_LABELS`
2. Update run entries:
   - Reference `canonicalScenario.project.displayName`
   - Include `canonicalScenario.project.sampleId`
3. Update technique coverage:
   - Use `canonicalScenario.techniques`
4. Update status labels:
   - Use `STATUS_LABELS` for finding status
5. Update metadata display:
   - Show canonical sample ID
   - Show canonical technique coverage
6. Verify "Source" used (not "Agent Memory")
7. Verify "Finding Status" used (not "Claim Status")

**Acceptance Criteria**:
- History references canonical project
- Metadata includes canonical sample ID
- Technique coverage matches canonical
- Status labels use canonical terminology
- No visual regressions

**Estimated Time**: 1.5 hours

---

## Phase 4: Validation and Testing

### Task 4.1: Run Terminology Audit
**Objective**: Verify no forbidden terms remain in visible UI.

**Implementation**:
1. Run grep search for all forbidden terms:
   ```bash
   grep -r "Strongly Supported\|Claim Status\|Decision Status\|AI Reasoning\|Scientific Reasoning Summary\|Agent Evidence Summary\|Evidence Matrix\|Evidence Basis\|Scientific Interpretation\|Decision Statement\|Caveats and Next Steps" src/pages/ src/components/
   ```
2. Review all matches
3. Classify as internal code vs visible UI
4. Fix any visible UI violations
5. Document remaining internal code usage

**Acceptance Criteria**:
- No forbidden terms in visible UI text
- All violations documented
- Audit report created

**Estimated Time**: 1 hour

---

### Task 4.2: Test All Routes
**Objective**: Verify all routes work correctly with canonical scenario.

**Implementation**:
1. Test /dashboard:
   - Verify canonical project displays
   - Verify status labels correct
   - Verify technique badges correct
2. Test /workspace/xrd:
   - Verify canonical XRD dataset loads
   - Verify section headers correct
3. Test /workspace/xps:
   - Verify canonical XPS dataset loads
   - Verify section headers correct
4. Test /workspace/multi:
   - Verify cross-technique insights
   - Verify section headers correct
5. Test /demo/agent:
   - Verify canonical objective used
   - Verify section headers correct
6. Test /notebook:
   - Verify canonical sections
   - Verify terminology correct
7. Test /history:
   - Verify canonical metadata
   - Verify terminology correct
8. Test /settings:
   - Verify no regressions

**Acceptance Criteria**:
- All routes load without errors
- All routes display canonical data correctly
- All routes use canonical terminology
- No visual regressions

**Estimated Time**: 2 hours

---

### Task 4.3: Run Build and Verify
**Objective**: Ensure build passes and bundle size acceptable.

**Implementation**:
1. Run `npm run build`
2. Verify no TypeScript errors
3. Verify no build warnings
4. Check bundle size increase:
   - Should be < 10KB total
5. Run production build locally
6. Test all routes in production build

**Acceptance Criteria**:
- Build passes without errors
- No TypeScript errors
- Bundle size increase < 10KB
- Production build works correctly

**Estimated Time**: 30 minutes

---

### Task 4.4: Create Validation Script
**File**: `scripts/validateCanonicalScenario.ts`

**Objective**: Create automated validation script for canonical scenario.

**Implementation**:
1. Create validation script that checks:
   - All required fields present
   - No forbidden terms in canonical data
   - All datasets have required fields
   - All techniques have required fields
   - Output sections in correct order
   - Status labels match canonical definitions
2. Add to package.json scripts:
   ```json
   "validate:scenario": "ts-node scripts/validateCanonicalScenario.ts"
   ```
3. Run validation script
4. Fix any issues found

**Acceptance Criteria**:
- Validation script runs without errors
- All checks pass
- Script added to package.json
- Documentation added

**Estimated Time**: 1 hour

---

## Phase 5: Documentation

### Task 5.1: Update AGENTS.md
**File**: `AGENTS.md`

**Objective**: Document canonical scenario in project guide.

**Implementation**:
1. Add section "Canonical Demo Scenario"
2. Document:
   - Purpose of canonical scenario
   - How to access canonical data
   - How to extend for new features
   - Forbidden terminology
   - Output section structure
3. Add examples of correct usage
4. Add migration guide for future changes

**Acceptance Criteria**:
- AGENTS.md updated
- Clear documentation added
- Examples provided
- Migration guide included

**Estimated Time**: 1 hour

---

### Task 5.2: Add JSDoc Comments
**Files**: All canonical scenario files

**Objective**: Add comprehensive JSDoc comments.

**Implementation**:
1. Add JSDoc to `canonicalScenarioTypes.ts`:
   - Document all interfaces
   - Document all fields
   - Add usage examples
2. Add JSDoc to `canonicalScenario.ts`:
   - Document canonical scenario constant
   - Document all helper functions
   - Add usage examples
3. Add JSDoc to `canonicalScenarioAdapters.ts`:
   - Document all adapter functions
   - Document conversion logic
   - Add usage examples

**Acceptance Criteria**:
- All exports have JSDoc comments
- All functions documented
- Usage examples provided
- Types documented

**Estimated Time**: 1 hour

---

### Task 5.3: Create Migration Guide
**File**: `.kiro/specs/canonical-demo-scenario/migration-guide.md`

**Objective**: Create guide for migrating to canonical scenario.

**Implementation**:
1. Document migration steps
2. Provide before/after examples
3. List common pitfalls
4. Add troubleshooting section
5. Include validation checklist

**Acceptance Criteria**:
- Migration guide created
- Clear steps provided
- Examples included
- Troubleshooting section added

**Estimated Time**: 1 hour

---

## Task Summary

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Core Data Model | 3 tasks | 3.5 hours |
| Phase 2: Backward Compatibility | 2 tasks | 2.5 hours |
| Phase 3: Component Updates | 9 tasks | 15 hours |
| Phase 4: Validation and Testing | 4 tasks | 4.5 hours |
| Phase 5: Documentation | 3 tasks | 3 hours |
| **Total** | **21 tasks** | **28.5 hours** |

## Task Dependencies

```
Phase 1 (Core Data Model)
├── Task 1.1: Create Type Definitions
├── Task 1.2: Create Canonical Scenario Data (depends on 1.1)
└── Task 1.3: Create Status and Label Constants (depends on 1.2)

Phase 2 (Backward Compatibility)
├── Task 2.1: Create Adapter Functions (depends on 1.2)
└── Task 2.2: Update demoProjects.ts (depends on 2.1)

Phase 3 (Component Updates) - All depend on Phase 2
├── Task 3.1: Update Dashboard
├── Task 3.2: Update XRD Workspace
├── Task 3.3: Update Raman Workspace
├── Task 3.4: Update XPS Workspace
├── Task 3.5: Update FTIR Workspace
├── Task 3.6: Update Multi-Tech Workspace
├── Task 3.7: Update Agent Demo
├── Task 3.8: Update Notebook
└── Task 3.9: Update History

Phase 4 (Validation) - Depends on Phase 3
├── Task 4.1: Run Terminology Audit
├── Task 4.2: Test All Routes
├── Task 4.3: Run Build and Verify
└── Task 4.4: Create Validation Script

Phase 5 (Documentation) - Can run in parallel with Phase 4
├── Task 5.1: Update AGENTS.md
├── Task 5.2: Add JSDoc Comments
└── Task 5.3: Create Migration Guide
```

## Critical Path

The critical path for this implementation is:
1. Task 1.1 → 1.2 → 1.3 (Core Data Model)
2. Task 2.1 → 2.2 (Backward Compatibility)
3. Tasks 3.1-3.9 (Component Updates) - can be parallelized
4. Task 4.3 (Build Verification)

**Minimum Time to Complete**: ~20 hours (with parallelization)

## Testing Checklist

After completing all tasks, verify:

- [ ] All routes load without errors
- [ ] Canonical project displays correctly on Dashboard
- [ ] All workspaces use canonical datasets
- [ ] Agent Demo uses canonical objective
- [ ] Notebook uses canonical sections
- [ ] History references canonical metadata
- [ ] No forbidden terms in visible UI
- [ ] All status labels use canonical terminology
- [ ] All section headers use canonical terminology
- [ ] Build passes without errors
- [ ] Bundle size increase < 10KB
- [ ] No TypeScript errors
- [ ] No visual regressions
- [ ] Validation script passes
- [ ] Documentation complete

## Rollback Plan

If issues arise during implementation:

1. **Phase 1-2 Issues**: Revert canonical scenario files, restore demoProjects.ts
2. **Phase 3 Issues**: Revert individual component changes, keep canonical scenario
3. **Phase 4 Issues**: Fix validation issues, don't merge until passing
4. **Phase 5 Issues**: Documentation can be updated post-merge

## Post-Implementation

After successful implementation:

1. Monitor for any runtime errors
2. Gather feedback on terminology consistency
3. Plan for future P0 cards (P0-03 through P0-07)
4. Consider adding more scenario variants
5. Evaluate need for scenario switching feature
