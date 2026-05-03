# Requirements Document

## Introduction

The Scientific Parameter System for Technique Workspaces introduces a lightweight, scientifically meaningful parameter control system for XRD, XPS, FTIR, and Raman analysis techniques. The system allows expert users to tune processing parameters while maintaining a simple default experience through Auto Mode. Parameters are integrated directly into the existing Processing Pipeline UI without disrupting current routing, layout, or core data flow.

## Glossary

- **Processing_Pipeline**: The left panel component in technique workspaces that displays processing steps and their status
- **Auto_Mode**: A toggle state where all parameters use system defaults and are hidden from the user
- **Advanced_Mode**: A toggle state where parameters are visible and editable by the user
- **Processing_Step**: An individual analysis operation (e.g., Baseline Correction, Peak Detection) within the Processing Pipeline
- **Parameter**: A configurable numeric or categorical value that controls the behavior of a Processing Step
- **Technique_Workspace**: The analysis interface for a specific characterization technique (XRD, XPS, FTIR, or Raman)
- **XRD_Workspace**: X-Ray Diffraction technique workspace at route `/workspace/xrd`
- **XPS_Workspace**: X-ray Photoelectron Spectroscopy technique workspace at route `/workspace/xps`
- **FTIR_Workspace**: Fourier Transform Infrared Spectroscopy technique workspace at route `/workspace/ftir`
- **Raman_Workspace**: Raman Spectroscopy technique workspace at route `/workspace/raman`
- **Visualization**: The graph component that displays spectroscopic data and analysis results
- **Peak_Marker**: Visual indicator on the graph showing detected peaks or features
- **Confidence_Score**: Numeric indicator of analysis reliability
- **Evidence_Panel**: UI component for saving and reviewing analysis evidence

## Requirements

### Requirement 1: Auto Mode Toggle

**User Story:** As a user, I want to toggle between Auto Mode and Advanced Mode, so that I can choose between simple defaults and expert parameter control.

#### Acceptance Criteria

1. THE Processing_Pipeline SHALL display an Auto Mode toggle control at the top of the panel
2. WHEN Auto Mode is enabled, THE Processing_Pipeline SHALL hide all parameter controls for all Processing Steps
3. WHEN Auto Mode is disabled, THE Processing_Pipeline SHALL reveal parameter controls for all Processing Steps
4. THE Processing_Pipeline SHALL initialize with Auto Mode enabled by default
5. WHEN Auto Mode is enabled, THE Processing_Pipeline SHALL display a summary indicator showing "Auto-optimized" for each Processing Step

### Requirement 2: Parameter Definition and Defaults

**User Story:** As a developer, I want each parameter to have scientific meaning, valid ranges, and default values, so that the system maintains scientific credibility.

#### Acceptance Criteria

1. THE Parameter_System SHALL define a default value for every parameter
2. THE Parameter_System SHALL define a valid numeric range or categorical set for every parameter
3. THE Parameter_System SHALL define a scientific unit label for every numeric parameter
4. THE Parameter_System SHALL use scientifically accurate terminology consistent with each technique's conventions
5. WHEN Auto Mode is enabled, THE Parameter_System SHALL apply default values to all parameters

### Requirement 3: XRD Baseline Correction Parameters

**User Story:** As an XRD analyst, I want to configure baseline correction parameters, so that I can optimize background removal for my sample.

#### Acceptance Criteria

1. THE XRD_Workspace SHALL expose a method parameter with values ALS or Polynomial for the Baseline Correction step
2. WHERE method is ALS, THE XRD_Workspace SHALL expose a lambda parameter with range 1e2 to 1e9 and default 1e6
3. WHERE method is ALS, THE XRD_Workspace SHALL expose a p parameter with range 0.001 to 0.1 and default 0.01
4. WHERE method is ALS, THE XRD_Workspace SHALL expose an iterations parameter with range 1 to 100 and default 10
5. WHEN baseline correction parameters change, THE XRD_Workspace SHALL update the Visualization to reflect the new baseline

### Requirement 4: XRD Smoothing Parameters

**User Story:** As an XRD analyst, I want to configure smoothing parameters, so that I can reduce noise while preserving peak features.

#### Acceptance Criteria

1. THE XRD_Workspace SHALL expose a method parameter with value Savitzky-Golay for the Smoothing step
2. THE XRD_Workspace SHALL expose a window_size parameter with odd integer values from 3 to 21 and default 5
3. THE XRD_Workspace SHALL expose a polynomial_order parameter with range 1 to 5 and default 2
4. WHEN window_size is set to an even number, THE XRD_Workspace SHALL display an inline warning "Window size must be odd"
5. WHEN smoothing parameters change, THE XRD_Workspace SHALL update the Visualization to reflect the smoothed data

