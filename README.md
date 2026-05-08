# DIFARYX

DIFARYX turns experimental characterization signals into evidence-linked scientific reasoning, bounded decisions, and report-ready outputs. The current repository is a deterministic frontend demo for materials characterization workflows, with an XRD workspace, a multi-technique workspace, Agent Mode, Notebook Lab, History, Settings, New Experiment condition locking, and a public-beta uploaded-signal workflow for XRD, XPS, FTIR, and Raman.

## Why This Matters

Scientific teams often move from raw instrument output to discussion text through fragmented manual steps. DIFARYX focuses on the gap between signal inspection and defensible scientific decisions:

- Experimental data is spread across files, instruments, and technique-specific tools.
- Interpretation often requires manual comparison across XRD, XPS, FTIR, Raman, and supporting context.
- Traceability from signal feature to claim, limitation, and report text is weak.
- AI-generated scientific text can overstate what the evidence supports.
- Moving from processing result to notebook discussion or report section is slow and inconsistent.

DIFARYX treats each signal-derived observation as evidence with provenance, evidence quality, and claim boundaries before it is handed to an agent, notebook, or report surface.

## Core Workflow

Primary reviewer story:

`Signal -> Compute -> Reason -> Literature / Validation -> Decision -> Report`

Current internal handoff model:

`ProcessingResult -> AgentDiscussionRefinement -> NotebookEntry -> ReportSection`

New Experiment records add a reproducibility layer before interpretation handoff:

`Locked Scientific Context + Experiment Condition Lock -> Evidence Quality Gate -> Claim Boundary -> Notebook / Report`

The current demo uses local deterministic logic for processing, reasoning states, notebook previews, and report handoff. The literature and validation stage is represented as bounded workflow language and validation-pending claim boundaries; live literature retrieval and backend validation services are future integration points.

## Current Demo Routes

| Route | What reviewers should see |
| --- | --- |
| `/` | Public DIFARYX concept page and workflow story. |
| `/dashboard` | Product overview with demo projects, readiness, graph previews, agent entry points, and New Experiment creation. |
| `/workspace` | Workspace entry surface that routes reviewers into technique review. |
| `/workspace/xrd` | XRD graph review, processing controls, feature detection, evidence saving, and exports. |
| `/workspace/multi` | Multi-technique evidence hub, public-beta uploaded-signal workflow, and condition-lock handoff framing. |
| `/demo/agent` | Deterministic Agent Mode with goal, graph, execution log, evidence, reasoning, and decision. |
| `/notebook` | Notebook Lab with evidence summary, caveats, provenance, and report/export preview. |
| `/history` | Deterministic run history and workspace provenance. |
| `/settings` | Local demo settings for profile, data handling, export, and reasoning preferences. |

Additional technique routes exist for `/workspace/xps`, `/workspace/ftir`, and `/workspace/raman`.

## Multi-Technique Public Beta Upload Core

The `/workspace/multi` route supports uploaded experimental signal workflows for:

- XRD
- XPS
- FTIR
- Raman
- Unknown signal inspection

Supported local file types:

- `.csv`
- `.txt`
- `.xy`
- `.dat`

Workflow:

`Upload signal -> Select or detect technique -> Map columns -> Confirm scientific context -> Lock context -> Plot signal -> Extract technique-specific features -> Run evidence quality gate -> Generate claim boundary -> Send bounded result to Agent / Notebook / Report`

The upload beta accepts comma, tab, semicolon, and whitespace-delimited numeric data. It ignores empty lines and nonnumeric header/comment lines, defaults to the first numeric column as X and the second numeric column as Y, and allows X/Y column remapping before analysis.

Uploaded runs are stored only in the browser under `difaryx.uploadedSignalRuns.v1` when localStorage is available. Stored runs are capped and compacted for demo safety. If browser storage is unavailable or contains malformed saved data, the upload workflow remains usable in memory.

Supporting uploads do not silently inherit synthesis, measurement, processing, or validation conditions. If an uploaded run is tied to a current experiment, DIFARYX shows the available condition lock and keeps the condition boundary visible in the handoff preview.

## Experiment Condition Lock

The New Experiment flow now treats experiment conditions as a first-class locked record. Users can enter and lock:

- Sample preparation conditions: synthesis method, precursor ratio, solvent, pH, temperature/time, calcination temperature/time, atmosphere, and post-treatment.
- Measurement conditions: instrument, radiation/source, scan range, step size, scan rate, calibration reference, and acquisition mode.
- Processing conditions: baseline correction, smoothing, normalization, peak detection, fitting model, and reference database.
- Validation conditions: replicate requirement, reference validation requirement, cross-technique validation, refinement requirement, and whether publication-level claims are allowed after validation.

When the user clicks `Lock experiment conditions`, DIFARYX stores a local timestamped condition record with the experiment. Missing non-critical fields are preserved as incomplete rather than erased or inferred. The condition record then appears in Dashboard local experiment cards, `/workspace/multi` upload framing, Agent Mode claim-boundary context, Notebook Lab, and Notebook export previews.

