# Implementation Plan: Scientific Accuracy Improvements

## Overview

This implementation plan addresses systematic scientific accuracy improvements across the DIFARYX demo application for copper ferrite (CuFe₂O₄) characterization. The plan follows a 6-phase approach: (1) Reference Data Updates, (2) Synthetic Data Generation, (3) UI and Formatting, (4) Scientific Reasoning Engine, (5) Testing, and (6) Documentation. Each task builds incrementally, with checkpoints to ensure validation before proceeding.

The implementation will update XRD peak positions to match JCPDS 25-0283, correct XPS binding energies for Cu²⁺ and Fe³⁺ oxidation states, fix FTIR and Raman vibrational frequencies, implement proper chemical formula subscript formatting (CuFe₂O₄), and enhance synthetic data generators with realistic spectroscopic features.

## Tasks

### Phase 1: Reference Data Updates

- [x] 1. Update XRD phase database with crystallographic metadata
  - Enhance the `XrdPhaseReference` interface in `src/data/xrdPhaseDatabase.ts` to include `crystalSystem`, `spaceGroup`, `latticeParameters`, `jcpdsCard`, and `icddPdf` fields
  - Update CuFe₂O₄ peak positions to match JCPDS 25-0283: (111) at 18.3°, (220) at 30.1°, (311) at 35.5°, (400) at 43.2°, (422) at 53.6°, (511) at 57.1°, (440) at 62.7°
  - Add d-spacing calculations for each peak using Bragg's law
  - Add crystallographic metadata: space group Fd-3m, cubic system, lattice parameter a = 8.37 Å
  - Add JCPDS card number 25-0283 and literature source comments
  - _Requirements: 2.1, 2.2, 2.5, 2.6, 11.1, 11.3, 11.5, 13.1, 13.2, 13.3_

- [x] 2. Create XPS reference data module
  - Create new file `src/data/xpsReferenceData.ts` with `XpsCoreLevelReference` interface
  - Define reference data for Cu 2p₃/₂ (933.5 eV), Cu 2p₁/₂ (953.3 eV), Fe 2p₃/₂ (710.8 eV), Fe 2p₁/₂ (724.3 eV), O 1s lattice (529.8 eV), O 1s hydroxyl (531.5 eV)
  - Include spin-orbit splittings: Cu 2p (19.8 eV), Fe 2p (13.5 eV)
  - Include satellite parameters for Cu²⁺: offset +8-10 eV, intensity 30-50%
  - Include FWHM ranges: 2.0-3.5 eV for core levels
  - Add literature source comments (Biesinger et al., 2009)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 15.2_

- [x] 3. Create FTIR reference data module
  - Create new file `src/data/ftirReferenceData.ts` with `FtirBandReference` interface
  - Define reference data for tetrahedral Fe-O stretching (580 ± 20 cm⁻¹), octahedral metal-oxygen stretching (400 ± 20 cm⁻¹), surface O-H stretching (3400 ± 100 cm⁻¹), adsorbed H-O-H bending (1630 ± 30 cm⁻¹)
  - Include site assignments (tetrahedral, octahedral, surface)
  - Include FWHM ranges: 40-100 cm⁻¹ for vibrational bands
  - Add literature source comments (Waldron, 1955)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 15.3_

- [x] 4. Create Raman reference data module
  - Create new file `src/data/ramanReferenceData.ts` with `RamanModeReference` interface
  - Define reference data for five Raman-active modes: A₁g (690 ± 10 cm⁻¹), Eg (300 ± 15 cm⁻¹), T₂g modes (480 ± 15, 560 ± 15 cm⁻¹)
  - Include symmetry labels (A₁g, Eg, T₂g) and vibrational assignments
  - Set A₁g mode as strongest (relative intensity 100)
  - Include FWHM ranges: 15-40 cm⁻¹ for vibrational modes
  - Add literature source comments (Graves et al., 1988)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 15.3_

- [x] 5. Checkpoint - Verify reference data accuracy
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: Synthetic Data Generation

