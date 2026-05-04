# Requirements Document: FTIR Workspace Clone

## Introduction

This document specifies requirements for creating an FTIR (Fourier Transform Infrared Spectroscopy) Workspace as a domain-adapted clone of the existing XRD/XPS Workspace architecture. The FTIR Workspace SHALL reuse 100% of the XRD/XPS Workspace architecture (three-column layout, ProcessingPipeline component, ParameterDrawer component, Graph component) while adapting the data model, processing steps, terminology, and scientific logic for FTIR analysis.

This is NOT a greenfield feature. This is an architectural clone with domain-specific adaptations for FTIR spectroscopy, particularly for catalyst and materials characterization workflows.

## Glossary

- **FTIR_Workspace**: The new workspace page for Fourier Transform Infrared Spectroscopy analysis
- **XRD_Workspace**: The existing workspace page for X-ray Diffraction analysis (architectural template)
- **XPS_Workspace**: The existing workspace page for X-ray Photoelectron Spectroscopy analysis (architectural template)
- **Wavenumber**: The reciprocal of wavelength, measured in cm⁻¹ (inverse centimeters)
- **Absorbance**: The logarithmic measure of light absorption by a sample
- **Transmittance**: The fraction of incident light that passes through a sample
- **Functional_Group**: A specific group of atoms within a molecule responsible for characteristic chemical reactions
- **Band_Assignment**: The process of matching observed FTIR bands to known functional groups
- **Baseline_Correction**: Removal of background signal from FTIR spectrum
- **Processing_Pipeline**: The component displaying processing steps with Auto Mode toggle
- **Parameter_Drawer**: The right-side drawer for adjusting processing parameters
- **DIFARYX_System**: The overall materials characterization platform

## Requirements

### Requirement 1: FTIR Workspace Page Creation

**User Story:** As a materials scientist, I want an FTIR workspace that follows the same architecture as XRD/XPS workspaces, so that I have a consistent user experience across characterization techniques.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL be created at `src/pages/FTIRWorkspace.tsx`
2. THE FTIR_Workspace SHALL reuse the exact three-column layout from XPS_Workspace (left sidebar, center graph area, right sidebar)
3. THE FTIR_Workspace SHALL import and reuse DashboardLayout, Graph, ProcessingPipeline, and ParameterDrawer components
4. THE FTIR_Workspace SHALL NOT modify any existing XRD_Workspace files
5. THE FTIR_Workspace SHALL NOT modify any existing XPS_Workspace files
6. THE FTIR_Workspace SHALL NOT modify any shared layout components
7. THE FTIR_Workspace SHALL maintain visual consistency with XRD/XPS workspaces (colors, spacing, typography, component structure)

### Requirement 2: FTIR Data Model

**User Story:** As a materials scientist, I want FTIR data displayed with wavenumber and absorbance/transmittance, so that I can analyze infrared spectra correctly.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL accept input data with Wavenumber (cm⁻¹) as x-axis and Absorbance or Transmittance as y-axis
2. THE FTIR_Workspace SHALL display wavenumber in descending order (high wavenumber on left, low wavenumber on right)
3. THE FTIR_Workspace SHALL NOT use XRD-specific terms (2θ, d-spacing, hkl, lattice parameters, Miller indices)
4. THE FTIR_Workspace SHALL NOT use XPS-specific terms (Binding Energy, Chemical State, Oxidation State)
5. THE FTIR_Workspace SHALL use FTIR-specific terms (Wavenumber, Absorbance, Transmittance, Functional Group, Band Assignment, FWHM)
6. THE FTIR_Workspace SHALL store detected bands with properties: id, wavenumber (cm⁻¹), intensity (absorbance units), fwhm (cm⁻¹), area (integrated intensity), assignment (functional group)

### Requirement 3: FTIR Processing Pipeline Steps

**User Story:** As a materials scientist, I want FTIR-specific processing steps, so that I can analyze infrared spectra with appropriate methods.

#### Acceptance Criteria

