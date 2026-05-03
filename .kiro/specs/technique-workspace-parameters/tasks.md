# Implementation Plan: Scientific Parameter System for Technique Workspaces

## Overview

This implementation plan breaks down the Scientific Parameter System into discrete, incremental coding tasks. The system introduces inline parameter controls within the existing Processing Pipeline component for XRD, XPS, FTIR, and Raman technique workspaces. The implementation follows a phased approach: foundation (types and data models), UI components, XRD integration (first technique), multi-technique rollout, and final polish.

**Key Constraints**:
- Preserve existing 3-panel layout and routing
- Use right-side drawer (not inline accordion or modal)
- Auto Mode ON by default (backward compatibility)
- Parameters display in drawer that slides from right
- Real-time graph updates when parameters change
- Client-side only (no backend)

## Tasks

### Phase 1: Core Infrastructure (Foundation)

- [x] 1. Create parameter type definitions and interfaces
  - Create `src/types/parameters.ts` file
  - Define `ParameterValue`, `ParameterDefinition`, `ParameterValidationResult` types
  - Define `XrdParameters`, `XpsParameters`, `RamanParameters`, `FtirParameters` interfaces
  - Define `TechniqueParameters` union type
  - Define `WorkspaceParameterState` interface with autoMode, parameters, and expandedSteps
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Create XRD parameter definitions registry
  - Create `src/data/parameterDefinitions.ts` file
  - Export `XRD_PARAMETER_DEFINITIONS` constant with all 5 processing steps
  - Define baseline correction parameters (method, lambda, p, iterations) with ranges and defaults
  - Define smoothing parameters (method, window_size, polynomial_order) with validation
  - Define peak detection parameters (prominence, min_distance, height_threshold)
  - Define peak fitting parameters (model, tolerance, max_iterations)
  - Define reference matching parameters (database, delta_tolerance, min_match_score, use_intensity)
  - Include conditional visibility logic for ALS-specific parameters
  - Include validation functions (e.g., odd window_size check)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4_

- [x] 3. Create parameter persistence hook
  - Create `src/hooks/useParameterPersistence.ts` file
  - Implement `useParameterPersistence` custom hook
  - Load parameters from localStorage on mount using key format `difaryx_params_${technique}`
  - Save parameters to localStorage on change
  - Merge stored values with defaults to handle missing keys
  - Handle JSON parse errors gracefully (fall back to defaults)
  - Return `[parameters, setParameters]` tuple
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ]* 4. Write unit tests for parameter validation
  - Create test file for parameter validation logic
  - Test window_size odd/even validation
  - Test numeric range validation for all parameter types
  - Test conditional visibility logic (ALS vs Polynomial)
  - Test default value application
  - _Requirements: 2.1, 2.2, 4.4, 19.1, 19.2_

- [ ]* 5. Write unit tests for parameter persistence
  - Create test file for useParameterPersistence hook
  - Test saving parameters to localStorage
  - Test loading parameters from localStorage
  - Test merging with defaults when keys are missing
  - Test JSON parse error handling
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: UI Components (Visual Layer)

- [x] 7. Create ParameterControl component
  - [x] 7.1 Create `src/components/workspace/ParameterControl.tsx` file
    - Define `ParameterControlProps` interface
    - Implement component with label, value display, and input control
    - Render label with scientific unit (e.g., "Lambda (dimensionless)")
    - _Requirements: 18.7, 23.1, 23.2, 23.3, 23.4, 23.5_
  
  - [x] 7.2 Implement number input control
    - Render range slider for numeric parameters
    - Render numeric input box alongside slider
    - Handle scientific notation for very large/small numbers (e.g., 1e6)
    - Apply min, max, step constraints from parameter definition
    - _Requirements: 2.2, 23.5_
  
  - [x] 7.3 Implement select input control
    - Render dropdown menu for categorical parameters
    - Populate options from parameter definition
    - Display option labels (e.g., "Asymmetric Least Squares (ALS)")
    - _Requirements: 3.1, 4.1, 6.1, 7.1_
  
  - [x] 7.4 Implement boolean input control
    - Render toggle switch for boolean parameters
    - Display ON/OFF state clearly
    - _Requirements: 7.4, 9.3, 11.2_
  
  - [x] 7.5 Add validation error display
    - Show inline warning message below input control when validationError prop is present
    - Apply amber border to input control on validation error
    - Display warning icon with tooltip
    - _Requirements: 19.1, 19.2, 19.3_

