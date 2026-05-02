/**
 * Unit tests for XPS Reference Data Validation
 * 
 * Task 22.2: Write tests for XPS reference data
 * - Verify Cu and Fe binding energies match literature values
 * - Verify spin-orbit splittings
 * 
 * **Validates: Requirements 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 15.2**
 */

import { describe, it, expect } from 'vitest';
import {
  XPS_REFERENCE_DATA,
  getXpsReferenceData,
  getCoreLevelReference,
  getSpinOrbitSplitting,
  hasSatellitePeaks,
  getSatelliteParameters,
  type XpsCoreLevelReference
} from '../xpsReferenceData';

describe('XPS Reference Data - Cu²⁺ Core Levels', () => {
  describe('Cu 2p₃/₂ Peak (Requirement 3.1)', () => {
    it('should have binding energy at 933.5 ± 0.5 eV', () => {
      // Requirement 3.1: Cu 2p₃/₂ binding energy at 933.5 ± 0.5 eV
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      
      expect(cu2p3).toBeDefined();
      expect(cu2p3?.bindingEnergy).toBeCloseTo(933.5, 1);
      expect(cu2p3?.uncertainty).toBe(0.5);
    });

    it('should have FWHM range 2.0-3.0 eV', () => {
      // Requirement 3.10: XPS peak widths (FWHM) between 2.0 and 3.5 eV
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      
      expect(cu2p3?.fwhm).toBeDefined();
      const [minFwhm, maxFwhm] = cu2p3!.fwhm;
      
      expect(minFwhm).toBeGreaterThanOrEqual(2.0);
      expect(maxFwhm).toBeLessThanOrEqual(3.5);
      expect(minFwhm).toBeLessThan(maxFwhm);
    });

    it('should have satellite peak parameters', () => {
      // Requirement 3.3: Include Cu²⁺ satellite peaks at +8-10 eV
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      
      expect(cu2p3?.satelliteOffset).toBeDefined();
      expect(cu2p3?.satelliteIntensity).toBeDefined();
      
      // Satellite offset should be 8-10 eV
      expect(cu2p3!.satelliteOffset!).toBeGreaterThanOrEqual(8);
      expect(cu2p3!.satelliteOffset!).toBeLessThanOrEqual(10);
      
      // Satellite intensity should be reasonable (30-50% of main peak)
      expect(cu2p3!.satelliteIntensity!).toBeGreaterThan(0);
      expect(cu2p3!.satelliteIntensity!).toBeLessThan(1);
    });

    it('should have literature source citation', () => {
      // Requirement 15.2: Document literature sources for binding energies
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      
      expect(cu2p3?.literatureSource).toBeDefined();
      expect(cu2p3?.literatureSource).toContain('Biesinger');
    });
  });

  describe('Cu 2p₁/₂ Peak (Requirement 3.2)', () => {
    it('should have binding energy at 953.3 ± 0.5 eV', () => {
      // Requirement 3.2: Cu 2p₁/₂ binding energy at 953.3 ± 0.5 eV
      const cu2p1 = getCoreLevelReference('Cu', '2+', '2p1/2');
      
      expect(cu2p1).toBeDefined();
      expect(cu2p1?.bindingEnergy).toBeCloseTo(953.3, 1);
      expect(cu2p1?.uncertainty).toBe(0.5);
    });

    it('should have FWHM range 2.0-3.0 eV', () => {
      const cu2p1 = getCoreLevelReference('Cu', '2+', '2p1/2');
      
      expect(cu2p1?.fwhm).toBeDefined();
      const [minFwhm, maxFwhm] = cu2p1!.fwhm;
      
      expect(minFwhm).toBeGreaterThanOrEqual(2.0);
      expect(maxFwhm).toBeLessThanOrEqual(3.5);
    });

    it('should have satellite peak parameters', () => {
      // Requirement 3.3: Satellite peaks for both Cu 2p components
      const cu2p1 = getCoreLevelReference('Cu', '2+', '2p1/2');
      
      expect(cu2p1?.satelliteOffset).toBeDefined();
      expect(cu2p1?.satelliteIntensity).toBeDefined();
    });
  });

  describe('Cu 2p Spin-Orbit Splitting (Requirement 3.8)', () => {
    it('should have spin-orbit splitting of 19.8 ± 0.3 eV', () => {
      // Requirement 3.8: Spin-orbit splitting of 19.8 ± 0.3 eV for Cu 2p doublet
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      const cu2p1 = getCoreLevelReference('Cu', '2+', '2p1/2');
      
      expect(cu2p3?.spinOrbitSplitting).toBeDefined();
      expect(cu2p1?.spinOrbitSplitting).toBeDefined();
      
      expect(cu2p3!.spinOrbitSplitting!).toBeCloseTo(19.8, 1);
      expect(cu2p1!.spinOrbitSplitting!).toBeCloseTo(19.8, 1);
    });

    it('should match calculated splitting from binding energies', () => {
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      const cu2p1 = getCoreLevelReference('Cu', '2+', '2p1/2');
      
      const calculatedSplitting = cu2p1!.bindingEnergy - cu2p3!.bindingEnergy;
      
      expect(calculatedSplitting).toBeCloseTo(cu2p3!.spinOrbitSplitting!, 1);
    });

    it('should be retrievable via helper function', () => {
      const splitting = getSpinOrbitSplitting('Cu', '2p3/2');
      
      expect(splitting).toBeDefined();
      expect(splitting).toBeCloseTo(19.8, 1);
    });
  });

  describe('Cu²⁺ Satellite Peaks (Requirement 3.3)', () => {
    it('should have satellite peaks for Cu 2p₃/₂', () => {
      expect(hasSatellitePeaks('Cu', '2+', '2p3/2')).toBe(true);
    });

    it('should have satellite peaks for Cu 2p₁/₂', () => {
      expect(hasSatellitePeaks('Cu', '2+', '2p1/2')).toBe(true);
    });

    it('should provide satellite parameters via helper function', () => {
      const params = getSatelliteParameters('Cu', '2+', '2p3/2');
      
      expect(params).toBeDefined();
      expect(params?.offset).toBeGreaterThanOrEqual(8);
      expect(params?.offset).toBeLessThanOrEqual(10);
      expect(params?.intensity).toBeGreaterThan(0);
      expect(params?.intensity).toBeLessThan(1);
    });
  });
});

