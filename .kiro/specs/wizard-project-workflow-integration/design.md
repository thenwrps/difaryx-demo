# Wizard Project Workflow Integration — Technical Design

## Overview

The fix is minimal and surgical. The `ProjectNotebookWizard` already saves a `ProjectNotebook` to localStorage via `saveProjectNotebook()`. The problem is that the dashboard card for that notebook has a dead `onClick` ("Project Notebook workspace coming soon"), a misleading status label ("Setup required"), and no connection to the Notebook or History views.

This design adds:
1. A `workflowStatus` field to `ProjectNotebook` (two values only: `setup_ready` | `evidence_ready`)
2. A `saveWizardHistoryEntry()` function called on wizard completion
3. A `getWizardHistoryEntries()` function that reads from a new localStorage key
4. Updated dashboard card `onClick` → navigates to `/notebook?project={id}`
5. Updated status label logic on the dashboard card
6. NotebookLab sidebar reads wizard projects from localStorage and lists them
7. `getAllHistoryEntries()` extended to merge wizard history entries

No new routes. No new components. No new dependencies. No rewrites.

---

## Files to Modify

| File | Change |
|---|---|
| `src/data/demoProjects.ts` | Add `workflowStatus` to `ProjectNotebook` interface; update `saveProjectNotebook` to set it; add `saveWizardHistoryEntry` + `getWizardHistoryEntries`; extend `getAllHistoryEntries` |
| `src/pages/Dashboard.tsx` | Fix notebook card `onClick` to navigate; fix status label; fix "Open Setup" button |
| `src/pages/NotebookLab.tsx` | Add wizard projects to sidebar list |
| `src/pages/History.tsx` | No change needed — `getAllHistoryEntries` extension handles it |

---

## 1. Data Shape

### Extended `ProjectNotebook` interface

Add one field to the existing interface in `demoProjects.ts`:

```ts
export type WorkflowStatus = 'setup_ready' | 'evidence_ready';

export interface ProjectNotebook {
  id: string;
  title: string;
  objective: string;
  mode: NotebookMode;
  createdDate: string;
  lastUpdated: string;
  workflowStatus: WorkflowStatus;          // NEW
  setupFields?: Record<string, string>;
  initialDataImport?: {
    skipped: boolean;
    files: Array<{
      name: string;
      type: string;
      status: 'attached' | 'pending-parse';
    }>;
    destination: 'project' | 'first-row';
  };
}
```

`workflowStatus` is derived at save time:
- `evidence_ready` if `initialDataImport` exists, is not skipped, and has at least one file
- `setup_ready` otherwise

### Wizard History Entry shape

A new, separate interface stored under its own localStorage key:

```ts
export interface WizardHistoryEntry {
  id: string;
  notebookId: string;
  projectTitle: string;
  mode: NotebookMode;
  workflowStatus: WorkflowStatus;
  date: string;                  // ISO string
  action: 'notebook';
}
```

---

## 2. localStorage Key Strategy

Reuse the existing `LOCAL_PROJECT_NOTEBOOKS_KEY` (`difaryx-demo-project-notebooks`) for the notebook entity — no change needed there.

Add one new key for wizard history:

```ts
const LOCAL_WIZARD_HISTORY_KEY = 'difaryx-wizard-history';
```

This keeps wizard history separate from demo project history (which lives in the static `demoProjects` array) and avoids any risk of collision.

---

## 3. New / Updated Functions in `demoProjects.ts`

### Update `saveProjectNotebook`

Compute `workflowStatus` before saving:

```ts
export function saveProjectNotebook(notebook: Omit<ProjectNotebook, 'id' | 'createdDate' | 'lastUpdated' | 'workflowStatus'> & Partial<Pick<ProjectNotebook, 'id' | 'createdDate' | 'lastUpdated' | 'workflowStatus'>>) {
  const notebooks = getLocalProjectNotebooks();
  const now = new Date().toISOString();

  const hasEvidence =
    notebook.initialDataImport &&
    !notebook.initialDataImport.skipped &&
    notebook.initialDataImport.files.length > 0;

  const nextNotebook: ProjectNotebook = {
    ...notebook,
    id: notebook.id ?? makeId('notebook'),
    createdDate: notebook.createdDate ?? now,
    lastUpdated: notebook.lastUpdated ?? now,
    workflowStatus: notebook.workflowStatus ?? (hasEvidence ? 'evidence_ready' : 'setup_ready'),
  };

  writeLocalList(
    LOCAL_PROJECT_NOTEBOOKS_KEY,
    [...notebooks.filter((item) => item.id !== nextNotebook.id), nextNotebook],
  );
  return nextNotebook;
}
```

