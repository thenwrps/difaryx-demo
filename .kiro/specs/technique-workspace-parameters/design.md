# Design Document: Scientific Parameter System for Technique Workspaces

## Overview

The Scientific Parameter System introduces a lightweight, inline parameter control mechanism for XRD, XPS, FTIR, and Raman technique workspaces. The system enables expert users to fine-tune processing parameters while maintaining a simple default experience through Auto Mode. Parameters are embedded directly within the existing Processing Pipeline component using an accordion expansion pattern, ensuring minimal disruption to the current layout and workflow.

### Key Design Principles

1. **Right-Side Drawer Interaction**: Parameters open in a persistent right-side drawer that slides in from the right edge, preserving graph visibility
2. **Scientific Credibility**: All parameters use scientifically accurate terminology, units, and valid ranges appropriate for each technique
3. **Progressive Disclosure**: Auto Mode hides complexity by default; Advanced Mode reveals parameters for expert users
4. **Immediate Feedback**: Parameter changes trigger real-time updates to graphs, peak markers, and confidence scores
5. **Session Persistence**: Parameter values persist across navigation using localStorage
6. **Clear Separation**: Parameter controls remain distinct from Agent Mode functionality (no AI-based optimization)

### Design Constraints

- **Layout Preservation**: The existing 3-panel layout (left: Processing Pipeline, center: Graph, right: Scientific Summary) remains unchanged
- **No New Routes**: All functionality integrates into existing workspace routes (`/workspace/xrd`, `/workspace/xps`, `/workspace/ftir`, `/workspace/raman`)
- **Drawer-Based UI**: Parameters display in a right-side drawer that slides over the right panel, not as modal dialogs or inline accordions
- **Deterministic Demo**: Maintains client-side, deterministic behavior consistent with current implementation
- **No Backend**: All processing and persistence handled client-side

## Architecture

### Component Hierarchy

```
XRDWorkspace (existing page component)
├── DashboardLayout (existing)
├── Left Panel (existing aside)
│   ├── Project Header (existing)
│   ├── Dataset Selector (existing)
│   ├── Processing Pipeline (NEW COMPONENT)
│   │   ├── Auto Mode Toggle (NEW)
│   │   ├── Processing Step 1: Baseline Correction
│   │   │   ├── Step Header with Status (existing pattern)
│   │   │   └── Params Button (NEW - opens drawer)
│   │   ├── Processing Step 2: Smoothing
│   │   │   └── Params Button (NEW - opens drawer)
│   │   ├── Processing Step 3: Peak Detection
│   │   │   └── Params Button (NEW - opens drawer)
│   │   ├── Processing Step 4: Peak Fitting
│   │   │   └── Params Button (NEW - opens drawer)
│   │   └── Processing Step 5: Reference Matching
│   │       └── Params Button (NEW - opens drawer)
│   ├── Pipeline Status (existing)
│   └── Tools Section (existing)
├── Center Panel (existing - NO CHANGES)
│   └── Graph Visualization (existing)
├── Right Panel (existing - NO CHANGES)
│   └── Scientific Summary (existing)
└── Parameter Drawer (NEW COMPONENT - slides from right)
    ├── Drawer Header
    │   ├── Step Name (e.g., "Baseline Correction")
    │   ├── Method Name (e.g., "Asymmetric Least Squares")
    │   └── Close Button
    ├── Parameters Section
    │   ├── Parameter Control: method
    │   ├── Parameter Control: lambda (conditional)
    │   ├── Parameter Control: p (conditional)
    │   └── Parameter Control: iterations (conditional)
    ├── Preview Impact Section (NEW)
    │   └── Short explanation of parameter effects
    └── Actions Section
        ├── Apply Button
        ├── Reset Button
        └── Cancel Button
```

### State Management Architecture

```typescript
// Workspace-level state structure
interface WorkspaceState {
  autoMode: boolean;
  parameters: TechniqueParameters;
  drawerOpen: boolean;
  activeStep: string | null;
}

// Parameter state per technique
interface TechniqueParameters {
  baselineCorrection: BaselineCorrectionParams;
  smoothing: SmoothingParams;
  peakDetection: PeakDetectionParams;
  peakFitting: PeakFittingParams;
  referenceMatching: ReferenceMatchingParams;
}
```

