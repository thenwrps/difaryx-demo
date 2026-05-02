/**
 * Verification script for Raman Reference Data
 * This script validates that the Raman reference data meets all requirements
 */

// Import the data (we'll use dynamic import since this is ESM)
import { RAMAN_REFERENCE_DATA } from './src/data/ramanReferenceData.ts';

console.log('=== Raman Reference Data Verification ===\n');

// Requirement 5.7: Should have exactly 5 Raman-active modes
console.log('✓ Checking total number of modes...');
if (RAMAN_REFERENCE_DATA.length === 5) {
  console.log(`  PASS: Found 5 modes (A₁g + Eg + 3T₂g)`);
} else {
  console.log(`  FAIL: Expected 5 modes, found ${RAMAN_REFERENCE_DATA.length}`);
}

// Count modes by symmetry
const a1gModes = RAMAN_REFERENCE_DATA.filter(m => m.symmetry === 'A1g');
const egModes = RAMAN_REFERENCE_DATA.filter(m => m.symmetry === 'Eg');
const t2gModes = RAMAN_REFERENCE_DATA.filter(m => m.symmetry === 'T2g');

console.log('\n✓ Checking mode distribution...');
console.log(`  A₁g modes: ${a1gModes.length} (expected: 1)`);
console.log(`  Eg modes: ${egModes.length} (expected: 1)`);
console.log(`  T₂g modes: ${t2gModes.length} (expected: 3)`);

if (a1gModes.length === 1 && egModes.length === 1 && t2gModes.length === 3) {
  console.log('  PASS: Correct mode distribution');
} else {
  console.log('  FAIL: Incorrect mode distribution');
}

// Requirement 5.1: A₁g mode at 690 ± 10 cm⁻¹
console.log('\n✓ Checking A₁g mode (Requirement 5.1)...');
const a1gMode = a1gModes[0];
if (a1gMode.position === 690 && a1gMode.uncertainty === 10) {
  console.log(`  PASS: A₁g mode at ${a1gMode.position} ± ${a1gMode.uncertainty} cm⁻¹`);
} else {
  console.log(`  FAIL: A₁g mode at ${a1gMode.position} ± ${a1gMode.uncertainty} cm⁻¹ (expected 690 ± 10)`);
}

// Requirement 5.5: A₁g mode should be strongest (intensity 100)
console.log('\n✓ Checking A₁g mode intensity (Requirement 5.5)...');
if (a1gMode.relativeIntensity === 100) {
  console.log(`  PASS: A₁g mode has relative intensity 100 (strongest)`);
} else {
  console.log(`  FAIL: A₁g mode has relative intensity ${a1gMode.relativeIntensity} (expected 100)`);
}

// Requirement 5.3: Eg mode at 300 ± 15 cm⁻¹
console.log('\n✓ Checking Eg mode (Requirement 5.3)...');
const egMode = egModes[0];
if (egMode.position === 300 && egMode.uncertainty === 15) {
  console.log(`  PASS: Eg mode at ${egMode.position} ± ${egMode.uncertainty} cm⁻¹`);
} else {
  console.log(`  FAIL: Eg mode at ${egMode.position} ± ${egMode.uncertainty} cm⁻¹ (expected 300 ± 15)`);
}

// Requirement 5.2, 5.4: T₂g modes at 480 ± 15 and 560 ± 15 cm⁻¹
console.log('\n✓ Checking T₂g modes (Requirements 5.2, 5.4)...');
const t2g480 = t2gModes.find(m => m.position === 480);
const t2g560 = t2gModes.find(m => m.position === 560);

if (t2g480 && t2g480.uncertainty === 15) {
  console.log(`  PASS: T₂g mode at 480 ± 15 cm⁻¹`);
} else {
  console.log(`  FAIL: T₂g mode at 480 ± 15 cm⁻¹ not found or incorrect uncertainty`);
}

if (t2g560 && t2g560.uncertainty === 15) {
  console.log(`  PASS: T₂g mode at 560 ± 15 cm⁻¹`);
} else {
  console.log(`  FAIL: T₂g mode at 560 ± 15 cm⁻¹ not found or incorrect uncertainty`);
}

// Requirement 5.6: FWHM ranges between 15-40 cm⁻¹
console.log('\n✓ Checking FWHM ranges (Requirement 5.6)...');
let fwhmPass = true;
RAMAN_REFERENCE_DATA.forEach(mode => {
  const [min, max] = mode.fwhm;
  if (min < 15 || max > 40 || min >= max) {
    console.log(`  FAIL: Mode at ${mode.position} cm⁻¹ has FWHM [${min}, ${max}] (expected 15-40 range)`);
    fwhmPass = false;
  }
});
if (fwhmPass) {
  console.log('  PASS: All modes have FWHM in 15-40 cm⁻¹ range');
}

// Requirement 15.3: Literature sources (Graves et al., 1988)
console.log('\n✓ Checking literature sources (Requirement 15.3)...');
let literaturePass = true;
RAMAN_REFERENCE_DATA.forEach(mode => {
  if (!mode.literatureSource.includes('Graves') || !mode.literatureSource.includes('1988')) {
    console.log(`  FAIL: Mode at ${mode.position} cm⁻¹ missing Graves et al., 1988 reference`);
    literaturePass = false;
  }
});
if (literaturePass) {
  console.log('  PASS: All modes reference Graves et al., 1988');
}

// Check all required fields are present
console.log('\n✓ Checking interface completeness...');
let interfacePass = true;
RAMAN_REFERENCE_DATA.forEach(mode => {
  const requiredFields = ['position', 'uncertainty', 'symmetry', 'assignment', 'relativeIntensity', 'fwhm', 'literatureSource'];
  requiredFields.forEach(field => {
    if (!(field in mode)) {
      console.log(`  FAIL: Mode at ${mode.position} cm⁻¹ missing field: ${field}`);
      interfacePass = false;
    }
  });
});
if (interfacePass) {
  console.log('  PASS: All modes have required fields');
}

console.log('\n=== Verification Complete ===');
console.log('\nAll Raman modes:');
RAMAN_REFERENCE_DATA.forEach(mode => {
  console.log(`  ${mode.symmetry} at ${mode.position} ± ${mode.uncertainty} cm⁻¹ (intensity: ${mode.relativeIntensity})`);
  console.log(`    Assignment: ${mode.assignment}`);
  console.log(`    FWHM: [${mode.fwhm[0]}, ${mode.fwhm[1]}] cm⁻¹`);
  console.log(`    Source: ${mode.literatureSource}`);
  console.log('');
});
