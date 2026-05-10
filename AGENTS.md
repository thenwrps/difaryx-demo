# DIFARYX Agent Handoff Guide

## Project Purpose

DIFARYX is an autonomous scientific workflow intelligence system for experimental R&D.

The current application is a deterministic frontend implementation that demonstrates how DIFARYX helps researchers move from a research objective to evidence-grounded scientific decisions. It shows how an agentic workflow can plan, execute, inspect experimental evidence, reason over uncertainty, identify validation gaps, recommend the next experiment or decision, and preserve the result as reproducible scientific memory.

DIFARYX is not only a graph viewer, not only an XRD tool, and not only a materials characterization dashboard. XRD, XPS, FTIR, and Raman are used as the current proof objects for demonstrating the core product logic: evidence-linked scientific reasoning across experimental workflows.

Core workflow narrative:

Research Objective -> Experimental Setup / Context -> Evidence Workspace -> Agent Reasoning -> Validation Gap -> Next Experiment / Decision -> Notebook Memory / Report

Compact product narrative:

Goal -> Plan -> Execute -> Evidence -> Reason -> Decision -> Report

## Important Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page for the DIFARYX concept, scientific workflow story, and product positioning. |
| `/login` | Demo sign-in surface; continues into the local dashboard without a real auth backend. |
| `/dashboard` | Main project dashboard with demo projects, readiness, graph previews, scientific workflow status, and agent entry points. |
| `/demo/agent` | Autonomous scientific agent demo with research objective input, selected datasets, live graph view, execution log, evidence review, reasoning trace, validation gap, next decision, and report handoff. |
| `/workspace/xrd` | Evidence workspace for XRD graph review, processing controls, feature detection, phase-related evidence, provenance saving, and exports. |
| `/workspace/xps` | Evidence workspace for XPS graph review, background/subtract controls, surface-state evidence, fitting-style evidence, provenance saving, and exports. |
| `/workspace/ftir` | Evidence workspace for FTIR graph review, baseline adjustment, band evidence, bonding / functional group context, provenance saving, and exports. |
| `/workspace/raman` | Evidence workspace for Raman graph review, mode assignment evidence, local symmetry / vibrational fingerprint context, provenance saving, and exports. |
| `/workspace/multi` | Multi-tech evidence hub for combined XRD, XPS, FTIR, and Raman evidence fusion, consistency checking, and validation-gap review. |
| `/notebook` | Notebook / scientific memory surface with generated decision, evidence summary, interpretation, caveats, validation gaps, provenance, and report exports. |
| `/history` | Agent and workspace provenance history for previous deterministic demo runs, evidence states, decisions, and notebook handoffs. |
| `/settings` | Demo settings for profile, local data handling, exports, reasoning preferences, and deterministic demo behavior. |

## Safety Rules

- Do not rewrite the whole app.
- Do not reframe DIFARYX as only an XRD tool, spectra viewer, or materials dashboard.
- Do not remove graph components.
- Do not hide the graph during agent run.
- Do not collapse the final result into only "Complete".
- Preserve the scientific reasoning chain: objective, context, evidence, reasoning, gap, decision, notebook/report.
- Keep demo deterministic.
- No backend unless explicitly requested.
- No new dependencies without approval.
- Do not change routing unless explicitly requested.
- Do not change package dependencies during handoff prep.
- Preserve existing source files and localStorage demo behavior.
- Preserve graph-first evidence flow before adding integrations.
- Preserve DIFARYX as the core scientific workflow intelligence system.

## Build And Run Commands

```powershell
npm run dev
npm.cmd run build