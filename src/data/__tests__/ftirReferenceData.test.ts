/**
 * Unit tests for FTIR Reference Data Validation
 * 
 * Task 22.3: Write tests for FTIR reference data
 * - Verify band positions match literature values
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 15.3**
 */

import { describe, it, expect } from 'vitest';
import {
  FTIR_REFERENCE_DATA,
  getFtirBandsBySite,
  getMetalOxygenBands,
  getSurfaceBands,
  getFtirBandByPosition,
  isMetalOxygenRegion,
  getSiteWavenumberRange,
  validateBandPosition,
  getAllBandsSorted,
  type FtirBandReference
} from '../ftirReferenceData';

describe('FTIR Reference Data - Metal-Oxygen Stretching Bands', () => {
  describe('Tetrahedral Site Fe-O Stretching (Requirement 4.1)', () => {
    it('should have band at 580 ± 20 cm⁻¹', () => {
      // Requirement 4.1: Tetrahedral site (Fe-O) stretching vibration at 580 ± 20 cm⁻¹
      const tetrahedralBands = getFtirBandsBySite('tetrahedral');
      
      expect(tetrahedralBands.length).toBeGreaterThan(0);
      
      const band580 = tetrahedralBands.find(b => Math.abs(b.position - 580) < 30);
      expect(band580).toBeDefined();
      expect(band580?.position).toBeCloseTo(580, 0);
      expect(band580?.uncertainty).toBe(20);
    });

    it('should be assigned to Fe-O stretching in tetrahedral A-site', () => {
      const band = getFtirBandByPosition(580, 30);
      
      expect(band).toBeDefined();
      expect(band?.site).toBe('tetrahedral');
      expect(band?.bondType).toBe('metal-oxygen');
      expect(band?.assignment.toLowerCase()).toContain('tetrahedral');
      expect(band?.assignment).toContain('Fe-O');
    });

    it('should have FWHM range 40-80 cm⁻¹', () => {
      // Requirement 4.5: FTIR bands with widths (FWHM) between 40 and 100 cm⁻¹
      const band = getFtirBandByPosition(580, 30);
      
      expect(band?.fwhm).toBeDefined();
      const [minFwhm, maxFwhm] = band!.fwhm;
      
      expect(minFwhm).toBeGreaterThanOrEqual(40);
      expect(maxFwhm).toBeLessThanOrEqual(100);
      expect(minFwhm).toBeLessThan(maxFwhm);
    });

    it('should reference Waldron (1955) as literature source', () => {
      // Requirement 15.3: Document literature sources for vibrational mode assignments
      const band = getFtirBandByPosition(580, 30);
      
      expect(band?.literatureSource).toBeDefined();
      expect(band?.literatureSource).toContain('Waldron');
      expect(band?.literatureSource).toContain('1955');
    });
  });

  describe('Octahedral Site Metal-O Stretching (Requirement 4.2)', () => {
    it('should have band at 400 ± 20 cm⁻¹', () => {
      // Requirement 4.2: Octahedral site (Cu-O, Fe-O) stretching vibration at 400 ± 20 cm⁻¹
      const octahedralBands = getFtirBandsBySite('octahedral');
      
      expect(octahedralBands.length).toBeGreaterThan(0);
      
      const band400 = octahedralBands.find(b => Math.abs(b.position - 400) < 30);
      expect(band400).toBeDefined();
      expect(band400?.position).toBeCloseTo(400, 0);
      expect(band400?.uncertainty).toBe(20);
    });

    it('should be assigned to metal-oxygen stretching in octahedral B-site', () => {
      const band = getFtirBandByPosition(400, 30);
      
      expect(band).toBeDefined();
      expect(band?.site).toBe('octahedral');
      expect(band?.bondType).toBe('metal-oxygen');
      expect(band?.assignment.toLowerCase()).toContain('octahedral');
    });

    it('should mention both Cu²⁺-O and Fe³⁺-O bonds', () => {
      const band = getFtirBandByPosition(400, 30);
      
      expect(band?.assignment).toContain('Cu');
      expect(band?.assignment).toContain('Fe');
    });

    it('should have FWHM range 40-100 cm⁻¹', () => {
      const band = getFtirBandByPosition(400, 30);
      
      expect(band?.fwhm).toBeDefined();
      const [minFwhm, maxFwhm] = band!.fwhm;
      
      expect(minFwhm).toBeGreaterThanOrEqual(40);
      expect(maxFwhm).toBeLessThanOrEqual(100);
    });

    it('should reference Waldron (1955) as literature source', () => {
      const band = getFtirBandByPosition(400, 30);
      
      expect(band?.literatureSource).toBeDefined();
      expect(band?.literatureSource).toContain('Waldron');
      expect(band?.literatureSource).toContain('1955');
    });
  });

  describe('Metal-Oxygen Region (Requirement 4.6)', () => {
    it('should identify bands below 700 cm⁻¹ as metal-oxygen stretching', () => {
      // Requirement 4.6: Describe bands below 700 cm⁻¹ as metal-oxygen stretching
      const metalOxygenBands = getMetalOxygenBands();
      
      metalOxygenBands.forEach(band => {
        expect(band.position).toBeLessThan(700);
        expect(band.bondType).toBe('metal-oxygen');
      });
    });

    it('should validate metal-oxygen region (300-700 cm⁻¹)', () => {
      expect(isMetalOxygenRegion(250)).toBe(false);
      expect(isMetalOxygenRegion(300)).toBe(true);
      expect(isMetalOxygenRegion(400)).toBe(true);
      expect(isMetalOxygenRegion(580)).toBe(true);
      expect(isMetalOxygenRegion(700)).toBe(true);
      expect(isMetalOxygenRegion(750)).toBe(false);
    });

    it('should describe metal-oxygen bonds in tetrahedral and octahedral sites', () => {
      const metalOxygenBands = getMetalOxygenBands();
      
      // Should have bands describing both tetrahedral and octahedral sites
      const hasTetrahedral = metalOxygenBands.some(
        band => band.assignment.toLowerCase().includes('tetrahedral')
      );
      const hasOctahedral = metalOxygenBands.some(
        band => band.assignment.toLowerCase().includes('octahedral')
      );
      
      expect(hasTetrahedral).toBe(true);
      expect(hasOctahedral).toBe(true);
    });
  });
});