Condition lock effects are intentionally conservative:

- Incomplete measurement conditions mark interpretation as measurement-limited.
- Incomplete processing conditions mark output as method-limited.
- Missing or restrictive validation conditions block publication-level claims.
- Refinement requirements block phase-purity claims until refinement evidence is attached.
- Required cross-technique evidence, such as XPS, blocks the corresponding surface or oxidation-state validation claim until that evidence is attached.

## Technique-Specific Claim Boundaries

| Technique | Evidence role | Boundary |
| --- | --- | --- |
| XRD | Crystal structure / phase evidence | Supports phase-evidence review, but does not make a phase purity claim without reference validation. |
| XPS | Surface composition / oxidation-state evidence | Surface-sensitive evidence only; it cannot establish bulk composition or bulk phase identity alone. |
| FTIR | Bonding / functional-group / support evidence | Provides qualitative bonding and functional-group context, not standalone structural assignment. |
| Raman | Vibrational fingerprint / local structure | Supports local vibrational or structural consistency, but does not replace crystallographic assignment. |
| Unknown | Generic signal inspection | Supports feature inspection only; no material-specific claim is generated. |

## Scientific Guardrails

- Uploaded runs remain separate from bundled CuFe2O4 demo evidence.
- Sample identity is not inferred without user-confirmed context.
- User-confirmed source context is treated as a locked scientific constraint.
- User-confirmed experiment conditions are treated as locked reproducibility constraints.
- Evidence quality gates run before interpretation handoff.
- Claim boundaries are generated before Notebook / Report preview.
- Condition boundaries are shown before Notebook / Report preview when an experiment condition record is available or pending.
- Unsupported or weak uploads produce a bounded blocked state instead of material-specific interpretation.
- Output language favors bounded terms such as "supports", "is consistent with", "requires validation", "evidence-limited", "context-confirmed", "reference validation pending", and "cannot establish".

The upload beta does not use live backend storage, live model execution, Google Scholar scraping, or licensed reference database integration.

## Notebook And Report Handoff

Notebook and report surfaces receive structured, bounded context rather than raw untracked conclusions. For uploaded signals, the handoff preview includes:

- File name
- Technique
- Sample identity
- Locked context
- Experiment condition status
- Extracted features
- Evidence quality
- Claim boundary
- Limitations

The current upload handoff is intentionally preview-based. It packages upload-derived signal evidence for the existing Notebook / Report flow without mixing in canonical demo evidence.

## Deterministic Demo Disclosure

This repository is a frontend demo. It uses deterministic local logic and bundled demo data so reviewers can replay the same workflow without a production backend, authentication service, cloud storage, or external API.

The uploaded-signal public beta is local-browser scoped. It demonstrates parsing, mapping, feature extraction, quality gating, claim boundaries, and handoff context, but it does not run live literature validation or production scientific reference matching.

## Future Google Cloud, Gemini, ADK, And MCP Path

DIFARYX is prepared for a future agentic architecture without requiring those services for the current demo:

- Gemini can support bounded reasoning and literature-grounded interpretation.
- Cloud Run can host analysis services for signal processing and evidence review.
- Vertex AI Search can support retrieval over literature, internal notebooks, SOPs, and validated knowledge bases.
- ADK-style orchestration can coordinate context, processing, analysis, retrieval, reasoning, decision, notebook, and report agents.
- MCP-style tools can expose signal analysis, evidence review, notebook generation, and report generation as inspectable capabilities.

The current demo keeps those integrations as an architecture path, not as implemented backend behavior.

## Run Locally

Install dependencies if needed:

```powershell
npm.cmd install
```

Start the local Vite app:

```powershell
npm.cmd run dev
```

Build the production bundle:

```powershell
npm.cmd run build
```

Run the upload beta smoke test:

```powershell
npm.cmd run smoke:upload-beta
```

Check diff hygiene:

```powershell
git diff --check
```

## Upload Beta Smoke Test

`npm.cmd run smoke:upload-beta` runs `test-upload-beta.mjs`, which validates:

- Valid CSV upload fixture parsing.
- Numeric X/Y arrays and XRD technique assignment.
- X/Y column mapping for plotting and feature extraction.
- XRD bounded claim boundary.
- No CuFe2O4 demo assumption injection into uploaded-run output.
- Invalid nonnumeric fixture handling without a crash.
- No ready-for-agent or report-ready state for invalid upload evidence.
- Persistence cap at 8 saved runs.
- Persisted signal point cap at 1200 points.
- Corrupted localStorage handling.
- Forbidden upload wording guardrails.

## Reviewer Notes

- DIFARYX is a scientific reasoning platform, not an XRD-only analyzer.
- The current demo is deterministic and frontend-only.
- The public-beta upload workflow is local-browser scoped.
- Scientific outputs are evidence-limited and require validation before stronger claims.
- INANZ, if discussed separately, is a separate product and is not a DIFARYX module.

## Submission Copy

Concise Google AI Challenge / Google Cloud Rapid Agent Hackathon copy is available in `docs/google-submission-copy.md`.