1. THE Processing_Pipeline SHALL display exactly 6 FTIR processing steps in order: Baseline Correction, Smoothing, Peak Detection, Band Assignment, Functional Group Matching, Interpretation Summary
2. WHEN Auto Mode is enabled, THE Processing_Pipeline SHALL display step summaries with FTIR-appropriate default parameters
3. WHEN Auto Mode is disabled, THE Processing_Pipeline SHALL display "Params" buttons for each step
4. THE Processing_Pipeline SHALL use FTIR-appropriate units in step summaries (cm⁻¹ for wavenumber, absorbance units for intensity)
5. THE Processing_Pipeline SHALL NOT display XRD-specific step names (Reference Matching, Peak Fitting with Miller indices)
6. THE Processing_Pipeline SHALL NOT display XPS-specific step names (Energy Calibration, Chemical State Assignment)

### Requirement 4: FTIR Parameter Definitions

**User Story:** As a materials scientist, I want to adjust FTIR processing parameters, so that I can optimize analysis for different samples.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL define FtirParameters type with 6 step parameter interfaces: baselineCorrection, smoothing, peakDetection, bandAssignment, functionalGroupMatching, displayMode
2. THE FTIR_Workspace SHALL define default parameters for all 6 processing steps
3. THE Baseline_Correction parameters SHALL include: method (Polynomial/Rubberband/Linear), polynomial_order (2-5), iterations (10-50)
4. THE Smoothing parameters SHALL include: method (Savitzky-Golay/Moving Average), window_size (5-21, odd), polynomial_order (2-4, for Savitzky-Golay only)
5. THE Peak_Detection parameters SHALL include: prominence (0.01-0.5, fraction of max intensity), min_distance (10-50 cm⁻¹), min_height (0.01-0.2)
6. THE Band_Assignment parameters SHALL include: wavenumber_tolerance (10-50 cm⁻¹), use_intensity (boolean), database (Standard FTIR/Custom)
7. THE Display_Mode parameters SHALL include: signal_mode (Absorbance/Transmittance)
8. THE FTIR_Workspace SHALL validate parameter ranges and display error messages for invalid values

### Requirement 5: FTIR Graph Visualization

**User Story:** As a materials scientist, I want to see FTIR spectra with reversed x-axis and band markers, so that I can interpret wavenumber data correctly.

#### Acceptance Criteria

1. THE Graph component SHALL display FTIR data with x-axis reversed (high wavenumber on left, low wavenumber on right)
2. THE Graph component SHALL display x-axis label as "Wavenumber (cm⁻¹)"
3. THE Graph component SHALL display y-axis label as "Absorbance" or "Transmittance" based on signal_mode parameter
4. THE Graph component SHALL display band markers at detected band positions
5. THE Graph component SHALL display baseline data when available
6. THE Graph component SHALL support the same tab structure as XPS_Workspace (Spectrum, Band List, Functional Groups tabs)

### Requirement 6: FTIR Spectrum Tab Display

**User Story:** As a materials scientist, I want to see FTIR spectrum with baseline correction, so that I can visualize infrared absorption bands.

#### Acceptance Criteria

1. THE Spectrum tab SHALL display FTIR spectrum graph with wavenumber vs absorbance/transmittance
2. THE Spectrum tab SHALL display baseline overlay on graph
3. THE Spectrum tab SHALL display band markers with functional group labels
4. THE Spectrum tab SHALL display info strip showing: "X bands detected and assigned to functional groups"
5. THE Spectrum tab SHALL display wavelength reference (e.g., "λ = 2.5-25 μm")

### Requirement 7: FTIR Band List Display

**User Story:** As a materials scientist, I want to see a table of detected FTIR bands with wavenumbers and assignments, so that I can review band identification results.

#### Acceptance Criteria

1. THE Band_List tab SHALL display a table with columns: #, Wavenumber (cm⁻¹), Intensity (absorbance units), FWHM (cm⁻¹), Area (integrated intensity), Assignment (functional group)
2. THE Band_List tab SHALL display wavenumbers with 1 decimal precision
3. THE Band_List tab SHALL display FWHM values with 1 decimal precision
4. THE Band_List tab SHALL display functional group assignments (e.g., "O–H stretch", "C=O stretch", "M–O stretch")
5. THE Band_List tab SHALL display a Quality Metrics panel showing: BANDS (total detected), MATCHED (matched/total), SNR (signal-to-noise ratio), UNASSIGNED (unmatched bands), DATA POINTS (spectrum data points), CONFIDENCE (average match confidence)

