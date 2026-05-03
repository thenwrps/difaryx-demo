# Implementation Plan: XPS Workspace Clone

## Overview

This implementation plan creates an XPS (X-ray Photoelectron Spectroscopy) Workspace as a domain-adapted architectural clone of the existing XRD Workspace. The approach follows a **reuse-first architecture**: clone XRD components, adapt XPS-specific logic, and maintain 100% visual consistency.

**Key Principles:**
- Clone, don't redesign
- Reuse all UI components (DashboardLayout, Graph, ProcessingPipeline, ParameterDrawer)
- Do NOT modify XRD workspace files
- Do NOT modify shared layout components
- Adapt only: data model, processing logic, terminology, chemical state database

**Estimated Scope:** ~1,950 lines new/adapted code, ~2,000 lines reused

## Tasks

- [ ] 1. Create XPS type definitions and interfaces
  - Create `src/agents/xpsAgent/types.ts` with XPS-specific interfaces
  - Define XpsPoint, XpsPreprocessedPoint, XpsDetectedPeak interfaces
  - Define XpsChemicalStateCandidate, XpsPeakMatch, XpsReferenceState interfaces
  - Define XpsAgentInput, XpsAgentResult, XpsInterpretation interfaces
  - Define XpsValidationResult, XpsConflictAnalysis, XpsExecutionLogEntry interfaces
  - Remove XRD-specific fields (hkl, dSpacing, crystalSystem, latticeParameters)
  - Add XPS-specific fields (oxidationState, chemicalEnvironment, bindingEnergy, fwhm, area)
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 18.1, 18.3, 18.4_

- [ ] 2. Create XPS chemical state reference database
  - Create `src/data/xpsChemicalStateDatabase.ts`
  - Define XpsChemicalStateDatabase interface
  - Implement reference binding energies for Cu (Cu⁰, Cu⁺, Cu²⁺)
  - Implement reference binding energies for Fe (Fe⁰, Fe²⁺, Fe³⁺)
  - Implement reference binding energies for O (O²⁻ oxide, O²⁻ hydroxide)
  - Include tolerance (±0.3 eV), relative intensity, chemical environment for each state
  - Export XPS_CHEMICAL_STATE_DATABASE constant
  - _Requirements: 2.4, 4.8, 7.3, 17.1_

- [ ] 3. Create XPS demo datasets
  - Create `src/data/xpsDemoDatasets.ts`
  - Define 2-3 XPS demo datasets with realistic binding energy data (0-1000 eV range)
  - Include Cu 2p region dataset (binding energy 925-945 eV)
  - Include Fe 2p region dataset (binding energy 700-720 eV)
  - Include O 1s region dataset (binding energy 525-540 eV)
  - Each dataset: id, label, sampleName, fileName, dataPoints (x: binding energy, y: intensity)
  - Export XPS_DEMO_DATASETS array and getXpsDemoDataset() function
  - _Requirements: 2.1, 2.2, 13.2, 13.3, 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 4. Implement XPS processing functions (Part 1: Preprocessing)
  - Create `src/agents/xpsAgent/runner.ts`
  - [ ] 4.1 Implement validate_xps_input() function
    - Validate minimum 50 data points
    - Validate binding energy range (0-1200 eV)
    - Return XpsValidationResult with errors, warnings, pointCount, xRange
    - _Requirements: 2.1, 2.2, 17.2, 17.3_
  
  - [ ] 4.2 Implement calibrate_xps_energy() function
    - Apply energy shift correction based on reference peak (C1s: 284.8 eV, Au4f7: 84.0 eV, Ag3d5: 368.3 eV)
    - Shift all x-values by shift_value parameter
    - Return calibrated XpsPoint array
    - _Requirements: 4.3, 17.4_
  
  - [ ] 4.3 Implement subtract_xps_background() function
    - Implement Shirley background subtraction (iterative algorithm)
    - Implement Linear background subtraction (fallback)
    - Apply smoothing_factor parameter
    - Return XpsPreprocessedPoint array with baselineIntensity calculated
    - _Requirements: 4.4, 17.4_
  
  - [ ] 4.4 Implement smooth_xps_data() function
    - Apply moving average smoothing (reuse XRD smoothing logic)
    - Use window_size parameter (3-21, odd)
    - Update smoothedIntensity field in XpsPreprocessedPoint
    - _Requirements: 4.5, 17.4_

