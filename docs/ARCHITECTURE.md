# DIFARYX Architecture

## App Shape

DIFARYX is a Vite React single-page app. Routing is declared in `src/App.tsx` with React Router. Most authenticated/demo product pages share `DashboardLayout`; the landing page and login page use standalone layouts.

## Main Pages

| Page file | Route(s) | Responsibility |
| --- | --- | --- |
| `src/pages/Landing.tsx` | `/` | Public marketing/story surface composed from landing sections. |
| `src/pages/SignIn.tsx` | `/login` | Simulated demo auth and local profile setup. |
| `src/pages/Dashboard.tsx` | `/dashboard` | Project overview, graph previews, agent entry points, and experiment modal access. |
| `src/pages/AgentDemo.tsx` | `/demo/agent` | Deterministic autonomous agent run UI: goal, plan, execution, graphs, evidence, reasoning, decision, report actions. |
| `src/pages/TechniqueWorkspace.tsx` | `/workspace/:technique` | XRD, XPS, FTIR, and Raman workspaces with graph processing, feature detection, evidence saving, and exports. |
| `src/pages/MultiTechWorkspace.tsx` | `/workspace/multi` | Multi-tech evidence hub across project techniques and fused confidence. |
| `src/pages/NotebookLab.tsx` | `/notebook` | Notebook/report view, attached runs, observations, provenance, and exports. |
| `src/pages/History.tsx` | `/history` | Deterministic agent history and workspace provenance entries. |
| `src/pages/Settings.tsx` | `/settings` | Demo profile, local data handling, export, AI reasoning, and account settings. |

## Shared Layout

`src/components/layout/DashboardLayout.tsx` owns the product shell:

- Collapsible sidebar navigation.
- Topbar search/profile controls.
- Route links for dashboard, workspaces, notebook, agent mode, history, and settings.
- Sign-out behavior via demo localStorage keys.

Shared UI primitives and reusable product elements live under:

- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Graph.tsx`
- `src/components/ui/AIInsightPanel.tsx`
- `src/components/workspace/ExperimentModal.tsx`

## Data And Demo Structure

Primary demo state lives in `src/data/demoProjects.ts`.

It defines:

- Project metadata and bundled project list.
- Technique names: `XRD`, `XPS`, `FTIR`, `Raman`.
- Demo datasets, spectra, peaks/features, evidence, experiments, processing runs, and agent run results.
- Helpers for route generation, project lookup, technique normalization, confidence calculation, evidence generation, notebook section generation, and localStorage persistence.

Important localStorage-backed demo areas:

- Local experiments.
- Local datasets.
- Processing runs.
- Saved evidence.
- Latest saved agent run by project.

Supporting scientific/demo code also exists in:

- `src/data/syntheticTraces.ts`
- `src/scientific/*`
- `src/utils/demoExport.ts`

These should be treated as supporting demo/scientific utilities unless a future task explicitly asks to connect them to a new runtime path.

## Agent Types

Future structured agent runtime types are currently defined in `src/types/agent.ts`:

- `DatasetRef`: references a project dataset and technique.
- `Evidence`: links a claim to a dataset, support text, confidence, and limitations.
- `AgentStep`: represents one narrative stage with status, summary, timestamps, and evidence links.
- `AgentRun`: full run record with goal, datasets, steps, evidence, decision, confidence, report status, and timestamps.

`AgentStep.narrativeStage` already encodes the intended narrative:

Goal -> Plan -> Execute -> Evidence -> Reason -> Decision -> Report

## Responsibility Map

| Responsibility | Current location |
| --- | --- |
| Routing | `src/App.tsx` |
| Shared app shell | `src/components/layout/DashboardLayout.tsx` |
| Graph rendering | `src/components/ui/Graph.tsx` |
| Project/demo data | `src/data/demoProjects.ts` |
| Workspace processing UI | `src/pages/TechniqueWorkspace.tsx` |
| Multi-tech fusion UI | `src/pages/MultiTechWorkspace.tsx` |
| Agent run UI | `src/pages/AgentDemo.tsx` |
| Agent result construction | `buildAgentRun`, `getTechniqueEvidence`, and `calculateDemoConfidence` in `src/data/demoProjects.ts` |
| Report/notebook UI | `src/pages/NotebookLab.tsx` |
| Export scaffolding | `src/utils/demoExport.ts` |
| History/provenance UI | `src/pages/History.tsx` |
| Runtime type definitions | `src/types/agent.ts` |
| Future runtime placeholder | `src/agent/README.md` |

## Backend Note

The handoff target should treat the current product demo as frontend-first. Do not start, expand, or depend on backend/cloud integration unless the user explicitly requests it.
