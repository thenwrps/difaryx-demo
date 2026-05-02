# Chemical Formula Formatting Utility

## Overview

This utility provides functions to format chemical formulas with proper Unicode subscripts and oxidation states with proper Unicode superscripts, ensuring scientific accuracy throughout the DIFARYX application.

## Features

- ✅ Converts digits to Unicode subscripts (0→₀, 1→₁, 2→₂, etc.)
- ✅ Converts oxidation states to Unicode superscripts (Cu²⁺, Fe³⁺)
- ✅ Handles complex formulas with parentheses
- ✅ Supports batch formatting of text containing multiple formulas
- ✅ Preserves non-formula text unchanged

## Installation

The utility is located at `src/utils/chemicalFormula.ts` and can be imported as:

```typescript
import { formatChemicalFormula, formatChemicalFormulasInText } from '@/utils/chemicalFormula';
```

## API Reference

### `formatChemicalFormula(formula: string): string`

Formats a single chemical formula by converting digits to Unicode subscripts and oxidation states to Unicode superscripts.

**Parameters:**
- `formula` (string): The chemical formula string to format

**Returns:**
- (string): The formatted chemical formula with proper subscripts and superscripts

**Examples:**

```typescript
formatChemicalFormula('CuFe2O4')  // Returns: 'CuFe₂O₄'
formatChemicalFormula('Cu2+')     // Returns: 'Cu²⁺'
formatChemicalFormula('Fe3+')     // Returns: 'Fe³⁺'
formatChemicalFormula('H2O')      // Returns: 'H₂O'
formatChemicalFormula('O2-')      // Returns: 'O²⁻'
```

### `formatChemicalFormulasInText(text: string): string`

Formats multiple chemical formulas within a text string. Useful for formatting entire sentences or paragraphs containing chemical formulas.

**Parameters:**
- `text` (string): The text containing chemical formulas

**Returns:**
- (string): The text with all chemical formulas formatted

**Examples:**

```typescript
formatChemicalFormulasInText('The compound CuFe2O4 contains Cu2+ and Fe3+ ions.')
// Returns: 'The compound CuFe₂O₄ contains Cu²⁺ and Fe³⁺ ions.'

formatChemicalFormulasInText('H2O and H2O2 are different compounds.')
// Returns: 'H₂O and H₂O₂ are different compounds.'
```

## Usage Examples

### In React Components

```typescript
import { formatChemicalFormula } from '@/utils/chemicalFormula';

function PhaseCard({ phase }: { phase: string }) {
  return (
    <div className="phase-card">
      <h3>{formatChemicalFormula(phase)}</h3>
    </div>
  );
}

// Usage:
<PhaseCard phase="CuFe2O4" />  // Displays: CuFe₂O₄
```

### In Data Files

```typescript
import { formatChemicalFormula } from '@/utils/chemicalFormula';

const phaseDatabase = [
  {
    id: 'copper-ferrite',
    name: 'Copper Ferrite',
    formula: formatChemicalFormula('CuFe2O4'),  // Stored as: 'CuFe₂O₄'
    // ... other properties
  }
];
```

### In Technique Descriptions

```typescript
import { formatChemicalFormulasInText } from '@/utils/chemicalFormula';

const xpsDescription = formatChemicalFormulasInText(
  'XPS analysis reveals Cu2+ 2p3/2 binding energy at 933.5 eV and ' +
  'Fe3+ 2p3/2 binding energy at 710.8 eV, confirming the oxidation states ' +
  'in CuFe2O4 spinel structure.'
);
```

### In Graph Labels

```typescript
import { formatChemicalFormula } from '@/utils/chemicalFormula';

const graphConfig = {
  title: formatChemicalFormula('XRD Pattern of CuFe2O4'),
  // ... other config
};
```

## Implementation Details

### Subscript Mapping

The utility uses Unicode subscript characters:

| Digit | Subscript |
|-------|-----------|
| 0     | ₀         |
| 1     | ₁         |
| 2     | ₂         |
| 3     | ₃         |
| 4     | ₄         |
| 5     | ₅         |
| 6     | ₆         |
| 7     | ₇         |
| 8     | ₈         |
| 9     | ₉         |

### Superscript Mapping

The utility uses Unicode superscript characters for oxidation states:

| Character | Superscript |
|-----------|-------------|
| 0         | ⁰           |
| 1         | ¹           |
| 2         | ²           |
| 3         | ³           |
| 4         | ⁴           |
| 5         | ⁵           |
| 6         | ⁶           |
| 7         | ⁷           |
| 8         | ⁸           |
| 9         | ⁹           |
| +         | ⁺           |
| -         | ⁻           |

### Processing Order

The function processes formulas in two steps:

1. **Oxidation States First**: Converts patterns like `2+` or `3-` to superscripts (e.g., `²⁺`, `³⁻`)
2. **Remaining Digits**: Converts all remaining digits to subscripts (e.g., `2` → `₂`)

This order ensures that oxidation state digits are converted to superscripts, not subscripts.

## Testing

The utility includes comprehensive test coverage:

- ✅ Basic subscript formatting (CuFe₂O₄, H₂O, Fe₃O₄)
- ✅ Oxidation state formatting (Cu²⁺, Fe³⁺, O²⁻)
- ✅ Complex formulas with parentheses (Ca₁₀(PO₄)₆(OH)₂)
- ✅ All digits 0-9
- ✅ Edge cases (empty strings, formulas without digits)
- ✅ Text with multiple formulas

To run verification:

```bash
node src/utils/chemicalFormula.verify.js
```

## Browser Compatibility

Unicode subscript and superscript characters are supported in all modern browsers:

- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (all versions)
- ✅ Opera (all versions)

## Requirements Validation

This utility satisfies the following requirements from the Scientific Accuracy Improvements spec:

- **Requirement 1.1**: Display CuFe₂O₄ with proper subscript formatting throughout all user interfaces
- **Requirement 8.8**: Use proper oxidation state notation: Cu²⁺ and Fe³⁺ (not Cu2+ or Fe3+)

## Related Files

- `src/utils/chemicalFormula.ts` - Main implementation
- `src/utils/chemicalFormula.test.ts` - Unit tests (Vitest)
- `src/utils/chemicalFormula.verify.js` - Verification script (Node.js)
- `src/utils/chemicalFormula.example.ts` - Usage examples
- `src/utils/chemicalFormula.README.md` - This documentation

## Future Enhancements

Potential future improvements:

- Support for Greek letters (α, β, γ, etc.)
- Support for isotope notation (¹²C, ¹⁴N, etc.)
- Support for electron configuration notation
- Support for chemical equations with arrows
- HTML/JSX rendering option for better browser compatibility

## License

Part of the DIFARYX application. See main project LICENSE for details.
