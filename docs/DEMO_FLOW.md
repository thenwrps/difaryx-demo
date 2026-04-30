# DIFARYX Demo Flow

## 60-90 Second Recording Flow

Use this path when recording the handoff demo:

1. Open `/login`.
2. Click `Continue as Guest / Demo Researcher`.
3. On `/dashboard`, point out the DIFARYX Scientific Agent panel, project readiness, graph previews, and the `Run Autonomous Agent` button.
4. Click `Run Autonomous Agent`.
5. On `/demo/agent`, keep the default goal and selected datasets.
6. Click `Run Agent`.
7. While the run executes, show the live graph area, agent timeline, execution log, evidence collection, and changing state labels.
8. When complete, show the final decision, confidence score, key evidence, caveats, and report/notebook actions.
9. Click `Attach to Notebook` or open `/notebook` to show the report-ready trace.
10. Optionally open `/history` to show deterministic agent memory and provenance.

The spoken story should follow:

Goal -> Plan -> Execute -> Evidence -> Reason -> Decision -> Report

## Click Path

Primary path:

`/login` -> `Continue as Guest / Demo Researcher` -> `/dashboard` -> `Run Autonomous Agent` -> `/demo/agent` -> `Run Agent` -> `Attach to Notebook` -> `/notebook`

Optional supporting path:

`/dashboard` -> project card `Open Workspace` -> `/workspace/xrd` -> `Detect Peaks` -> `Match Phase` -> `Save Evidence` -> `Run Agent`

Optional multi-tech path:

`/dashboard` -> `/workspace/multi?project=cufe2o4-sba15` -> inspect XRD/XPS/FTIR/Raman cards -> `Run Agent`

## Expected Visible Output

| Page | Expected output |
| --- | --- |
| `/` | DIFARYX landing page with navigation, hero story, problem, solution, techniques, workflow, roadmap, CTA, and footer. |
| `/login` | DIFARYX sign-in card with Google, email, create account, and guest/demo researcher options. |
| `/dashboard` | Project Dashboard with DIFARYX Scientific Agent panel, goal input, mode selector, readiness badges, project cards, graph previews, and workspace/notebook/agent links. |
| `/demo/agent` | Three-column agent surface: goal/dataset controls, evidence graphs, execution log, agent timeline, evidence summary, and final decision panel. During a run, the graph area must remain visible. |
| `/workspace/xrd` | XRD workspace with spectrum graph, processing controls, feature table, evidence and insight panel, metadata, processing log, and saved runs. |
| `/workspace/xps` | XPS workspace with spectrum graph, XPS-specific controls, feature/evidence output, metadata, processing log, and saved runs. |
| `/workspace/ftir` | FTIR workspace with spectrum graph, baseline adjustment controls, feature/evidence output, metadata, processing log, and saved runs. |
| `/workspace/raman` | Raman workspace with spectrum graph, mode assignment controls, feature/evidence output, metadata, processing log, and saved runs. |
| `/workspace/multi` | Multi-Tech Hub with XRD/XPS/FTIR/Raman graph cards, processing controls, evidence fusion summary, selected datasets, and combined confidence. |
| `/notebook` | Notebook/report view with attached agent run, evidence summary, scientific interpretation, decision statement, provenance, caveats, next steps, and export actions. |
| `/history` | Agent Run History with deterministic run cards, confidence/status metadata, action links, and workspace provenance entries. |
| `/settings` | Demo settings cards for profile, data handling, export preferences, AI reasoning, and simulated connected accounts. |

## QA Checklist Before Recording

- `npm.cmd run build` completes successfully.
- `/login` can enter the dashboard through guest/demo mode.
- `/dashboard` shows project cards and graph previews.
- `/demo/agent` loads with the default scientific goal and selected datasets.
- Clicking `Run Agent` shows visible progress through planning, execution, evidence fusion, reasoning, decision, and completion.
- Graph components stay visible during the agent run.
- Final result includes a decision, confidence, key evidence, caveats, and next action, not only a generic "Complete" state.
- `/workspace/xrd`, `/workspace/xps`, `/workspace/ftir`, `/workspace/raman`, and `/workspace/multi` load graphs.
- `/notebook` shows the report/provenance story.
- `/history` shows prior deterministic agent runs.
- No backend or cloud service is required for the recording.
- Demo content remains deterministic across refreshes except intentional localStorage actions such as saved evidence or demo profile.