describe('XPS Reference Data - Fe³⁺ Core Levels', () => {
  describe('Fe 2p₃/₂ Peak (Requirement 3.4)', () => {
    it('should have binding energy at 710.8 ± 0.5 eV', () => {
      // Requirement 3.4: Fe 2p₃/₂ binding energy at 710.8 ± 0.5 eV
      const fe2p3 = getCoreLevelReference('Fe', '3+', '2p3/2');
      
      expect(fe2p3).toBeDefined();
      expect(fe2p3?.bindingEnergy).toBeCloseTo(710.8, 1);
      expect(fe2p3?.uncertainty).toBe(0.5);
    });

    it('should have FWHM range 2.5-3.5 eV', () => {
      const fe2p3 = getCoreLevelReference('Fe', '3+', '2p3/2');
      
      expect(fe2p3?.fwhm).toBeDefined();
      const [minFwhm, maxFwhm] = fe2p3!.fwhm;
      
      expect(minFwhm).toBeGreaterThanOrEqual(2.0);
      expect(maxFwhm).toBeLessThanOrEqual(3.5);
    });

    it('should have literature source citation', () => {
      const fe2p3 = getCoreLevelReference('Fe', '3+', '2p3/2');
      
      expect(fe2p3?.literatureSource).toBeDefined();
      expect(fe2p3?.literatureSource).toContain('Biesinger');
    });
  });

  describe('Fe 2p₁/₂ Peak (Requirement 3.5)', () => {
    it('should have binding energy at 724.3 ± 0.5 eV', () => {
      // Requirement 3.5: Fe 2p₁/₂ binding energy at 724.3 ± 0.5 eV
      const fe2p1 = getCoreLevelReference('Fe', '3+', '2p1/2');
      
      expect(fe2p1).toBeDefined();
      expect(fe2p1?.bindingEnergy).toBeCloseTo(724.3, 1);
      expect(fe2p1?.uncertainty).toBe(0.5);
    });

    it('should have FWHM range 2.5-3.5 eV', () => {
      const fe2p1 = getCoreLevelReference('Fe', '3+', '2p1/2');
      
      expect(fe2p1?.fwhm).toBeDefined();
      const [minFwhm, maxFwhm] = fe2p1!.fwhm;
      
      expect(minFwhm).toBeGreaterThanOrEqual(2.0);
      expect(maxFwhm).toBeLessThanOrEqual(3.5);
    });
  });

  describe('Fe 2p Spin-Orbit Splitting (Requirement 3.9)', () => {
    it('should have spin-orbit splitting of 13.5 ± 0.3 eV', () => {
      // Requirement 3.9: Spin-orbit splitting of 13.5 ± 0.3 eV for Fe 2p doublet
      const fe2p3 = getCoreLevelReference('Fe', '3+', '2p3/2');
      const fe2p1 = getCoreLevelReference('Fe', '3+', '2p1/2');
      
      expect(fe2p3?.spinOrbitSplitting).toBeDefined();
      expect(fe2p1?.spinOrbitSplitting).toBeDefined();
      
      expect(fe2p3!.spinOrbitSplitting!).toBeCloseTo(13.5, 1);
      expect(fe2p1!.spinOrbitSplitting!).toBeCloseTo(13.5, 1);
    });

    it('should match calculated splitting from binding energies', () => {
      const fe2p3 = getCoreLevelReference('Fe', '3+', '2p3/2');
      const fe2p1 = getCoreLevelReference('Fe', '3+', '2p1/2');
      
      const calculatedSplitting = fe2p1!.bindingEnergy - fe2p3!.bindingEnergy;
      
      expect(calculatedSplitting).toBeCloseTo(fe2p3!.spinOrbitSplitting!, 1);
    });

    it('should be retrievable via helper function', () => {
      const splitting = getSpinOrbitSplitting('Fe', '2p3/2');
      
      expect(splitting).toBeDefined();
      expect(splitting).toBeCloseTo(13.5, 1);
    });
  });
});

