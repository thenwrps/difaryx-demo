/**
 * Manual verification script for Task 19: Enhanced Confidence Calculation
 * 
 * This script demonstrates the enhanced confidence calculation algorithm
 * Run with: npx tsx src/agents/xrdAgent/__tests__/manualVerification.ts
 */

import {
  score_phase_candidates,
  analyze_peak_conflicts,
  search_phase_database,
} from '../runner';
import type {
  XrdDetectedPeak,
  XrdPhaseReference,
} from '../types';

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

console.log('='.repeat(80));
console.log('Task 19: Enhanced Confidence Calculation - Manual Verification');
console.log('='.repeat(80));

// Test 1: Peak Position Tolerance (±0.2°)
console.log('\n[Test 1] Task 19.7: Peak Position Tolerance Matching (±0.2°)');
console.log('-'.repeat(80));
{
  const phase = createMockPhase('test1', 'TestPhase1', [
    { position: 30.0, relativeIntensity: 100, hkl: '(311)' },
    { position: 35.5, relativeIntensity: 80, hkl: '(400)' },
  ]);

  const detectedPeaks: XrdDetectedPeak[] = [
    createMockDetectedPeak('p1', 30.15, 95), // Within 0.2° tolerance
    createMockDetectedPeak('p2', 35.45, 75), // Within 0.2° tolerance
  ];

  const searchResults = search_phase_database(detectedPeaks, [phase]);
  console.log(`✓ Peaks within ±0.2° tolerance: ${searchResults[0].matches.length} matches`);
  console.log(`  Expected: 2 matches, Got: ${searchResults[0].matches.length}`);
  console.log(`  Status: ${searchResults[0].matches.length === 2 ? 'PASS' : 'FAIL'}`);
}

// Test 2: Weighted Scoring for Strong Peaks
console.log('\n[Test 2] Task 19.1: Weighted Scoring for Strong Peaks');
console.log('-'.repeat(80));
{
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

  const detectedPeaks: XrdDetectedPeak[] = [
    createMockDetectedPeak('p1', 30.0, 95),
    createMockDetectedPeak('p2', 35.5, 75),
  ];

  const searchResults = search_phase_database(detectedPeaks, [phaseWithStrongPeaks, phaseWithWeakPeaks]);
  const candidates = score_phase_candidates(searchResults, detectedPeaks);

  const strongPhaseCandidate = candidates.find(c => c.phase.id === 'strong');
  const weakPhaseCandidate = candidates.find(c => c.phase.id === 'weak');

  console.log(`✓ Strong peaks phase score: ${strongPhaseCandidate?.score.toFixed(3)}`);
  console.log(`✓ Weak peaks phase score: ${weakPhaseCandidate?.score.toFixed(3)}`);
  console.log(`  Status: ${strongPhaseCandidate!.score > weakPhaseCandidate!.score ? 'PASS' : 'FAIL'}`);
}

// Test 3: Penalty for Missing Strong Peaks
console.log('\n[Test 3] Task 19.2: Penalty for Missing Strong Peaks');
console.log('-'.repeat(80));
{
  const phase = createMockPhase('test', 'TestPhase', [
    { position: 30.0, relativeIntensity: 100, hkl: '(311)' }, // Strong
    { position: 35.5, relativeIntensity: 80, hkl: '(400)' },  // Strong
    { position: 40.0, relativeIntensity: 60, hkl: '(422)' },  // Strong
  ]);

  const detectedPeaks: XrdDetectedPeak[] = [
    createMockDetectedPeak('p1', 30.0, 95),
  ];

  const searchResults = search_phase_database(detectedPeaks, [phase]);
  const candidates = score_phase_candidates(searchResults, detectedPeaks);

  console.log(`✓ Missing strong peak penalty: ${candidates[0].missingStrongPeakPenalty.toFixed(3)}`);
  console.log(`✓ Confidence score: ${candidates[0].score.toFixed(3)}`);
  console.log(`  Status: ${candidates[0].missingStrongPeakPenalty > 0 && candidates[0].score < 0.7 ? 'PASS' : 'FAIL'}`);
}

// Test 4: Penalty for Unexplained Peaks
console.log('\n[Test 4] Task 19.3: Penalty for Unexplained Peaks');
console.log('-'.repeat(80));
{
  const phase = createMockPhase('test', 'TestPhase', [
    { position: 30.0, relativeIntensity: 100, hkl: '(311)' },
  ]);

  const detectedPeaks: XrdDetectedPeak[] = [
    createMockDetectedPeak('p1', 30.0, 95),
    createMockDetectedPeak('p2', 45.0, 50), // Unexplained
    createMockDetectedPeak('p3', 50.0, 40), // Unexplained
  ];

  const searchResults = search_phase_database(detectedPeaks, [phase]);
  const candidates = score_phase_candidates(searchResults, detectedPeaks);

  console.log(`✓ Unexplained peak penalty: ${candidates[0].unexplainedStrongPeakPenalty.toFixed(3)}`);
  console.log(`✓ Confidence score: ${candidates[0].score.toFixed(3)}`);
  console.log(`  Status: ${candidates[0].unexplainedStrongPeakPenalty > 0 && candidates[0].score < 0.8 ? 'PASS' : 'FAIL'}`);
}

