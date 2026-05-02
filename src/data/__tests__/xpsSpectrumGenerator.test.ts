/**
 * Unit tests for XPS Spectrum Generator
 * 
 * These tests validate that the XPS spectrum generator module meets all requirements
 * specified in the scientific-accuracy-improvements spec (Task 7.1).
 */

import { describe, it, expect } from 'vitest';
import {
  gaussianLorentzian,
  shirleyBackground,
  generateXpsSpectrum,
  generateSpinOrbitDoublet,
  type XpsSpectrumPoint,
  type XpsRegion,
  type XpsGenerationOptions
} from '../xpsSpectrumGenerator';
import {
  XPS_REFERENCE_DATA,
  getCoreLevelReference,
  type XpsCoreLevelReference
} from '../xpsReferenceData';

describe('XPS Spectrum Generator Module', () => {
  describe('Gaussian-Lorentzian Peak Shape Function (Task 7.1)', () => {
    it('should implement gaussianLorentzian function with required parameters', () => {
      // Requirement 7.7: Implement Gaussian-Lorentzian peak shape function
      const result = gaussianLorentzian(933.5, 933.5, 2.5, 0.4, 0.2);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should return peak maximum (1.0) at center position', () => {
      // Peak should be maximum at center
      const center = 933.5;
      const fwhm = 2.5;
      const mixing = 0.4;
      const tailFactor = 0.2;
      
      const peakValue = gaussianLorentzian(center, center, fwhm, mixing, tailFactor);
      
      expect(peakValue).toBeCloseTo(1.0, 5);
    });

    it('should decrease away from center position', () => {
      // Peak should decrease as we move away from center
      const center = 933.5;
      const fwhm = 2.5;
      const mixing = 0.4;
      const tailFactor = 0.2;
      
      const peakValue = gaussianLorentzian(center, center, fwhm, mixing, tailFactor);
      const value1eV = gaussianLorentzian(center + 1, center, fwhm, mixing, tailFactor);
      const value2eV = gaussianLorentzian(center + 2, center, fwhm, mixing, tailFactor);
      
      expect(peakValue).toBeGreaterThan(value1eV);
      expect(value1eV).toBeGreaterThan(value2eV);
    });

    it('should support mixing parameter (0=Gaussian, 1=Lorentzian)', () => {
      // Requirement 7.7: Mixing parameter controls Gaussian-Lorentzian balance
      const center = 933.5;
      const fwhm = 2.5;
      const x = center + 2; // 2 eV from center
      
      const pureGaussian = gaussianLorentzian(x, center, fwhm, 0.0, 0.0);
      const pureLorentzian = gaussianLorentzian(x, center, fwhm, 1.0, 0.0);
      const mixed = gaussianLorentzian(x, center, fwhm, 0.5, 0.0);
      
      // Lorentzian has broader wings than Gaussian
      expect(pureLorentzian).toBeGreaterThan(pureGaussian);
      expect(mixed).toBeGreaterThan(pureGaussian);
      expect(mixed).toBeLessThan(pureLorentzian);
    });

    it('should support asymmetric tail factor', () => {
      // Requirement 7.7, 14.6: Asymmetric tail for inelastic scattering
      const center = 933.5;
      const fwhm = 2.5;
      const mixing = 0.4;
      
      const noTail = gaussianLorentzian(center + 2, center, fwhm, mixing, 0.0);
      const withTail = gaussianLorentzian(center + 2, center, fwhm, mixing, 0.2);
      
      // Tail should reduce intensity on higher BE side
      expect(withTail).toBeLessThan(noTail);
    });

    it('should be symmetric without tail factor', () => {
      // Without tail, peak should be symmetric
      const center = 933.5;
      const fwhm = 2.5;
      const mixing = 0.4;
      const tailFactor = 0.0;
      
      const lowerSide = gaussianLorentzian(center - 1, center, fwhm, mixing, tailFactor);
      const higherSide = gaussianLorentzian(center + 1, center, fwhm, mixing, tailFactor);
      
      expect(lowerSide).toBeCloseTo(higherSide, 5);
    });

    it('should validate FWHM is positive', () => {
      // FWHM must be positive
      expect(() => gaussianLorentzian(933.5, 933.5, 0, 0.4, 0.2)).toThrow('FWHM must be positive');
      expect(() => gaussianLorentzian(933.5, 933.5, -1, 0.4, 0.2)).toThrow('FWHM must be positive');
    });

    it('should validate mixing parameter is between 0 and 1', () => {
      // Mixing must be in [0, 1]
      expect(() => gaussianLorentzian(933.5, 933.5, 2.5, -0.1, 0.2)).toThrow('Mixing parameter must be between 0 and 1');
      expect(() => gaussianLorentzian(933.5, 933.5, 2.5, 1.5, 0.2)).toThrow('Mixing parameter must be between 0 and 1');
    });

    it('should validate tail factor is non-negative', () => {
      // Tail factor must be non-negative
      expect(() => gaussianLorentzian(933.5, 933.5, 2.5, 0.4, -0.1)).toThrow('Tail factor must be non-negative');
    });

    it('should work with typical XPS parameters', () => {
      // Requirement 3.10, 14.6: FWHM 2.0-3.5 eV for core levels
      const center = 933.5;
      const fwhm = 2.5; // Typical XPS FWHM
      const mixing = 0.4; // Typical mixing
      const tailFactor = 0.2; // Typical tail
      
      const result = gaussianLorentzian(center, center, fwhm, mixing, tailFactor);
      
      expect(result).toBeCloseTo(1.0, 5);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Shirley Background Function (Requirement 7.2)', () => {
    it('should generate Shirley-type background', () => {
      // Requirement 7.2: Generate XPS spectra with Shirley-type background
      const points: XpsSpectrumPoint[] = [];
      for (let i = 0; i < 100; i++) {
        points.push({ x: 920 + i * 0.5, y: 100 });
      }
      
      const background = shirleyBackground(points);
      
      expect(background).toBeDefined();
      expect(background.length).toBe(points.length);
    });

    it('should increase toward lower binding energy', () => {
      // Shirley background increases toward lower BE (left side)
      const points: XpsSpectrumPoint[] = [];
      for (let i = 0; i < 100; i++) {
        points.push({ x: 920 + i * 0.5, y: 100 });
      }
      
      const background = shirleyBackground(points);
      
      // Background should generally increase from right to left
      // (from high BE to low BE)
      const rightSide = background[background.length - 1];
      const leftSide = background[0];
      
      expect(leftSide).toBeGreaterThanOrEqual(rightSide);
    });

    it('should handle empty array', () => {
      const background = shirleyBackground([]);
      expect(background).toEqual([]);
    });
  });

  describe('Generate XPS Spectrum', () => {
    it('should generate spectrum for a given region', () => {
      const region: XpsRegion = {
        name: 'Cu 2p3/2',
        range: [925, 945],
        expectedPeaks: ['Cu 2p3/2']
      };
      
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      expect(cu2p3).toBeDefined();
      
      const spectrum = generateXpsSpectrum(region, [cu2p3!]);
      
      expect(spectrum).toBeDefined();
      expect(spectrum.length).toBeGreaterThan(0);
      expect(spectrum[0].x).toBeCloseTo(925, 1);
      expect(spectrum[spectrum.length - 1].x).toBeCloseTo(945, 1);
    });

    it('should include satellite peaks for Cu²⁺', () => {
      // Requirement 3.3: Include Cu²⁺ satellite peaks at +8-10 eV
      const region: XpsRegion = {
        name: 'Cu 2p3/2',
        range: [925, 950],
        expectedPeaks: ['Cu 2p3/2']
      };
      
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      expect(cu2p3).toBeDefined();
      expect(cu2p3!.satelliteOffset).toBeDefined();
      expect(cu2p3!.satelliteIntensity).toBeDefined();
      
      const spectrum = generateXpsSpectrum(region, [cu2p3!]);
      
      // Should have intensity at satellite position
      const satellitePosition = cu2p3!.bindingEnergy + cu2p3!.satelliteOffset!;
      const satellitePoint = spectrum.find(p => Math.abs(p.x - satellitePosition) < 0.5);
      
      expect(satellitePoint).toBeDefined();
      expect(satellitePoint!.y).toBeGreaterThan(0);
    });

    it('should generate spectrum with specified number of points', () => {
      const region: XpsRegion = {
        name: 'O 1s',
        range: [525, 535],
        expectedPeaks: ['O 1s']
      };
      
      const o1s = getCoreLevelReference('O', '2-', '1s');
      expect(o1s).toBeDefined();
      
      const options: XpsGenerationOptions = {
        points: 200
      };
      
      const spectrum = generateXpsSpectrum(region, [o1s!], options);
      
      expect(spectrum.length).toBe(200);
    });

    it('should add noise based on signal-to-noise ratio', () => {
      const region: XpsRegion = {
        name: 'O 1s',
        range: [525, 535],
        expectedPeaks: ['O 1s']
      };
      
      const o1s = getCoreLevelReference('O', '2-', '1s');
      expect(o1s).toBeDefined();
      
      const options: XpsGenerationOptions = {
        signalToNoise: 30,
        seed: 42
      };
      
      const spectrum = generateXpsSpectrum(region, [o1s!], options);
      
      // Spectrum should have some variation due to noise
      const intensities = spectrum.map(p => p.y);
      const maxIntensity = Math.max(...intensities);
      const minIntensity = Math.min(...intensities);
      
      expect(maxIntensity).toBeGreaterThan(minIntensity);
    });
  });

  describe('Generate Spin-Orbit Doublet (Requirement 10.5)', () => {
    it('should generate doublet with 2:1 intensity ratio', () => {
      // Requirement 10.5: 2p₃/₂:2p₁/₂ intensity ratio approximately 2:1
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      const cu2p1 = getCoreLevelReference('Cu', '2+', '2p1/2');
      
      expect(cu2p3).toBeDefined();
      expect(cu2p1).toBeDefined();
      
      const spectrum = generateSpinOrbitDoublet(cu2p3!, cu2p1!);
      
      expect(spectrum).toBeDefined();
      expect(spectrum.length).toBeGreaterThan(0);
      
      // Find peak intensities
      const peak3_2 = spectrum.find(p => Math.abs(p.x - cu2p3!.bindingEnergy) < 0.5);
      const peak1_2 = spectrum.find(p => Math.abs(p.x - cu2p1!.bindingEnergy) < 0.5);
      
      expect(peak3_2).toBeDefined();
      expect(peak1_2).toBeDefined();
      
      // Ratio should be approximately 2:1
      const ratio = peak3_2!.y / peak1_2!.y;
      expect(ratio).toBeGreaterThan(1.5);
      expect(ratio).toBeLessThan(2.5);
    });

    it('should include both components of doublet', () => {
      const fe2p3 = getCoreLevelReference('Fe', '3+', '2p3/2');
      const fe2p1 = getCoreLevelReference('Fe', '3+', '2p1/2');
      
      expect(fe2p3).toBeDefined();
      expect(fe2p1).toBeDefined();
      
      const spectrum = generateSpinOrbitDoublet(fe2p3!, fe2p1!);
      
      // Should have intensity at both peak positions
      const peak3_2 = spectrum.find(p => Math.abs(p.x - fe2p3!.bindingEnergy) < 1.0);
      const peak1_2 = spectrum.find(p => Math.abs(p.x - fe2p1!.bindingEnergy) < 1.0);
      
      expect(peak3_2).toBeDefined();
      expect(peak1_2).toBeDefined();
      expect(peak3_2!.y).toBeGreaterThan(0);
      expect(peak1_2!.y).toBeGreaterThan(0);
    });

    it('should include satellites for Cu²⁺ doublet', () => {
      // Requirement 3.3: Include Cu²⁺ satellite peaks
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      const cu2p1 = getCoreLevelReference('Cu', '2+', '2p1/2');
      
      expect(cu2p3).toBeDefined();
      expect(cu2p1).toBeDefined();
      
      const spectrum = generateSpinOrbitDoublet(cu2p3!, cu2p1!);
      
      // Should have satellites for both components
      const satellite3_2Position = cu2p3!.bindingEnergy + cu2p3!.satelliteOffset!;
      const satellite1_2Position = cu2p1!.bindingEnergy + cu2p1!.satelliteOffset!;
      
      const satellite3_2 = spectrum.find(p => Math.abs(p.x - satellite3_2Position) < 1.0);
      const satellite1_2 = spectrum.find(p => Math.abs(p.x - satellite1_2Position) < 1.0);
      
      expect(satellite3_2).toBeDefined();
      expect(satellite1_2).toBeDefined();
      expect(satellite3_2!.y).toBeGreaterThan(0);
      expect(satellite1_2!.y).toBeGreaterThan(0);
    });
  });

  describe('Peak Width Validation (Requirement 3.10, 14.6)', () => {
    it('should use FWHM in range 2.0-3.5 eV for core levels', () => {
      // Requirement 3.10: Generate XPS peak widths (FWHM) between 2.0 and 3.5 eV
      // Requirement 14.6: Generate asymmetric peak shapes for XPS peaks
      
      // Check that reference data has appropriate FWHM ranges
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      const fe2p3 = getCoreLevelReference('Fe', '3+', '2p3/2');
      const o1s = getCoreLevelReference('O', '2-', '1s');
      
      expect(cu2p3).toBeDefined();
      expect(fe2p3).toBeDefined();
      expect(o1s).toBeDefined();
      
      // Check FWHM ranges
      const checkFwhm = (ref: XpsCoreLevelReference) => {
        const [minFwhm, maxFwhm] = ref.fwhm;
        expect(minFwhm).toBeGreaterThanOrEqual(2.0);
        expect(maxFwhm).toBeLessThanOrEqual(3.5);
      };
      
      checkFwhm(cu2p3!);
      checkFwhm(fe2p3!);
      checkFwhm(o1s!);
    });
  });

  describe('Integration with Reference Data', () => {
    it('should work with all Cu²⁺ core levels', () => {
      const cu2p3 = getCoreLevelReference('Cu', '2+', '2p3/2');
      const cu2p1 = getCoreLevelReference('Cu', '2+', '2p1/2');
      
      expect(cu2p3).toBeDefined();
      expect(cu2p1).toBeDefined();
      
      const region: XpsRegion = {
        name: 'Cu 2p',
        range: [920, 970],
        expectedPeaks: ['Cu 2p3/2', 'Cu 2p1/2']
      };
      
      const spectrum = generateXpsSpectrum(region, [cu2p3!, cu2p1!]);
      
      expect(spectrum.length).toBeGreaterThan(0);
    });

    it('should work with all Fe³⁺ core levels', () => {
      const fe2p3 = getCoreLevelReference('Fe', '3+', '2p3/2');
      const fe2p1 = getCoreLevelReference('Fe', '3+', '2p1/2');
      
      expect(fe2p3).toBeDefined();
      expect(fe2p1).toBeDefined();
      
      const region: XpsRegion = {
        name: 'Fe 2p',
        range: [700, 735],
        expectedPeaks: ['Fe 2p3/2', 'Fe 2p1/2']
      };
      
      const spectrum = generateXpsSpectrum(region, [fe2p3!, fe2p1!]);
      
      expect(spectrum.length).toBeGreaterThan(0);
    });

    it('should work with O 1s core levels', () => {
      const o1sLattice = XPS_REFERENCE_DATA.find(
        ref => ref.element === 'O' && ref.bindingEnergy === 529.8
      );
      const o1sHydroxyl = XPS_REFERENCE_DATA.find(
        ref => ref.element === 'O' && ref.bindingEnergy === 531.5
      );
      
      expect(o1sLattice).toBeDefined();
      expect(o1sHydroxyl).toBeDefined();
      
      const region: XpsRegion = {
        name: 'O 1s',
        range: [525, 537],
        expectedPeaks: ['O 1s lattice', 'O 1s hydroxyl']
      };
      
      const spectrum = generateXpsSpectrum(region, [o1sLattice!, o1sHydroxyl!]);
      
      expect(spectrum.length).toBeGreaterThan(0);
    });
  });
});