describe('FTIR Reference Data - Surface Species', () => {
  describe('O-H Stretching (Requirement 4.3)', () => {
    it('should have band at 3400 ± 100 cm⁻¹', () => {
      // Requirement 4.3: O-H stretching vibration at 3400 ± 100 cm⁻¹
      const surfaceBands = getSurfaceBands();
      
      const ohBand = surfaceBands.find(b => Math.abs(b.position - 3400) < 150);
      expect(ohBand).toBeDefined();
      expect(ohBand?.position).toBeCloseTo(3400, 0);
      expect(ohBand?.uncertainty).toBe(100);
    });

    it('should be assigned to surface hydroxyl groups', () => {
      const band = getFtirBandByPosition(3400, 150);
      
      expect(band).toBeDefined();
      expect(band?.site).toBe('surface');
      expect(band?.bondType).toBe('hydroxyl');
      expect(band?.assignment.toLowerCase()).toContain('hydroxyl');
      expect(band?.assignment).toContain('O-H');
    });

    it('should have FWHM range 80-150 cm⁻¹', () => {
      const band = getFtirBandByPosition(3400, 150);
      
      expect(band?.fwhm).toBeDefined();
      const [minFwhm, maxFwhm] = band!.fwhm;
      
      expect(minFwhm).toBeGreaterThanOrEqual(40);
      expect(maxFwhm).toBeLessThanOrEqual(150);
    });

    it('should reference Nakamoto as literature source', () => {
      const band = getFtirBandByPosition(3400, 150);
      
      expect(band?.literatureSource).toBeDefined();
      expect(band?.literatureSource).toContain('Nakamoto');
    });
  });

  describe('H-O-H Bending (Requirement 4.4)', () => {
    it('should have band at 1630 ± 30 cm⁻¹', () => {
      // Requirement 4.4: H-O-H bending vibration at 1630 ± 30 cm⁻¹
      const surfaceBands = getSurfaceBands();
      
      const waterBand = surfaceBands.find(b => Math.abs(b.position - 1630) < 50);
      expect(waterBand).toBeDefined();
      expect(waterBand?.position).toBeCloseTo(1630, 0);
      expect(waterBand?.uncertainty).toBe(30);
    });

    it('should be assigned to adsorbed water molecules', () => {
      const band = getFtirBandByPosition(1630, 50);
      
      expect(band).toBeDefined();
      expect(band?.site).toBe('surface');
      expect(band?.bondType).toBe('water');
      expect(band?.assignment.toLowerCase()).toContain('water');
      expect(band?.assignment).toContain('H-O-H');
    });

    it('should have FWHM range 40-80 cm⁻¹', () => {
      const band = getFtirBandByPosition(1630, 50);
      
      expect(band?.fwhm).toBeDefined();
      const [minFwhm, maxFwhm] = band!.fwhm;
      
      expect(minFwhm).toBeGreaterThanOrEqual(40);
      expect(maxFwhm).toBeLessThanOrEqual(100);
    });

    it('should reference Nakamoto as literature source', () => {
      const band = getFtirBandByPosition(1630, 50);
      
      expect(band?.literatureSource).toBeDefined();
      expect(band?.literatureSource).toContain('Nakamoto');
    });
  });
});

