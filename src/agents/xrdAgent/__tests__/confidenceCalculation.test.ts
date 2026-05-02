/**
 * Test suite for Task 19: Enhanced Confidence Calculation Algorithm
 * 
 * Tests the enhanced confidence calculation with:
 * - 19.1: Weighted scoring for strong peaks (relative intensity > 30)
 * - 19.2: Penalty for missing strong peaks
 * - 19.3: Penalty for unexplained peaks
 * - 19.5: Confidence threshold rules
 * - 19.6: Ambiguity detection
 * - 19.7: Peak position tolerance matching (±0.2°)
 */

import { describe, it, expect } from 'vitest';
import {
  score_phase_candidates,
  analyze_peak_conflicts,
  search_phase_database,
  detect_xrd_peaks,
  preprocess_xrd,
} from '../runner';
import type {
  XrdPhaseSearchResult,
  XrdDetectedPeak,
  XrdPhaseReference,
  XrdReferencePeak,
  XrdPoint,
} from '../types';

describe('Task 19: Enhanced Confidence Calculation Algorithm', () => {
  // Helper function to create a mock phase reference
  function createMockPhase(
    id: string,
    name: string,
    peaks: Array<{ position: number; relativeIntensity: number; hkl: string }>
  ): XrdPhaseReference {
    return {
      id,
      name,
      formula: 'TestPhase',
      family: 'test',
      crystalSystem: 'cubic',
      spaceGroup: 'Fm-3m',
      latticeParameters: { a: 8.0 },
      referenceNote: 'Test phase',
      peaks: peaks.map(p => ({
        ...p,
        dSpacing: 2.5,
      })),
    };
  }

  // Helper function to create a mock detected peak
  function createMockDetectedPeak(
    id: string,
    position: number,
    intensity: number,
    classification: 'sharp' | 'broad' = 'sharp'
  ): XrdDetectedPeak {
    return {
      id,
      position,
      intensity,
      rawIntensity: intensity,
      prominence: intensity * 0.8,
      fwhm: 0.2,
      dSpacing: 2.5,
      classification,
      label: `peak ${id}`,
    };
  }

  describe('Task 19.7: Peak Position Tolerance Matching (±0.2°)', () => {
    it('should match peaks within ±0.2° tolerance', () => {
      const phase = createMockPhase('test1', 'TestPhase1', [
        { position: 30.0, relativeIntensity: 100, hkl: '(311)' },
        { position: 35.5, relativeIntensity: 80, hkl: '(400)' },
      ]);

      const detectedPeaks: XrdDetectedPeak[] = [
        createMockDetectedPeak('p1', 30.15, 95), // Within 0.2° tolerance
        createMockDetectedPeak('p2', 35.45, 75), // Within 0.2° tolerance
      ];

      const searchResults = search_phase_database(detectedPeaks, [phase]);
      expect(searchResults[0].matches.length).toBe(2);
    });

    it('should NOT match peaks outside ±0.2° tolerance', () => {
      const phase = createMockPhase('test1', 'TestPhase1', [
        { position: 30.0, relativeIntensity: 100, hkl: '(311)' },
      ]);

      const detectedPeaks: XrdDetectedPeak[] = [
        createMockDetectedPeak('p1', 30.25, 95), // Outside 0.2° tolerance
      ];

      const searchResults = search_phase_database(detectedPeaks, [phase]);
      expect(searchResults[0].matches.length).toBe(0);
    });
  });

  describe('Task 19.1: Weighted Scoring for Strong Peaks', () => {
    it('should weight strong peaks (intensity > 30) more heavily', () => {
      // Phase with mix of strong and weak peaks
      const phaseWithStrongPeaks = createMockPhase('strong', 'StrongPeaks', [
        { position: 30.0, relativeIntensity: 100, hkl: '(311)' }, // Strong
        { position: 35.5, relativeIntensity: 80, hkl: '(400)' },  // Strong
        { position: 40.0, relativeIntensity: 20, hkl: '(422)' },  // Weak
      ]);

      const phaseWithWeakPeaks = createMockPhase('weak', 'WeakPeaks', [
        { position: 30.0, relativeIntensity: 25, hkl: '(111)' }, // Weak
        { position: 35.5, relativeIntensity: 25, hkl: '(200)' }, // Weak
        { position: 40.0, relativeIntensity: 25, hkl: '(220)' }, // Weak
      ]);

      // Match 2 out of 3 peaks for both phases
      const detectedPeaks: XrdDetectedPeak[] = [
        createMockDetectedPeak('p1', 30.0, 95),
        createMockDetectedPeak('p2', 35.5, 75),
      ];

      const searchResults = search_phase_database(detectedPeaks, [phaseWithStrongPeaks, phaseWithWeakPeaks]);
      const candidates = score_phase_candidates(searchResults, detectedPeaks);

      // Phase with strong peaks should score higher due to weighted scoring
      const strongPhaseCandidate = candidates.find(c => c.phase.id === 'strong');
      const weakPhaseCandidate = candidates.find(c => c.phase.id === 'weak');

      expect(strongPhaseCandidate).toBeDefined();
      expect(weakPhaseCandidate).toBeDefined();
      expect(strongPhaseCandidate!.score).toBeGreaterThan(weakPhaseCandidate!.score);
    });
  });

  describe('Task 19.2: Penalty for Missing Strong Peaks', () => {
    it('should penalize missing strong reference peaks', () => {
      const phase = createMockPhase('test', 'TestPhase', [
        { position: 30.0, relativeIntensity: 100, hkl: '(311)' }, // Strong
        { position: 35.5, relativeIntensity: 80, hkl: '(400)' },  // Strong
        { position: 40.0, relativeIntensity: 60, hkl: '(422)' },  // Strong
      ]);

      // Only match 1 out of 3 strong peaks
      const detectedPeaks: XrdDetectedPeak[] = [
        createMockDetectedPeak('p1', 30.0, 95),
      ];

      const searchResults = search_phase_database(detectedPeaks, [phase]);
      const candidates = score_phase_candidates(searchResults, detectedPeaks);

      expect(candidates[0].missingStrongPeakPenalty).toBeGreaterThan(0);
      expect(candidates[0].score).toBeLessThan(0.7); // Should have reduced confidence
    });
  });

  describe('Task 19.3: Penalty for Unexplained Peaks', () => {
    it('should penalize unexplained observed peaks', () => {
      const phase = createMockPhase('test', 'TestPhase', [
        { position: 30.0, relativeIntensity: 100, hkl: '(311)' },
      ]);

      // 1 matched peak + 2 unexplained peaks
      const detectedPeaks: XrdDetectedPeak[] = [
        createMockDetectedPeak('p1', 30.0, 95),
        createMockDetectedPeak('p2', 45.0, 50), // Unexplained
        createMockDetectedPeak('p3', 50.0, 40), // Unexplained
      ];

      const searchResults = search_phase_database(detectedPeaks, [phase]);
      const candidates = score_phase_candidates(searchResults, detectedPeaks);

      expect(candidates[0].unexplainedStrongPeakPenalty).toBeGreaterThan(0);
      expect(candidates[0].score).toBeLessThan(0.8); // Should have reduced confidence
    });
  });

  describe('Task 19.5: Confidence Threshold Rules', () => {
    it('should cap confidence at 85% when <80% of strong peaks matched', () => {
      const phase = createMockPhase('test', 'TestPhase', [
        { position: 30.0, relativeIntensity: 100, hkl: '(311)' }, // Strong
        { position: 35.5, relativeIntensity: 80, hkl: '(400)' },  // Strong
        { position: 40.0, relativeIntensity: 60, hkl: '(422)' },  // Strong
        { position: 43.0, relativeIntensity: 50, hkl: '(511)' },  // Strong
        { position: 45.0, relativeIntensity: 40, hkl: '(440)' },  // Strong
      ]);

      // Match 3 out of 5 strong peaks (60% < 80%)
      const detectedPeaks: XrdDetectedPeak[] = [
        createMockDetectedPeak('p1', 30.0, 95),
        createMockDetectedPeak('p2', 35.5, 75),
        createMockDetectedPeak('p3', 40.0, 55),
      ];

      const searchResults = search_phase_database(detectedPeaks, [phase]);
      const candidates = score_phase_candidates(searchResults, detectedPeaks);

      // Confidence should be capped at 85% (0.85)
      expect(candidates[0].score).toBeLessThanOrEqual(0.85);
    });

    it('should cap confidence below 50% when <50% of reference peaks matched', () => {
      const phase = createMockPhase('test', 'TestPhase', [
        { position: 30.0, relativeIntensity: 100, hkl: '(311)' },
        { position: 35.5, relativeIntensity: 80, hkl: '(400)' },
        { position: 40.0, relativeIntensity: 60, hkl: '(422)' },
        { position: 43.0, relativeIntensity: 50, hkl: '(511)' },
      ]);

      // Match only 1 out of 4 peaks (25% < 50%)
      const detectedPeaks: XrdDetectedPeak[] = [
        createMockDetectedPeak('p1', 30.0, 95),
      ];

      const searchResults = search_phase_database(detectedPeaks, [phase]);
      const candidates = score_phase_candidates(searchResults, detectedPeaks);

      // Confidence should be below 50% (0.50)
      expect(candidates[0].score).toBeLessThan(0.50);
    });
  });

  describe('Task 19.6: Ambiguity Detection', () => {
    it('should detect ambiguous candidates with similar confidence scores', () => {
      const phase1 = createMockPhase('phase1', 'Phase1', [
        { position: 30.0, relativeIntensity: 100, hkl: '(311)' },
        { position: 35.5, relativeIntensity: 80, hkl: '(400)' },
      ]);

      const phase2 = createMockPhase('phase2', 'Phase2', [
        { position: 30.05, relativeIntensity: 100, hkl: '(111)' }, // Very close to phase1
        { position: 35.55, relativeIntensity: 80, hkl: '(200)' },  // Very close to phase1
      ]);

      const detectedPeaks: XrdDetectedPeak[] = [
        createMockDetectedPeak('p1', 30.0, 95),
        createMockDetectedPeak('p2', 35.5, 75),
      ];

      const searchResults = search_phase_database(detectedPeaks, [phase1, phase2]);
      const candidates = score_phase_candidates(searchResults, detectedPeaks);
      const conflicts = analyze_peak_conflicts(candidates, detectedPeaks);

      // Should detect ambiguity when scores are within 5%
      expect(conflicts.ambiguousCandidates.length).toBeGreaterThan(0);
      
      // Should recommend complementary techniques
      const ambiguityNote = conflicts.notes.find(note => 
        note.includes('complementary techniques')
      );
      expect(ambiguityNote).toBeDefined();
      expect(ambiguityNote).toContain('XPS');
      expect(ambiguityNote).toContain('FTIR');
      expect(ambiguityNote).toContain('Raman');
    });

    it('should NOT flag ambiguity when confidence scores differ by >5%', () => {
      const phase1 = createMockPhase('phase1', 'Phase1', [
        { position: 30.0, relativeIntensity: 100, hkl: '(311)' },
        { position: 35.5, relativeIntensity: 80, hkl: '(400)' },
      ]);

      const phase2 = createMockPhase('phase2', 'Phase2', [
        { position: 50.0, relativeIntensity: 100, hkl: '(111)' }, // Different peaks
        { position: 55.0, relativeIntensity: 80, hkl: '(200)' },
      ]);

      const detectedPeaks: XrdDetectedPeak[] = [
        createMockDetectedPeak('p1', 30.0, 95),
        createMockDetectedPeak('p2', 35.5, 75),
      ];

      const searchResults = search_phase_database(detectedPeaks, [phase1, phase2]);
      const candidates = score_phase_candidates(searchResults, detectedPeaks);
      const conflicts = analyze_peak_conflicts(candidates, detectedPeaks);

      // Should NOT detect ambiguity when scores differ significantly
      expect(conflicts.ambiguousCandidates.length).toBe(0);
    });
  });

  describe('Integration: Complete Confidence Calculation', () => {
    it('should produce high confidence for good match with all strong peaks', () => {
      const phase = createMockPhase('cuferrite', 'CuFe2O4', [
        { position: 30.1, relativeIntensity: 100, hkl: '(311)' },
        { position: 35.5, relativeIntensity: 90, hkl: '(400)' },
        { position: 43.2, relativeIntensity: 70, hkl: '(422)' },
        { position: 57.1, relativeIntensity: 60, hkl: '(511)' },
      ]);

      // Match all peaks with good accuracy
      const detectedPeaks: XrdDetectedPeak[] = [
        createMockDetectedPeak('p1', 30.1, 100),
        createMockDetectedPeak('p2', 35.5, 90),
        createMockDetectedPeak('p3', 43.2, 70),
        createMockDetectedPeak('p4', 57.1, 60),
      ];

      const searchResults = search_phase_database(detectedPeaks, [phase]);
      const candidates = score_phase_candidates(searchResults, detectedPeaks);

      expect(candidates[0].score).toBeGreaterThan(0.85);
      expect(candidates[0].confidenceLevel).toBe('high');
      expect(candidates[0].missingStrongPeakPenalty).toBe(0);
      expect(candidates[0].unexplainedStrongPeakPenalty).toBe(0);
    });

    it('should produce low confidence for poor match', () => {
      const phase = createMockPhase('cuferrite', 'CuFe2O4', [
        { position: 30.1, relativeIntensity: 100, hkl: '(311)' },
        { position: 35.5, relativeIntensity: 90, hkl: '(400)' },
        { position: 43.2, relativeIntensity: 70, hkl: '(422)' },
        { position: 57.1, relativeIntensity: 60, hkl: '(511)' },
      ]);

      // Match only 1 peak, with unexplained peaks
      const detectedPeaks: XrdDetectedPeak[] = [
        createMockDetectedPeak('p1', 30.1, 100),
        createMockDetectedPeak('p2', 50.0, 80), // Unexplained
        createMockDetectedPeak('p3', 60.0, 70), // Unexplained
      ];

      const searchResults = search_phase_database(detectedPeaks, [phase]);
      const candidates = score_phase_candidates(searchResults, detectedPeaks);

      expect(candidates[0].score).toBeLessThan(0.50);
      expect(candidates[0].confidenceLevel).toBe('low');
      expect(candidates[0].missingStrongPeakPenalty).toBeGreaterThan(0);
      expect(candidates[0].unexplainedStrongPeakPenalty).toBeGreaterThan(0);
    });
  });
});
