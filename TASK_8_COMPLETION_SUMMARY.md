# Task 8: Add Data Import to Wizard Step 4 - COMPLETED

## Status: ✅ COMPLETE

## Summary
Successfully refined the ProjectNotebookWizard Step 4 to include both initial setup data fields AND data import functionality. The implementation allows users to attach experimental data files during project notebook creation or skip and add them later.

## Changes Implemented

### 1. Step 4 Renamed ✅
- **From:** "Data"
- **To:** "Setup & Data"
- Stepper now shows: Project → Mode → Structure → Setup & Data → Review

### 2. Step 4 Split into Two Sections ✅

#### A. Initial Setup Data
- Renders existing mode-specific setup fields
- Research fields: Scientific Question*, Sample System*, etc.
- R&D fields: Product Goal*, Target KPI*, Decision Needed*, etc.
- Analytical fields: Job Purpose*, Sample Submitted*, QA/QC Requirement*, etc.

#### B. Add / Import Data
- **Description:** "Attach initial experimental files now or skip and add them later."
- **Supported formats chips:** XRD, Raman, FTIR, XPS, CSV, TXT, XY, DAT
- **Dropzone:** Drag-and-drop file upload with "Drop files here or choose files" placeholder
- **File selection:** Shows selected files with remove capability
- **Data destination selector:**
  - Project-level data
  - First experiment/trial/run (mode-specific)
- **Skip option:** "Skip data import for now" button

### 3. Data Import Not Required ✅
- Users can proceed without selecting files
- Skip button allows explicit opt-out
- Required setup fields still gate Step 4 completion
- Data import does not block progression

### 4. Data Storage in ProjectNotebook ✅
```typescript
initialDataImport?: {
  skipped: boolean;
  files: Array<{
    name: string;
    type: string;
    status: 'attached' | 'pending-parse';
  }>;
  destination: 'project' | 'first-row';
}
```
- Files stored as placeholder metadata (no parsing yet)
- Tracks skip state
- Records destination preference

### 5. Review Step Shows Data Status ✅
- **If skipped:** "No files attached · Data can be added later"
- **If files selected:** "{N} file(s) attached · Pending parse"
- **If no files and not skipped:** "No files attached"
- Shows destination when files are attached

### 6. Dashboard Card Shows Data Status ✅
- **No files:** "Data pending" (muted text)
- **Files attached:** "Data attached" (primary color)
- Status label appears next to mode badge in card metadata

### 7. Validation Preserved ✅
- Required setup fields still gate Step 4 completion
- Cannot proceed to Review without completing required fields
- Data import is optional and does not block progression

### 8. Build Validation ✅
```bash
npm run build
```
**Result:** ✓ built in 5.82s (SUCCESS)

## Files Modified

### 1. `src/components/dashboard/ProjectNotebookWizard.tsx`
- Added file upload state management
- Added drag-and-drop handlers
- Split Step 4 into two sections (A. Initial Setup Data, B. Add / Import Data)
- Added dropzone with file selection UI
- Added data destination selector
- Added skip option
- Updated Review step to show data status
- Updated handleCreate to save initialDataImport

### 2. `src/data/demoProjects.ts`
- Already had `ProjectNotebook` interface with `initialDataImport` field
- No changes needed (types were already defined)

### 3. `src/pages/Dashboard.tsx`
- Added data status calculation for notebook cards
- Added "Data attached" / "Data pending" label display
- Positioned data status next to mode badge

## User Experience Flow

1. **Step 1 (Project):** User enters title and objective
2. **Step 2 (Mode):** User selects Research, R&D, or Analytical Job
3. **Step 3 (Structure):** User reviews generated sections
4. **Step 4 (Setup & Data):**
   - **Section A:** User fills required setup fields
   - **Section B:** User can:
     - Drag-and-drop files
     - Click to select files
     - Remove selected files
     - Choose destination (project-level or first row)
     - Skip data import entirely
5. **Step 5 (Review):** User reviews all settings including data status
6. **Create:** Notebook card appears on dashboard with data status badge

## Testing Checklist

- [x] Build passes without errors
- [x] Step 4 renamed to "Setup & Data"
- [x] Setup fields render correctly
- [x] File dropzone accepts drag-and-drop
- [x] File selection works via click
- [x] Selected files can be removed
- [x] Data destination selector works
- [x] Skip option toggles correctly
- [x] Can proceed without files
- [x] Review step shows correct data status
- [x] Dashboard card shows data status
- [x] Required fields still gate progression
- [x] Create button disabled until required fields filled

## Next Steps (Future Work)

1. **File Parsing:** Implement actual file parsing for XRD, Raman, FTIR, XPS formats
2. **Data Preview:** Show preview of imported data in Review step
3. **Notebook Workspace:** Build the full Project Notebook workspace UI
4. **Data Management:** Allow adding/removing data after notebook creation
5. **Validation:** Add file format validation and size limits
6. **Error Handling:** Handle file upload errors gracefully

## Notes

- No backend required - all data stored in localStorage
- File objects stored as metadata only (name, type, status)
- No actual file parsing implemented yet (placeholder for future)
- Deterministic demo behavior preserved
- Visual style consistent with existing DIFARYX patterns
- Compact layout optimized for 720p viewport