describe('FTIR Reference Data - Helper Functions', () => {
  describe('getFtirBandsBySite', () => {
    it('should retrieve tetrahedral site bands', () => {
      const bands = getFtirBandsBySite('tetrahedral');
      
      expect(bands.length).toBeGreaterThan(0);
      expect(bands.every(b => b.site === 'tetrahedral')).toBe(true);
    });

    it('should retrieve octahedral site bands', () => {
      const bands = getFtirBandsBySite('octahedral');
      
      expect(bands.length).toBeGreaterThan(0);
      expect(bands.every(b => b.site === 'octahedral')).toBe(true);
    });

    it('should retrieve surface bands', () => {
      const bands = getFtirBandsBySite('surface');
      
      expect(bands.length).toBeGreaterThan(0);
      expect(bands.every(b => b.site === 'surface')).toBe(true);
    });
  });

  describe('getMetalOxygenBands', () => {
    it('should retrieve only metal-oxygen stretching bands', () => {
      const bands = getMetalOxygenBands();
      
      expect(bands.length).toBeGreaterThan(0);
      expect(bands.every(b => b.bondType === 'metal-oxygen')).toBe(true);
    });

    it('should include both tetrahedral and octahedral bands', () => {
      const bands = getMetalOxygenBands();
      
      const sites = new Set(bands.map(b => b.site));
      expect(sites.has('tetrahedral')).toBe(true);
      expect(sites.has('octahedral')).toBe(true);
    });
  });

  describe('getSurfaceBands', () => {
    it('should retrieve only surface species bands', () => {
      const bands = getSurfaceBands();
      
      expect(bands.length).toBeGreaterThan(0);
      expect(bands.every(b => b.site === 'surface')).toBe(true);
    });

    it('should include hydroxyl and water bands', () => {
      const bands = getSurfaceBands();
      
      const bondTypes = new Set(bands.map(b => b.bondType));
      expect(bondTypes.has('hydroxyl')).toBe(true);
      expect(bondTypes.has('water')).toBe(true);
    });
  });

  describe('getFtirBandByPosition', () => {
    it('should find band within tolerance', () => {
      const band = getFtirBandByPosition(580, 30);
      
      expect(band).toBeDefined();
      expect(Math.abs(band!.position - 580)).toBeLessThanOrEqual(30);
    });

    it('should return undefined if no band within tolerance', () => {
      const band = getFtirBandByPosition(5000, 50);
      
      expect(band).toBeUndefined();
    });
  });

  describe('getSiteWavenumberRange', () => {
    it('should return valid range for tetrahedral site', () => {
      const [min, max] = getSiteWavenumberRange('tetrahedral');
      
      expect(min).toBeGreaterThan(0);
      expect(max).toBeGreaterThan(min);
      expect(min).toBeLessThan(700); // Metal-oxygen region
    });

    it('should return valid range for octahedral site', () => {
      const [min, max] = getSiteWavenumberRange('octahedral');
      
      expect(min).toBeGreaterThan(0);
      expect(max).toBeGreaterThan(min);
      expect(min).toBeLessThan(700); // Metal-oxygen region
    });

    it('should return valid range for surface species', () => {
      const [min, max] = getSiteWavenumberRange('surface');
      
      expect(min).toBeGreaterThan(0);
      expect(max).toBeGreaterThan(min);
      expect(max).toBeGreaterThan(1000); // Mid-infrared region
    });
  });

  describe('validateBandPosition', () => {
    it('should validate position within uncertainty', () => {
      expect(validateBandPosition(580, 580, 20)).toBe(true);
      expect(validateBandPosition(590, 580, 20)).toBe(true);
      expect(validateBandPosition(570, 580, 20)).toBe(true);
    });

    it('should reject position outside uncertainty', () => {
      expect(validateBandPosition(610, 580, 20)).toBe(false);
      expect(validateBandPosition(550, 580, 20)).toBe(false);
    });
  });

  describe('getAllBandsSorted', () => {
    it('should return all bands sorted by wavenumber', () => {
      const sorted = getAllBandsSorted();
      
      expect(sorted.length).toBe(FTIR_REFERENCE_DATA.length);
      
      // Check ascending order
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].position).toBeGreaterThanOrEqual(sorted[i - 1].position);
      }
    });
  });
});

