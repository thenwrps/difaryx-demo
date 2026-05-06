# P0-02: Lock Canonical Demo Scenario

## Overview

This spec defines the implementation of a canonical demo scenario for DIFARYX that serves as the single source of truth for all demo data across the application.

## Spec Documents

1. **[requirements.md](./requirements.md)** - Complete requirements specification
   - Problem statement and goals
   - Canonical scenario definition
   - Functional and non-functional requirements
   - Critical constraints
   - Success criteria

2. **[design.md](./design.md)** - Technical design document
   - Architecture overview
   - Data model design
   - Component integration strategy
   - Backward compatibility approach
   - Future P0 card design

3. **[tasks.md](./tasks.md)** - Implementation task breakdown
   - 21 discrete tasks across 5 phases
   - Estimated 28.5 hours total
   - Task dependencies and critical path
   - Testing checklist
   - Rollback plan

## Quick Start

### For Implementers (Codex/Cursor)

1. Read `requirements.md` to understand the problem and goals
2. Review `design.md` to understand the technical approach
3. Follow `tasks.md` in order, starting with Phase 1
4. Run validation after each phase
5. Complete testing checklist before marking done

### Key Files to Create

```
src/data/
├── canonicalScenarioTypes.ts     # Type definitions
├── canonicalScenario.ts           # Main scenario data
└── canonicalScenarioAdapters.ts  # Backward compatibility
```

### Key Files to Update

```
src/data/demoProjects.ts          # Integrate canonical scenario
src/pages/Dashboard.tsx            # Use canonical project
src/pages/XRDWorkspace.tsx         # Use canonical XRD dataset
src/pages/XPSWorkspace.tsx         # Use canonical XPS dataset
src/pages/MultiTechWorkspace.tsx   # Use canonical techniques
src/pages/AgentDemo.tsx            # Use canonical objective
src/pages/NotebookLab.tsx          # Use canonical sections
src/pages/History.tsx              # Use canonical metadata
```

## Canonical Scenario Summary

**Project**: CuFe₂O₄ Spinel Ferrite Characterization
- Sample ID: sample_spinel_01
- Material: CuFe₂O₄-based spinel ferrite catalyst candidate
- Objective: Determine XRD-centered characterization consistency with cubic spinel ferrite

**Techniques**:
- Primary: XRD (9 major reflections)
- Supporting: Raman (5 active modes), XPS (Cu/Fe oxidation states), FTIR (M-O bands)

**Output Sections** (in order):
1. Characterization Overview
2. Supporting Data
3. Cross-Technique Insights
4. Agent Interpretation
5. Conclusion
6. Limitations and Follow-up Validation

## Critical Constraints

### MUST NOT Use (Forbidden Terms)
- ❌ Strongly Supported
- ❌ Claim Status
- ❌ Decision Status
- ❌ AI Reasoning
- ❌ Scientific Reasoning Summary
- ❌ Agent Evidence Summary
- ❌ Evidence Matrix
- ❌ Evidence Basis
- ❌ Scientific Interpretation (as heading)
- ❌ Decision Statement
- ❌ Caveats and Next Steps

### MUST Use (Canonical Terms)
- ✅ Complete / Ready / In Progress (status labels)
- ✅ Characterization Overview
- ✅ Supporting Data
- ✅ Cross-Technique Insights
- ✅ Agent Interpretation
- ✅ Conclusion
- ✅ Limitations and Follow-up Validation
- ✅ Finding Status
- ✅ Source

## Implementation Phases

### Phase 1: Core Data Model (3.5 hours)
Create type definitions, canonical scenario data, and label constants.

### Phase 2: Backward Compatibility (2.5 hours)
Create adapters and integrate with existing demoProjects.ts.

### Phase 3: Component Updates (15 hours)
Update all routes to use canonical scenario.

### Phase 4: Validation and Testing (4.5 hours)
Run terminology audit, test all routes, verify build.

### Phase 5: Documentation (3 hours)
Update AGENTS.md, add JSDoc comments, create migration guide.

## Success Criteria

- ✅ Single source of truth established
- ✅ All routes use canonical scenario
- ✅ Zero terminology violations
- ✅ Build passes without errors
- ✅ No performance regression
- ✅ Easy to extend for future P0 cards
- ✅ Backward compatible
- ✅ Well documented

## Future P0 Cards Supported

This canonical scenario is designed to support:
- P0-03: Characterization Objective Card
- P0-04: Sample Context Card
- P0-05: Data Availability Status
- P0-06: Technique Coverage Panel
- P0-07: Evidence Requirements Table

## Testing

Run after implementation:
```bash
npm run build                    # Verify build passes
npm run validate:scenario        # Run validation script
```

Manual testing checklist in `tasks.md`.

## Questions?

Refer to:
- `requirements.md` for "what" and "why"
- `design.md` for "how"
- `tasks.md` for "step-by-step"

## Status

- [x] Requirements defined
- [x] Design completed
- [x] Tasks broken down
- [ ] Implementation started
- [ ] Implementation complete
- [ ] Validation passed
- [ ] Documentation updated

---

**Created**: 2026-05-06
**Last Updated**: 2026-05-06
**Status**: Ready for Implementation
**Priority**: P0
**Estimated Effort**: 28.5 hours