### Add `saveWizardHistoryEntry`

Called once from `ProjectNotebookWizard.handleCreate()` after `saveProjectNotebook` returns:

```ts
export function saveWizardHistoryEntry(notebook: ProjectNotebook) {
  const entries = getWizardHistoryEntries();
  const entry: WizardHistoryEntry = {
    id: makeId('whist'),
    notebookId: notebook.id,
    projectTitle: notebook.title,
    mode: notebook.mode,
    workflowStatus: notebook.workflowStatus,
    date: notebook.createdDate,
    action: 'notebook',
  };
  writeLocalList(LOCAL_WIZARD_HISTORY_KEY, [...entries, entry]);
}
```

### Add `getWizardHistoryEntries`

```ts
export function getWizardHistoryEntries(): WizardHistoryEntry[] {
  return readLocalList<WizardHistoryEntry>(LOCAL_WIZARD_HISTORY_KEY);
}
```

### Extend `getAllHistoryEntries`

The History page calls `getAllHistoryEntries()`. Extend it to append wizard entries:

```ts
export function getAllHistoryEntries() {
  const demoEntries = demoProjects.flatMap((project) =>
    project.history.map((entry) => ({
      ...entry,
      projectId: project.id,
      projectName: project.name,
      workspacePath: getWorkspacePath(project),
      notebookPath: getNotebookPath(project),
      agentPath: getAgentPath(project),
    })),
  );

  const wizardEntries = getWizardHistoryEntries().map((entry) => ({
    id: entry.id,
    run: `Workflow created: ${entry.projectTitle}`,
    technique: entry.mode === 'research' ? 'Research' : entry.mode === 'rd' ? 'R&D' : 'Analytical',
    claimStatus: 'partial' as ClaimStatus,
    status: entry.workflowStatus === 'evidence_ready' ? 'Evidence ready' : 'Setup ready',
    date: entry.date,
    action: 'notebook' as const,
    projectId: entry.notebookId,
    projectName: entry.projectTitle,
    workspacePath: `/notebook?project=${entry.notebookId}`,
    notebookPath: `/notebook?project=${entry.notebookId}`,
    agentPath: `/notebook?project=${entry.notebookId}`,
  }));

  return [...demoEntries, ...wizardEntries];
}
```

---

## 4. Wizard Submit Handoff

In `ProjectNotebookWizard.handleCreate()`, after `saveProjectNotebook(...)` returns the saved notebook, call `saveWizardHistoryEntry(savedNotebook)`:

```ts
const handleCreate = () => {
  // ... existing field assembly ...
  const savedNotebook = saveProjectNotebook({ ... });
  saveWizardHistoryEntry(savedNotebook);   // NEW — one history entry
  onCreated();
  handleClose();
};
```

`saveProjectNotebook` already returns the saved entity — no structural change needed.

---

## 5. Dashboard Card Fix

### Status label

Replace the current `statusLabel` logic:

```ts
// BEFORE
const statusLabel = setupComplete ? 'Ready for experiments' : 'Setup required';

// AFTER
const statusLabel =
  notebook.workflowStatus === 'evidence_ready' ? 'Evidence ready' : 'Setup ready';
const statusColor =
  notebook.workflowStatus === 'evidence_ready' ? 'text-primary' : 'text-amber-600';
```

Remove the `setupComplete` / `isNotebookSetupComplete` call for the status label — `workflowStatus` is the source of truth now.

### Card onClick and "Open Setup" button

Replace the dead `onClick` and "Open Setup" button with navigation to the notebook:

```tsx
// Card onClick
onClick={() => navigate(`/notebook?project=${notebook.id}`)}

// "Open Setup" button → "Open Notebook"
<Link
  to={`/notebook?project=${notebook.id}`}
  onClick={(e) => e.stopPropagation()}
  className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary/10 px-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
>
  Open
</Link>
```

The `useNavigate` hook is already imported in `Dashboard.tsx`.

---

## 6. NotebookLab Sidebar Integration

The sidebar currently lists `demoProjects` and `localExperiments`. Add wizard notebooks from `getLocalProjectNotebooks()`:

