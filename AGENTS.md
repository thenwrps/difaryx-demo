# DIFARYX Agent Handoff Guide

## Project Purpose

DIFARYX is an autonomous scientific agent demo for materials characterization workflows. The current app is a deterministic frontend demo that shows how a scientific agent can plan, execute, collect evidence, reason over uncertainty, make a decision, and prepare a report from bundled characterization data.

Core narrative:

Goal -> Plan -> Execute -> Evidence -> Reason -> Decision -> Report

## Important Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page for the DIFARYX concept and workflow story. |
| `/login` | Demo sign-in surface; continues into the local dashboard without a real auth backend. |
| `/dashboard` | Main project dashboard with demo projects, readiness, graph previews, and agent entry points. |
| `/demo/agent` | Autonomous agent demo with goal input, selected datasets, live graph view, execution log, evidence, reasoning, and final decision. |
| `/workspace/xrd` | Technique workspace for XRD graph review, processing controls, feature detection, evidence saving, and exports. |
| `/workspace/xps` | Technique workspace for XPS graph review, background/subtract controls, fitting-style evidence, and exports. |
| `/workspace/ftir` | Technique workspace for FTIR graph review, baseline adjustment, band evidence, and exports. |
| `/workspace/raman` | Technique workspace for Raman graph review, mode assignment evidence, and exports. |
| `/workspace/multi` | Multi-tech hub for combined XRD, XPS, FTIR, and Raman evidence fusion. |
| `/notebook` | Notebook/report surface with generated decision, evidence summary, caveats, provenance, and exports. |
| `/history` | Agent and workspace provenance history for previous deterministic demo runs. |
| `/settings` | Demo settings for profile, local data handling, exports, and reasoning preferences. |

## Safety Rules

- Do not rewrite the whole app.
- Do not remove graph components.
- Do not hide the graph during agent run.
- Do not collapse the final result into only "Complete".
- Keep demo deterministic.
- No backend unless explicitly requested.
- No new dependencies without approval.
- Do not change routing unless explicitly requested.
- Do not change package dependencies during handoff prep.
- Preserve existing source files and localStorage demo behavior.

## Build And Run Commands

```powershell
npm run dev
npm.cmd run build
```

## Current Implementation Notes

- This is a Vite React SPA using React Router.
- Demo data and local persistence helpers live in `src/data/demoProjects.ts`.
- Agent type shapes live in `src/types/agent.ts`.
- Graph rendering lives in `src/components/ui/Graph.tsx` and is used across dashboard, workspaces, multi-tech hub, and agent run views.
- The current demo is client-side and deterministic. Any future runtime should preserve the visible story and graph-first evidence flow before adding integrations.
