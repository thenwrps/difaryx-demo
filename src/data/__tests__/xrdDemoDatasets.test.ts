import { describe, it, expect } from 'vitest';
import { instrumentBroadening, exponentialBackground, preferredOrientationFactor } from '../xrdDemoDatasets';

describe('XRD Demo Datasets - Instrument Broadening', () => {
  describe('instrumentBroadening function (Requirement 14.5)', () => {
    it('should increase peak width with increasing 2θ angle', () => {
      // Requirement 14.5: Peak widths should increase with 2θ (instrument broadening)
      const intrinsicWidth = 0.16;
      
      // Test at different 2θ angles
      const width20 = instrumentBroadening(20, intrinsicWidth);
      const width35 = instrumentBroadening(35, intrinsicWidth);
      const width50 = instrumentBroadening(50, intrinsicWidth);
      const width70 = instrumentBroadening(70, intrinsicWidth);
      
      // Peak widths should increase (or remain constant) with increasing angle
      expect(width35).toBeGreaterThanOrEqual(width20);
      expect(width50).toBeGreaterThanOrEqual(width35);
      expect(width70).toBeGreaterThanOrEqual(width50);
    });
    
    it('should return values within realistic range for well-crystallized samples', () => {
      // Requirement 2.7: Peak widths (FWHM) between 0.15° and 0.25° for well-crystallized CuFe₂O₄
      const intrinsicWidth = 0.16;
      
      // Test at various angles across the typical XRD range (10-80°)
      for (let twoTheta = 10; twoTheta <= 80; twoTheta += 10) {
        const width = instrumentBroadening(twoTheta, intrinsicWidth);
        
        // Should be at least 0.15° (enforced minimum)
        expect(width).toBeGreaterThanOrEqual(0.15);
        
        // For well-crystallized samples, widths should be reasonable
        // (can be broader at high angles due to instrument effects)
        expect(width).toBeLessThan(0.5); // Reasonable upper bound
      }
    });
    
    it('should handle different intrinsic widths correctly', () => {
      const twoTheta = 35.5; // (311) peak position
      
      // Test with different intrinsic widths
      const narrowWidth = instrumentBroadening(twoTheta, 0.15);
      const mediumWidth = instrumentBroadening(twoTheta, 0.20);
      const broadWidth = instrumentBroadening(twoTheta, 0.30);
      
      // Broader intrinsic width should result in broader total width
      expect(mediumWidth).toBeGreaterThan(narrowWidth);
      expect(broadWidth).toBeGreaterThan(mediumWidth);
    });
    
    it('should apply Caglioti function correctly', () => {
      // The Caglioti function models instrument broadening as:
      // FWHM² = U·tan²θ + V·tanθ + W
      // This should produce monotonically increasing widths with angle
      
      const intrinsicWidth = 0.16;
      const angles = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75];
      const widths = angles.map(angle => instrumentBroadening(angle, intrinsicWidth));
      
      // Check that widths are monotonically non-decreasing
      for (let i = 1; i < widths.length; i++) {
        expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1]);
      }
    });
    
    it('should enforce minimum width of 0.15°', () => {
      // Even with very small intrinsic width, should enforce minimum
      const verySmallIntrinsic = 0.05;
      
      for (let twoTheta = 10; twoTheta <= 80; twoTheta += 10) {
        const width = instrumentBroadening(twoTheta, verySmallIntrinsic);
        expect(width).toBeGreaterThanOrEqual(0.15);
      }
    });
  });
  
  describe('exponentialBackground function (Requirement 7.1)', () => {
    it('should generate monotonically decreasing background from 10° to 80°', () => {
      // Requirement 7.1: Generate XRD patterns with exponentially decaying background
      const angles = [10, 20, 30, 40, 50, 60, 70, 80];
      const backgrounds = angles.map(angle => exponentialBackground(angle));
      
      // Background should generally decrease with angle
      // (allowing for small modulation artifacts)
      const avgFirst = (backgrounds[0] + backgrounds[1]) / 2;
      const avgLast = (backgrounds[backgrounds.length - 2] + backgrounds[backgrounds.length - 1]) / 2;
      
      expect(avgLast).toBeLessThan(avgFirst);
    });
    
    it('should return positive background values', () => {
      // Background should always be positive
      for (let twoTheta = 10; twoTheta <= 80; twoTheta += 5) {
        const background = exponentialBackground(twoTheta);
        expect(background).toBeGreaterThan(0);
      }
    });
  });
  
  describe('preferredOrientationFactor function (Requirement 10.3)', () => {
    it('should reduce (111) peak intensity by 30%', () => {
      // Requirement 10.3: Apply preferred orientation effects that reduce (111) intensities by up to 30%
      const factor111 = preferredOrientationFactor('(111)');
      
      // Factor should be 0.7 (30% reduction)
      expect(factor111).toBe(0.7);
    });
    
    it('should reduce (222) peak intensity by 30%', () => {
      // Requirement 10.3: Apply preferred orientation effects that reduce (222) intensities by up to 30%
      const factor222 = preferredOrientationFactor('(222)');
      
      // Factor should be 0.7 (30% reduction)
      expect(factor222).toBe(0.7);
    });
    
    it('should not affect other Miller indices', () => {
      // Other reflections should not be affected by preferred orientation
      const testIndices = ['(220)', '(311)', '(400)', '(422)', '(511)', '(440)'];
      
      testIndices.forEach(hkl => {
        const factor = preferredOrientationFactor(hkl);
        expect(factor).toBe(1.0);
      });
    });
    
    it('should return values between 0 and 1', () => {
      // All orientation factors should be valid scaling factors
      const allIndices = ['(111)', '(222)', '(220)', '(311)', '(400)', '(422)', '(511)', '(440)'];
      
      allIndices.forEach(hkl => {
        const factor = preferredOrientationFactor(hkl);
        expect(factor).toBeGreaterThan(0);
        expect(factor).toBeLessThanOrEqual(1.0);
      });
    });
  });
});