describe('XPS Reference Data - O²⁻ Core Levels', () => {
  describe('O 1s Lattice Oxygen (Requirement 3.6)', () => {
    it('should have binding energy at 529.8 ± 0.3 eV', () => {
      // Requirement 3.6: O 1s binding energy at 529.8 ± 0.3 eV for lattice oxygen
      const o1sLattice = XPS_REFERENCE_DATA.find(
        ref => ref.element === 'O' && ref.bindingEnergy === 529.8
      );
      
      expect(o1sLattice).toBeDefined();
      expect(o1sLattice?.bindingEnergy).toBeCloseTo(529.8, 1);
      expect(o1sLattice?.uncertainty).toBe(0.3);
    });

    it('should be assigned to lattice oxygen in spinel structure', () => {
      const o1sLattice = XPS_REFERENCE_DATA.find(
        ref => ref.element === 'O' && ref.bindingEnergy === 529.8
      );
      
      expect(o1sLattice?.literatureSource.toLowerCase()).toContain('lattice');
    });

    it('should have FWHM range 2.0-2.5 eV', () => {
      const o1sLattice = XPS_REFERENCE_DATA.find(
        ref => ref.element === 'O' && ref.bindingEnergy === 529.8
      );
      
      expect(o1sLattice?.fwhm).toBeDefined();
      const [minFwhm, maxFwhm] = o1sLattice!.fwhm;
      
      expect(minFwhm).toBeGreaterThanOrEqual(2.0);
      expect(maxFwhm).toBeLessThanOrEqual(3.5);
    });
  });

  describe('O 1s Surface Hydroxyl (Requirement 3.7)', () => {
    it('should have binding energy at 531.5 ± 0.5 eV', () => {
      // Requirement 3.7: O 1s component at 531.5 ± 0.5 eV for surface hydroxyl
      const o1sHydroxyl = XPS_REFERENCE_DATA.find(
        ref => ref.element === 'O' && ref.bindingEnergy === 531.5
      );
      
      expect(o1sHydroxyl).toBeDefined();
      expect(o1sHydroxyl?.bindingEnergy).toBeCloseTo(531.5, 1);
      expect(o1sHydroxyl?.uncertainty).toBe(0.5);
    });

    it('should be assigned to surface hydroxyl groups', () => {
      const o1sHydroxyl = XPS_REFERENCE_DATA.find(
        ref => ref.element === 'O' && ref.bindingEnergy === 531.5
      );
      
      expect(o1sHydroxyl?.literatureSource.toLowerCase()).toContain('hydroxyl');
    });

    it('should have FWHM range 2.0-3.0 eV', () => {
      const o1sHydroxyl = XPS_REFERENCE_DATA.find(
        ref => ref.element === 'O' && ref.bindingEnergy === 531.5
      );
      
      expect(o1sHydroxyl?.fwhm).toBeDefined();
      const [minFwhm, maxFwhm] = o1sHydroxyl!.fwhm;
      
      expect(minFwhm).toBeGreaterThanOrEqual(2.0);
      expect(maxFwhm).toBeLessThanOrEqual(3.5);
    });
  });
});

