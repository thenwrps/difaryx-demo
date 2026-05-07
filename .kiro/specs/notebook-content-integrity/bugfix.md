# Bugfix Requirements Document

## Introduction

The DIFARYX Notebook Lab currently contains content that may create incorrect scientific implications. Specifically:
- CuFe₂O₄/SBA-15 supported samples are described with wording that implies pure/bulk CuFe₂O₄
- Key Evidence rows are repetitive rather than technique-specific
- Technical Trace labels (e.g., "gemini_reasoner") imply live model execution rather than deterministic demo behavior
- Some wording implies stronger phase-purity claims than the current evidence supports
- Validation boundaries and source context preservation are not clearly communicated

This bugfix ensures the Notebook content is scientifically accurate, validation-aware, and consistent with the deterministic public-beta demo narrative.

## Bug Analysis

### Current Behavior (Defect)

**1.1 CuFe₂O₄/SBA-15 Wording Overclaim**

1.1 WHEN the Notebook displays content for the CuFe₂O₄/SBA-15 project THEN the system uses wording that implies pure or bulk CuFe₂O₄ rather than a supported sample on mesoporous silica

1.2 WHEN Key Evidence rows are generated THEN the system produces repetitive evidence statements instead of distinct technique-specific evidence roles

1.3 WHEN the Technical Trace is displayed THEN the system shows labels like "gemini_reasoner" that imply live AI model execution rather than deterministic interpretation refinement

**1.2 Validation Boundary and Claim Strength**

1.4 WHEN report-ready discussion is generated THEN the system may imply publication-ready certainty without clearly stating validation boundaries

1.5 WHEN phase assignment is described THEN the system may imply phase purity or complete assignment without claim boundary language

**1.3 Context Preservation and Data Integrity**

1.6 WHEN deterministic demo disclosure is shown THEN the system does not clearly state that the notebook entry is generated from current interpretation context

1.7 WHEN source context is referenced THEN the system does not explicitly state that locked context (sample identity, source dataset, processing path, claim boundary) was preserved

1.8 WHEN unsupported projects are viewed THEN the system may show stale CuFe₂O₄ notebook content instead of indicating no compatible dataset exists

### Expected Behavior (Correct)

**2.1 CuFe₂O₄/SBA-15 Supported Sample Language**

2.1 WHEN the Notebook displays content for the CuFe₂O₄/SBA-15 project THEN the system SHALL use supported-sample language such as "CuFe₂O₄ spinel ferrite reflections are observed in the CuFe₂O₄/SBA-15 supported sample, consistent with dispersed copper ferrite on a mesoporous silica support"

2.2 WHEN Key Evidence rows are generated THEN the system SHALL produce distinct technique-specific evidence statements such as:
- "XRD reflections assigned to CuFe₂O₄ remain visible in the supported CuFe₂O₄/SBA-15 sample"
- "Raman vibrational features provide contextual support for ferrite-like local structure"
- "FTIR silica/support bands contextualize the SBA-15 matrix but do not independently prove ferrite phase purity"

2.3 WHEN the Technical Trace is displayed THEN the system SHALL use deterministic labels such as "interpretation_refinement", "evidence_reasoning_step", "deterministic_reasoning_trace", or "validation_boundary_review"

**2.2 Validation-Aware Report Wording**

2.4 WHEN report-ready discussion is generated THEN the system SHALL include validation-aware wording such as "This discussion is report-ready for internal scientific review, but publication-level claims require complementary validation"

2.5 WHEN phase assignment is described THEN the system SHALL include claim boundary language such as "Supports CuFe₂O₄ spinel assignment within current evidence coverage; phase purity remains validation-limited"

2.6 WHEN CuFe₂O₄/SBA-15 phase assignment is described THEN the system SHALL use "Supports the presence of CuFe₂O₄-related reflections in a supported CuFe₂O₄/SBA-15 context; do not describe as pure bulk CuFe₂O₄"

**2.3 Context Preservation and Data Integrity Guardrails**

2.7 WHEN deterministic demo disclosure is shown THEN the system SHALL state "Demo notebook entry generated from the current interpretation context" and "Source context preserved during interpretation refinement"

2.8 WHEN locked context is referenced THEN the system SHALL state "Locked context preserved: sample identity, source dataset, processing path, and claim boundary were not modified"

2.9 WHEN unsupported projects are viewed THEN the system SHALL show "no linked interpretation context" rather than stale CuFe₂O₄ content

2.10 WHEN uploaded or future datasets are processed THEN the system SHALL NOT inherit demo CuFe₂O₄ evidence unless explicitly selected

### Unchanged Behavior (Regression Prevention)

**3.1 Preserve Existing Notebook Workflow**

3.1 WHEN users navigate to /notebook THEN the system SHALL CONTINUE TO display the Notebook Lab interface with experiments sidebar, template mode selection, and report sections

3.2 WHEN users select a project from the experiments sidebar THEN the system SHALL CONTINUE TO load and display that project's notebook content

3.3 WHEN users switch template modes (research, R&D, analytical) THEN the system SHALL CONTINUE TO update the notebook content according to the selected template

**3.2 Preserve Agent and Workspace Integration**

3.4 WHEN users navigate from Agent Demo to Notebook THEN the system SHALL CONTINUE TO preserve the agent run context and display linked evidence

3.5 WHEN users navigate from XRD/XPS/FTIR/Raman workspace to Notebook THEN the system SHALL CONTINUE TO preserve workspace processing results and display linked evidence

3.6 WHEN users view History THEN the system SHALL CONTINUE TO show previous agent and workspace runs with correct provenance

**3.3 Preserve Export and Report Functionality**

3.7 WHEN users export Markdown reports THEN the system SHALL CONTINUE TO generate downloadable .md files with all notebook sections

3.8 WHEN users export PNG snapshots THEN the system SHALL CONTINUE TO generate downloadable .png images of the report

3.9 WHEN users print reports THEN the system SHALL CONTINUE TO open the browser print dialog with formatted report content

3.10 WHEN users share notebook links THEN the system SHALL CONTINUE TO copy shareable URLs with project, template, and entry parameters

**3.4 Preserve Demo Data and Routes**

3.11 WHEN the app builds THEN the system SHALL CONTINUE TO pass `npm.cmd run build` without errors

3.12 WHEN users navigate to any existing route THEN the system SHALL CONTINUE TO render the correct page without breaking

3.13 WHEN demo projects are loaded THEN the system SHALL CONTINUE TO use the existing demoProjects data structure and localStorage persistence

3.14 WHEN graphs are displayed THEN the system SHALL CONTINUE TO render XRD/XPS/FTIR/Raman graphs correctly in all contexts