### Requirement 8: FTIR Functional Group Matching Display

**User Story:** As a materials scientist, I want to see how observed bands match reference ranges with multiple candidates, so that I can validate functional group interpretations and understand ambiguity.

#### Acceptance Criteria

1. THE Functional_Groups tab SHALL display a table with columns: Observed cm⁻¹, Reference Range (cm⁻¹), Δcm⁻¹ (deviation from range center), Functional Group, Assignment (detailed), Confidence (%), Ambiguity
2. THE Functional_Groups tab SHALL display wavenumber differences with 1 decimal precision
3. THE Functional_Groups tab SHALL display functional group assignments with detailed descriptions
4. THE Functional_Groups tab SHALL show multiple candidate assignments for bands in overlapping regions (e.g., carbonate/carboxylate ambiguity)
5. THE Functional_Groups tab SHALL display ambiguity indicators (e.g., "tentative", "overlapping region") when multiple candidates exist
6. THE Functional_Groups tab SHALL show match count in tab badge (e.g., "5/8" for 5 matched out of 8 detected bands)
7. WHEN no matches exist, THE Functional_Groups tab SHALL display "No matches" message

### Requirement 9: FTIR Scientific Summary

**User Story:** As a materials scientist, I want to see a scientific summary of FTIR results, so that I can quickly understand the functional group interpretation.

#### Acceptance Criteria

1. THE Scientific_Summary panel SHALL display: Primary Functional Groups, Chemical Interpretation, Reliability, Evidence Snapshot, Validation
2. THE Scientific_Summary panel SHALL display primary functional groups detected (e.g., "Surface hydroxyl, Metal-oxygen vibration")
3. THE Scientific_Summary panel SHALL display chemical interpretation based on evidence (e.g., "Metal oxide catalyst with surface hydroxyl groups")
4. THE Scientific_Summary panel SHALL display confidence level badge (high/medium/low)
5. THE Scientific_Summary panel SHALL display reliability as "X/Y matched, Z unassigned"
6. THE Scientific_Summary panel SHALL NOT display XRD-specific terms (phase, spinel structure, lattice parameters)
7. THE Scientific_Summary panel SHALL NOT display XPS-specific terms (oxidation state, binding energy)

### Requirement 10: FTIR Evidence Snapshot

**User Story:** As a materials scientist, I want to see top evidence bands in the sidebar, so that I can quickly review key assignments.

#### Acceptance Criteria

1. THE Evidence_Snapshot panel SHALL display top 3 assigned bands
2. THE Evidence_Snapshot panel SHALL display for each band: band number, functional group assignment, wavenumber (cm⁻¹), Δcm⁻¹ (deviation), intensity
3. THE Evidence_Snapshot panel SHALL display wavenumbers with 1 decimal precision
4. THE Evidence_Snapshot panel SHALL display Δcm⁻¹ with 1 decimal precision
5. WHEN no matches exist, THE Evidence_Snapshot panel SHALL display "No matches" message

### Requirement 11: FTIR Validation Recommendations

**User Story:** As a materials scientist, I want to see recommended validation techniques, so that I can confirm FTIR results with complementary methods.

#### Acceptance Criteria

1. THE Validation panel SHALL display FTIR-appropriate validation recommendations
2. THE Validation panel SHALL suggest complementary techniques (e.g., "Raman for complementary vibrational modes", "XPS for oxidation states", "Multi-tech fusion for comprehensive characterization")
3. THE Validation panel SHALL include "Agent Mode" button linking to autonomous agent workflow
4. THE Validation panel SHALL NOT display XRD-specific validation recommendations
5. THE Validation panel SHALL display at least 3 validation recommendations

### Requirement 12: FTIR Parameter Persistence