### Requirement 5: XRD Peak Detection Parameters

**User Story:** As an XRD analyst, I want to configure peak detection parameters, so that I can control sensitivity and avoid false positives.

#### Acceptance Criteria

1. THE XRD_Workspace SHALL expose a prominence parameter with range 0.0 to 1.0 and default 0.1 for the Peak Detection step
2. THE XRD_Workspace SHALL expose a min_distance parameter with range 0.05 to 2.0 degrees 2θ and default 0.2 degrees 2θ
3. THE XRD_Workspace SHALL expose an optional height_threshold parameter with range 0.0 to 1.0 and default null
4. WHEN peak detection parameters change, THE XRD_Workspace SHALL update Peak Markers on the Visualization
5. WHEN peak detection parameters change, THE XRD_Workspace SHALL update the Confidence_Score based on detected peaks

### Requirement 6: XRD Peak Fitting Parameters

**User Story:** As an XRD analyst, I want to configure peak fitting parameters, so that I can select appropriate peak models and convergence criteria.

#### Acceptance Criteria

1. THE XRD_Workspace SHALL expose a model parameter with values Gaussian, Lorentzian, or Pseudo-Voigt for the Peak Fitting step
2. THE XRD_Workspace SHALL expose a tolerance parameter with range 1e-6 to 1e-2 and default 1e-4
3. THE XRD_Workspace SHALL expose a max_iterations parameter with range 10 to 1000 and default 100
4. WHEN peak fitting parameters change, THE XRD_Workspace SHALL update fitted peak curves on the Visualization
5. WHEN peak fitting parameters change, THE XRD_Workspace SHALL update the Confidence_Score based on fit quality

### Requirement 7: XRD Reference Matching Parameters

**User Story:** As an XRD analyst, I want to configure reference matching parameters, so that I can control phase identification criteria.

#### Acceptance Criteria

1. THE XRD_Workspace SHALL expose a database parameter with values ICDD or COD for the Reference Matching step
2. THE XRD_Workspace SHALL expose a delta_tolerance parameter with range 0.01 to 0.5 degrees 2θ and default 0.1 degrees 2θ
3. THE XRD_Workspace SHALL expose a min_match_score parameter with range 0.0 to 1.0 and default 0.7
4. THE XRD_Workspace SHALL expose a use_intensity parameter with boolean values and default true
5. WHEN reference matching parameters change, THE XRD_Workspace SHALL update phase identification results in the Evidence_Panel

### Requirement 8: XPS Background Subtraction Parameters

**User Story:** As an XPS analyst, I want to configure background subtraction parameters, so that I can apply appropriate background models.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL expose a method parameter with values Shirley or Tougaard for the Background Subtraction step
2. THE XPS_Workspace SHALL expose an iterations parameter with range 1 to 50 and default 10
3. WHEN background subtraction parameters change, THE XPS_Workspace SHALL update the Visualization to reflect the background-corrected spectrum
4. WHEN background subtraction parameters change, THE XPS_Workspace SHALL update the Confidence_Score based on background fit quality

### Requirement 9: XPS Peak Deconvolution Parameters

**User Story:** As an XPS analyst, I want to configure peak deconvolution parameters, so that I can control component fitting.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL expose a model parameter with value Gaussian-Lorentzian for the Peak Deconvolution step
2. THE XPS_Workspace SHALL expose a num_components parameter with range 1 to 10 and default 3
3. THE XPS_Workspace SHALL expose a constrain_fwhm parameter with boolean values and default false
4. WHEN peak deconvolution parameters change, THE XPS_Workspace SHALL update fitted component curves on the Visualization
5. WHEN peak deconvolution parameters change, THE XPS_Workspace SHALL update the Confidence_Score based on deconvolution quality

### Requirement 10: XPS Energy Calibration Parameters

**User Story:** As an XPS analyst, I want to configure energy calibration parameters, so that I can correct binding energy scales.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL expose a reference_peak parameter with values C1s, Au4f7, or Ag3d5 for the Energy Calibration step
2. THE XPS_Workspace SHALL expose a reference_energy parameter with range 280.0 to 290.0 eV and default 284.8 eV for C1s
3. WHEN energy calibration parameters change, THE XPS_Workspace SHALL update the binding energy axis on the Visualization
4. WHEN energy calibration parameters change, THE XPS_Workspace SHALL update peak assignments in the Evidence_Panel

