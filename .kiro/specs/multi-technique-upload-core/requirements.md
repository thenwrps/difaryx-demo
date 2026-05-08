# Requirements Document

## Introduction

This feature implements Multi-Technique Public Beta Upload Core for DIFARYX. The feature allows users to upload real experimental signal files for XRD, XPS, FTIR, and Raman techniques, select or confirm the technique, lock scientific context, plot the uploaded signal, extract basic technique-specific features, apply evidence-quality gates, show claim boundaries, and hand off the result to Notebook/Report without breaking the deterministic demo. This is a frontend-only implementation with no backend changes, no authentication, no live external APIs, no new dependencies unless already available, and preservation of all existing routes and deterministic demo behavior.

## Glossary

- **DIFARYX**: The scientific reasoning infrastructure for materials characterization
- **Upload_Core**: The file upload and parsing subsystem for experimental signal files
- **Signal_File**: A user-provided experimental data file containing x-y data points for a characterization technique
- **Technique**: One of XRD, XPS, FTIR, or Raman characterization methods
- **Scientific_Context**: User-confirmed sample identity, technique, reference scope, and claim boundary
- **Locked_Context**: Scientific context that cannot be modified by the agent without explicit user action
- **Feature_Extractor**: Component that extracts technique-specific features from uploaded signal data
- **Evidence_Quality_Gate**: Validation check that determines if uploaded data meets minimum quality thresholds
- **Claim_Boundary**: The boundary of what can be claimed based on current evidence coverage
- **Deterministic_Demo**: The existing demo behavior with predefined projects and hardcoded data
- **Notebook**: The notebook/report surface at /notebook
- **Report**: Export functionality for reports in various formats
- **XRD**: X-ray Diffraction technique for bulk phase identification
- **XPS**: X-ray Photoelectron Spectroscopy technique for surface chemistry
- **FTIR**: Fourier Transform Infrared Spectroscopy technique for bonding environment
- **Raman**: Raman Spectroscopy technique for local structure and vibrational modes
- **Peak**: A local maximum in signal data representing a characteristic feature
- **Binding_Energy_Region**: XPS peak region representing elemental or oxidation state signature
- **Band_Region**: FTIR absorption band representing bonding environment
- **Mode_Region**: Raman vibrational mode representing local structure
- **Parser**: Component that reads and validates signal file format
- **Pretty_Printer**: Component that formats data back into valid signal file format
- **Unknown_Technique**: Placeholder technique when user has not confirmed the technique type

## Requirements

### Requirement 1: File Upload Interface

**User Story:** As a user, I want to upload experimental signal files, so that I can analyze my own data in DIFARYX.

#### Acceptance Criteria

1. THE Upload_Core SHALL accept file uploads through a file input interface
2. THE Upload_Core SHALL accept common signal file formats (.txt, .csv, .xy, .dat)
3. WHEN a file is selected, THE Upload_Core SHALL read the file contents
4. WHEN a file is selected, THE Upload_Core SHALL display the file name to the user
5. IF the file cannot be read, THEN THE Upload_Core SHALL display an error message

### Requirement 2: Signal File Parser

**User Story:** As a user, I want my signal files parsed correctly, so that my data is displayed accurately.

#### Acceptance Criteria

1. THE Parser SHALL parse x-y data points from signal files
2. THE Parser SHALL support tab-delimited format
3. THE Parser SHALL support comma-delimited format
4. THE Parser SHALL support space-delimited format
5. THE Parser SHALL skip header lines that do not contain numeric data
6. THE Parser SHALL skip comment lines starting with '#'
7. WHEN a line contains two numeric values, THE Parser SHALL extract x and y coordinates
8. IF a file contains no valid x-y data points, THEN THE Parser SHALL return an error

### Requirement 3: Pretty Printer for Signal Files

**User Story:** As a developer, I want a pretty printer for signal files, so that data can be formatted back into valid signal file format.

#### Acceptance Criteria

1. THE Pretty_Printer SHALL format x-y data points into tab-delimited text
2. THE Pretty_Printer SHALL include a header comment with technique and sample name
3. THE Pretty_Printer SHALL format x values with appropriate precision
4. THE Pretty_Printer SHALL format y values with appropriate precision

### Requirement 4: Round-Trip Property for Signal Files

**User Story:** As a developer, I want round-trip validation for signal files, so that parsing and printing are consistent.

#### Acceptance Criteria

1. FOR ALL valid signal files, parsing then printing then parsing SHALL produce equivalent data points within floating-point tolerance
2. THE round-trip tolerance SHALL be 0.001 for x values
3. THE round-trip tolerance SHALL be 0.001 for y values

