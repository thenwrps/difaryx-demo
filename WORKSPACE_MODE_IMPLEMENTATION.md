# Workspace Mode-Based Entry Implementation Guide

## Overview
This guide explains how to update workspace pages to support mode-based entry from WorkspaceLauncher.

## Files Created
1. `src/utils/workspaceEntry.ts` - Utility functions for mode detection
2. `src/components/workspace/DatasetInfoBar.tsx` - Info bar component
3. `src/components/workspace/EmptyWorkspaceState.tsx` - Empty state component

## Implementation Steps for Each Workspace

### For XRDWorkspace.tsx, XPSWorkspace.tsx, FTIRWorkspace.tsx, RamanWorkspace.tsx

#### 1. Add Imports
```typescript
import { getWorkspaceEntryMode, getSampleDatasetName } from '../utils/workspaceEntry';
import { DatasetInfoBar } from '../components/workspace/DatasetInfoBar';
import { EmptyWorkspaceState } from '../components/workspace/EmptyWorkspaceState';
```

#### 2. Add State Variables (in component)
```typescript
const [searchParams] = useSearchParams();
const entryMode = getWorkspaceEntryMode(searchParams, 'xrd'); // Replace 'xrd' with technique
const [datasetSource, setDatasetSource] = useState<'sample' | 'upload' | 'project' | null>(null);
const [showUploadUI, setShowUploadUI] = useState(false);
```

#### 3. Add useEffect for Mode Initialization
```typescript
useEffect(() => {
  if (!entryMode) return; // Project mode, use existing behavior

  if (entryMode.mode === 'sample') {
    // Auto-load sample dataset
    const sampleName = getSampleDatasetName('xrd'); // Replace with technique
    setDatasetSource('sample');
    // Load your sample data here using existing logic
    // Example: loadSampleData();
  } else if (entryMode.mode === 'upload') {
    setShowUploadUI(true);
    setDatasetSource('upload');
  }
}, [entryMode]);
```

#### 4. Update Render Logic
```typescript
return (
  <DashboardLayout>
    <div className="flex-1 overflow-y-auto bg-background p-3">
      {/* Show info bar when dataset is loaded */}
      {datasetSource && (
        <DatasetInfoBar
          technique="XRD" // Replace with actual technique
          source={datasetSource}
          datasetName={getSampleDatasetName('xrd')} // Or actual dataset name
        />
      )}

      {/* Empty state when no mode and no project */}
      {entryMode && entryMode.mode === 'empty' && !datasetSource && (
        <EmptyWorkspaceState
          technique="XRD" // Replace with actual technique
          onLoadSample={() => {
            const sampleName = getSampleDatasetName('xrd');
            setDatasetSource('sample');
            // Load sample data
          }}
          onUploadDataset={() => {
            setShowUploadUI(true);
            setDatasetSource('upload');
          }}
        />
      )}

      {/* Upload UI when mode=upload */}
      {showUploadUI && (
        <Card className="mb-3 p-4">
          <h3 className="mb-3 text-sm font-semibold">Upload Dataset</h3>
          {/* Your existing upload UI */}
        </Card>
      )}

      {/* Existing workspace content - only show when dataset is loaded */}
      {(datasetSource || !entryMode) && (
        <>
          {/* Your existing workspace UI */}
        </>
      )}
    </div>
  </DashboardLayout>
);
```

## Priority Logic

The implementation follows this priority:

1. **Project param exists** (`?project=...`)
   - Use existing project-based behavior
   - `entryMode` will be `null`
   - Continue with current logic

2. **Mode param = sample** (`?mode=sample`)
   - Auto-load sample dataset
   - Show DatasetInfoBar with source="sample"
   - Display graph and processing immediately

3. **Mode param = upload** (`?mode=upload`)
   - Show upload UI immediately
   - After upload, set datasetSource='upload'
   - Show DatasetInfoBar and reveal workspace

4. **No params**
   - Show EmptyWorkspaceState
   - User can click "Load Sample" or "Upload Dataset"

## Sample Data Loading

Each technique should have predefined sample data. Example for XRD:

```typescript
const loadSampleData = () => {
  const sampleData = {
    id: 'sample-xrd-001',
    fileName: getSampleDatasetName('xrd'),
    technique: 'XRD',
    sampleName: 'CuFe2O4 Spinel Sample',
    dataPoints: [
      // Your sample data points
    ],
  };
  
  // Load into your state
  setCurrentDataset(sampleData);
  setDatasetSource('sample');
};
```

## Testing Checklist

- [ ] `/workspace/xrd` shows empty state
- [ ] `/workspace/xrd?mode=sample` auto-loads sample
- [ ] `/workspace/xrd?mode=upload` shows upload UI
- [ ] `/workspace/xrd?project=cu-fe2o4-spinel` uses existing behavior
- [ ] DatasetInfoBar displays correctly
- [ ] Upload flow works and shows graph after upload
- [ ] All existing functionality remains intact

## Notes

- Keep all existing processing logic unchanged
- Only add initialization and entry-state handling
- Ensure backward compatibility with project-based routes
- Test each technique workspace individually