**User Story:** As a materials scientist, I want my FTIR parameter adjustments saved, so that I can maintain consistent settings across sessions.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL use useParameterPersistence hook with technique identifier 'ftir'
2. WHEN parameters are changed, THE FTIR_Workspace SHALL persist parameters to localStorage
3. WHEN FTIR_Workspace is reopened, THE FTIR_Workspace SHALL restore parameters from localStorage
4. WHEN Auto Mode is enabled, THE FTIR_Workspace SHALL reset parameters to FTIR defaults
5. THE FTIR_Workspace SHALL NOT share parameter storage with XRD_Workspace or XPS_Workspace

### Requirement 13: FTIR Dataset Selection

**User Story:** As a materials scientist, I want to select FTIR datasets from a dropdown, so that I can analyze different samples.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL display dataset selector in left sidebar
2. THE FTIR_Workspace SHALL load FTIR demo datasets from data file
3. THE FTIR_Workspace SHALL display dataset label and filename
4. WHEN dataset is changed, THE FTIR_Workspace SHALL recompute processing results
5. THE FTIR_Workspace SHALL support URL query parameter for initial dataset selection

### Requirement 14: FTIR Project Integration

**User Story:** As a materials scientist, I want FTIR workspace integrated with DIFARYX projects, so that I can access FTIR analysis from project dashboard.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL accept project ID from URL query parameter
2. THE FTIR_Workspace SHALL display project selector in left sidebar
3. THE FTIR_Workspace SHALL provide "Open Notebook" button linking to project notebook
4. THE FTIR_Workspace SHALL provide "Run Agent" button linking to autonomous agent workflow
5. THE FTIR_Workspace SHALL display project material description

### Requirement 15: FTIR Route Configuration

**User Story:** As a materials scientist, I want to access FTIR workspace via `/workspace/ftir` route, so that I can navigate to FTIR analysis.

#### Acceptance Criteria

1. THE application router SHALL define route `/workspace/ftir` pointing to FTIR_Workspace component
2. THE route SHALL support query parameters: project, dataset
3. THE route SHALL be accessible from dashboard and navigation
4. THE route SHALL NOT conflict with existing XRD or XPS routes
5. THE route SHALL follow DIFARYX routing conventions

### Requirement 16: FTIR Demo Data

**User Story:** As a materials scientist, I want FTIR demo datasets available, so that I can explore FTIR workspace functionality.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL define at least 1 FTIR demo dataset
2. THE FTIR demo dataset SHALL include: dataset id, label, sampleName, fileName, dataPoints (wavenumber, absorbance pairs)
3. THE FTIR demo dataset SHALL use realistic FTIR data for metal oxide catalyst with surface hydroxyl groups
4. THE FTIR demo dataset SHALL include characteristic bands: surface hydroxyl (~3400 cm⁻¹), adsorbed water (~1630 cm⁻¹), carbonate/carboxylate (~1450-1550 cm⁻¹), metal-oxygen vibration (~500-650 cm⁻¹)
5. THE FTIR demo dataset SHALL be stored in `src/data/ftirDemoData.ts`
6. THE FTIR demo dataset SHALL follow the same structure as XPS demo datasets

### Requirement 17: FTIR Functional Group Reference Database

**User Story:** As a materials scientist, I want a functional group reference database with wavenumber ranges, so that FTIR bands can be assigned to known functional groups using range-based matching.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL define functional group reference database with wavenumber ranges (not exact positions)
2. THE reference database SHALL include: O–H stretch (3200-3600 cm⁻¹, broad), H–O–H bend (1630-1650 cm⁻¹), C–H stretch (2850-2920 cm⁻¹), C=O stretch (1650-1750 cm⁻¹), CO₃²⁻ carbonate (1400-1500 cm⁻¹), COO⁻ carboxylate (1550-1650 cm⁻¹), M–O stretch (400-700 cm⁻¹)
3. THE reference database SHALL support overlapping wavenumber ranges (e.g., carbonate and carboxylate overlap in 1450-1550 cm⁻¹)
4. THE reference database SHALL include band characteristics: typical_range, expected_width (narrow/medium/broad), diagnostic_weight, supporting_bands
5. THE reference database SHALL support multiple candidate assignments per band when ranges overlap
6. THE reference database SHALL be extensible for custom functional groups

### Requirement 18: FTIR Processing Agent

