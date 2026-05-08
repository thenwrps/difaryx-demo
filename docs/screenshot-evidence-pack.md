# DIFARYX Screenshot Evidence Pack

Use this pack for the locked primary demo path before recording or judging review.

## Capture Setup

- Viewport: `1440x900` or `1600x900`; the compact capture also supports a smaller PC browser height around `1280x720` when secondary sections stay collapsed.
- Start from `/dashboard` after any local demo sign-in.
- Primary record: `Exp-042: CuFe2O4 Spinel Phase Confirmation`.
- Scientific stance: condition-locked, validation-limited, report-ready for review only.

## Required Screenshots

1. **Dashboard + New Experiment**
   - Show the dashboard with `+ New Experiment` visible.
   - Open the modal and capture the stepper: `Project`, `Mode`, `Data`, `Conditions`, and `Review`.
   - Capture either Existing project setup or New project setup with project objective and technique scope.

2. **New Experiment Mode And Condition Lock**
   - Show the `Mode` step with Research, R&D, and Analytical setup fields.
   - Show the `Conditions` step with technique-aware condition presets.
   - Show the lock action: `Lock experiment conditions for this run`.
   - After locking, capture `Conditions locked` and `Locked by user`.
   - Capture at least one sample preparation, measurement, processing, and validation field.
   - Capture the `Review` step summary with condition lock status, claim boundary, and expected output.

3. **Agent Mode Condition Badge**
   - Open `/demo/agent`.
   - Capture the top bar with `CONDITIONS: Locked`.
   - Keep the graph and final interpretation area visible if possible.

4. **Agent Claim Boundary**
   - Open the Claim Boundary tab.
   - Capture `Experiment Condition Lock`.
   - Capture blocked claims: phase purity, publication-level phase claim, and surface oxidation-state assignment without reviewed XPS validation.

5. **Multi-Tech Workspace Upload Separation**
   - Open `/workspace/multi`.
   - Capture the Cross-Tech Evidence Review header, compact 2x2 evidence grid, interpretation / claim-boundary panel, and collapsed `Add supporting dataset` card.
   - Capture the warning that supporting uploads do not inherit synthesis, measurement, processing, or validation conditions unless explicitly tied to the current experiment record.

6. **Uploaded Signal Result**
   - Upload the sample CSV from `docs/demo-recording-checklist.md`.
   - Capture the plotted uploaded signal, evidence quality, detected reflections, and claim boundary.

7. **Notebook Experiment Conditions**
   - Open `/notebook`.
   - Capture the compact scientific record with Characterization Overview beside `Experiment Conditions` for Exp-042.
   - Visible text should include `Status: Locked · Validation-limited`, `Locked by user`, sample preparation, measurement, processing, and validation requirements.
   - Keep at least part of the refined discussion or report section preview visible below the overview / conditions row.
   - Keep `Full template...` and `Supplementary notebook record` collapsed for the primary screenshot.

8. **Report / Export Preview**
   - Capture the report/export preview.
   - Discussion should stay validation-limited and should not claim phase purity or publication-level readiness.

## Guardrail Review

Before final recording, check screenshots for these visible constraints:

- No `No condition lock` on the primary Exp-042 path.
- No phase-purity claim from XRD alone.
- No bulk-composition claim from XPS.
- No standalone structural proof from FTIR or Raman.
- No sample identity inferred without user-confirmed context.
- Uploaded runs remain separate from bundled CuFe2O4 demo evidence.

Preferred visible terms: `supports`, `requires validation`, `validation-limited`, `locked by user`, `condition-limited`, and `not supported yet`.
