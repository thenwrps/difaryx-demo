import React from 'react';

/**
 * Formats chemical formulas with proper subscripts and superscripts
 * 
 * Examples:
 * - CuFe2O4 → CuFe₂O₄
 * - Fe2(SO4)3 → Fe₂(SO₄)₃
 * - Fe3+ → Fe³⁺
 * - SO4^2- → SO₄²⁻
 * - Fe3O4(s) → Fe₃O₄(s)
 */
export function formatChemicalFormula(input: string): React.ReactNode {
  if (!input) return input;

  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < input.length) {
    // Handle charge notation: Fe3+ or SO4^2-
    const chargeMatch = input.slice(i).match(/^(\^?)(\d+)([+-])/);
    if (chargeMatch) {
      const [full, caret, number, sign] = chargeMatch;
      parts.push(
        <sup key={key++}>
          {number}
          {sign}
        </sup>
      );
      i += full.length;
      continue;
    }

    // Handle parentheses with subscript: (SO4)3
    const parenMatch = input.slice(i).match(/^\(([^)]+)\)(\d+)/);
    if (parenMatch) {
      const [full, content, subscript] = parenMatch;
      parts.push('(');
      parts.push(formatChemicalFormula(content));
      parts.push(')');
      parts.push(<sub key={key++}>{subscript}</sub>);
      i += full.length;
      continue;
    }

    // Handle phase labels: (s), (l), (g), (aq)
    const phaseMatch = input.slice(i).match(/^\((s|l|g|aq)\)/);
    if (phaseMatch) {
      parts.push(phaseMatch[0]);
      i += phaseMatch[0].length;
      continue;
    }

    // Handle regular subscripts: numbers after letters
    const subscriptMatch = input.slice(i).match(/^([A-Z][a-z]?)(\d+)/);
    if (subscriptMatch) {
      const [full, element, number] = subscriptMatch;
      parts.push(element);
      parts.push(<sub key={key++}>{number}</sub>);
      i += full.length;
      continue;
    }

    // Handle single character or element
    const elementMatch = input.slice(i).match(/^[A-Z][a-z]?/);
    if (elementMatch) {
      parts.push(elementMatch[0]);
      i += elementMatch[0].length;
      continue;
    }

    // Handle any other character
    parts.push(input[i]);
    i++;
  }

  return <>{parts}</>;
}