**User Story:** As a materials scientist, I want FTIR data processed automatically, so that I can see band detection and functional group assignment results.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL implement FTIR processing agent function
2. THE FTIR processing agent SHALL accept input: datasetId, sampleName, sourceLabel, dataPoints, optional processing parameters
3. THE FTIR processing agent SHALL return: detectedBands, matches (functional group assignments), interpretation, validation, baselineData, scientificSummary
4. THE FTIR processing agent SHALL perform: baseline correction, smoothing, peak detection, band assignment, functional group matching, interpretation summary
5. THE FTIR processing agent SHALL be stored in `src/agents/ftirAgent/runner.ts`

### Requirement 19: FTIR Type Definitions

**User Story:** As a developer, I want FTIR type definitions, so that I can maintain type safety in FTIR workspace implementation.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL define FtirParameters interface in `src/types/parameters.ts`
2. THE FTIR_Workspace SHALL define FtirAgentResult interface in `src/agents/ftirAgent/runner.ts`
3. THE FTIR_Workspace SHALL define FtirDetectedBand interface with properties: id, wavenumber, intensity, fwhm, area, assignment
4. THE FTIR_Workspace SHALL define FtirFunctionalGroupMatch interface with properties: bandId, observedWavenumber, referenceWavenumber, deltaWavenumber, functionalGroup, assignment, confidence
5. THE FTIR_Workspace SHALL follow TypeScript strict mode conventions

### Requirement 20: FTIR Auto Mode Behavior

**User Story:** As a materials scientist, I want Auto Mode to apply optimal FTIR defaults, so that I can get good results without manual tuning.

#### Acceptance Criteria

1. WHEN Auto Mode is enabled, THE FTIR_Workspace SHALL use default parameters for all processing steps
2. WHEN Auto Mode is enabled, THE Parameter_Drawer SHALL be closed
3. WHEN Auto Mode is disabled, THE FTIR_Workspace SHALL display "Params" buttons for each processing step
4. WHEN Auto Mode is toggled on, THE FTIR_Workspace SHALL reset all parameters to defaults
5. THE Auto Mode toggle SHALL be displayed in Processing_Pipeline header

### Requirement 21: FTIR Parameter Drawer Integration

**User Story:** As a materials scientist, I want to adjust FTIR parameters via drawer, so that I can fine-tune processing for specific samples.

#### Acceptance Criteria

1. WHEN "Params" button is clicked, THE Parameter_Drawer SHALL open with FTIR-specific parameters for that step
2. THE Parameter_Drawer SHALL display step label and method name
3. THE Parameter_Drawer SHALL render parameter controls based on FTIR parameter definitions
4. WHEN "Apply" is clicked, THE Parameter_Drawer SHALL close and recompute FTIR results
5. WHEN "Reset" is clicked, THE Parameter_Drawer SHALL restore FTIR default parameters for that step

### Requirement 22: FTIR Wavenumber Convention

**User Story:** As a materials scientist, I want FTIR spectra displayed with high wavenumber on the left, so that I can interpret spectra according to standard FTIR conventions.

#### Acceptance Criteria

1. THE Graph component SHALL display FTIR x-axis with high wavenumber (e.g., 4000 cm⁻¹) on the left
2. THE Graph component SHALL display FTIR x-axis with low wavenumber (e.g., 400 cm⁻¹) on the right
3. THE FTIR x-axis convention SHALL be opposite to XPS convention (XPS: high BE on left, FTIR: high wavenumber on left)
4. THE FTIR x-axis convention SHALL match standard FTIR literature conventions
5. THE Graph component SHALL handle FTIR axis reversal without modifying XPS or XRD axis behavior

### Requirement 23: FTIR Baseline Correction Methods

**User Story:** As a materials scientist, I want multiple baseline correction methods, so that I can choose the best method for my sample.

#### Acceptance Criteria

1. THE Baseline_Correction step SHALL support Polynomial method (polynomial fit to baseline)
2. THE Baseline_Correction step SHALL support Rubberband method (convex hull baseline)
3. THE Baseline_Correction step SHALL support Linear method (linear baseline between endpoints)
4. WHEN Polynomial method is selected, THE Parameter_Drawer SHALL display polynomial_order parameter (2-5)
5. WHEN Rubberband method is selected, THE Parameter_Drawer SHALL display iterations parameter (10-50)

