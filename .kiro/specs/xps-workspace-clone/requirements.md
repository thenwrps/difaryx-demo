# Requirements Document: XPS Workspace Clone

## Introduction

This document specifies requirements for creating an XPS (X-ray Photoelectron Spectroscopy) Workspace as a domain-adapted clone of the existing XRD Workspace architecture. The XPS Workspace SHALL reuse the complete XRD Workspace architecture (layout, components, processing pipeline, parameter drawer system) while adapting the data model, processing steps, terminology, and scientific logic for XPS analysis.

This is NOT a greenfield feature. This is an architectural clone with domain-specific adaptations.

## Glossary

- **XPS_Workspace**: The new workspace page for X-ray Photoelectron Spectroscopy analysis
- **XRD_Workspace**: The existing workspace page for X-ray Diffraction analysis (template)
- **Binding_Energy**: The energy required to remove an electron from an atom (measured in eV)
- **Chemical_State**: The oxidation state and chemical environment of an element
- **Shirley_Background**: A commonly used background subtraction method in XPS
- **Processing_Pipeline**: The component displaying processing steps with Auto Mode toggle
- **Parameter_Drawer**: The right-side drawer for adjusting processing parameters
- **Peak_Fitting**: The process of fitting mathematical functions to XPS peaks
- **Energy_Calibration**: Correction of binding energy scale using reference peaks
- **DIFARYX_System**: The overall materials characterization platform

## Requirements

### Requirement 1: XPS Workspace Page Creation

**User Story:** As a materials scientist, I want an XPS workspace that follows the same architecture as XRD workspace, so that I have a consistent user experience across characterization techniques.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL be created at `src/pages/XPSWorkspace.tsx`
2. THE XPS_Workspace SHALL reuse the exact three-column layout from XRD_Workspace (left sidebar, center graph area, right sidebar)
3. THE XPS_Workspace SHALL import and reuse DashboardLayout, Graph, ProcessingPipeline, and ParameterDrawer components
4. THE XPS_Workspace SHALL NOT modify any existing XRD_Workspace files
5. THE XPS_Workspace SHALL NOT modify any shared layout components
6. THE XPS_Workspace SHALL maintain visual consistency with XRD_Workspace (colors, spacing, typography, component structure)

### Requirement 2: XPS Data Model

**User Story:** As a materials scientist, I want XPS data displayed with binding energy and intensity, so that I can analyze photoelectron spectra correctly.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL accept input data with Binding Energy (eV) as x-axis and Intensity (counts) as y-axis
2. THE XPS_Workspace SHALL display binding energy in descending order (high to low, left to right)
3. THE XPS_Workspace SHALL NOT use XRD-specific terms (2θ, d-spacing, hkl, lattice parameters, Miller indices)
4. THE XPS_Workspace SHALL use XPS-specific terms (Binding Energy, Chemical State, FWHM, Peak Area, Oxidation State)
5. THE XPS_Workspace SHALL store detected peaks with properties: id, position (eV), intensity (counts), fwhm (eV), area, assignment (chemical state)

### Requirement 3: XPS Processing Pipeline Steps

**User Story:** As a materials scientist, I want XPS-specific processing steps, so that I can analyze photoelectron spectra with appropriate methods.

#### Acceptance Criteria

1. THE Processing_Pipeline SHALL display exactly 6 XPS processing steps in order: Energy Calibration, Background Subtraction, Smoothing, Peak Detection, Peak Fitting, Chemical State Assignment
2. WHEN Auto Mode is enabled, THE Processing_Pipeline SHALL display step summaries with XPS-appropriate default parameters
3. WHEN Auto Mode is disabled, THE Processing_Pipeline SHALL display "Params" buttons for each step
4. THE Processing_Pipeline SHALL use XPS-appropriate units in step summaries (eV for energy, counts for intensity)
5. THE Processing_Pipeline SHALL NOT display XRD-specific step names (Baseline Correction, Reference Matching)