- [x] 6. Enhance XRD pattern generator with realistic features
  - [x] 6.1 Implement Cu Kα₂ satellite peak generation
    - Add function `addKAlphaSatellites` that generates satellite peaks at +0.2° with 15-20% intensity relative to main peaks
    - Apply to all main XRD peaks in synthetic pattern generation
    - _Requirements: 2.4, 7.8_
  
  - [ ]* 6.2 Write property test for satellite peak generation
    - **Property 5: Satellite Peak Generation**
    - **Validates: Requirements 2.4, 7.8**
  
  - [x] 6.3 Implement exponential background decay
    - Add function `exponentialBackground` that generates monotonically decreasing background from 10° to 80° 2θ
    - Integrate into XRD pattern synthesis
    - _Requirements: 7.1_
  
  - [ ]* 6.4 Write property test for background monotonicity
    - **Property 6: Background Function Monotonicity (XRD)**
    - **Validates: Requirements 7.1**
  
  - [x] 6.5 Implement instrument broadening
    - Add function `instrumentBroadening` that increases peak width (FWHM) with increasing 2θ angle
    - Apply to all peaks in synthetic pattern generation
    - _Requirements: 14.5_
  
  - [ ]* 6.6 Write property test for instrument broadening monotonicity
    - **Property 15: Instrument Broadening Monotonicity**
    - **Validates: Requirements 14.5**
  
  - [x] 6.7 Implement preferred orientation effects
    - Add scaling factors that reduce (111) and (222) peak intensities by up to 30%
    - Apply to synthetic pattern generation
    - _Requirements: 10.3_
  
  - [ ]* 6.8 Write property test for peak intensity ratio preservation
    - **Property 8: Peak Intensity Ratio Preservation (XRD)**
    - **Validates: Requirements 7.8, 10.2, 10.3**

- [x] 7. Create XPS spectrum generator
  - [x] 7.1 Implement Gaussian-Lorentzian peak shape function
    - Create new file `src/data/xpsSpectrumGenerator.ts`
    - Add function `gaussianLorentzian` with mixing parameter and asymmetric tail
    - _Requirements: 7.7, 14.6_
  
  - [ ]* 7.2 Write property test for peak shape function correctness
    - **Property 7: Peak Shape Function Correctness (XPS)**
    - **Validates: Requirements 7.7**
  
  - [x] 7.3 Implement Shirley background function
    - Add function `shirleyBackground` that increases monotonically toward lower binding energy
    - Integrate into XPS spectrum generation
    - _Requirements: 7.2_
  
  - [ ]* 7.4 Write property test for Shirley background monotonicity
    - **Property 6: Background Function Monotonicity (XPS)**
    - **Validates: Requirements 7.2**
  
  - [x] 7.5 Implement XPS satellite peaks for Cu²⁺
    - Add satellite peak generation at +8-10 eV offset with 30-50% intensity
    - Apply to Cu 2p peaks
    - _Requirements: 3.3_
  
  - [ ]* 7.6 Write property test for XPS satellite generation
    - **Property 5: Satellite Peak Generation (XPS)**
    - **Validates: Requirements 3.3**
  
  - [x] 7.7 Implement spin-orbit doublets with correct intensity ratios
    - Generate 2p₃/₂ and 2p₁/₂ peaks with 2:1 intensity ratio
    - Apply to Cu and Fe core levels
    - _Requirements: 10.5_
  
  - [ ]* 7.8 Write property test for spin-orbit intensity ratios
    - **Property 8: Peak Intensity Ratio Preservation (XPS doublets)**
    - **Validates: Requirements 10.5**
  
  - [x] 7.9 Generate complete XPS spectrum with realistic features
    - Combine peak shapes, backgrounds, satellites, and doublets
    - Use binding energies from reference data module
    - Generate peak widths in 2.0-3.5 eV range
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.10_
  
  - [ ]* 7.10 Write property test for XPS peak width ranges
    - **Property 4: Peak Width Ranges by Technique (XPS)**
    - **Validates: Requirements 3.10**