- [ ] 5. Implement XPS processing functions (Part 2: Peak Analysis)
  - [ ] 5.1 Implement detect_xps_peaks() function
    - Detect local maxima in smoothed, background-subtracted data
    - Apply prominence threshold (0.0-1.0)
    - Apply min_distance threshold (eV)
    - Calculate FWHM (Full Width at Half Maximum) for each peak
    - Calculate peak area (integrated intensity)
    - Return XpsDetectedPeak array with id, position, intensity, fwhm, area
    - _Requirements: 4.6, 17.4_
  
  - [ ] 5.2 Implement fit_xps_peaks() function
    - Fit Gaussian, Lorentzian, or Pseudo-Voigt models to detected peaks
    - Use non-linear least squares fitting (similar to XRD)
    - Apply tolerance and max_iterations parameters
    - Refine peak position, intensity, fwhm, area
    - Return refined XpsDetectedPeak array
    - _Requirements: 4.7, 17.4_
  
  - [ ] 5.3 Implement assign_chemical_states() function
    - Match detected peaks to reference binding energies from database
    - Apply binding_energy_tolerance parameter (default ±0.3 eV)
    - Optionally use intensity matching (use_intensity parameter)
    - Calculate match score based on binding energy difference and intensity agreement
    - Return XpsChemicalStateCandidate array with element, oxidationState, matches, score
    - _Requirements: 4.8, 7.1, 7.2, 7.3, 17.4_

- [ ] 6. Implement XPS agent orchestration and interpretation
  - [ ] 6.1 Implement analyze_xps_conflicts() function
    - Identify unassigned peaks (no chemical state match)
    - Identify overlapping peaks (multiple states at similar binding energy)
    - Calculate confidence level based on match quality
    - Return XpsConflictAnalysis with primaryCandidate, unassignedPeaks, notes
    - _Requirements: 8.4, 17.3_
  
  - [ ] 6.2 Implement generate_xps_interpretation() function
    - Generate primary element identification (e.g., "Cu")
    - Generate chemical state summary (e.g., "Cu²⁺ dominant with minor Cu⁺")
    - Generate findings list (top 2 matched peaks)
    - Calculate confidence score (0-100) and level (high/medium/low)
    - Generate XPS-specific caveats (charging effects, surface sensitivity, peak overlap)
    - Return XpsInterpretation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 11.1, 11.2, 11.3, 11.4, 11.5, 17.3_
  
  - [ ] 6.3 Implement runXpsAgent() orchestration function
    - Accept XpsAgentInput and optional XpsProcessingParams
    - Execute processing pipeline: validate → calibrate → subtract background → smooth → detect peaks → fit peaks → assign states
    - Build execution log with step status and summaries
    - Generate interpretation and conflict analysis
    - Return XpsAgentResult with all intermediate and final results
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 7. Checkpoint - Verify XPS agent processing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Add XPS parameter definitions to parameter registry
  - Open `src/data/parameterDefinitions.ts`
  - [ ] 8.1 Define XPS_ENERGY_CALIBRATION_DEFINITIONS
    - reference_peak: select (C1s/Au4f7/Ag3d5)
    - shift_value: number (eV, -5.0 to 5.0, step 0.1, default 0.0)
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 8.2 Define XPS_BACKGROUND_SUBTRACTION_DEFINITIONS
    - method: select (Shirley/Linear)
    - smoothing_factor: number (0.0-1.0, step 0.05, default 0.5)
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [ ] 8.3 Define XPS_SMOOTHING_DEFINITIONS
    - method: select (Moving Average)
    - window_size: number (3-21, step 2, default 5, must be odd)
    - _Requirements: 4.1, 4.2, 4.5_
  
  - [ ] 8.4 Define XPS_PEAK_DETECTION_DEFINITIONS
    - prominence: number (0.0-1.0, step 0.01, default 0.1)
    - min_distance: number (eV, 0.1-2.0, step 0.1, default 0.5)
    - _Requirements: 4.1, 4.2, 4.6_
  
  - [ ] 8.5 Define XPS_PEAK_FITTING_DEFINITIONS
    - model: select (Gaussian/Lorentzian/Pseudo-Voigt)
    - tolerance: number (1e-6 to 1e-2, step 1e-6, default 1e-4)
    - max_iterations: number (10-1000, step 10, default 100)
    - _Requirements: 4.1, 4.2, 4.7_
  
  - [ ] 8.6 Define XPS_CHEMICAL_STATE_ASSIGNMENT_DEFINITIONS
    - database: select (NIST XPS/PHI Handbook)
    - binding_energy_tolerance: number (eV, 0.1-1.0, step 0.05, default 0.3)
    - use_intensity: boolean (default true)
    - _Requirements: 4.1, 4.2, 4.8_
  
  - [ ] 8.7 Create XPS_PARAMETER_DEFINITIONS registry
    - Combine all XPS parameter definitions into registry object
    - Export XPS_PARAMETER_DEFINITIONS constant
    - _Requirements: 4.1, 4.2_
  
  - [ ] 8.8 Create XPS_DEFAULT_PARAMETERS constant
    - Define default values for all 6 XPS processing steps
    - Export XPS_DEFAULT_PARAMETERS
    - _Requirements: 4.2, 19.1_
  
  - [ ] 8.9 Update getStepParameterDefinitions() helper
    - Add 'xps' case to technique switch
    - Return XPS parameter definitions for XPS steps
    - _Requirements: 4.1, 20.1, 20.2_
  
  - [ ] 8.10 Update getDefaultParameters() helper
    - Add 'xps' case to technique switch
    - Return XPS_DEFAULT_PARAMETERS
    - _Requirements: 4.2, 19.1_