### Requirement 5: Technique Selection Interface

**User Story:** As a user, I want to select or confirm the technique, so that the correct analysis is applied to my data.

#### Acceptance Criteria

1. THE Upload_Core SHALL display technique selection options: XRD, XPS, FTIR, Raman
2. THE Upload_Core SHALL allow the user to select one technique
3. WHEN a technique is selected, THE Upload_Core SHALL store the selected technique
4. THE Upload_Core SHALL display the selected technique to the user
5. IF no technique is selected, THE Upload_Core SHALL use Unknown_Technique as a placeholder

### Requirement 6: Technique Auto-Detection

**User Story:** As a user, I want the system to suggest a technique based on my file, so that I can confirm or correct the suggestion.

#### Acceptance Criteria

1. WHEN a signal file is uploaded, THE Upload_Core SHALL attempt to detect the technique from file name or data range
2. IF the file name contains "xrd", THEN THE Upload_Core SHALL suggest XRD
3. IF the file name contains "xps", THEN THE Upload_Core SHALL suggest XPS
4. IF the file name contains "ftir", THEN THE Upload_Core SHALL suggest FTIR
5. IF the file name contains "raman", THEN THE Upload_Core SHALL suggest Raman
6. IF the x-axis range is 10-80, THEN THE Upload_Core SHALL suggest XRD
7. IF the x-axis range is 0-1200, THEN THE Upload_Core SHALL suggest XPS
8. IF the x-axis range is 400-4000, THEN THE Upload_Core SHALL suggest FTIR
9. IF the x-axis range is 100-3200, THEN THE Upload_Core SHALL suggest Raman
10. IF no technique can be detected, THEN THE Upload_Core SHALL suggest Unknown_Technique

### Requirement 7: Scientific Context Confirmation

**User Story:** As a user, I want to confirm scientific context, so that my analysis is bounded correctly.

#### Acceptance Criteria

1. THE Upload_Core SHALL prompt the user to confirm sample identity
2. THE Upload_Core SHALL prompt the user to confirm reference scope
3. THE Upload_Core SHALL prompt the user to confirm claim boundary
4. WHEN the user confirms scientific context, THE Upload_Core SHALL lock the context
5. THE Locked_Context SHALL include sample identity, technique, source dataset, source processing path, reference scope, and claim boundary

### Requirement 8: Signal Plotting

**User Story:** As a user, I want to see my uploaded signal plotted, so that I can verify the data was loaded correctly.

#### Acceptance Criteria

1. WHEN a signal file is parsed, THE Upload_Core SHALL plot the x-y data points
2. THE Upload_Core SHALL use the existing Graph component for plotting
3. THE Upload_Core SHALL display appropriate axis labels for the selected technique
4. WHEN the technique is XRD, THE Upload_Core SHALL display "2theta (deg)" for x-axis and "Intensity (a.u.)" for y-axis
5. WHEN the technique is XPS, THE Upload_Core SHALL display "Binding energy (eV)" for x-axis and "Counts (a.u.)" for y-axis
6. WHEN the technique is FTIR, THE Upload_Core SHALL display "Wavenumber (cm-1)" for x-axis and "Transmittance (%)" for y-axis
7. WHEN the technique is Raman, THE Upload_Core SHALL display "Raman shift (cm-1)" for x-axis and "Intensity (a.u.)" for y-axis
8. WHEN the technique is Unknown_Technique, THE Upload_Core SHALL display "X" for x-axis and "Y" for y-axis

### Requirement 9: XRD Feature Extraction

**User Story:** As a user uploading XRD data, I want peak positions and intensities extracted, so that I can see phase-evidence boundaries.

#### Acceptance Criteria

1. WHEN the technique is XRD, THE Feature_Extractor SHALL detect peak positions
2. WHEN the technique is XRD, THE Feature_Extractor SHALL detect relative intensities
3. THE Feature_Extractor SHALL use a local maximum detection algorithm
4. THE Feature_Extractor SHALL filter peaks below a minimum intensity threshold
5. THE Feature_Extractor SHALL display detected peaks with position and relative intensity
6. THE Feature_Extractor SHALL display phase-evidence boundary: "XRD supports phase assignment; phase purity remains validation-limited."

### Requirement 10: XPS Feature Extraction

**User Story:** As a user uploading XPS data, I want binding-energy peak regions extracted, so that I can see surface-evidence boundaries.

#### Acceptance Criteria

