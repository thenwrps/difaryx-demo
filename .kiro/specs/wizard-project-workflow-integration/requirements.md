# Wizard Project Workflow Integration — Requirements

## Introduction

The ProjectNotebookWizard creates dashboard cards that show "Setup required" and are disconnected from the DIFARYX workflow system. This spec defines the MVP fix: persist wizard-created projects as local workflow entities, render them correctly on the dashboard, and connect them to existing Notebook and History views using existing routes.

No backend. No new routes unless absolutely necessary. No new dependencies. No rewrite of existing components.

## Glossary

- **Wizard Project**: A project created through the ProjectNotebookWizard
- **Demo Project**: Pre-configured projects in the `demoProjects` array
- **Workflow Status**: A simple label reflecting where the project is in the DIFARYX pipeline
- **Workflow Mode**: Research, R&D, or Analytical Job — selected in the wizard
- **Context Fields**: Essential and advanced fields filled in during wizard setup

---

## Requirements

### Requirement 1: Stable Workflow Project Entity

**User Story:** As a researcher, I want wizard-created projects to be saved as stable local entities so they persist across browser refresh and can be opened from the dashboard.

#### Acceptance Criteria

1. On wizard completion, a workflow project entity MUST be created with a stable unique ID
2. The entity MUST store: title, objective, mode, setup fields, advanced context fields, data import status, workflow status, creation timestamp, and last updated timestamp
3. The entity MUST be saved to localStorage under a dedicated key (`difaryx-workflow-projects`)
4. The entity MUST survive browser refresh without data loss
5. The entity ID MUST be usable as a URL query parameter (e.g., `?project={id}`)

---

### Requirement 2: Dashboard Rendering

**User Story:** As a researcher, I want wizard-created projects to appear on the dashboard with a meaningful status so I can see what I created and open it.

#### Acceptance Criteria

1. Dashboard MUST load workflow projects from localStorage on mount
2. Each wizard project MUST render as a dashboard card with: title, mode badge, workflow status, and creation date
3. Workflow status MUST reflect actual state — not "Setup required":
   - No data attached → **"Setup ready"**
   - Data files attached → **"Evidence ready"**
4. Mode badge MUST reflect the selected mode: `WORKFLOW · RESEARCH`, `WORKFLOW · R&D`, or `WORKFLOW · ANALYTICAL`
5. The card MUST show a placeholder (not an error state) in the graph area
6. The card MUST have an "Open" action button that navigates to the notebook view for that project

---

### Requirement 3: Open Project from Dashboard

**User Story:** As a researcher, I want to click a wizard project card and open it so I can continue working on it.

#### Acceptance Criteria

1. Clicking "Open" on a wizard project card MUST navigate to `/notebook?project={id}`
2. The notebook view MUST load the wizard project context (title, objective, mode)
3. The notebook view MUST display the mode-specific workflow sections from the wizard
4. The notebook view MUST handle missing evidence gracefully (show "Requires processing" state, not an error)
5. Existing demo project notebook routes MUST remain unchanged

---

### Requirement 4: Notebook Memory Entry

**User Story:** As a researcher, I want my wizard project to appear in the Notebook sidebar as a Notebook Memory entry so I can access it from the notebook view.

#### Acceptance Criteria

1. Wizard projects MUST appear in the NotebookLab sidebar alongside demo projects
2. Each wizard project entry MUST show: title and workflow status label
3. Clicking a wizard project in the sidebar MUST load that project's context in the notebook view
4. The notebook view MUST display the project objective and mode-specific sections
5. Wizard projects MUST NOT break the existing notebook sidebar rendering

---

### Requirement 5: History / Provenance Entry

**User Story:** As a researcher, I want a provenance entry to be created when I complete the wizard so I have a record of when the project was started.

#### Acceptance Criteria

1. On wizard completion, one history entry MUST be written to localStorage
2. The history entry MUST include: project title, mode, workflow status, creation timestamp, and action type (`notebook`)
3. The History page MUST display wizard project history entries alongside demo project entries
4. History entries MUST persist across browser refresh
5. Existing demo project history entries MUST remain unaffected

---

### Requirement 6: Preserve All Wizard Data

**User Story:** As a researcher, I want all the information I entered in the wizard to be preserved so nothing is lost after I complete setup.

#### Acceptance Criteria

1. The following MUST be preserved: title, objective, mode, all essential context fields, all advanced context fields (if filled), data import status (files list or skipped flag), and project source selection
2. Preserved data MUST be accessible from the dashboard card and notebook view
3. Data MUST survive browser refresh
4. No wizard input MUST be silently discarded

---

### Requirement 7: Existing Demo Projects Unaffected

**User Story:** As a developer, I want existing demo projects to continue working exactly as before so the demo workflow is not broken.

#### Acceptance Criteria

1. All five demo projects MUST render and function correctly on the dashboard
2. Demo project routes (`/workspace/xrd`, `/workspace/multi`, `/notebook`, `/demo/agent`) MUST remain unchanged
3. Demo project data in `demoProjects.ts` MUST NOT be modified
4. Build MUST pass with `npm.cmd run build`

---

## Non-Goals (Explicit)

- No backend or database
- No new routes unless absolutely necessary
- No new npm dependencies
- No rewrite of Dashboard, NotebookLab, or History components
- No real file-processing pipeline
- No real analysis engine
- No changes to graph components
- No changes to package.json

---

## Browser Acceptance Tests

The following manual tests confirm the MVP is working:

1. Create a **Research** workflow project → refresh browser → project appears on dashboard with "Setup ready" → click Open → notebook loads with Research sections
2. Create an **R&D** workflow project → refresh browser → project appears on dashboard → click Open → notebook loads with R&D sections
3. Create an **Analytical Job** workflow project → refresh browser → project appears on dashboard → click Open → notebook loads with Analytical sections
4. Confirm each wizard project appears in the **Notebook sidebar**
5. Confirm each wizard project has a **History entry**
6. Confirm all **existing demo projects** still work correctly
7. Run `npm.cmd run build` — build must pass