**State Management Strategy**:
- Use React `useState` hooks at the workspace page level
- Pass state and setters down to `ProcessingPipeline` and `ParameterDrawer` components
- Use `useEffect` hooks to sync with localStorage
- Use `useMemo` to recompute processing results when parameters change
- Maintain backward compatibility with existing agent result computation
- Track drawer open/closed state and active step for drawer content

### Data Flow

```
User Action (toggle/input)
    ↓
Parameter State Update
    ↓
localStorage Persistence
    ↓
Processing Recomputation (useMemo)
    ↓
Graph/UI Update (via props)
```

## Components and Interfaces

### 1. ProcessingPipeline Component (NEW)

**Purpose**: Container component for all processing steps with Auto Mode toggle and parameter button management.

**Location**: `src/components/workspace/ProcessingPipeline.tsx`

**Props Interface**:
```typescript
interface ProcessingPipelineProps {
  technique: 'xrd' | 'xps' | 'ftir' | 'raman';
  autoMode: boolean;
  onAutoModeChange: (enabled: boolean) => void;
  parameters: TechniqueParameters;
  onOpenDrawer: (stepId: string) => void;
  processingStatus: ProcessingStepStatus[];
}

interface ProcessingStepStatus {
  id: string;
  label: string;
  status: 'complete' | 'warning' | 'error';
  summary: string;
}
```

**Responsibilities**:
- Render Auto Mode toggle at top of pipeline
- Render list of processing steps with status indicators
- Render "Params" button for each step
- Call `onOpenDrawer` when Params button is clicked
- Display step summary and status

### 2. ParameterDrawer Component (NEW)

**Purpose**: Right-side sliding drawer for step-specific parameter editing.

**Location**: `src/components/workspace/ParameterDrawer.tsx`

**Props Interface**:
```typescript
interface ParameterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stepId: string | null;
  stepLabel: string;
  methodName: string;
  isAutoMode: boolean;
  parameters: Record<string, ParameterValue>;
  parameterDefinitions: ParameterDefinition[];
  onParameterChange: (paramId: string, value: ParameterValue) => void;
  onApply: () => void;
  onReset: () => void;
  validationErrors: Record<string, string>;
  previewImpact: string;
}

type ParameterValue = number | string | boolean | null;

interface ParameterDefinition {
  id: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  unit?: string;
  defaultValue: ParameterValue;
  // For number type
  min?: number;
  max?: number;
  step?: number;
  // For select type
  options?: Array<{ value: string; label: string }>;
  // Conditional visibility
  visibleWhen?: (params: Record<string, ParameterValue>) => boolean;
  // Validation
  validate?: (value: ParameterValue, allParams: Record<string, ParameterValue>) => string | null;
}
```

**Responsibilities**:
- Slide in from right edge when `isOpen` is true
- Display drawer header with step name, method name, and close button
- Render parameter controls for the active step
- Display preview impact text explaining parameter effects
- Render Apply, Reset, and Cancel action buttons
- Handle conditional parameter visibility (e.g., ALS-specific parameters)
- Show inline validation warnings
- Overlay the right panel but keep graph visible
- Close when Cancel button or close icon is clicked

### 3. ParameterControl Component (NEW)

**Purpose**: Individual parameter input control with label, value display, and validation.

**Location**: `src/components/workspace/ParameterControl.tsx`

**Props Interface**:
```typescript
interface ParameterControlProps {
  definition: ParameterDefinition;
  value: ParameterValue;
  onChange: (value: ParameterValue) => void;
  validationError?: string;
}
```

**Responsibilities**:
- Render label with unit (e.g., "Lambda (dimensionless)")
- Render appropriate input widget:
  - **Number**: Range slider with numeric input box
  - **Select**: Dropdown menu
  - **Boolean**: Toggle switch
- Display current value prominently
- Show inline validation warning if present
- Handle scientific notation for very large/small numbers

### 4. Parameter Persistence Hook (NEW)

**Purpose**: Custom React hook for localStorage persistence of parameter state.

**Location**: `src/hooks/useParameterPersistence.ts`

**Interface**:
```typescript
function useParameterPersistence(
  technique: 'xrd' | 'xps' | 'ftir' | 'raman',
  initialParameters: TechniqueParameters
): [TechniqueParameters, (params: TechniqueParameters) => void] {
  // Returns [parameters, setParameters]
  // Automatically syncs with localStorage
}
```

**Storage Key Format**: `difaryx_params_${technique}`