### Requirement 4: XPS Parameter Definitions

**User Story:** As a materials scientist, I want to adjust XPS processing parameters, so that I can optimize analysis for different samples.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL define XpsParameters type with 6 step parameter interfaces: energyCalibration, backgroundSubtraction, smoothing, peakDetection, peakFitting, chemicalStateAssignment
2. THE XPS_Workspace SHALL define default parameters for all 6 processing steps
3. THE Energy_Calibration parameters SHALL include: reference_peak (C1s/Au4f7/Ag3d5), shift_value (eV)
4. THE Background_Subtraction parameters SHALL include: method (Shirley/Linear), smoothing_factor (0.0-1.0)
5. THE Smoothing parameters SHALL include: method (Moving Average), window_size (3-21, odd)
6. THE Peak_Detection parameters SHALL include: prominence (0.0-1.0), min_distance (eV)
7. THE Peak_Fitting parameters SHALL include: model (Gaussian/Lorentzian/Pseudo-Voigt), tolerance (1e-6 to 1e-2), max_iterations (10-1000)
8. THE Chemical_State_Assignment parameters SHALL include: database (NIST XPS/PHI Handbook), binding_energy_tolerance (eV), use_intensity (boolean)

### Requirement 5: XPS Graph Visualization

**User Story:** As a materials scientist, I want to see XPS spectra with reversed x-axis and peak markers, so that I can interpret binding energy data correctly.

#### Acceptance Criteria

1. THE Graph component SHALL display XPS data with x-axis reversed (high binding energy on left, low on right)
2. THE Graph component SHALL display x-axis label as "Binding Energy (eV)"
3. THE Graph component SHALL display y-axis label as "Intensity (counts)"
4. THE Graph component SHALL display peak markers at detected peak positions
5. THE Graph component SHALL display background/baseline data when available
6. THE Graph component SHALL support the same tab structure as XRD_Workspace (Pattern, Peak List, Reference Overlay tabs)

### Requirement 6: XPS Peak List Display

**User Story:** As a materials scientist, I want to see a table of detected XPS peaks with binding energies and assignments, so that I can review peak identification results.

#### Acceptance Criteria

1. THE Peak_List tab SHALL display a table with columns: #, Binding Energy (eV), Intensity, FWHM (eV), Area, Assignment
2. THE Peak_List tab SHALL display binding energies with 2 decimal precision
3. THE Peak_List tab SHALL display FWHM values with 2 decimal precision
4. THE Peak_List tab SHALL display chemical state assignments (e.g., "Cu²⁺", "Cu⁺", "Cu⁰")
5. THE Peak_List tab SHALL display a Quality Metrics panel showing: Peaks, Matched, SNR, Unassigned, Data Points, Confidence

### Requirement 7: XPS Chemical State Matching

**User Story:** As a materials scientist, I want to see how observed peaks match reference binding energies, so that I can validate chemical state assignments.

#### Acceptance Criteria

1. THE Reference_Overlay tab SHALL display a table with columns: BE obs (eV), BE ref (eV), ΔBE (eV), Assignment
2. THE Reference_Overlay tab SHALL display binding energy differences with 3 decimal precision
3. THE Reference_Overlay tab SHALL display chemical state assignments with oxidation states
4. THE Reference_Overlay tab SHALL show match count in tab badge (e.g., "5/8" for 5 matched out of 8 reference peaks)
5. WHEN no matches exist, THE Reference_Overlay tab SHALL display "No matches" message

### Requirement 8: XPS Scientific Summary

**User Story:** As a materials scientist, I want to see a scientific summary of XPS results, so that I can quickly understand the chemical state interpretation.

#### Acceptance Criteria