1. WHEN the technique is XPS, THE Feature_Extractor SHALL detect binding-energy peak regions
2. THE Feature_Extractor SHALL identify major peak regions above a minimum intensity threshold
3. THE Feature_Extractor SHALL display detected peak regions with approximate binding energy
4. THE Feature_Extractor SHALL display calibration warning: "XPS binding energies require C 1s calibration for quantitative oxidation-state claims."
5. THE Feature_Extractor SHALL display surface-evidence boundary: "XPS provides surface-sensitive evidence; bulk structure remains validation-limited."

### Requirement 11: FTIR Feature Extraction

**User Story:** As a user uploading FTIR data, I want major band regions extracted, so that I can see bonding/support context boundaries.

#### Acceptance Criteria

1. WHEN the technique is FTIR, THE Feature_Extractor SHALL detect major band regions
2. THE Feature_Extractor SHALL identify absorption bands below a maximum transmittance threshold
3. THE Feature_Extractor SHALL display detected band regions with approximate wavenumber
4. THE Feature_Extractor SHALL display bonding/support context: "FTIR provides bonding environment evidence; phase identity remains validation-limited."
5. THE Feature_Extractor SHALL display qualitative boundary: "FTIR band assignment is qualitative; quantitative composition remains validation-limited."

### Requirement 12: Raman Feature Extraction

**User Story:** As a user uploading Raman data, I want mode regions extracted, so that I can see local-structure context boundaries.

#### Acceptance Criteria

1. WHEN the technique is Raman, THE Feature_Extractor SHALL detect mode regions
2. THE Feature_Extractor SHALL identify major peaks above a minimum intensity threshold
3. THE Feature_Extractor SHALL display detected mode regions with approximate Raman shift
4. THE Feature_Extractor SHALL display local-structure context: "Raman provides local structure evidence; bulk phase identity remains validation-limited."
5. THE Feature_Extractor SHALL display fluorescence/noise warning: "Raman signal may contain fluorescence or noise; baseline correction may be required."

### Requirement 13: Evidence Quality Gate for XRD

**User Story:** As a user uploading XRD data, I want quality validation, so that I know if my data meets minimum thresholds.

#### Acceptance Criteria

1. WHEN the technique is XRD, THE Evidence_Quality_Gate SHALL check for minimum number of peaks
2. IF fewer than 3 peaks are detected, THEN THE Evidence_Quality_Gate SHALL display warning: "Fewer than 3 peaks detected; phase assignment is evidence-limited."
3. WHEN the technique is XRD, THE Evidence_Quality_Gate SHALL check for x-axis range coverage
4. IF the x-axis range is less than 20 degrees, THEN THE Evidence_Quality_Gate SHALL display warning: "Limited 2theta range; phase assignment is evidence-limited."
5. WHEN the technique is XRD, THE Evidence_Quality_Gate SHALL check for signal-to-noise ratio
6. IF the signal-to-noise ratio is below 5, THEN THE Evidence_Quality_Gate SHALL display warning: "Low signal-to-noise ratio; peak positions may be unreliable."

### Requirement 14: Evidence Quality Gate for XPS

**User Story:** As a user uploading XPS data, I want quality validation, so that I know if my data meets minimum thresholds.

#### Acceptance Criteria

1. WHEN the technique is XPS, THE Evidence_Quality_Gate SHALL check for minimum number of peak regions
2. IF fewer than 2 peak regions are detected, THEN THE Evidence_Quality_Gate SHALL display warning: "Fewer than 2 peak regions detected; elemental assignment is evidence-limited."
3. WHEN the technique is XPS, THE Evidence_Quality_Gate SHALL check for binding energy range coverage
4. IF the binding energy range is less than 100 eV, THEN THE Evidence_Quality_Gate SHALL display warning: "Limited binding energy range; survey scan recommended."

### Requirement 15: Evidence Quality Gate for FTIR

**User Story:** As a user uploading FTIR data, I want quality validation, so that I know if my data meets minimum thresholds.

#### Acceptance Criteria

1. WHEN the technique is FTIR, THE Evidence_Quality_Gate SHALL check for minimum number of band regions
2. IF fewer than 2 band regions are detected, THEN THE Evidence_Quality_Gate SHALL display warning: "Fewer than 2 band regions detected; bonding assignment is evidence-limited."
3. WHEN the technique is FTIR, THE Evidence_Quality_Gate SHALL check for wavenumber range coverage
4. IF the wavenumber range is less than 1000 cm-1, THEN THE Evidence_Quality_Gate SHALL display warning: "Limited wavenumber range; full spectrum recommended."