**Responsibilities**:
- Load parameters from localStorage on mount
- Save parameters to localStorage on change
- Merge stored values with defaults (handle missing keys)
- Return parameters and setter function

## Data Models

### XRD Parameter Definitions

```typescript
interface XrdParameters {
  baselineCorrection: {
    method: 'ALS' | 'Polynomial';
    lambda: number;        // 1e2 to 1e9, default 1e6
    p: number;             // 0.001 to 0.1, default 0.01
    iterations: number;    // 1 to 100, default 10
  };
  smoothing: {
    method: 'Savitzky-Golay';
    window_size: number;   // 3 to 21 (odd only), default 5
    polynomial_order: number; // 1 to 5, default 2
  };
  peakDetection: {
    prominence: number;    // 0.0 to 1.0, default 0.1
    min_distance: number;  // 0.05 to 2.0 °2θ, default 0.2
    height_threshold: number | null; // 0.0 to 1.0, default null
  };
  peakFitting: {
    model: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt';
    tolerance: number;     // 1e-6 to 1e-2, default 1e-4
    max_iterations: number; // 10 to 1000, default 100
  };
  referenceMatching: {
    database: 'ICDD' | 'COD';
    delta_tolerance: number; // 0.01 to 0.5 °2θ, default 0.1
    min_match_score: number; // 0.0 to 1.0, default 0.7
    use_intensity: boolean;  // default true
  };
}
```

### XPS Parameter Definitions

```typescript
interface XpsParameters {
  backgroundSubtraction: {
    method: 'Shirley' | 'Tougaard';
    iterations: number;    // 1 to 50, default 10
  };
  peakDeconvolution: {
    model: 'Gaussian-Lorentzian';
    num_components: number; // 1 to 10, default 3
    constrain_fwhm: boolean; // default false
  };
  energyCalibration: {
    reference_peak: 'C1s' | 'Au4f7' | 'Ag3d5';
    reference_energy: number; // 280.0 to 290.0 eV, default 284.8
  };
  assignment: {
    binding_energy_tolerance: number; // 0.1 to 2.0 eV, default 0.5
    satellite_check: boolean; // default true
  };
}
```

### Raman Parameter Definitions

```typescript
interface RamanParameters {
  baseline: {
    method: 'ALS' | 'Polynomial';
    lambda: number;        // 1e2 to 1e9, default 1e5
    p: number;             // 0.001 to 0.1, default 0.01
  };
  peakDetection: {
    prominence: number;    // 0.0 to 1.0, default 0.1
    min_distance: number;  // 1.0 to 50.0 cm⁻¹, default 10.0
  };
  modeAssignment: {
    reference_library: string; // technique-appropriate values
    tolerance: number;     // 1.0 to 20.0 cm⁻¹, default 5.0
  };
}
```

### FTIR Parameter Definitions

```typescript
interface FtirParameters {
  baseline: {
    method: 'Rubberband' | 'Polynomial';
  };
  peakDetection: {
    prominence: number;    // 0.0 to 1.0, default 0.1
    min_distance: number;  // 5.0 to 100.0 cm⁻¹, default 20.0
  };
  bandAssignment: {
    library: 'Fe-O' | 'Organic' | 'Other';
    tolerance: number;     // 5.0 to 50.0 cm⁻¹, default 10.0
  };
}
```

### Parameter Definition Registry

**Location**: `src/data/parameterDefinitions.ts`

This file exports parameter definitions for all techniques, enabling the UI to render controls dynamically:

```typescript
export const XRD_PARAMETER_DEFINITIONS: Record<string, ParameterDefinition[]> = {
  baselineCorrection: [
    {
      id: 'method',
      label: 'Method',
      type: 'select',
      defaultValue: 'ALS',
      options: [
        { value: 'ALS', label: 'Asymmetric Least Squares (ALS)' },
        { value: 'Polynomial', label: 'Polynomial Fit' }
      ]
    },
    {
      id: 'lambda',
      label: 'Lambda',
      type: 'number',
      unit: 'dimensionless',
      min: 1e2,
      max: 1e9,
      step: 1e5,
      defaultValue: 1e6,
      visibleWhen: (params) => params.method === 'ALS',
      validate: (value) => {
        if (typeof value === 'number' && (value < 1e2 || value > 1e9)) {
          return 'Lambda must be between 1e2 and 1e9';
        }
        return null;
      }
    },
    // ... more parameters
  ],
  // ... more steps
};
```

## Error Handling

### Parameter Validation Strategy