1. THE Scientific_Summary panel SHALL display: Primary Element, Chemical States, Findings (top 2), Reliability
2. THE Scientific_Summary panel SHALL display chemical state interpretation (e.g., "Cu²⁺ dominant with minor Cu⁺")
3. THE Scientific_Summary panel SHALL display confidence level badge (high/medium/low)
4. THE Scientific_Summary panel SHALL display reliability as "X/Y matched, Z unassigned"
5. THE Scientific_Summary panel SHALL NOT display XRD-specific terms (phase, spinel structure, lattice parameters)

### Requirement 9: XPS Evidence Snapshot

**User Story:** As a materials scientist, I want to see top evidence peaks in the sidebar, so that I can quickly review key assignments.

#### Acceptance Criteria

1. THE Evidence_Snapshot panel SHALL display top 3 matched peaks
2. THE Evidence_Snapshot panel SHALL display for each peak: peak number, chemical state assignment, binding energy (eV), ΔBE (eV), intensity
3. THE Evidence_Snapshot panel SHALL display binding energies with 2 decimal precision
4. THE Evidence_Snapshot panel SHALL display ΔBE with 3 decimal precision
5. WHEN no matches exist, THE Evidence_Snapshot panel SHALL display "No matches" message

### Requirement 10: XPS Validation Recommendations

**User Story:** As a materials scientist, I want to see recommended validation techniques, so that I can confirm XPS results with complementary methods.

#### Acceptance Criteria

1. THE Validation panel SHALL display XPS-appropriate validation recommendations
2. THE Validation panel SHALL suggest complementary techniques (e.g., "XRD for phase confirmation", "Raman for oxidation states", "FTIR for bonding")
3. THE Validation panel SHALL include "Agent Mode" button linking to autonomous agent workflow
4. THE Validation panel SHALL NOT display XRD-specific validation recommendations
5. THE Validation panel SHALL display at least 3 validation recommendations

### Requirement 11: XPS Caveats Display

**User Story:** As a materials scientist, I want to see analysis caveats, so that I understand limitations and uncertainties in XPS results.

#### Acceptance Criteria

1. THE Caveats panel SHALL display XPS-specific caveats and limitations
2. THE Caveats panel SHALL include warning icon (AlertTriangle)
3. THE Caveats panel SHALL display caveats as bulleted list
4. THE Caveats panel SHALL include caveats about: charging effects, surface sensitivity, peak overlap, reference database limitations
5. THE Caveats panel SHALL NOT display XRD-specific caveats (preferred orientation, crystallite size)

### Requirement 12: XPS Parameter Persistence

**User Story:** As a materials scientist, I want my XPS parameter adjustments saved, so that I can maintain consistent settings across sessions.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL use useParameterPersistence hook with technique identifier 'xps'
2. WHEN parameters are changed, THE XPS_Workspace SHALL persist parameters to localStorage
3. WHEN XPS_Workspace is reopened, THE XPS_Workspace SHALL restore parameters from localStorage
4. WHEN Auto Mode is enabled, THE XPS_Workspace SHALL reset parameters to XPS defaults
5. THE XPS_Workspace SHALL NOT share parameter storage with XRD_Workspace

### Requirement 13: XPS Dataset Selection

**User Story:** As a materials scientist, I want to select XPS datasets from a dropdown, so that I can analyze different samples.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL display dataset selector in left sidebar
2. THE XPS_Workspace SHALL load XPS demo datasets from data file
3. THE XPS_Workspace SHALL display dataset label and filename
4. WHEN dataset is changed, THE XPS_Workspace SHALL recompute processing results
5. THE XPS_Workspace SHALL support URL query parameter for initial dataset selection

### Requirement 14: XPS Project Integration

**User Story:** As a materials scientist, I want XPS workspace integrated with DIFARYX projects, so that I can access XPS analysis from project dashboard.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL accept project ID from URL query parameter
2. THE XPS_Workspace SHALL display project selector in left sidebar
3. THE XPS_Workspace SHALL provide "Open Notebook" button linking to project notebook
4. THE XPS_Workspace SHALL provide "Run Agent" button linking to autonomous agent workflow
5. THE XPS_Workspace SHALL display project material description