### Requirement 16: Evidence Quality Gate for Raman

**User Story:** As a user uploading Raman data, I want quality validation, so that I know if my data meets minimum thresholds.

#### Acceptance Criteria

1. WHEN the technique is Raman, THE Evidence_Quality_Gate SHALL check for minimum number of mode regions
2. IF fewer than 2 mode regions are detected, THEN THE Evidence_Quality_Gate SHALL display warning: "Fewer than 2 mode regions detected; vibrational assignment is evidence-limited."
3. WHEN the technique is Raman, THE Evidence_Quality_Gate SHALL check for Raman shift range coverage
4. IF the Raman shift range is less than 500 cm-1, THEN THE Evidence_Quality_Gate SHALL display warning: "Limited Raman shift range; full spectrum recommended."

### Requirement 17: Unknown Technique Handling

**User Story:** As a user who has not confirmed a technique, I want clear messaging, so that I understand the limitations.

#### Acceptance Criteria

1. WHEN the technique is Unknown_Technique, THE Upload_Core SHALL display message: "Technique not confirmed; material-specific claims cannot be generated."
2. WHEN the technique is Unknown_Technique, THE Feature_Extractor SHALL NOT extract technique-specific features
3. WHEN the technique is Unknown_Technique, THE Evidence_Quality_Gate SHALL NOT apply technique-specific validation
4. WHEN the technique is Unknown_Technique, THE Upload_Core SHALL display generic x-y plot without technique-specific axis labels

### Requirement 18: Notebook Integration

**User Story:** As a user, I want my uploaded data saved to Notebook, so that I can generate a report.

#### Acceptance Criteria

1. WHEN the user saves uploaded data, THE Upload_Core SHALL create a new dataset entry
2. THE dataset entry SHALL include file name, technique, sample name, x-y data points, detected features, and locked context
3. THE dataset entry SHALL be accessible from the Notebook view
4. THE Notebook SHALL display uploaded data with the same locked context display as deterministic demo projects

### Requirement 19: Report Export Integration

**User Story:** As a user, I want my uploaded data included in report exports, so that my analysis is reproducible.

#### Acceptance Criteria

1. WHEN exporting a report, THE Upload_Core SHALL include uploaded dataset information
2. THE report export SHALL include locked scientific context
3. THE report export SHALL include detected features
4. THE report export SHALL include evidence quality warnings
5. THE report export SHALL include claim boundaries

### Requirement 20: Preservation of Deterministic Demo

**User Story:** As a user, I want the existing demo to work unchanged, so that uploaded data does not break existing functionality.

#### Acceptance Criteria

1. THE Upload_Core SHALL NOT modify existing demo projects
2. THE Upload_Core SHALL NOT modify existing routes
3. THE Upload_Core SHALL NOT modify existing localStorage keys for demo data
4. THE Upload_Core SHALL use separate localStorage keys for uploaded data
5. THE Upload_Core SHALL preserve all existing Graph component behavior
6. THE Upload_Core SHALL preserve all existing Notebook behavior
7. THE Upload_Core SHALL preserve all existing Agent behavior
8. THE Upload_Core SHALL preserve all existing History behavior

### Requirement 21: No Backend Implications

**User Story:** As a developer, I want no backend changes, so that the feature remains frontend-only.

#### Acceptance Criteria

1. THE Upload_Core SHALL NOT make HTTP requests to external APIs
2. THE Upload_Core SHALL NOT imply live backend storage
3. THE Upload_Core SHALL NOT imply live Google Scholar scraping
4. THE Upload_Core SHALL NOT imply licensed ICDD/PDF integration
5. THE Upload_Core SHALL use localStorage for uploaded data persistence
6. THE Upload_Core SHALL use client-side file reading APIs

### Requirement 22: Guardrail Enforcement

**User Story:** As a user, I want scientific guardrails enforced, so that claims are bounded correctly.

#### Acceptance Criteria

1. THE Upload_Core SHALL NOT claim phase purity from XRD alone
2. THE Upload_Core SHALL NOT claim oxidation state without XPS validation
3. THE Upload_Core SHALL NOT claim bulk crystal structure from XPS alone
4. THE Upload_Core SHALL NOT generate material-specific claims for Unknown_Technique
5. THE Upload_Core SHALL display claim boundaries for all techniques
6. THE Upload_Core SHALL display validation-limited wording for all feature extraction results

### Requirement 23: Multi-Technique Credibility

