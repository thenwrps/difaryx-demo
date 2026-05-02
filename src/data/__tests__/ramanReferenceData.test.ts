/**
 * Unit tests for Raman Reference Data
 * 
 * These tests validate that the Raman reference data module meets all requirements
 * specified in the scientific-accuracy-improvements spec (Task 4).
 */

import { describe, it, expect } from 'vitest';
import {
  RAMAN_REFERENCE_DATA,
  RamanModeReference,
  getRamanModesBySymmetry,
  getStrongestRamanMode,
  getT2gModes,
  getRamanModeByPosition,
  isValidSpinelRamanRange,
  getSymmetryRamanRange,
  validateModePosition,
  getAllModesSorted,
  getExpectedModeCount,
  verifyCompleteRamanModes,
  getSymmetryDescription,
  getIntensityRatio
} from '../ramanReferenceData';

describe('Raman Reference Data Module', () => {
  describe('Interface and Data Structure', () => {
    it('should have RamanModeReference interface with all required fields', () => {
      // Requirement 5.1-5.7: Interface should include position, uncertainty, symmetry, assignment, relativeIntensity, fwhm, literatureSource
      const mode = RAMAN_REFERENCE_DATA[0];
      
      expect(mode).toHaveProperty('position');
      expect(mode).toHaveProperty('uncertainty');
      expect(mode).toHaveProperty('symmetry');
      expect(mode).toHaveProperty('assignment');
      expect(mode).toHaveProperty('relativeIntensity');
      expect(mode).toHaveProperty('fwhm');
      expect(mode).toHaveProperty('literatureSource');
      
      expect(typeof mode.position).toBe('number');
      expect(typeof mode.uncertainty).toBe('number');
      expect(typeof mode.symmetry).toBe('string');
      expect(typeof mode.assignment).toBe('string');
      expect(typeof mode.relativeIntensity).toBe('number');
      expect(Array.isArray(mode.fwhm)).toBe(true);
      expect(mode.fwhm.length).toBe(2);
      expect(typeof mode.literatureSource).toBe('string');
    });
  });

  describe('Five Raman-Active Modes (Requirement 5.7)', () => {
    it('should contain exactly 5 Raman-active modes', () => {
      // Requirement 5.7: Specify that spinel structure has 5 Raman-active modes: A₁g + Eg + 3T₂g
      expect(RAMAN_REFERENCE_DATA.length).toBe(5);
      expect(getExpectedModeCount()).toBe(5);
      expect(verifyCompleteRamanModes()).toBe(true);
    });

    it('should have 1 A₁g mode, 1 Eg mode, and 3 T₂g modes', () => {
      // Requirement 5.7: A₁g + Eg + 3T₂g
      const a1gModes = getRamanModesBySymmetry('A1g');
      const egModes = getRamanModesBySymmetry('Eg');
      const t2gModes = getRamanModesBySymmetry('T2g');
      
      expect(a1gModes.length).toBe(1);
      expect(egModes.length).toBe(1);
      expect(t2gModes.length).toBe(3);
    });
  });

  describe('A₁g Mode (Requirement 5.1, 5.5)', () => {
    it('should have A₁g mode at 690 ± 10 cm⁻¹', () => {
      // Requirement 5.1: Assign A₁g mode at 690 ± 10 cm⁻¹
      const a1gMode = getStrongestRamanMode();
      
      expect(a1gMode.symmetry).toBe('A1g');
      expect(a1gMode.position).toBe(690);
      expect(a1gMode.uncertainty).toBe(10);
    });

    it('should have A₁g mode as the strongest (relative intensity 100)', () => {
      // Requirement 5.5: Describe the A₁g mode as the strongest Raman-active mode
      const a1gMode = getStrongestRamanMode();
      
      expect(a1gMode.relativeIntensity).toBe(100);
      
      // Verify it's the strongest among all modes
      const allModes = RAMAN_REFERENCE_DATA;
      const maxIntensity = Math.max(...allModes.map(m => m.relativeIntensity));
      expect(a1gMode.relativeIntensity).toBe(maxIntensity);
    });

    it('should have correct assignment for A₁g mode', () => {
      // Requirement 5.1: Symmetric stretching of oxygen in tetrahedral coordination
      const a1gMode = getStrongestRamanMode();
      
      expect(a1gMode.assignment).toContain('tetrahedral');
      expect(a1gMode.assignment.toLowerCase()).toContain('symmetric');
      expect(a1gMode.assignment.toLowerCase()).toContain('stretching');
    });
  });

  describe('Eg Mode (Requirement 5.3)', () => {
    it('should have Eg mode at 300 ± 15 cm⁻¹', () => {
      // Requirement 5.3: Assign Eg mode at 300 ± 15 cm⁻¹
      const egModes = getRamanModesBySymmetry('Eg');
      
      expect(egModes.length).toBe(1);
      expect(egModes[0].position).toBe(300);
      expect(egModes[0].uncertainty).toBe(15);
    });

    it('should have correct assignment for Eg mode', () => {
      // Requirement 5.3: Symmetric bending vibrations
      const egModes = getRamanModesBySymmetry('Eg');
      
      expect(egModes[0].assignment.toLowerCase()).toContain('symmetric');
      expect(egModes[0].assignment.toLowerCase()).toContain('bending');
    });
  });

  describe('T₂g Modes (Requirement 5.2, 5.4)', () => {
    it('should have T₂g mode at 480 ± 15 cm⁻¹', () => {
      // Requirement 5.2: Assign T₂g mode at 480 ± 15 cm⁻¹
      const mode = getRamanModeByPosition(480, 20);
      
      expect(mode).toBeDefined();
      expect(mode?.symmetry).toBe('T2g');
      expect(mode?.position).toBe(480);
      expect(mode?.uncertainty).toBe(15);
    });

    it('should have T₂g mode at 560 ± 15 cm⁻¹', () => {
      // Requirement 5.4: Assign T₂g mode at 560 ± 15 cm⁻¹
      const mode = getRamanModeByPosition(560, 20);
      
      expect(mode).toBeDefined();
      expect(mode?.symmetry).toBe('T2g');
      expect(mode?.position).toBe(560);
      expect(mode?.uncertainty).toBe(15);
    });

    it('should have all 3 T₂g modes with correct properties', () => {
      // Requirement 5.2, 5.4: T₂g modes for asymmetric vibrations
      const t2gModes = getT2gModes();
      
      expect(t2gModes.length).toBe(3);
      
      // All should have T2g symmetry
      t2gModes.forEach(mode => {
        expect(mode.symmetry).toBe('T2g');
      });
      
      // Check that assignments mention asymmetric vibrations
      t2gModes.forEach(mode => {
        expect(mode.assignment.toLowerCase()).toContain('asymmetric');
      });
    });
  });

  describe('FWHM Ranges (Requirement 5.6)', () => {
    it('should have FWHM ranges between 15-40 cm⁻¹ for all vibrational modes', () => {
      // Requirement 5.6: Generate Raman bands with widths (FWHM) between 15 and 40 cm⁻¹
      RAMAN_REFERENCE_DATA.forEach(mode => {
        const [minFwhm, maxFwhm] = mode.fwhm;
        
        // Check that FWHM range is within 15-40 cm⁻¹
        expect(minFwhm).toBeGreaterThanOrEqual(15);
        expect(maxFwhm).toBeLessThanOrEqual(40);
        expect(minFwhm).toBeLessThan(maxFwhm);
      });
    });
  });

  describe('Literature Sources (Requirement 15.3)', () => {
    it('should include literature source comments (Graves et al., 1988)', () => {
      // Requirement 15.3: Document literature sources for all vibrational mode assignments
      RAMAN_REFERENCE_DATA.forEach(mode => {
        expect(mode.literatureSource).toBeDefined();
        expect(mode.literatureSource.length).toBeGreaterThan(0);
        
        // Should reference Graves et al., 1988 (primary source for spinel Raman modes)
        expect(mode.literatureSource).toContain('Graves');
        expect(mode.literatureSource).toContain('1988');
      });
    });
  });

  describe('Symmetry Labels (Requirement 5.1-5.4)', () => {
    it('should include symmetry labels (A₁g, Eg, T₂g) for all modes', () => {
      // Requirements 5.1-5.4: Include symmetry labels
      RAMAN_REFERENCE_DATA.forEach(mode => {
        expect(['A1g', 'Eg', 'T2g']).toContain(mode.symmetry);
      });
    });
  });

  describe('Vibrational Assignments', () => {
    it('should include vibrational assignments for all modes', () => {
      // Requirements 5.1-5.4: Include vibrational assignments
      RAMAN_REFERENCE_DATA.forEach(mode => {
        expect(mode.assignment).toBeDefined();
        expect(mode.assignment.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Helper Functions', () => {
    it('should get modes by symmetry correctly', () => {
      const a1gModes = getRamanModesBySymmetry('A1g');
      const egModes = getRamanModesBySymmetry('Eg');
      const t2gModes = getRamanModesBySymmetry('T2g');
      
      expect(a1gModes.every(m => m.symmetry === 'A1g')).toBe(true);
      expect(egModes.every(m => m.symmetry === 'Eg')).toBe(true);
      expect(t2gModes.every(m => m.symmetry === 'T2g')).toBe(true);
    });

    it('should get mode by position with tolerance', () => {
      const mode690 = getRamanModeByPosition(690, 20);
      const mode300 = getRamanModeByPosition(300, 20);
      const mode480 = getRamanModeByPosition(480, 20);
      
      expect(mode690?.position).toBe(690);
      expect(mode300?.position).toBe(300);
      expect(mode480?.position).toBe(480);
    });

    it('should validate spinel Raman range (100-1200 cm⁻¹)', () => {
      expect(isValidSpinelRamanRange(50)).toBe(false);
      expect(isValidSpinelRamanRange(100)).toBe(true);
      expect(isValidSpinelRamanRange(690)).toBe(true);
      expect(isValidSpinelRamanRange(1200)).toBe(true);
      expect(isValidSpinelRamanRange(1300)).toBe(false);
    });

    it('should validate mode position within uncertainty', () => {
      // A₁g mode at 690 ± 10 cm⁻¹
      expect(validateModePosition(690, 690, 10)).toBe(true);
      expect(validateModePosition(695, 690, 10)).toBe(true);
      expect(validateModePosition(685, 690, 10)).toBe(true);
      expect(validateModePosition(705, 690, 10)).toBe(false);
    });

    it('should return all modes sorted by position', () => {
      const sorted = getAllModesSorted();
      
      expect(sorted.length).toBe(5);
      
      // Check that positions are in ascending order
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].position).toBeGreaterThanOrEqual(sorted[i - 1].position);
      }
    });

    it('should get symmetry descriptions', () => {
      const a1gDesc = getSymmetryDescription('A1g');
      const egDesc = getSymmetryDescription('Eg');
      const t2gDesc = getSymmetryDescription('T2g');
      
      expect(a1gDesc).toContain('breathing');
      expect(egDesc).toContain('bending');
      expect(t2gDesc).toContain('asymmetric');
    });

    it('should calculate intensity ratios correctly', () => {
      // A₁g (690 cm⁻¹, intensity 100) vs Eg (300 cm⁻¹, intensity 40)
      const ratio = getIntensityRatio(690, 300);
      
      expect(ratio).toBeDefined();
      expect(ratio).toBeCloseTo(100 / 40, 2);
    });
  });

  describe('Data Consistency', () => {
    it('should have all modes within valid Raman shift range', () => {
      RAMAN_REFERENCE_DATA.forEach(mode => {
        expect(isValidSpinelRamanRange(mode.position)).toBe(true);
      });
    });

    it('should have positive relative intensities', () => {
      RAMAN_REFERENCE_DATA.forEach(mode => {
        expect(mode.relativeIntensity).toBeGreaterThan(0);
        expect(mode.relativeIntensity).toBeLessThanOrEqual(100);
      });
    });

    it('should have positive uncertainties', () => {
      RAMAN_REFERENCE_DATA.forEach(mode => {
        expect(mode.uncertainty).toBeGreaterThan(0);
      });
    });

    it('should have valid FWHM ranges', () => {
      RAMAN_REFERENCE_DATA.forEach(mode => {
        const [min, max] = mode.fwhm;
        expect(min).toBeGreaterThan(0);
        expect(max).toBeGreaterThan(min);
      });
    });
  });
});
