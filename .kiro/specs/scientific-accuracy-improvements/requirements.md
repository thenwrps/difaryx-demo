# Requirements Document: Scientific Accuracy Improvements

## Introduction

This document specifies requirements for ensuring scientific accuracy across the DIFARYX demo application. The application demonstrates autonomous scientific analysis of CuFe₂O₄ (copper ferrite spinel) using four characterization techniques: X-ray Diffraction (XRD), X-ray Photoelectron Spectroscopy (XPS), Fourier Transform Infrared Spectroscopy (FTIR), and Raman Spectroscopy. All chemical formulas, spectroscopic data, peak positions, binding energies, vibrational modes, and scientific interpretations must be accurate and consistent with established scientific literature for CuFe₂O₄ characterization.

## Glossary

- **DIFARYX_Application**: The demo web application for autonomous scientific materials characterization
- **CuFe₂O₄**: Copper ferrite with inverse spinel crystal structure (space group Fd-3m)
- **XRD_Module**: X-ray Diffraction analysis component using Cu Kα radiation (λ = 1.5406 Å)
- **XPS_Module**: X-ray Photoelectron Spectroscopy analysis component for surface chemical states
- **FTIR_Module**: Fourier Transform Infrared Spectroscopy analysis component for vibrational modes
- **Raman_Module**: Raman Spectroscopy analysis component for vibrational modes
- **Synthetic_Trace_Generator**: Code module that generates realistic spectroscopic data
- **Phase_Database**: Reference database containing crystallographic peak positions
- **Scientific_Reasoning_Engine**: Component that interprets spectroscopic evidence
- **Spinel_Structure**: Cubic crystal structure with AB₂O₄ stoichiometry (space group Fd-3m)
- **Inverse_Spinel**: Spinel structure where divalent cations occupy octahedral sites
- **JCPDS**: Joint Committee on Powder Diffraction Standards reference database
- **ICDD**: International Centre for Diffraction Data
- **Binding_Energy**: Energy required to remove an electron from a core level (eV)
- **Vibrational_Mode**: Characteristic molecular vibration frequency (cm⁻¹)
- **2θ**: Diffraction angle in X-ray diffraction (degrees)
- **hkl_Indices**: Miller indices describing crystallographic planes

## Requirements

### Requirement 1: Correct Chemical Formula and Structure

**User Story:** As a materials scientist, I want the chemical formula and crystal structure of copper ferrite to be scientifically accurate, so that the demo represents valid materials science.

#### Acceptance Criteria

1. THE DIFARYX_Application SHALL display CuFe₂O₄ with proper subscript formatting throughout all user interfaces
2. THE DIFARYX_Application SHALL describe CuFe₂O₄ as having inverse spinel structure with space group Fd-3m
3. THE DIFARYX_Application SHALL specify that Cu²⁺ ions occupy octahedral sites in the inverse spinel structure
4. THE DIFARYX_Application SHALL specify that Fe³⁺ ions occupy both tetrahedral and octahedral sites
5. THE DIFARYX_Application SHALL use the lattice parameter a ≈ 8.37 Å for CuFe₂O₄ spinel structure

### Requirement 2: Accurate XRD Peak Positions

**User Story:** As a crystallographer, I want XRD peak positions to match published crystallographic data for CuFe₂O₄, so that the phase identification is scientifically valid.

#### Acceptance Criteria

1. WHEN generating XRD synthetic traces, THE Synthetic_Trace_Generator SHALL use 2θ peak positions that match JCPDS 25-0283 or ICDD 01-077-0010 within ±0.2°
2. THE Phase_Database SHALL contain the following reference peaks for CuFe₂O₄: (111) at 18.3°, (220) at 30.1°, (311) at 35.5°, (400) at 43.2°, (422) at 53.6°, (511) at 57.1°, (440) at 62.7°
3. THE XRD_Module SHALL assign the (311) reflection as the strongest peak with relative intensity 100
4. THE XRD_Module SHALL include Cu Kα₂ satellite peaks at approximately +0.2° from main peaks with 15-20% relative intensity
5. THE Phase_Database SHALL specify Cu Kα radiation wavelength as 1.5406 Å
6. WHEN calculating d-spacing, THE XRD_Module SHALL use Bragg's law: d = λ / (2 sin θ)
7. THE XRD_Module SHALL generate peak widths (FWHM) between 0.15° and 0.25° for well-crystallized CuFe₂O₄