**User Story:** As a user, I want XPS, FTIR, and Raman to have credible beta-level behavior, so that DIFARYX does not behave like an XRD-only analyzer.

#### Acceptance Criteria

1. THE Upload_Core SHALL provide credible feature extraction for XPS
2. THE Upload_Core SHALL provide credible feature extraction for FTIR
3. THE Upload_Core SHALL provide credible feature extraction for Raman
4. THE Upload_Core SHALL provide credible feature extraction for XRD
5. THE Upload_Core SHALL display technique-specific claim boundaries for XPS
6. THE Upload_Core SHALL display technique-specific claim boundaries for FTIR
7. THE Upload_Core SHALL display technique-specific claim boundaries for Raman
8. THE Upload_Core SHALL display technique-specific claim boundaries for XRD

### Requirement 24: Build Validation

**User Story:** As a developer, I want the build to pass, so that the feature does not break the application.

#### Acceptance Criteria

1. WHEN the implementation is complete, THE Upload_Core SHALL pass npm.cmd run build without errors
2. WHEN the implementation is complete, THE Upload_Core SHALL pass git diff --check without errors

### Requirement 25: No New Dependencies

**User Story:** As a developer, I want no new dependencies added, so that the feature uses only existing libraries.

#### Acceptance Criteria

1. THE Upload_Core SHALL NOT add new npm packages unless already available in package.json
2. THE Upload_Core SHALL use existing React components
3. THE Upload_Core SHALL use existing Graph component
4. THE Upload_Core SHALL use existing localStorage helpers
5. THE Upload_Core SHALL use existing TypeScript types

### Requirement 26: Upload Interface Placement

**User Story:** As a user, I want to access the upload interface easily, so that I can upload my data without confusion.

#### Acceptance Criteria

1. THE Upload_Core SHALL provide an upload interface accessible from the dashboard
2. THE Upload_Core SHALL provide an upload button or link in the dashboard
3. WHEN the upload button is clicked, THE Upload_Core SHALL display the upload interface
4. THE upload interface SHALL be a new route or modal dialog
5. THE upload interface SHALL NOT replace existing dashboard functionality

### Requirement 27: Uploaded Data Visibility

**User Story:** As a user, I want to see my uploaded data in the project list, so that I can access it like demo projects.

#### Acceptance Criteria

1. WHEN data is uploaded and saved, THE Upload_Core SHALL create a new project entry
2. THE project entry SHALL appear in the dashboard project list
3. THE project entry SHALL display file name, technique, and upload date
4. THE project entry SHALL be visually distinguished from deterministic demo projects
5. WHEN the project entry is clicked, THE Upload_Core SHALL navigate to the appropriate workspace or notebook view

### Requirement 28: Uploaded Data Persistence

**User Story:** As a user, I want my uploaded data persisted, so that I can return to it later.

#### Acceptance Criteria

1. WHEN data is uploaded and saved, THE Upload_Core SHALL store the data in localStorage
2. THE Upload_Core SHALL use a separate localStorage key for uploaded projects
3. WHEN the user returns to the dashboard, THE Upload_Core SHALL load uploaded projects from localStorage
4. THE Upload_Core SHALL preserve uploaded data across browser sessions
5. IF localStorage is full, THEN THE Upload_Core SHALL display an error message

### Requirement 29: Uploaded Data Deletion

**User Story:** As a user, I want to delete uploaded data, so that I can manage my local storage.

#### Acceptance Criteria

1. THE Upload_Core SHALL provide a delete button for uploaded projects
2. WHEN the delete button is clicked, THE Upload_Core SHALL prompt for confirmation
3. WHEN deletion is confirmed, THE Upload_Core SHALL remove the project from localStorage
4. WHEN deletion is confirmed, THE Upload_Core SHALL remove the project from the dashboard project list
5. THE Upload_Core SHALL NOT allow deletion of deterministic demo projects

### Requirement 30: Error Handling for Invalid Files

**User Story:** As a user, I want clear error messages for invalid files, so that I understand what went wrong.

#### Acceptance Criteria

1. IF a file contains no valid x-y data points, THEN THE Upload_Core SHALL display error: "No valid x-y data points found in file."
2. IF a file is too large, THEN THE Upload_Core SHALL display error: "File is too large; maximum size is 10 MB."
3. IF a file format is not supported, THEN THE Upload_Core SHALL display error: "File format not supported; use .txt, .csv, .xy, or .dat."
4. IF a file cannot be read, THEN THE Upload_Core SHALL display error: "File could not be read; check file permissions."
5. THE Upload_Core SHALL display errors in a visible error message component
