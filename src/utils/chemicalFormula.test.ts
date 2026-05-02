import { describe, it, expect } from 'vitest';
import { formatChemicalFormula, formatChemicalFormulasInText } from './chemicalFormula';

describe('formatChemicalFormula', () => {
  describe('subscript formatting', () => {
    it('should convert digits to subscripts in CuFe2O4', () => {
      expect(formatChemicalFormula('CuFe2O4')).toBe('CuFe₂O₄');
    });

    it('should convert digits to subscripts in H2O', () => {
      expect(formatChemicalFormula('H2O')).toBe('H₂O');
    });

    it('should convert digits to subscripts in Fe3O4', () => {
      expect(formatChemicalFormula('Fe3O4')).toBe('Fe₃O₄');
    });

    it('should convert all digits 0-9 to subscripts', () => {
      expect(formatChemicalFormula('X0Y1Z2A3B4C5D6E7F8G9')).toBe('X₀Y₁Z₂A₃B₄C₅D₆E₇F₈G₉');
    });

    it('should handle multiple consecutive digits', () => {
      expect(formatChemicalFormula('Ca10(PO4)6(OH)2')).toBe('Ca₁₀(PO₄)₆(OH)₂');
    });
  });

  describe('oxidation state formatting', () => {
    it('should convert 2+ to superscript in Cu2+', () => {
      expect(formatChemicalFormula('Cu2+')).toBe('Cu²⁺');
    });

    it('should convert 3+ to superscript in Fe3+', () => {
      expect(formatChemicalFormula('Fe3+')).toBe('Fe³⁺');
    });

    it('should convert 2- to superscript in O2-', () => {
      expect(formatChemicalFormula('O2-')).toBe('O²⁻');
    });

    it('should handle single digit oxidation states', () => {
      expect(formatChemicalFormula('Na1+')).toBe('Na¹⁺');
      expect(formatChemicalFormula('Cl1-')).toBe('Cl¹⁻');
    });

    it('should handle multi-digit oxidation states', () => {
      expect(formatChemicalFormula('Ce4+')).toBe('Ce⁴⁺');
    });
  });

  describe('combined formatting', () => {
    it('should handle formulas with both subscripts and oxidation states', () => {
      // In practice, oxidation states are usually separate from formulas,
      // but the function should handle both
      const input = 'CuFe2O4 with Cu2+ and Fe3+';
      const expected = 'CuFe₂O₄ with Cu²⁺ and Fe³⁺';
      expect(formatChemicalFormula(input)).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('should return empty string for empty input', () => {
      expect(formatChemicalFormula('')).toBe('');
    });

    it('should handle formulas without digits', () => {
      expect(formatChemicalFormula('NaCl')).toBe('NaCl');
    });

    it('should handle formulas with parentheses', () => {
      expect(formatChemicalFormula('Ca(OH)2')).toBe('Ca(OH)₂');
    });

    it('should preserve non-digit characters', () => {
      expect(formatChemicalFormula('CuFe2O4·5H2O')).toBe('CuFe₂O₄·₅H₂O');
    });
  });
});

describe('formatChemicalFormulasInText', () => {
  it('should format chemical formulas in a sentence', () => {
    const input = 'The compound CuFe2O4 contains Cu2+ and Fe3+ ions.';
    const expected = 'The compound CuFe₂O₄ contains Cu²⁺ and Fe³⁺ ions.';
    expect(formatChemicalFormulasInText(input)).toBe(expected);
  });

  it('should format multiple formulas in text', () => {
    const input = 'H2O and H2O2 are different compounds.';
    const expected = 'H₂O and H₂O₂ are different compounds.';
    expect(formatChemicalFormulasInText(input)).toBe(expected);
  });

  it('should not modify text without formulas', () => {
    const input = 'This is plain text without any chemical formulas.';
    expect(formatChemicalFormulasInText(input)).toBe(input);
  });

  it('should handle empty string', () => {
    expect(formatChemicalFormulasInText('')).toBe('');
  });

  it('should preserve element symbols without digits', () => {
    const input = 'The elements Cu and Fe are metals.';
    expect(formatChemicalFormulasInText(input)).toBe(input);
  });

  it('should format complex scientific text', () => {
    const input = 'CuFe2O4 spinel structure with Cu2+ in octahedral sites and Fe3+ in both tetrahedral and octahedral sites.';
    const expected = 'CuFe₂O₄ spinel structure with Cu²⁺ in octahedral sites and Fe³⁺ in both tetrahedral and octahedral sites.';
    expect(formatChemicalFormulasInText(input)).toBe(expected);
  });
});
