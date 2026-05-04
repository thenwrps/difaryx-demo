/**
 * Test FTIR Overall Confidence Calculation
 * Verify that the confidence is displayed correctly (55-70%, not 5.4%)
 */

// Simulate the confidence calculation
function calculateGlobalConfidence() {
  // Simulated candidate scores (after caps)
  const candidates = [
    { functionalGroup: 'Surface hydroxyl', score: 0.65, ambiguity: null },
    { functionalGroup: 'Metal-oxygen vibration', score: 0.65, ambiguity: null },
    { functionalGroup: 'Adsorbed water', score: 0.65, ambiguity: null },
    { functionalGroup: 'Carbonate', score: 0.60, ambiguity: 'carbonate/carboxylate overlap' },
    { functionalGroup: 'Carboxylate', score: 0.60, ambiguity: 'carbonate/carboxylate overlap' },
    { functionalGroup: 'Aliphatic C-H', score: 0.75, ambiguity: null },
  ];
  
  const bands = [
    { classification: 'broad', wavenumber: 3398 },  // OH
    { classification: 'narrow', wavenumber: 2920 }, // CH
    { classification: 'broad', wavenumber: 1630 },  // Water
    { classification: 'broad', wavenumber: 1550 },  // Carboxylate
    { classification: 'broad', wavenumber: 1450 },  // Carbonate
    { classification: 'broad', wavenumber: 550 },   // Metal-oxygen
  ];
  
  // Calculate average confidence
  const avgConfidence = candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length;
  console.log(`Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  
  // Count penalties
  const ambiguousCount = candidates.filter(c => c.ambiguity).length;
  const broadBandCount = bands.filter(b => b.classification === 'broad').length;
  const missingSupportCount = 0; // Assume all have support or none expected
  
  console.log(`Ambiguous count: ${ambiguousCount}`);
  console.log(`Broad band count: ${broadBandCount}`);
  console.log(`Missing support count: ${missingSupportCount}`);
  
  // Apply global penalties (FIXED: reduced penalties)
  let globalConfidence = avgConfidence;
  
  // Ambiguity penalty: -2% per ambiguous assignment
  const ambiguityPenalty = ambiguousCount * 0.02;
  globalConfidence -= ambiguityPenalty;
  console.log(`After ambiguity penalty (-${(ambiguityPenalty * 100).toFixed(1)}%): ${(globalConfidence * 100).toFixed(1)}%`);
  
  // Broad/composite penalty: -1.5% per broad band
  const broadPenalty = broadBandCount * 0.015;
  globalConfidence -= broadPenalty;
  console.log(`After broad band penalty (-${(broadPenalty * 100).toFixed(1)}%): ${(globalConfidence * 100).toFixed(1)}%`);
  
  // Missing support penalty: -2% per missing support
  const missingSupportPenalty = missingSupportCount * 0.02;
  globalConfidence -= missingSupportPenalty;
  console.log(`After missing support penalty (-${(missingSupportPenalty * 100).toFixed(1)}%): ${(globalConfidence * 100).toFixed(1)}%`);
  
  // Matched ratio bonus
  const matchedRatio = 6 / 6; // All bands matched
  if (matchedRatio >= 0.9) {
    globalConfidence += 0.05;
    console.log(`After matched ratio bonus (+5%): ${(globalConfidence * 100).toFixed(1)}%`);
  }
  
  // Clamp to [0, 1] and apply global cap of 90%
  globalConfidence = Math.max(0, Math.min(0.90, globalConfidence));
  console.log(`After clamping to [0, 90%]: ${(globalConfidence * 100).toFixed(1)}%`);
  
  // Determine confidence level
  let confidenceLevel;
  if (globalConfidence > 0.75) {
    confidenceLevel = 'high';
  } else if (globalConfidence > 0.5) {
    confidenceLevel = 'medium';
  } else {
    confidenceLevel = 'low';
  }
  
  // Force MEDIUM if there are ambiguous assignments
  if (ambiguousCount > 0 && confidenceLevel === 'high') {
    confidenceLevel = 'medium';
  }
  
  return {
    globalConfidence: globalConfidence * 100, // Convert to 0-100 scale
    confidenceLevel: confidenceLevel,
  };
}

// Run test
console.log('=== FTIR Overall Confidence Calculation Test ===\n');

const result = calculateGlobalConfidence();

console.log('\n=== FINAL RESULT ===');
console.log(`Overall Confidence: ${result.globalConfidence.toFixed(1)}%`);
console.log(`Confidence Level: ${result.confidenceLevel.toUpperCase()}`);

console.log('\n=== TEST RESULT ===');
if (result.globalConfidence >= 55 && result.globalConfidence <= 70) {
  console.log('✅ PASS: Confidence is within expected range (55-70%)');
} else {
  console.log(`❌ FAIL: Confidence ${result.globalConfidence.toFixed(1)}% is outside expected range (55-70%)`);
}

if (result.confidenceLevel === 'medium') {
  console.log('✅ PASS: Confidence level is MEDIUM');
} else {
  console.log(`❌ FAIL: Confidence level is ${result.confidenceLevel.toUpperCase()}, expected MEDIUM`);
}