- [x] 8. Create ParameterDrawer component
  - [x] 8.1 Create `src/components/workspace/ParameterDrawer.tsx` file
    - Define `ParameterDrawerProps` interface
    - Implement drawer container that slides in from right edge
    - Render drawer header with step name, method name, and close button
    - _Requirements: 18.1, 18.2, 18.3, 18.4_
  
  - [x] 8.2 Implement drawer slide-in animation
    - Use CSS transitions for smooth slide-in from right
    - Drawer should overlay the right panel but not obscure the graph
    - Add backdrop overlay with semi-transparent background
    - Close drawer when backdrop is clicked
    - _Requirements: 18.2, 18.5, 18.6_
  
  - [x] 8.3 Implement parameter section rendering
    - Render parameter controls for the active step
    - Evaluate `visibleWhen` function for conditional parameters
    - Show/hide parameters based on current parameter values (e.g., ALS-specific params)
    - Re-evaluate visibility when parameter values change
    - _Requirements: 3.2, 3.3, 3.4, 18.7_
  
  - [x] 8.4 Implement preview impact section
    - Display short explanation of parameter effects
    - Update preview text based on parameter changes
    - Examples: "Higher λ → smoother baseline", "Lower prominence → more peaks detected"
    - _Requirements: 18.7_
  
  - [x] 8.5 Implement actions section
    - Render Apply button (primary action)
    - Render Reset button (revert to defaults)
    - Render Cancel button (close without applying)
    - Wire up button click handlers to call appropriate callbacks
    - _Requirements: 18.7_
  
  - [x] 8.6 Wire up parameter change handlers
    - Call `onParameterChange` when any parameter value changes
    - Pass parameter ID and new value to parent component
    - Trigger validation for changed parameter
    - Update preview impact text
    - _Requirements: 18.7, 19.1, 19.2_

- [x] 9. Create ProcessingPipeline component
  - [x] 9.1 Create `src/components/workspace/ProcessingPipeline.tsx` file
    - Define `ProcessingPipelineProps` interface
    - Implement container component for all processing steps
    - Accept technique, autoMode, parameters, and callbacks as props
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_
  
  - [x] 9.2 Implement Auto Mode toggle
    - Render toggle control at top of Processing Pipeline
    - Display "Auto Mode" label with ON/OFF indicator
    - Call `onAutoModeChange` when toggle is clicked
    - Initialize with Auto Mode enabled by default
    - _Requirements: 1.1, 1.4_
  
  - [x] 9.3 Implement Auto Mode summary indicators
    - Display "Auto-optimized" summary for each processing step when Auto Mode is enabled
    - Hide Params buttons when Auto Mode is enabled
    - _Requirements: 1.2, 1.5_
  
  - [x] 9.4 Render processing steps with Params buttons
    - Map over `processingStatus` array to render each step
    - Display step label, status indicator (complete/warning/error), and summary
    - Render "Params" button for each step
    - Call `onOpenDrawer(stepId)` when Params button is clicked
    - _Requirements: 18.1, 18.2_
  
  - [x] 9.5 Apply Tailwind styling consistent with existing design
    - Match existing Processing Pipeline visual style
    - Use existing color scheme and spacing
    - Ensure responsive layout
    - _Requirements: 21.2, 21.4_

- [ ]* 10. Write unit tests for UI components
  - Test ParameterControl rendering for number, select, and boolean types
  - Test validation error display
  - Test ParameterDrawer slide-in/slide-out animation
  - Test drawer backdrop click closes drawer
  - Test conditional parameter visibility
  - Test ProcessingPipeline Auto Mode toggle
  - Test Params button opens drawer with correct step
  - _Requirements: 1.1, 1.2, 1.3, 18.2, 18.5, 18.6, 19.1_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: XRD Integration (First Technique)

- [x] 12. Integrate parameter state into XRDWorkspace
  - [x] 12.1 Add parameter state management to XRDWorkspace component
    - Import `useParameterPersistence` hook
    - Add `autoMode` state with `useState` (default: true)
    - Add `drawerOpen` state with `useState` (default: false)
    - Add `activeStep` state with `useState` (default: null)
    - Call `useParameterPersistence('xrd', XRD_DEFAULT_PARAMETERS)`
    - _Requirements: 1.4, 20.1, 20.2, 20.5_
  
  - [x] 12.2 Create XRD default parameters constant
    - Define `XRD_DEFAULT_PARAMETERS` in `src/data/parameterDefinitions.ts`
    - Set all default values matching requirements (e.g., lambda: 1e6, prominence: 0.1)
    - _Requirements: 2.1, 3.2, 3.3, 3.4, 4.2, 4.3, 5.1, 5.2, 6.2, 6.3, 7.2, 7.3, 7.4_
  
  - [x] 12.3 Implement parameter change handlers
    - Create `handleAutoModeChange` function to update autoMode state
    - Create `handleParametersChange` function to update parameters
    - Create `handleOpenDrawer` function to set drawerOpen=true and activeStep
    - Create `handleCloseDrawer` function to set drawerOpen=false
    - Create `handleApplyParameters` function to apply changes and close drawer
    - Create `handleResetParameters` function to revert to defaults
    - Apply defaults when Auto Mode is enabled
    - Restore custom values when Auto Mode is disabled
    - _Requirements: 1.2, 1.3, 18.2, 18.4, 20.3, 20.4_