- [x] 8. Enhance FTIR spectrum generator
  - [x] 8.1 Update FTIR band positions in `src/data/syntheticTraces.ts`
    - Replace existing band positions with accurate values from FTIR reference data
    - Generate tetrahedral Fe-O (580 cm⁻¹), octahedral metal-oxygen (400 cm⁻¹), surface O-H (3400 cm⁻¹), adsorbed water (1630 cm⁻¹)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 8.2 Implement realistic baseline drift
    - Add baseline drift function typical of transmission measurements
    - Integrate into FTIR spectrum generation
    - _Requirements: 7.3_
  
  - [x] 8.3 Generate FTIR bands with realistic widths
    - Set FWHM in 40-100 cm⁻¹ range for all vibrational bands
    - _Requirements: 4.5_
  
  - [ ]* 8.4 Write property test for FTIR peak width ranges
    - **Property 4: Peak Width Ranges by Technique (FTIR)**
    - **Validates: Requirements 4.5**

- [x] 9. Enhance Raman spectrum generator
  - [x] 9.1 Update Raman mode positions in `src/data/syntheticTraces.ts`
    - Replace existing mode positions with accurate values from Raman reference data
    - Generate A₁g (690 cm⁻¹), Eg (300 cm⁻¹), T₂g modes (480, 560 cm⁻¹)
    - Set A₁g as strongest mode
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 9.2 Implement fluorescence background
    - Add fluorescence background function typical of visible excitation
    - Integrate into Raman spectrum generation
    - _Requirements: 7.4_
  
  - [x] 9.3 Generate Raman bands with realistic widths
    - Set FWHM in 15-40 cm⁻¹ range for all vibrational modes
    - _Requirements: 5.6_
  
  - [ ]* 9.4 Write property test for Raman peak width ranges
    - **Property 4: Peak Width Ranges by Technique (Raman)**
    - **Validates: Requirements 5.6**

- [ ]* 10. Write property tests for XRD peak position accuracy
  - **Property 2: XRD Peak Position Accuracy**
  - **Validates: Requirements 2.1, 10.2**

- [ ]* 11. Write property tests for spectroscopic range validation
  - **Property 12: Spectroscopic Range Validation**
  - Test XRD (10-80°), XPS (0-1200 eV), FTIR (400-4000 cm⁻¹), Raman (100-1200 cm⁻¹)
  - **Validates: Requirements 14.1, 14.2, 14.3, 14.4**

- [x] 12. Checkpoint - Verify synthetic data generation
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: UI and Formatting

- [x] 13. Create chemical formula formatting utility
  - [x] 13.1 Create `src/utils/chemicalFormula.ts` with `formatChemicalFormula` function
    - Implement conversion of digits to Unicode subscripts (0→₀, 1→₁, 2→₂, etc.)
    - Implement conversion of oxidation states to Unicode superscripts (Cu²⁺, Fe³⁺)
    - _Requirements: 1.1, 8.8_
  
  - [ ]* 13.2 Write property test for chemical formula formatting
    - **Property 1: Chemical Formula Subscript Formatting**
    - **Validates: Requirements 1.1**

- [x] 14. Update UI components with correct chemical formulas
  - Apply `formatChemicalFormula` to all displays of CuFe₂O₄ throughout the application
  - Update landing page, dashboard, workspace views, agent demo view, and notebook
  - Verify formulas display correctly with subscripts
  - _Requirements: 1.1_

- [x] 15. Update technique descriptions on landing page
  - Update XRD description to mention Bragg's law and crystallographic planes
  - Update XPS description to mention binding energies and oxidation states, specify 5-10 nm sampling depth
  - Update FTIR description to mention vibrational modes and infrared absorption
  - Update Raman description to mention inelastic scattering and vibrational modes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 16. Update scientific terminology throughout application
  - Replace incorrect terms: use "binding energy" not "ionization energy", "diffraction peak" not "reflection peak", "vibrational mode" not "vibration band", "wavenumber" not "frequency"
  - Update axis labels: "2θ (°)" for XRD, "Binding energy (eV)" for XPS, "Wavenumber (cm⁻¹)" for FTIR and Raman
  - Update intensity labels: "Intensity (a.u.)" for arbitrary units
  - Use proper notation: "Cu Kα" not "CuKa", oxidation states Cu²⁺ and Fe³⁺
  - _Requirements: 6.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 17. Verify graph component axis labels
  - Check `src/components/ui/Graph.tsx` for correct axis labels and units
  - Ensure all four techniques use correct terminology
  - _Requirements: 6.7, 8.4, 8.5, 8.6_