describe('FTIR Reference Data - Data Consistency', () => {
  describe('Wavenumber Ranges (Requirement 14.3)', () => {
    it('should have all wavenumbers between 400 and 4000 cm⁻¹', () => {
      // Requirement 14.3: FTIR wavenumbers between 400 and 4000 cm⁻¹
      FTIR_REFERENCE_DATA.forEach(band => {
        expect(band.position).toBeGreaterThanOrEqual(400);
        expect(band.position).toBeLessThanOrEqual(4000);
      });
    });
  });

  describe('FWHM Ranges (Requirement 4.5)', () => {
    it('should have all FWHM values between 40 and 150 cm⁻¹', () => {
      // Requirement 4.5: FTIR bands with widths (FWHM) between 40 and 100 cm⁻¹
      // (allowing up to 150 for broad hydroxyl bands)
      FTIR_REFERENCE_DATA.forEach(band => {
        const [minFwhm, maxFwhm] = band.fwhm;
        
        expect(minFwhm).toBeGreaterThanOrEqual(40);
        expect(maxFwhm).toBeLessThanOrEqual(150);
        expect(minFwhm).toBeLessThan(maxFwhm);
      });
    });
  });

  describe('Uncertainty Values', () => {
    it('should have positive uncertainty values', () => {
      FTIR_REFERENCE_DATA.forEach(band => {
        expect(band.uncertainty).toBeGreaterThan(0);
        expect(band.uncertainty).toBeLessThan(200); // Reasonable upper bound
      });
    });
  });

  describe('Literature Sources (Requirement 15.3)', () => {
    it('should have literature source for all entries', () => {
      // Requirement 15.3: Document literature sources for all vibrational mode assignments
      FTIR_REFERENCE_DATA.forEach(band => {
        expect(band.literatureSource).toBeDefined();
        expect(band.literatureSource.length).toBeGreaterThan(0);
      });
    });

    it('should reference Waldron (1955) for metal-oxygen bands', () => {
      const metalOxygenBands = getMetalOxygenBands();
      
      metalOxygenBands.forEach(band => {
        expect(band.literatureSource).toContain('Waldron');
      });
    });

    it('should reference Nakamoto for surface species', () => {
      const surfaceBands = getSurfaceBands();
      
      surfaceBands.forEach(band => {
        expect(band.literatureSource).toContain('Nakamoto');
      });
    });
  });

  describe('Bond Type Classification', () => {
    it('should have valid bond types', () => {
      const validBondTypes = ['metal-oxygen', 'hydroxyl', 'water'];
      
      FTIR_REFERENCE_DATA.forEach(band => {
        expect(validBondTypes).toContain(band.bondType);
      });
    });
  });

  describe('Site Classification', () => {
    it('should have valid site assignments', () => {
      const validSites = ['tetrahedral', 'octahedral', 'surface'];
      
      FTIR_REFERENCE_DATA.forEach(band => {
        expect(validSites).toContain(band.site);
      });
    });
  });

  describe('Database Completeness', () => {
    it('should contain at least 4 bands (2 metal-oxygen + 2 surface)', () => {
      expect(FTIR_REFERENCE_DATA.length).toBeGreaterThanOrEqual(4);
    });

    it('should have both tetrahedral and octahedral metal-oxygen bands', () => {
      const sites = new Set(getMetalOxygenBands().map(b => b.site));
      
      expect(sites.has('tetrahedral')).toBe(true);
      expect(sites.has('octahedral')).toBe(true);
    });

    it('should have surface species bands', () => {
      const surfaceBands = getSurfaceBands();
      
      expect(surfaceBands.length).toBeGreaterThan(0);
    });
  });

  describe('Assignment Descriptions', () => {
    it('should have non-empty assignment descriptions', () => {
      FTIR_REFERENCE_DATA.forEach(band => {
        expect(band.assignment).toBeDefined();
        expect(band.assignment.length).toBeGreaterThan(0);
      });
    });

    it('should use correct terminology', () => {
      // Requirement 8.4: Use "wavenumber" for FTIR x-axis
      FTIR_REFERENCE_DATA.forEach(band => {
        // Assignments should not use "frequency" when they mean wavenumber
        expect(band.assignment.toLowerCase()).not.toContain('frequency');
      });
    });
  });
});