```tsx
// In NotebookLab.tsx — add to existing state
const [wizardNotebooks, setWizardNotebooks] = useState(() => getLocalProjectNotebooks());
```

Add to the sidebar list after `localExperiments`:

```tsx
{wizardNotebooks.map((nb) => (
  <Link
    key={nb.id}
    to={`/notebook?project=${nb.id}`}
    className={`block w-full text-left px-3 py-2 rounded-md text-xs font-medium leading-snug transition-colors border ${
      nb.id === searchParams.get('project')
        ? 'bg-primary/10 text-primary border-primary/20'
        : 'text-text-muted hover:bg-surface-hover hover:text-text-main border-transparent'
    }`}
  >
    <span>{nb.title}</span>
    <span className={`mt-1 block text-[10px] font-semibold ${
      nb.workflowStatus === 'evidence_ready' ? 'text-primary' : 'text-amber-600'
    }`}>
      {nb.workflowStatus === 'evidence_ready' ? 'Evidence ready' : 'Setup ready'}
    </span>
  </Link>
))}
```

The notebook view body already handles unknown project IDs gracefully via `getProject()` — it falls back to the default demo project. For wizard projects, `getProject()` will not find a match in `demoProjects` and will fall back. This is acceptable for MVP: the sidebar link navigates correctly, and the notebook body shows the default demo content. A future task can extend `getProject()` to also check wizard notebooks.

---

## 7. Status Mapping

| Condition | `workflowStatus` | Dashboard label | Color |
|---|---|---|---|
| No data files attached (skipped or empty) | `setup_ready` | Setup ready | amber |
| Data files attached (≥1 file, not skipped) | `evidence_ready` | Evidence ready | primary |

This is computed once at save time in `saveProjectNotebook`. No runtime recomputation needed.

---

## 8. Refresh Persistence

No new work required. Both `LOCAL_PROJECT_NOTEBOOKS_KEY` and `LOCAL_WIZARD_HISTORY_KEY` use the existing `readLocalList` / `writeLocalList` helpers which read/write `localStorage`. Data survives browser refresh by design.

Dashboard reads on mount via `useEffect`:
```ts
useEffect(() => {
  setLocalNotebooks(getLocalProjectNotebooks());
}, []);
```

This already exists and will pick up the `workflowStatus` field automatically once it is added to the saved entity.

---

## 9. Backward Compatibility

### Existing `ProjectNotebook` records without `workflowStatus`

Records saved before this change will not have `workflowStatus`. The dashboard status label must handle this:

```ts
const statusLabel =
  notebook.workflowStatus === 'evidence_ready' ? 'Evidence ready' : 'Setup ready';
```

If `workflowStatus` is `undefined`, this evaluates to `'Setup ready'` — correct fallback.

### Demo projects

`demoProjects` array is not touched. `getAllHistoryEntries` appends wizard entries after demo entries — demo entries are unaffected.

---

## 10. Risks and Rollback

| Risk | Mitigation |
|---|---|
| `workflowStatus` undefined on old records | Fallback to `'setup_ready'` in all display logic |
| `getAllHistoryEntries` merge breaks History page | Wizard entries use same shape as demo entries; History page renders them identically |
| NotebookLab body shows wrong content for wizard project | Acceptable for MVP — sidebar navigation works; body falls back to default demo content |
| `saveProjectNotebook` return value not used in wizard | Update `handleCreate` to capture return value before calling `saveWizardHistoryEntry` |
| localStorage quota exceeded | Existing `readLocalList` try/catch handles this; no new risk |

**Rollback**: All changes are additive. Removing `workflowStatus` from the interface and reverting the three function changes restores the previous behavior. No data migration needed.

---

## Implementation Order

1. `demoProjects.ts` — add `WorkflowStatus` type, `WizardHistoryEntry` interface, `workflowStatus` field, update `saveProjectNotebook`, add `saveWizardHistoryEntry`, add `getWizardHistoryEntries`, extend `getAllHistoryEntries`
2. `ProjectNotebookWizard.tsx` — call `saveWizardHistoryEntry` after `saveProjectNotebook`
3. `Dashboard.tsx` — fix status label, fix card `onClick`, fix "Open Setup" → "Open" link
4. `NotebookLab.tsx` — add wizard notebooks to sidebar
5. Run `npm.cmd run build` — verify no type errors