- [x] 18. Checkpoint - Verify UI formatting and terminology
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Scientific Reasoning Engine

- [x] 19. Enhance confidence calculation algorithm
  - [x] 19.1 Implement weighted scoring for strong peaks
    - Modify confidence calculation in `src/agents/xrdAgent/` to weight peaks with relative intensity > 30 more heavily
    - _Requirements: 9.2_
  
  - [x] 19.2 Implement penalty for missing strong peaks
    - Add function `penaltyForMissingStrongPeaks` that reduces confidence when strong reference peaks are not matched
    - _Requirements: 9.2_
  
  - [x] 19.3 Implement penalty for unexplained peaks
    - Add function `penaltyForUnexplainedPeaks` that reduces confidence when observed peaks cannot be matched to reference
    - _Requirements: 9.3_
  
  - [ ]* 19.4 Write property test for confidence monotonicity
    - **Property 9: Confidence Calculation Monotonicity**
    - Test that confidence increases with match ratio, decreases with unexplained peaks, respects thresholds (50%, 85%)
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.5, 9.6**
  
  - [x] 19.5 Implement confidence threshold rules
    - Ensure confidence > 85% only when ≥80% of strong peaks matched
    - Ensure confidence < 50% when <50% of reference peaks matched
    - _Requirements: 9.5, 9.6_
  
  - [x] 19.6 Implement ambiguity detection
    - Flag cases where multiple phases have similar confidence scores
    - Recommend complementary techniques when ambiguity detected
    - _Requirements: 9.4_
  
  - [x] 19.7 Implement peak position tolerance matching
    - Use ±0.2° tolerance for XRD, ±0.5 eV for XPS, ±20 cm⁻¹ for FTIR, ±15 cm⁻¹ for Raman
    - _Requirements: 9.7_
  
  - [ ]* 19.8 Write property test for peak position tolerance matching
    - **Property 14: Peak Position Tolerance Matching**
    - **Validates: Requirements 9.7**

- [x] 20. Enhance interpretation generation
  - [x] 20.1 Include crystallographic metadata in XRD interpretations
    - Add phase name, crystal system, space group to interpretation text
    - Add JCPDS card number reference
    - _Requirements: 1.2, 1.3, 1.4, 12.1, 12.5_
  
  - [x] 20.2 Include oxidation state assignments in XPS interpretations
    - Assign Cu²⁺ and Fe³⁺ based on binding energy ranges
    - Explain satellite peaks as characteristic of Cu²⁺
    - _Requirements: 12.2, 12.5_
  
  - [x] 20.3 Include vibrational mode symmetry labels in Raman interpretations
    - Assign A₁g, Eg, T₂g symmetry labels to detected modes
    - Explain assignments based on spinel structure group theory
    - _Requirements: 12.4, 12.5_
  
  - [x] 20.4 Include site assignments in FTIR interpretations
    - Relate band positions to tetrahedral and octahedral metal-oxygen bonds
    - _Requirements: 12.3, 12.5_
  
  - [x] 20.5 Add caveats and limitations to interpretations
    - Specify XPS is surface-sensitive (5-10 nm depth)
    - Recommend complementary techniques for ambiguous cases
    - State when confidence is low and additional data needed
    - _Requirements: 12.6, 12.7_

- [x] 21. Checkpoint - Verify reasoning engine enhancements
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Testing and Validation

- [x] 22. Write unit tests for reference data validation
  - [x] 22.1 Write tests for XRD reference data
    - Verify CuFe₂O₄ peak positions match JCPDS 25-0283 (7 tests, one per peak)
    - Verify crystallographic metadata (space group, lattice parameters)
    - Verify Miller indices satisfy systematic absences
    - _Requirements: 2.1, 2.2, 11.1, 11.2, 13.2, 13.3_
  
  - [x] 22.2 Write tests for XPS reference data
    - Verify Cu and Fe binding energies match literature values (7 tests for core levels)
    - Verify spin-orbit splittings (2 tests)
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_
  
  - [x] 22.3 Write tests for FTIR reference data
    - Verify band positions match literature values (4 tests)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 22.4 Write tests for Raman reference data
    - Verify mode positions match literature values (5 tests)
    - Verify symmetry labels are correct
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