// Test 5: Confidence Threshold Rules
console.log('\n[Test 5] Task 19.5: Confidence Threshold Rules');
console.log('-'.repeat(80));
{
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

  console.log(`✓ Match ratio: ${candidates[0].matchedReferencePeakRatio.toFixed(3)} (25%)`);
  console.log(`✓ Confidence score: ${candidates[0].score.toFixed(3)}`);
  console.log(`  Status: ${candidates[0].score < 0.50 ? 'PASS' : 'FAIL'} (should be < 50%)`);
}

// Test 6: Ambiguity Detection
console.log('\n[Test 6] Task 19.6: Ambiguity Detection');
console.log('-'.repeat(80));
{
  const phase1 = createMockPhase('phase1', 'Phase1', [
    { position: 30.0, relativeIntensity: 100, hkl: '(311)' },
    { position: 35.5, relativeIntensity: 80, hkl: '(400)' },
  ]);

  const phase2 = createMockPhase('phase2', 'Phase2', [
    { position: 30.05, relativeIntensity: 100, hkl: '(111)' },
    { position: 35.55, relativeIntensity: 80, hkl: '(200)' },
  ]);

  const detectedPeaks: XrdDetectedPeak[] = [
    createMockDetectedPeak('p1', 30.0, 95),
    createMockDetectedPeak('p2', 35.5, 75),
  ];

  const searchResults = search_phase_database(detectedPeaks, [phase1, phase2]);
  const candidates = score_phase_candidates(searchResults, detectedPeaks);
  const conflicts = analyze_peak_conflicts(candidates, detectedPeaks);

  console.log(`✓ Phase1 score: ${candidates[0].score.toFixed(3)}`);
  console.log(`✓ Phase2 score: ${candidates[1].score.toFixed(3)}`);
  console.log(`✓ Score difference: ${Math.abs(candidates[0].score - candidates[1].score).toFixed(3)}`);
  console.log(`✓ Ambiguous candidates detected: ${conflicts.ambiguousCandidates.length}`);
  
  const ambiguityNote = conflicts.notes.find(note => note.includes('complementary techniques'));
  console.log(`✓ Complementary techniques recommended: ${ambiguityNote ? 'Yes' : 'No'}`);
  console.log(`  Status: ${conflicts.ambiguousCandidates.length > 0 && ambiguityNote ? 'PASS' : 'FAIL'}`);
}

// Test 7: High Confidence for Good Match
console.log('\n[Test 7] Integration: High Confidence for Good Match');
console.log('-'.repeat(80));
{
  const phase = createMockPhase('cuferrite', 'CuFe2O4', [
    { position: 30.1, relativeIntensity: 100, hkl: '(311)' },
    { position: 35.5, relativeIntensity: 90, hkl: '(400)' },
    { position: 43.2, relativeIntensity: 70, hkl: '(422)' },
    { position: 57.1, relativeIntensity: 60, hkl: '(511)' },
  ]);

  const detectedPeaks: XrdDetectedPeak[] = [
    createMockDetectedPeak('p1', 30.1, 100),
    createMockDetectedPeak('p2', 35.5, 90),
    createMockDetectedPeak('p3', 43.2, 70),
    createMockDetectedPeak('p4', 57.1, 60),
  ];

  const searchResults = search_phase_database(detectedPeaks, [phase]);
  const candidates = score_phase_candidates(searchResults, detectedPeaks);

  console.log(`✓ Confidence score: ${candidates[0].score.toFixed(3)}`);
  console.log(`✓ Confidence level: ${candidates[0].confidenceLevel}`);
  console.log(`✓ Missing strong peak penalty: ${candidates[0].missingStrongPeakPenalty.toFixed(3)}`);
  console.log(`✓ Unexplained peak penalty: ${candidates[0].unexplainedStrongPeakPenalty.toFixed(3)}`);
  console.log(`  Status: ${candidates[0].score > 0.85 && candidates[0].confidenceLevel === 'high' ? 'PASS' : 'FAIL'}`);
}

console.log('\n' + '='.repeat(80));
console.log('Verification Complete');
console.log('='.repeat(80));