- [ ] 13. Replace existing Processing Pipeline with new component
  - [ ] 13.1 Import ProcessingPipeline component into XRDWorkspace
    - Remove or comment out existing processing step UI
    - Render ProcessingPipeline component in left panel
    - Pass technique='xrd', autoMode, parameters, onOpenDrawer, and processingStatus as props
    - _Requirements: 21.1, 21.2, 21.3, 21.4_
  
  - [ ] 13.2 Create processing status data for XRD
    - Define `processingStatus` array with 5 steps: Baseline Correction, Smoothing, Peak Detection, Peak Fitting, Reference Matching
    - Set status to 'complete' for all steps initially
    - Set summary text for each step
    - _Requirements: 1.5, 18.7_
  
  - [ ] 13.3 Render ParameterDrawer component
    - Import ParameterDrawer component into XRDWorkspace
    - Render ParameterDrawer at workspace level (not inside left panel)
    - Pass isOpen, onClose, stepId, stepLabel, methodName, parameters, and callbacks as props
    - Position drawer to slide from right edge
    - _Requirements: 18.2, 18.3, 18.4, 18.5, 18.6_

- [x] 14. Connect parameters to processing recomputation
  - [x] 14.1 Implement baseline correction with parameters
    - Create or update baseline correction function to accept method, lambda, p, iterations
    - Apply ALS algorithm when method is 'ALS'
    - Apply Polynomial fit when method is 'Polynomial'
    - Use parameter values from state
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 14.2 Implement smoothing with parameters
    - Create or update smoothing function to accept window_size, polynomial_order
    - Apply Savitzky-Golay filter with parameter values
    - Validate window_size is odd (display warning if even)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 14.3 Implement peak detection with parameters
    - Create or update peak detection function to accept prominence, min_distance, height_threshold
    - Detect peaks using parameter values
    - Return peak positions and properties
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 14.4 Implement peak fitting with parameters
    - Create or update peak fitting function to accept model, tolerance, max_iterations
    - Fit peaks using Gaussian, Lorentzian, or Pseudo-Voigt model
    - Apply convergence criteria from parameters
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 14.5 Implement reference matching with parameters
    - Create or update reference matching function to accept database, delta_tolerance, min_match_score, use_intensity
    - Match detected peaks to reference database
    - Apply tolerance and scoring criteria from parameters
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 15. Wire up real-time graph updates
  - [ ] 15.1 Use useMemo to recompute processing results
    - Wrap processing pipeline in `useMemo` hook
    - Add parameters as dependencies
    - Recompute when parameters change
    - _Requirements: 22.1_
  
  - [ ] 15.2 Update graph visualization with processed data
    - Pass processed data to Graph component
    - Update baseline curve when baseline parameters change
    - Update smoothed curve when smoothing parameters change
    - _Requirements: 3.5, 4.5, 22.1_
  
  - [ ] 15.3 Update peak markers on graph
    - Pass detected peaks to Graph component
    - Render peak markers at detected positions
    - Update markers when peak detection parameters change
    - _Requirements: 5.4, 22.2_
  
  - [ ] 15.4 Update fitted curves on graph
    - Pass fitted peak curves to Graph component
    - Render fitted curves overlaid on data
    - Update curves when peak fitting parameters change
    - _Requirements: 6.4, 22.3_
  
  - [ ] 15.5 Update confidence score
    - Compute confidence score based on peak detection quality and fit quality
    - Update score when parameters change
    - Display updated score in Processing Pipeline or Scientific Summary
    - _Requirements: 5.5, 6.5, 22.4_

- [ ] 16. Update Evidence Panel with parameter-driven results
  - Update phase identification results when reference matching parameters change
  - Display matched phases with confidence scores
  - _Requirements: 7.5_