- [ ]* 23. Write property tests for mathematical calculations
  - [ ]* 23.1 Write property test for Bragg's law calculation
    - **Property 3: Bragg's Law Calculation**
    - **Validates: Requirements 2.6**
  
  - [ ]* 23.2 Write property test for d-spacing from Miller indices
    - **Property 11: D-Spacing Calculation from Miller Indices**
    - **Validates: Requirements 11.5**
  
  - [ ]* 23.3 Write property test for Miller indices systematic absences
    - **Property 10: Miller Indices Systematic Absences**
    - **Validates: Requirements 11.1, 11.2**
  
  - [ ]* 23.4 Write property test for peak list sorting
    - **Property 13: Peak List Sorting Invariant**
    - **Validates: Requirements 11.3**

- [x] 24. Write integration tests for end-to-end workflows
  - [x] 24.1 Write XRD workflow integration test
    - Test: Load phase database → Generate synthetic pattern → Detect peaks → Match phase → Calculate confidence
    - Verify confidence > 85% for clean CuFe₂O₄ pattern
    - _Requirements: 2.1, 2.2, 9.1, 9.5_
  
  - [x] 24.2 Write multi-technique workflow integration test
    - Test: Generate XRD, XPS, FTIR, Raman data → Verify all identify CuFe₂O₄
    - Verify complementary evidence is correctly combined
    - _Requirements: 1.2, 2.1, 3.1, 4.1, 5.1_
  
  - [x] 24.3 Write UI rendering integration tests
    - Verify chemical formulas display with subscripts
    - Verify graph axis labels use correct units
    - Verify technique descriptions contain correct terminology
    - _Requirements: 1.1, 6.1, 6.2, 6.3, 6.4, 6.7, 8.4, 8.5, 8.6_

- [ ] 25. Write validation tests for literature accuracy
  - [~] 25.1 Write literature comparison tests
    - Compare all XRD peak positions to JCPDS 25-0283
    - Compare all XPS binding energies to Biesinger et al. (2009)
    - Compare all FTIR bands to Waldron (1955)
    - Compare all Raman modes to Graves et al. (1988)
    - Flag deviations exceeding experimental uncertainty
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [~] 25.2 Write cross-technique consistency tests
    - Verify CuFe₂O₄ identification consistent across all techniques
    - Verify oxidation states from XPS match structural description
    - Verify vibrational modes match spinel structure
    - _Requirements: 1.2, 1.3, 1.4, 12.2, 12.3, 12.4_

- [~] 26. Final checkpoint - Ensure all tests pass
  - Run complete test suite (unit, property, integration, validation)
  - Verify >90% code coverage for modified modules
  - Ensure all 15 requirements and 80+ acceptance criteria validated
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: Documentation

- [~] 27. Update code comments with literature sources
  - Add literature source comments to all reference data files
  - Document JCPDS card numbers, peer-reviewed papers, XPS databases
  - Document any deviations from literature values with justification
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [~] 28. Create references document
  - List key scientific papers for CuFe₂O₄ characterization
  - List JCPDS/ICDD card numbers used
  - List XPS databases consulted
  - Include full citations for all literature sources
  - _Requirements: 15.5_

- [~] 29. Update project documentation
  - Document scientific accuracy improvements in README or project docs
  - Document testing approach (unit, property, integration, validation)
  - Document validation against literature
  - Document known limitations and future enhancements
  - _Requirements: 15.5_

- [~] 30. Final review and completion
  - Review all code changes for scientific accuracy
  - Review all documentation for completeness
  - Verify all requirements satisfied
  - Prepare summary of changes for stakeholders

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with ≥100 iterations
- Unit tests validate specific reference values against literature
- Integration tests validate end-to-end workflows
- The implementation uses TypeScript and builds on the existing DIFARYX React/Vite application
- All spectroscopic parameters are validated against authoritative sources (JCPDS 25-0283, peer-reviewed literature)
- Chemical formula formatting uses Unicode subscripts for proper display
- Confidence calculations follow scientifically sound reasoning with weighted scoring and penalty functions