- [ ] 9. Add XpsParameters type to parameters type file
  - Open `src/types/parameters.ts`
  - Define XpsParameters interface with 6 step parameter interfaces
  - energyCalibration: { reference_peak, shift_value }
  - backgroundSubtraction: { method, smoothing_factor }
  - smoothing: { method, window_size }
  - peakDetection: { prominence, min_distance }
  - peakFitting: { model, tolerance, max_iterations }
  - chemicalStateAssignment: { database, binding_energy_tolerance, use_intensity }
  - Export XpsParameters type
  - _Requirements: 4.1, 18.1, 18.2_

- [ ] 10. Update Graph component for XPS reversed axis support
  - Open `src/components/ui/Graph.tsx`
  - Add type prop support: 'xrd' | 'xps' | 'ftir' | 'raman'
  - When type='xps', reverse x-axis direction (high to low, left to right)
  - When type='xps', set x-axis label to "Binding Energy (eV)"
  - When type='xps', set y-axis label to "Intensity (counts)"
  - Maintain all other graph functionality (zoom, pan, markers, baseline)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 11. Clone and adapt XPS Workspace component
  - [ ] 11.1 Create `src/pages/XPSWorkspace.tsx` by cloning XRDWorkspace.tsx
    - Copy entire XRDWorkspace.tsx file structure
    - Rename component to XPSWorkspace
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 11.2 Update imports for XPS-specific modules
    - Import XPS_DEMO_DATASETS, getXpsDemoDataset from xpsDemoDatasets
    - Import runXpsAgent from xpsAgent/runner
    - Import XpsAgentResult, XpsDetectedPeak from xpsAgent/types
    - Import XPS_DEFAULT_PARAMETERS from parameterDefinitions
    - Import XpsParameters type
    - _Requirements: 1.3, 13.2_
  
  - [ ] 11.3 Update state management for XPS
    - Change parameter persistence key from 'xrd' to 'xps'
    - Use XPS_DEFAULT_PARAMETERS for default state
    - Update dataset selection to use XPS_DEMO_DATASETS
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.4_
  
  - [ ] 11.4 Update agent execution for XPS
    - Call runXpsAgent() instead of runXrdPhaseIdentificationAgent()
    - Pass XPS parameters when Auto Mode is OFF
    - Map XPS parameters to processing params format
    - _Requirements: 17.1, 17.2, 17.3, 19.1, 19.2, 19.3, 19.4_
  
  - [ ] 11.5 Update processing status labels for XPS
    - Change step labels: "Energy Calibration", "Background Subtraction", "Smoothing", "Peak Detection", "Peak Fitting", "Chemical State Assignment"
    - Update step summaries with XPS-appropriate units (eV, counts)
    - Update parameter display in summaries (reference peak, Shirley method, etc.)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 11.6 Update graph rendering for XPS
    - Pass type="xps" to Graph component
    - Update peak markers to show chemical state assignments instead of hkl
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 11.7 Update Peak List tab for XPS
    - Change table columns: #, Binding Energy (eV), Intensity, FWHM (eV), Area, Assignment
    - Display binding energy with 2 decimal precision
    - Display FWHM with 2 decimal precision
    - Display chemical state assignments (e.g., "Cu²⁺", "Cu⁺", "Cu⁰")
    - Update Quality Metrics panel: Peaks, Matched, SNR, Unassigned, Data Points, Confidence
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 11.8 Update Reference Overlay tab for XPS
    - Change table columns: BE obs (eV), BE ref (eV), ΔBE (eV), Assignment
    - Display binding energy differences with 3 decimal precision
    - Display chemical state assignments with oxidation states
    - Update tab badge to show match count (e.g., "5/8")
    - Display "No matches" message when no matches exist
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 11.9 Update Scientific Summary panel for XPS
    - Display: Primary Element, Chemical States, Findings (top 2), Reliability
    - Display chemical state interpretation (e.g., "Cu²⁺ dominant with minor Cu⁺")
    - Display confidence level badge (high/medium/low)
    - Display reliability as "X/Y matched, Z unassigned"
    - Remove XRD-specific terms (phase, spinel structure, lattice parameters)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 11.10 Update Evidence Snapshot panel for XPS
    - Display top 3 matched peaks
    - For each peak: peak number, chemical state assignment, binding energy (eV), ΔBE (eV), intensity
    - Display binding energies with 2 decimal precision
    - Display ΔBE with 3 decimal precision
    - Display "No matches" message when no matches exist
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 11.11 Update Validation panel for XPS
    - Display XPS-appropriate validation recommendations
    - Suggest complementary techniques: "XRD for phase confirmation", "Raman for oxidation states", "FTIR for bonding"
    - Include "Agent Mode" button linking to autonomous agent workflow
    - Remove XRD-specific validation recommendations
    - Display at least 3 validation recommendations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 11.12 Update Caveats panel for XPS
    - Display XPS-specific caveats: charging effects, surface sensitivity (5-10 nm), peak overlap, reference database limitations
    - Include warning icon (AlertTriangle)
    - Display caveats as bulleted list
    - Remove XRD-specific caveats (preferred orientation, crystallite size)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 11.13 Update terminology throughout component
    - Replace "2θ (degrees)" with "Binding Energy (eV)"
    - Replace "d-spacing (Å)" with "FWHM (eV)"
    - Replace "Intensity (a.u.)" with "Intensity (counts)"
    - Replace "hkl" with "Chemical State"
    - Replace "Phase" with "Element"
    - Replace "Reference Matching" with "Chemical State Assignment"
    - _Requirements: 2.3, 2.4_