- [ ]* 17. Write integration tests for XRD parameter flow
  - Test Auto Mode toggle hides/shows Params buttons
  - Test Params button opens drawer with correct step
  - Test drawer closes when Cancel or backdrop is clicked
  - Test Apply button applies changes and closes drawer
  - Test Reset button reverts to defaults
  - Test parameter change triggers graph update
  - Test peak markers update when prominence changes
  - Test navigation persistence (set params, navigate away, return)
  - Test conditional parameter visibility (ALS vs Polynomial)
  - _Requirements: 1.2, 1.3, 18.2, 18.4, 18.5, 18.6, 20.2, 22.1, 22.2_

- [ ] 18. Checkpoint - Ensure all tests pass and XRD workspace is fully functional
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Multi-Technique Rollout (Scale)

- [ ] 19. Create XPS parameter definitions
  - Add `XPS_PARAMETER_DEFINITIONS` to `src/data/parameterDefinitions.ts`
  - Define background subtraction parameters (method, iterations)
  - Define peak deconvolution parameters (model, num_components, constrain_fwhm)
  - Define energy calibration parameters (reference_peak, reference_energy)
  - Define assignment parameters (binding_energy_tolerance, satellite_check)
  - Create `XPS_DEFAULT_PARAMETERS` constant
  - _Requirements: 8.1, 8.2, 9.1, 9.2, 9.3, 10.1, 10.2, 11.1, 11.2_

- [ ] 20. Integrate parameters into XPSWorkspace
  - [ ] 20.1 Add parameter state management to XPSWorkspace
    - Import and use `useParameterPersistence('xps', XPS_DEFAULT_PARAMETERS)`
    - Add autoMode and expandedSteps state
    - _Requirements: 20.1, 20.5_
  
  - [ ] 20.2 Replace existing Processing Pipeline with new component
    - Render ProcessingPipeline with technique='xps'
    - Create processing status for 4 XPS steps
    - _Requirements: 21.1, 21.2_
  
  - [ ] 20.3 Implement XPS processing functions with parameters
    - Implement background subtraction (Shirley or Tougaard)
    - Implement peak deconvolution with num_components
    - Implement energy calibration with reference peak
    - Implement assignment with binding energy tolerance
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 11.1, 11.2, 11.3_
  
  - [ ] 20.4 Wire up graph updates for XPS
    - Update spectrum when background subtraction parameters change
    - Update component curves when deconvolution parameters change
    - Update binding energy axis when calibration parameters change
    - Update confidence score based on fit quality
    - _Requirements: 8.3, 8.4, 9.4, 9.5, 10.3, 10.4, 11.3, 11.4, 22.1, 22.3, 22.4_

- [ ] 21. Create Raman parameter definitions
  - Add `RAMAN_PARAMETER_DEFINITIONS` to `src/data/parameterDefinitions.ts`
  - Define baseline parameters (method, lambda, p)
  - Define peak detection parameters (prominence, min_distance)
  - Define mode assignment parameters (reference_library, tolerance)
  - Create `RAMAN_DEFAULT_PARAMETERS` constant
  - _Requirements: 12.1, 12.2, 12.3, 13.1, 13.2, 14.1, 14.2_

- [ ] 22. Integrate parameters into RamanWorkspace
  - [ ] 22.1 Add parameter state management to RamanWorkspace
    - Import and use `useParameterPersistence('raman', RAMAN_DEFAULT_PARAMETERS)`
    - Add autoMode and expandedSteps state
    - _Requirements: 20.1, 20.5_
  
  - [ ] 22.2 Replace existing Processing Pipeline with new component
    - Render ProcessingPipeline with technique='raman'
    - Create processing status for 3 Raman steps
    - _Requirements: 21.1, 21.2_
  
  - [ ] 22.3 Implement Raman processing functions with parameters
    - Implement baseline correction (ALS or Polynomial)
    - Implement peak detection with prominence and min_distance (cm⁻¹)
    - Implement mode assignment with reference library and tolerance
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 14.1, 14.2_
  
  - [ ] 22.4 Wire up graph updates for Raman
    - Update spectrum when baseline parameters change
    - Update peak markers when detection parameters change
    - Update mode assignments in Evidence Panel
    - Update confidence score
    - _Requirements: 12.4, 13.3, 13.4, 14.3, 14.4, 22.1, 22.2, 22.4_

