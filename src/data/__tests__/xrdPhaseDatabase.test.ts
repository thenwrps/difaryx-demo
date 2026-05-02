/**
 * Unit tests for XRD Phase Database Reference Data Validation
 * 
 * Task 22.1: Write tests for XRD reference data
 * - Verify CuFe₂O₄ peak positions match JCPDS 25-0283
 * - Verify crystallographic metadata
 * - Verify Miller indices satisfy systematic absences
 * 
 * **Validates: Requirements 2.1, 2.2, 3.1, 3.2, 11.1, 11.2, 13.2, 13.3**
 */

import { describe, it, expect } from 'vitest';
import {
  XRD_PHASE_DATABASE,
  getXrdPhaseReference,
  type XrdPhaseReference
} from '../xrdPhaseDatabase';

describe('XRD Phase Database - CuFe₂O₄ Reference Data', () => {
  // Get CuFe₂O₄ reference for tests
  const cufe2o4 = getXrdPhaseReference('cufe2o4');

  describe('Phase Database Structure', () => {
    it('should contain CuFe₂O₄ phase reference', () => {
      expect(cufe2o4).toBeDefined();
      expect(cufe2o4?.id).toBe('cufe2o4');
    });

    it('should have all required metadata fields', () => {
      expect(cufe2o4).toHaveProperty('id');
      expect(cufe2o4).toHaveProperty('name');
      expect(cufe2o4).toHaveProperty('formula');
      expect(cufe2o4).toHaveProperty('family');
      expect(cufe2o4).toHaveProperty('crystalSystem');
      expect(cufe2o4).toHaveProperty('spaceGroup');
      expect(cufe2o4).toHaveProperty('latticeParameters');
      expect(cufe2o4).toHaveProperty('jcpdsCard');
      expect(cufe2o4).toHaveProperty('referenceNote');
      expect(cufe2o4).toHaveProperty('peaks');
    });
  });

  describe('Crystallographic Metadata (Requirement 13.2)', () => {
    it('should specify cubic crystal system', () => {
      // Requirement 13.2: Specify the crystal system for each phase
      expect(cufe2o4?.crystalSystem).toBe('cubic');
    });

    it('should specify Fd-3m space group', () => {
      // Requirement 13.2: Specify space group for each phase
      expect(cufe2o4?.spaceGroup).toBe('Fd-3m');
    });

    it('should have lattice parameter a ≈ 8.37 Å', () => {
      // Requirement 13.3: Include lattice parameters for each phase
      expect(cufe2o4?.latticeParameters).toBeDefined();
      expect(cufe2o4?.latticeParameters.a).toBeCloseTo(8.37, 2);
    });

    it('should reference JCPDS 25-0283', () => {
      // Requirement 13.2: Include JCPDS card number
      expect(cufe2o4?.jcpdsCard).toBe('25-0283');
    });

    it('should describe as spinel ferrite family', () => {
      expect(cufe2o4?.family).toBe('spinel ferrite');
    });
  });

  describe('Peak Positions Match JCPDS 25-0283 (Requirement 2.1, 2.2)', () => {
    it('should have (111) peak at 18.3° ± 0.2°', () => {
      // Requirement 2.2: (111) at 18.3°
      const peak111 = cufe2o4?.peaks.find(p => p.hkl === '(111)');
      expect(peak111).toBeDefined();
      expect(peak111?.position).toBeCloseTo(18.3, 1);
    });

    it('should have (220) peak at 30.1° ± 0.2°', () => {
      // Requirement 2.2: (220) at 30.1°
      const peak220 = cufe2o4?.peaks.find(p => p.hkl === '(220)');
      expect(peak220).toBeDefined();
      expect(peak220?.position).toBeCloseTo(30.1, 1);
    });

    it('should have (311) peak at 35.5° ± 0.2°', () => {
      // Requirement 2.2: (311) at 35.5°
      const peak311 = cufe2o4?.peaks.find(p => p.hkl === '(311)');
      expect(peak311).toBeDefined();
      expect(peak311?.position).toBeCloseTo(35.5, 1);
    });

    it('should have (400) peak at 43.2° ± 0.2°', () => {
      // Requirement 2.2: (400) at 43.2°
      const peak400 = cufe2o4?.peaks.find(p => p.hkl === '(400)');
      expect(peak400).toBeDefined();
      expect(peak400?.position).toBeCloseTo(43.2, 1);
    });

    it('should have (422) peak at 53.6° ± 0.2°', () => {
      // Requirement 2.2: (422) at 53.6°
      const peak422 = cufe2o4?.peaks.find(p => p.hkl === '(422)');
      expect(peak422).toBeDefined();
      expect(peak422?.position).toBeCloseTo(53.6, 1);
    });

    it('should have (511) peak at 57.1° ± 0.2°', () => {
      // Requirement 2.2: (511) at 57.1°
      const peak511 = cufe2o4?.peaks.find(p => p.hkl === '(511)');
      expect(peak511).toBeDefined();
      expect(peak511?.position).toBeCloseTo(57.1, 1);
    });

    it('should have (440) peak at 62.7° ± 0.2°', () => {
      // Requirement 2.2: (440) at 62.7°
      const peak440 = cufe2o4?.peaks.find(p => p.hkl === '(440)');
      expect(peak440).toBeDefined();
      expect(peak440?.position).toBeCloseTo(62.7, 1);
    });

    it('should have exactly 7 reference peaks', () => {
      // Requirement 2.2: Seven main peaks for CuFe₂O₄
      expect(cufe2o4?.peaks.length).toBe(7);
    });
  });

  describe('Peak Intensities (Requirement 2.3)', () => {
    it('should have (311) as strongest peak with intensity 100', () => {
      // Requirement 2.3: (311) reflection as strongest peak
      const peak311 = cufe2o4?.peaks.find(p => p.hkl === '(311)');
      expect(peak311?.relativeIntensity).toBe(100);

      // Verify it's the strongest
      const maxIntensity = Math.max(...(cufe2o4?.peaks.map(p => p.relativeIntensity) || []));
      expect(maxIntensity).toBe(100);
    });

    it('should have all peaks with relative intensities between 0 and 100', () => {
      cufe2o4?.peaks.forEach(peak => {
        expect(peak.relativeIntensity).toBeGreaterThan(0);
        expect(peak.relativeIntensity).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Miller Indices Systematic Absences (Requirement 11.1, 11.2)', () => {
    it('should satisfy face-centered cubic systematic absences for all peaks', () => {
      // Requirement 11.1: Miller indices following cubic spinel systematic absences
      // Requirement 11.2: Verify that assigned hkl indices satisfy spinel structure factor rules
      // For face-centered cubic (Fd-3m), h+k, h+l, and k+l must all be even
      
      cufe2o4?.peaks.forEach(peak => {
        // Extract h, k, l from string like "(311)"
        const match = peak.hkl.match(/\((\d)(\d)(\d)\)/);
        expect(match).toBeDefined();
        
        if (match) {
          const h = parseInt(match[1]);
          const k = parseInt(match[2]);
          const l = parseInt(match[3]);
          
          // Check systematic absences for face-centered cubic
          const hPlusK = h + k;
          const hPlusL = h + l;
          const kPlusL = k + l;
          
          expect(hPlusK % 2).toBe(0); // h+k must be even
          expect(hPlusL % 2).toBe(0); // h+l must be even
          expect(kPlusL % 2).toBe(0); // k+l must be even
        }
      });
    });

    it('should have valid Miller indices format', () => {
      // Requirement 11.4: Format Miller indices with parentheses
      cufe2o4?.peaks.forEach(peak => {
        expect(peak.hkl).toMatch(/^\(\d\d\d\)$/);
      });
    });
  });

  describe('D-Spacing Values (Requirement 2.6)', () => {
    it('should include d-spacing for all peaks', () => {
      // Requirement 2.6: Include calculated d-spacing
      cufe2o4?.peaks.forEach(peak => {
        expect(peak.dSpacing).toBeDefined();
        expect(peak.dSpacing).toBeGreaterThan(0);
      });
    });

    it('should have d-spacing values consistent with Bragg\'s law', () => {
      // Requirement 2.6: d = λ / (2 sin θ)
      const lambda = 1.5406; // Cu Kα wavelength in Å
      
      cufe2o4?.peaks.forEach(peak => {
        const twoTheta = peak.position;
        const theta = (twoTheta * Math.PI) / 360; // Convert to radians
        const calculatedD = lambda / (2 * Math.sin(theta));
        
        // Allow 1% tolerance for rounding
        expect(peak.dSpacing).toBeCloseTo(calculatedD, 2);
      });
    });

    it('should have d-spacing values in descending order', () => {
      // D-spacing should decrease as 2θ increases
      const dSpacings = cufe2o4?.peaks.map(p => p.dSpacing) || [];
      
      for (let i = 1; i < dSpacings.length; i++) {
        expect(dSpacings[i]).toBeLessThanOrEqual(dSpacings[i - 1]);
      }
    });
  });

  describe('Peak Ordering (Requirement 11.3)', () => {
    it('should list peaks in order of increasing 2θ angle', () => {
      // Requirement 11.3: List peaks in order of increasing 2θ angle
      const positions = cufe2o4?.peaks.map(p => p.position) || [];
      
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i]).toBeGreaterThan(positions[i - 1]);
      }
    });
  });

  describe('Reference Documentation (Requirement 15.1)', () => {
    it('should include reference note with JCPDS citation', () => {
      // Requirement 15.1: Document literature sources
      expect(cufe2o4?.referenceNote).toBeDefined();
      expect(cufe2o4?.referenceNote).toContain('JCPDS');
      expect(cufe2o4?.referenceNote).toContain('25-0283');
    });

    it('should mention Cu Kα radiation wavelength', () => {
      expect(cufe2o4?.referenceNote).toContain('1.5406');
      expect(cufe2o4?.referenceNote).toContain('Å');
    });

    it('should describe inverse spinel structure', () => {
      expect(cufe2o4?.referenceNote.toLowerCase()).toContain('inverse spinel');
    });
  });

  describe('Data Consistency', () => {
    it('should have all peaks within valid 2θ range (10-80°)', () => {
      // Requirement 14.1: XRD 2θ values between 10° and 80°
      cufe2o4?.peaks.forEach(peak => {
        expect(peak.position).toBeGreaterThanOrEqual(10);
        expect(peak.position).toBeLessThanOrEqual(80);
      });
    });

    it('should have consistent formula representation', () => {
      expect(cufe2o4?.formula).toBe('CuFe2O4');
      expect(cufe2o4?.name).toBe('CuFe2O4');
    });
  });
});

describe('XRD Phase Database - Other Phases', () => {
  describe('Fe₃O₄ (Magnetite)', () => {
    it('should be present in database', () => {
      const fe3o4 = getXrdPhaseReference('fe3o4');
      expect(fe3o4).toBeDefined();
      expect(fe3o4?.name).toBe('Fe3O4');
    });

    it('should have inverse spinel structure', () => {
      const fe3o4 = getXrdPhaseReference('fe3o4');
      expect(fe3o4?.family).toBe('inverse spinel iron oxide');
      expect(fe3o4?.crystalSystem).toBe('cubic');
      expect(fe3o4?.spaceGroup).toBe('Fd-3m');
    });

    it('should have JCPDS reference', () => {
      const fe3o4 = getXrdPhaseReference('fe3o4');
      expect(fe3o4?.jcpdsCard).toBeDefined();
    });
  });

  describe('α-Fe₂O₃ (Hematite)', () => {
    it('should be present in database', () => {
      const hematite = getXrdPhaseReference('alpha-fe2o3');
      expect(hematite).toBeDefined();
      expect(hematite?.name).toBe('alpha-Fe2O3');
    });

    it('should have rhombohedral crystal system', () => {
      // Requirement 13.4: Distinguish hematite (rhombohedral) from spinel phases
      const hematite = getXrdPhaseReference('alpha-fe2o3');
      expect(hematite?.crystalSystem).toBe('rhombohedral');
      expect(hematite?.spaceGroup).toBe('R-3c');
    });

    it('should have diagnostic peaks different from spinel', () => {
      // Requirement 13.5: Diagnostic peaks that differentiate similar phases
      const hematite = getXrdPhaseReference('alpha-fe2o3');
      
      // Hematite has characteristic peaks at 24.1° and 33.2° not present in spinel
      const peak24 = hematite?.peaks.find(p => Math.abs(p.position - 24.1) < 0.5);
      const peak33 = hematite?.peaks.find(p => Math.abs(p.position - 33.2) < 0.5);
      
      expect(peak24).toBeDefined();
      expect(peak33).toBeDefined();
    });
  });

  describe('Database Completeness', () => {
    it('should contain multiple phase references', () => {
      expect(XRD_PHASE_DATABASE.length).toBeGreaterThan(1);
    });

    it('should have unique phase IDs', () => {
      const ids = XRD_PHASE_DATABASE.map(phase => phase.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all phases with required metadata', () => {
      XRD_PHASE_DATABASE.forEach(phase => {
        expect(phase.id).toBeDefined();
        expect(phase.name).toBeDefined();
        expect(phase.formula).toBeDefined();
        expect(phase.crystalSystem).toBeDefined();
        expect(phase.spaceGroup).toBeDefined();
        expect(phase.latticeParameters).toBeDefined();
        expect(phase.peaks.length).toBeGreaterThan(0);
      });
    });
  });
});
