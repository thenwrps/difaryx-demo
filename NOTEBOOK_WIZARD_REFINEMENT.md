# ProjectNotebookWizard Refinement Summary

## Overview
Refined the ProjectNotebookWizard to be balanced across all three DIFARYX workflow modes: Research, R&D, and Analytical Job. The wizard now presents a consistent, premium scientific SaaS setup experience without privileging any single mode.

## Changes Made

### 1. MODE_CONFIG Section Names
Updated section names to be more consistent and mode-appropriate:

**Research:**
- "Next Experiment" → "Next Experiment / Decision"

**R&D:**
- "R&D Context" → "Development Context"
- "Next Action" → "Next Action / Decision"

**Analytical Job:**
- "Next Action" → "Result Decision / Disposition"

All three modes now follow the same structural backbone:
1. [Mode] Objective
2. [Mode] Context
3. Evidence Workspace
4. Agent Reasoning
5. Validation Gap
6. [Mode-specific Decision]
7. Decision Log
8. Notebook Memory
9. Report

### 2. DATA_FIELDS Simplification
Reduced the number of visible fields to create a more compact, balanced experience:

**Research (4 fields):**
- Project / Study Description (required)
- Scientific Question
- Sample System (required)
- Planned Techniques

**R&D (4 fields):**
- Project / Development Description (required)
- Product / Process Goal (required)
- Target KPI
- Decision Needed

**Analytical Job (4 fields):**
- Job / Request Description (required)
- Sample Submitted (required)
- Analysis Purpose
- Method / SOP

All modes now have exactly 4 fields with 2 required fields each, creating visual and cognitive balance.

### 3. Step 1 Heading
Changed from "Research Objective" to "Workflow Objective" to be mode-neutral.

### 4. Context Setup Section
Updated the heading in Step 4 Context Setup:
- Research: "Experimental Context"
- R&D: "Development Context" (was "R&D Context")
- Analytical: "Analytical Context"

Updated the description text:
- "Provide initial setup information for your [mode] notebook" 
→ "Provide initial context information for your [mode] workflow"

### 5. Evidence Data Section
Simplified the helper text for supported file types:
- Before: "Typical technique exports: XRD (.xy, .txt, .csv, .dat), Raman (.txt, .csv, .dat), FTIR (.csv, .txt, .dat), XPS (.csv, .txt, .dat)."
- After: "Typical technique exports: XRD, Raman, FTIR, XPS."

This keeps file formats separate from technique names and reduces visual clutter.

### 6. Data Import Description
Changed "Attach initial experimental files now or skip and add them later" 
→ "Attach initial data files now or skip and add them later"

More neutral wording that works for all three modes.

## Verification

✅ Build passes: `npm.cmd run build` completed successfully
✅ All three modes have equal field counts (4 fields each)
✅ All three modes have equal required field counts (2 required each)
✅ Section structures are consistent across modes
✅ No mode-specific bias in shared UI elements
✅ File format chips show only actual file extensions
✅ Technique names appear only as helper text examples

## User Experience Improvements

1. **Balanced Presentation**: All three modes now feel equally supported with the same number of fields and similar complexity
2. **Reduced Scrolling**: Fewer fields per mode reduces internal modal scrolling
3. **Clearer Hierarchy**: Simplified field sets make the essential vs. optional distinction clearer
4. **Mode-Neutral Language**: Shared elements use neutral terminology that works across all contexts
5. **Premium SaaS Feel**: Compact, focused setup flow feels more like a modern SaaS product than an enterprise form

## Preserved Functionality

- All existing routes and component architecture unchanged
- Form validation behavior preserved
- localStorage behavior unchanged
- Deterministic demo flow maintained
- Step navigation (Back/Next) unchanged
- Mode selection behavior unchanged
- File upload and data destination logic unchanged
- Review step logic unchanged

## Product Identity

The wizard now consistently presents DIFARYX as an autonomous scientific workflow intelligence system that supports:
- **Research**: Thesis, manuscript, characterization studies
- **R&D**: Formulation, process development, go/no-go decisions
- **Analytical Job**: QA/QC analysis, method/SOP workflows, validated results

No single mode dominates the experience, and the shared workflow backbone (Objective → Context → Evidence → Reasoning → Gap → Decision → Memory → Report) is clear across all three modes.
