/**
 * Verification script for chemical formula formatting utility
 * Run with: node src/utils/chemicalFormula.verify.js
 */

// Inline implementation for verification
const SUBSCRIPT_MAP = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
};

const SUPERSCRIPT_MAP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻',
};

function formatChemicalFormula(formula) {
  if (!formula) return formula;

  // Handle oxidation states first
  let formatted = formula.replace(/(\d+)([+-])/g, (match, digits, sign) => {
    const superscriptDigits = digits
      .split('')
      .map(d => SUPERSCRIPT_MAP[d] || d)
      .join('');
    const superscriptSign = SUPERSCRIPT_MAP[sign] || sign;
    return superscriptDigits + superscriptSign;
  });

  // Convert remaining digits to subscripts
  formatted = formatted.replace(/\d/g, digit => SUBSCRIPT_MAP[digit] || digit);

  return formatted;
}

// Test cases
const tests = [
  { input: 'CuFe2O4', expected: 'CuFe₂O₄', description: 'Basic formula with subscripts' },
  { input: 'Cu2+', expected: 'Cu²⁺', description: 'Oxidation state Cu2+' },
  { input: 'Fe3+', expected: 'Fe³⁺', description: 'Oxidation state Fe3+' },
  { input: 'O2-', expected: 'O²⁻', description: 'Oxidation state O2-' },
  { input: 'H2O', expected: 'H₂O', description: 'Water formula' },
  { input: 'Fe3O4', expected: 'Fe₃O₄', description: 'Magnetite formula' },
  { input: 'Ca10(PO4)6(OH)2', expected: 'Ca₁₀(PO₄)₆(OH)₂', description: 'Complex formula with parentheses' },
  { input: 'NaCl', expected: 'NaCl', description: 'Formula without digits' },
  { input: '', expected: '', description: 'Empty string' },
  { input: 'X0Y1Z2A3B4C5D6E7F8G9', expected: 'X₀Y₁Z₂A₃B₄C₅D₆E₇F₈G₉', description: 'All digits 0-9' },
];

console.log('🧪 Chemical Formula Formatting Verification\n');
console.log('='.repeat(70));

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  const result = formatChemicalFormula(test.input);
  const success = result === test.expected;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${test.description}`);
    console.log(`   Input:    "${test.input}"`);
    console.log(`   Output:   "${result}"`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${test.description}`);
    console.log(`   Input:    "${test.input}"`);
    console.log(`   Expected: "${test.expected}"`);
    console.log(`   Got:      "${result}"`);
  }
  console.log('');
});

console.log('='.repeat(70));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);

if (failed === 0) {
  console.log('\n✨ All tests passed! The implementation is correct.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
