# DIFARYX Agent Runtime Placeholder

This directory is reserved for a future local structured agent runtime.

No runtime code lives here yet. The current demo behavior remains in `src/pages/AgentDemo.tsx` and `src/data/demoProjects.ts`.

Future modules may include:

- `planner`: build the Goal -> Plan -> Execute -> Evidence -> Reason -> Decision -> Report step plan.
- `executor`: run deterministic local workflow steps.
- `technique tools`: wrap existing XRD, XPS, FTIR, and Raman demo evidence helpers.
- `evidence fusion`: combine technique evidence, confidence, caveats, and limitations.
- `decision generation`: produce final scientific decision, confidence label, recommendations, and report status.
- `memory/provenance`: preserve typed run records, dataset references, timestamps, and evidence links.

Keep this runtime local and deterministic until backend, MCP, or Google Cloud work is explicitly requested.