### Requirement 24: FTIR Smoothing Methods

**User Story:** As a materials scientist, I want multiple smoothing methods, so that I can reduce noise while preserving band shapes.

#### Acceptance Criteria

1. THE Smoothing step SHALL support Savitzky-Golay method (polynomial smoothing filter)
2. THE Smoothing step SHALL support Moving Average method (simple moving average)
3. WHEN Savitzky-Golay method is selected, THE Parameter_Drawer SHALL display window_size (5-21, odd) and polynomial_order (2-4) parameters
4. WHEN Moving Average method is selected, THE Parameter_Drawer SHALL display window_size (5-21, odd) parameter only
5. THE Smoothing step SHALL validate that window_size is odd and polynomial_order < window_size

### Requirement 25: FTIR Peak Detection Sensitivity

**User Story:** As a materials scientist, I want to adjust peak detection sensitivity, so that I can detect weak bands or filter noise.

#### Acceptance Criteria

1. THE Peak_Detection step SHALL support prominence parameter (0.01-0.5, fraction of max intensity)
2. THE Peak_Detection step SHALL support min_distance parameter (10-50 cm⁻¹, minimum band separation)
3. THE Peak_Detection step SHALL support min_height parameter (0.01-0.2, minimum band height)
4. WHEN prominence is decreased, THE Peak_Detection step SHALL detect more bands (higher sensitivity)
5. WHEN min_distance is increased, THE Peak_Detection step SHALL merge nearby bands (lower resolution)

### Requirement 26: FTIR Band Assignment with Range-Based Matching

**User Story:** As a materials scientist, I want band assignment to use wavenumber ranges and support multiple candidates, so that I can handle overlapping and ambiguous bands correctly.

#### Acceptance Criteria

1. THE Band_Assignment step SHALL match bands to functional groups using wavenumber ranges (not exact positions)
2. THE Band_Assignment step SHALL support multiple candidate assignments per band when ranges overlap
3. THE Band_Assignment step SHALL calculate match score based on: wavenumber position within range, band width match, intensity characteristics
4. THE Band_Assignment step SHALL identify broad bands (FWHM > 100 cm⁻¹) and assign appropriate functional groups (e.g., O–H stretch)
5. THE Band_Assignment step SHALL detect overlapping bands in ambiguous regions (e.g., 1400-1600 cm⁻¹ carbonate/carboxylate region)
6. THE Band_Assignment step SHALL display all candidate assignments with confidence scores when ambiguity exists

### Requirement 27: FTIR Functional Group-Level Confidence Scoring

**User Story:** As a materials scientist, I want confidence scores based on functional group-level evidence aggregation, so that I can assess interpretation reliability.

#### Acceptance Criteria

1. THE Functional_Group_Matching step SHALL aggregate band-level evidence into functional group-level interpretation
2. THE confidence score SHALL be based on: primary band match quality, supporting band presence, ambiguity detection, band width consistency
3. THE confidence score SHALL increase when supporting bands are present (e.g., O–H stretch + H–O–H bend confirms water)
4. THE confidence score SHALL decrease when ambiguity is detected (e.g., overlapping carbonate/carboxylate bands)
5. THE confidence score SHALL be displayed as high/medium/low in Scientific Summary badge
6. THE confidence score SHALL include caveats for overlapping regions, baseline distortion, or missing supporting bands

### Requirement 28: FTIR Evidence-Based Interpretation Summary

**User Story:** As a materials scientist, I want an evidence-based interpretation summary with caveats, so that I can understand FTIR results with appropriate scientific reasoning.

#### Acceptance Criteria

