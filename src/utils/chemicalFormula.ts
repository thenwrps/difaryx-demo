/**
 * Chemical Formula Formatting Utility
 * 
 * Provides functions to format chemical formulas with proper Unicode subscripts
 * and oxidation states with proper Unicode superscripts.
 * 
 * Examples:
 * - CuFe2O4 → CuFe₂O₄
 * - Cu2+ → Cu²⁺
 * - Fe3+ → Fe³⁺
 */

/**
 * Mapping of digits to Unicode subscript characters
 */
const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

/**
 * Mapping of digits to Unicode superscript characters
 */
const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
};

/**
 * Formats a chemical formula by converting digits to Unicode subscripts
 * and oxidation states to Unicode superscripts.
 * 
 * @param formula - The chemical formula string to format
 * @returns The formatted chemical formula with proper subscripts and superscripts
 * 
 * @example
 * formatChemicalFormula('CuFe2O4') // Returns 'CuFe₂O₄'
 * formatChemicalFormula('Cu2+') // Returns 'Cu²⁺'
 * formatChemicalFormula('Fe3+') // Returns 'Fe³⁺'
 * formatChemicalFormula('H2O') // Returns 'H₂O'
 */
export function formatChemicalFormula(formula: string): string {
  if (!formula) {
    return formula;
  }

  // First, handle oxidation states (e.g., "2+" or "3-")
  // Pattern matches: digit(s) followed by + or -
  let formatted = formula.replace(/(\d+)([+-])/g, (match, digits, sign) => {
    const superscriptDigits = digits
      .split('')
      .map((d: string) => SUPERSCRIPT_MAP[d] || d)
      .join('');
    const superscriptSign = SUPERSCRIPT_MAP[sign] || sign;
    return superscriptDigits + superscriptSign;
  });

  // Then, convert remaining digits to subscripts
  // This handles stoichiometric coefficients in formulas
  formatted = formatted.replace(/\d/g, (digit) => SUBSCRIPT_MAP[digit] || digit);

  return formatted;
}

/**
 * Formats multiple chemical formulas in a text string.
 * Useful for formatting entire sentences or paragraphs containing chemical formulas.
 * 
 * @param text - The text containing chemical formulas
 * @returns The text with all chemical formulas formatted
 * 
 * @example
 * formatChemicalFormulasInText('The compound CuFe2O4 contains Cu2+ and Fe3+ ions.')
 * // Returns 'The compound CuFe₂O₄ contains Cu²⁺ and Fe³⁺ ions.'
 */
export function formatChemicalFormulasInText(text: string): string {
  if (!text) {
    return text;
  }

  // Pattern to match chemical formulas:
  // - Starts with uppercase letter
  // - Followed by lowercase letters, uppercase letters, digits, +, or -
  // - Ends before whitespace or punctuation (except + and -)
  const formulaPattern = /\b([A-Z][a-z]?(?:[A-Z][a-z]?|\d+|[+-])*)/g;

  return text.replace(formulaPattern, (match) => {
    // Only format if it contains digits or oxidation state notation
    if (/\d|[+-]/.test(match)) {
      return formatChemicalFormula(match);
    }
    return match;
  });
}