### Requirement 3: Accurate XPS Binding Energies

**User Story:** As a surface scientist, I want XPS binding energies to reflect correct oxidation states for Cu and Fe in CuFe₂O₄, so that chemical state assignments are scientifically valid.

#### Acceptance Criteria

1. THE XPS_Module SHALL assign Cu 2p₃/₂ binding energy at 933.5 ± 0.5 eV for Cu²⁺ oxidation state
2. THE XPS_Module SHALL assign Cu 2p₁/₂ binding energy at 953.3 ± 0.5 eV for Cu²⁺ oxidation state
3. THE XPS_Module SHALL include Cu²⁺ satellite peaks at approximately +8-10 eV from main Cu 2p peaks
4. THE XPS_Module SHALL assign Fe 2p₃/₂ binding energy at 710.8 ± 0.5 eV for Fe³⁺ oxidation state
5. THE XPS_Module SHALL assign Fe 2p₁/₂ binding energy at 724.3 ± 0.5 eV for Fe³⁺ oxidation state
6. THE XPS_Module SHALL assign O 1s binding energy at 529.8 ± 0.3 eV for lattice oxygen in spinel structure
7. THE XPS_Module SHALL include O 1s component at 531.5 ± 0.5 eV for surface hydroxyl groups
8. THE XPS_Module SHALL specify spin-orbit splitting of 19.8 ± 0.3 eV for Cu 2p doublet
9. THE XPS_Module SHALL specify spin-orbit splitting of 13.5 ± 0.3 eV for Fe 2p doublet
10. THE Synthetic_Trace_Generator SHALL generate XPS peak widths (FWHM) between 2.0 and 3.5 eV for core levels

### Requirement 4: Accurate FTIR Vibrational Bands

**User Story:** As a spectroscopist, I want FTIR band positions to correspond to correct metal-oxygen vibrational modes in spinel structure, so that structural assignments are scientifically valid.

#### Acceptance Criteria

1. THE FTIR_Module SHALL assign the tetrahedral site (Fe-O) stretching vibration at 580 ± 20 cm⁻¹
2. THE FTIR_Module SHALL assign the octahedral site (Cu-O, Fe-O) stretching vibration at 400 ± 20 cm⁻¹
3. THE FTIR_Module SHALL include O-H stretching vibration at 3400 ± 100 cm⁻¹ for surface hydroxyl groups
4. THE FTIR_Module SHALL include H-O-H bending vibration at 1630 ± 30 cm⁻¹ for adsorbed water
5. THE Synthetic_Trace_Generator SHALL generate FTIR bands with widths (FWHM) between 40 and 100 cm⁻¹
6. THE FTIR_Module SHALL describe bands below 700 cm⁻¹ as metal-oxygen stretching vibrations characteristic of spinel structure

### Requirement 5: Accurate Raman Vibrational Modes

**User Story:** As a vibrational spectroscopist, I want Raman mode assignments to follow group theory predictions for spinel structure, so that symmetry assignments are scientifically valid.

#### Acceptance Criteria

1. THE Raman_Module SHALL assign A₁g mode at 690 ± 10 cm⁻¹ for symmetric stretching of oxygen in tetrahedral coordination
2. THE Raman_Module SHALL assign T₂g mode at 480 ± 15 cm⁻¹ for asymmetric bending vibrations
3. THE Raman_Module SHALL assign Eg mode at 300 ± 15 cm⁻¹ for symmetric bending vibrations
4. THE Raman_Module SHALL assign T₂g mode at 560 ± 15 cm⁻¹ for octahedral site vibrations
5. THE Raman_Module SHALL describe the A₁g mode as the strongest Raman-active mode for spinel structure
6. THE Synthetic_Trace_Generator SHALL generate Raman bands with widths (FWHM) between 15 and 40 cm⁻¹
7. THE Raman_Module SHALL specify that spinel structure has 5 Raman-active modes: A₁g + Eg + 3T₂g