### Requirement 11: XPS Assignment Parameters

**User Story:** As an XPS analyst, I want to configure assignment parameters, so that I can control peak identification criteria.

#### Acceptance Criteria

1. THE XPS_Workspace SHALL expose a binding_energy_tolerance parameter with range 0.1 to 2.0 eV and default 0.5 eV for the Assignment step
2. THE XPS_Workspace SHALL expose a satellite_check parameter with boolean values and default true
3. WHEN assignment parameters change, THE XPS_Workspace SHALL update chemical state assignments in the Evidence_Panel
4. WHEN assignment parameters change, THE XPS_Workspace SHALL update the Confidence_Score based on assignment quality

### Requirement 12: Raman Baseline Parameters

**User Story:** As a Raman analyst, I want to configure baseline parameters, so that I can remove fluorescence background.

#### Acceptance Criteria

1. THE Raman_Workspace SHALL expose a method parameter with values ALS or Polynomial for the Baseline step
2. WHERE method is ALS, THE Raman_Workspace SHALL expose a lambda parameter with range 1e2 to 1e9 and default 1e5
3. WHERE method is ALS, THE Raman_Workspace SHALL expose a p parameter with range 0.001 to 0.1 and default 0.01
4. WHEN baseline parameters change, THE Raman_Workspace SHALL update the Visualization to reflect the baseline-corrected spectrum

### Requirement 13: Raman Peak Detection Parameters

**User Story:** As a Raman analyst, I want to configure peak detection parameters, so that I can identify Raman modes accurately.

#### Acceptance Criteria

1. THE Raman_Workspace SHALL expose a prominence parameter with range 0.0 to 1.0 and default 0.1 for the Peak Detection step
2. THE Raman_Workspace SHALL expose a min_distance parameter with range 1.0 to 50.0 cm⁻¹ and default 10.0 cm⁻¹
3. WHEN peak detection parameters change, THE Raman_Workspace SHALL update Peak Markers on the Visualization
4. WHEN peak detection parameters change, THE Raman_Workspace SHALL update the Confidence_Score based on detected modes

### Requirement 14: Raman Mode Assignment Parameters

**User Story:** As a Raman analyst, I want to configure mode assignment parameters, so that I can match peaks to vibrational modes.

#### Acceptance Criteria

1. THE Raman_Workspace SHALL expose a reference_library parameter with technique-appropriate values for the Mode Assignment step
2. THE Raman_Workspace SHALL expose a tolerance parameter with range 1.0 to 20.0 cm⁻¹ and default 5.0 cm⁻¹
3. WHEN mode assignment parameters change, THE Raman_Workspace SHALL update mode assignments in the Evidence_Panel
4. WHEN mode assignment parameters change, THE Raman_Workspace SHALL update the Confidence_Score based on assignment quality

### Requirement 15: FTIR Baseline Parameters

**User Story:** As an FTIR analyst, I want to configure baseline parameters, so that I can correct spectral baseline drift.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL expose a method parameter with values Rubberband or Polynomial for the Baseline step
2. WHEN baseline parameters change, THE FTIR_Workspace SHALL update the Visualization to reflect the baseline-corrected spectrum

### Requirement 16: FTIR Peak Detection Parameters

**User Story:** As an FTIR analyst, I want to configure peak detection parameters, so that I can identify absorption bands.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL expose a prominence parameter with range 0.0 to 1.0 and default 0.1 for the Peak Detection step
2. THE FTIR_Workspace SHALL expose a min_distance parameter with range 5.0 to 100.0 cm⁻¹ and default 20.0 cm⁻¹
3. WHEN peak detection parameters change, THE FTIR_Workspace SHALL update Peak Markers on the Visualization
4. WHEN peak detection parameters change, THE FTIR_Workspace SHALL update the Confidence_Score based on detected bands

### Requirement 17: FTIR Band Assignment Parameters

**User Story:** As an FTIR analyst, I want to configure band assignment parameters, so that I can identify functional groups.

#### Acceptance Criteria

1. THE FTIR_Workspace SHALL expose a library parameter with values Fe-O, Organic, or Other for the Band Assignment step
2. THE FTIR_Workspace SHALL expose a tolerance parameter with range 5.0 to 50.0 cm⁻¹ and default 10.0 cm⁻¹
3. WHEN band assignment parameters change, THE FTIR_Workspace SHALL update functional group assignments in the Evidence_Panel
4. WHEN band assignment parameters change, THE FTIR_Workspace SHALL update the Confidence_Score based on assignment quality

### Requirement 18: Parameter UI Integration

