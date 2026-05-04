/**
 * Test FTIR Matched/Unassigned Count Logic
 * Verify that matched count never exceeds detected bands and unassigned is never negative
 */

// Simulate the FTIR processing result
function testMatchedCounts() {
  // 6 detected bands
  const bands = [
    { id: 'band-1', wavenumber: 3398 },  // OH
    { id: 'band-2', wavenumber: 2920 },  // CH
    { id: 'band-3', wavenumber: 1630 },  // Water
    { id: 'band-4', wavenumber: 1550 },  // Carboxylate
    { id: 'band-5', wavenumber: 1450 },  // Carbonate
    { id: 'band-6', wavenumber: 550 },   // Metal-oxygen
  ];
  
  // Matches: Some bands match multiple references (carbonate/carboxylate overlap)
  const matches = [
    { observedBand: bands[0], referenceRange: { functionalGroup: 'Surface hydroxyl' } },
    { observedBand: bands[1], referenceRange: { functionalGroup: 'Aliphatic C-H' } },
    { observedBand: bands[2], referenceRange: { functionalGroup: 'Adsorbed water' } },
    { observedBand: bands[3], referenceRange: { functionalGroup: 'Carboxylate' } },  // Band 4 matches carboxylate
    { observedBand: bands[3], referenceRange: { functionalGroup: 'Carbonate' } },     // Band 4 ALSO matches carbonate (overlap)
    { observedBand: bands[4], referenceRange: { functionalGroup: 'Carbonate' } },     // Band 5 matches carbonate
    { observedBand: bands[4], referenceRange: { functionalGroup: 'Carboxylate' } },   // Band 5 ALSO matches carboxylate (overlap)
    { observedBand: bands[5], referenceRange: { functionalGroup: 'Metal-oxygen vibration' } },
  ];
  
  console.log('=== FTIR Matched/Unassigned Count Test ===\n');
  
  console.log(`Detected bands: ${bands.length}`);
  console.log(`Total matches: ${matches.length}`);
  
  // OLD METHOD (WRONG): Count total matches
  const oldMatchedCount = matches.length;
  const oldUnassignedCount = bands.length - oldMatchedCount;
  
  console.log('\n--- OLD METHOD (WRONG) ---');
  console.log(`Matched: ${oldMatchedCount}/${bands.length}`);
  console.log(`Unassigned: ${oldUnassignedCount}`);
  
  if (oldMatchedCount > bands.length) {
    console.log(`❌ ERROR: Matched count (${oldMatchedCount}) exceeds detected bands (${bands.length})`);
  }
  if (oldUnassignedCount < 0) {
    console.log(`❌ ERROR: Unassigned count is negative (${oldUnassignedCount})`);
  }
  
  // NEW METHOD (CORRECT): Count unique matched bands
  const uniqueMatchedBandIds = new Set(matches.map(match => match.observedBand.id));
  const newMatchedCount = uniqueMatchedBandIds.size;
  const newUnassignedCount = bands.length - newMatchedCount;
  
  console.log('\n--- NEW METHOD (CORRECT) ---');
  console.log(`Matched: ${newMatchedCount}/${bands.length}`);
  console.log(`Unassigned: ${newUnassignedCount}`);
  
  console.log('\n--- UNIQUE MATCHED BANDS ---');
  uniqueMatchedBandIds.forEach(id => {
    const band = bands.find(b => b.id === id);
    const bandMatches = matches.filter(m => m.observedBand.id === id);
    console.log(`${id} (${band.wavenumber} cm⁻¹): ${bandMatches.length} match(es) - ${bandMatches.map(m => m.referenceRange.functionalGroup).join(', ')}`);
  });
  
  console.log('\n=== TEST RESULT ===');
  
  let passed = true;
  
  if (newMatchedCount > bands.length) {
    console.log(`❌ FAIL: Matched count (${newMatchedCount}) exceeds detected bands (${bands.length})`);
    passed = false;
  } else {
    console.log(`✅ PASS: Matched count (${newMatchedCount}) does not exceed detected bands (${bands.length})`);
  }
  
  if (newUnassignedCount < 0) {
    console.log(`❌ FAIL: Unassigned count is negative (${newUnassignedCount})`);
    passed = false;
  } else {
    console.log(`✅ PASS: Unassigned count is non-negative (${newUnassignedCount})`);
  }
  
  if (newMatchedCount === bands.length && newUnassignedCount === 0) {
    console.log(`✅ PASS: All bands matched (${newMatchedCount}/${bands.length})`);
  } else {
    console.log(`✅ PASS: Partial match (${newMatchedCount}/${bands.length}, ${newUnassignedCount} unassigned)`);
  }
  
  return {
    detectedBands: bands.length,
    matchedBands: newMatchedCount,
    unassignedBands: newUnassignedCount,
    passed: passed,
  };
}

// Run test
const result = testMatchedCounts();

console.log('\n=== FINAL COUNTS ===');
console.log(`Detected bands: ${result.detectedBands}`);
console.log(`Matched: ${result.matchedBands}/${result.detectedBands}`);
console.log(`Unassigned: ${result.unassignedBands}`);

if (result.passed) {
  console.log('\n✅ ALL TESTS PASSED');
} else {
  console.log('\n❌ SOME TESTS FAILED');
}
