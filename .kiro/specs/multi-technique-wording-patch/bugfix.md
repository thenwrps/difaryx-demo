# Bugfix Requirements Document

## Introduction

DIFARYX public beta currently contains inconsistent wording across the multi-technique workspace, landing page, Notebook claim boundaries, and Agent Demo that either overclaims capabilities (e.g., listing XPS as "supported context" when it's actually "pending validation") or undermines the multi-technique narrative (e.g., XRD-only framing). This patch ensures consistent messaging that positions DIFARYX as a validation-aware multi-technique scientific reasoning system with clear claim boundaries, not an XRD-only analyzer or a phase-confirmation tool that overclaims.

The bug affects user trust, scientific accuracy, and product positioning. Users may misinterpret the system's capabilities or validation boundaries, leading to inappropriate use of generated evidence or reports.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Notebook displays claim boundary for CuFe₂O₄ projects THEN the system lists "Cross-technique convergence with Raman/XPS context" as "Supported" even though XPS is marked as "Review" strength with "Run Cu 2p / Fe 2p review before surface-state claims" caveat

1.2 WHEN the Cross-Tech Evidence Review section displays interpretation copy THEN the system states "Convergent multi-technique evidence supports spinel ferrite structure" without qualifying that XPS surface-state validation remains under review

1.3 WHEN the Cross-Tech Evidence Review displays recommendation copy THEN the system states "Proceed with spinel ferrite structural assignment for downstream analysis and reporting" without validation-limited framing

1.4 WHEN the Cross-Tech Evidence Review displays status line THEN the system shows "Preliminary assignment: CuFe2O4 spinel ferrite" without subscripts or validation-required qualifier

1.5 WHEN XPS status is displayed in supporting data or claim boundaries THEN the system uses inconsistent language mixing "Review", "Pending", "requires validation", and "under review" without a unified pattern

1.6 WHEN the landing page hero section displays the tagline THEN the system shows "From experimental signal to evidence-linked interpretation" which does not emphasize validation-aware decisions

1.7 WHEN the Agent Mode displays XRD scenario title THEN the system lacks explanatory microcopy clarifying that Raman, FTIR, XPS, and literature provide validation context

1.8 WHEN chemical formulas are displayed in user-facing copy THEN the system shows plain text like "CuFe2O4" instead of properly formatted subscripts like "CuFe₂O₄"

### Expected Behavior (Correct)

2.1 WHEN the Notebook displays claim boundary for CuFe₂O₄ projects THEN the system SHALL separate "Contextual: Raman/FTIR support features" and "Pending: XPS surface-state validation" to avoid listing XPS as supported when it requires review

2.2 WHEN the Cross-Tech Evidence Review section displays interpretation copy THEN the system SHALL state "Linked XRD, Raman, and FTIR evidence supports a spinel-ferrite working interpretation, while XPS surface-state validation remains under review"

2.3 WHEN the Cross-Tech Evidence Review displays recommendation copy THEN the system SHALL state "Use spinel ferrite assignment as a working interpretation; phase purity and surface-state claims remain validation-limited"

2.4 WHEN the Cross-Tech Evidence Review displays status line THEN the system SHALL show "Preliminary interpretation: CuFe₂O₄-related spinel ferrite evidence, validation required" with proper subscripts and validation qualifier

2.5 WHEN XPS status is displayed in supporting data or claim boundaries THEN the system SHALL consistently use "Pending: XPS surface-state validation" and "Review Cu 2p / Fe 2p regions before surface-state claims"

2.6 WHEN the landing page hero section displays the tagline THEN the system SHALL show "From experimental signals to traceable scientific decisions" and include "validation-aware decisions" in supporting copy

2.7 WHEN the Agent Mode displays XRD scenario title THEN the system SHALL include microcopy stating "Primary structural evidence workflow. Raman, FTIR, XPS, and literature layers provide validation context."

2.8 WHEN chemical formulas are displayed in user-facing copy THEN the system SHALL use proper Unicode subscripts (CuFe₂O₄, Fe₃O₄, NiFe₂O₄, CoFe₂O₄) while preserving plain text in route IDs, project IDs, dataset IDs, file IDs, query params, and code identifiers

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the system builds the project THEN the system SHALL CONTINUE TO pass `npm.cmd run build` without errors

3.2 WHEN the system checks git diff THEN the system SHALL CONTINUE TO pass `git diff --check` without whitespace errors

3.3 WHEN users navigate to `/`, `/dashboard`, `/workspace`, `/workspace/multi?project=cu-fe2o4-spinel`, `/workspace/multi?project=cufe2o4-sba15`, `/demo/agent?project=cu-fe2o4-spinel`, `/notebook?project=cu-fe2o4-spinel`, `/notebook?project=cufe2o4-sba15`, `/history` THEN the system SHALL CONTINUE TO render all routes without breaking

3.4 WHEN the system processes route IDs, project IDs, dataset IDs, file IDs, query params, or code identifiers THEN the system SHALL CONTINUE TO use plain text chemical formulas without subscripts

3.5 WHEN the Locked Scientific Context is displayed THEN the system SHALL CONTINUE TO preserve existing copy without weakening claim boundaries

3.6 WHEN unsupported projects are displayed THEN the system SHALL CONTINUE TO avoid inheriting CuFe₂O₄ evidence or locked context

3.7 WHEN the system exports reports, saves notebook entries, or generates processing results THEN the system SHALL CONTINUE TO maintain existing deterministic demo behavior

3.8 WHEN the system displays Notebook, Agent Demo, History, or Report sections THEN the system SHALL CONTINUE TO preserve all existing routes, layout, and export behavior

3.9 WHEN backend or architecture is considered THEN the system SHALL CONTINUE TO remain frontend-only with no backend changes, no new dependencies, and no architecture refactor