**User Story:** As a user, I want parameters to be accessible via a right-side drawer, so that I can adjust settings while keeping the graph visible.

#### Acceptance Criteria

1. THE Processing_Pipeline SHALL display a Parameters button for each Processing Step
2. WHEN the Parameters button is clicked, THE system SHALL open a right-side drawer that slides in from the right edge
3. THE drawer SHALL display parameter controls for the selected Processing Step
4. THE drawer SHALL remain open until explicitly closed by the user
5. THE drawer SHALL NOT obscure the graph visualization or block the main workflow
6. THE drawer SHALL be persistent (not a modal dialog) and allow interaction with the underlying workspace
7. THE Processing_Pipeline SHALL display each parameter with its label, current value, and input control within the drawer

### Requirement 19: Parameter Validation

**User Story:** As a user, I want invalid parameter values to be prevented or warned, so that I avoid analysis errors.

#### Acceptance Criteria

1. WHEN a parameter value is outside its valid range, THE Processing_Pipeline SHALL display an inline warning message
2. WHEN a parameter combination is invalid, THE Processing_Pipeline SHALL display an inline warning message describing the constraint
3. THE Processing_Pipeline SHALL allow the user to proceed with warned parameter values without blocking execution
4. THE Processing_Pipeline SHALL enforce numeric type constraints for numeric parameters
5. THE Processing_Pipeline SHALL enforce categorical constraints for categorical parameters

### Requirement 20: Parameter Persistence

**User Story:** As a user, I want my parameter settings to persist during my session, so that I don't lose my configuration when switching views.

#### Acceptance Criteria

1. WHEN a user changes a parameter value, THE Parameter_System SHALL store the value in the current session
2. WHEN a user navigates away from a Technique_Workspace and returns, THE Parameter_System SHALL restore the previous parameter values
3. WHEN a user enables Auto Mode, THE Parameter_System SHALL preserve custom parameter values but apply defaults for processing
4. WHEN a user disables Auto Mode, THE Parameter_System SHALL restore the previously set custom parameter values
5. THE Parameter_System SHALL use localStorage or equivalent mechanism for session persistence

### Requirement 21: Non-Intrusive Integration

**User Story:** As a developer, I want the parameter system to integrate without disrupting existing functionality, so that current workflows remain stable.

#### Acceptance Criteria

1. THE Parameter_System SHALL NOT modify existing route definitions
2. THE Parameter_System SHALL NOT modify the layout structure of Technique Workspaces
3. THE Parameter_System SHALL NOT modify the core processing pipeline execution logic
4. THE Parameter_System SHALL NOT add new panels to Technique Workspaces
5. THE Parameter_System SHALL NOT overlap with Agent Mode functionality

### Requirement 22: Visual Feedback

**User Story:** As a user, I want immediate visual feedback when I change parameters, so that I can see the effect of my adjustments.

#### Acceptance Criteria

1. WHEN a parameter value changes, THE Visualization SHALL update to reflect the new processing result within 500ms
2. WHEN peak detection parameters change, THE Visualization SHALL update Peak Markers to reflect new detections
3. WHEN fitting parameters change, THE Visualization SHALL update fitted curves to reflect new fits
4. WHEN the Confidence_Score changes due to parameter adjustments, THE Processing_Pipeline SHALL update the displayed score
5. THE Parameter_System SHALL NOT display raw processing logs or step-by-step execution details

### Requirement 23: Scientific Unit Display

**User Story:** As a scientist, I want parameters to display correct scientific units, so that I can interpret values accurately.

#### Acceptance Criteria

1. THE Parameter_System SHALL display degrees 2θ for XRD angular parameters
2. THE Parameter_System SHALL display eV for XPS energy parameters
3. THE Parameter_System SHALL display cm⁻¹ for Raman and FTIR wavenumber parameters
4. THE Parameter_System SHALL display dimensionless parameters without units
5. THE Parameter_System SHALL use standard scientific notation for very large or very small default values

### Requirement 24: Exclusion of AI Auto-Tuning

**User Story:** As a developer, I want to ensure parameter controls do not overlap with Agent Mode, so that responsibilities remain clear.

#### Acceptance Criteria

1. THE Parameter_System SHALL NOT include AI-based parameter optimization controls
2. THE Parameter_System SHALL NOT include automatic parameter tuning based on data characteristics
3. THE Parameter_System SHALL NOT include suggestions or recommendations for parameter values
4. THE Parameter_System SHALL provide only manual parameter input controls
5. AI-based parameter optimization SHALL remain exclusively within Agent Mode functionality