### Requirement 6: Scientifically Accurate Technique Descriptions

**User Story:** As an educator, I want technique descriptions on the landing page to be scientifically accurate, so that users learn correct scientific principles.

#### Acceptance Criteria

1. THE DIFARYX_Application SHALL describe XRD as measuring diffraction from crystallographic planes following Bragg's law
2. THE DIFARYX_Application SHALL describe XPS as measuring binding energies of core-level electrons to determine oxidation states
3. THE DIFARYX_Application SHALL describe FTIR as measuring vibrational modes from infrared absorption by molecular bonds
4. THE DIFARYX_Application SHALL describe Raman as measuring inelastic scattering from vibrational modes
5. THE DIFARYX_Application SHALL specify that XRD provides bulk crystallographic information
6. THE DIFARYX_Application SHALL specify that XPS provides surface-sensitive chemical state information (sampling depth 5-10 nm)
7. THE DIFARYX_Application SHALL use correct units: 2θ (degrees) for XRD, eV for XPS, cm⁻¹ for FTIR and Raman

### Requirement 7: Realistic Synthetic Spectroscopic Data

**User Story:** As a researcher, I want synthetic spectroscopic traces to be realistic, so that the demo accurately represents real experimental data.

#### Acceptance Criteria

1. THE Synthetic_Trace_Generator SHALL generate XRD patterns with exponentially decaying background from 10° to 80° 2θ
2. THE Synthetic_Trace_Generator SHALL generate XPS spectra with Shirley-type background increasing toward lower binding energy
3. THE Synthetic_Trace_Generator SHALL generate FTIR spectra with baseline drift typical of transmission measurements
4. THE Synthetic_Trace_Generator SHALL generate Raman spectra with fluorescence background typical of visible excitation
5. THE Synthetic_Trace_Generator SHALL add deterministic noise with signal-to-noise ratio between 20:1 and 50:1
6. THE Synthetic_Trace_Generator SHALL use pseudo-Voigt peak shapes (mixture of Gaussian and Lorentzian) for XRD peaks
7. THE Synthetic_Trace_Generator SHALL use Gaussian-Lorentzian peak shapes for XPS core levels
8. THE Synthetic_Trace_Generator SHALL generate peak intensities that follow relative intensity patterns from reference data

### Requirement 8: Correct Scientific Terminology

**User Story:** As a domain expert, I want all scientific terminology to be precise and accurate, so that the application maintains scientific credibility.

#### Acceptance Criteria

1. THE DIFARYX_Application SHALL use "binding energy" (not "ionization energy") for XPS measurements
2. THE DIFARYX_Application SHALL use "diffraction peak" (not "reflection peak") for XRD features
3. THE DIFARYX_Application SHALL use "vibrational mode" (not "vibration band") for Raman spectroscopy
4. THE DIFARYX_Application SHALL use "wavenumber" (not "frequency") for FTIR and Raman x-axis labels
5. THE DIFARYX_Application SHALL use "intensity (a.u.)" for arbitrary units in spectroscopic plots
6. THE DIFARYX_Application SHALL use "2θ" (not "2-theta" or "two-theta") for XRD diffraction angle
7. THE DIFARYX_Application SHALL use "Cu Kα" (not "CuKa" or "Cu-Ka") for X-ray source notation
8. THE DIFARYX_Application SHALL use proper oxidation state notation: Cu²⁺ and Fe³⁺ (not Cu2+ or Fe3+)

### Requirement 9: Scientifically Sound Confidence Calculations