- [ ] 12. Update project integration for XPS
  - [ ] 12.1 Update project selector to work with XPS workspace
    - Ensure project ID from URL query parameter is read correctly
    - Display project selector in left sidebar
    - _Requirements: 14.1, 14.2_
  
  - [ ] 12.2 Update navigation buttons for XPS
    - "Open Notebook" button links to project notebook with XPS context
    - "Run Agent" button links to autonomous agent workflow with XPS context
    - Display project material description
    - _Requirements: 14.3, 14.4, 14.5_

- [ ] 13. Add XPS route to application router
  - Open `src/App.tsx` (or router configuration file)
  - Add route `/workspace/xps` pointing to XPSWorkspace component
  - Support query parameters: project, dataset
  - Ensure route does not conflict with existing XRD route
  - Follow DIFARYX routing conventions
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 14. Checkpoint - Test XPS workspace integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Final integration and polish
  - [ ] 15.1 Verify visual consistency with XRD workspace
    - Check layout dimensions match (left sidebar: 288px, right sidebar: 380px)
    - Check typography matches (section headers, labels, values)
    - Check colors match (primary, success, warning, error, borders)
    - Check spacing matches (compact sections, standard sections, gaps)
    - _Requirements: 1.5, 1.6_
  
  - [ ] 15.2 Verify parameter persistence works correctly
    - Test parameter changes are saved to localStorage
    - Test parameters are restored on page reload
    - Test Auto Mode reset clears custom parameters
    - Test XPS parameters don't interfere with XRD parameters
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 15.3 Verify dataset selection and URL parameters
    - Test dataset dropdown changes trigger recomputation
    - Test URL query parameter ?dataset=... loads correct dataset
    - Test URL query parameter ?project=... loads correct project
    - _Requirements: 13.1, 13.3, 13.4, 13.5, 14.1, 14.2_
  
  - [ ] 15.4 Verify Auto Mode and Parameter Drawer behavior
    - Test Auto Mode toggle enables/disables parameter controls
    - Test "Params" buttons open drawer with correct step parameters
    - Test "Apply" button closes drawer and recomputes results
    - Test "Reset" button restores default parameters for step
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 20.1, 20.2, 20.3, 20.4, 20.5_
  
  - [ ] 15.5 Verify all XPS-specific terminology is correct
    - Check no XRD terms remain (2θ, d-spacing, hkl, phase, lattice)
    - Check all XPS terms are present (Binding Energy, Chemical State, FWHM, Oxidation State)
    - Check units are correct (eV for energy, counts for intensity)
    - _Requirements: 2.3, 2.4, 2.5_

