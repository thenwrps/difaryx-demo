/**
 * Tests for enhanced interpretation generation (Task 20)
 * 
 * Verifies that interpretations include:
 * - Crystallographic metadata (phase name, crystal system, space group, JCPDS card)
 * - Proper scientific terminology
 * - Caveats and limitations
 */

import { describe, it, expect } from 'vitest';
import { generate_xrd_interpretation } from '../runner';
import type { XrdConflictAnalysis, XrdPhaseCandidate } from '../types';
import { XRD_PHASE_DATABASE } from '../../../data/xrdPhaseDatabase';

describe('XRD Interpretation Generation (Task 20.1)', () => {
  it('should include crystallographic metadata in interpretation', () => {
    const phase = XRD_PHASE_DATABASE[0]; // CuFe2O4
    
    const mockCandidate: XrdPhaseCandidate = {
      phase,
      score: 0.90,
      confidenceLevel: 'high',
      matches: [
        {
          observedPeak: { id: '1', position: 35.5, intensity: 100, fwhm: 0.2, classification: 'sharp', dSpacing: 2.527 },
          referencePeak: phase.peaks[2], // (311) peak
          delta: 0.0
        }
      ],
      matchedCount: 5,
      totalRefPeaks: 7
    };

    const mockConflicts: XrdConflictAnalysis = {
      primaryCandidate: mockCandidate,
      missingStrongPeaks: [],
      unexplainedPeaks: [],
      possibleImpurities: [],
      ambiguousCandidates: [],
      notes: []
    };

    const interpretation = generate_xrd_interpretation(mockConflicts, [mockCandidate]);

    // Check for crystallographic metadata
    expect(interpretation.decision).toContain('cubic');
    expect(interpretation.decision).toContain('Fd-3m');
    expect(interpretation.caveats.some(c => c.includes('space group'))).toBe(true);
    expect(interpretation.caveats.some(c => c.includes('JCPDS'))).toBe(true);
    expect(interpretation.caveats.some(c => c.includes('lattice parameter'))).toBe(true);
  });

  it('should include d-spacing in evidence', () => {
    const phase = XRD_PHASE_DATABASE[0];
    
    const mockCandidate: XrdPhaseCandidate = {
      phase,
      score: 0.90,
      confidenceLevel: 'high',
      matches: [
        {
          observedPeak: { id: '1', position: 35.5, intensity: 100, fwhm: 0.2, classification: 'sharp', dSpacing: 2.527 },
          referencePeak: phase.peaks[2],
          delta: 0.0
        }
      ],
      matchedCount: 5,
      totalRefPeaks: 7
    };

    const mockConflicts: XrdConflictAnalysis = {
      primaryCandidate: mockCandidate,
      missingStrongPeaks: [],
      unexplainedPeaks: [],
      possibleImpurities: [],
      ambiguousCandidates: [],
      notes: []
    };

    const interpretation = generate_xrd_interpretation(mockConflicts, [mockCandidate]);

    // Check that evidence includes d-spacing
    expect(interpretation.evidence[0]).toContain('d =');
    expect(interpretation.evidence[0]).toContain('Å');
  });

  it('should include caveats about XRD being bulk technique', () => {
    const phase = XRD_PHASE_DATABASE[0];
    
    const mockCandidate: XrdPhaseCandidate = {
      phase,
      score: 0.90,
      confidenceLevel: 'high',
      matches: [],
      matchedCount: 5,
      totalRefPeaks: 7
    };

    const mockConflicts: XrdConflictAnalysis = {
      primaryCandidate: mockCandidate,
      missingStrongPeaks: [],
      unexplainedPeaks: [],
      possibleImpurities: [],
      ambiguousCandidates: [],
      notes: []
    };

    const interpretation = generate_xrd_interpretation(mockConflicts, [mockCandidate]);

    // Check for caveats
    expect(interpretation.caveats.some(c => c.includes('bulk'))).toBe(true);
    expect(interpretation.caveats.some(c => c.includes('±0.2°'))).toBe(true);
  });

  it('should use proper scientific terminology (2θ not 2theta)', () => {
    const phase = XRD_PHASE_DATABASE[0];
    
    const mockCandidate: XrdPhaseCandidate = {
      phase,
      score: 0.90,
      confidenceLevel: 'high',
      matches: [
        {
          observedPeak: { id: '1', position: 35.5, intensity: 100, fwhm: 0.2, classification: 'sharp', dSpacing: 2.527 },
          referencePeak: phase.peaks[2],
          delta: 0.0
        }
      ],
      matchedCount: 5,
      totalRefPeaks: 7
    };

    const mockConflicts: XrdConflictAnalysis = {
      primaryCandidate: mockCandidate,
      missingStrongPeaks: [],
      unexplainedPeaks: [],
      possibleImpurities: [],
      ambiguousCandidates: [],
      notes: []
    };

    const interpretation = generate_xrd_interpretation(mockConflicts, [mockCandidate]);

    // Check for proper terminology
    expect(interpretation.evidence[0]).toContain('2θ');
    expect(interpretation.evidence[0]).not.toContain('2theta');
  });
});