- [ ] 23. Create FTIR parameter definitions
  - Add `FTIR_PARAMETER_DEFINITIONS` to `src/data/parameterDefinitions.ts`
  - Define baseline parameters (method)
  - Define peak detection parameters (prominence, min_distance)
  - Define band assignment parameters (library, tolerance)
  - Create `FTIR_DEFAULT_PARAMETERS` constant
  - _Requirements: 15.1, 16.1, 16.2, 17.1, 17.2_

- [ ] 24. Integrate parameters into FTIRWorkspace
  - [ ] 24.1 Add parameter state management to FTIRWorkspace
    - Import and use `useParameterPersistence('ftir', FTIR_DEFAULT_PARAMETERS)`
    - Add autoMode and expandedSteps state
    - _Requirements: 20.1, 20.5_
  
  - [ ] 24.2 Replace existing Processing Pipeline with new component
    - Render ProcessingPipeline with technique='ftir'
    - Create processing status for 3 FTIR steps
    - _Requirements: 21.1, 21.2_
  
  - [ ] 24.3 Implement FTIR processing functions with parameters
    - Implement baseline correction (Rubberband or Polynomial)
    - Implement peak detection with prominence and min_distance (cm⁻¹)
    - Implement band assignment with library and tolerance
    - _Requirements: 15.1, 15.2, 16.1, 16.2, 17.1, 17.2_
  
  - [ ] 24.4 Wire up graph updates for FTIR
    - Update spectrum when baseline parameters change
    - Update peak markers when detection parameters change
    - Update functional group assignments in Evidence Panel
    - Update confidence score
    - _Requirements: 15.2, 16.3, 16.4, 17.3, 17.4, 22.1, 22.2, 22.4_

- [ ]* 25. Write integration tests for all techniques
  - Test XPS parameter flow (background subtraction, deconvolution, calibration)
  - Test Raman parameter flow (baseline, peak detection, mode assignment)
  - Test FTIR parameter flow (baseline, peak detection, band assignment)
  - Test consistent UX across all 4 techniques
  - _Requirements: 8.3, 8.4, 9.4, 9.5, 10.3, 10.4, 11.3, 11.4, 12.4, 13.3, 13.4, 14.3, 14.4, 15.2, 16.3, 16.4, 17.3, 17.4_

- [ ] 26. Checkpoint - Ensure all tests pass and all 4 techniques are fully functional
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Polish and Documentation (Refinement)

- [ ] 27. Add performance optimizations
  - Implement debouncing for parameter changes (300ms delay)
  - Prevent unnecessary recomputation when parameters haven't changed
  - Optimize graph rendering performance
  - _Requirements: 22.1_

- [ ] 28. Add inline help tooltips
  - Add tooltip icons next to complex parameters (e.g., lambda, prominence)
  - Display scientific explanation in tooltip on hover
  - Keep tooltips concise (1-2 sentences)
  - _Requirements: 2.3, 2.4_

- [ ] 29. Add keyboard navigation support
  - Enable Tab navigation through parameter controls
  - Enable Enter/Space to toggle accordions
  - Enable Arrow keys for slider controls
  - Ensure focus indicators are visible
  - _Requirements: 18.1, 18.2_

- [ ] 30. Add error handling for processing failures
  - Wrap processing functions in try-catch blocks
  - Display error status in Processing Pipeline when processing fails
  - Show error message in step summary
  - Preserve previous valid graph state on error
  - Log errors to console for debugging
  - _Requirements: 19.4, 19.5_

- [ ] 31. Verify scientific accuracy
  - Review all parameter units (°2θ, eV, cm⁻¹) for correctness
  - Verify default values are scientifically reasonable
  - Verify parameter ranges match technique conventions
  - Verify terminology matches scientific literature
  - _Requirements: 2.3, 2.4, 23.1, 23.2, 23.3, 23.4, 23.5_

- [ ] 32. Conduct manual testing across all techniques
  - Test Auto Mode toggle for all 4 techniques
  - Test parameter persistence across navigation
  - Test conditional parameter visibility
  - Test validation warnings display correctly
  - Test graph updates smoothly for all parameter changes
  - Test all 4 techniques work correctly end-to-end
  - _Requirements: 1.1, 1.2, 1.3, 19.1, 19.2, 20.2, 22.1, 22.2, 22.3, 22.4_

- [ ] 33. Final checkpoint - Ensure production readiness
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at phase boundaries
- Implementation uses TypeScript with React hooks for state management
- All processing and persistence is client-side (no backend)
- Parameter system uses right-side drawer (not inline accordion or modal)
- Drawer slides from right edge and overlays the right panel
- Auto Mode is ON by default to maintain backward compatibility
- Parameter changes trigger real-time graph updates via useMemo recomputation