**User Story:** As a scientist, I want confidence scores to be based on sound scientific reasoning, so that uncertainty quantification is meaningful.

#### Acceptance Criteria

1. WHEN calculating phase identification confidence, THE Scientific_Reasoning_Engine SHALL consider the ratio of matched peaks to total reference peaks
2. WHEN calculating phase identification confidence, THE Scientific_Reasoning_Engine SHALL penalize missing strong reference peaks (relative intensity > 30) more than weak peaks
3. WHEN calculating phase identification confidence, THE Scientific_Reasoning_Engine SHALL reduce confidence when unindexed peaks are present
4. WHEN multiple phases show similar match scores, THE Scientific_Reasoning_Engine SHALL flag ambiguity and recommend complementary techniques
5. THE Scientific_Reasoning_Engine SHALL assign confidence above 85% only when at least 80% of strong reference peaks are matched
6. THE Scientific_Reasoning_Engine SHALL assign confidence below 50% when fewer than 50% of reference peaks are matched
7. THE Scientific_Reasoning_Engine SHALL incorporate peak position tolerance (±0.2° for XRD) in match scoring

### Requirement 10: Accurate Peak Intensity Ratios

**User Story:** As a crystallographer, I want relative peak intensities to match theoretical or experimental patterns, so that phase identification is based on realistic data.

#### Acceptance Criteria

1. THE Phase_Database SHALL store relative intensities for CuFe₂O₄ with (311) peak normalized to 100
2. THE Synthetic_Trace_Generator SHALL generate XRD peak intensities within ±20% of reference relative intensities
3. THE Synthetic_Trace_Generator SHALL apply preferred orientation effects that reduce (111) and (222) intensities by up to 30%
4. THE Synthetic_Trace_Generator SHALL generate XPS peak intensity ratios consistent with stoichiometry: Fe:Cu atomic ratio approximately 2:1
5. THE Synthetic_Trace_Generator SHALL generate XPS spin-orbit intensity ratios: 2p₃/₂:2p₁/₂ approximately 2:1

### Requirement 11: Correct Crystallographic Miller Indices

**User Story:** As a crystallographer, I want Miller indices to correctly correspond to peak positions, so that crystallographic assignments are valid.

#### Acceptance Criteria

1. THE Phase_Database SHALL assign Miller indices following cubic spinel systematic absences: h+k, h+l, k+l all even
2. THE XRD_Module SHALL verify that assigned hkl indices satisfy spinel structure factor rules
3. THE Phase_Database SHALL list peaks in order of increasing 2θ angle
4. THE XRD_Module SHALL format Miller indices with parentheses: (hkl) for individual planes
5. THE XRD_Module SHALL calculate d-spacing from Miller indices using: d = a / √(h² + k² + l²) for cubic systems

### Requirement 12: Scientifically Valid Interpretation Text

**User Story:** As a researcher, I want interpretation text to follow established scientific reasoning, so that conclusions are scientifically defensible.

#### Acceptance Criteria

1. WHEN interpreting XRD results, THE Scientific_Reasoning_Engine SHALL state the matched phase, crystal system, and space group
2. WHEN interpreting XPS results, THE Scientific_Reasoning_Engine SHALL assign oxidation states based on binding energy ranges
3. WHEN interpreting FTIR results, THE Scientific_Reasoning_Engine SHALL relate band positions to specific metal-oxygen bonds
4. WHEN interpreting Raman results, THE Scientific_Reasoning_Engine SHALL assign symmetry labels (A₁g, Eg, T₂g) to vibrational modes
5. THE Scientific_Reasoning_Engine SHALL cite reference sources (JCPDS card numbers, literature values) in interpretations
6. THE Scientific_Reasoning_Engine SHALL state limitations and caveats (e.g., "surface-sensitive," "requires complementary techniques")
7. THE Scientific_Reasoning_Engine SHALL recommend appropriate next steps based on confidence level and detected ambiguities

### Requirement 13: Accurate Phase Database References