- [ ] 16. Final checkpoint - Complete XPS workspace implementation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- **Clone-and-Adapt Strategy**: This implementation follows a strict clone-and-adapt pattern. XRDWorkspace.tsx serves as the template, and XPSWorkspace.tsx is created by copying and adapting XPS-specific elements.

- **Reuse-First Architecture**: 100% of UI components (DashboardLayout, Graph, ProcessingPipeline, ParameterDrawer) are reused without modification. Only data model, processing logic, and terminology are adapted.

- **Do NOT Modify**: XRDWorkspace.tsx, shared layout components, Agent Mode, or any existing XRD files.

- **TypeScript Implementation**: All code is implemented in TypeScript with strict type safety.

- **Processing Pipeline**: XPS uses 6 processing steps (Energy Calibration → Background Subtraction → Smoothing → Peak Detection → Peak Fitting → Chemical State Assignment), mirroring XRD's 5-step structure.

- **Chemical State Database**: XPS uses a binding energy reference database (similar to XRD's phase database) with Cu, Fe, O oxidation states.

- **Reversed X-Axis**: XPS binding energy is displayed in descending order (high to low, left to right), requiring Graph component adaptation.

- **Parameter Definitions**: XPS parameter definitions follow the same structure as XRD, enabling reuse of ParameterDrawer and ParameterControl components.

- **Demo Datasets**: XPS demo datasets include realistic binding energy ranges (0-1000 eV) with Cu 2p, Fe 2p, and O 1s regions.

- **Estimated LOC**: ~1,950 lines new/adapted code, ~2,000 lines reused from XRD workspace and shared components.

## Requirements Coverage

All 20 requirements from the requirements document are covered by implementation tasks:
- Requirement 1 (Workspace Creation): Tasks 11.1-11.3
- Requirement 2 (Data Model): Tasks 1, 2.4, 11.13
- Requirement 3 (Processing Pipeline): Tasks 11.5
- Requirement 4 (Parameter Definitions): Tasks 8.1-8.10, 9
- Requirement 5 (Graph Visualization): Task 10
- Requirement 6 (Peak List Display): Task 11.7
- Requirement 7 (Chemical State Matching): Task 11.8
- Requirement 8 (Scientific Summary): Task 11.9
- Requirement 9 (Evidence Snapshot): Task 11.10
- Requirement 10 (Validation Recommendations): Task 11.11
- Requirement 11 (Caveats Display): Task 11.12
- Requirement 12 (Parameter Persistence): Tasks 11.3, 15.2
- Requirement 13 (Dataset Selection): Tasks 11.3, 15.3
- Requirement 14 (Project Integration): Task 12
- Requirement 15 (Route Configuration): Task 13
- Requirement 16 (Demo Data): Task 3
- Requirement 17 (Processing Agent): Tasks 4, 5, 6
- Requirement 18 (Type Definitions): Tasks 1, 9
- Requirement 19 (Auto Mode Behavior): Tasks 11.4, 15.4
- Requirement 20 (Parameter Drawer Integration): Tasks 11.4, 15.4
