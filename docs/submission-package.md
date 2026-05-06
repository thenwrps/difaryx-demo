# DIFARYX Submission Package

## One-Line Description

DIFARYX turns experimental characterization data into structured, evidence-linked scientific interpretation for reproducible materials research workflows.

## Demo Narrative

DIFARYX addresses the bottleneck between raw characterization data and defensible scientific interpretation. In the demo, a CuFe₂O₄-based spinel ferrite candidate is evaluated through an XRD-centered workflow with Raman, XPS, and FTIR context, showing data availability, technique coverage, evidence requirements, interpretation, conclusion, and follow-up validation. The result is a reproducible characterization workflow that links observations to assignments, limitations, and report-ready outputs.

## Features

- Canonical CuFe₂O₄ spinel ferrite characterization scenario
- XRD-centered phase identification workflow
- Multi-technique context across XRD, Raman, XPS, and FTIR
- Data availability and technique coverage panels
- Evidence requirements table with follow-up validation
- Report-ready notebook output with provenance
- Deterministic frontend demo preserving reproducibility

## Technical Architecture Summary

DIFARYX uses a React + Vite frontend with deterministic demo data and structured characterization components. The current demo centers on a canonical CuFe₂O₄ spinel ferrite workflow, using shared scenario data from a single source of truth and rendering objective, sample context, data availability, technique coverage, evidence requirements, interpretation, and report output across connected routes. The system is designed to support future agent/LLM integration while keeping the current public demo deterministic and reproducible.

## Limitation Statement

The current demo is deterministic and frontend-based. It demonstrates the intended characterization workflow, evidence structure, and report experience, while future versions can connect live instrumentation data, reference databases, LLM-assisted interpretation, and backend execution services.

## Demo Walkthrough

Start on the DIFARYX dashboard to show the project workflow and characterization routes. Open the autonomous characterization demo, where the CuFe₂O₄ spinel ferrite scenario is defined through a clear objective, sample context, data availability, technique coverage, and evidence requirements. Run through the XRD-centered interpretation flow, then open the notebook to show how the result becomes a report-ready characterization record with conclusion, limitations, and provenance.

## Important Routes

- `/`
- `/dashboard`
- `/workspace`
- `/workspace/xrd`
- `/workspace/multi`
- `/demo/agent`
- `/notebook`
- `/history`
- `/settings`