**User Story:** As a materials scientist, I want phase database entries to match published crystallographic databases, so that phase identification is traceable to authoritative sources.

#### Acceptance Criteria

1. THE Phase_Database SHALL include JCPDS card number or ICDD PDF number for each reference phase
2. THE Phase_Database SHALL specify the crystal system and space group for each phase
3. THE Phase_Database SHALL include lattice parameters for each phase
4. THE Phase_Database SHALL distinguish between CuFe₂O₄ (inverse spinel), Fe₃O₄ (inverse spinel), and α-Fe₂O₃ (hematite, rhombohedral)
5. THE Phase_Database SHALL include diagnostic peaks that differentiate similar phases (e.g., hematite peaks at 24.1° and 33.2° not present in spinel)

### Requirement 14: Correct Spectroscopic Parameter Ranges

**User Story:** As an analytical chemist, I want spectroscopic parameters to fall within physically realistic ranges, so that generated data is plausible.

#### Acceptance Criteria

1. THE Synthetic_Trace_Generator SHALL generate XRD 2θ values between 10° and 80° for Cu Kα radiation
2. THE Synthetic_Trace_Generator SHALL generate XPS binding energies between 0 and 1200 eV
3. THE Synthetic_Trace_Generator SHALL generate FTIR wavenumbers between 400 and 4000 cm⁻¹
4. THE Synthetic_Trace_Generator SHALL generate Raman shifts between 100 and 1200 cm⁻¹ for inorganic oxides
5. THE Synthetic_Trace_Generator SHALL generate peak widths that increase with 2θ for XRD (instrument broadening)
6. THE Synthetic_Trace_Generator SHALL generate asymmetric peak shapes for XPS peaks (Gaussian-Lorentzian with exponential tail)

### Requirement 15: Validation Against Literature Values

**User Story:** As a quality assurance reviewer, I want all spectroscopic parameters to be validated against peer-reviewed literature, so that scientific accuracy is verifiable.

#### Acceptance Criteria

1. THE DIFARYX_Application SHALL document literature sources for all reference peak positions in code comments
2. THE DIFARYX_Application SHALL document literature sources for all binding energy assignments in code comments
3. THE DIFARYX_Application SHALL document literature sources for all vibrational mode assignments in code comments
4. WHEN spectroscopic parameters deviate from literature values by more than typical experimental uncertainty, THE DIFARYX_Application SHALL document the justification
5. THE DIFARYX_Application SHALL include a references section in documentation listing key scientific papers for CuFe₂O₄ characterization

## Notes

This requirements document focuses on ensuring scientific accuracy and credibility of the DIFARYX demo application. All spectroscopic data, chemical formulas, and interpretations must be consistent with established materials science literature for copper ferrite (CuFe₂O₄) characterization. The requirements prioritize:

1. **Accuracy**: All numerical values (peak positions, binding energies, vibrational frequencies) must match published data within experimental uncertainty
2. **Consistency**: Chemical formulas, oxidation states, and structural descriptions must be internally consistent across all modules
3. **Traceability**: All reference data must be traceable to authoritative sources (JCPDS/ICDD, peer-reviewed literature)
4. **Realism**: Synthetic spectroscopic data must include realistic features (backgrounds, noise, peak shapes) typical of experimental measurements
5. **Terminology**: All scientific terminology must be precise and follow standard conventions in materials characterization

Key literature references for validation:
- JCPDS Card 25-0283 (CuFe₂O₄)
- ICDD PDF 01-077-0010 (CuFe₂O₄)
- Waldron, R. D. (1955). "Infrared Spectra of Ferrites." Physical Review, 99(6), 1727-1735.
- Graves, P. R., et al. (1988). "Raman microprobe spectroscopy of the spinels." Materials Research Bulletin, 23(11), 1651-1660.
- McIntyre, N. S., & Zetaruk, D. G. (1977). "X-ray photoelectron spectroscopic studies of iron oxides." Analytical Chemistry, 49(11), 1521-1529.