**Validation Levels**:

1. **Type Validation** (enforced by input controls):
   - Number inputs only accept numeric values
   - Select inputs only accept predefined options
   - Boolean inputs only accept true/false

2. **Range Validation** (inline warnings):
   - Display warning when value is outside valid range
   - Allow user to proceed (non-blocking)
   - Example: "Window size must be odd" for even window_size values

3. **Constraint Validation** (inline warnings):
   - Display warning for invalid parameter combinations
   - Example: "Polynomial order must be less than window size"

4. **Processing Validation** (runtime):
   - Catch errors during processing recomputation
   - Display error status in Processing Pipeline
   - Preserve previous valid results

**Validation Error Display**:
- Inline warning message below parameter control
- Amber border on input control
- Warning icon with tooltip
- Non-blocking (user can still adjust other parameters)

### Error Recovery

**Scenarios**:

1. **Invalid localStorage data**:
   - Catch JSON parse errors
   - Fall back to default parameters
   - Log warning to console

2. **Missing parameter keys** (after schema updates):
   - Merge stored values with defaults
   - Use default for missing keys
   - Preserve valid stored values

3. **Processing errors**:
   - Display error status in Processing Pipeline
   - Show error message in step summary
   - Preserve previous valid graph state
   - Allow parameter adjustment to recover

## Testing Strategy

### Unit Testing

**Test Coverage**:

1. **Parameter Validation**:
   - Test range validation for all numeric parameters
   - Test constraint validation (e.g., odd window size)
   - Test conditional visibility logic
   - Test default value application

2. **State Management**:
   - Test parameter state updates
   - Test Auto Mode toggle behavior
   - Test accordion expand/collapse
   - Test localStorage persistence

3. **Component Rendering**:
   - Test parameter control rendering for each type
   - Test validation error display
   - Test conditional parameter visibility
   - Test scientific unit display

**Example Unit Tests**:

```typescript
describe('XRD Smoothing Parameters', () => {
  it('should warn when window_size is even', () => {
    const validation = validateWindowSize(4);
    expect(validation).toBe('Window size must be odd');
  });

  it('should accept odd window_size values', () => {
    const validation = validateWindowSize(5);
    expect(validation).toBeNull();
  });
});

describe('Parameter Persistence', () => {
  it('should save parameters to localStorage', () => {
    const params = { /* ... */ };
    saveParameters('xrd', params);
    expect(localStorage.getItem('difaryx_params_xrd')).toBeDefined();
  });

  it('should load parameters from localStorage', () => {
    const stored = { /* ... */ };
    localStorage.setItem('difaryx_params_xrd', JSON.stringify(stored));
    const loaded = loadParameters('xrd', defaults);
    expect(loaded).toEqual(stored);
  });

  it('should merge with defaults when keys are missing', () => {
    const partial = { baselineCorrection: { method: 'ALS' } };
    localStorage.setItem('difaryx_params_xrd', JSON.stringify(partial));
    const loaded = loadParameters('xrd', defaults);
    expect(loaded.smoothing).toEqual(defaults.smoothing);
  });
});
```

### Integration Testing

**Test Scenarios**:

1. **Parameter Change → Graph Update**:
   - Change peak detection prominence
   - Verify peak markers update on graph
   - Verify confidence score updates

2. **Auto Mode Toggle**:
   - Enable Auto Mode
   - Verify parameters hidden
   - Verify defaults applied
   - Disable Auto Mode
   - Verify custom parameters restored

3. **Navigation Persistence**:
   - Set custom parameters
   - Navigate to different workspace
   - Return to original workspace
   - Verify parameters restored

4. **Conditional Parameter Visibility**:
   - Select ALS method
   - Verify lambda, p, iterations visible
   - Select Polynomial method
   - Verify ALS parameters hidden

**Example Integration Test**:

```typescript
describe('XRD Workspace Parameter Integration', () => {
  it('should update graph when peak detection parameters change', () => {
    render(<XRDWorkspace />);
    
    // Disable Auto Mode
    fireEvent.click(screen.getByLabelText('Auto Mode'));
    
    // Expand Peak Detection accordion
    fireEvent.click(screen.getByText('Peak Detection'));
    
    // Change prominence
    const prominenceSlider = screen.getByLabelText('Prominence');
    fireEvent.change(prominenceSlider, { target: { value: '0.2' } });
    
    // Verify graph updated
    const graph = screen.getByTestId('xrd-graph');
    expect(graph).toHaveAttribute('data-peak-count', '8'); // fewer peaks with higher prominence
  });
});
```