1. THE Interpretation_Summary step SHALL generate scientific interpretation based on functional group-level evidence aggregation (not simple peak matching)
2. THE scientific summary SHALL identify dominant functional groups with evidence (e.g., "Surface hydroxyl (O–H): broad 3400 cm⁻¹ band")
3. THE scientific summary SHALL provide chemical interpretation (e.g., "Metal oxide catalyst with adsorbed water")
4. THE scientific summary SHALL include confidence level (high/medium/low) based on evidence quality
5. THE scientific summary SHALL list supporting evidence (e.g., "1630 cm⁻¹ H–O–H bending confirms water")
6. THE scientific summary SHALL include caveats for ambiguity (e.g., "Overlapping bands in 1400-1600 cm⁻¹ region: carbonate/carboxylate ambiguity")
7. THE scientific summary SHALL include caveats for potential artifacts (e.g., "Intensity distortion possible due to baseline correction")
8. THE scientific summary SHALL be displayed in Scientific Summary panel with structured sections: Dominant Functional Groups, Confidence, Evidence, Caveats

### Requirement 29: FTIR Display Mode Switching

**User Story:** As a materials scientist, I want to switch between Absorbance and Transmittance display modes, so that I can view FTIR data in my preferred format.

#### Acceptance Criteria

1. THE Display_Mode parameter SHALL support signal_mode values: 'Absorbance' or 'Transmittance'
2. WHEN signal_mode is 'Absorbance', THE Graph component SHALL display y-axis label as "Absorbance"
3. WHEN signal_mode is 'Transmittance', THE Graph component SHALL display y-axis label as "Transmittance (%)"
4. WHEN signal_mode is changed, THE Graph component SHALL convert data between Absorbance and Transmittance (A = -log₁₀(T/100))
5. THE Display_Mode parameter SHALL be accessible via Parameter_Drawer

### Requirement 30: FTIR Catalyst-Relevant Demo Data

**User Story:** As a materials scientist, I want FTIR demo data relevant to catalyst characterization, so that I can explore realistic catalyst analysis workflows.

#### Acceptance Criteria

1. THE FTIR demo dataset SHALL represent a metal oxide catalyst sample
2. THE FTIR demo dataset SHALL include surface hydroxyl groups (~3400 cm⁻¹ broad band)
3. THE FTIR demo dataset SHALL include adsorbed water (~1630 cm⁻¹ band)
4. THE FTIR demo dataset SHALL include carbonate or carboxylate species (~1450-1550 cm⁻¹ region)
5. THE FTIR demo dataset SHALL include metal-oxygen vibration (~500-650 cm⁻¹ band)
6. THE FTIR demo dataset SHALL use realistic band intensities, widths, and baseline characteristics

### Requirement 31: FTIR Scientific Reasoning Layer

**User Story:** As a materials scientist, I want FTIR analysis to use scientific reasoning with evidence aggregation and ambiguity detection, so that I get interpretations rather than simple peak matching.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL implement scientific reasoning layer that operates on band ranges (not exact positions)
2. THE scientific reasoning layer SHALL support broad and overlapping bands with appropriate handling
3. THE scientific reasoning layer SHALL allow multiple candidate assignments per band when ranges overlap
4. THE scientific reasoning layer SHALL aggregate band-level evidence into functional group-level interpretation
5. THE scientific reasoning layer SHALL use supporting bands to increase confidence (e.g., O–H stretch + H–O–H bend confirms water)
6. THE scientific reasoning layer SHALL detect ambiguity and reduce confidence accordingly (e.g., overlapping carbonate/carboxylate region)
7. THE scientific reasoning layer SHALL output structured interpretation with: dominant functional groups, confidence level, evidence list, caveats
8. THE scientific reasoning layer SHALL generate caveats for: overlapping bands, baseline distortion artifacts, missing supporting bands, ambiguous assignments
9. THE scientific reasoning layer SHALL NOT treat FTIR as simple peak matching with exact wavenumber positions
10. THE scientific reasoning layer SHALL follow the example output format: "Dominant functional groups: Surface hydroxyl (O–H), Adsorbed water, Carbonate species (tentative); Confidence: medium; Evidence: Broad 3400 cm⁻¹ band → O–H stretch, 1630 cm⁻¹ → H–O–H bending, 1450–1500 cm⁻¹ → carbonate/carboxylate ambiguity; Caveats: overlapping bands in 1400–1600 cm⁻¹ region, intensity distortion possible due to baseline correction"

