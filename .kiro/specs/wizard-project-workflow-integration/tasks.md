# Implementation Plan: Wizard Project Workflow Integration

## Overview

Surgical, additive changes across four files to connect wizard-created projects to the DIFARYX dashboard, notebook sidebar, and history views. No new routes, no new dependencies, no rewrites. Implementation follows the order defined in the design: data layer first, then wizard handoff, then dashboard fix, then sidebar integration.

## Tasks

- [ ] 1. Extend the data layer in `demoProjects.ts`
  - [ ] 1.1 Add `WorkflowStatus` type and `workflowStatus` field to `ProjectNotebook`
    - Add `export type WorkflowStatus = 'setup_ready' | 'evidence_ready'` before the `ProjectNotebook` interface
    - Add `workflowStatus: WorkflowStatus` as a required field on `ProjectNotebook`
    - _Requirements: 1.1, 1.2, 2.3_

  - [ ] 1.2 Add `WizardHistoryEntry` interface and `LOCAL_WIZARD_HISTORY_KEY` constant
    - Add `export interface WizardHistoryEntry` with fields: `id`, `notebookId`, `projectTitle`, `mode`, `workflowStatus`, `date`, `action: 'notebook'`
    - Add `const LOCAL_WIZARD_HISTORY_KEY = 'difaryx-wizard-history'` alongside the other key constants
    - _Requirements: 5.1, 5.2_

  - [ ] 1.3 Update `saveProjectNotebook` to compute and persist `workflowStatus`
    - Compute `hasEvidence` from `initialDataImport` (not skipped and has ≥1 file)
    - Set `workflowStatus` to `'evidence_ready'` when `hasEvidence` is true, otherwise `'setup_ready'`
    - Ensure the function returns the saved `ProjectNotebook` entity (needed by the wizard handoff)
    - _Requirements: 1.1, 1.2, 1.3, 2.3, 6.1_

  - [ ] 1.4 Add `saveWizardHistoryEntry` and `getWizardHistoryEntries` functions
    - `getWizardHistoryEntries` reads from `LOCAL_WIZARD_HISTORY_KEY` using `readLocalList`
    - `saveWizardHistoryEntry` builds a `WizardHistoryEntry` from the saved `ProjectNotebook` and appends it via `writeLocalList`
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ] 1.5 Extend `getAllHistoryEntries` to merge wizard history entries
    - After building `demoEntries`, call `getWizardHistoryEntries()` and map each entry to the same shape used by demo entries (same fields: `id`, `run`, `technique`, `claimStatus`, `status`, `date`, `action`, `projectId`, `projectName`, `workspacePath`, `notebookPath`, `agentPath`)
    - Return `[...demoEntries, ...wizardEntries]`
    - _Requirements: 5.3, 5.5, 7.1_

- [ ] 2. Wire wizard completion to history persistence in `ProjectNotebookWizard.tsx`
  - [ ] 2.1 Call `saveWizardHistoryEntry` after `saveProjectNotebook` in `handleCreate`
    - Capture the return value of `saveProjectNotebook(...)` as `savedNotebook`
    - Call `saveWizardHistoryEntry(savedNotebook)` immediately after
    - Import `saveWizardHistoryEntry` from `demoProjects.ts`
    - _Requirements: 1.1, 5.1, 5.2_

- [ ] 3. Fix dashboard card rendering in `Dashboard.tsx`
  - [ ] 3.1 Replace status label logic with `workflowStatus`-based label and color
    - Remove the `setupComplete` / `isNotebookSetupComplete` call used for the status label
    - Set `statusLabel` to `'Evidence ready'` when `notebook.workflowStatus === 'evidence_ready'`, otherwise `'Setup ready'`
    - Set `statusColor` to `'text-primary'` for `evidence_ready`, `'text-amber-600'` otherwise
    - Handle `workflowStatus` being `undefined` on old records (falls back to `'Setup ready'` naturally)
    - _Requirements: 2.1, 2.3, 9 (backward compat)_

  - [ ] 3.2 Fix card `onClick` to navigate to the notebook view
    - Replace the dead `onClick` ("Project Notebook workspace coming soon") with `navigate(\`/notebook?project=\${notebook.id}\`)`
    - Confirm `useNavigate` is already imported; add it if not
    - _Requirements: 2.6, 3.1_

  - [ ] 3.3 Replace "Open Setup" button with an "Open" link to the notebook
    - Replace the existing "Open Setup" button/link with a `<Link to={\`/notebook?project=\${notebook.id}\`}>Open</Link>`
    - Add `onClick={(e) => e.stopPropagation()}` to prevent double-navigation
    - Keep the same button styling (border, primary color, xs font)
    - _Requirements: 2.6, 3.1_

- [ ] 4. Add wizard notebooks to the NotebookLab sidebar in `NotebookLab.tsx`
  - [ ] 4.1 Load wizard notebooks from localStorage into component state
    - Import `getLocalProjectNotebooks` from `demoProjects.ts` (already exported)
    - Add `const [wizardNotebooks, setWizardNotebooks] = useState(() => getLocalProjectNotebooks())`
    - _Requirements: 4.1, 4.5_

  - [ ] 4.2 Render wizard notebook entries in the sidebar list
    - After the existing `localExperiments` sidebar section, map over `wizardNotebooks`
    - Each entry is a `<Link to={\`/notebook?project=\${nb.id}\`}>` showing `nb.title` and a workflow status sub-label
    - Apply active highlight when `nb.id === searchParams.get('project')`
    - Status sub-label: `'Evidence ready'` (primary color) when `nb.workflowStatus === 'evidence_ready'`, otherwise `'Setup ready'` (amber)
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 5. Checkpoint — verify build passes
  - Run `npm.cmd run build` and confirm zero TypeScript errors.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- No property-based tests are included — the design has no Correctness Properties section; this feature is UI/localStorage wiring with no algorithmic invariants to test
- All changes are additive; rollback is straightforward (revert the four files)
- Backward compatibility: `workflowStatus` being `undefined` on old `ProjectNotebook` records falls back to `'Setup ready'` in all display logic — no migration needed
- The notebook body for wizard projects falls back to the default demo content for MVP (acceptable per design §6)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5", "2.1"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2"] }
  ]
}
```