### Manual Testing Checklist

**Visual Verification**:
- [ ] Auto Mode toggle displays correctly at top of Processing Pipeline
- [ ] "Params" buttons display for each processing step
- [ ] Parameter accordions expand inline below step header
- [ ] Parameter controls render with correct labels and units
- [ ] Validation warnings display inline with amber styling
- [ ] Graph updates smoothly when parameters change
- [ ] Peak markers update when detection parameters change
- [ ] Confidence scores update when parameters change

**Functional Verification**:
- [ ] Auto Mode hides all parameter controls
- [ ] Auto Mode applies default values
- [ ] Disabling Auto Mode restores custom values
- [ ] Parameter values persist across navigation
- [ ] Conditional parameters show/hide correctly
- [ ] Range validation prevents invalid values
- [ ] Processing errors display in Pipeline status
- [ ] All 4 techniques (XRD, XPS, FTIR, Raman) work correctly

**Scientific Accuracy**:
- [ ] Units display correctly (°2θ, eV, cm⁻¹)
- [ ] Default values are scientifically reasonable
- [ ] Parameter ranges match technique conventions
- [ ] Terminology matches scientific literature

## Implementation Plan

### Phase 1: Core Infrastructure (Foundation)

**Tasks**:
1. Create parameter type definitions (`src/types/parameters.ts`)
2. Create parameter definition registry (`src/data/parameterDefinitions.ts`)
3. Create parameter persistence hook (`src/hooks/useParameterPersistence.ts`)
4. Add unit tests for parameter validation and persistence

**Deliverables**:
- Type-safe parameter interfaces for all 4 techniques
- Complete parameter definition registry with validation rules
- Working localStorage persistence hook
- Unit test coverage for validation logic

### Phase 2: UI Components (Visual Layer)

**Tasks**:
1. Create `ParameterControl` component with number/select/boolean inputs
2. Create `ParameterAccordion` component with expand/collapse
3. Create `ProcessingPipeline` component with Auto Mode toggle
4. Add Tailwind styling consistent with existing design system
5. Add unit tests for component rendering

**Deliverables**:
- Reusable parameter input components
- Accordion expansion UI
- Auto Mode toggle UI
- Component unit tests

### Phase 3: XRD Integration (First Technique)

**Tasks**:
1. Integrate `ProcessingPipeline` into `XRDWorkspace.tsx`
2. Wire up parameter state management
3. Connect parameters to processing recomputation
4. Update graph with parameter-driven results
5. Add integration tests for XRD parameter flow

**Deliverables**:
- Fully functional XRD parameter system
- Real-time graph updates
- Integration test coverage
- Working demo for user validation

### Phase 4: Multi-Technique Rollout (Scale)

**Tasks**:
1. Integrate parameters into `XPSWorkspace.tsx`
2. Integrate parameters into `FTIRWorkspace.tsx`
3. Integrate parameters into `RamanWorkspace.tsx`
4. Add technique-specific parameter definitions
5. Add integration tests for all techniques

**Deliverables**:
- All 4 techniques support parameters
- Consistent UX across techniques
- Complete integration test coverage

### Phase 5: Polish and Documentation (Refinement)

**Tasks**:
1. Add inline help tooltips for complex parameters
2. Optimize performance (debounce parameter changes)
3. Add keyboard navigation support
4. Write user documentation
5. Conduct manual testing across all techniques

**Deliverables**:
- Polished, production-ready UI
- Performance optimizations
- Accessibility improvements
- User documentation

## Future Enhancements (Out of Scope)

The following features are explicitly **not included** in this design but could be considered for future iterations:

1. **AI-Based Parameter Optimization**: Automatic parameter tuning based on data characteristics (remains in Agent Mode)
2. **Parameter Presets**: Save/load named parameter configurations
3. **Parameter History**: Undo/redo parameter changes
4. **Batch Parameter Application**: Apply parameters to multiple datasets
5. **Parameter Export**: Export parameter configurations as JSON
6. **Advanced Validation**: Cross-parameter constraint checking beyond simple ranges
7. **Parameter Recommendations**: Suggest parameter values based on data quality
8. **Real-Time Collaboration**: Share parameter configurations with team members

These enhancements maintain clear separation from Agent Mode functionality and could be prioritized based on user feedback.
