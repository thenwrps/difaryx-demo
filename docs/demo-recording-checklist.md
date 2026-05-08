# DIFARYX 2-Minute Demo Recording Checklist

Use this checklist for the Google AI Challenge / Google Cloud Rapid Agent Hackathon recording. The recommended viewport is `1440x900` or `1600x900`; the compact layout is also tuned for a smaller PC browser height around `1280x720` when secondary sections stay collapsed.

## Final Commands Before Recording

```powershell
npm.cmd run build
npm.cmd run smoke:upload-beta
git diff --check
```

## Sample CSV

Save this as `public-beta-xrd.csv` before recording:

```csv
two_theta,intensity
20,12
25,18
30,55
35,21
40,80
45,24
50,16
```

Optional invalid-state fixture:

```csv
sample,note
A,not numeric
B,still not numeric
```

## Exact Route Order

1. `/` or `/dashboard`
2. Open `New Experiment` and point out the Experiment Conditions step
3. `/demo/agent`
4. Open the Claim Boundary tab
5. `/workspace/multi`
6. Upload `public-beta-xrd.csv`
7. Confirm technique, column mapping, and locked context
8. Show evidence quality, detected reflections, condition status, and claim boundary
9. Show Notebook / Report handoff preview
10. `/notebook`

If starting from a fresh browser profile, open `/login` first and continue into the local dashboard.

## Expected Visible Checkpoints

- `/workspace/multi` loads without a white screen.
- Existing multi-technique workspace content remains visible.
- XRD, XPS, FTIR, and Raman appear in the evidence matrix.
- `Add supporting dataset` appears as a compact public-beta upload card, not the whole page.
- The supporting upload card is collapsed by default and shows `No file selected`, condition status, gate status, and `Upload action`.
- New Experiment exposes an `Experiment Conditions` section with sample preparation, measurement, processing, and validation groups.
- `Lock experiment conditions for this run` records the condition status before experiment creation.
- After locking, the modal shows `Conditions locked` and `Locked by user`.
- Agent Mode top bar shows `CONDITIONS: Locked · Validation-limited` for the primary Exp-042 demo path.
- Agent Claim Boundary shows Experiment Condition Lock, blocked claims, and the validation requirements.
- `No file selected` appears before upload.
- After upload, `public-beta-xrd.csv` appears as the selected file.
- Technique is set to `XRD`.
- Column mapping uses numeric column 1 as X and numeric column 2 as Y.
- Sample identity is user-entered before analysis.
- Locked context preview appears.
- Experiment condition awareness appears without silently attaching conditions to unrelated uploads.
- Uploaded signal plot renders with readable axes.
- `Detected reflections` appears.
- Evidence quality appears and reaches `Ready` for the sample CSV.
- Claim boundary appears and keeps XRD phase evidence validation-limited.
- Notebook / Report handoff preview appears.
- Notebook Lab shows `Experiment Conditions` with `Status: Locked · Validation-limited`, `Locked by user`, measurement, processing, and validation requirements for Exp-042.
- Notebook Lab top viewport shows Characterization Overview beside Experiment Conditions, with Refined Discussion and Report Section Preview immediately below.
- Uploaded run remains separate from bundled CuFe2O4 demo evidence.

## Scientific Wording Checks

Confirm visible uploaded-run language stays bounded:

- Uses terms such as `supports`, `cannot establish`, `requires validation`, `evidence-limited`, or `reference validation pending`.
- Does not claim phase purity from XRD alone.
- Does not infer sample identity without user-confirmed context.
- Does not infer synthesis, measurement, processing, or validation conditions without a user-locked condition record.
- Does not mix uploaded signal output with bundled CuFe2O4 demo evidence.
- Avoids stronger language that states proof, final identity, or phase-purity certainty.

## 2-Minute Narration Outline

**0:00 - Landing Or Dashboard**

"DIFARYX is a scientific reasoning platform that connects experimental signals to bounded decisions and report-ready outputs."

**0:15 - Multi-Tech Workspace**

"The workspace is multi-technique, covering XRD, XPS, FTIR, and Raman. Each technique has an evidence role and a claim boundary."

**0:30 - New Experiment Condition Lock**

"Before interpretation, New Experiment can lock user-provided sample preparation, measurement, processing, and validation conditions for reproducibility."

**0:45 - Agent Mode Condition Boundary**

"Agent Mode carries that lock forward. The condition badge and claim boundary keep interpretation validation-limited until refinement, replicate, and cross-technique evidence are reviewed."

**1:00 - Upload Sample CSV**

"For the public beta upload path, I can bring in a local signal file. This demo uses a small XRD-like CSV with two numeric columns."

**1:15 - Technique, Mapping, And Locked Context**

"DIFARYX maps the numeric columns, lets the user confirm technique and sample identity, and treats that source context as locked. Supporting uploads only use experiment conditions when explicitly tied to the current experiment."

**1:35 - Evidence Quality And Claim Boundary**

"The system plots the uploaded signal, extracts deterministic reflections, applies an evidence quality gate, and shows XRD and condition boundaries before any handoff."

**1:45 - Notebook / Report Handoff**

"The handoff preview packages file name, technique, locked context, condition status, extracted features, evidence quality, limitations, and claim boundary for Notebook or Report review."

**1:50 - Close**

"DIFARYX turns experimental signals into evidence-linked scientific decisions and report-ready outputs, while preserving validation boundaries."

## Recording Fallback

If the browser file picker fails during recording:

1. Stay on `/workspace/multi`.
2. Explain that the local upload path is covered by `npm.cmd run smoke:upload-beta`.
3. Show the public-beta upload section and its required context fields.
4. Run or mention the smoke test coverage:
   - valid CSV parsing
   - invalid nonnumeric fixture handling
   - XRD bounded claim boundary
   - no CuFe2O4 assumption injection
   - localStorage cap and corrupted storage safety
   - forbidden upload wording guardrails
5. Continue to the existing multi-technique matrix and Notebook / Report preview narrative.

## Manual QA Pass Before Recording

- Use a desktop viewport such as `1440x900`.
- Confirm no horizontal overflow in `/workspace/multi`.
- Confirm status chips wrap cleanly.
- Cross-Tech capture: frame the compact evidence review with the interpretation panel and collapsed supporting upload card.
- Expand the supporting upload card only when demonstrating file selection, mapping, feature extraction, or handoff preview.
- Notebook capture: keep `Full template...` and `Supplementary notebook record` collapsed to frame overview, experiment conditions, refined discussion, and report preview together.
- Confirm the graph is not cramped.
- Confirm the claim boundary is visible near the evidence quality and feature table.
- Confirm the invalid fixture shows a blocked state and does not prepare a handoff.
- Confirm Agent Mode and Notebook Lab show Exp-042 as condition-locked and validation-limited.