### Requirement 15: XPS Route Configuration

**User Story:** As a materials scientist, I want to access XPS workspace via `/workspace/xps` route, so that I can navigate to XPS analysis.

#### Acceptance Criteria

1. THE application router SHALL define route `/workspace/xps` pointing to XPS_Workspace component
2. THE route SHALL support query parameters: project, dataset
3. THE route SHALL be accessible from dashboard and navigation
4. THE route SHALL NOT conflict with existing XRD route
5. THE route SHALL follow DIFARYX routing conventions

### Requirement 16: XPS Demo Data

**User Story:** As a materials scientist, I want XPS demo datasets available, so that I can explore XPS workspace functionality.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL define at least 2 XPS demo datasets
2. THE XPS demo datasets SHALL include: dataset id, label, sampleName, fileName, dataPoints (binding energy, intensity pairs)
3. THE XPS demo datasets SHALL use realistic XPS data (binding energy range 0-1000 eV, appropriate peak shapes)
4. THE XPS demo datasets SHALL be stored in `src/data/xpsDemoDatasets.ts`
5. THE XPS demo datasets SHALL follow the same structure as XRD demo datasets

### Requirement 17: XPS Processing Agent

**User Story:** As a materials scientist, I want XPS data processed automatically, so that I can see peak detection and chemical state assignment results.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL implement XPS processing agent function
2. THE XPS processing agent SHALL accept input: datasetId, sampleName, sourceLabel, dataPoints, optional processing parameters
3. THE XPS processing agent SHALL return: detectedPeaks, candidates (chemical state assignments), conflicts, interpretation, validation, baselineData
4. THE XPS processing agent SHALL perform: energy calibration, background subtraction, smoothing, peak detection, peak fitting, chemical state assignment
5. THE XPS processing agent SHALL be stored in `src/agents/xpsAgent.ts`

### Requirement 18: XPS Type Definitions

**User Story:** As a developer, I want XPS type definitions, so that I can maintain type safety in XPS workspace implementation.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL define XpsParameters interface in `src/types/parameters.ts`
2. THE XPS_Workspace SHALL define XpsAgentResult interface in `src/agents/xpsAgent.ts`
3. THE XPS_Workspace SHALL define XpsDetectedPeak interface with properties: id, position, intensity, fwhm, area, assignment
4. THE XPS_Workspace SHALL define XpsChemicalStateCandidate interface with properties: element, oxidationState, bindingEnergy, matches, score
5. THE XPS_Workspace SHALL follow TypeScript strict mode conventions

### Requirement 19: XPS Auto Mode Behavior

**User Story:** As a materials scientist, I want Auto Mode to apply optimal XPS defaults, so that I can get good results without manual tuning.

#### Acceptance Criteria

1. WHEN Auto Mode is enabled, THE XPS_Workspace SHALL use default parameters for all processing steps
2. WHEN Auto Mode is enabled, THE Parameter_Drawer SHALL be closed
3. WHEN Auto Mode is disabled, THE XPS_Workspace SHALL display "Params" buttons for each processing step
4. WHEN Auto Mode is toggled on, THE XPS_Workspace SHALL reset all parameters to defaults
5. THE Auto Mode toggle SHALL be displayed in Processing_Pipeline header

### Requirement 20: XPS Parameter Drawer Integration

**User Story:** As a materials scientist, I want to adjust XPS parameters via drawer, so that I can fine-tune processing for specific samples.

#### Acceptance Criteria

1. WHEN "Params" button is clicked, THE Parameter_Drawer SHALL open with XPS-specific parameters for that step
2. THE Parameter_Drawer SHALL display step label and method name
3. THE Parameter_Drawer SHALL render parameter controls based on XPS parameter definitions
4. WHEN "Apply" is clicked, THE Parameter_Drawer SHALL close and recompute XPS results
5. WHEN "Reset" is clicked, THE Parameter_Drawer SHALL restore XPS default parameters for that step

