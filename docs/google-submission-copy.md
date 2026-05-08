# Google AI Challenge / Google Cloud Rapid Agent Hackathon Copy

## One-Sentence Pitch

DIFARYX turns experimental characterization signals into evidence-linked scientific reasoning, bounded decisions, and report-ready outputs.

## Product Summary

DIFARYX helps researchers move from raw characterization data to traceable scientific decisions without losing provenance or limitations. The current demo shows a deterministic scientific workflow across dashboard, New Experiment condition locking, XRD workspace, multi-technique workspace, Agent Mode, Notebook Lab, History, Settings, and a local public-beta upload core. The upload core supports XRD, XPS, FTIR, and Raman signal files with context locking, feature extraction, evidence quality gates, claim boundaries, and Notebook / Report handoff preview.

## Demo Highlights

- Multi-technique workspace for XRD, XPS, FTIR, and Raman evidence review.
- New Experiment flow with a local Experiment Condition Lock for sample preparation, measurement, processing, and validation constraints.
- Public-beta upload workflow for `.csv`, `.txt`, `.xy`, and `.dat` signal files.
- X/Y column remapping, locked scientific context, uploaded signal plotting, and deterministic feature extraction.
- Evidence quality gates and technique-specific claim boundaries before interpretation handoff.
- Notebook / Report preview that preserves source context, condition status, and avoids mixing uploaded data with bundled CuFe2O4 demo evidence.

## Technical Architecture Summary

The current demo is a Vite React single-page app with deterministic local data, local experiment condition records, and browser-scoped upload persistence. Shared graph rendering supports bundled demo traces and uploaded signal traces. Upload parsing, feature extraction, evidence quality evaluation, condition-aware claim boundaries, localStorage safety, and the smoke test live in frontend code with no production backend dependency.

Future architecture can connect the same workflow to Gemini, Google Cloud, ADK-style orchestration, and MCP-style tools. A practical path is: browser workflow -> Cloud Run analysis services -> Gemini reasoning -> Vertex AI Search retrieval -> Notebook / Report generation through inspectable tool calls.

## Innovation Summary

DIFARYX focuses on the missing layer between experimental data and scientific decision-making. Instead of treating AI output as standalone text, the product structures signal features, locked source context, experiment conditions, evidence coverage, limitations, and handoff state before a notebook or report is prepared. This makes the workflow more reproducible and reduces overclaiming risk in scientific interpretation.

## Business Relevance

Materials R&D teams, analytical labs, and technical service groups spend substantial time turning instrument output into defensible internal reports, customer-facing summaries, and follow-up experiment plans. DIFARYX can reduce manual interpretation overhead while improving traceability from signal evidence to decision and report language. The same infrastructure pattern can extend beyond materials characterization into other evidence-heavy scientific and engineering workflows.

## Limitation And Honesty Statement

The submitted demo is deterministic, frontend-only, and local-browser scoped. It does not require a production backend, live authentication, live Gemini execution, Google Scholar scraping, or licensed scientific reference databases. Uploaded-data interpretation is beta-limited, evidence-limited, condition-limited when experiment records are incomplete, and reference validation pending.

## Suggested Two-Minute Demo Script

1. Open `/dashboard` and explain that DIFARYX connects signal review, evidence reasoning, and report handoff.
2. Open `/workspace/multi` and show the XRD, XPS, FTIR, and Raman evidence matrix so the product does not read as XRD-only.
3. Mention that New Experiment can lock sample preparation, measurement, processing, and validation conditions before interpretation.
4. Upload a small CSV signal in the public-beta upload area, select XRD, confirm sample context, and analyze.
5. Show the uploaded signal plot, detected reflections, evidence quality gate, locked context, condition status, and XRD claim boundary.
6. Point out that the uploaded run remains separate from bundled CuFe2O4 demo evidence unless explicitly tied to the current experiment.
7. Click `Prepare Notebook entry` and show the Notebook / Report handoff preview.
8. Open `/demo/agent` or `/notebook` to show how bounded evidence becomes a decision path and report-ready output in the deterministic demo.
9. Close by explaining the future Google path: Gemini for bounded reasoning, Cloud Run for analysis services, Vertex AI Search for retrieval, and MCP-style tools for inspectable workflow actions.