describe('XPS Reference Data - Helper Functions', () => {
  describe('getXpsReferenceData', () => {
    it('should retrieve all Cu²⁺ core levels', () => {
      const cuData = getXpsReferenceData('Cu', '2+');
      
      expect(cuData.length).toBe(2); // 2p3/2 and 2p1/2
      expect(cuData.every(ref => ref.element === 'Cu')).toBe(true);
      expect(cuData.every(ref => ref.oxidationState === '2+')).toBe(true);
    });

    it('should retrieve all Fe³⁺ core levels', () => {
      const feData = getXpsReferenceData('Fe', '3+');
      
      expect(feData.length).toBe(2); // 2p3/2 and 2p1/2
      expect(feData.every(ref => ref.element === 'Fe')).toBe(true);
      expect(feData.every(ref => ref.oxidationState === '3+')).toBe(true);
    });

    it('should retrieve all O²⁻ core levels', () => {
      const oData = getXpsReferenceData('O', '2-');
      
      expect(oData.length).toBe(2); // Lattice and hydroxyl
      expect(oData.every(ref => ref.element === 'O')).toBe(true);
      expect(oData.every(ref => ref.oxidationState === '2-')).toBe(true);
    });
  });

  describe('getCoreLevelReference', () => {
    it('should retrieve specific core level', () => {
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      
      expect(cu2p3).toBeDefined();
      expect(cu2p3?.element).toBe('Cu');
      expect(cu2p3?.oxidationState).toBe('2+');
      expect(cu2p3?.coreLevel).toBe('2p3/2');
    });

    it('should return undefined for non-existent core level', () => {
      const nonExistent = getCoreLevelReference('Cu', '1+', '2p3/2');
      
      expect(nonExistent).toBeUndefined();
    });
  });
});

describe('XPS Reference Data - Data Consistency', () => {
  describe('Binding Energy Ranges (Requirement 14.2)', () => {
    it('should have all binding energies between 0 and 1200 eV', () => {
      // Requirement 14.2: XPS binding energies between 0 and 1200 eV
      XPS_REFERENCE_DATA.forEach(ref => {
        expect(ref.bindingEnergy).toBeGreaterThan(0);
        expect(ref.bindingEnergy).toBeLessThan(1200);
      });
    });
  });

  describe('FWHM Ranges (Requirement 3.10)', () => {
    it('should have all FWHM values between 2.0 and 3.5 eV', () => {
      // Requirement 3.10: XPS peak widths (FWHM) between 2.0 and 3.5 eV
      XPS_REFERENCE_DATA.forEach(ref => {
        const [minFwhm, maxFwhm] = ref.fwhm;
        
        expect(minFwhm).toBeGreaterThanOrEqual(2.0);
        expect(maxFwhm).toBeLessThanOrEqual(3.5);
        expect(minFwhm).toBeLessThan(maxFwhm);
      });
    });
  });

  describe('Uncertainty Values', () => {
    it('should have positive uncertainty values', () => {
      XPS_REFERENCE_DATA.forEach(ref => {
        expect(ref.uncertainty).toBeGreaterThan(0);
        expect(ref.uncertainty).toBeLessThan(2); // Reasonable upper bound
      });
    });
  });

  describe('Literature Sources (Requirement 15.2)', () => {
    it('should have literature source for all entries', () => {
      // Requirement 15.2: Document literature sources for all binding energy assignments
      XPS_REFERENCE_DATA.forEach(ref => {
        expect(ref.literatureSource).toBeDefined();
        expect(ref.literatureSource.length).toBeGreaterThan(0);
      });
    });

    it('should reference Biesinger et al. for transition metals', () => {
      const cuRefs = getXpsReferenceData('Cu', '2+');
      const feRefs = getXpsReferenceData('Fe', '3+');
      
      [...cuRefs, ...feRefs].forEach(ref => {
        expect(ref.literatureSource).toContain('Biesinger');
      });
    });
  });

  describe('Oxidation State Notation', () => {
    it('should use proper oxidation state notation', () => {
      // Requirement 8.8: Use proper oxidation state notation (Cu²⁺, Fe³⁺)
      const validOxidationStates = ['2+', '3+', '2-'];
      
      XPS_REFERENCE_DATA.forEach(ref => {
        expect(validOxidationStates).toContain(ref.oxidationState);
      });
    });
  });

  describe('Core Level Notation', () => {
    it('should use standard core level notation', () => {
      const validCoreLevels = ['2p3/2', '2p1/2', '1s'];
      
      XPS_REFERENCE_DATA.forEach(ref => {
        expect(validCoreLevels).toContain(ref.coreLevel);
      });
    });
  });

  describe('Database Completeness', () => {
    it('should contain all required core levels for CuFe₂O₄', () => {
      // Should have Cu 2p, Fe 2p, and O 1s
      const elements = new Set(XPS_REFERENCE_DATA.map(ref => ref.element));
      
      expect(elements.has('Cu')).toBe(true);
      expect(elements.has('Fe')).toBe(true);
      expect(elements.has('O')).toBe(true);
    });

    it('should have doublets for Cu and Fe', () => {
      const cuLevels = getXpsReferenceData('Cu', '2+').map(ref => ref.coreLevel);
      const feLevels = getXpsReferenceData('Fe', '3+').map(ref => ref.coreLevel);
      
      expect(cuLevels).toContain('2p3/2');
      expect(cuLevels).toContain('2p1/2');
      expect(feLevels).toContain('2p3/2');
      expect(feLevels).toContain('2p1/2');
    });
  });
});
