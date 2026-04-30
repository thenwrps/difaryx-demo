# Antigravity Handoff Plan

## Intent

Prepare Google Antigravity to understand the DIFARYX demo before extending it. The next agent should preserve the existing frontend demo, verify behavior first, and only then add a local structured runtime behind the current UI.

Do not start backend or cloud integration yet.

## Phase 1: Inspect And Verify Existing Demo

Goals:

- Read `AGENTS.md`, this plan, and the architecture notes.
- Inspect `src/App.tsx`, `src/pages/AgentDemo.tsx`, `src/data/demoProjects.ts`, `src/components/ui/Graph.tsx`, and `src/types/agent.ts`.
- Run `npm.cmd run build`.
- Start the dev server only if visual verification is needed.
- Walk the core route path: `/login` -> `/dashboard` -> `/demo/agent` -> `/notebook` -> `/history`.
- Confirm graphs render in dashboard, workspaces, multi-tech hub, and agent run.
- Confirm final agent output includes decision, confidence, evidence, caveats, and next action.

Do not:

- Rewrite pages.
- Change routing.
- Remove graph components.
- Hide graph areas during agent execution.
- Add dependencies.
- Start a backend.

## Phase 2: Create Local Structured Agent Runtime

Goal:

Create a client-side structured runtime under `src/agent/` that mirrors the existing deterministic demo behavior.

Recommended future modules:

- `planner`: convert a goal and selected datasets into narrative steps.
- `executor`: run deterministic local technique actions.
- `technique tools`: local XRD, XPS, FTIR, and Raman adapters over existing demo data.
- `evidence fusion`: combine evidence with confidence and caveats.
- `decision generation`: produce decision, confidence label, recommendations, and report status.
- `memory/provenance`: create typed records compatible with `src/types/agent.ts`.

Constraints:

- Use existing data helpers first.
- Keep outputs deterministic.
- Keep all runtime work local in the browser.
- Do not add new dependencies without approval.
- Do not introduce backend calls.

## Phase 3: Bind AgentDemo To Runtime

Goal:

Replace only the internal agent result construction in `src/pages/AgentDemo.tsx` with the local structured runtime while preserving visible behavior.

Expected behavior to preserve:

- Default goal remains the same.
- Dataset selection remains visible and stable.
- Graphs remain visible during the run.
- Timeline/logs still progress through the scientific story.
- Final result still contains decision, confidence, evidence, caveats, and report actions.
- Notebook attachment continues to work through existing localStorage behavior.

Suggested acceptance checks:

- Existing demo flow still works in 60-90 seconds.
- `npm.cmd run build` passes.
- No routes changed.
- No product page rewrites.

## Phase 4: Prepare MCP / Google Cloud Integration Later

Goal:

Design integration boundaries only after the local structured runtime is stable.

Future preparation can include:

- Adapter interfaces for external tool execution.
- MCP tool boundary notes.
- Google Cloud storage or execution design notes.
- Authentication and project-level data model notes.
- Failure/retry/provenance requirements for scientific traceability.

Do not implement backend, MCP, or Google Cloud integration in this phase unless the user explicitly requests it.

## Recommended Next Task For Antigravity

Start with Phase 1. Confirm the current deterministic demo behavior, then propose a narrow Phase 2 patch that adds local runtime modules without changing routes, UI behavior, or dependencies.
